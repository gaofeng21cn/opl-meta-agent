import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  buildFixtureStageDecompositionCloseout,
  materializeStageDecompositionPackDraft,
  validateStageDecompositionCloseoutPacket,
} from '../scripts/lib/stage-decomposition-pack-draft.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targetAgent = {
  domain_id: 'research-workbench-agent',
  domain_label: 'Research Workbench Agent',
  delivery_domain: 'research_workbench',
  target_brief: 'Create an owner-gated research workbench agent from declared workspace refs.',
};

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stageById(stageControl: JsonObject, stageId: string): JsonObject {
  const stage = (stageControl.stages as JsonObject[]).find((entry) => entry.stage_id === stageId);
  assert.ok(stage, `expected ${stageId} in stage_control_plane`);
  return stage;
}

test('materializer writes the target stage pack from typed stage-decomposition closeout', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-stage-materializer-'));
  try {
    const targetAgentDir = path.join(outputRoot, targetAgent.domain_id);
    const packet = buildFixtureStageDecompositionCloseout({
      targetAgent,
      stageId: 'evidence-synthesis-plan',
      actionId: 'plan-evidence-synthesis',
      title: 'Evidence Synthesis Plan',
      promptPath: 'agent/prompts/evidence-synthesis-plan.md',
      stagePath: 'agent/stages/evidence-synthesis-plan.md',
      skillPath: 'agent/skills/evidence-synthesis-domain-skill.md',
      knowledgePath: 'agent/knowledge/evidence-synthesis-boundary.md',
      qualityGatePath: 'agent/quality_gates/evidence-synthesis-plan-gate.md',
    });

    const draft = validateStageDecompositionCloseoutPacket(packet, { targetAgent });
    assert.equal(packet.user_stage_log.stage_name, 'Stage decomposition pack draft');
    assert.deepEqual(packet.user_stage_log.changed_stage_surfaces, [
      'action_catalog',
      'stage_control_plane',
      'agent/prompts',
      'agent/stages',
      'agent/skills',
      'agent/knowledge',
      'agent/quality_gates',
    ]);
    materializeStageDecompositionPackDraft(targetAgentDir, draft);

    const actionCatalog = readJson(path.join(targetAgentDir, 'contracts/action_catalog.json'));
    const stageControl = readJson(path.join(targetAgentDir, 'contracts/stage_control_plane.json'));
    const foundrySeries = readJson(path.join(targetAgentDir, 'contracts/foundry_agent_series.json'));
    const stage = stageById(stageControl, 'evidence-synthesis-plan');

    assert.equal(actionCatalog.actions[0].action_id, 'plan-evidence-synthesis');
    assert.deepEqual(foundrySeries.shared_policy_release, {
      policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
      policy_bundle_fingerprint: 'sha256:5d77102e99e6e49acd88714cd94dcafe0969b8f2a5529928d753002ac3d4619d',
      fingerprint_algorithm: 'sha256:stable-json',
      domain_contract_policy_release_pin_required: true,
      domain_adapter_must_not_copy_policy_body_as_authority: true,
      consumer_alignment_check: 'foundry:policy-release',
    });
    assert.equal(stageControl.stage_pack_conformance_version, 'standard-stage-pack.v2');
    assert.equal(stage.goal, targetAgent.target_brief);
    assert.deepEqual(stage.allowed_action_refs, ['plan-evidence-synthesis']);
    assert.deepEqual(stage.selected_executor, {
      executor_kind: 'codex_cli',
      default_executor: true,
      executor_binding_ref: 'default_codex_cli',
    });
    assert.equal(stage.independent_gate_policy.gate_ref, 'agent/quality_gates/evidence-synthesis-plan-gate.md');
    assert.equal(stage.independent_gate_policy.execution_review_separation_required, true);
    assert.equal(stage.independent_gate_policy.mechanical_completion_can_close_stage, false);
    assert.equal(stage.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(stage.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.ok(stage.stage_contract.requires.includes('runtime-ref:stage-progress-log-user-stage-log'));
    assert.ok(stage.stage_contract.ensures.includes('stage-user-log-ref:evidence-synthesis-plan'));
    assert.deepEqual(
      stage.stage_contract.user_stage_log_contract.required_domain_semantic_fields,
      [
        'stage_name',
        'problem_summary',
        'stage_goal',
        'stage_work_done',
        'changed_stage_surfaces',
        'outcome',
        'remaining_blockers',
        'evidence_refs',
      ],
    );
    assert.equal(
      stage.stage_contract.progress_delta_policy.surface_kind,
      'opl_stage_progress_delta_policy',
    );
    assert.deepEqual(
      stage.stage_contract.progress_delta_policy.required_fields,
      [
        'progress_delta_classification',
        'deliverable_progress_delta',
        'platform_repair_delta',
        'next_forced_delta',
      ],
    );
    assert.equal(
      stage.stage_contract.progress_delta_policy.deliverable_delta_aliases.target_agent_progress,
      'deliverable_progress_delta',
    );
    assert.equal(
      stage.stage_contract.progress_delta_policy.platform_delta_aliases.platform_interface_repair,
      'platform_repair_delta',
    );
    assert.equal(stage.stage_contract.progress_delta_policy.platform_only_is_not_deliverable_progress, true);
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.surface_kind,
      'family-stall-lineage.v1',
    );
    assert.ok(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('next_forced_delta'),
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.repeat_budget.mechanism_repair_after_repeat_count,
      2,
    );
    assert.equal(foundrySeries.series_design_profile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
    assert.deepEqual(foundrySeries.series_design_profile.stage_pack_sections, [
      'prompts',
      'stages',
      'skills',
      'knowledge',
      'quality_gates',
    ]);
    assert.equal(foundrySeries.series_design_profile.shared_closeout_contract.provider_completion_is_closeout, false);
    assert.equal(foundrySeries.series_design_profile.authority_invariants.opl_can_write_domain_truth, false);

    [
      'agent/prompts/evidence-synthesis-plan.md',
      'agent/stages/evidence-synthesis-plan.md',
      'agent/skills/evidence-synthesis-domain-skill.md',
      'agent/knowledge/evidence-synthesis-boundary.md',
      'agent/quality_gates/evidence-synthesis-plan-gate.md',
    ].forEach((relativePath) => {
      const body = fs.readFileSync(path.join(targetAgentDir, relativePath), 'utf8');
      assert.ok(body.trim().length > 0, `${relativePath} should not be empty`);
    });
    assert.match(
      fs.readFileSync(path.join(targetAgentDir, 'agent/quality_gates/evidence-synthesis-plan-gate.md'), 'utf8'),
      /Quality gate declaration is required/i,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('stage-decomposition closeout validator fails closed on free text and partial packs', () => {
  assert.throws(
    () => validateStageDecompositionCloseoutPacket('stage graph: draft then review', { targetAgent }),
    /typed JSON object/i,
  );
  assert.throws(
    () => validateStageDecompositionCloseoutPacket({
      surface_kind: 'stage_attempt_closeout_packet',
      stage_id: 'stage-decomposition',
      closeout_refs: ['receipt:partial'],
    }, { targetAgent }),
    /stage_decomposition_pack_draft/i,
  );

  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  delete stage.independent_gate_policy;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /independent_gate_policy/i,
  );
});

test('stage-decomposition closeout validator rejects missing gate declarations and self-review', () => {
  const missingGatePacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const missingGateDraft = missingGatePacket.stage_decomposition_pack_draft as JsonObject;
  const files = missingGateDraft.files as JsonObject[];
  const gateFile = files.find((entry) => entry.path === 'agent/quality_gates/agent-output-draft-quality-gate.md');
  assert.ok(gateFile);
  gateFile.body = '# Gate\n\nLooks acceptable.\n';
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(missingGatePacket, { targetAgent }),
    /quality gate declaration/i,
  );

  const selfReviewPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const selfReviewDraft = selfReviewPacket.stage_decomposition_pack_draft as JsonObject;
  const selfReviewStage = ((selfReviewDraft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  selfReviewStage.independent_gate_policy.execution_review_separation_required = false;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(selfReviewPacket, { targetAgent }),
    /self-review|execution_review_separation_required/i,
  );

  const missingUserLogPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const missingUserLogDraft = missingUserLogPacket.stage_decomposition_pack_draft as JsonObject;
  const missingUserLogStage = ((missingUserLogDraft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  delete missingUserLogStage.stage_contract.user_stage_log_contract;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(missingUserLogPacket, { targetAgent }),
    /user_stage_log_contract/i,
  );
});

test('build-agent-baseline consumes supplied fixture closeout instead of scripting a fixed stage graph', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-closeout-'));
  try {
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    fs.writeFileSync(reviewerEvaluationPath, `${JSON.stringify({
      reviewer_kind: 'ai_reviewer',
      model_or_provider: 'gpt-5.5',
      run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
      review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      no_shared_context: true,
      independent_attempt: true,
      critique: 'The baseline has explicit evidence and owner handoff refs.',
      suggestions: ['Keep source coverage evidence explicit.'],
      source_refs: ['review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer'],
      direct_evidence_refs: ['artifact-ref:research-workbench-agent/package'],
      verdict: 'baseline_ready_with_owner_gate',
      predicted_impact: 'Owner-gated baseline can be evaluated without granting OPL target authority.',
      provenance: {
        artifact_ref: 'artifact-ref:ai-reviewer/research-workbench-agent-baseline',
        reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
        created_by: 'test-fixture',
      },
    }, null, 2)}\n`);
    const closeoutPath = path.join(outputRoot, 'stage-decomposition-closeout.json');
    fs.writeFileSync(closeoutPath, `${JSON.stringify(buildFixtureStageDecompositionCloseout({
      targetAgent,
      stageId: 'research-question-intake',
      actionId: 'capture-research-question',
      title: 'Research Question Intake',
      promptPath: 'agent/prompts/research-question-intake.md',
      stagePath: 'agent/stages/research-question-intake.md',
      skillPath: 'agent/skills/research-question-intake-skill.md',
      knowledgePath: 'agent/knowledge/research-question-intake-boundary.md',
      qualityGatePath: 'agent/quality_gates/research-question-intake-gate.md',
    }), null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--stage-runner',
        'fixture',
        '--stage-closeout-packet',
        closeoutPath,
        '--opl-bin',
        process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        targetAgent.domain_id,
        '--domain-label',
        targetAgent.domain_label,
        '--delivery-domain',
        targetAgent.delivery_domain,
        '--target-brief',
        targetAgent.target_brief,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const stageControl = readJson(path.join(outputRoot, targetAgent.domain_id, 'contracts/stage_control_plane.json'));
    stageById(stageControl, 'research-question-intake');
    assert.equal(
      (stageControl.stages as JsonObject[]).some((stage) => stage.stage_id === 'agent-output-draft'),
      false,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline rejects implicit fixture closeout materialization', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-implicit-fixture-'));
  try {
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    fs.writeFileSync(reviewerEvaluationPath, `${JSON.stringify({
      reviewer_kind: 'ai_reviewer',
      model_or_provider: 'gpt-5.5',
      run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
      review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      no_shared_context: true,
      independent_attempt: true,
      critique: 'The implicit fixture path should fail before materialization.',
      suggestions: ['Require an explicit typed closeout fixture file for deterministic tests.'],
      source_refs: ['review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer'],
      direct_evidence_refs: ['artifact-ref:research-workbench-agent/package'],
      verdict: 'blocked',
      predicted_impact: 'Implicit fixture smoke can no longer create an unstated stage graph.',
      provenance: {
        artifact_ref: 'artifact-ref:ai-reviewer/research-workbench-agent-baseline',
        reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
        created_by: 'test-fixture',
      },
    }, null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--stage-runner',
        'fixture',
        '--opl-bin',
        process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        targetAgent.domain_id,
        '--domain-label',
        targetAgent.domain_label,
        '--delivery-domain',
        targetAgent.delivery_domain,
        '--target-brief',
        targetAgent.target_brief,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /fixture runner only consumes an explicit typed closeout packet/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline writes a typed blocker when stage-decomposition closeout is invalid', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-closeout-blocker-'));
  try {
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    fs.writeFileSync(reviewerEvaluationPath, `${JSON.stringify({
      reviewer_kind: 'ai_reviewer',
      model_or_provider: 'gpt-5.5',
      run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
      review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      no_shared_context: true,
      independent_attempt: true,
      critique: 'The invalid closeout should block before baseline receipt signing.',
      suggestions: ['Return a typed blocker and keep the target package unsigned.'],
      source_refs: ['review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer'],
      direct_evidence_refs: ['artifact-ref:research-workbench-agent/package'],
      verdict: 'blocked',
      predicted_impact: 'Invalid stage decomposition cannot be materialized.',
      provenance: {
        artifact_ref: 'artifact-ref:ai-reviewer/research-workbench-agent-baseline',
        reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
        created_by: 'test-fixture',
      },
    }, null, 2)}\n`);
    const closeoutPath = path.join(outputRoot, 'invalid-stage-decomposition-closeout.json');
    fs.writeFileSync(closeoutPath, `${JSON.stringify({
      surface_kind: 'stage_attempt_closeout_packet',
      stage_id: 'stage-decomposition',
      closeout_refs: ['receipt:partial'],
    }, null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--stage-runner',
        'fixture',
        '--stage-closeout-packet',
        closeoutPath,
        '--opl-bin',
        process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        targetAgent.domain_id,
        '--domain-label',
        targetAgent.domain_label,
        '--delivery-domain',
        targetAgent.delivery_domain,
        '--target-brief',
        targetAgent.target_brief,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    const blockerPath = path.join(outputRoot, `${targetAgent.domain_id}-stage-decomposition-blocker.json`);
    assert.equal(fs.existsSync(blockerPath), true, result.stderr);
    const blocker = readJson(blockerPath);
    assert.equal(blocker.surface_kind, 'stage_attempt_closeout_packet');
    assert.equal(blocker.stage_id, 'stage-decomposition');
    assert.equal(blocker.blocked_reason, 'stage_decomposition_materialization_failed');
    assert.equal(blocker.route_impact.baseline_receipt_signed, false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

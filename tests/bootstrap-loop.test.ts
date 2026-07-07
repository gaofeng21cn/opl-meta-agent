import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { readJsonFile as readJson, repoRoot } from './support/contracts.ts';
import {
  parseBuildAgentBaselineArgs,
  runBuildAgentBaseline,
} from '../scripts/build-agent-baseline.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft-parts/builder.ts';

function runBaselineArgs(args: string[]): JsonObject {
  return runBuildAgentBaseline(parseBuildAgentBaselineArgs(args));
}

function reviewerMorphologySourceRefs(domainId: string, stageId = 'agent-output-draft'): string[] {
  return [
    `artifact-morphology-ref:${domainId}`,
    `artifact-native-source-format-ref:${domainId}/${stageId}`,
    `artifact-shard-unit-ref:${domainId}/${stageId}`,
    `target-extent-contract-ref:${domainId}/${stageId}`,
    `asset-custody-ref:${domainId}/${stageId}`,
  ];
}

function reviewerMorphologyDirectEvidenceRefs(domainId: string, stageId = 'agent-output-draft'): string[] {
  return [
    `artifact-ref:${domainId}/contracts/artifact_morphology_contract.json`,
    `morphology-evidence-ref:${domainId}/${stageId}/realistic-target-task-review`,
  ];
}

function assertGeneratedTargetStagePack(
  targetDir: string,
  stageControl: JsonObject,
  {
    stageId,
    actionRef,
  }: {
    stageId: string;
    actionRef: string;
  },
): void {
  const stage = (stageControl.stages as JsonObject[]).find((entry) => entry.stage_id === stageId);
  assert.ok(stage, `${stageId} should exist in generated stage control plane`);
  const refSpecs = [
    { field: 'prompt_refs', refKind: 'domain_prompt_ref', prefix: 'agent/prompts/' },
    { field: 'skills', refKind: 'domain_skill_ref', prefix: 'agent/skills/' },
    { field: 'knowledge_refs', refKind: 'domain_knowledge_ref', prefix: 'agent/knowledge/' },
    { field: 'evaluation', refKind: 'domain_quality_gate_ref', prefix: 'agent/quality_gates/' },
  ];
  refSpecs.forEach((spec) => {
    const refs = stage[spec.field] as JsonObject[];
    assert.ok(Array.isArray(refs), `${stageId}.${spec.field} should be an array`);
    assert.ok(refs.length > 0, `${stageId}.${spec.field} should not be empty`);
    refs.forEach((entry) => {
      assert.equal(entry.ref_kind, spec.refKind, `${stageId}.${spec.field}.ref_kind`);
      assert.ok(
        String(entry.ref).startsWith(spec.prefix),
        `${stageId}.${spec.field}.ref should live under ${spec.prefix}`,
      );
      const filePath = path.join(targetDir, String(entry.ref));
      assert.equal(fs.existsSync(filePath), true, `${entry.ref} should exist`);
      const body = fs.readFileSync(filePath, 'utf8');
      assert.ok(body.trim().length > 0, `${entry.ref} should not be empty`);
      assert.equal(new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i').test(body), false);
      if (spec.field === 'evaluation') {
        assert.match(body, /quality gate declaration is required/i);
        assert.match(body, /Dedicated review stage is conditional/i);
      }
    });
  });

  assert.deepEqual(stage.selected_executor, {
    executor_kind: 'codex_cli',
    default_executor: true,
    executor_binding_ref: 'default_codex_cli',
  });
  assert.equal(stage.independent_gate_policy.gate_owner, stageControl.owner);
  assert.ok(
    (stage.evaluation as JsonObject[])
      .some((entry) => entry.ref === stage.independent_gate_policy.gate_ref),
    `${stageId}.independent_gate_policy.gate_ref should point at a declared quality gate file`,
  );
  assert.equal(stage.independent_gate_policy.execution_review_separation_required, true);
  assert.equal(stage.independent_gate_policy.mechanical_completion_can_close_stage, false);
  assert.equal(stage.independent_gate_policy.provider_completion_can_claim_domain_ready, false);
  assert.equal(
    stage.independent_gate_policy.generated_surface_readiness_can_claim_quality_or_export,
    false,
  );

  const requires = stage.stage_contract.requires as string[];
  const ensures = stage.stage_contract.ensures as string[];
  assert.ok(requires.includes(`action-ref:${actionRef}`), `${stageId}.requires action ref`);
  (stage.prompt_refs as JsonObject[]).forEach((entry) => {
    assert.ok(requires.includes(`prompt-ref:${entry.ref}`), `${stageId}.requires ${entry.ref}`);
  });
  (stage.skills as JsonObject[]).forEach((entry) => {
    assert.ok(requires.includes(`skill-ref:${entry.ref}`), `${stageId}.requires ${entry.ref}`);
  });
  (stage.knowledge_refs as JsonObject[]).forEach((entry) => {
    assert.ok(requires.includes(`knowledge-ref:${entry.ref}`), `${stageId}.requires ${entry.ref}`);
  });
  (stage.evaluation as JsonObject[]).forEach((entry) => {
    assert.ok(requires.includes(`quality-gate-ref:${entry.ref}`), `${stageId}.requires ${entry.ref}`);
  });
  assert.ok(ensures.includes(`stage-attempt-receipt-ref:${stageId}`), `${stageId}.ensures stage receipt`);
  assert.ok(ensures.includes(`executor-receipt-ref:${stageId}/codex-cli`), `${stageId}.ensures executor receipt`);
  assert.ok(ensures.includes(`independent-gate-receipt-ref:${stageId}`), `${stageId}.ensures gate receipt`);
  assert.ok(
    (stage.stage_contract.expected_receipt_refs as JsonObject[])
      .some((entry) => entry.ref === `independent-gate-receipt-ref:${stageId}`),
    `${stageId}.expected_receipt_refs independent gate`,
  );
}

function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const domainId = typeof overrides.domain_id === 'string'
    ? overrides.domain_id
    : 'baseline-fixture-agent';
  const stageId = typeof overrides.stage_id === 'string'
    ? overrides.stage_id
    : 'agent-output-draft';
  const {
    domain_id: _domainId,
    stage_id: _stageId,
    ...evaluationOverrides
  } = overrides;
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/opl-meta-agent/baseline-fixture-agent/baseline',
    execution_attempt_ref: 'attempt:executor/opl-meta-agent/baseline-fixture-agent/baseline',
    review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/baseline-fixture-agent/baseline',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The baseline is structurally valid but needs explicit source coverage and operator handoff evidence.',
    suggestions: [
      'Add source coverage checks to the baseline delivery scorecard.',
      'Require operator handoff evidence before signing the baseline receipt.',
    ],
    source_refs: [
      'review-ref:opl-meta-agent/baseline-fixture-agent/ai-reviewer',
      'evidence-ref:baseline-fixture-agent/scaffold-validation',
      'scorecard-ref:opl-meta-agent/baseline-acceptance',
      ...reviewerMorphologySourceRefs(domainId, stageId),
    ],
    direct_evidence_refs: [
      'artifact-ref:baseline-fixture-agent/package',
      'receipt-ref:opl-meta-agent/baseline-delivery',
      ...reviewerMorphologyDirectEvidenceRefs(domainId, stageId),
    ],
    verdict: 'baseline_ready_with_owner_gate',
    predicted_impact: 'The baseline should remain owner-gated while making source coverage and operator handoff evidence auditable.',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/baseline-fixture-agent-baseline',
      reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
      created_by: 'test-fixture',
    },
    ...evaluationOverrides,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evaluation, null, 2)}\n`);
  return evaluation;
}

function writeStageCloseout(filePath: string, targetAgent: {
  domain_id: string;
  domain_label: string;
  delivery_domain: string;
  target_brief: string;
}): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(buildFixtureStageDecompositionCloseout({ targetAgent }), null, 2)}\n`);
}

test('opl-meta-agent bootstraps an explicit target agent and validates it through OPL Agent Lab', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  const stageCloseoutPath = path.join(outputRoot, 'stage-decomposition-closeout.json');
  const targetAgent = {
    domain_id: 'baseline-fixture-agent',
    domain_label: 'Baseline Fixture Agent',
    delivery_domain: 'baseline_fixture',
    target_brief: 'Create an owner-gated baseline fixture agent for build-agent-baseline verification.',
  };
  const reviewerEvaluation = writeAiReviewerEvaluation(reviewerEvaluationPath);
  writeStageCloseout(stageCloseoutPath, targetAgent);
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const payload = runBaselineArgs([
      '--output-dir',
      outputRoot,
      '--opl-bin',
      oplBin,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--stage-runner',
      'fixture',
      '--stage-decomposition-closeout',
      stageCloseoutPath,
      '--domain-id',
      targetAgent.domain_id,
      '--domain-label',
      targetAgent.domain_label,
      '--delivery-domain',
      targetAgent.delivery_domain,
      '--target-brief',
      targetAgent.target_brief,
    ]);

    assert.equal(payload.surface_kind, 'opl_meta_agent_self_learning_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.product_id, 'opl-meta-agent');
    assert.equal(payload.meta_agent_kind, 'opl_compatible_meta_agent');
    assert.equal(payload.target_agent.domain_id, 'baseline-fixture-agent');
    assert.equal(payload.target_agent.generated_interface_status, 'ready');
    assert.equal(payload.opl_generated_interfaces.surface_kind, 'opl_generated_agent_interface_bundle');
    assert.equal(payload.opl_generated_interfaces.owner, 'one-person-lab');
    assert.equal(payload.opl_generated_interfaces.domain_repo_can_own_generated_surface, false);
    assert.equal(payload.opl_generated_interfaces.cli.descriptors[0].action_id, 'draft-agent-output');
    assert.equal(payload.opl_generated_interfaces.mcp.descriptors[0].descriptor_only, true);
    assert.equal(payload.opl_generated_interfaces.skill.descriptors[0].command_contract_id, 'baseline-fixture-agent.draft-agent-output');
    assert.equal(payload.opl_generated_interfaces.product_entry.descriptors[0].action_key, 'draft-agent-output');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.deepEqual(payload.opl_agent_lab.suite_result.refs.stage_completion_policy_refs, [
      'stage-completion-policy:opl-meta-agent/baseline-fixture-agent/agent_building_baseline',
    ]);
    assert.equal(payload.learning_loop.online_learning_policy.can_promote_without_gate, false);
    assert.equal(payload.learning_loop.online_learning_policy.can_train_or_deploy_model_weights, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.status, 'proposal_recorded_requires_explicit_gate');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.observe.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.diagnose.evidence_delta_ref, 'evidence-delta:opl-meta-agent/baseline-fixture-agent/baseline');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.edit.next_mechanism_candidate_ref, payload.learning_loop.online_learning_candidate.candidate_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_promote_default_agent_without_gate, false);
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.deepEqual(payload.learning_loop.baseline_receipt.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.deepEqual(payload.learning_loop.baseline_receipt.ai_reviewer_evidence.source_refs, reviewerEvaluation.source_refs);
    assert.deepEqual(
      payload.learning_loop.baseline_receipt.ai_reviewer_evidence.direct_evidence_refs,
      reviewerEvaluation.direct_evidence_refs,
    );
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_independence.no_shared_context, true);
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_independence.independent_attempt, true);
    assert.equal(
      payload.learning_loop.baseline_receipt.ai_reviewer_independence.execution_attempt_ref,
      reviewerEvaluation.execution_attempt_ref,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.ai_reviewer_independence.review_attempt_ref,
      reviewerEvaluation.review_attempt_ref,
    );
    assert.notEqual(
      payload.learning_loop.baseline_receipt.ai_reviewer_independence.execution_attempt_ref,
      payload.learning_loop.baseline_receipt.ai_reviewer_independence.review_attempt_ref,
    );
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_scorecard.verdict, reviewerEvaluation.verdict);
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_critique_present,
      true,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_suggestions_present,
      true,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_source_refs_valid,
      true,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_provenance_present,
      true,
    );
    assert.equal(payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_no_shared_context, true);
    assert.equal(payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_independent_attempt_present, true);
    assert.equal(payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_attempt_refs_distinct, true);
    assert.equal(payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_direct_evidence_refs_present, true);

    const targetDir = path.join(outputRoot, 'baseline-fixture-agent');
    const stagePacketPath = path.join(outputRoot, 'stage-decomposition-attempt-input.json');
    const suitePath = path.join(outputRoot, 'agent-lab-suite.json');
    const receiptPath = path.join(outputRoot, 'baseline-delivery-receipt.json');
    const learningPath = path.join(outputRoot, 'online-learning-candidate.json');
    const mechanismPath = path.join(outputRoot, 'mechanism-patch-proposal.json');
    const realTargetReceiptPath = path.join(outputRoot, 'real-target-delivery-receipt.json');
    const realTargetLedgerPath = path.join(outputRoot, 'real-target-scaleout-evidence-ledger.json');
    const fixturePath = path.join(
      targetDir,
      'contracts',
      'production_acceptance',
      'morphology_conformance_fixture.json',
    );
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/domain_descriptor.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/action_catalog.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), true);
    assert.equal(fs.existsSync(fixturePath), true);
    assert.equal(fs.existsSync(suitePath), true);
    assert.equal(fs.existsSync(receiptPath), true);
    assert.equal(fs.existsSync(learningPath), true);
    assert.equal(fs.existsSync(mechanismPath), true);
    assert.equal(fs.existsSync(realTargetReceiptPath), true);
    assert.equal(fs.existsSync(realTargetLedgerPath), true);

    const fixture = readJson(fixturePath);
    const stagePacket = readJson(stagePacketPath);
    const stageControl = readJson(path.join(targetDir, 'contracts', 'stage_control_plane.json'));
    assertGeneratedTargetStagePack(targetDir, stageControl, {
      stageId: 'agent-output-draft',
      actionRef: 'draft-agent-output',
    });
    assert.ok(
      (stagePacket.required_closeout.required_pack_sections as string[])
        .includes('artifact_morphology_contract'),
    );
    assert.ok(
      (stagePacket.required_closeout.required_stage_fields as string[])
        .includes('stage_contract.artifact_morphology_contract'),
    );
    assert.ok(
      (stagePacket.required_closeout.required_stage_fields as string[])
        .includes('stage_contract.artifact_morphology_refs'),
    );
    assert.deepEqual(stagePacket.required_closeout.required_artifact_morphology_contract, {
      native_source_policy_required: true,
      artifact_body_policy_required: true,
      sharding_policy_required: true,
      target_extent_policy_required: true,
      asset_custody_policy_required: true,
      realistic_task_review_policy_required: true,
      creative_source_must_not_be_generator_code: true,
      silent_extent_downgrade_forbidden: true,
    });

    assert.equal(fixture.surface_kind, 'generated_agent_morphology_conformance_fixture');
    assert.equal(fixture.domain_id, 'baseline-fixture-agent');
    assert.equal(fixture.fixture_status, 'required_by_default_generated_agent');
    assert.equal(fixture.canonical_semantic_pack_root, 'agent/');
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/domain-pack-files-present'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/stage-action-contracts-present'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/OPL-generated-interface-owner'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/no-target-domain-truth-write'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/no-default-promotion-without-gate'));
    assert.equal(fixture.authority_boundary.refs_only, true);
    assert.equal(fixture.authority_boundary.generated_interface_owner, 'one-person-lab');
    assert.equal(fixture.authority_boundary.domain_repo_can_own_generated_surface, false);
    assert.equal(fixture.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(fixture.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(fixture.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(fixture.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(fixture.authority_boundary.can_promote_default_agent_without_gate, false);

    const suite = readJson(suitePath);
    assert.equal(suite.suite_id, 'opl-meta-agent-baseline-suite:baseline-fixture-agent');
    assert.equal(suite.tasks[0].domain_id, 'opl-meta-agent');
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(reviewerEvaluationPath));
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(reviewerEvaluation.direct_evidence_refs[0]));
    assert.ok(suite.tasks[0].scorecard.review_refs.includes(reviewerEvaluationPath));
    assert.deepEqual(suite.tasks[0].ai_reviewer_evaluation.source_refs, reviewerEvaluation.source_refs);

    const receipt = readJson(receiptPath);
    assert.equal(receipt.receipt_class, 'baseline_delivery_receipt');
    assert.equal(receipt.target_agent.domain_id, 'baseline-fixture-agent');
    assert.equal(receipt.agent_lab_result_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(receipt.status, 'baseline_delivered');
    assert.equal(receipt.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.equal(receipt.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.deepEqual(receipt.ai_reviewer_independence.direct_evidence_refs, reviewerEvaluation.direct_evidence_refs);

    const learning = readJson(learningPath);
    assert.equal(learning.candidate_kind, 'rubric_gap');
    assert.deepEqual(learning.source_refs, [
      payload.opl_agent_lab.suite_result.result_id,
      receipt.receipt_id,
    ]);

    const mechanism = readJson(mechanismPath);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/baseline-fixture-agent/self-learning-loop');
    assert.equal(mechanism.version, 'opl-meta-agent.mechanism-patch-proposal.v1');
    assert.ok(mechanism.editable_surfaces.includes('prompt_policy_ref'));
    assert.ok(mechanism.editable_surfaces.includes('quality_gate_policy_ref'));
    assert.equal(mechanism.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/baseline-fixture-agent/baseline');
    assert.equal(mechanism.next_mechanism_candidate_ref, learning.candidate_id);

    const realTargetReceipt = readJson(realTargetReceiptPath);
    assert.equal(realTargetReceipt.surface_kind, 'opl_meta_agent_real_target_agent_delivery_receipt');
    assert.equal(realTargetReceipt.receipt_class, 'real_target_agent_delivery_receipt');
    assert.equal(realTargetReceipt.evidence_class, 'real_target_agent_delivery');
    assert.equal(realTargetReceipt.status, 'real_target_delivery_evidence_recorded');
    assert.equal(realTargetReceipt.target_agent.domain_id, 'baseline-fixture-agent');
    assert.equal(realTargetReceipt.target_agent.domain_id, payload.target_agent.domain_id);
    assert.equal(realTargetReceipt.baseline_source.source_kind, 'explicit_target_agent_baseline');
    assert.equal(realTargetReceipt.baseline_source.target_agent_ref, 'domain-agent:baseline-fixture-agent');
    assert.equal(realTargetReceipt.baseline_source.baseline_receipt_ref, receipt.receipt_id);
    assert.equal(realTargetReceipt.baseline_source.implicit_fixture_smoke_retired, true);
    assert.equal(realTargetReceipt.owner_receipt_refs.length, 1);
    assert.equal(realTargetReceipt.owner_receipt_refs[0], realTargetReceipt.baseline_delivery_receipt_ref);
    assert.ok(realTargetReceipt.owner_receipt_refs[0].startsWith('oma_receipt_'));
    assert.equal(realTargetReceipt.agent_lab_result_ref, payload.real_target_delivery.agent_lab_run.suite_result.result_id);
    assert.deepEqual(realTargetReceipt.no_forbidden_write_proof_refs, [
      'no-forbidden-write:opl-meta-agent/baseline-fixture-agent/real_target_delivery',
    ]);
    assert.deepEqual(realTargetReceipt.promotion_gate_refs, [
      'promotion-gate:opl-meta-agent/baseline-fixture-agent',
    ]);
    assert.equal(realTargetReceipt.authority_boundary.refs_only, true);
    assert.equal(realTargetReceipt.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(realTargetReceipt.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(realTargetReceipt.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(realTargetReceipt.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(realTargetReceipt.target_truth, undefined);
    assert.equal(realTargetReceipt.memory_body, undefined);
    assert.equal(realTargetReceipt.artifact_body, undefined);

    const scaleoutLedger = readJson(realTargetLedgerPath);
    assert.equal(scaleoutLedger.surface_kind, 'opl_meta_agent_real_target_agent_scaleout_evidence_ledger');
    assert.equal(scaleoutLedger.evidence_status, 'real_target_delivery_minimum_met_scaleout_pending');
    assert.equal(scaleoutLedger.real_target_agent_delivery_count_min, 1);
    assert.equal(scaleoutLedger.real_target_agent_delivery_count, 1);
    assert.equal(scaleoutLedger.minimum_completion_gate.real_target_agent_delivery_count_met, true);
    assert.equal(scaleoutLedger.minimum_completion_gate.multi_target_scaleout_delivery_count_met, false);
    assert.deepEqual(scaleoutLedger.target_agent_delivery_receipt_refs, [realTargetReceipt.receipt_id]);
    assert.deepEqual(scaleoutLedger.target_agent_owner_receipt_refs, realTargetReceipt.owner_receipt_refs);
    assert.deepEqual(scaleoutLedger.agent_lab_result_refs, [realTargetReceipt.agent_lab_result_ref]);
    assert.deepEqual(scaleoutLedger.no_forbidden_write_proof_refs, realTargetReceipt.no_forbidden_write_proof_refs);
    assert.deepEqual(scaleoutLedger.promotion_gate_refs, realTargetReceipt.promotion_gate_refs);
    assert.equal(scaleoutLedger.baseline_source.source_kind, 'explicit_target_agent_delivery_receipts');
    assert.equal(scaleoutLedger.baseline_source.implicit_fixture_smoke_retired, true);
    assert.deepEqual(scaleoutLedger.baseline_source.baseline_receipt_refs, [receipt.receipt_id]);
    assert.equal(scaleoutLedger.authority_boundary.refs_only, true);
    assert.equal(scaleoutLedger.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(scaleoutLedger.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(scaleoutLedger.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(scaleoutLedger.target_truth, undefined);
    assert.equal(scaleoutLedger.memory_body, undefined);
    assert.equal(scaleoutLedger.artifact_body, undefined);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline bootstraps a requested target agent from structured skill inputs', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-requested-target-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  const stageCloseoutPath = path.join(outputRoot, 'stage-decomposition-closeout.json');
  const targetBrief = [
    'Create an OPL-compatible research workbench agent.',
    'It should turn a user research question into a scoped plan, evidence ledger, and owner-gated brief.',
    'It must not write target domain truth or promote itself without explicit gates.',
  ].join(' ');
  const targetAgent = {
    domain_id: 'research-workbench-agent',
    domain_label: 'Research Workbench Agent',
    delivery_domain: 'research_workbench',
    target_brief: targetBrief,
  };
  const reviewerEvaluation = writeAiReviewerEvaluation(reviewerEvaluationPath, {
    domain_id: 'research-workbench-agent',
    run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
    execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
    review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
    source_refs: [
      'review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer',
      'evidence-ref:research-workbench-agent/scaffold-validation',
      'scorecard-ref:opl-meta-agent/baseline-acceptance',
      ...reviewerMorphologySourceRefs('research-workbench-agent'),
    ],
    direct_evidence_refs: [
      'artifact-ref:research-workbench-agent/package',
      'receipt-ref:opl-meta-agent/baseline-delivery',
      ...reviewerMorphologyDirectEvidenceRefs('research-workbench-agent'),
    ],
  });
  writeStageCloseout(stageCloseoutPath, targetAgent);
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const payload = runBaselineArgs([
      '--output-dir',
      outputRoot,
      '--opl-bin',
      oplBin,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--stage-runner',
      'fixture',
      '--stage-decomposition-closeout',
      stageCloseoutPath,
      '--domain-id',
      targetAgent.domain_id,
      '--domain-label',
      targetAgent.domain_label,
      '--delivery-domain',
      targetAgent.delivery_domain,
      '--target-brief',
      targetAgent.target_brief,
    ]);
    const targetDir = path.join(outputRoot, 'research-workbench-agent');
    const descriptor = readJson(path.join(targetDir, 'contracts', 'domain_descriptor.json'));
    const actionCatalog = readJson(path.join(targetDir, 'contracts', 'action_catalog.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts', 'stage_control_plane.json'));
    const suite = readJson(path.join(outputRoot, 'agent-lab-suite.json'));
    const receipt = readJson(path.join(outputRoot, 'baseline-delivery-receipt.json'));
    const mechanism = readJson(path.join(outputRoot, 'mechanism-patch-proposal.json'));
    const realTargetReceipt = readJson(path.join(outputRoot, 'real-target-delivery-receipt.json'));
    const scaleoutLedger = readJson(path.join(outputRoot, 'real-target-scaleout-evidence-ledger.json'));

    assert.equal(payload.target_agent.domain_id, 'research-workbench-agent');
    assert.equal(payload.target_agent.domain_label, 'Research Workbench Agent');
    assert.equal(payload.target_agent.delivery_domain, 'research_workbench');
    assert.equal(payload.target_agent.repo_dir, targetDir);
    assert.equal(payload.target_agent.target_brief, targetBrief);
    assert.equal(payload.opl_generated_interfaces.skill.descriptors[0].command_contract_id, 'research-workbench-agent.draft-agent-output');
    assert.equal(payload.opl_generated_interfaces.product_entry.descriptors[0].action_key, 'draft-agent-output');
    assert.equal(payload.real_target_delivery.target_agent.domain_id, 'research-workbench-agent');

    assert.equal(descriptor.domain_id, 'research-workbench-agent');
    assert.equal(descriptor.domain_label, 'Research Workbench Agent');
    assert.equal(descriptor.delivery_domain, 'research_workbench');
    assert.equal(descriptor.target_brief, targetBrief);
    assert.equal(descriptor.authority_boundary.opl_can_write_domain_truth, false);
    assert.equal(descriptor.authority_boundary.opl_can_authorize_quality_or_export, false);

    assert.equal(actionCatalog.target_domain_id, 'research-workbench-agent');
    assert.equal(actionCatalog.actions[0].action_id, 'draft-agent-output');
    assert.equal(actionCatalog.actions[0].summary, 'Draft the owner-gated Research Workbench Agent delivery from declared workspace refs.');
    assert.equal(actionCatalog.actions[0].supported_surfaces.skill.command_contract_id, 'research-workbench-agent.draft-agent-output');
    assert.equal(actionCatalog.actions[0].authority_boundary.can_write_target_domain_truth, false);
    assert.equal(actionCatalog.actions[0].natural_language_intent, targetBrief);

    assert.equal(stageControl.target_domain_id, 'research-workbench-agent');
    assert.equal(stageControl.stages[0].stage_id, 'agent-output-draft');
    assert.equal(stageControl.stages[0].goal, targetBrief);
    assert.deepEqual(stageControl.stages[0].allowed_action_refs, ['draft-agent-output']);
    assertGeneratedTargetStagePack(targetDir, stageControl, {
      stageId: 'agent-output-draft',
      actionRef: 'draft-agent-output',
    });

    assert.equal(suite.suite_id, 'opl-meta-agent-baseline-suite:research-workbench-agent');
    assert.equal(suite.tasks[0].target_agent_ref, 'domain-agent:research-workbench-agent');
    assert.equal(suite.tasks[0].instructions_ref, 'instructions:opl-meta-agent/research-workbench-agent/baseline');
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(reviewerEvaluationPath));
    assert.deepEqual(suite.tasks[0].ai_reviewer_evaluation.direct_evidence_refs, reviewerEvaluation.direct_evidence_refs);

    assert.equal(receipt.receipt_class, 'baseline_delivery_receipt');
    assert.equal(receipt.target_agent.domain_id, 'research-workbench-agent');
    assert.equal(receipt.target_agent.delivery_domain, 'research_workbench');
    assert.equal(receipt.target_agent.target_brief, targetBrief);
    assert.equal(receipt.acceptance_gates.target_agent_brief_declared, true);
    assert.equal(receipt.status, 'baseline_delivered');

    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/research-workbench-agent/self-learning-loop');
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/research-workbench-agent/baseline');
    assert.equal(realTargetReceipt.target_agent.domain_id, 'research-workbench-agent');
    assert.equal(realTargetReceipt.baseline_source.implicit_fixture_smoke_retired, true);
    assert.deepEqual(scaleoutLedger.baseline_source.baseline_receipt_refs, [receipt.receipt_id]);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('baseline delivery rejects AI reviewer evaluation without independent attempt evidence', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-non-independent-reviewer-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  writeAiReviewerEvaluation(reviewerEvaluationPath, {
    no_shared_context: false,
    independent_attempt: false,
    direct_evidence_refs: [],
    execution_attempt_ref: 'attempt:shared/context',
    review_attempt_ref: 'attempt:shared/context',
  });
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        'reviewer-gate-fixture-agent',
        '--domain-label',
        'Reviewer Gate Fixture Agent',
        '--delivery-domain',
        'reviewer_gate_fixture',
        '--target-brief',
        'Create an OPL-compatible reviewer gate fixture agent.',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no_shared_context/i);
    assert.match(result.stderr, /independent_attempt/i);
    assert.match(result.stderr, /direct_evidence_refs/i);
    assert.match(result.stderr, /execution_attempt_ref and review_attempt_ref/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('baseline delivery rejects reviewer evidence without artifact morphology coverage', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-missing-morphology-reviewer-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  const targetAgent = {
    domain_id: 'missing-morphology-fixture-agent',
    domain_label: 'Missing Morphology Fixture Agent',
    delivery_domain: 'reviewer_gate_fixture',
    target_brief: 'Create an OPL-compatible reviewer evidence fixture agent.',
  };
  const stageCloseoutPath = path.join(outputRoot, 'stage-decomposition-closeout.json');
  writeAiReviewerEvaluation(reviewerEvaluationPath, {
    source_refs: [
      'review-ref:opl-meta-agent/missing-morphology-fixture-agent/ai-reviewer',
      'evidence-ref:missing-morphology-fixture-agent/scaffold-validation',
      'scorecard-ref:opl-meta-agent/baseline-acceptance',
    ],
    direct_evidence_refs: [
      'artifact-ref:missing-morphology-fixture-agent/package',
      'receipt-ref:opl-meta-agent/baseline-delivery',
    ],
  });
  writeStageCloseout(stageCloseoutPath, targetAgent);
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--stage-runner',
        'fixture',
        '--stage-decomposition-closeout',
        stageCloseoutPath,
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
    assert.match(result.stderr, /artifact morphology|morphology evidence|morphology coverage/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline requires an explicit target domain id before materialization', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-missing-domain-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  writeAiReviewerEvaluation(reviewerEvaluationPath);
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--domain-id/i);
    assert.match(result.stderr, /explicit target agent/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('baseline delivery fails closed when AI reviewer evaluation is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-missing-reviewer-'));
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ai reviewer evaluation/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('baseline delivery rejects empty AI reviewer critique and suggestions without signing receipt', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-empty-reviewer-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  writeAiReviewerEvaluation(reviewerEvaluationPath, {
    critique: ' ',
    suggestions: [],
  });
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        'empty-reviewer-fixture-agent',
        '--domain-label',
        'Empty Reviewer Fixture Agent',
        '--delivery-domain',
        'reviewer_gate_fixture',
        '--target-brief',
        'Create an OPL-compatible reviewer critique fixture agent.',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /critique/i);
    assert.match(result.stderr, /suggestions/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

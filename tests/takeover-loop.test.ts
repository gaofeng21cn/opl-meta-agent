import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  parseBuildAgentBaselineArgs,
  runBuildAgentBaseline,
} from '../scripts/build-agent-baseline.ts';
import {
  parseTakeoverAgentArgs,
  runTakeoverAgent,
} from '../scripts/takeover-agent.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft-parts/builder.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function assertStageFolderContractRefs(
  contract: JsonObject,
  domainId: string,
  stageId: string,
  attemptId: string,
): void {
  assert.equal(contract.stage_folder_contract_ref, `stage-folder-contract-ref:${domainId}/${stageId}`);
  assert.equal(contract.stage_json_ref, `stage-json-ref:${domainId}/${stageId}`);
  assert.equal(contract.attempt_json_ref, `stage-attempt-json-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.manifest_ref, `stage-manifest-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.receipt_ref, `stage-attempt-receipt-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.current_pointer_ref, `stage-current-pointer-ref:${domainId}/${stageId}`);
  assert.equal(contract.canonical_artifact_ref, `canonical-artifact-ref:${domainId}/${stageId}`);
  assert.equal(contract.export_ref, `stage-export-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.lineage_ref, `stage-lineage-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.retention_ref, `stage-retention-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.materialization_kind, 'compiler_ref_template_only_not_runtime_state');
}

function writeAiReviewerEvaluation(filePath: string): void {
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/opl-meta-agent/takeover-fixture',
    execution_attempt_ref: 'attempt:executor/opl-meta-agent/takeover-fixture',
    review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/takeover-fixture',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The fixture baseline is suitable for takeover testing with explicit source and runbook coverage.',
    suggestions: [
      'Keep takeover fixture source coverage visible in baseline delivery receipts.',
    ],
    source_refs: [
      'review-ref:opl-meta-agent/takeover-fixture/ai-reviewer',
      'evidence-ref:baseline-fixture-agent/scaffold-validation',
    ],
    direct_evidence_refs: [
      'artifact-ref:takeover-fixture/package',
      'receipt-ref:takeover-fixture/baseline-delivery',
    ],
    verdict: 'baseline_ready_with_owner_gate',
    predicted_impact: 'The takeover fixture should preserve owner-gated baseline delivery while exercising source and runbook coverage.',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/takeover-fixture',
      created_by: 'test-fixture',
    },
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evaluation, null, 2)}\n`);
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

test('opl-meta-agent takes over testing for an existing external agent without authority writes or default promotion', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-'));
  const bootstrapRoot = path.join(outputRoot, 'bootstrap');
  const takeoverRoot = path.join(outputRoot, 'takeover');
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  const stageCloseoutPath = path.join(outputRoot, 'stage-decomposition-closeout.json');
  const targetAgent = {
    domain_id: 'takeover-fixture-agent',
    domain_label: 'Takeover Fixture Agent',
    delivery_domain: 'takeover_fixture',
    target_brief: 'Create an OPL-compatible takeover fixture agent for external testing takeover verification.',
  };
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    writeAiReviewerEvaluation(reviewerEvaluationPath);
    writeStageCloseout(stageCloseoutPath, targetAgent);
    runBuildAgentBaseline(parseBuildAgentBaselineArgs([
      '--output-dir',
      bootstrapRoot,
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
    ]));

    const targetDir = path.join(bootstrapRoot, 'takeover-fixture-agent');
    const payload = runTakeoverAgent(parseTakeoverAgentArgs([
      '--agent-dir',
      targetDir,
      '--output-dir',
      takeoverRoot,
      '--opl-bin',
      oplBin,
    ]));

    assert.equal(payload.surface_kind, 'opl_meta_agent_takeover_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.takeover_policy.target_opl_compatible_agents_allowed, true);
    assert.equal(Object.hasOwn(payload.takeover_policy, 'external_opl_compatible_agents_allowed'), false);
    assert.equal(payload.takeover_policy.can_write_target_domain_truth, false);
    assert.equal(payload.takeover_policy.can_write_target_memory_body, false);
    assert.equal(payload.takeover_policy.can_promote_default_agent_without_gate, false);
    assert.equal(payload.target_agent.domain_id, 'takeover-fixture-agent');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.mechanism_ref, 'mechanism:opl-meta-agent/takeover-fixture-agent/testing-takeover-loop');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.status, 'proposal_recorded_requires_explicit_gate');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.observe.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.diagnose.evidence_delta_ref, 'evidence-delta:opl-meta-agent/takeover-fixture-agent/takeover');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.edit.next_mechanism_candidate_ref, payload.learning_loop.online_learning_candidate.candidate_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_promote_default_agent_without_gate, false);

    const suite = readJson(path.join(takeoverRoot, 'agent-lab-takeover-suite.json'));
    assert.equal(suite.suite_kind, 'agent_lab_external_suite');
    assert.equal(
      suite.stage_native_artifact_refs.artifact_native_contract_ref,
      'artifact-native-contract-ref:takeover-fixture-agent/target-agent-takeover',
    );
    assert.equal(
      suite.stage_native_artifact_refs.attempt_json_ref,
      'stage-attempt-json-ref:takeover-fixture-agent/target-agent-takeover/testing-takeover',
    );
    assertStageFolderContractRefs(
      suite.stage_native_artifact_refs.stage_folder_contract,
      'takeover-fixture-agent',
      'target-agent-takeover',
      'testing-takeover',
    );
    assert.equal(suite.authority_boundary.can_generate_target_domain_owner_receipt, false);
    assert.equal(suite.authority_boundary.can_write_target_artifact_body, false);
    assert.equal(suite.authority_boundary.can_write_memory_body, false);
    assert.equal(suite.authority_boundary.can_promote_default_agent_without_gate, false);
    assert.equal(suite.tasks[0].task_family, 'agent_testing_takeover');
    assert.equal(
      suite.tasks[0].stage_folder_contract.manifest_ref,
      'stage-manifest-ref:takeover-fixture-agent/target-agent-takeover/testing-takeover',
    );
    assertStageFolderContractRefs(
      suite.tasks[0].stage_folder_contract,
      'takeover-fixture-agent',
      'target-agent-takeover',
      'testing-takeover',
    );
    assert.equal(
      suite.tasks[0].stage_folder_contract.canonical_artifact_ref,
      'canonical-artifact-ref:takeover-fixture-agent/target-agent-takeover',
    );
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);
    assert.equal(suite.tasks[0].promotion_gate.gate_status, 'passed');

    const receipt = readJson(path.join(takeoverRoot, 'takeover-receipt.json'));
    assert.equal(receipt.receipt_class, 'testing_takeover_self_evolution_receipt');
    assert.equal(receipt.acceptance_gates.agent_lab_suite_passed, true);
    assert.equal(receipt.acceptance_gates.online_learning_candidate_gated, true);
    assert.equal(receipt.acceptance_gates.no_memory_body_written, true);
    assert.equal(receipt.acceptance_gates.no_default_promotion, true);
    assert.equal(
      receipt.artifact_native_contract_ref,
      'artifact-native-contract-ref:takeover-fixture-agent/target-agent-takeover',
    );
    assertStageFolderContractRefs(
      receipt.stage_folder_contract,
      'takeover-fixture-agent',
      'target-agent-takeover',
      'testing-takeover',
    );
    assert.equal(receipt.stage_folder_contract.blocker_ref, 'stage-typed-blocker-ref:takeover-fixture-agent/target-agent-takeover/testing-takeover');
    assert.equal(receipt.can_generate_target_domain_owner_receipt, false);
    assert.equal(receipt.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(receipt.authority_boundary.can_promote_default_agent_without_gate, false);

    const learning = readJson(path.join(takeoverRoot, 'takeover-online-learning-candidate.json'));
    assert.equal(learning.candidate_kind, 'gated_self_evolution');
    assert.equal(learning.status, 'candidate_recorded_requires_explicit_gate');
    assert.equal(learning.online_learning_policy.can_promote_without_gate, false);
    assert.equal(learning.online_learning_policy.can_write_domain_memory_body, false);
    assert.equal(learning.online_learning_policy.can_train_or_deploy_model_weights, false);
    assert.deepEqual(learning.source_refs, [
      payload.opl_agent_lab.suite_result.result_id,
      receipt.receipt_id,
    ]);

    const mechanism = readJson(path.join(takeoverRoot, 'takeover-mechanism-patch-proposal.json'));
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.version, 'opl-meta-agent.mechanism-patch-proposal.v1');
    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/takeover-fixture-agent/testing-takeover-loop');
    assert.ok(mechanism.editable_surfaces.includes('agent_lab_suite_policy_ref'));
    assert.ok(mechanism.editable_surfaces.includes('takeover_review_policy_ref'));
    assert.equal(mechanism.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/takeover-fixture-agent/takeover');
    assert.equal(mechanism.next_mechanism_candidate_ref, learning.candidate_id);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('takeover parser has no fixture alias branch', () => {
  assert.throws(
    () => parseTakeoverAgentArgs(['--fixture', '/tmp/retired-fixture-agent']),
    /Unknown argument: --fixture/,
  );
});

test('takeover fails closed when target agent descriptor is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-missing-descriptor-'));
  const targetAgentDir = path.join(outputRoot, 'target-agent');
  const takeoverRoot = path.join(outputRoot, 'takeover');
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    fs.mkdirSync(targetAgentDir, { recursive: true });

    assert.throws(
      () => runTakeoverAgent({
        targetAgentDir,
        outputDir: takeoverRoot,
        oplBin,
      }),
      /Target agent descriptor is required: .*contracts\/domain_descriptor\.json/,
    );
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'agent-lab-takeover-suite.json')), false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'takeover-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('takeover fails closed when target agent descriptor domain_id is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-missing-domain-id-'));
  const targetAgentDir = path.join(outputRoot, 'target-agent');
  const takeoverRoot = path.join(outputRoot, 'takeover');
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_label: 'Target Agent',
      delivery_domain: 'agent_building',
    });

    assert.throws(
      () => runTakeoverAgent({
        targetAgentDir,
        outputDir: takeoverRoot,
        oplBin,
      }),
      /Target agent descriptor is missing domain_id: .*contracts\/domain_descriptor\.json/,
    );
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'agent-lab-takeover-suite.json')), false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'takeover-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

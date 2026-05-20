import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/opl-meta-agent/sample-brief-agent/baseline',
    execution_attempt_ref: 'attempt:executor/opl-meta-agent/sample-brief-agent/baseline',
    review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/sample-brief-agent/baseline',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The baseline is structurally valid but needs explicit source coverage and operator handoff evidence.',
    suggestions: [
      'Add source coverage checks to the baseline delivery scorecard.',
      'Require operator handoff evidence before signing the baseline receipt.',
    ],
    source_refs: [
      'review-ref:opl-meta-agent/sample-brief-agent/ai-reviewer',
      'evidence-ref:sample-brief-agent/scaffold-validation',
      'scorecard-ref:opl-meta-agent/baseline-acceptance',
    ],
    direct_evidence_refs: [
      'artifact-ref:sample-brief-agent/package',
      'receipt-ref:opl-meta-agent/baseline-delivery',
    ],
    verdict: 'baseline_ready_with_owner_gate',
    predicted_impact: 'The baseline should remain owner-gated while making source coverage and operator handoff evidence auditable.',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/sample-brief-agent-baseline',
      reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
      created_by: 'test-fixture',
    },
    ...overrides,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evaluation, null, 2)}\n`);
  return evaluation;
}

test('opl-meta-agent bootstraps a sample agent and validates it through OPL Agent Lab', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  const reviewerEvaluation = writeAiReviewerEvaluation(reviewerEvaluationPath);
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
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

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);

    assert.equal(payload.surface_kind, 'opl_meta_agent_self_learning_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.product_id, 'opl-meta-agent');
    assert.equal(payload.meta_agent_kind, 'opl_compatible_meta_agent');
    assert.equal(payload.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(payload.target_agent.generated_interface_status, 'ready');
    assert.equal(payload.opl_generated_interfaces.surface_kind, 'opl_generated_agent_interface_bundle');
    assert.equal(payload.opl_generated_interfaces.owner, 'one-person-lab');
    assert.equal(payload.opl_generated_interfaces.domain_repo_can_own_generated_surface, false);
    assert.equal(payload.opl_generated_interfaces.cli.descriptors[0].action_id, 'draft-brief');
    assert.equal(payload.opl_generated_interfaces.mcp.descriptors[0].descriptor_only, true);
    assert.equal(payload.opl_generated_interfaces.skill.descriptors[0].command_contract_id, 'sample-brief-agent.draft-brief');
    assert.equal(payload.opl_generated_interfaces.product_entry.descriptors[0].action_key, 'draft-brief');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.equal(payload.learning_loop.online_learning_policy.can_promote_without_gate, false);
    assert.equal(payload.learning_loop.online_learning_policy.can_train_or_deploy_model_weights, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.status, 'proposal_recorded_requires_explicit_gate');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.observe.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.diagnose.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline');
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

    const targetDir = path.join(outputRoot, 'sample-brief-agent');
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
    assert.equal(fixture.surface_kind, 'generated_agent_morphology_conformance_fixture');
    assert.equal(fixture.domain_id, 'sample-brief-agent');
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
    assert.equal(suite.suite_id, 'opl-meta-agent-self-bootstrap-suite');
    assert.equal(suite.tasks[0].domain_id, 'opl-meta-agent');
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(reviewerEvaluationPath));
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(reviewerEvaluation.direct_evidence_refs[0]));
    assert.ok(suite.tasks[0].scorecard.review_refs.includes(reviewerEvaluationPath));
    assert.deepEqual(suite.tasks[0].ai_reviewer_evaluation.source_refs, reviewerEvaluation.source_refs);

    const receipt = readJson(receiptPath);
    assert.equal(receipt.receipt_class, 'baseline_delivery_receipt');
    assert.equal(receipt.target_agent.domain_id, 'sample-brief-agent');
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
    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/sample-brief-agent/self-learning-loop');
    assert.equal(mechanism.version, 'opl-meta-agent.mechanism-patch-proposal.v1');
    assert.ok(mechanism.editable_surfaces.includes('prompt_policy_ref'));
    assert.ok(mechanism.editable_surfaces.includes('quality_gate_policy_ref'));
    assert.equal(mechanism.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline');
    assert.equal(mechanism.next_mechanism_candidate_ref, learning.candidate_id);

    const realTargetReceipt = readJson(realTargetReceiptPath);
    assert.equal(realTargetReceipt.surface_kind, 'opl_meta_agent_real_target_agent_delivery_receipt');
    assert.equal(realTargetReceipt.receipt_class, 'real_target_agent_delivery_receipt');
    assert.equal(realTargetReceipt.evidence_class, 'real_target_agent_delivery');
    assert.equal(realTargetReceipt.status, 'real_target_delivery_evidence_recorded');
    assert.equal(realTargetReceipt.target_agent.domain_id, 'real-target-brief-agent');
    assert.notEqual(realTargetReceipt.target_agent.domain_id, payload.target_agent.domain_id);
    assert.equal(realTargetReceipt.sample_smoke.counted_as_real_target_delivery, false);
    assert.equal(realTargetReceipt.sample_smoke.sample_target_agent_ref, 'domain-agent:sample-brief-agent');
    assert.equal(realTargetReceipt.sample_smoke.sample_receipt_ref, receipt.receipt_id);
    assert.equal(realTargetReceipt.owner_receipt_refs.length, 1);
    assert.equal(realTargetReceipt.owner_receipt_refs[0], realTargetReceipt.baseline_delivery_receipt_ref);
    assert.ok(realTargetReceipt.owner_receipt_refs[0].startsWith('oma_receipt_'));
    assert.equal(realTargetReceipt.agent_lab_result_ref, payload.real_target_delivery.agent_lab_run.suite_result.result_id);
    assert.deepEqual(realTargetReceipt.no_forbidden_write_proof_refs, [
      'no-forbidden-write:opl-meta-agent/real-target-brief-agent/real_target_delivery',
    ]);
    assert.deepEqual(realTargetReceipt.promotion_gate_refs, [
      'promotion-gate:opl-meta-agent/real-target-brief-agent',
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
    assert.equal(scaleoutLedger.sample_smoke.counted_as_real_target_delivery, false);
    assert.deepEqual(scaleoutLedger.sample_smoke.sample_receipt_refs, [receipt.receipt_id]);
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
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
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
    assert.match(result.stderr, /no_shared_context/i);
    assert.match(result.stderr, /independent_attempt/i);
    assert.match(result.stderr, /direct_evidence_refs/i);
    assert.match(result.stderr, /execution_attempt_ref and review_attempt_ref/i);
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
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
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
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
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
    assert.match(result.stderr, /critique/i);
    assert.match(result.stderr, /suggestions/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

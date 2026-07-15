import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSelfEvolutionOwnerCloseoutReplayDraft,
  consumeSelfEvolutionOwnerCloseout,
  prepareSelfEvolutionReEvaluation,
} from '../scripts/lib/external-suite-materializer.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

function policy(): JsonObject {
  return {
    policy_ref: 'policy:mas/agent-lab-self-evolution/target-owner-closeout-v1',
    target_domain_ids: ['med-autoscience', 'medautoscience'],
    stage_completion_policy_projection: {
      source_ref: 'agent/stages/stage_native_semantic_pack.yaml#/stage_native_semantic_pack/stages/write/stage_completion_policy',
      policy: {
        surface_kind: 'domain_stage_completion_policy',
        policy_ref: 'stage-completion-policy:mas/write',
        completion_judgment_owner: 'domain_stage',
        closeout_packet_required: false,
        raw_artifact_sufficient_for_progress: true,
        provider_completion_is_domain_completion: false,
        opl_content_judgment_allowed: false,
        semantic_route_decision_owner: 'decisive_codex_attempt',
        stage_transition_materialization_owner: 'opl_stage_run_controller',
        required_closeout_outcomes: [
          'completed_and_continue', 'completed_and_wait_owner', 'route_back', 'blocked', 'rejected',
        ],
        accepted_closeout_ref_fields: [
          'owner_receipt_ref', 'typed_blocker_ref', 'human_gate_ref', 'route_back_ref',
        ],
        authority_boundary: { opl_can_decide_domain_completion: false },
      },
    },
    mechanism_promotion_gate: {
      gate_ref: 'promotion-gate:mas/agent-lab-self-evolution/target-owner-manual-review',
      gate_status_after_absorbed_verified_patch: 'passed',
      risk_tier: 'high_risk',
      allowed_change_scope: 'manual_review_required',
      automatic_mechanism_promotion_ready: false,
      regression_suite_refs: ['tests:test-self-evolution'],
      no_forbidden_write_proof_refs: ['no-forbidden-write:mas/self-evolution'],
      failure_delta_refs: ['failure-delta:mas/self-evolution/stage-policy'],
      owner_or_human_gate_refs: ['target-agent-owner:med-autoscience'],
    },
  };
}

function suite(): JsonObject {
  return {
    suite_id: 'mas-suite:dm003',
    suite_kind: 'agent_lab_external_suite',
    evaluation_target_agent: {
      domain_id: 'med-autoscience',
      target_agent_ref: 'domain-agent:med-autoscience',
      descriptor_ref: '/tmp/med-autoscience/contracts/domain_descriptor.json',
    },
    tasks: [{
      task_id: 'agent-lab-task:mas/dm003',
      scorecard: {
        scorecard_ref: 'quality-scorecard:mas/dm003',
        passed: false,
        domain_owned: true,
      },
      improvement_candidate: {
        candidate_ref: 'candidate:mas/dm003',
        candidate_kind: 'rubric_gap',
        target_ref: 'rubric-gap:mas/dm003',
        evidence_refs: ['failure-delta:mas/dm003'],
        allowed_change_scope: 'branch_only',
        promotion_gate_ref: 'promotion-gate:mas/dm003/publication',
      },
      promotion_gate: {
        gate_ref: 'promotion-gate:mas/dm003/publication',
        gate_status: 'blocked',
      },
    }],
  };
}

function legacyDomainOwnedSuite(): JsonObject {
  const payload = suite();
  delete payload.evaluation_target_agent;
  payload.feedback_self_evolution_trigger = {
    target_agent_id: 'med-autoscience',
  };
  return payload;
}

function executionReceipt(): JsonObject {
  return {
    status: 'executed_absorbed_and_cleaned',
    work_order_id: 'oma-work-order-dm003',
    target_agent: { domain_id: 'med-autoscience' },
    patch: { changed_files: ['contracts/agent_lab_handoff.json'] },
    verification: { all_passed: true },
    absorption: { absorbed: true, absorbed_head: 'a'.repeat(40) },
    cleanup: { worktree_removed: true, branch_removed: true },
    no_forbidden_write_proof: {
      proof_refs: ['no-forbidden-write:mas/dm003'],
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
  };
}

test('same-identity re-evaluation injects canonical stage policy and an owner-gated mechanism gate', () => {
  const sourceSuite = suite();
  const sourceScorecard = structuredClone((sourceSuite.tasks as JsonObject[])[0].scorecard);
  const result = prepareSelfEvolutionReEvaluation({
    suite: sourceSuite,
    executionReceipt: executionReceipt(),
    targetPolicy: policy(),
    sourceSuiteRef: '/tmp/dm003-suite.json',
    sourceExecutionReceiptRef: '/tmp/work-order-receipt.json',
    targetPolicyRef: '/tmp/med-autoscience/contracts/agent_lab_self_evolution_policy.json',
  });
  const preparedTask = (result.preparedSuite.tasks as JsonObject[])[0];

  assert.equal(result.preparedSuite.suite_id, sourceSuite.suite_id);
  assert.equal(preparedTask.task_id, (sourceSuite.tasks as JsonObject[])[0].task_id);
  assert.deepEqual(preparedTask.scorecard, sourceScorecard);
  assert.equal(preparedTask.scorecard.passed, false);
  assert.equal(preparedTask.stage_completion_policy.policy_ref, 'stage-completion-policy:mas/write');
  assert.equal(preparedTask.improvement_candidate.allowed_change_scope, 'manual_review_required');
  assert.equal(preparedTask.promotion_gate.gate_status, 'passed');
  assert.equal(preparedTask.promotion_gate.risk_tier, 'high_risk');
  assert.deepEqual(preparedTask.promotion_gate.owner_or_human_gate_refs, [
    'target-agent-owner:med-autoscience',
  ]);
  assert.equal(result.preparationReceipt.automatic_mechanism_promotion_ready, false);
  assert.equal(result.preparationReceipt.authorizes_publication_or_submission, false);
});

test('legacy domain-owned suite binds target identity through feedback trigger and execution receipt', () => {
  const sourceSuite = legacyDomainOwnedSuite();
  const result = prepareSelfEvolutionReEvaluation({
    suite: sourceSuite,
    executionReceipt: executionReceipt(),
    targetPolicy: policy(),
    sourceSuiteRef: '/tmp/dm003-suite.json',
    sourceExecutionReceiptRef: '/tmp/work-order-receipt.json',
    targetPolicyRef: '/tmp/med-autoscience/contracts/agent_lab_self_evolution_policy.json',
  });

  assert.equal(result.preparedSuite.evaluation_target_agent, undefined);
  assert.equal(
    result.preparedSuite.self_evolution_re_evaluation_context.target_agent_binding_source,
    'suite.feedback_self_evolution_trigger+execution_receipt.target_agent',
  );
  assert.equal(result.preparationReceipt.target_agent_domain_id, 'med-autoscience');
});

test('suite and execution receipt target mismatch fails closed', () => {
  const receipt = executionReceipt();
  receipt.target_agent = { domain_id: 'another-agent' };
  assert.throws(() => prepareSelfEvolutionReEvaluation({
    suite: legacyDomainOwnedSuite(),
    executionReceipt: receipt,
    targetPolicy: policy(),
    sourceSuiteRef: '/tmp/dm003-suite.json',
    sourceExecutionReceiptRef: '/tmp/work-order-receipt.json',
    targetPolicyRef: '/tmp/med-autoscience/contracts/agent_lab_self_evolution_policy.json',
  }), /does not match/);
});

test('re-evaluation preparation fails closed without cleanup or no-forbidden-write proof', () => {
  const missingCleanup = executionReceipt();
  delete missingCleanup.cleanup;
  assert.throws(() => prepareSelfEvolutionReEvaluation({
    suite: suite(),
    executionReceipt: missingCleanup,
    targetPolicy: policy(),
    sourceSuiteRef: '/tmp/dm003-suite.json',
    sourceExecutionReceiptRef: '/tmp/work-order-receipt.json',
    targetPolicyRef: '/tmp/med-autoscience/contracts/agent_lab_self_evolution_policy.json',
  }), /cleanup/);

  const invalidProof = executionReceipt();
  invalidProof.no_forbidden_write_proof = {
    proof_refs: ['no-forbidden-write:mas/dm003'],
    can_write_target_domain_truth: true,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
  assert.throws(() => prepareSelfEvolutionReEvaluation({
    suite: suite(),
    executionReceipt: invalidProof,
    targetPolicy: policy(),
    sourceSuiteRef: '/tmp/dm003-suite.json',
    sourceExecutionReceiptRef: '/tmp/work-order-receipt.json',
    targetPolicyRef: '/tmp/med-autoscience/contracts/agent_lab_self_evolution_policy.json',
  }), /no-forbidden-write/);
});

test('owner closeout replay remains a non-OPL refs-only draft', () => {
  const draft = buildSelfEvolutionOwnerCloseoutReplayDraft({
    executionReceipt: executionReceipt(),
    sourceExecutionReceiptRef: '/tmp/work-order-receipt.json',
    sourceExecutionReceiptSha256: `sha256:${'b'.repeat(64)}`,
    preparedSuiteRef: '/tmp/prepared-suite.json',
    suiteResult: { result_id: 'oals_fresh', status: 'blocked' },
  });

  assert.equal(draft.surface_kind, 'oma_target_owner_closeout_replay_draft');
  assert.equal(draft.replay_boundary.is_opl_execution_receipt, false);
  assert.equal(draft.replay_boundary.oma_writes_target_owner_answer, false);
  assert.equal(draft.agent_lab_re_evaluation.suite_result.result_id, 'oals_fresh');
});

test('target owner responses map to accepted waived or blocked terminal outcomes', () => {
  const shapes = [
    ['domain_receipt', 'owner_receipt_ref', 'target_owner_accepted'],
    ['no_regression_evidence', 'no_regression_evidence_ref', 'target_owner_waived'],
    ['typed_blocker', 'blocker_ref', 'target_owner_blocked'],
  ] as const;
  for (const [returnShape, refField, expectedStatus] of shapes) {
    const outcome = consumeSelfEvolutionOwnerCloseout({
      owner: 'med-autoscience',
      work_order_id: 'oma-work-order-dm003',
      return_shape: returnShape,
      [refField]: `owner-answer:${returnShape}`,
      reason_codes: ['mechanism-only'],
      evidence_refs: ['evidence:fresh-re-evaluation'],
      refs_only: true,
      writes_visual_truth: false,
      writes_artifact_body: false,
      writes_memory_body: false,
      authorizes_quality_or_export: false,
      authorizes_publication_or_submission: false,
      authorizes_domain_ready: false,
      automatic_mechanism_promotion_ready: false,
    });
    assert.equal(outcome.status, expectedStatus);
    assert.equal(outcome.terminal, true);
    assert.equal(outcome.publication_or_submission_ready, false);
    assert.equal(outcome.domain_scorecard_accepted, false);
  }
});

test('owner response overclaims fail closed', () => {
  assert.throws(() => consumeSelfEvolutionOwnerCloseout({
    owner: 'med-autoscience',
    work_order_id: 'oma-work-order-dm003',
    return_shape: 'domain_receipt',
    owner_receipt_ref: 'owner-answer:invalid',
    refs_only: true,
    writes_visual_truth: false,
    writes_artifact_body: false,
    writes_memory_body: false,
    authorizes_quality_or_export: false,
    authorizes_publication_or_submission: true,
    authorizes_domain_ready: false,
    automatic_mechanism_promotion_ready: false,
  }), /authorizes_publication_or_submission/);
});

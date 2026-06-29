import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertNewAgentDeliveryGate,
} from '../scripts/build-agent-baseline.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

function reviewerEvaluation(overrides: JsonObject = {}): JsonObject {
  return {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/oma/new-agent-delivery',
    execution_attempt_ref: 'attempt:executor/oma/new-agent-delivery',
    review_attempt_ref: 'attempt:ai-reviewer/oma/new-agent-delivery',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The target agent needs external suite consumption before delivery can close.',
    suggestions: ['Consume the Agent Lab result through the OMA self-evolution loop.'],
    source_refs: ['review-ref:oma/new-agent-delivery'],
    direct_evidence_refs: ['artifact-ref:target-agent/source-review'],
    verdict: 'requires_self_evolution_consumption',
    predicted_impact: 'The delivery gate avoids treating scaffold readiness as target-agent delivery.',
    provenance: {
      reviewer_prompt_ref: 'prompt:oma/new-agent-delivery-review',
    },
    ...overrides,
  };
}

test('new agent delivery gate rejects scaffold generated interface and baseline pass without self-evolution closeout', () => {
  assert.throws(
    () =>
      assertNewAgentDeliveryGate({
        targetAgent: {
          domain_id: 'target-agent',
          domain_label: 'Target Agent',
          delivery_domain: 'opl_compatible_target_agent',
        },
        scaffoldValidationStatus: 'valid',
        generatedInterfaceStatus: 'ready',
        baselineSuiteResult: {
          result_id: 'agent-lab-result:target-agent/baseline',
          status: 'passed',
          summary: {
            recovery_probe_count: 1,
            recovery_passed_count: 1,
            forbidden_authority_flag_count: 0,
          },
        },
        realTargetSuiteResult: {
          result_id: 'agent-lab-result:target-agent/real-target',
          status: 'passed',
          summary: {
            recovery_probe_count: 1,
            recovery_passed_count: 1,
            forbidden_authority_flag_count: 0,
          },
        },
        aiReviewerEvaluation: reviewerEvaluation(),
      }),
    /self_evolution_consumption_ref.*exactly_one_closeout_outcome/,
  );
});

test('new agent delivery gate rejects terminal closeout without StageRun refs-only owner boundary evidence', () => {
  assert.throws(
    () =>
      assertNewAgentDeliveryGate({
        targetAgent: {
          domain_id: 'target-agent',
          domain_label: 'Target Agent',
          delivery_domain: 'opl_compatible_target_agent',
        },
        scaffoldValidationStatus: 'valid',
        generatedInterfaceStatus: 'ready',
        baselineSuiteResult: {
          result_id: 'agent-lab-result:target-agent/baseline',
          status: 'passed',
          summary: {
            recovery_probe_count: 1,
            recovery_passed_count: 1,
            forbidden_authority_flag_count: 0,
          },
        },
        realTargetSuiteResult: {
          result_id: 'agent-lab-result:target-agent/real-target',
          status: 'passed',
          summary: {
            recovery_probe_count: 1,
            recovery_passed_count: 1,
            forbidden_authority_flag_count: 0,
          },
        },
        aiReviewerEvaluation: reviewerEvaluation({
          source_refs: ['review-ref:oma/new-agent-delivery', 'artifact-morphology:target-agent/brief'],
          direct_evidence_refs: [
            'artifact-ref:target-agent/source-review',
            'artifact-morphology:target-agent/realistic-target-task-review',
          ],
        }),
        selfEvolutionConsumptionRef: 'self-evolution-consumption:target-agent/external-suite',
        deliveryReceipt: {
          surface_kind: 'opl_meta_agent_real_target_agent_delivery_receipt',
          receipt_id: 'receipt:target-agent/delivery',
        },
      }),
    /stage_run_refs_only_consumption_ref_missing.*stage_completion_policy_ref_missing.*stage_closeout_packet_ref_missing.*target_owner_receipt_or_typed_blocker_or_human_gate_ref_missing.*no_forbidden_write_proof_ref_missing/,
  );
});

test('new agent delivery gate rejects provider completion and OMA target truth write authority', () => {
  assert.throws(
    () =>
      assertNewAgentDeliveryGate({
        targetAgent: {
          domain_id: 'target-agent',
          domain_label: 'Target Agent',
          delivery_domain: 'opl_compatible_target_agent',
        },
        scaffoldValidationStatus: 'valid',
        generatedInterfaceStatus: 'ready',
        baselineSuiteResult: {
          result_id: 'agent-lab-result:target-agent/baseline',
          status: 'passed',
          summary: {
            recovery_probe_count: 1,
            recovery_passed_count: 1,
            forbidden_authority_flag_count: 0,
          },
        },
        realTargetSuiteResult: {
          result_id: 'agent-lab-result:target-agent/real-target',
          status: 'passed',
          summary: {
            recovery_probe_count: 1,
            recovery_passed_count: 1,
            forbidden_authority_flag_count: 0,
          },
        },
        aiReviewerEvaluation: reviewerEvaluation({
          source_refs: ['review-ref:oma/new-agent-delivery', 'artifact-morphology:target-agent/brief'],
          direct_evidence_refs: [
            'artifact-ref:target-agent/source-review',
            'artifact-morphology:target-agent/realistic-target-task-review',
          ],
        }),
        selfEvolutionConsumptionRef: 'self-evolution-consumption:target-agent/external-suite',
        deliveryReceipt: {
          surface_kind: 'opl_meta_agent_real_target_agent_delivery_receipt',
          receipt_id: 'receipt:target-agent/delivery',
        },
        stageRunRefsOnlyConsumptionRef: 'stage-run-ref:target-agent/baseline',
        stageCompletionPolicyRef: 'stage-completion-policy-ref:target-agent/baseline',
        stageCloseoutPacketRef: 'stage-closeout-packet-ref:target-agent/baseline',
        targetOwnerReceiptOrTypedBlockerOrHumanGateRef: 'owner-receipt-ref:target-agent/baseline',
        noForbiddenWriteProofRef: 'no-forbidden-write:target-agent/baseline',
        providerCompletionIsDomainCompletion: true,
        omaTargetAuthorityBoundary: {
          can_write_target_domain_truth: true,
          can_write_target_owner_receipt_body: true,
        },
      }),
    /provider_completion_is_domain_completion_forbidden.*oma_target_authority_boundary_can_write_target_domain_truth_forbidden.*oma_target_authority_boundary_can_write_target_owner_receipt_body_forbidden/,
  );
});

test('new agent delivery gate accepts exactly one delivery receipt closeout with reviewer and self-evolution evidence', () => {
  const gate = assertNewAgentDeliveryGate({
    targetAgent: {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'opl_compatible_target_agent',
    },
    scaffoldValidationStatus: 'valid',
    generatedInterfaceStatus: 'ready',
    baselineSuiteResult: {
      result_id: 'agent-lab-result:target-agent/baseline',
      status: 'passed',
      summary: {
        recovery_probe_count: 1,
        recovery_passed_count: 1,
        forbidden_authority_flag_count: 0,
      },
    },
    realTargetSuiteResult: {
      result_id: 'agent-lab-result:target-agent/real-target',
      status: 'passed',
      summary: {
        recovery_probe_count: 1,
        recovery_passed_count: 1,
        forbidden_authority_flag_count: 0,
      },
    },
    aiReviewerEvaluation: reviewerEvaluation(),
    selfEvolutionConsumptionRef: 'self-evolution-consumption:target-agent/external-suite',
    deliveryReceipt: {
      surface_kind: 'opl_meta_agent_real_target_agent_delivery_receipt',
      receipt_id: 'receipt:target-agent/delivery',
    },
    stageRunRefsOnlyConsumptionRef: 'stage-run-ref:target-agent/baseline',
    stageCompletionPolicyRef: 'stage-completion-policy-ref:target-agent/baseline',
    stageCloseoutPacketRef: 'stage-closeout-packet-ref:target-agent/baseline',
    targetOwnerReceiptOrTypedBlockerOrHumanGateRef: 'owner-receipt-ref:target-agent/baseline',
    noForbiddenWriteProofRef: 'no-forbidden-write:target-agent/baseline',
    providerCompletionIsDomainCompletion: false,
    omaTargetAuthorityBoundary: {
      can_write_target_domain_truth: false,
      can_write_target_owner_receipt_body: false,
    },
  });

  assert.equal(gate.gate_status, 'passed');
  assert.equal(gate.required_evidence.closeout_outcome_count, 1);
  assert.equal(gate.required_evidence.stage_run_refs_only_consumption_ref, 'stage-run-ref:target-agent/baseline');
  assert.equal(gate.required_evidence.stage_completion_policy_ref, 'stage-completion-policy-ref:target-agent/baseline');
  assert.equal(gate.required_evidence.stage_closeout_packet_ref, 'stage-closeout-packet-ref:target-agent/baseline');
  assert.equal(
    gate.required_evidence.target_owner_receipt_or_typed_blocker_or_human_gate_ref,
    'owner-receipt-ref:target-agent/baseline',
  );
  assert.equal(gate.false_completion_guard.provider_completion_can_claim_complete, false);
  assert.equal(gate.authority_boundary.delegates_work_order_execution_to_opl, true);
  assert.equal(gate.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
});

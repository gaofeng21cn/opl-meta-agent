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
  });

  assert.equal(gate.gate_status, 'passed');
  assert.equal(gate.required_evidence.closeout_outcome_count, 1);
  assert.equal(gate.authority_boundary.delegates_work_order_execution_to_opl, true);
  assert.equal(gate.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
});

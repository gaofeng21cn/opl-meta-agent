import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { AiReviewerEvaluation } from '../scripts/lib/meta-agent-loop-ai-reviewer.ts';
import {
  inferProposedChangeRefs,
  targetImprovementPolicy,
} from '../scripts/lib/target-improvement-policy.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
} from '../scripts/lib/work-order-policy-constants.ts';

function reviewerEvaluation(overrides: Partial<AiReviewerEvaluation> = {}): AiReviewerEvaluation {
  return {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/external-agent/generic-blocked-suite',
    execution_attempt_ref: 'attempt:executor/external-agent/generic-blocked-suite',
    review_attempt_ref: 'attempt:ai-reviewer/external-agent/generic-blocked-suite',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The blocked suite reports a generic failure taxonomy gap.',
    suggestions: [
      'Keep the target-agent owner handoff explicit before creating source patch refs.',
    ],
    source_refs: [
      'rubric-gap:external-agent/generic-failure-taxonomy',
    ],
    direct_evidence_refs: [
      'agent-lab-result:external-agent/generic-blocked-suite',
    ],
    verdict: 'blocked_requires_target_owner_policy',
    predicted_impact: 'Explicit target-owner policy avoids generic patch refs that are not traceable to target-owned contracts.',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/external-agent/generic-blocked-suite',
    },
    ...overrides,
  };
}

test('target improvement policy does not synthesize generic external-agent change refs', () => {
  const targetAgentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-target-policy-'));
  try {
    fs.mkdirSync(path.join(targetAgentDir, 'contracts'), { recursive: true });
    fs.writeFileSync(
      path.join(targetAgentDir, 'contracts/domain_descriptor.json'),
      `${JSON.stringify({
        domain_id: 'external-agent',
        domain_label: 'External Agent',
        delivery_domain: 'external_opl_compatible_agent',
      }, null, 2)}\n`,
    );

    const policy = targetImprovementPolicy(targetAgentDir);
    assert.deepEqual(policy.defaultChangeRefs, []);

    const proposedChangeRefs = inferProposedChangeRefs({
      suiteRefs: [
        'suite-ref:external-agent/blocked-generic',
        'metric-ref:external-agent/generic-failure-taxonomy',
      ],
      aiReviewerEvaluation: reviewerEvaluation(),
      policy,
    });

    assert.deepEqual(proposedChangeRefs, []);
    assert.deepEqual(policy.forbiddenTargetPathsOrSurfaces, DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES);
  } finally {
    fs.rmSync(targetAgentDir, { recursive: true, force: true });
  }
});

test('target improvement policy still applies explicit target-owned owner receipt refs', () => {
  const targetAgentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-target-policy-'));
  try {
    fs.mkdirSync(path.join(targetAgentDir, 'contracts/production_acceptance'), { recursive: true });
    fs.writeFileSync(
      path.join(targetAgentDir, 'contracts/production_acceptance/owner-receipt.json'),
      `${JSON.stringify({
        external_suite_improvement_policy: {
          default_change_ref_triggers: ['target-owner'],
          default_change_refs: [
            'target_agent_owner_receipt_contract_ref:target-agent/live-acceptance',
          ],
        },
      }, null, 2)}\n`,
    );

    const policy = targetImprovementPolicy(targetAgentDir);
    const proposedChangeRefs = inferProposedChangeRefs({
      suiteRefs: [
        'suite-ref:target-agent/target-owner',
      ],
      aiReviewerEvaluation: reviewerEvaluation({
        critique: 'The target-owner receipt projection needs source refs.',
        source_refs: ['owner-receipt:target-agent/live-acceptance'],
      }),
      policy,
    });

    assert.ok(proposedChangeRefs.includes('target_agent_owner_receipt_contract_ref:target-agent/live-acceptance'));
    assert.ok(proposedChangeRefs.includes('target_agent_owner_route_ref:target_agent/owner-receipt-projection'));
  } finally {
    fs.rmSync(targetAgentDir, { recursive: true, force: true });
  }
});

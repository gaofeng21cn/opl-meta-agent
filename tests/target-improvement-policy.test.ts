import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { AiReviewerEvaluation } from '../scripts/lib/meta-agent-loop-ai-reviewer.ts';
import {
  buildPatchTraceabilityMatrix,
  inferProposedChangeRefs,
  targetImprovementPolicy,
} from '../scripts/lib/target-improvement-policy.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function developerWorkOrderPolicyDefaults(): string[] {
  const contract = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, 'contracts/developer_work_order_policy.json'),
      'utf8',
    ),
  ) as Record<string, unknown>;
  assert.equal(contract.surface_kind, 'developer_work_order_policy');
  assert.equal(contract.state, 'active_contract');

  const value = contract.default_forbidden_target_paths_or_surfaces;
  assert.ok(Array.isArray(value));
  value.forEach((entry) => {
    assert.equal(typeof entry, 'string');
    assert.notEqual(entry.trim(), '');
  });
  return value as string[];
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
    assert.ok(policy.contractDefaultChangeRefTriggers.includes('owner-receipt'));
    assert.ok(policy.contractDefaultChangeRefTriggers.includes('production_acceptance'));
    assert.ok(
      policy.contractDefaultChangeRefs.includes(
        'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
      ),
    );
    assert.ok(policy.contractChangeRefMappings.some((mapping) => mapping.token === 'live-acceptance'));

    const proposedChangeRefs = inferProposedChangeRefs({
      suiteRefs: [
        'suite-ref:external-agent/blocked-generic',
        'metric-ref:external-agent/generic-failure-taxonomy',
      ],
      aiReviewerEvaluation: reviewerEvaluation(),
      policy,
    });

    assert.deepEqual(proposedChangeRefs, []);
    assert.deepEqual(policy.forbiddenTargetPathsOrSurfaces, developerWorkOrderPolicyDefaults());
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

test('contract-owned owner receipt defaults map reviewer evidence without script-local policy constants', () => {
  const targetAgentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-target-policy-'));
  try {
    fs.mkdirSync(path.join(targetAgentDir, 'contracts'), { recursive: true });
    fs.writeFileSync(
      path.join(targetAgentDir, 'contracts/domain_descriptor.json'),
      `${JSON.stringify({
        domain_id: 'target-agent',
        domain_label: 'Target Agent',
        delivery_domain: 'opl_compatible_target_agent',
      }, null, 2)}\n`,
    );

    const policy = targetImprovementPolicy(targetAgentDir);
    const proposedChangeRefs = inferProposedChangeRefs({
      suiteRefs: ['suite-ref:target-agent/owner-receipt-projection'],
      aiReviewerEvaluation: reviewerEvaluation({
        critique: 'The owner-receipt projection needs target owner routing refs.',
        source_refs: ['owner-receipt:target-agent/live-acceptance'],
      }),
      policy,
    });

    assert.deepEqual(policy.defaultChangeRefs, []);
    assert.deepEqual(policy.defaultChangeRefTriggers, []);
    assert.deepEqual(policy.changeRefMappings, []);
    assert.ok(
      proposedChangeRefs.includes(
        'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
      ),
    );
    assert.ok(
      proposedChangeRefs.includes(
        'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
      ),
    );
  } finally {
    fs.rmSync(targetAgentDir, { recursive: true, force: true });
  }
});

test('capability map routes reviewer gaps to exact canonical skill paths', () => {
  const targetAgentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-target-policy-'));
  try {
    fs.mkdirSync(path.join(targetAgentDir, 'contracts'), { recursive: true });
    fs.writeFileSync(
      path.join(targetAgentDir, 'contracts/capability_map.json'),
      `${JSON.stringify({
        surface_kind: 'target_capability_map',
        capabilities: [
          {
            capability_id: 'medical-figure-design',
            kind: 'professional_skill',
            canonical_paths: ['skills/medical-figure-design/SKILL.md'],
            improvement_tokens: ['figure_quality', 'visual-template'],
            verification_refs: ['target_repo_test_receipt'],
            forbidden_surfaces: ['publication_readiness'],
          },
        ],
        authority_boundary: {
          forbidden_surfaces: ['owner_receipt_body'],
        },
      }, null, 2)}\n`,
    );

    const policy = targetImprovementPolicy(targetAgentDir);
    const proposedChangeRefs = inferProposedChangeRefs({
      suiteRefs: ['quality-scorecard:mas/figure_quality'],
      aiReviewerEvaluation: reviewerEvaluation({
        critique: 'The figure quality is weak and not publication facing.',
        source_refs: ['rubric-gap:figure_quality'],
      }),
      policy,
    });

    assert.deepEqual(proposedChangeRefs, ['professional_skill_medical_figure_design']);
    assert.ok(policy.forbiddenTargetPathsOrSurfaces.includes('publication_readiness'));
    assert.ok(policy.forbiddenTargetPathsOrSurfaces.includes('owner_receipt_body'));

    const matrix = buildPatchTraceabilityMatrix({
      suiteRefs: ['quality-scorecard:mas/figure_quality'],
      proposedChangeRefs,
      aiReviewerEvaluation: reviewerEvaluation({
        critique: 'The figure quality is weak and not publication facing.',
        source_refs: ['rubric-gap:figure_quality'],
      }),
      policy,
    });

    assert.equal(matrix.length, 1);
    assert.deepEqual(matrix[0]?.target_repo_file_hints, ['skills/medical-figure-design/SKILL.md']);
  } finally {
    fs.rmSync(targetAgentDir, { recursive: true, force: true });
  }
});

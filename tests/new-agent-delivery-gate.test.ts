import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildFoundryLabWorkOrder,
} from '../scripts/lib/foundry-lab-work-order.ts';
import {
  repoRoot,
} from './support/contracts.ts';

const ACTIVE_MATERIALIZER_REFS = [
  'scripts/build-agent-baseline.ts',
  'scripts/improve-from-agent-lab-suite.ts',
  'scripts/lib/agent-evidence-materializer.ts',
  'scripts/lib/external-suite-materializer.ts',
  'scripts/takeover-agent.ts',
];

test('OMA emits a blocked Foundry Lab work-order candidate without execution or ledger authority', () => {
  const workOrder = buildFoundryLabWorkOrder({
    workOrderKind: 'target_agent_takeover_evaluation',
    targetAgent: {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      repo_dir: '/tmp/target-agent',
    },
    suiteSeed: {
      suite_id: 'agent-lab-suite-seed:target-agent/takeover',
      suite_kind: 'agent_lab_external_suite',
    },
    suiteSeedRef: '/tmp/oma/agent-lab-suite-seed.json',
    sourceRefs: ['contracts/agent_lab_handoff.json'],
    reviewerRefs: ['review:target-agent/takeover'],
    candidateRefs: ['improvement-candidate:target-agent/takeover'],
  });

  assert.equal(workOrder.surface_kind, 'opl_meta_agent_foundry_lab_work_order_candidate');
  assert.equal(workOrder.version, 'opl-meta-agent.foundry-lab-work-order-candidate.v1');
  assert.equal(workOrder.status, 'blocked_missing_opl_foundry_lab_evaluation_work_order_consumer');
  assert.equal(workOrder.consumer_dependency.status, 'missing');
  assert.equal(workOrder.execution_aperture.action_ref, null);
  assert.equal(workOrder.execution_owner, 'one-person-lab/OPL Foundry Lab');
  assert.equal(workOrder.suite_seed.ref, '/tmp/oma/agent-lab-suite-seed.json');
  assert.deepEqual(workOrder.candidate_refs, ['improvement-candidate:target-agent/takeover']);
  assert.deepEqual(workOrder.expected_return_shapes, [
    'agent_lab_suite_result_ref',
    'foundry_lab_execution_receipt_ref',
    'improvement_candidate_refs',
    'mechanism_proposal_refs',
    'promotion_gate_refs',
    'scaleout_ledger_refs',
    'target_owner_receipt_or_typed_blocker_ref',
  ]);

  const boundary = workOrder.authority_boundary;
  [
    'oma_can_execute_agent_lab_suite',
    'oma_can_write_agent_lab_result',
    'oma_can_write_owner_receipt_body',
    'oma_can_write_learning_candidate_ledger',
    'oma_can_write_promotion_gate',
    'oma_can_write_mechanism_or_scaleout_ledger',
    'oma_can_manage_work_order_lifecycle',
    'oma_can_write_target_domain_truth',
    'oma_can_write_target_domain_memory_body',
    'oma_can_mutate_target_domain_artifact_body',
    'oma_can_authorize_target_domain_quality_or_export',
  ].forEach((field) => assert.equal(boundary[field], false, field));
});

test('active OMA materializers do not execute Agent Lab or materialize hosted ledgers', () => {
  ACTIVE_MATERIALIZER_REFS.forEach((ref) => {
    const source = fs.readFileSync(path.join(repoRoot, ref), 'utf8');
    assert.doesNotMatch(source, /\['agent-lab',\s*'run'/, `${ref} must not invoke Agent Lab`);
    assert.doesNotMatch(source, /agent-lab-run-result\.json/, `${ref} must not write Agent Lab results`);
    assert.doesNotMatch(source, /(?:delivery|takeover)-receipt\.json/, `${ref} must not write owner receipts`);
    assert.doesNotMatch(source, /scaleout-evidence-ledger\.json/, `${ref} must not write scaleout ledgers`);
    assert.doesNotMatch(source, /new-agent-delivery-gate\.json/, `${ref} must not assemble delivery gates`);
  });
});

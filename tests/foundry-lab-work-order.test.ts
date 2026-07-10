import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FOUNDRY_LAB_EVALUATION_ACTION_REF,
  FOUNDRY_LAB_EVALUATION_OWNER,
  buildFoundryLabWorkOrder,
} from '../scripts/lib/foundry-lab-work-order.ts';

const targetAgent = {
  domain_id: 'colorectal-surgery-risk-agent',
  domain_label: 'Colorectal Surgery Risk Agent',
  repo_dir: '/tmp/colorectal-surgery-risk-agent',
  target_agent_ref: 'domain-agent:colorectal-surgery-risk-agent',
  descriptor_ref: '/tmp/colorectal-surgery-risk-agent/contracts/domain_descriptor.json',
};

const suiteSeed = {
  surface_kind: 'opl_meta_agent_agent_lab_suite_seed',
  version: 'opl-meta-agent.agent-lab-suite-seed.v1',
  suite_id: 'opl-meta-agent-baseline-suite:colorectal-surgery-risk-agent',
  suite_kind: 'agent_lab_external_suite',
};

function build(overrides: Record<string, unknown> = {}) {
  return buildFoundryLabWorkOrder({
    workOrderKind: 'agent_baseline_evaluation',
    targetAgent,
    suiteSeed,
    suiteSeedRef: 'agent-lab-suite-seed.json',
    sourceRefs: ['source:b', 'source:a', 'source:a'],
    reviewerRefs: ['review:b', 'review:a'],
    candidateRefs: ['candidate:b', 'candidate:a'],
    ...overrides,
  });
}

test('Foundry evaluation work order matches the canonical OPL consumer ABI', () => {
  const workOrder = build();

  assert.equal(workOrder.status, 'ready_for_opl_foundry_lab_evaluation');
  assert.equal(workOrder.execution_owner, FOUNDRY_LAB_EVALUATION_OWNER);
  assert.deepEqual(workOrder.target_agent, targetAgent);
  assert.deepEqual(workOrder.consumer_dependency, {
    status: 'available',
    owner: FOUNDRY_LAB_EVALUATION_OWNER,
    required_consumer_role: 'compile_evaluation_work_order_to_agent_lab_suite_and_execute',
  });
  assert.deepEqual(workOrder.execution_aperture, {
    action_ref: FOUNDRY_LAB_EVALUATION_ACTION_REF,
    work_order_lifecycle_owner: FOUNDRY_LAB_EVALUATION_OWNER,
    result_ledger_owner: FOUNDRY_LAB_EVALUATION_OWNER,
    target_owner_closeout_owner: 'target-domain',
  });
  assert.equal(Object.hasOwn(workOrder, 'suite_result'), false);
  assert.equal(Object.hasOwn(workOrder, 'foundry_lab_execution_receipt'), false);
});

test('Foundry work-order identity binds target identity and canonical provenance refs', () => {
  const canonical = build();
  const reordered = build({
    sourceRefs: ['source:a', 'source:b'],
    reviewerRefs: ['review:a', 'review:b'],
    candidateRefs: ['candidate:a', 'candidate:b'],
  });
  assert.equal(reordered.work_order_id, canonical.work_order_id);
  assert.deepEqual(canonical.source_refs, ['source:a', 'source:b']);
  assert.deepEqual(canonical.reviewer_refs, ['review:a', 'review:b']);
  assert.deepEqual(canonical.candidate_refs, ['candidate:a', 'candidate:b']);

  const changedTargetRef = build({
    targetAgent: { ...targetAgent, target_agent_ref: 'domain-agent:other-target' },
  });
  const changedDescriptor = build({
    targetAgent: { ...targetAgent, descriptor_ref: '/tmp/other/contracts/domain_descriptor.json' },
  });
  const changedProvenance = build({ candidateRefs: ['candidate:a', 'candidate:c'] });
  assert.notEqual(changedTargetRef.work_order_id, canonical.work_order_id);
  assert.notEqual(changedDescriptor.work_order_id, canonical.work_order_id);
  assert.notEqual(changedProvenance.work_order_id, canonical.work_order_id);
});

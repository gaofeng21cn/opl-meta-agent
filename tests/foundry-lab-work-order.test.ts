import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  FOUNDRY_LAB_EVALUATION_ACTION_REF,
  FOUNDRY_LAB_EVALUATION_OWNER,
  buildFoundryLabWorkOrder,
} from '../scripts/lib/foundry-lab-work-order.ts';
import { sha256FileBytes, writeJson } from '../scripts/lib/meta-agent-loop-io.ts';

const targetAgent = {
  domain_id: 'colorectal-surgery-risk-agent',
  domain_label: 'Colorectal Surgery Risk Agent',
  repo_dir: '/tmp/colorectal-surgery-risk-agent',
  target_agent_ref: 'domain-agent:colorectal-surgery-risk-agent',
  descriptor_ref: '/tmp/colorectal-surgery-risk-agent/contracts/domain_descriptor.json',
};

const evaluationRequest = {
  surface_kind: 'opl_meta_agent_foundry_evaluation_request',
  version: 'opl-meta-agent.foundry-evaluation-request.v1',
  request_id: 'oma-evaluation-request:colorectal-surgery-risk-agent/baseline',
  suite_id: 'opl-meta-agent-baseline-suite:colorectal-surgery-risk-agent',
  suite_kind: 'agent_lab_external_suite',
  task_intents: [{ task_id: 'agent-lab-task:colorectal-surgery-risk-agent/baseline' }],
};

const evaluationRequestSha256 = 'a'.repeat(64);

function build(overrides: Record<string, unknown> = {}) {
  return buildFoundryLabWorkOrder({
    workOrderKind: 'agent_baseline_evaluation',
    targetAgent,
    evaluationRequest,
    evaluationRequestRef: 'oma-evaluation-request.json',
    evaluationRequestSha256,
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
  assert.deepEqual(workOrder.evaluation_request, {
    ref: 'oma-evaluation-request.json',
    sha256: evaluationRequestSha256,
    request_id: evaluationRequest.request_id,
    suite_id: evaluationRequest.suite_id,
    suite_kind: evaluationRequest.suite_kind,
  });
  assert.equal(Object.hasOwn(workOrder, 'suite_seed'), false);
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
  const changedTask = build({
    evaluationRequest: {
      ...evaluationRequest,
      task_intents: [{ task_id: 'agent-lab-task:colorectal-surgery-risk-agent/transportability' }],
    },
  });
  const changedRequestBytes = build({ evaluationRequestSha256: 'b'.repeat(64) });
  assert.notEqual(changedTargetRef.work_order_id, canonical.work_order_id);
  assert.notEqual(changedDescriptor.work_order_id, canonical.work_order_id);
  assert.notEqual(changedProvenance.work_order_id, canonical.work_order_id);
  assert.notEqual(changedTask.work_order_id, canonical.work_order_id);
  assert.notEqual(changedRequestBytes.work_order_id, canonical.work_order_id);
});

test('Foundry work-order rejects a non-canonical evaluation request digest', () => {
  assert.throws(
    () => build({ evaluationRequestSha256: 'SHA256:not-a-raw-byte-digest' }),
    /evaluation_request\.sha256/i,
  );
});

test('Foundry work-order identity changes when request bytes change but logical ids do not', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-foundry-request-digest-'));
  try {
    const firstRequest = {
      ...evaluationRequest,
      task_intents: [{
        task_id: evaluationRequest.task_intents[0].task_id,
        instructions_ref: 'instructions:target-agent/baseline-v1',
      }],
    };
    const secondRequest = {
      ...firstRequest,
      task_intents: [{
        ...firstRequest.task_intents[0],
        instructions_ref: 'instructions:target-agent/baseline-v2',
      }],
    };
    const firstPath = path.join(outputRoot, 'first.json');
    const secondPath = path.join(outputRoot, 'second.json');
    writeJson(firstPath, firstRequest);
    writeJson(secondPath, secondRequest);

    const first = build({
      evaluationRequest: firstRequest,
      evaluationRequestSha256: sha256FileBytes(firstPath),
    });
    const second = build({
      evaluationRequest: secondRequest,
      evaluationRequestSha256: sha256FileBytes(secondPath),
    });
    assert.equal(first.evaluation_request.request_id, second.evaluation_request.request_id);
    assert.equal(first.evaluation_request.suite_id, second.evaluation_request.suite_id);
    assert.notEqual(first.evaluation_request.sha256, second.evaluation_request.sha256);
    assert.notEqual(first.work_order_id, second.work_order_id);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

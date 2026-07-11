import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';
import {
  parseTakeoverAgentArgs,
} from '../scripts/takeover-agent.ts';
import {
  assertMatchesJsonSchema,
  oplBin,
  parseJsonText,
  readJsonFile as readJson,
  repoRoot,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

function writeReviewerEvaluation(filePath: string, overrides: Record<string, unknown> = {}): void {
  writeJson(filePath, {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/opl-meta-agent/takeover-fixture',
    execution_attempt_ref: 'attempt:executor/opl-meta-agent/takeover-fixture',
    review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/takeover-fixture',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'Takeover needs Foundry Lab execution and target-owner closeout.',
    suggestions: ['Submit a thin evaluation request through a declarative Foundry Lab work order.'],
    source_refs: [
      'review-ref:opl-meta-agent/takeover-fixture/ai-reviewer',
      'artifact-morphology-ref:takeover-fixture-agent/target-delivery',
      'target-owner-route-ref:takeover-fixture-agent/generated-default-agent',
    ],
    direct_evidence_refs: [
      'morphology-evidence-ref:takeover-fixture-agent/realistic-target-task-review',
    ],
    verdict: 'takeover_ready_for_foundry_lab_evaluation',
    predicted_impact: 'The takeover path no longer creates a second Agent Lab execution plane.',
    provenance: { artifact_ref: 'artifact-ref:ai-reviewer/takeover-fixture', created_by: 'test-fixture' },
    ...overrides,
  });
}

function validateTakeoverOutput(payload: unknown) {
  const schemaRef = 'contracts/schemas/takeover-target-agent-test.output.schema.json';
  const schema = readJson(path.join(repoRoot, schemaRef));
  return validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, payload);
}

test('takeover emits a thin evaluation request and Foundry Lab work order without local execution receipts', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-'));
  try {
    const targetDir = path.join(outputRoot, 'target-agent');
    const takeoverRoot = path.join(outputRoot, 'takeover');
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeJson(path.join(targetDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'takeover-fixture-agent',
      domain_label: 'Takeover Fixture Agent',
      delivery_domain: 'takeover_fixture',
      target_brief: 'Verify declarative takeover handoff.',
    });
    writeReviewerEvaluation(reviewerPath, { suggestions: ['Repeatable suggestion.', 'Repeatable suggestion.'] });

    const result = spawnSync(process.execPath, [
      path.join(repoRoot, 'scripts/takeover-agent.ts'),
      '--agent-dir', targetDir,
      '--output-dir', takeoverRoot,
      '--ai-reviewer-evaluation', reviewerPath,
    ], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = parseJsonText(result.stdout);
    assertMatchesJsonSchema('contracts/schemas/takeover-target-agent-test.output.schema.json', payload);

    assert.equal(payload.surface_kind, 'opl_meta_agent_takeover_handoff');
    assert.equal(payload.status, 'takeover_candidate_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.authority_boundary.oma_can_execute_agent_lab_suite, false);
    assert.equal(payload.takeover_policy.can_write_target_owner_receipt_body, false);
    assert.deepEqual(payload.agent_building_judgment.suggestions, [
      'Repeatable suggestion.',
      'Repeatable suggestion.',
    ]);
    assert.deepEqual(payload.agent_building_judgment.candidate_refs, [
      'improvement-candidate:opl-meta-agent/takeover-fixture-agent/gated-self-evolution',
      'mechanism-candidate:opl-meta-agent/takeover-fixture-agent/testing-takeover-loop',
    ]);

    const evaluationRequest = readJson(path.join(takeoverRoot, 'foundry-evaluation-request.json'));
    assert.equal(evaluationRequest.surface_kind, 'opl_meta_agent_foundry_evaluation_request');
    assert.equal(evaluationRequest.suite_kind, 'agent_lab_external_suite');
    assert.equal(evaluationRequest.task_intents[0].domain_id, 'opl-meta-agent');
    assert.equal(Object.hasOwn(evaluationRequest, 'target_agent_ref'), false);
    assert.equal(Object.hasOwn(evaluationRequest.task_intents[0], 'environment'), false);
    assert.equal(Object.hasOwn(evaluationRequest.task_intents[0], 'recovery_probe_specs'), false);

    const workOrder = readJson(path.join(takeoverRoot, 'foundry-lab-work-order.json'));
    assert.equal(workOrder.work_order_kind, 'target_agent_takeover_evaluation');
    assert.equal(workOrder.status, 'ready_for_opl_foundry_lab_evaluation');
    assert.equal(workOrder.consumer_dependency.status, 'available');
    assert.equal(workOrder.target_agent.target_agent_ref, 'domain-agent:takeover-fixture-agent');
    assert.equal(workOrder.target_agent.descriptor_ref, path.join(targetDir, 'contracts/domain_descriptor.json'));
    assert.equal(workOrder.evaluation_request.ref, 'foundry-evaluation-request.json');
    assert.equal(
      workOrder.evaluation_request.sha256,
      createHash('sha256')
        .update(fs.readFileSync(path.join(takeoverRoot, 'foundry-evaluation-request.json')))
        .digest('hex'),
    );
    assert.equal(workOrder.execution_owner, 'one-person-lab/OPL Foundry Lab');
    assert.equal(workOrder.authority_boundary.oma_can_write_owner_receipt_body, false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'agent-lab-takeover-suite-seed.json')), false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'takeover-receipt.json')), false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'new-agent-delivery-gate.json')), false);

    for (const mutate of [
      (candidate: Record<string, any>) => { candidate.suite_seed = {}; },
      (candidate: Record<string, any>) => { candidate.foundry_lab_handoff.work_order.suite_plan = {}; },
      (candidate: Record<string, any>) => { candidate.target_agent.unknown_target_identity = 'forbidden'; },
      (candidate: Record<string, any>) => { candidate.authority_boundary.unknown_authority = false; },
    ]) {
      const forged = structuredClone(payload);
      mutate(forged);
      assert.equal(validateTakeoverOutput(forged).ok, false);
    }
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('takeover hands the same thin request to the linked OPL Foundry Lab compiler', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-opl-e2e-'));
  try {
    const targetDir = path.join(outputRoot, 'target-agent');
    const takeoverRoot = path.join(outputRoot, 'takeover');
    const foundryOutputDir = path.join(outputRoot, 'foundry-output');
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeJson(path.join(targetDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'takeover-fixture-agent',
      domain_label: 'Takeover Fixture Agent',
      delivery_domain: 'takeover_fixture',
      target_brief: 'Verify Foundry Lab consumes the OMA request without a suite seed.',
    });
    writeReviewerEvaluation(reviewerPath);

    const producer = spawnSync(process.execPath, [
      path.join(repoRoot, 'scripts/takeover-agent.ts'),
      '--agent-dir', targetDir,
      '--output-dir', takeoverRoot,
      '--ai-reviewer-evaluation', reviewerPath,
    ], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    assert.equal(producer.status, 0, producer.stderr || producer.stdout);

    const requestPath = path.join(takeoverRoot, 'foundry-evaluation-request.json');
    const workOrderPath = path.join(takeoverRoot, 'foundry-lab-work-order.json');
    const request = readJson(requestPath);
    const workOrder = readJson(workOrderPath);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'agent-lab-takeover-suite-seed.json')), false);
    assert.equal(Object.hasOwn(request, 'tasks'), false);
    assert.equal(Object.hasOwn(workOrder, 'suite_seed'), false);

    const consumer = spawnSync(oplBin, [
      'agent-lab',
      'evaluation-work-order',
      'execute',
      '--work-order', workOrderPath,
      '--output', foundryOutputDir,
      '--json',
    ], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      env: {
        ...process.env,
        OPL_STATE_DIR: path.join(outputRoot, 'opl-state'),
      },
    });
    assert.equal(consumer.status, 0, consumer.stderr || consumer.stdout);

    const execution = parseJsonText(consumer.stdout).agent_lab_evaluation_work_order_execution;
    const suitePlan = readJson(execution.artifacts.evaluation_suite_plan_path);
    assert.equal(execution.status, 'blocked_missing_evaluation_observations');
    assert.equal(execution.suite_result, null);
    assert.equal(Object.hasOwn(execution, 'suite_seed_path'), false);
    assert.equal(suitePlan.surface_kind, 'opl_foundry_lab_evaluation_suite_plan');
    assert.equal(suitePlan.producer, 'one-person-lab/OPL Foundry Lab');
    assert.equal(suitePlan.tasks[0].task_id, request.task_intents[0].task_id);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('takeover parser retires local Agent Lab execution flags and fixture aliases', () => {
  assert.throws(
    () => parseTakeoverAgentArgs(['--fixture', '/tmp/retired-fixture-agent']),
    /Unknown option '--fixture'/,
  );
  assert.throws(
    () => parseTakeoverAgentArgs([
      '--agent-dir', '/tmp/target-agent',
      '--ai-reviewer-evaluation', '/tmp/reviewer.json',
      '--opl-bin', '/tmp/opl',
    ]),
    /Unknown option '--opl-bin'/,
  );
});

test('takeover fails closed without source and direct artifact morphology evidence', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-morphology-'));
  try {
    const targetDir = path.join(outputRoot, 'target-agent');
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeJson(path.join(targetDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'takeover-fixture-agent',
    });
    writeReviewerEvaluation(reviewerPath, {
      source_refs: ['review-ref:takeover-fixture-agent/generic-review'],
      direct_evidence_refs: ['evidence-ref:takeover-fixture-agent/generic-direct-review'],
    });

    const result = spawnSync(process.execPath, [
      path.join(repoRoot, 'scripts/takeover-agent.ts'),
      '--agent-dir', targetDir,
      '--output-dir', path.join(outputRoot, 'takeover'),
      '--ai-reviewer-evaluation', reviewerPath,
    ], { cwd: repoRoot, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /artifact morphology evidence in source_refs and direct_evidence_refs/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

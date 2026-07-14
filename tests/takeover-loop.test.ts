import assert from 'node:assert/strict';
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

test('takeover emits a thin semantic request without private work-order mechanics', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-'));
  try {
    const targetDir = path.join(outputRoot, 'target-agent');
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
      '--ai-reviewer-evaluation', reviewerPath,
    ], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = parseJsonText(result.stdout);
    assertMatchesJsonSchema('contracts/schemas/takeover-target-agent-test.output.schema.json', payload);

    assert.equal(payload.surface_kind, 'opl_meta_agent_takeover_handoff');
    assert.equal(payload.status, 'takeover_semantic_request_ready_for_opl_foundry_lab_materialization');
    assert.equal(payload.authority_boundary.producer_executes_work_order, false);
    assert.equal(payload.authority_boundary.producer_writes_framework_request_bundle, false);
    assert.equal(payload.authority_boundary.producer_assigns_work_order_id, false);
    assert.equal(payload.authority_boundary.producer_manages_executor_lease, false);
    assert.equal(payload.authority_boundary.producer_manages_target_worktree, false);
    assert.equal(payload.authority_boundary.producer_writes_work_order_receipt, false);
    assert.equal(payload.takeover_policy.can_write_target_owner_receipt_body, false);
    const noMaterializationGuard = readJson(
      path.join(repoRoot, 'contracts/private_functional_surface_policy.json'),
    ).takeover_semantic_request_no_materialization_guard;
    for (const capability of noMaterializationGuard.forbidden_authority_capabilities) {
      assert.equal(payload.authority_boundary[capability], false, capability);
    }
    assert.deepEqual(payload.agent_building_judgment.suggestions, [
      'Repeatable suggestion.',
      'Repeatable suggestion.',
    ]);
    assert.deepEqual(payload.agent_building_judgment.candidate_refs, [
      'improvement-candidate:opl-meta-agent/takeover-fixture-agent/gated-self-evolution',
      'mechanism-candidate:opl-meta-agent/takeover-fixture-agent/testing-takeover-loop',
    ]);

    const materializationRequest = payload.foundry_lab_handoff.materialization_request;
    assert.equal(materializationRequest.surface_kind, 'opl_work_order_materialization_request');
    assert.equal(materializationRequest.version, 'opl-work-order-materialization-request.v2');
    assert.equal(materializationRequest.request_kind, 'foundry_evaluation');
    assert.equal(materializationRequest.request_owner, 'oma');
    assert.equal(materializationRequest.producer_agent_id, 'oma');
    assert.equal(materializationRequest.target_agent.target_agent_ref, 'domain-agent:takeover-fixture-agent');
    assert.equal(
      materializationRequest.target_agent.descriptor_ref,
      path.join(targetDir, 'contracts/domain_descriptor.json'),
    );
    const semanticRequest = materializationRequest.semantic_request;
    assert.equal(semanticRequest.suite_kind, 'agent_lab_external_suite');
    assert.equal(semanticRequest.task_intents[0].domain_id, 'opl-meta-agent');
    assert.equal(Object.hasOwn(semanticRequest, 'work_order_id'), false);
    assert.equal(Object.hasOwn(semanticRequest, 'tasks'), false);
    assert.equal(Object.hasOwn(semanticRequest.task_intents[0], 'environment'), false);
    assert.equal(Object.hasOwn(semanticRequest.task_intents[0], 'recovery_probe_specs'), false);

    assert.deepEqual(fs.readdirSync(outputRoot).sort(), ['reviewer.json', 'target-agent']);

    for (const mutate of [
      (candidate: Record<string, any>) => { candidate.suite_seed = {}; },
      (candidate: Record<string, any>) => {
        candidate.foundry_lab_handoff.materialization_request.semantic_request.suite_plan = {};
      },
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
  assert.throws(
    () => parseTakeoverAgentArgs([
      '--agent-dir', '/tmp/target-agent',
      '--ai-reviewer-evaluation', '/tmp/reviewer.json',
      '--output-dir', '/tmp/takeover-output',
    ]),
    /Unknown option '--output-dir'/,
  );
});

test('takeover preserves its handoff with quality debt when morphology review evidence is missing', () => {
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
      '--ai-reviewer-evaluation', reviewerPath,
    ], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.equal(payload.next_stage_may_start, true);
    assert.equal(payload.quality_debt.blocks_delivery_or_promotion_claims, true);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

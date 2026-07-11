import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
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
    suggestions: ['Submit the suite seed through a declarative Foundry Lab work order.'],
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

test('takeover emits suite seed and Foundry Lab work order without local execution receipts', () => {
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
    writeReviewerEvaluation(reviewerPath);

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
    assert.deepEqual(payload.agent_building_judgment.candidate_refs, [
      'improvement-candidate:opl-meta-agent/takeover-fixture-agent/gated-self-evolution',
      'mechanism-candidate:opl-meta-agent/takeover-fixture-agent/testing-takeover-loop',
    ]);

    const suiteSeed = readJson(path.join(takeoverRoot, 'agent-lab-takeover-suite-seed.json'));
    assert.equal(suiteSeed.surface_kind, 'opl_meta_agent_agent_lab_suite_seed');
    assert.equal(suiteSeed.seed_status, 'declarative_seed_candidate_waiting_for_foundry_lab_consumer');
    assert.equal(suiteSeed.target_agent_ref, 'domain-agent:takeover-fixture-agent');
    assert.equal(
      suiteSeed.target_agent_descriptor_ref,
      path.join(targetDir, 'contracts/domain_descriptor.json'),
    );
    assert.deepEqual(suiteSeed.evaluation_target_agent, {
      domain_id: 'takeover-fixture-agent',
      target_agent_ref: 'domain-agent:takeover-fixture-agent',
      descriptor_ref: path.join(targetDir, 'contracts/domain_descriptor.json'),
    });
    assert.equal(suiteSeed.tasks[0].scorecard_spec.passed, undefined);
    assert.equal(suiteSeed.tasks[0].promotion_gate_request.gate_status, undefined);
    assert.equal(suiteSeed.tasks[0].recovery_probe_specs[0].observed_status, undefined);

    const workOrder = readJson(path.join(takeoverRoot, 'foundry-lab-work-order.json'));
    assert.equal(workOrder.work_order_kind, 'target_agent_takeover_evaluation');
    assert.equal(workOrder.status, 'ready_for_opl_foundry_lab_evaluation');
    assert.equal(workOrder.consumer_dependency.status, 'available');
    assert.equal(workOrder.target_agent.target_agent_ref, 'domain-agent:takeover-fixture-agent');
    assert.equal(workOrder.target_agent.descriptor_ref, path.join(targetDir, 'contracts/domain_descriptor.json'));
    assert.equal(workOrder.execution_owner, 'one-person-lab/OPL Foundry Lab');
    assert.equal(workOrder.authority_boundary.oma_can_write_owner_receipt_body, false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'takeover-receipt.json')), false);
    assert.equal(fs.existsSync(path.join(takeoverRoot, 'new-agent-delivery-gate.json')), false);
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

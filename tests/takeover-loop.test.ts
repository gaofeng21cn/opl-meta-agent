import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  parseTakeoverAgentArgs,
  runTakeoverAgent,
} from '../scripts/takeover-agent.ts';
import {
  readJsonFile as readJson,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

function writeReviewerEvaluation(filePath: string): void {
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
      'target-owner-route-ref:takeover-fixture-agent/generated-default-agent',
    ],
    direct_evidence_refs: [
      'morphology-evidence-ref:takeover-fixture-agent/realistic-target-task-review',
    ],
    verdict: 'takeover_ready_for_foundry_lab_evaluation',
    predicted_impact: 'The takeover path no longer creates a second Agent Lab execution plane.',
    provenance: { artifact_ref: 'artifact-ref:ai-reviewer/takeover-fixture', created_by: 'test-fixture' },
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

    const payload = runTakeoverAgent(parseTakeoverAgentArgs([
      '--agent-dir', targetDir,
      '--output-dir', takeoverRoot,
      '--ai-reviewer-evaluation', reviewerPath,
    ]));

    assert.equal(payload.surface_kind, 'opl_meta_agent_takeover_handoff');
    assert.equal(payload.status, 'takeover_candidate_materialized_evaluation_consumer_blocked');
    assert.equal(payload.authority_boundary.oma_can_execute_agent_lab_suite, false);
    assert.equal(payload.takeover_policy.can_write_target_owner_receipt_body, false);
    assert.deepEqual(payload.agent_building_judgment.candidate_refs, [
      'improvement-candidate:opl-meta-agent/takeover-fixture-agent/gated-self-evolution',
      'mechanism-candidate:opl-meta-agent/takeover-fixture-agent/testing-takeover-loop',
    ]);

    const suiteSeed = readJson(path.join(takeoverRoot, 'agent-lab-takeover-suite-seed.json'));
    assert.equal(suiteSeed.surface_kind, 'opl_meta_agent_agent_lab_suite_seed');
    assert.equal(suiteSeed.seed_status, 'declarative_seed_candidate_waiting_for_foundry_lab_consumer');
    assert.equal(suiteSeed.tasks[0].scorecard_spec.passed, undefined);
    assert.equal(suiteSeed.tasks[0].promotion_gate_request.gate_status, undefined);
    assert.equal(suiteSeed.tasks[0].recovery_probe_specs[0].observed_status, undefined);

    const workOrder = readJson(path.join(takeoverRoot, 'foundry-lab-work-order.json'));
    assert.equal(workOrder.work_order_kind, 'target_agent_takeover_evaluation');
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

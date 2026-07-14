import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  assertMatchesJsonSchema,
  parseJsonText,
  repoRoot,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

function writeTargetAgentFixture(agentRepo: string): void {
  writeJson(path.join(agentRepo, 'contracts/domain_descriptor.json'), {
    domain_id: 'med-autoscience',
    domain_label: 'MedAutoScience',
    generated_surface_owner: 'one-person-lab',
  });
  writeJson(path.join(agentRepo, 'contracts/generated_surface_handoff.json'), {
    generated_surface_owner: 'one-person-lab',
    generated_surface_policy: { must_not_write: ['target quality verdict', 'current_package'] },
    no_forbidden_write_proof_refs: ['no-forbidden-write:med-autoscience/production-evidence-tail'],
  });
  writeJson(path.join(agentRepo, 'contracts/owner_receipt_contract.json'), {
    surface_kind: 'owner_receipt_contract',
    domain_id: 'med-autoscience',
  });
  writeJson(path.join(agentRepo, 'contracts/agent_lab_handoff.json'), {
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    external_suite_seed: {
      tasks: [{
        task_id: 'agent-lab-task:mas/production-evidence-tail',
        gate_id: 'production_evidence_tail',
        owner_route: 'MedAutoScience',
        required_return_shapes: ['owner_receipt', 'typed_blocker'],
      }],
    },
  });
  writeJson(path.join(agentRepo, 'contracts/production_acceptance/production-acceptance.json'), {
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    production_like_receipt_chain: { required_return_shapes: ['owner_receipt', 'typed_blocker'] },
    domain_acceptance_receipt: {
      owner_receipt_refs: [{ ref: 'contracts/owner_receipt_contract.json' }],
      progress_delta_refs: [{ ref: 'docs/status.md#current-evidence-tail' }],
      typed_blocker_refs: [],
      next_verification_command_refs: [{ ref: 'scripts/verify.sh' }],
    },
    authority_boundary: {
      no_forbidden_write_proof_refs: ['no-forbidden-write:med-autoscience/production-evidence-tail'],
    },
  });
}

function writeReviewerEvaluation(filePath: string): void {
  writeJson(filePath, {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/mas/pass4',
    execution_attempt_ref: 'attempt:executor/mas/pass4',
    review_attempt_ref: 'attempt:ai-reviewer/mas/pass4',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'Production evidence tail needs refs-only owner routing.',
    suggestions: ['Submit a Foundry Lab work order without writing target truth.'],
    source_refs: ['contracts/agent_lab_handoff.json'],
    direct_evidence_refs: ['contracts/production_acceptance/production-acceptance.json'],
    verdict: 'requires_foundry_lab_evaluation',
    predicted_impact: 'The work order keeps execution and ledgers in Foundry Lab.',
    provenance: { artifact_ref: 'artifact-ref:mas/pass4-review', created_by: 'test-fixture' },
  });
}

function runMaterializer(args: string[]) {
  return spawnSync(
    process.execPath,
    [path.join(repoRoot, 'scripts/lib/agent-evidence-materializer.ts'), ...args],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
}

test('agent:evidence emits a thin foundry semantic request only', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-agent-evidence-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeTargetAgentFixture(agentRepo);
    writeReviewerEvaluation(reviewerPath);

    const result = runMaterializer([
      '--agent-repo', agentRepo,
      '--ai-reviewer-evaluation', reviewerPath,
    ]);
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    const materializationRequest = payload.semantic_requests.work_order_materialization_request;
    const evaluationRequest = materializationRequest.semantic_request;
    assert.equal(payload.status, 'foundry_evaluation_semantic_request_ready_for_opl_materialization');
    assertMatchesJsonSchema(
      'contracts/schemas/opl-work-order-materialization-request.v2.schema.json',
      materializationRequest,
    );
    assert.equal(materializationRequest.request_kind, 'foundry_evaluation');
    assert.equal(materializationRequest.request_owner, 'oma');
    assert.equal(materializationRequest.producer_agent_id, 'oma');
    assert.equal(materializationRequest.target_agent.target_agent_ref, 'target-agent:med-autoscience');
    assert.equal(
      materializationRequest.target_agent.descriptor_ref,
      path.join(agentRepo, 'contracts/domain_descriptor.json'),
    );
    assert.equal(evaluationRequest.suite_kind, 'agent_production_evidence_suite');
    assert.equal(evaluationRequest.task_intents[0].domain_id, 'opl-meta-agent');
    assert.equal(Object.hasOwn(evaluationRequest, 'work_order_id'), false);
    assert.equal(Object.hasOwn(evaluationRequest.task_intents[0], 'environment'), false);
    assert.equal(materializationRequest.authority_boundary.producer_assigns_work_order_id, false);
    assert.equal(materializationRequest.authority_boundary.producer_executes_work_order, false);
    assert.equal(materializationRequest.authority_boundary.producer_writes_work_order_receipt, false);
    assert.equal(fs.readdirSync(outputRoot).includes('out'), false);
    assert.deepEqual(Object.keys(payload.semantic_requests), ['work_order_materialization_request']);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('agent:evidence projects an expected blocker ref instead of writing a blocker body', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-agent-evidence-missing-reviewer-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    writeTargetAgentFixture(agentRepo);
    const result = runMaterializer(['--agent-repo', agentRepo]);
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    assert.equal(
      payload.status,
      'foundry_evaluation_semantic_request_ready_reviewer_evidence_missing',
    );
    assert.match(payload.agent_building_judgment.expected_typed_blocker_ref, /^expected-typed-blocker-ref:/);
    const request = payload.semantic_requests.work_order_materialization_request;
    assert.equal(request.semantic_request.reviewer_refs.length, 0);
    assert.equal(request.authority_boundary.producer_executes_work_order, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

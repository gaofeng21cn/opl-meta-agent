import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  parseJsonText,
  readJsonFile as readJson,
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

test('agent:evidence emits suite seed, candidate, and Foundry Lab work order only', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-agent-evidence-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeTargetAgentFixture(agentRepo);
    writeReviewerEvaluation(reviewerPath);

    const result = runMaterializer([
      '--agent-repo', agentRepo,
      '--output-dir', outputDir,
      '--ai-reviewer-evaluation', reviewerPath,
    ]);
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    const workOrder = readJson(path.join(outputDir, 'foundry-lab-work-order.json'));
    const suiteSeed = readJson(path.join(outputDir, 'agent-lab-suite-seed.json'));
    assert.equal(payload.status, 'foundry_lab_evaluation_candidate_ready_for_opl_foundry_lab');
    assert.equal(workOrder.work_order_kind, 'target_agent_production_evidence_evaluation');
    assert.equal(workOrder.status, 'ready_for_opl_foundry_lab_evaluation');
    assert.equal(workOrder.consumer_dependency.status, 'available');
    assert.equal(workOrder.target_agent.target_agent_ref, 'target-agent:med-autoscience');
    assert.equal(
      workOrder.target_agent.descriptor_ref,
      path.join(agentRepo, 'contracts/domain_descriptor.json'),
    );
    assert.equal(suiteSeed.target_agent_ref, 'target-agent:med-autoscience');
    assert.equal(suiteSeed.target_agent_descriptor_ref, path.join(agentRepo, 'contracts/domain_descriptor.json'));
    assert.deepEqual(suiteSeed.evaluation_target_agent, {
      domain_id: 'med-autoscience',
      target_agent_ref: 'target-agent:med-autoscience',
      descriptor_ref: path.join(agentRepo, 'contracts/domain_descriptor.json'),
    });
    assert.equal(suiteSeed.tasks[0].domain_id, 'opl-meta-agent');
    assert.equal(workOrder.authority_boundary.oma_can_execute_agent_lab_suite, false);
    assert.equal(suiteSeed.seed_status, 'declarative_seed_candidate_waiting_for_foundry_lab_consumer');
    assert.equal(fs.existsSync(path.join(outputDir, 'agent-lab-run-result.json')), false);
    assert.equal(fs.existsSync(path.join(outputDir, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputDir, 'typed-blocker.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('agent:evidence projects an expected blocker ref instead of writing a blocker body', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-agent-evidence-missing-reviewer-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    writeTargetAgentFixture(agentRepo);
    const result = runMaterializer(['--agent-repo', agentRepo, '--output-dir', outputDir]);
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    assert.equal(
      payload.status,
      'foundry_lab_evaluation_candidate_ready_reviewer_evidence_missing',
    );
    assert.match(payload.agent_building_judgment.expected_typed_blocker_ref, /^expected-typed-blocker-ref:/);
    assert.equal(fs.existsSync(path.join(outputDir, 'typed-blocker.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

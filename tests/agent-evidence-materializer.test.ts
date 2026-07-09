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

function writeFakeOplBin(filePath: string): void {
  fs.writeFileSync(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const suitePath = process.argv[process.argv.indexOf('--suite') + 1];
const suite = JSON.parse(fs.readFileSync(suitePath, 'utf8'));
process.stdout.write(JSON.stringify({
  agent_lab_run: {
    suite_path: suitePath,
    suite_result: {
      result_id: 'fake-agent-lab-result:' + path.basename(suitePath),
      suite_kind: suite.suite_kind,
      status: suite.ai_reviewer_evaluation_ref ? 'passed' : 'blocked',
      summary: { recovery_probe_count: 1, recovery_passed_count: 1, forbidden_authority_flag_count: 0 }
    }
  }
}, null, 2) + '\\n');
`,
  );
  fs.chmodSync(filePath, 0o755);
}

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
      tasks: [
        {
          task_id: 'agent-lab-task:mas/production-evidence-tail',
          gate_id: 'production_evidence_tail',
          owner_route: 'MedAutoScience',
          required_return_shapes: ['owner_receipt', 'typed_blocker'],
        },
      ],
    },
  });
  writeJson(path.join(agentRepo, 'contracts/production_acceptance/production-acceptance.json'), {
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    production_like_receipt_chain: {
      required_return_shapes: ['owner_receipt', 'typed_blocker'],
    },
    domain_acceptance_receipt: {
      owner_receipt_refs: [{ ref: 'contracts/owner_receipt_contract.json' }],
      progress_delta_refs: [{ ref: 'docs/status.md#current-evidence-tail' }],
      typed_blocker_refs: [],
      next_verification_command_refs: [{ ref: 'scripts/verify.sh' }],
    },
    authority_boundary: {
      domain_ready_requires_owner_receipt_or_typed_blocker: true,
      quality_or_export_ready_requires_target_owner_gate: true,
      artifact_mutation_requires_owner_receipt: true,
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
    critique: 'Production evidence tail needs refs-only owner-route and no-forbidden-write proof.',
    suggestions: ['Emit a proposal without writing target truth or owner receipts.'],
    source_refs: ['contracts/agent_lab_handoff.json'],
    direct_evidence_refs: ['contracts/production_acceptance/production-acceptance.json'],
    verdict: 'blocked_requires_developer_patch',
    predicted_impact: 'The proposal should expose missing owner-route refs without readiness claims.',
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

test('agent:evidence emits refs-only proposal and work order without target authority', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-agent-evidence-pass4-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const fakeOpl = path.join(outputRoot, 'opl');
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeTargetAgentFixture(agentRepo);
    writeFakeOplBin(fakeOpl);
    writeReviewerEvaluation(reviewerPath);

    const result = runMaterializer([
      '--agent-repo',
      agentRepo,
      '--output-dir',
      outputDir,
      '--opl-bin',
      fakeOpl,
      '--ai-reviewer-evaluation',
      reviewerPath,
    ]);
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    const workOrder = readJson(path.join(outputDir, 'developer-patch-work-order.json'));
    assert.equal(payload.status, 'proposal_recorded_requires_target_owner_gate');
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch_proposal');
    assert.equal(workOrder.source_morphology_proof.consumed_as_refs_only, true);
    assert.equal(workOrder.private_residue_decision.target_truth_write_authorized, false);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(workOrder.authority_boundary.can_authorize_target_quality_or_export, false);
    assert.equal(fs.existsSync(path.join(outputDir, 'mechanism-patch-proposal.json')), true);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('agent:evidence writes typed blocker when reviewer evidence is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-agent-evidence-blocker-pass4-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const fakeOpl = path.join(outputRoot, 'opl');
    writeTargetAgentFixture(agentRepo);
    writeFakeOplBin(fakeOpl);

    const result = runMaterializer([
      '--agent-repo',
      agentRepo,
      '--output-dir',
      outputDir,
      '--opl-bin',
      fakeOpl,
    ]);
    assert.equal(result.status, 0, result.stderr);
    const payload = parseJsonText(result.stdout);
    const blocker = readJson(path.join(outputDir, 'typed-blocker.json'));
    assert.equal(payload.status, 'blocked_missing_ai_reviewer_evaluation');
    assert.equal(blocker.authority_boundary.no_delivery_receipt_signed, true);
    assert.equal(blocker.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(fs.existsSync(path.join(outputDir, 'mechanism-patch-proposal.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

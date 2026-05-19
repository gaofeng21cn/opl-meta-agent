import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runNode(args, oplBin) {
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      OPL_BIN: oplBin,
    },
  });
}

test('opl-meta-agent takes over testing for an existing external agent without authority writes or default promotion', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-'));
  const bootstrapRoot = path.join(outputRoot, 'bootstrap');
  const takeoverRoot = path.join(outputRoot, 'takeover');
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const bootstrap = runNode([
      path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
      '--output-dir',
      bootstrapRoot,
      '--opl-bin',
      oplBin,
    ], oplBin);
    assert.equal(bootstrap.status, 0, bootstrap.stderr);

    const targetDir = path.join(bootstrapRoot, 'sample-brief-agent');
    const takeover = runNode([
      path.join(repoRoot, 'scripts/takeover-agent.ts'),
      '--agent-dir',
      targetDir,
      '--output-dir',
      takeoverRoot,
      '--opl-bin',
      oplBin,
    ], oplBin);
    assert.equal(takeover.status, 0, takeover.stderr);

    const payload = JSON.parse(takeover.stdout);
    assert.equal(payload.surface_kind, 'opl_meta_agent_takeover_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.takeover_policy.external_opl_compatible_agents_allowed, true);
    assert.equal(payload.takeover_policy.can_write_target_domain_truth, false);
    assert.equal(payload.takeover_policy.can_write_target_memory_body, false);
    assert.equal(payload.takeover_policy.can_promote_default_agent_without_gate, false);
    assert.equal(payload.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.mechanism_ref, 'mechanism:opl-meta-agent/sample-brief-agent/testing-takeover-loop');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.status, 'proposal_recorded_requires_explicit_gate');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.observe.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.diagnose.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/takeover');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.edit.next_mechanism_candidate_ref, payload.learning_loop.online_learning_candidate.candidate_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_promote_default_agent_without_gate, false);

    const suite = readJson(path.join(takeoverRoot, 'agent-lab-takeover-suite.json'));
    assert.equal(suite.suite_kind, 'agent_lab_external_suite');
    assert.equal(suite.authority_boundary.can_write_memory_body, false);
    assert.equal(suite.authority_boundary.can_promote_default_agent_without_gate, false);
    assert.equal(suite.tasks[0].task_family, 'agent_testing_takeover');
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);
    assert.equal(suite.tasks[0].promotion_gate.gate_status, 'passed');

    const receipt = readJson(path.join(takeoverRoot, 'takeover-receipt.json'));
    assert.equal(receipt.receipt_class, 'testing_takeover_self_evolution_receipt');
    assert.equal(receipt.acceptance_gates.agent_lab_suite_passed, true);
    assert.equal(receipt.acceptance_gates.online_learning_candidate_gated, true);
    assert.equal(receipt.acceptance_gates.no_memory_body_written, true);
    assert.equal(receipt.acceptance_gates.no_default_promotion, true);
    assert.equal(receipt.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(receipt.authority_boundary.can_promote_default_agent_without_gate, false);

    const learning = readJson(path.join(takeoverRoot, 'takeover-online-learning-candidate.json'));
    assert.equal(learning.candidate_kind, 'gated_self_evolution');
    assert.equal(learning.status, 'candidate_recorded_requires_explicit_gate');
    assert.equal(learning.online_learning_policy.can_promote_without_gate, false);
    assert.equal(learning.online_learning_policy.can_write_domain_memory_body, false);
    assert.equal(learning.online_learning_policy.can_train_or_deploy_model_weights, false);
    assert.deepEqual(learning.source_refs, [
      payload.opl_agent_lab.suite_result.result_id,
      receipt.receipt_id,
    ]);

    const mechanism = readJson(path.join(takeoverRoot, 'takeover-mechanism-patch-proposal.json'));
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.version, 'opl-meta-agent.mechanism-patch-proposal.v1');
    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/sample-brief-agent/testing-takeover-loop');
    assert.ok(mechanism.editable_surfaces.includes('agent_lab_suite_policy_ref'));
    assert.ok(mechanism.editable_surfaces.includes('takeover_review_policy_ref'));
    assert.equal(mechanism.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/takeover');
    assert.equal(mechanism.next_mechanism_candidate_ref, learning.candidate_id);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

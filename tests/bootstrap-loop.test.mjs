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

test('opl-meta-agent bootstraps a sample agent and validates it through OPL Agent Lab', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-'));
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.mjs'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);

    assert.equal(payload.surface_kind, 'opl_meta_agent_self_learning_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.product_id, 'opl-meta-agent');
    assert.equal(payload.meta_agent_kind, 'opl_compatible_meta_agent');
    assert.equal(payload.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.equal(payload.learning_loop.online_learning_policy.can_promote_without_gate, false);
    assert.equal(payload.learning_loop.online_learning_policy.can_train_or_deploy_model_weights, false);

    const targetDir = path.join(outputRoot, 'sample-brief-agent');
    const suitePath = path.join(outputRoot, 'agent-lab-suite.json');
    const receiptPath = path.join(outputRoot, 'baseline-delivery-receipt.json');
    const learningPath = path.join(outputRoot, 'online-learning-candidate.json');
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/domain_descriptor.json')), true);
    assert.equal(fs.existsSync(suitePath), true);
    assert.equal(fs.existsSync(receiptPath), true);
    assert.equal(fs.existsSync(learningPath), true);

    const suite = readJson(suitePath);
    assert.equal(suite.suite_id, 'opl-meta-agent-self-bootstrap-suite');
    assert.equal(suite.tasks[0].domain_id, 'opl-meta-agent');
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);

    const receipt = readJson(receiptPath);
    assert.equal(receipt.receipt_class, 'baseline_delivery_receipt');
    assert.equal(receipt.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(receipt.agent_lab_result_ref, payload.opl_agent_lab.suite_result.result_id);

    const learning = readJson(learningPath);
    assert.equal(learning.candidate_kind, 'rubric_gap');
    assert.deepEqual(learning.source_refs, [
      payload.opl_agent_lab.suite_result.result_id,
      receipt.receipt_id,
    ]);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

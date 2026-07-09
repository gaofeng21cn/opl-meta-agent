import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import type { JsonObject } from './support/contracts.ts';
import {
  oplBin,
  readJsonFile as readJson,
  repoRoot,
  writeJsonFile as writeJson,
} from './support/contracts.ts';
import {
  buildBlockedMedicalManuscriptSuite,
  runImproveArgs,
  writeTargetDescriptor,
  writeAiReviewerEvaluation,
  writeMedicalTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

function writeFakeOplBin(filePath: string, logPath: string): void {
  fs.writeFileSync(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs');
const argv = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(logPath)}, JSON.stringify({ argv }, null, 2) + '\\n');
const workOrder = JSON.parse(fs.readFileSync(argv[argv.indexOf('--work-order') + 1], 'utf8'));
process.stdout.write(JSON.stringify({
  surface_kind: 'opl_work_order_execute_result',
  status: 'delegated',
  delegated_work_order_ref: workOrder.work_order_id,
  primitive_owner: 'one-person-lab/OPL',
  target_worktree_lifecycle_owner: 'one-person-lab/OPL',
  closeout_refs: {
    target_owner_receipt_or_typed_blocker_ref: workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
    patch_absorption_ref: workOrder.machine_closeout_refs.patch_absorption_ref,
    worktree_cleanup_ref: workOrder.machine_closeout_refs.worktree_cleanup_ref,
    agent_lab_re_evaluation_ref: workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref
  }
}, null, 2) + '\\n');
`,
  );
  fs.chmodSync(filePath, 0o755);
}

function buildWorkOrderFixture(prefix: string): {
  outputRoot: string;
  workOrderPath: string;
} {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const targetAgentDir = path.join(outputRoot, 'med-autoscience');
  const suitePath = path.join(outputRoot, 'medical-suite.json');
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  writeTargetDescriptor(targetAgentDir);
  writeMedicalTargetImprovementPolicy(targetAgentDir);
  writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
  writeAiReviewerEvaluation(reviewerEvaluationPath);
  const payload = runImproveArgs([
    '--suite',
    suitePath,
    '--target-agent-dir',
    targetAgentDir,
    '--output-dir',
    outputRoot,
    '--feedback-ref',
    'manual-review:pass4-smoke',
    '--ai-reviewer-evaluation',
    reviewerEvaluationPath,
    '--opl-bin',
    oplBin,
  ]);
  return { outputRoot, workOrderPath: String(payload.artifacts.developer_patch_work_order_path) };
}

function runExecute(workOrderPath: string, outputPath: string, oplPath: string) {
  return spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      path.join(repoRoot, 'scripts/execute-external-work-order.ts'),
      '--work-order',
      workOrderPath,
      '--output',
      outputPath,
      '--opl-bin',
      oplPath,
    ],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
}

test('execute external work order delegates to OPL without owning target lifecycle', () => {
  const fixture = buildWorkOrderFixture('oma-execute-work-order-pass4-');
  try {
    const fakeOpl = path.join(fixture.outputRoot, 'opl');
    const logPath = path.join(fixture.outputRoot, 'opl-argv.json');
    const outputPath = path.join(fixture.outputRoot, 'execution-result.json');
    writeFakeOplBin(fakeOpl, logPath);

    const result = runExecute(fixture.workOrderPath, outputPath, fakeOpl);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const payload = readJson(outputPath);
    assert.equal(payload.status, 'delegated_to_opl_work_order_primitive');
    assert.equal(payload.oma_target_worktree_lifecycle_owner, false);
    assert.equal(payload.oma_can_write_owner_receipt, false);
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.opl_result_currentness.closeout_refs_verified, true);
    assert.deepEqual(readJson(logPath).argv.slice(0, 4), [
      'work-order',
      'execute',
      '--work-order',
      fixture.workOrderPath,
    ]);
  } finally {
    fs.rmSync(fixture.outputRoot, { recursive: true, force: true });
  }
});

test('execute external work order rejects stale owner-route currentness before delegation', () => {
  const fixture = buildWorkOrderFixture('oma-execute-work-order-invalid-pass4-');
  try {
    const workOrder = readJson(fixture.workOrderPath);
    delete ((workOrder.work_order_currentness as JsonObject).provider_owner_route_index_evidence);
    const badPath = path.join(fixture.outputRoot, 'bad-work-order.json');
    writeJson(badPath, workOrder);

    const result = runExecute(badPath, path.join(fixture.outputRoot, 'out.json'), path.join(fixture.outputRoot, 'unused-opl'));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /provider_owner_route_index_evidence/);
  } finally {
    fs.rmSync(fixture.outputRoot, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import type { JsonObject } from './support/contracts.ts';
import { readJsonFile as readJson, repoRoot, writeJsonFile as writeJson } from './support/contracts.ts';
import {
  buildExternalSuite,
  runImproveFromSuite,
  withOutputRoot,
  writeAiReviewerEvaluation,
  writeTargetDescriptor,
  writeTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

function buildWorkOrder(outputRoot: string): string {
  const targetAgentDir = path.join(outputRoot, 'med-autoscience');
  const suitePath = path.join(outputRoot, 'suite.json');
  const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
  writeTargetDescriptor(targetAgentDir);
  writeTargetImprovementPolicy(targetAgentDir, {
    triggers: ['medical manuscript'],
    refs: ['quality_contract_ref:prediction_model_first_draft_quality'],
    paths: ['src/med_autoscience/policies/medical_reporting_checklist.py'],
  });
  writeJson(suitePath, buildExternalSuite({
    suiteId: 'mas-suite:high-quality-medical-manuscript',
    domainId: 'med-autoscience',
    taskFamily: 'high_quality_medical_manuscript_self_evolution',
    evidenceRefs: ['rubric-gap:mas/002/medical-manuscript'],
    feedbackRefs: ['feedback-ref:mas/002/manuscript-review'],
  }));
  writeAiReviewerEvaluation(reviewerEvaluationPath);
  const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
  return String(payload.artifacts.developer_patch_work_order_path);
}

function writeFakeOpl(filePath: string, logPath: string): void {
  fs.writeFileSync(filePath, `#!/usr/bin/env node
const fs = require('node:fs');
const argv = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(logPath)}, JSON.stringify(argv));
const workOrder = JSON.parse(fs.readFileSync(argv[argv.indexOf('--work-order') + 1], 'utf8'));
process.stdout.write(JSON.stringify({ status: 'delegated', closeout_refs: workOrder.machine_closeout_refs }));
`);
  fs.chmodSync(filePath, 0o755);
}

function runExecute(workOrderPath: string, outputPath: string, oplPath: string) {
  return spawnSync(process.execPath, [
    '--experimental-strip-types',
    path.join(repoRoot, 'scripts/execute-external-work-order.ts'),
    '--work-order', workOrderPath,
    '--output', outputPath,
    '--opl-bin', oplPath,
  ], { cwd: repoRoot, encoding: 'utf8' });
}

test('execute external work order delegates to OPL without owning target lifecycle', () => {
  withOutputRoot('oma-execute-work-order-', (outputRoot) => {
    const workOrderPath = buildWorkOrder(outputRoot);
    const outputPath = path.join(outputRoot, 'result.json');
    const logPath = path.join(outputRoot, 'opl-argv.json');
    const fakeOpl = path.join(outputRoot, 'opl');
    writeFakeOpl(fakeOpl, logPath);

    const result = runExecute(workOrderPath, outputPath, fakeOpl);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = readJson(outputPath);
    assert.equal(payload.status, 'delegated_to_opl_work_order_primitive');
    assert.equal(payload.oma_target_worktree_lifecycle_owner, false);
    assert.equal(payload.target_worktree_lifecycle_owner, 'one-person-lab/OPL');
    assert.equal(payload.opl_result_currentness.closeout_refs_verified, true);
    assert.deepEqual((readJson(logPath) as unknown as string[]).slice(0, 4), [
      'work-order', 'execute', '--work-order', workOrderPath,
    ]);
  });
});

test('execute external work order rejects stale owner-route currentness before delegation', () => {
  withOutputRoot('oma-execute-work-order-stale-', (outputRoot) => {
    const workOrder = readJson(buildWorkOrder(outputRoot));
    delete ((workOrder.work_order_currentness as JsonObject).provider_owner_route_index_evidence);
    const workOrderPath = path.join(outputRoot, 'stale-work-order.json');
    writeJson(workOrderPath, workOrder);

    const result = runExecute(workOrderPath, path.join(outputRoot, 'out.json'), path.join(outputRoot, 'unused-opl'));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /provider_owner_route_index_evidence/);
  });
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFakeOplBin(filePath: string, logPath: string): void {
  fs.writeFileSync(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs');
const argv = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(logPath)}, JSON.stringify({ argv }, null, 2) + '\\n');
if (argv[0] !== 'agent-lab' || argv[1] !== 'execute-work-order') {
  console.error('unexpected fake opl invocation: ' + argv.join(' '));
  process.exit(2);
}
const workOrderIndex = argv.indexOf('--work-order');
if (workOrderIndex === -1 || !argv[workOrderIndex + 1]) {
  console.error('missing --work-order');
  process.exit(2);
}
const workOrder = JSON.parse(fs.readFileSync(argv[workOrderIndex + 1], 'utf8'));
process.stdout.write(JSON.stringify({
  surface_kind: 'opl_agent_lab_execute_work_order_result',
  status: 'delegated',
  delegated_work_order_ref: workOrder.work_order_id,
  target_worktree_lifecycle_owner: 'OPL Agent Lab',
  oma_owned_target_worktree_lifecycle: false
}, null, 2) + '\\n');
`,
  );
  fs.chmodSync(filePath, 0o755);
}

function writeFakeGitBin(filePath: string): void {
  fs.writeFileSync(
    filePath,
    `#!/usr/bin/env node
const argv = process.argv.slice(2);
if (argv[0] === 'worktree') {
  console.error('OMA must not manage target worktree lifecycle: git ' + argv.join(' '));
  process.exit(17);
}
process.exit(0);
`,
  );
  fs.chmodSync(filePath, 0o755);
}

function buildWorkOrder(): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: 'oma_developer_patch_work_order_test',
    status: 'ready_for_target_agent_source_patch',
    target_agent: {
      domain_id: 'example-agent',
      repo_dir: '/tmp/example-agent',
    },
    executor_lease_ref: 'executor-lease:codex-cli/oma_developer_patch_work_order_test',
    reviewer_pool_refs: ['reviewer:example/direct-evidence'],
    patch_execution_bundle_ref: 'patch-execution-bundle:target-agent/example-agent/oma_developer_patch_work_order_test',
    target_closeout_refs: [
      'target-owner-receipt-or-typed-blocker:example-agent/oma_developer_patch_work_order_test',
      'worktree-cleanup:example-agent/oma_developer_patch_work_order_test/source-patch',
    ],
    work_order_completeness: {
      required_fields_present: true,
      target_verification: {
        required_refs: ['npm test'],
      },
      no_forbidden_write_proof: {
        required: true,
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_quality_or_export: false,
      },
    },
    version_management: {
      absorb_back_required: true,
      temporary_worktree_cleanup_required: true,
    },
    authority_boundary: {
      can_modify_target_agent_source_repo: true,
      can_modify_target_agent_tests: true,
      can_modify_target_agent_docs: true,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

test('execute external work order delegates execution and lifecycle to OPL Agent Lab', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-test-'));
  const fakeBinDir = path.join(tempDir, 'bin');
  fs.mkdirSync(fakeBinDir, { recursive: true });

  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const outputPath = path.join(tempDir, 'execution-result.json');
  const oplLogPath = path.join(tempDir, 'fake-opl-argv.json');
  const fakeOplPath = path.join(fakeBinDir, 'opl');
  const fakeGitPath = path.join(fakeBinDir, 'git');

  writeJson(workOrderPath, buildWorkOrder());
  writeFakeOplBin(fakeOplPath, oplLogPath);
  writeFakeGitBin(fakeGitPath);

  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      path.join(repoRoot, 'scripts/execute-external-work-order.ts'),
      '--work-order',
      workOrderPath,
      '--output',
      outputPath,
      '--opl-bin',
      fakeOplPath,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH ?? ''}`,
        NODE_NO_WARNINGS: '1',
      },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const oplInvocation = readJson(oplLogPath);
  assert.deepEqual(oplInvocation.argv, [
    'agent-lab',
    'execute-work-order',
    '--work-order',
    workOrderPath,
    '--json',
  ]);

  const payload = readJson(outputPath);
  assert.equal(payload.surface_kind, 'opl_meta_agent_external_work_order_execution_delegation');
  assert.equal(payload.status, 'delegated_to_opl_agent_lab');
  assert.equal(payload.oma_target_worktree_lifecycle_owner, false);
  assert.equal(payload.owner_closeout_hook_delegated, true);
  assert.equal(payload.oma_can_write_owner_receipt, false);
  assert.equal(payload.target_owner_closeout_owner, 'target-domain via OPL');
  assert.equal(payload.opl_agent_lab_command.command, 'agent-lab execute-work-order');
  assert.deepEqual(payload.opl_agent_lab_command.args, oplInvocation.argv);
  assert.equal(payload.work_order_ref, 'oma_developer_patch_work_order_test');
  assert.equal(payload.opl_result.target_worktree_lifecycle_owner, 'OPL Agent Lab');
});

test('execute external work order rejects non Codex CLI leases before delegation', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-lease-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  writeJson(workOrderPath, {
    ...buildWorkOrder(),
    executor_lease_ref: 'executor-lease:other-runner/oma_developer_patch_work_order_test',
  });

  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      path.join(repoRoot, 'scripts/execute-external-work-order.ts'),
      '--work-order',
      workOrderPath,
      '--opl-bin',
      path.join(tempDir, 'opl-not-called'),
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_NO_WARNINGS: '1',
      },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /executor_lease_ref must be a Codex CLI lease/);
});

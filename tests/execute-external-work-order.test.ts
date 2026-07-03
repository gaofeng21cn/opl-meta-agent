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
if (argv[0] !== 'work-order' || argv[1] !== 'execute') {
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
  surface_kind: 'opl_work_order_execute_result',
  status: 'delegated',
  delegated_work_order_ref: workOrder.work_order_id,
  primitive_owner: 'one-person-lab/OPL',
  target_worktree_lifecycle_owner: 'one-person-lab/OPL',
  oma_owned_target_worktree_lifecycle: false,
  closeout_refs: {
    target_owner_receipt_or_typed_blocker_ref: 'target-owner-receipt-or-typed-blocker:example-agent/oma_developer_patch_work_order_test',
    patch_absorption_ref: 'patch-absorption:example-agent/oma_developer_patch_work_order_test/source-patch',
    worktree_cleanup_ref: 'worktree-cleanup:example-agent/oma_developer_patch_work_order_test/source-patch',
    agent_lab_re_evaluation_ref: 'agent-lab-re-evaluation:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test'
  }
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
  const targetCloseoutRefs = [
    'target-owner-receipt-or-typed-blocker:example-agent/oma_developer_patch_work_order_test',
    'worktree-cleanup:example-agent/oma_developer_patch_work_order_test/source-patch',
    'patch-absorption:example-agent/oma_developer_patch_work_order_test/source-patch',
    'agent-lab-re-evaluation:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test',
  ];
  const primitiveRefs = {
    work_order_readiness_primitive_ref:
      'opl-work-order-primitive:work-order-readiness/example-agent/oma_developer_patch_work_order_test/source-patch',
    promotion_readiness_primitive_ref:
      'opl-work-order-primitive:promotion-readiness/example-agent/oma_developer_patch_work_order_test/source-patch',
    promotion_gate_projection_ref:
      'opl-work-order-primitive:promotion-gate-projection/example-agent/oma_developer_patch_work_order_test/source-patch',
    owner_gated_promotion_projection_ref:
      'opl-work-order-primitive:owner-gated-promotion-projection/example-agent/oma_developer_patch_work_order_test/source-patch',
    target_owner_return_primitive_ref:
      'opl-work-order-primitive:target-owner-return/example-agent/oma_developer_patch_work_order_test',
    patch_traceability_primitive_ref:
      'opl-work-order-primitive:patch-traceability/example-agent/oma_developer_patch_work_order_test/source-patch',
    readiness_projection_ref:
      'opl-work-order-readiness-projection:example-agent/oma_developer_patch_work_order_test/source-patch',
    owner: 'one-person-lab',
    consumed_as_refs_only_by_oma: true,
  };
  const delegationAperture = {
    delegates_to_opl_work_order_execute: true,
    primitive_owner: 'one-person-lab/OPL',
    command: 'work-order execute',
    executor_first: true,
    executor: 'codex_cli',
    executor_lease_ref: 'executor-lease:codex-cli/oma_developer_patch_work_order_test',
    patch_execution_bundle_ref: 'patch-execution-bundle:target-agent/example-agent/oma_developer_patch_work_order_test',
    target_owner_closeout_refs: targetCloseoutRefs,
    owner_closeout_hook_delegated: true,
    target_owner_closeout_owner: 'target-domain via OPL',
    oma_can_manage_target_worktree_lifecycle: false,
    oma_can_write_owner_receipt_body: false,
    required_opl_work_order_primitive_refs: primitiveRefs,
    authority_boundary: {
      can_manage_target_worktree_lifecycle: false,
      can_absorb_target_branch: false,
      can_clean_target_worktree: false,
      can_invoke_target_owner_closeout_hook: false,
      can_write_target_owner_receipt_body: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
  };
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: 'oma_developer_patch_work_order_test',
    status: 'ready_for_target_agent_source_patch',
    target_agent: {
      domain_id: 'example-agent',
      repo_dir: '/tmp/example-agent',
    },
    source_agent_lab_result_ref: 'agent-lab-result-ref',
    source_external_suite_intake: {
      surface_kind: 'opl_meta_agent_external_agent_lab_suite_intake',
      status: 'accepted_external_agent_lab_suite_input',
      suite_id: 'agent-lab-suite:example-agent/source-patch',
      suite_kind: 'agent_lab_external_suite',
      accepted_input_profiles: ['target_agent_feedback_external_suite'],
      task_families: ['source_patch_feedback'],
      target_agent: 'example-agent',
      source_agent_lab_result_ref: 'agent-lab-result-ref',
      feedback_ref: 'feedback-ref:example-agent/source-patch',
      consumed_as_refs_only: true,
      authority_boundary: {
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_domain_quality_or_export: false,
        can_promote_default_agent_without_gate: false,
      },
    },
    executor_lease_ref: 'executor-lease:codex-cli/oma_developer_patch_work_order_test',
    reviewer_pool_refs: ['reviewer:example/direct-evidence'],
    reviewer_evidence_refs: ['reviewer:example/source', 'reviewer:example/direct-evidence'],
    ai_reviewer_evidence: {
      source_refs: ['reviewer:example/source'],
      direct_evidence_refs: ['reviewer:example/direct-evidence'],
    },
    ai_reviewer_scorecard: {
      verdict: 'blocked_requires_developer_patch',
    },
    ai_reviewer_review: {
      predicted_impact: 'The target agent source patch should close the observed capability gap.',
    },
    patch_execution_bundle_ref: 'patch-execution-bundle:target-agent/example-agent/oma_developer_patch_work_order_test',
    target_closeout_refs: targetCloseoutRefs,
    target_owner_closeout_refs: targetCloseoutRefs,
    required_opl_work_order_primitive_refs: primitiveRefs,
    opl_work_order_delegation_aperture: delegationAperture,
    owner_route_refs: ['target-agent-owner:example-agent'],
    failure_evidence_refs: ['reviewer:example/direct-evidence'],
    matched_capability_ids: ['example-agent.source-patch-capability'],
    canonical_target_paths: ['src/example-agent/source-patch.ts'],
    failure_token_registry_refs: ['failure-token-registry:example-agent/source-patch'],
    improvement_tokens: ['source-patch-capability'],
    forbidden_target_paths_or_surfaces: ['target domain truth surfaces'],
    required_verification_refs: ['npm test'],
    rollback_version_refs: ['target_agent_previous_head_ref'],
    no_forbidden_write_proof: {
      required: true,
      proof_refs: ['no_target_domain_truth_write_proof'],
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    owner_closeout_boundary: {
      owner: 'target-domain via OPL',
      owner_closeout_hook_delegated: true,
      target_owner_receipt_or_typed_blocker_required: true,
      target_owner_closeout_refs: targetCloseoutRefs,
      oma_can_write_target_owner_receipt_body: false,
      oma_can_write_target_owner_typed_blocker_body: false,
      oma_can_create_target_typed_blocker: false,
      oma_can_invoke_target_owner_closeout_hook: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    ahe_developer_work_order: {
      failure_evidence: ['reviewer:example/direct-evidence'],
      root_cause: 'The target agent capability gap requires an owner-gated source patch.',
      targeted_fix: ['target-agent-change-ref:example'],
      predicted_impact: 'The target agent source patch should close the observed capability gap.',
    },
    work_order_currentness: {
      target_agent_id: 'example-agent',
      eval_result_ref: 'agent-lab-result-ref',
      work_order_ref: 'oma_developer_patch_work_order_test',
      owner_route_ref: 'target-agent-owner:example-agent',
      provider_owner_route_index_evidence: {
        provider: 'opl_work_order_execute',
        owner_route_index_ref: 'owner-route-index:example-agent/oma_developer_patch_work_order_test',
        owner_route_ledger_ref: 'owner-route-ledger:example-agent/oma_developer_patch_work_order_test',
        stage_attempt_ledger_ref: 'stage-attempt-ledger:example-agent/oma_developer_patch_work_order_test',
        route_binding_ref:
          'route-binding:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test',
        target_eval_work_order_owner_route_tuple:
          'example-agent|agent-lab-result-ref|oma_developer_patch_work_order_test|target-agent-owner:example-agent',
        derived_from_current_opl_route_ledger: true,
        fail_closed_without_route_or_ledger_proof: true,
      },
    },
    target_progress_accounting: {
      progress_delta_classification: 'mixed',
      deliverable_progress_delta: {
        count: 1,
        refs: ['target-agent-change-ref:example'],
        domain_alias: 'target_agent_substantive_delta',
      },
      platform_repair_delta: {
        count: 5,
        refs: [
          'no_target_domain_truth_write_proof',
          'target-owner-receipt-or-typed-blocker:example-agent/oma_developer_patch_work_order_test',
          'patch-absorption:example-agent/oma_developer_patch_work_order_test/source-patch',
          'worktree-cleanup:example-agent/oma_developer_patch_work_order_test/source-patch',
          'agent-lab-re-evaluation:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test',
        ],
        domain_alias: 'platform_interface_repair_delta',
      },
      excluded_from_substantive_deliverable_progress_refs: [],
      non_substantive_progress_ref_kinds: [
        'platform_interface_repair',
        'closeout_plumbing',
        'patch_absorption',
        'worktree_cleanup',
        'agent_lab_re_evaluation',
        'currentness_repair',
        'refs_only_ledger_work',
      ],
      accounting_policy: 'deliverable_delta_is_not_closed_by_platform_interface_repair',
    },
    work_order_completeness: {
      required_fields_present: true,
      executor_lease_ref: 'executor-lease:codex-cli/oma_developer_patch_work_order_test',
      executor_aperture: {
        executor_lease_ref: 'executor-lease:codex-cli/oma_developer_patch_work_order_test',
      },
      reviewer_refs: ['reviewer:example/direct-evidence'],
      reviewer_pool_refs: ['reviewer:example/direct-evidence'],
      patch_execution_bundle_ref: 'patch-execution-bundle:target-agent/example-agent/oma_developer_patch_work_order_test',
      target_closeout_refs: targetCloseoutRefs,
      reviewer_evidence: {
        refs: ['reviewer:example/source', 'reviewer:example/direct-evidence'],
      },
      opl_work_order_delegation_aperture: delegationAperture,
      patch_traceability: {
        matrix_ref: 'oma_developer_patch_work_order_test#/patch_traceability_matrix',
      },
      target_verification: {
        required_refs: ['npm test'],
      },
      owner_route: {
        route_refs: ['target-agent-owner:example-agent'],
      },
      no_forbidden_write_proof: {
        required: true,
        proof_refs: ['no_target_domain_truth_write_proof'],
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_quality_or_export: false,
      },
      canary_refs: ['canary:example-agent/source-patch'],
      rollback_refs: ['target_agent_previous_head_ref'],
      version_refs: ['target_agent_current_head_ref'],
      fail_closed_blocker_ref:
        'typed-blocker:opl-meta-agent/example-agent/oma_developer_patch_work_order_test/missing-required-work-order-field',
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

test('execute external work order delegates execution and lifecycle to the OPL work-order primitive', () => {
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
    'work-order',
    'execute',
    '--work-order',
    workOrderPath,
    '--json',
  ]);

  const payload = readJson(outputPath);
  assert.equal(payload.surface_kind, 'opl_meta_agent_external_work_order_execution_delegation');
  assert.equal(payload.status, 'delegated_to_opl_work_order_primitive');
  assert.equal(payload.oma_target_worktree_lifecycle_owner, false);
  assert.equal(payload.owner_closeout_hook_delegated, true);
  assert.equal(payload.oma_can_write_owner_receipt, false);
  assert.equal(payload.target_owner_closeout_owner, 'target-domain via OPL');
  assert.equal(payload.opl_work_order_command.command, 'work-order execute');
  assert.deepEqual(payload.opl_work_order_command.args, oplInvocation.argv);
  assert.equal(payload.work_order_ref, 'oma_developer_patch_work_order_test');
  assert.equal(payload.opl_result.primitive_owner, 'one-person-lab/OPL');
  assert.equal(payload.opl_result.target_worktree_lifecycle_owner, 'one-person-lab/OPL');
  assert.equal(
    payload.opl_result.closeout_refs.target_owner_receipt_or_typed_blocker_ref,
    'target-owner-receipt-or-typed-blocker:example-agent/oma_developer_patch_work_order_test',
  );
  assert.equal(payload.opl_result_currentness.closeout_refs_verified, true);
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

test('execute external work order rejects stale target currentness before delegation', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-currentness-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  writeJson(workOrderPath, {
    ...buildWorkOrder(),
    work_order_currentness: {
      target_agent_id: 'other-agent',
      eval_result_ref: 'agent-lab-result-ref',
      work_order_ref: 'oma_developer_patch_work_order_test',
      owner_route_ref: 'target-agent-owner:example-agent',
      provider_owner_route_index_evidence: {
        provider: 'opl_work_order_execute',
        owner_route_index_ref: 'owner-route-index:example-agent/oma_developer_patch_work_order_test',
        owner_route_ledger_ref: 'owner-route-ledger:example-agent/oma_developer_patch_work_order_test',
        stage_attempt_ledger_ref: 'stage-attempt-ledger:example-agent/oma_developer_patch_work_order_test',
        route_binding_ref:
          'route-binding:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test',
        target_eval_work_order_owner_route_tuple:
          'example-agent|agent-lab-result-ref|oma_developer_patch_work_order_test|target-agent-owner:example-agent',
        derived_from_current_opl_route_ledger: true,
        fail_closed_without_route_or_ledger_proof: true,
      },
    },
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
  assert.match(result.stderr, /work_order_currentness.target_agent_id/);
});

test('execute external work order rejects missing provider owner route ledger proof before delegation', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-route-proof-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  delete (workOrder.work_order_currentness as JsonObject).provider_owner_route_index_evidence;
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /provider_owner_route_index_evidence/);
});

test('execute external work order rejects platform-only refs counted as deliverable progress', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-platform-progress-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  workOrder.target_progress_accounting = {
    ...(workOrder.target_progress_accounting as JsonObject),
    progress_delta_classification: 'deliverable_progress',
    deliverable_progress_delta: {
      count: 1,
      refs: [
        'agent-lab-re-evaluation:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test',
      ],
      domain_alias: 'target_agent_substantive_delta',
    },
  };
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /platform-only repair refs cannot be counted as target-agent substantive deliverable progress/);
});

test('execute external work order rejects retired target progress alias fields', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-retired-progress-alias-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  workOrder.target_progress_accounting = {
    ...(workOrder.target_progress_accounting as JsonObject),
    substantive_deliverable_delta_refs: ['target-agent-change-ref:example'],
    platform_interface_repair_refs: [
      'agent-lab-re-evaluation:example-agent/agent-lab-result-ref/oma_developer_patch_work_order_test',
    ],
  };
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /retired target_progress_accounting alias field substantive_deliverable_delta_refs is not accepted/);
});

test('execute external work order rejects deliverable progress when platform repairs are also counted', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-classification-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  workOrder.target_progress_accounting = {
    ...(workOrder.target_progress_accounting as JsonObject),
    progress_delta_classification: 'deliverable_progress',
  };
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /deliverable_progress requires deliverable refs and no platform repair refs/);
});

test('execute external work order rejects platform repair when deliverable refs are also counted', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-platform-mixed-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  workOrder.target_progress_accounting = {
    ...(workOrder.target_progress_accounting as JsonObject),
    progress_delta_classification: 'platform_repair',
  };
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /platform_repair requires platform repair refs and no deliverable refs/);
});

test('execute external work order rejects typed blockers without next forced delta', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-typed-blocker-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  workOrder.target_progress_accounting = {
    ...(workOrder.target_progress_accounting as JsonObject),
    progress_delta_classification: 'typed_blocker',
    deliverable_progress_delta: {
      count: 0,
      refs: [],
      domain_alias: 'target_agent_substantive_delta',
    },
    platform_repair_delta: {
      count: 0,
      refs: [],
      domain_alias: 'platform_interface_repair_delta',
    },
    typed_blocker_lineage: {
      blocker_family: 'owner_closeout_required',
      study_id_or_domain_identity: 'example-agent',
      work_unit_id: 'oma_developer_patch_work_order_test',
      eval_id_or_review_ref: 'agent-lab-result-ref',
      source_fingerprint: 'sha256:example',
      repeat_count: 1,
      repeat_budget: {
        mechanism_repair_after_repeat_count: 2,
        human_gate_or_stop_loss_after_repeat_count: 3,
      },
      first_seen: '2026-05-31T00:00:00Z',
      last_seen: '2026-05-31T00:00:00Z',
      last_deliverable_delta: 'none',
      escalation_owner: 'target-agent-owner:example-agent',
      terminal: false,
    },
    next_allowed_action: 'repair_target_agent_source',
  };
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /typed_blocker requires target_progress_accounting.next_forced_delta/);
});

test('execute external work order rejects human gates counted as deliverable progress', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-human-gate-progress-test-'));
  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const workOrder = buildWorkOrder();
  workOrder.target_progress_accounting = {
    ...(workOrder.target_progress_accounting as JsonObject),
    progress_delta_classification: 'human_gate',
  };
  writeJson(workOrderPath, workOrder);

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
  assert.match(result.stderr, /human_gate must not carry deliverable progress refs/);
});

test('execute external work order rejects OPL result without closeout refs or typed blocker', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-opl-closeout-test-'));
  const fakeBinDir = path.join(tempDir, 'bin');
  fs.mkdirSync(fakeBinDir, { recursive: true });

  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const outputPath = path.join(tempDir, 'execution-result.json');
  const oplLogPath = path.join(tempDir, 'fake-opl-argv.json');
  const fakeOplPath = path.join(fakeBinDir, 'opl');

  writeJson(workOrderPath, buildWorkOrder());
  fs.writeFileSync(
    fakeOplPath,
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(${JSON.stringify(oplLogPath)}, JSON.stringify({ argv: process.argv.slice(2) }, null, 2) + '\\n');
process.stdout.write(JSON.stringify({
  surface_kind: 'opl_work_order_execute_result',
  status: 'delegated',
  delegated_work_order_ref: 'oma_developer_patch_work_order_test',
  primitive_owner: 'one-person-lab/OPL'
}, null, 2) + '\\n');
`,
  );
  fs.chmodSync(fakeOplPath, 0o755);

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

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /OPL work-order result must include target owner closeout, cleanup, absorption, Agent Lab re-evaluation refs, or typed blocker refs/);
});

test('execute external work order accepts OPL typed blocker refs as closed delegation result', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-execute-work-order-opl-blocker-test-'));
  const fakeBinDir = path.join(tempDir, 'bin');
  fs.mkdirSync(fakeBinDir, { recursive: true });

  const workOrderPath = path.join(tempDir, 'developer-patch-work-order.json');
  const outputPath = path.join(tempDir, 'execution-result.json');
  const oplLogPath = path.join(tempDir, 'fake-opl-argv.json');
  const fakeOplPath = path.join(fakeBinDir, 'opl');

  writeJson(workOrderPath, buildWorkOrder());
  fs.writeFileSync(
    fakeOplPath,
    `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(${JSON.stringify(oplLogPath)}, JSON.stringify({ argv: process.argv.slice(2) }, null, 2) + '\\n');
process.stdout.write(JSON.stringify({
  surface_kind: 'opl_work_order_execute_result',
  status: 'blocked_typed_blocker_returned',
  delegated_work_order_ref: 'oma_developer_patch_work_order_test',
  primitive_owner: 'one-person-lab/OPL',
  typed_blocker_refs: ['typed-blocker:target-agent/example-agent/owner-closeout-required']
}, null, 2) + '\\n');
`,
  );
  fs.chmodSync(fakeOplPath, 0o755);

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
  const payload = readJson(outputPath);
  assert.equal(payload.opl_result_currentness.closeout_refs_verified, false);
  assert.equal(payload.opl_result_currentness.typed_blocker_refs_present, true);
});

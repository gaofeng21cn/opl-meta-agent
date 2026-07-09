import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  repoRoot,
  readJson,
  readText,
  parseJsonText,
  asObjects,
  asStrings,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

const sourceStructureScripts: Record<string, string> = {
  'stage-control:check': 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --check',
  'stage-control:write': 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --write',
  'stage-control:split': 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --split',
  'source-structure': 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --advisory',
  'source-structure:json': 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --advisory --json',
  'source-structure:strict': 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict',
  'source-structure:strict:json': 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --json',
  'script-to-pack:readback': 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --script-to-pack-readback',
  'script-to-pack:readback:full': 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --script-to-pack-readback-full',
};

const sourceStructureFalseClaims = [
  'can_write_target_domain_truth',
  'can_write_target_owner_receipt_body',
  'can_claim_opl_primitive_parity',
  'can_claim_domain_ready',
  'can_claim_production_ready',
];

function runNpmJson(script: string, allowedStatuses = [0]): JsonObject {
  const result = spawnSync('npm', ['run', '--silent', script], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.ok(allowedStatuses.includes(result.status ?? -1), `${script}\n${result.stdout}\n${result.stderr}`);
  return parseJsonText(result.stdout);
}

function runNpmJsonFile(script: string, allowedStatuses = [0]): JsonObject {
  const outputPath = path.join('/tmp', `oma-${script.replace(/[^a-z0-9]+/gi, '-')}-${process.pid}.json`);
  const result = spawnSync('sh', ['-c', `npm run --silent ${script} > "${outputPath}"`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.ok(allowedStatuses.includes(result.status ?? -1), `${script}\n${result.stdout}\n${result.stderr}`);
  const payload = parseJsonText(fs.readFileSync(outputPath, 'utf8'));
  fs.rmSync(outputPath, { force: true });
  return payload;
}

function assertFalseClaims(boundary: JsonObject, fields = sourceStructureFalseClaims): void {
  fields.forEach((field) => assert.equal(boundary[field], false, `authority_boundary.${field}`));
}

function assertCleanupReadbackCore(payload: JsonObject, expected: {
  surfaceKind: string;
  commandRef: string;
  full: boolean;
}): void {
  assert.equal(payload.surface_kind, expected.surfaceKind);
  assert.equal(payload.command_ref, expected.commandRef);
  assert.equal(payload.readback_is_authority, false);
  assert.equal(payload.source_structure_gate.mode, 'strict');
  assert.equal(payload.source_structure_gate.line_budget.fail_on_over_budget, true);
  assert.equal(payload.cleanup_violation_count, 0);
  assert.equal(payload.cleanup_candidate_count, 0);
  assert.equal(payload.retained_current_count, 32);
  assert.equal(payload.retained_current_authority_function_count, 25);
  assert.equal(payload.retained_current_repo_native_surface_count, 7);
  assert.equal(payload.cleanup_apply_candidate_count, 0);
  assertFalseClaims(payload.authority_boundary as JsonObject, [
    'can_authorize_physical_delete',
    'can_claim_opl_primitive_parity',
    'can_claim_domain_ready',
    'can_claim_production_ready',
  ]);
  if (payload.ok) {
    assert.equal(payload.state, 'readback_available_cleanup_not_authorized');
    assert.equal(payload.violation_count, 0);
  } else {
    assert.equal(payload.state, 'failed_source_structure_gate');
    assert.ok(asStrings(payload.source_structure_gate.fail_reasons).includes('line_budget'));
  }
  assert.equal(Array.isArray(payload.cleanup_candidates), expected.full);
  assert.equal(payload.full_candidate_rows_omitted_from_default, expected.full ? undefined : true);
}

test('source-structure lanes are repo-native package and verify entrypoints without retired line-budget aliases', () => {
  const packageJson = readJson('package.json');
  const verifyScript = readText('scripts/verify.sh');
  const policy = readJson('contracts/source_structure_policy.json');
  const stageControlExemption = asObjects(policy.generated_aggregate_exemptions)
    .find((entry) => entry.aggregate_ref === 'contracts/stage_control_plane.json');

  Object.entries(sourceStructureScripts).forEach(([name, command]) => {
    assert.equal(packageJson.scripts[name], command);
  });
  assert.equal(packageJson.scripts['line-budget'], undefined);
  assert.equal(packageJson.scripts['line-budget:strict'], undefined);
  assert.deepEqual(asObjects(policy.compatibility_aliases), []);
  assert.ok(verifyScript.includes('structure)'));
  assert.ok(verifyScript.includes('structure:strict)'));
  assert.equal(verifyScript.includes('line-budget'), false);

  assert.equal(policy.surface_kind, 'opl_family_source_structure_policy');
  assert.equal(policy.lanes.advisory.fail_on_over_budget, false);
  assert.equal(policy.lanes.strict.fail_on_over_budget, true);
  assert.equal(policy.script_to_pack_receipt_guard.guard_id, 'oma.source_structure.script_to_pack_receipt_drift_guard.v1');
  assert.equal(policy.script_to_pack_receipt_guard.command_ref, 'npm run source-structure');
  assert.equal(policy.script_to_pack_receipt_guard.json_readback_command_ref, 'npm run source-structure:json');
  assert.equal(policy.script_to_pack_receipt_guard.cleanup_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(policy.script_to_pack_receipt_guard.full_cleanup_readback_command_ref, 'npm run script-to-pack:readback:full');
  assert.deepEqual(policy.script_to_pack_receipt_guard.cleanup_readback_required_fields, [
    'script_ref',
    'gate_id',
    'current_role',
    'classes',
    'active_caller_refs',
    'missing_evidence',
    'retained_current_rows',
    'retained_current_authority_functions',
    'retained_current_repo_native_surface_count',
    'owner_delta_route',
    'typed_blocker_ref_shape',
    'can_apply_cleanup',
  ]);
  assert.ok(asStrings(policy.script_to_pack_receipt_guard.fail_closed_conditions)
    .includes('cleanup_readback_retained_current_drift'));
  assertFalseClaims(policy.script_to_pack_receipt_guard.false_authority_boundary as JsonObject, [
    'guard_can_authorize_script_retirement',
    'guard_can_claim_opl_primitive_parity',
    'guard_can_write_target_domain_truth',
    'guard_can_write_target_owner_receipt_body',
    'guard_can_claim_target_agent_ready',
    'guard_can_claim_domain_ready',
    'guard_can_claim_production_ready',
  ]);
  assert.equal(stageControlExemption?.bundle_manifest_ref, 'contracts/stage_control_plane.bundle-manifest.json');
  assert.equal(stageControlExemption?.check_command, 'npm run stage-control:check');
  assert.deepEqual(asStrings(policy.scan_scope.path_prefixes), ['agent/', 'contracts/', 'runtime/', 'scripts/', 'tests/']);
});

test('stage control plane aggregate is generated from source parts and leaf index', () => {
  const aggregate = readJson('contracts/stage_control_plane.json');
  const source = readJson('contracts/stage_control_plane.source.json');
  const leafIndex = readJson('contracts/stage_control_plane.leaf-index.json');
  const stageIds = asObjects(aggregate.stages).map((stage) => String(stage.stage_id));

  assert.equal(source.surface_kind, 'family_stage_control_plane_source_contract');
  assert.equal(source.aggregate_ref, 'contracts/stage_control_plane.json');
  assert.equal(source.leaf_index_ref, 'contracts/stage_control_plane.leaf-index.json');
  assert.equal(source.maintenance_policy.aggregate_is_generated_consumer_surface, true);
  assert.equal(source.maintenance_policy.aggregate_consumers_continue_to_read, 'contracts/stage_control_plane.json');
  assert.deepEqual(asStrings(leafIndex.stage_order), stageIds);
  assert.deepEqual(asObjects(leafIndex.stages).map((entry) => entry.stage_id), stageIds);
  assert.deepEqual(asObjects(leafIndex.stage_native_artifact_contracts).map((entry) => entry.stage_id), stageIds);

  asObjects(leafIndex.stages).forEach((entry, index) => {
    assert.deepEqual(readJson(String(entry.ref)), asObjects(aggregate.stages)[index]);
  });
  asObjects(leafIndex.stage_native_artifact_contracts).forEach((entry, index) => {
    assert.deepEqual(readJson(String(entry.ref)), asObjects(aggregate.stage_native_artifact_contract.contracts)[index]);
  });
});

test('source-structure publishes JSON readbacks for script-to-pack guard drift', () => {
  const payload = runNpmJson('source-structure:json');

  assert.equal(payload.surface_kind, 'oma_source_structure_readback');
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, 'advisory');
  assert.equal(payload.policy_ref, 'contracts/source_structure_policy.json');
  assert.equal(payload.readback_is_authority, false);
  assert.deepEqual(asObjects(payload.compatibility_aliases).map((entry) => entry.alias_command_ref), []);
  assert.equal(payload.script_to_pack_receipt_guard.scanned_script_count, 32);
  assert.equal(payload.script_to_pack_receipt_guard.gated_script_count, 32);
  assert.equal(payload.script_to_pack_receipt_guard.orphan_script_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.cleanup_candidate_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.retained_current_count, 32);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.retained_current_authority_function_count, 25);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.retained_current_repo_native_surface_count, 7);
  assert.equal(payload.script_to_pack_receipt_guard.violation_count, 0);
  assertFalseClaims(payload.authority_boundary as JsonObject);
});

test('script-to-pack default readback is compact and does not become a second script inventory', () => {
  const payload = runNpmJson('script-to-pack:readback', [0, 1]);

  assertCleanupReadbackCore(payload, {
    surfaceKind: 'oma_script_to_pack_retirement_cleanup_compact_readback',
    commandRef: 'npm run script-to-pack:readback',
    full: false,
  });
  assert.equal(payload.cleanup_candidates, undefined);
  assert.equal(payload.compact_cleanup_summary.summary_id, 'oma.script_to_pack_retirement_cleanup.compact_summary.v1');
  assert.equal(payload.compact_cleanup_summary.cleanup_candidate_count, payload.cleanup_candidate_count);
  assert.equal(payload.compact_cleanup_summary.retained_current_count, payload.retained_current_count);
  assert.equal(payload.compact_cleanup_summary.sample_cleanup_candidates.length, 0);
});

test('script-to-pack full readback materializes cleanup candidates without authorizing cleanup', () => {
  const payload = runNpmJsonFile('script-to-pack:readback:full', [0, 1]);

  assertCleanupReadbackCore(payload, {
    surfaceKind: 'oma_script_to_pack_retirement_cleanup_readback',
    commandRef: 'npm run script-to-pack:readback:full',
    full: true,
  });
  assert.equal(payload.compact_cleanup_summary_ref, 'npm run script-to-pack:readback');
  assert.equal(payload.compact_cleanup_summary_omitted_from_full, true);
  assert.equal(payload.cleanup_candidates.length, 0);
  assert.equal(payload.retained_current_rows.length, 32);

  const retainedRows = asObjects(payload.retained_current_rows);
  const retainedExecuteWorkOrder = retainedRows.find(
    (candidate) => candidate.script_ref === 'scripts/execute-external-work-order.ts',
  );
  assert.ok(retainedExecuteWorkOrder);
  assert.equal(retainedExecuteWorkOrder.gate_id, 'external_work_order_execution_delegation');
  assert.equal(retainedExecuteWorkOrder.retention_state, 'retained_current_authority_function');
  assert.equal(
    asObjects(payload.retained_current_authority_functions)
      .filter((candidate) => candidate.gate_id === 'agent_evidence_and_external_suite_materializers').length,
    10,
  );
  assert.equal(
    asObjects(payload.retained_current_authority_functions)
      .filter((candidate) => candidate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers').length,
    10,
  );
  assert.ok(retainedRows.find((candidate) => candidate.script_ref === 'scripts/check-source-structure.ts'));
  assert.ok(retainedRows.find((candidate) => candidate.script_ref === 'scripts/verify.sh'));
});

test('stage control plane publishes an OPL Pack source generated bundle manifest', () => {
  const manifest = readJson('contracts/stage_control_plane.bundle-manifest.json');

  assert.equal(manifest.surface_kind, 'opl_pack_source_generated_bundle_manifest');
  assert.equal(manifest.bundle_id, 'opl-meta-agent.stage_control_plane');
  assert.equal(manifest.aggregate_ref, 'contracts/stage_control_plane.json');
  assert.equal(manifest.source_contract_ref, 'contracts/stage_control_plane.source.json');
  assert.equal(manifest.leaf_index_ref, 'contracts/stage_control_plane.leaf-index.json');
  assert.equal(manifest.generated_consumer_surface.ref, 'contracts/stage_control_plane.json');
  assert.equal(manifest.generated_consumer_surface.do_not_edit, true);
  assert.equal(manifest.generator.write_command, 'npm run stage-control:write');
  assert.equal(manifest.generator.check_command, 'npm run stage-control:check');
  assert.match(String(manifest.source_digest.value), /^sha256:[0-9a-f]{64}$/);
  assertFalseClaims(manifest.false_authority_flags as JsonObject, [
    'aggregate_can_claim_domain_ready',
    'aggregate_can_write_target_truth',
    'bundle_manifest_can_override_source_parts',
  ]);
});

test('structure maintenance scripts pass in focused advisory check mode', () => {
  [
    ['scripts/sync-stage-control-plane.ts', '--check'],
    ['scripts/check-source-structure.ts', '--advisory'],
  ].forEach(([script, flag]) => {
    const result = spawnSync(process.execPath, [script, flag], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS?.includes('--experimental-strip-types')
          ? process.env.NODE_OPTIONS
          : `${process.env.NODE_OPTIONS ?? ''} --experimental-strip-types`.trim(),
      },
    });
    assert.equal(result.status, 0, `${script} ${flag}\n${result.stdout}\n${result.stderr}`);
    if (script === 'scripts/check-source-structure.ts') {
      assert.match(result.stdout, /script-to-pack receipt guard checked 32 scripts, 32 gated refs, 0 orphan scripts/);
    }
  });
});

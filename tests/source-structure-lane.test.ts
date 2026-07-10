import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  repoRoot,
  readJson,
  parseJsonText,
  asObjects,
  asStrings,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

function runNpmJson(script: string, allowedStatuses = [0]): JsonObject {
  const result = spawnSync('npm', ['run', '--silent', script], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
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

function assertFalseClaims(boundary: JsonObject, fields = [
  'can_write_target_domain_truth',
  'can_write_target_owner_receipt_body',
  'can_claim_opl_primitive_parity',
  'can_claim_domain_ready',
  'can_claim_production_ready',
]): void {
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
  assert.ok((payload.retained_current_count as number) > 0);
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

test('source-structure policy keeps strict checks non-authoritative', () => {
  const policy = readJson('contracts/source_structure_policy.json');
  const receiptGuard = policy.script_to_pack_receipt_guard as JsonObject;
  const stageControlExemption = asObjects(policy.generated_aggregate_exemptions)
    .find((entry) => entry.aggregate_ref === 'contracts/stage_control_plane.json');

  assert.deepEqual(asObjects(policy.compatibility_aliases), []);
  assert.equal(policy.lanes.advisory.fail_on_over_budget, false);
  assert.equal(policy.lanes.strict.fail_on_over_budget, true);
  assert.equal(receiptGuard.cleanup_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(receiptGuard.full_cleanup_readback_command_ref, 'npm run script-to-pack:readback:full');
  assertFalseClaims(receiptGuard.false_authority_boundary as JsonObject, [
    'guard_can_authorize_script_retirement',
    'guard_can_claim_opl_primitive_parity',
    'guard_can_claim_domain_ready',
    'guard_can_claim_production_ready',
  ]);
  assert.equal(stageControlExemption?.bundle_manifest_ref, 'contracts/stage_control_plane.bundle-manifest.json');
});

test('stage control aggregate is generated from its source parts and leaf index', () => {
  const aggregate = readJson('contracts/stage_control_plane.json');
  const source = readJson('contracts/stage_control_plane.source.json');
  const leafIndex = readJson('contracts/stage_control_plane.leaf-index.json');
  const stageIds = asObjects(aggregate.stages).map((stage) => String(stage.stage_id));

  assert.equal(source.aggregate_ref, 'contracts/stage_control_plane.json');
  assert.equal(source.leaf_index_ref, 'contracts/stage_control_plane.leaf-index.json');
  assert.equal(source.maintenance_policy.aggregate_is_generated_consumer_surface, true);
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

test('source-structure readback delegates script inventory validation to the morphology gate', () => {
  const payload = runNpmJson('source-structure:json');
  const guard = payload.script_to_pack_receipt_guard as JsonObject;

  assert.equal(payload.surface_kind, 'oma_source_structure_readback');
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, 'advisory');
  assert.equal(payload.readback_is_authority, false);
  assert.ok((guard.scanned_script_count as number) > 0);
  assert.equal(guard.scanned_script_count, guard.gated_script_count);
  assert.equal(guard.orphan_script_count, 0);
  assert.equal(guard.cleanup_readback.cleanup_candidate_count, 0);
  assert.equal(guard.violation_count, 0);
  assertFalseClaims(payload.authority_boundary as JsonObject);
});

test('script-to-pack compact and full readbacks stay non-authoritative', () => {
  const compact = runNpmJson('script-to-pack:readback', [0, 1]);
  const full = runNpmJsonFile('script-to-pack:readback:full', [0, 1]);

  assertCleanupReadbackCore(compact, {
    surfaceKind: 'oma_script_to_pack_retirement_cleanup_compact_readback',
    commandRef: 'npm run script-to-pack:readback',
    full: false,
  });
  assert.equal(compact.cleanup_candidates, undefined);
  assert.equal(compact.compact_cleanup_summary.cleanup_candidate_count, compact.cleanup_candidate_count);
  assert.equal(compact.compact_cleanup_summary.retained_current_count, compact.retained_current_count);

  assertCleanupReadbackCore(full, {
    surfaceKind: 'oma_script_to_pack_retirement_cleanup_readback',
    commandRef: 'npm run script-to-pack:readback:full',
    full: true,
  });
  assert.equal(full.compact_cleanup_summary_ref, 'npm run script-to-pack:readback');
  assert.equal(full.cleanup_candidates.length, 0);
  assert.equal(full.retained_current_rows.length, full.retained_current_count);
});

test('stage control plane publishes an OPL Pack source generated bundle manifest', () => {
  const manifest = readJson('contracts/stage_control_plane.bundle-manifest.json');

  assert.equal(manifest.aggregate_ref, 'contracts/stage_control_plane.json');
  assert.equal(manifest.source_contract_ref, 'contracts/stage_control_plane.source.json');
  assert.equal(manifest.leaf_index_ref, 'contracts/stage_control_plane.leaf-index.json');
  assert.equal(manifest.generator.write_command, 'npm run stage-control:write');
  assert.equal(manifest.generator.check_command, 'npm run stage-control:check');
  assert.match(String(manifest.source_digest.value), /^sha256:[0-9a-f]{64}$/);
  assertFalseClaims(manifest.false_authority_flags as JsonObject, [
    'aggregate_can_claim_domain_ready',
    'aggregate_can_write_target_truth',
    'bundle_manifest_can_override_source_parts',
  ]);
});

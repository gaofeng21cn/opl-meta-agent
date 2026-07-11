import assert from 'node:assert/strict';
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

function assertFalseClaims(boundary: JsonObject, fields = [
  'can_write_target_domain_truth',
  'can_write_target_owner_receipt_body',
  'can_claim_opl_primitive_parity',
  'can_claim_domain_ready',
  'can_claim_production_ready',
]): void {
  fields.forEach((field) => assert.equal(boundary[field], false, `authority_boundary.${field}`));
}

test('source-structure policy keeps strict checks non-authoritative', () => {
  const policy = readJson('contracts/source_structure_policy.json');
  const receiptGuard = policy.script_to_pack_receipt_guard as JsonObject;

  assert.deepEqual(asObjects(policy.compatibility_aliases), []);
  assert.equal(policy.lanes.advisory.fail_on_over_budget, false);
  assert.equal(policy.lanes.strict.fail_on_over_budget, true);
  assert.deepEqual(asStrings(receiptGuard.retention_summary_fields), [
    'retained_current_count',
    'retained_current_authority_function_count',
    'retained_current_repo_native_surface_count',
    'fixture_or_proof_only_retained_count',
    'unclassified_script_count',
  ]);
  assertFalseClaims(receiptGuard.false_authority_boundary as JsonObject, [
    'guard_can_authorize_script_retirement',
    'guard_can_claim_opl_primitive_parity',
    'guard_can_claim_domain_ready',
    'guard_can_claim_production_ready',
  ]);
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
  assert.ok((guard.retention_summary.retained_current_count as number) > 0);
  assert.equal(guard.retention_summary.unclassified_script_count, 0);
  assert.equal(guard.violation_count, 0);
  assertFalseClaims(payload.authority_boundary as JsonObject);
});

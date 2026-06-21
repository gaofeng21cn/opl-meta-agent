import test from 'node:test';
import {
  assert,
  fs,
  path,
  repoRoot,
  readJson,
  readText,
  spawnSync,
  asObjects,
  asStrings,
} from './support/contracts.ts';

test('source-structure and line-budget lanes are repo-native package and verify entrypoints', () => {
  const packageJson = readJson('package.json');
  const verifyScript = readText('scripts/verify.sh');
  const policy = readJson('contracts/source_structure_policy.json');

  assert.equal(packageJson.scripts['stage-control:check'], 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --check');
  assert.equal(packageJson.scripts['stage-control:write'], 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --write');
  assert.equal(packageJson.scripts['stage-control:split'], 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --split');
  assert.equal(packageJson.scripts['source-structure'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --advisory');
  assert.equal(packageJson.scripts['source-structure:json'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --advisory --json');
  assert.equal(packageJson.scripts['source-structure:strict'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict');
  assert.equal(packageJson.scripts['source-structure:strict:json'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --json');
  assert.equal(packageJson.scripts['line-budget'], packageJson.scripts['source-structure']);
  assert.equal(packageJson.scripts['line-budget:strict'], packageJson.scripts['source-structure:strict']);

  const stageControlExemption = asObjects(policy.generated_aggregate_exemptions)
    .find((entry) => entry.aggregate_ref === 'contracts/stage_control_plane.json');

  assert.match(verifyScript, /structure\|line-budget/);
  assert.match(verifyScript, /structure:strict\|line-budget:strict/);
  assert.equal(policy.surface_kind, 'opl_family_source_structure_policy');
  assert.equal(policy.lanes.advisory.fail_on_over_budget, false);
  assert.equal(policy.lanes.strict.fail_on_over_budget, true);
  assert.equal(
    policy.script_to_pack_receipt_guard.guard_id,
    'oma.source_structure.script_to_pack_receipt_drift_guard.v1',
  );
  assert.equal(policy.script_to_pack_receipt_guard.state, 'active_executable_guard');
  assert.equal(policy.script_to_pack_receipt_guard.command_ref, 'npm run source-structure');
  assert.equal(policy.script_to_pack_receipt_guard.json_readback_command_ref, 'npm run source-structure:json');
  assert.equal(policy.script_to_pack_receipt_guard.receipt_ref, 'contracts/script_to_pack_gate_receipt.json');
  assert.equal(
    policy.script_to_pack_receipt_guard.authority_functions_ref,
    'runtime/authority_functions/meta-agent-authority-functions.json',
  );
  assert.deepEqual(asStrings(policy.script_to_pack_receipt_guard.fail_closed_conditions), [
    'receipt_contract_missing',
    'authority_functions_aggregate_missing',
    'source_purity_scan_receipt_drift',
    'script_morphology_policy_drift',
    'tracked_script_not_in_receipt',
    'receipt_scanned_script_not_tracked',
    'gated_script_refs_drift',
    'orphan_script_count_nonzero',
    'receipt_claims_retirement_or_readiness',
  ]);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_authorize_script_retirement, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_claim_opl_primitive_parity, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_write_target_domain_truth, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_write_target_owner_receipt_body, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_claim_app_or_registry_readiness, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_claim_generated_hosted_readiness, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_claim_target_agent_ready, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_claim_domain_ready, false);
  assert.equal(policy.script_to_pack_receipt_guard.false_authority_boundary.guard_can_claim_production_ready, false);
  assert.equal(stageControlExemption?.bundle_manifest_ref, 'contracts/stage_control_plane.bundle-manifest.json');
  assert.equal(stageControlExemption?.check_command, 'npm run stage-control:check');
  assert.equal(stageControlExemption?.generated_consumer_surface_must_be_do_not_edit, true);
  assert.deepEqual(asStrings(policy.scan_scope.path_prefixes), [
    'agent/',
    'contracts/',
    'runtime/',
    'scripts/',
    'tests/',
  ]);
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
  assert.deepEqual(
    asObjects(leafIndex.stages).map((entry) => entry.stage_id),
    stageIds,
  );
  assert.deepEqual(
    asObjects(leafIndex.stage_native_artifact_contracts).map((entry) => entry.stage_id),
    stageIds,
  );

  asObjects(leafIndex.stages).forEach((entry, index) => {
    const stage = readJson(String(entry.ref));
    assert.deepEqual(stage, asObjects(aggregate.stages)[index]);
  });
  asObjects(leafIndex.stage_native_artifact_contracts).forEach((entry, index) => {
    const contract = readJson(String(entry.ref));
    assert.deepEqual(contract, asObjects(aggregate.stage_native_artifact_contract.contracts)[index]);
  });
});

test('source-structure publishes a JSON machine readback for script-to-pack guard drift', () => {
  const result = spawnSync('npm', ['run', 'source-structure:json', '--silent'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.surface_kind, 'oma_source_structure_readback');
  assert.equal(payload.version, 'source-structure-readback.v1');
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, 'advisory');
  assert.equal(payload.policy_ref, 'contracts/source_structure_policy.json');
  assert.equal(payload.readback_is_authority, false);
  assert.equal(payload.script_to_pack_receipt_guard.guard_id, 'oma.source_structure.script_to_pack_receipt_drift_guard.v1');
  assert.equal(payload.script_to_pack_receipt_guard.json_readback_command_ref, 'npm run source-structure:json');
  assert.equal(payload.script_to_pack_receipt_guard.scanned_script_count, 31);
  assert.equal(payload.script_to_pack_receipt_guard.gated_script_count, 31);
  assert.equal(payload.script_to_pack_receipt_guard.orphan_script_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.violation_count, 0);
  assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(payload.authority_boundary.can_write_target_owner_receipt_body, false);
  assert.equal(payload.authority_boundary.can_authorize_script_retirement, false);
  assert.equal(payload.authority_boundary.can_claim_opl_primitive_parity, false);
  assert.equal(payload.authority_boundary.can_claim_target_agent_ready, false);
  assert.equal(payload.authority_boundary.can_claim_domain_ready, false);
  assert.equal(payload.authority_boundary.can_claim_production_ready, false);
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
  assert.equal(manifest.false_authority_flags.aggregate_can_claim_domain_ready, false);
  assert.equal(manifest.false_authority_flags.aggregate_can_write_target_truth, false);
  assert.equal(manifest.false_authority_flags.bundle_manifest_can_override_source_parts, false);
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
      assert.match(result.stdout, /script-to-pack receipt guard checked 31 scripts, 31 gated refs, 0 orphan scripts/);
    }
  });
});

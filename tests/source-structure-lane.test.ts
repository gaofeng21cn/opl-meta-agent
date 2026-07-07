import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  repoRoot,
  readJson,
  readText,
  asObjects,
  asStrings,
} from './support/contracts.ts';

function npmScriptName(commandRef: string): string {
  return commandRef.replace(/^npm run /, '');
}

test('source-structure and line-budget lanes are repo-native package and verify entrypoints', () => {
  const packageJson = readJson('package.json');
  const verifyScript = readText('scripts/verify.sh');
  const policy = readJson('contracts/source_structure_policy.json');
  const compatibilityAliases = asObjects(policy.compatibility_aliases);

  assert.equal(packageJson.scripts['stage-control:check'], 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --check');
  assert.equal(packageJson.scripts['stage-control:write'], 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --write');
  assert.equal(packageJson.scripts['stage-control:split'], 'scripts/run-with-repo-temp-env.sh node scripts/sync-stage-control-plane.ts --split');
  assert.equal(packageJson.scripts['source-structure'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --advisory');
  assert.equal(packageJson.scripts['source-structure:json'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --advisory --json');
  assert.equal(packageJson.scripts['source-structure:strict'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict');
  assert.equal(packageJson.scripts['source-structure:strict:json'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --json');
  assert.equal(packageJson.scripts['script-to-pack:readback'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --script-to-pack-readback');
  assert.equal(packageJson.scripts['script-to-pack:readback:full'], 'scripts/run-with-repo-temp-env.sh node scripts/check-source-structure.ts --strict --script-to-pack-readback-full');
  compatibilityAliases.forEach((entry) => {
    const aliasName = npmScriptName(String(entry.alias_command_ref));
    const canonicalName = npmScriptName(String(entry.canonical_command_ref));
    assert.equal(entry.state, 'compatibility_alias_retained');
    assert.equal(packageJson.scripts[aliasName], packageJson.scripts[canonicalName]);
    assert.ok(verifyScript.includes(`${canonicalName.replace('source-', '')}|${aliasName})`));
  });

  const stageControlExemption = asObjects(policy.generated_aggregate_exemptions)
    .find((entry) => entry.aggregate_ref === 'contracts/stage_control_plane.json');

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
  assert.equal(policy.script_to_pack_receipt_guard.cleanup_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(policy.script_to_pack_receipt_guard.full_cleanup_readback_command_ref, 'npm run script-to-pack:readback:full');
  assert.equal(
    policy.script_to_pack_receipt_guard.cleanup_readback_output_ref,
    'source-structure-readback.script_to_pack_receipt_guard.cleanup_readback',
  );
  assert.equal(
    policy.script_to_pack_receipt_guard.direct_readback_compact_summary_output_ref,
    'script-to-pack-readback.compact_cleanup_summary',
  );
  assert.equal(
    policy.script_to_pack_receipt_guard.direct_readback_full_detail_output_ref,
    'script-to-pack-readback-full.cleanup_candidates',
  );
  assert.equal(
    policy.script_to_pack_receipt_guard.compact_cleanup_summary_id,
    'oma.script_to_pack_retirement_cleanup.compact_summary.v1',
  );
  assert.equal(
    policy.script_to_pack_receipt_guard.cleanup_readback_surface_kind,
    'oma_script_to_pack_retirement_cleanup_compact_readback',
  );
  assert.equal(
    policy.script_to_pack_receipt_guard.full_cleanup_readback_surface_kind,
    'oma_script_to_pack_retirement_cleanup_readback',
  );
  assert.equal(
    policy.script_to_pack_receipt_guard.cleanup_readback_compact_summary_role,
    'direct_readback_short_form_not_second_script_inventory',
  );
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
    'cleanup_readback_missing_candidate',
    'cleanup_readback_retained_current_drift',
    'cleanup_readback_claims_cleanup_apply',
    'compact_cleanup_summary_drift',
    'compact_cleanup_summary_claims_cleanup_or_readiness',
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
  assert.deepEqual(
    asObjects(payload.compatibility_aliases).map((entry) => entry.alias_command_ref),
    ['npm run line-budget', 'npm run line-budget:strict'],
  );
  assert.equal(payload.script_to_pack_receipt_guard.guard_id, 'oma.source_structure.script_to_pack_receipt_drift_guard.v1');
  assert.equal(payload.script_to_pack_receipt_guard.json_readback_command_ref, 'npm run source-structure:json');
  assert.equal(payload.script_to_pack_receipt_guard.scanned_script_count, 32);
  assert.equal(payload.script_to_pack_receipt_guard.gated_script_count, 32);
  assert.equal(payload.script_to_pack_receipt_guard.orphan_script_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.surface_kind, 'oma_script_to_pack_retirement_cleanup_readback');
  assert.equal(
    payload.script_to_pack_receipt_guard.cleanup_readback.summary_id,
    'oma.script_to_pack_retirement_cleanup.compact_summary.v1',
  );
  assert.equal(
    payload.script_to_pack_receipt_guard.cleanup_readback.summary_role,
    'compact_cleanup_summary_not_second_script_inventory',
  );
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.cleanup_candidate_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.retained_current_count, 32);
  assert.equal(
    payload.script_to_pack_receipt_guard.cleanup_readback.retained_current_authority_function_count,
    25,
  );
  assert.equal(
    payload.script_to_pack_receipt_guard.cleanup_readback.retained_current_repo_native_surface_count,
    7,
  );
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.cleanup_apply_candidate_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.sample_cleanup_candidate_count, 0);
  assert.equal(payload.script_to_pack_receipt_guard.cleanup_readback.sample_cleanup_candidates.length, 0);
  assert.equal(
    payload.script_to_pack_receipt_guard.cleanup_readback.sample_cleanup_candidates
      .every((candidate: { can_apply_cleanup: boolean }) => candidate.can_apply_cleanup === false),
    true,
  );
  assert.equal(payload.script_to_pack_receipt_guard.violation_count, 0);
  assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(payload.authority_boundary.can_write_target_owner_receipt_body, false);
  assert.equal(payload.authority_boundary.can_authorize_script_retirement, false);
  assert.equal(payload.authority_boundary.can_claim_opl_primitive_parity, false);
  assert.equal(payload.authority_boundary.can_claim_target_agent_ready, false);
  assert.equal(payload.authority_boundary.can_claim_domain_ready, false);
  assert.equal(payload.authority_boundary.can_claim_production_ready, false);
});

test('script-to-pack default readback is compact and does not become a second script inventory', () => {
  const outputPath = path.join('/tmp', `oma-script-to-pack-readback-${process.pid}.json`);
  const result = spawnSync('sh', ['-c', `npm run script-to-pack:readback --silent > "${outputPath}"`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.ok([0, 1].includes(result.status ?? -1), `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  assert.equal(payload.surface_kind, 'oma_script_to_pack_retirement_cleanup_compact_readback');
  assert.equal(payload.version, 'script-to-pack-retirement-cleanup-compact-readback.v1');
  assert.equal(payload.ok, result.status === 0);
  assert.equal(payload.policy_ref, 'contracts/source_structure_policy.json');
  assert.equal(payload.command_ref, 'npm run script-to-pack:readback');
  assert.equal(payload.full_detail_command_ref, 'npm run script-to-pack:readback:full');
  assert.equal(payload.readback_is_authority, false);
  assert.equal(payload.source_structure_gate.mode, 'strict');
  assert.equal(payload.source_structure_gate.line_budget.fail_on_over_budget, true);
  assert.equal(payload.cleanup_violation_count, 0);
  assert.equal(payload.cleanup_violations.length, 0);
  if (result.status === 0) {
    assert.equal(payload.state, 'readback_available_cleanup_not_authorized');
    assert.equal(payload.violation_count, 0);
  } else {
    assert.equal(payload.state, 'failed_source_structure_gate');
    assert.ok(payload.source_structure_gate.fail_reasons.includes('line_budget'));
    assert.ok(payload.source_structure_gate.line_budget.violation_count > 0);
    assert.ok(payload.violations.every((entry: string) => entry.startsWith('line_budget: ')));
    assert.equal(payload.violation_count, payload.source_structure_gate.line_budget.violation_count);
  }
  assert.equal(payload.cleanup_candidate_count, 0);
  assert.equal(payload.retained_current_count, 32);
  assert.equal(payload.retained_current_authority_function_count, 25);
  assert.equal(payload.retained_current_repo_native_surface_count, 7);
  assert.equal(payload.fixture_or_proof_only_retained_count, 0);
  assert.equal(payload.cleanup_apply_candidate_count, 0);
  assert.equal(payload.full_candidate_rows_omitted_from_default, true);
  assert.equal(payload.cleanup_candidates, undefined);
  assert.equal(payload.compact_cleanup_summary.summary_id, 'oma.script_to_pack_retirement_cleanup.compact_summary.v1');
  assert.equal(payload.compact_cleanup_summary.summary_role, 'compact_cleanup_summary_not_second_script_inventory');
  assert.equal(payload.compact_cleanup_summary.cleanup_candidate_count, payload.cleanup_candidate_count);
  assert.equal(payload.compact_cleanup_summary.retained_current_count, payload.retained_current_count);
  assert.equal(payload.compact_cleanup_summary.cleanup_apply_candidate_count, 0);
  assert.equal(payload.compact_cleanup_summary.missing_evidence_item_count, payload.missing_evidence_item_count);
  assert.equal(payload.compact_cleanup_summary.sample_cleanup_candidate_count, 0);
  assert.equal(payload.compact_cleanup_summary.sample_cleanup_candidates.length, 0);
  assert.equal(payload.compact_cleanup_summary.authority_boundary.can_authorize_physical_delete, false);
  assert.equal(payload.compact_cleanup_summary.authority_boundary.can_claim_domain_ready, false);
  assert.equal(payload.compact_cleanup_summary.authority_boundary.can_claim_production_ready, false);
  assert.equal(payload.sample_cleanup_candidates.length, 0);
  assert.equal(payload.authority_boundary.can_identify_cleanup_candidates, true);
  assert.equal(payload.authority_boundary.can_route_owner_delta, true);
  assert.equal(payload.authority_boundary.can_authorize_physical_delete, false);
  assert.equal(payload.authority_boundary.can_create_typed_blocker_instance, false);
  assert.equal(payload.authority_boundary.can_claim_opl_primitive_parity, false);
  assert.equal(payload.authority_boundary.can_claim_no_active_caller, false);
  assert.equal(payload.authority_boundary.can_claim_domain_ready, false);
  assert.equal(payload.authority_boundary.can_claim_production_ready, false);
});

test('script-to-pack full readback materializes cleanup candidates without authorizing cleanup', () => {
  const outputPath = path.join('/tmp', `oma-script-to-pack-full-readback-${process.pid}.json`);
  const result = spawnSync('sh', ['-c', `npm run script-to-pack:readback:full --silent > "${outputPath}"`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.ok([0, 1].includes(result.status ?? -1), `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  assert.equal(payload.surface_kind, 'oma_script_to_pack_retirement_cleanup_readback');
  assert.equal(payload.version, 'script-to-pack-retirement-cleanup-readback.v1');
  assert.equal(payload.ok, result.status === 0);
  assert.equal(payload.policy_ref, 'contracts/source_structure_policy.json');
  assert.equal(payload.command_ref, 'npm run script-to-pack:readback:full');
  assert.equal(payload.readback_is_authority, false);
  assert.equal(payload.compact_cleanup_summary_ref, 'npm run script-to-pack:readback');
  assert.equal(payload.compact_cleanup_summary_omitted_from_full, true);
  assert.equal(payload.source_structure_gate.mode, 'strict');
  assert.equal(payload.source_structure_gate.line_budget.fail_on_over_budget, true);
  assert.equal(payload.cleanup_violation_count, 0);
  assert.equal(payload.cleanup_violations.length, 0);
  if (result.status === 0) {
    assert.equal(payload.state, 'readback_available_cleanup_not_authorized');
    assert.equal(payload.violation_count, 0);
  } else {
    assert.equal(payload.state, 'failed_source_structure_gate');
    assert.ok(payload.source_structure_gate.fail_reasons.includes('line_budget'));
    assert.ok(payload.source_structure_gate.line_budget.violation_count > 0);
    assert.ok(payload.violations.every((entry: string) => entry.startsWith('line_budget: ')));
    assert.equal(payload.violation_count, payload.source_structure_gate.line_budget.violation_count);
  }
  assert.equal(payload.cleanup_candidate_count, 0);
  assert.equal(payload.retained_current_count, 32);
  assert.equal(payload.retained_current_authority_function_count, 25);
  assert.equal(payload.retained_current_repo_native_surface_count, 7);
  assert.equal(payload.fixture_or_proof_only_retained_count, 0);
  assert.equal(payload.cleanup_apply_candidate_count, 0);
  assert.equal(payload.cleanup_candidates.length, 0);
  assert.equal(payload.retained_current_rows.length, 32);
  const retainedExecuteWorkOrder = payload.retained_current_authority_functions.find(
    (candidate: { script_ref: string }) => candidate.script_ref === 'scripts/execute-external-work-order.ts',
  );
  assert.ok(retainedExecuteWorkOrder);
  assert.equal(retainedExecuteWorkOrder.gate_id, 'external_work_order_execution_delegation');
  assert.equal(retainedExecuteWorkOrder.retention_state, 'retained_current_authority_function');
  assert.ok(retainedExecuteWorkOrder.active_caller_refs.includes('package.json#scripts.execute:external-work-order'));
  assert.equal(
    payload.cleanup_candidates.some(
      (candidate: { script_ref: string }) => candidate.script_ref === 'scripts/execute-external-work-order.ts',
    ),
    false,
  );
  const retainedExternalSuiteGroup = payload.retained_current_authority_functions.filter(
    (candidate: { gate_id: string }) => candidate.gate_id === 'agent_evidence_and_external_suite_materializers',
  );
  assert.equal(retainedExternalSuiteGroup.length, 10);
  assert.ok(
    retainedExternalSuiteGroup.every(
      (candidate: { retention_state: string }) => candidate.retention_state === 'retained_current_authority_function',
    ),
  );
  assert.equal(
    payload.cleanup_candidates.some(
      (candidate: { gate_id: string }) => candidate.gate_id === 'agent_evidence_and_external_suite_materializers',
    ),
    false,
  );
  const retainedStageMaterializerGroup = payload.retained_current_authority_functions.filter(
    (candidate: { gate_id: string }) => (
      candidate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers'
    ),
  );
  assert.equal(retainedStageMaterializerGroup.length, 10);
  assert.ok(
    retainedStageMaterializerGroup.every(
      (candidate: { retention_state: string }) => candidate.retention_state === 'retained_current_authority_function',
    ),
  );
  const metaAgentLoopScript = (name: string) => ['scripts', 'lib', name].join('/');
  const retainedTakeoverHelperGroup = payload.retained_current_authority_functions.filter(
    (candidate: { gate_id: string }) => candidate.gate_id === 'retained_thin_authority_helpers_and_takeover_smoke',
  );
  assert.equal(retainedTakeoverHelperGroup.length, 4);
  assert.deepEqual(
    retainedTakeoverHelperGroup.map(
      (candidate: { script_ref: string }) => candidate.script_ref,
    ).sort(),
    [
      metaAgentLoopScript('meta-agent-loop-ai-reviewer.ts'),
      metaAgentLoopScript('meta-agent-loop-io.ts'),
      metaAgentLoopScript('meta-agent-loop-receipts.ts'),
      ['scripts', 'takeover-agent.ts'].join('/'),
    ],
  );
  assert.ok(
    retainedTakeoverHelperGroup.every(
      (candidate: { retention_state: string; retention_evidence_refs: string[] }) => (
        candidate.retention_state === 'retained_current_authority_function'
        && candidate.retention_evidence_refs.includes('tests/takeover-loop.test.ts')
      ),
    ),
  );
  assert.equal(
    payload.cleanup_candidates.some(
      (candidate: { gate_id: string }) => (
        candidate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers'
      ),
    ),
    false,
  );
  assert.equal(
    payload.cleanup_candidates.some(
      (candidate: { gate_id: string }) => candidate.gate_id === 'retained_thin_authority_helpers_and_takeover_smoke',
    ),
    false,
  );
  const sourceStructureRow = payload.retained_current_rows.find(
    (candidate: { script_ref: string }) => candidate.script_ref === 'scripts/check-source-structure.ts',
  );
  assert.ok(sourceStructureRow);
  assert.equal(sourceStructureRow.gate_id, 'source_structure_and_stage_control_maintenance_helpers');
  assert.ok(sourceStructureRow.active_caller_refs.includes('package.json#scripts.script-to-pack:readback'));
  assert.equal(sourceStructureRow.retention_state, 'retained_current_repo_native_surface');
  assert.ok(sourceStructureRow.retention_evidence_refs.includes('contracts/source_structure_policy.json'));
  assert.equal(
    sourceStructureRow.no_resurrection_policy.policy_id,
    'oma.repo_native_source_structure_helpers.no_resurrection.v1',
  );
  const shellWrapperRow = payload.retained_current_rows.find(
    (candidate: { script_ref: string }) => candidate.script_ref === 'scripts/verify.sh',
  );
  assert.ok(shellWrapperRow);
  assert.equal(shellWrapperRow.gate_id, 'repo_shell_verification_wrappers');
  assert.equal(shellWrapperRow.retention_state, 'retained_current_repo_native_surface');
  assert.ok(shellWrapperRow.active_caller_refs.includes('package.json#scripts.verify'));
  assert.equal(
    shellWrapperRow.no_resurrection_policy.policy_id,
    'oma.repo_shell_verification_wrappers.no_resurrection.v1',
  );
  assert.equal(
    payload.cleanup_candidates.some(
      (candidate: { gate_id: string }) => candidate.gate_id === 'source_structure_and_stage_control_maintenance_helpers',
    ),
    false,
  );
  assert.equal(
    payload.cleanup_candidates.some(
      (candidate: { gate_id: string }) => candidate.gate_id === 'repo_shell_verification_wrappers',
    ),
    false,
  );
  assert.match(sourceStructureRow.owner_delta_route, /^route-to-owner:opl-framework-or-target-owner\/script-to-pack\//);
  assert.match(sourceStructureRow.typed_blocker_ref_shape, /^oma-typed-blocker:script-to-pack\//);
  assert.equal(sourceStructureRow.can_apply_cleanup, false);
  assert.equal(payload.authority_boundary.can_identify_cleanup_candidates, true);
  assert.equal(payload.authority_boundary.can_route_owner_delta, true);
  assert.equal(payload.authority_boundary.can_authorize_physical_delete, false);
  assert.equal(payload.authority_boundary.can_create_typed_blocker_instance, false);
  assert.equal(payload.authority_boundary.can_claim_opl_primitive_parity, false);
  assert.equal(payload.authority_boundary.can_claim_no_active_caller, false);
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
      assert.match(result.stdout, /script-to-pack receipt guard checked 32 scripts, 32 gated refs, 0 orphan scripts/);
    }
  });
});

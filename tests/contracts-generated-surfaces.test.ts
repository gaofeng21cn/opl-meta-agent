import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  repoRoot,
  oplBin,
  asObjects,
  asStrings,
  parseJsonText,
  readJson,
  assertRepoRefExists,
  assertNoForbiddenAuthority,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('generated-surface contracts remain OPL-owned refs-only projections', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const handoff = readJson('contracts/generated_surface_handoff.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const appProjection = readJson('contracts/app_workbench_projection.json');

  assert.equal(packCompilerInput.generated_surface_owner, 'one-person-lab');
  assert.equal(handoff.generated_surface_owner, 'one-person-lab');
  assert.equal(packCompilerInput.domain_repo_can_own_generated_surface, false);
  assert.equal(handoff.domain_repo_can_own_generated_surface, false);

  [
    { label: 'registration', surface: registration, ownerField: 'registry_owner' },
    { label: 'app projection', surface: appProjection, ownerField: 'projection_owner' },
  ].forEach(({ label, surface, ownerField }) => {
    assertNoForbiddenAuthority(surface, label);
    assert.equal(surface[ownerField], 'one-person-lab');
  });

  Object.entries(registration.domain_manifest)
    .filter(([key]) => key.endsWith('_ref'))
    .forEach(([, value]) => assertRepoRefExists(value as string));
  asStrings(registration.discovery_receipt.consumed_contract_refs).forEach(assertRepoRefExists);
  asStrings(appProjection.drilldown_readiness_receipt.verified_by_refs).forEach(assertRepoRefExists);

  const handoffRefs: Record<string, string> = {
    registration_contract_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    scaleout_evidence_contract_ref: 'contracts/real_target_agent_scaleout_evidence.json',
    trajectory_learning_contract_ref: 'contracts/trajectory_learning_contract.json',
    live_stage_run_progress_evidence_ref: 'contracts/live_stage_run_progress_evidence.json',
  };
  Object.entries(handoffRefs).forEach(([field, ref]) => {
    assert.equal(handoff[field], ref);
    assertRepoRefExists(ref);
  });
  assert.equal(handoff.registry_discovery_receipt_ref, registration.discovery_receipt.receipt_ref);
  assert.equal(handoff.app_drilldown_readiness_receipt_ref, appProjection.drilldown_readiness_receipt.receipt_ref);
});

test('OPL generated interfaces expose current descriptors and omit retired takeover aliases', () => {
  const result = spawnSync(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    repoRoot,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  const bundle = parseJsonText(result.stdout).generated_agent_interfaces;
  assert.equal(bundle.surface_kind, 'opl_generated_agent_interface_bundle');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.equal(bundle.status, 'ready');
  assert.ok(asObjects(bundle.cli.descriptors).some((entry) => entry.action_id === 'build-agent-baseline'));
  assert.ok(asObjects(bundle.skill.descriptors).some((entry) =>
    entry.command_contract_id === 'opl-meta-agent.execute-external-work-order'
  ));
  assert.ok(asObjects(bundle.product_entry.descriptors).some((entry) =>
    entry.action_key === 'improve-from-external-agent-lab-suite'
  ));
  assert.doesNotMatch(JSON.stringify(bundle), /takeover-external-agent-test|opl_meta_agent_takeover_external_agent_test/);
  assert.equal(bundle.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

test('default-caller readback cannot authorize physical deletion', () => {
  const evidence = readJson('contracts/default_caller_deletion_evidence.json');
  const handoff = readJson('contracts/generated_surface_handoff.json');

  assert.equal(evidence.source_shape, 'landed');
  assert.equal(evidence.functional_structure_gap_count, 0);
  assert.equal(evidence.physical_delete_authorized, false);
  assert.equal(evidence.authority_boundary.refs_only, true);
  assert.equal(evidence.authority_boundary.can_authorize_domain_repo_physical_delete, false);
  assert.equal(handoff.default_caller_deletion_evidence_ref, 'contracts/default_caller_deletion_evidence.json');
  asObjects(handoff.handoff_surfaces).forEach((surface) => {
    assert.equal(surface.owner, 'one-person-lab');
    assert.equal(surface.physical_delete_authorized, false);
    assert.ok(evidence.surface_evidence[surface.surface_id] as JsonObject);
  });

  const result = spawnSync(oplBin, [
    'agents',
    'default-callers',
    '--agent',
    `opl-meta-agent=${repoRoot}`,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  const report = asObjects(parseJsonText(result.stdout).agent_default_caller_readiness.reports)[0];
  assert.equal(report.deletion_gate.physical_delete_authorized, false);
  assert.equal(report.deletion_gate.default_caller_delete_ready, false);
  assert.equal(report.deletion_gate.generated_default_caller_readiness_can_authorize_physical_delete, false);
  assert.equal(report.deletion_gate.evidence_worklist_count, 0);
});

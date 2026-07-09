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

function assertRefsOnlyOplSurface(surface: JsonObject, label: string): void {
  assertNoForbiddenAuthority(surface, label);
  assert.equal(surface.authority_boundary.refs_only, true, `${label} should be refs-only`);
  assert.equal(surface.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(surface.authority_boundary.can_authorize_target_domain_quality_or_export, false);
}

function assertHasSection(sections: JsonObject[], sectionId: string): JsonObject {
  const section = sections.find((entry) => entry.section_id === sectionId);
  assert.ok(section, `${sectionId} should exist`);
  return section;
}

test('generated-surface contracts stay OPL-owned refs-only projections', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const appProjection = readJson('contracts/app_workbench_projection.json');
  const scaleoutEvidence = readJson('contracts/real_target_agent_scaleout_evidence.json');
  const liveProgressEvidence = readJson('contracts/live_stage_run_progress_evidence.json');

  assert.equal(packCompilerInput.generated_surface_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.generated_surface_owner, 'one-person-lab');
  assert.equal(packCompilerInput.domain_repo_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.domain_repo_can_own_generated_surface, false);
  assert.equal(privatePolicy.default_posture, 'forbidden_until_classified_and_receipted');
  assert.ok(privatePolicy.forbidden_private_surface_classes.includes('generic_cli_mcp_product_wrapper'));

  assertRefsOnlyOplSurface(registration, 'registration');
  assert.equal(registration.registry_owner, 'one-person-lab');
  assert.equal(registration.registration_status, 'discovery_receipt_ready');
  Object.entries(registration.domain_manifest)
    .filter(([key]) => key.endsWith('_ref'))
    .forEach(([, value]) => assertRepoRefExists(value as string));
  asStrings(registration.discovery_receipt.consumed_contract_refs).forEach(assertRepoRefExists);
  asStrings(registration.discovery_receipt.verified_by_refs).forEach(assertRepoRefExists);
  assert.ok(registration.discovery_receipt.safe_action_route_refs.includes('safe-action:opl-meta-agent/build-agent-baseline'));
  assert.ok(registration.discovery_receipt.blocked_claims.includes('app_live_rendering_complete'));

  assertRefsOnlyOplSurface(appProjection, 'appProjection');
  assert.equal(appProjection.projection_owner, 'one-person-lab');
  assert.equal(appProjection.projection_status, 'drilldown_readiness_receipt_ready');
  const sections = asObjects(appProjection.workbench_sections);
  ['scaleout_evidence', 'trajectory_learning', 'live_stage_run_progress', 'developer_work_order']
    .forEach((sectionId) => assertHasSection(sections, sectionId));
  assert.equal(appProjection.drilldown_readiness_receipt.status, 'ready_for_app_consumption_refs_only');
  assert.equal(appProjection.drilldown_readiness_receipt.live_rendering_status, 'not_claimed_by_contract');
  assert.ok(appProjection.drilldown_readiness_receipt.safe_action_route_refs
    .includes('safe-action:opl-meta-agent/improve-from-external-agent-lab-suite'));
  assert.ok(appProjection.drilldown_readiness_receipt.blocker_ref_fields.includes('typed_blocker_refs'));
  assert.ok(appProjection.drilldown_readiness_receipt.receipt_ref_fields.includes('mechanism_patch_proposal_ref'));
  asStrings(appProjection.drilldown_readiness_receipt.verified_by_refs).forEach(assertRepoRefExists);
  asStrings(Object.values(appProjection.source_refs)).forEach(assertRepoRefExists);

  assertRefsOnlyOplSurface(scaleoutEvidence, 'scaleoutEvidence');
  assert.equal(scaleoutEvidence.evidence_status, 'multi_target_scaleout_closed_by_refs_only_receipts');
  assert.equal(scaleoutEvidence.authority_boundary.can_treat_suite_pass_as_default_promotion, false);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.implicit_fixture_smoke_retired, true);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.suite_pass_claims_domain_ready, false);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.provider_completion_claims_domain_ready, false);
  assert.deepEqual(
    asObjects(scaleoutEvidence.required_evidence_classes).map((entry) => entry.evidence_class),
    ['real_target_agent_delivery', 'blocked_suite_to_developer_work_order', 'multi_target_scaleout'],
  );
  asStrings(Object.values(scaleoutEvidence.source_refs)).forEach(assertRepoRefExists);

  [
    ['registration_contract_ref', 'contracts/opl_domain_manifest_registration.json'],
    ['app_workbench_projection_ref', 'contracts/app_workbench_projection.json'],
    ['scaleout_evidence_contract_ref', 'contracts/real_target_agent_scaleout_evidence.json'],
    ['trajectory_learning_contract_ref', 'contracts/trajectory_learning_contract.json'],
    ['live_stage_run_progress_evidence_ref', 'contracts/live_stage_run_progress_evidence.json'],
  ].forEach(([field, ref]) => assert.equal(generatedSurfaceHandoff[field], ref));
  assert.equal(generatedSurfaceHandoff.registry_discovery_receipt_ref, registration.discovery_receipt.receipt_ref);
  assert.equal(generatedSurfaceHandoff.app_drilldown_readiness_receipt_ref, appProjection.drilldown_readiness_receipt.receipt_ref);
  ['scaleout_evidence_projection', 'trajectory_learning_projection', 'live_stage_run_progress_projection'].forEach((surfaceId) => {
    assert.ok(asObjects(generatedSurfaceHandoff.generated_surfaces)
      .some((surface) => surface.surface_id === surfaceId));
  });
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('ux_signal_not_quality_verdict_boundary'));
  assert.equal(liveProgressEvidence.status, 'owner_typed_blocker_recorded_not_ready_claim');
  assert.equal(liveProgressEvidence.authority_boundary.opl_can_sign_owner_receipt, false);
  assert.equal(liveProgressEvidence.authority_boundary.can_claim_target_domain_ready, false);
});

test('top-level OMA commands and materializers stay target-agent generic', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const actionIds = asObjects(readJson('contracts/action_catalog.json').actions)
    .map((action) => action.action_id);
  [
    'scripts/lib/agent-evidence-materializer.ts',
    'scripts/improve-from-agent-lab-suite.ts',
  ].forEach(assertRepoRefExists);
  assert.ok(actionIds.includes('improve-from-external-agent-lab-suite'));
  assert.ok(actionIds.includes('materialize-trajectory-learning-proposal'));
  assert.equal(actionIds.some((actionId) => /mas|mag|medical|grant|manuscript|publication|fundability/i.test(actionId)), false);

  const vocabularyPolicy = series.domain_specific_profile.target_agent_generic_vocabulary_policy;
  assert.deepEqual(asStrings(vocabularyPolicy.allowed_top_level_suite_kinds), [
    'agent_lab_external_suite',
    'agent_production_evidence_suite',
  ]);
  assert.equal(vocabularyPolicy.oma_must_not_add_target_domain_compatibility_layer, true);
  asStrings(vocabularyPolicy.forbidden_domain_specific_suite_kind_prefixes).forEach((prefix) => {
    assert.equal(asStrings(vocabularyPolicy.allowed_top_level_suite_kinds).some((suiteKind) =>
      suiteKind.startsWith(prefix)
    ), false);
  });
});

test('OPL generated interfaces expose current descriptors and omit retired external takeover aliases', () => {
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
    entry.command_contract_id === 'opl-meta-agent.improve-from-external-agent-lab-suite'
  ));
  assert.ok(asObjects(bundle.skill.descriptors).some((entry) =>
    entry.command_contract_id === 'opl-meta-agent.execute-external-work-order'
  ));
  assert.ok(asObjects(bundle.product_entry.descriptors).some((entry) =>
    entry.action_key === 'improve-from-external-agent-lab-suite'
  ));
  assert.equal(asObjects(bundle.product_entry.descriptors).some((entry) =>
    entry.action_key === 'takeover-external-agent-test'
  ), false);
  assert.doesNotMatch(JSON.stringify(bundle), /takeover-external-agent-test|opl_meta_agent_takeover_external_agent_test/);
  assert.equal(bundle.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

test('default-caller deletion evidence is closed by refs without authorizing physical delete', () => {
  const evidence = readJson('contracts/default_caller_deletion_evidence.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const expectedSurfaces = ['cli', 'mcp', 'skill', 'product_entry', 'product_status', 'product_session', 'domain_handler', 'workbench'];

  assert.equal(evidence.surface_kind, 'opl_meta_agent_default_caller_deletion_evidence');
  assert.equal(evidence.source_shape, 'landed');
  assert.equal(evidence.functional_structure_gap_count, 0);
  assert.equal(evidence.physical_delete_authorized, false);
  assert.equal(evidence.authority_boundary.refs_only, true);
  assert.equal(evidence.authority_boundary.can_authorize_domain_repo_physical_delete, false);
  assert.equal(generatedSurfaceHandoff.default_caller_deletion_evidence_ref, 'contracts/default_caller_deletion_evidence.json');
  assert.deepEqual(asObjects(generatedSurfaceHandoff.handoff_surfaces).map((surface) => surface.surface_id), expectedSurfaces);

  expectedSurfaces.forEach((surfaceId) => {
    const surfaceEvidence = evidence.surface_evidence[surfaceId] as JsonObject;
    assert.ok(surfaceEvidence, `${surfaceId} should have deletion evidence`);
    ['typed_blocker_refs', 'no_forbidden_write_refs', 'tombstone_refs', 'provenance_refs', 'current_surface_refs']
      .forEach((field) => assert.ok(asStrings(surfaceEvidence[field]).length > 0, `${surfaceId}.${field}`));
    const handoffSurface = asObjects(generatedSurfaceHandoff.handoff_surfaces)
      .find((entry) => entry.surface_id === surfaceId);
    assert.equal(handoffSurface?.owner, 'one-person-lab');
    assert.equal(handoffSurface?.physical_delete_authorized, false);
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

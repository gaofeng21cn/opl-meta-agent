import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

function asObjects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

function asStrings(value: unknown): string[] {
  return value as string[];
}

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function listMarkdownFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(entryRelativePath);
      }
      return entry.name.endsWith('.md') ? [entryRelativePath] : [];
    })
    .sort();
}

function listFilesByExtension(relativeDir: string, extension: string): string[] {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        return listFilesByExtension(entryRelativePath, extension);
      }
      return entry.name.endsWith(extension) ? [entryRelativePath] : [];
    })
    .sort();
}

function assertUsablePackFile(relativePath: string): void {
  const absolutePath = path.join(repoRoot, relativePath);
  assert.equal(fs.existsSync(absolutePath), true, `${relativePath} should exist`);
  const content = fs.readFileSync(absolutePath, 'utf8');
  assert.ok(content.trim().length > 0, `${relativePath} should not be empty`);
  assert.equal(placeholderPattern.test(content), false, `${relativePath} should not contain placeholder markers`);
}

function assertRepoRefExists(relativePath: string): void {
  assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
}

function assertNoForbiddenAuthority(surface: JsonObject, label: string): void {
  assert.equal(surface.owner, 'opl-meta-agent', `${label}.owner`);
  assert.equal(surface.authority_boundary.refs_only, true, `${label} should be refs-only`);
  assert.equal(surface.authority_boundary.not_generic_runtime_owner, true, `${label} should not own generic runtime`);
  assert.equal(surface.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(surface.authority_boundary.can_write_target_domain_memory_body, false);
  assert.equal(surface.authority_boundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(surface.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(surface.authority_boundary.can_promote_default_agent_without_gate, false);
}

test('opl-meta-agent descriptor keeps OPL runtime authority outside the repo', () => {
  const descriptor = readJson('contracts/domain_descriptor.json');

  assert.equal(descriptor.domain_id, 'opl-meta-agent');
  assert.equal(descriptor.domain_label, 'OPL Meta Agent');
  assert.equal(descriptor.agent_role, 'opl_based_foundry_agent');
  assert.equal(descriptor.delivery_domain, 'agent_development');
  assert.equal(descriptor.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(descriptor.authority_boundary.opl_can_authorize_quality_or_export, false);
  assert.equal(descriptor.authority_boundary.opl_meta_agent_can_train_or_deploy_model_weights, false);
  assert.equal(descriptor.authority_boundary.opl_meta_agent_can_promote_default_agent_without_gate, false);
  assert.ok(descriptor.outputs.includes('mechanism_patch_proposal_ref'));
});

test('domain pack files and stage prompt refs resolve to usable repo files', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');

  assert.equal(packCompilerInput.domain_pack_owner, 'opl-meta-agent');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.canonical_semantic_pack_role, 'repo_source_declarative_meta_agent_pack');
  assert.equal(generatedSurfaceHandoff.canonical_semantic_pack_root, 'agent/');
  assert.equal(generatedSurfaceHandoff.domain_pack_role, 'domain_truth_prompt_skill_stage_quality_refs_only');
  assert.equal(
    generatedSurfaceHandoff.generated_interface_role,
    'invoke_and_project_without_domain_authority_escalation',
  );
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('domain_pack_paths_exist_and_are_non_empty'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('stage_prompt_refs_resolve_to_domain_pack_files'));

  const actualDomainPackPaths = listMarkdownFiles('agent')
    .filter((relativePath) => !relativePath.endsWith('/README.md'));
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, actualDomainPackPaths);
  assert.equal(packCompilerInput.required_domain_pack_paths.some((relativePath) => (
    relativePath.endsWith('/README.md')
  )), false);
  packCompilerInput.required_domain_pack_paths.forEach(assertUsablePackFile);

  const stageRefSpecs = [
    {
      field: 'prompt_refs',
      refKind: 'domain_prompt_ref',
      pathPattern: /^agent\/prompts\/.+\.md$/,
    },
    {
      field: 'skills',
      refKind: 'domain_skill_ref',
      pathPattern: /^agent\/skills\/.+\.md$/,
    },
    {
      field: 'knowledge_refs',
      refKind: 'domain_knowledge_ref',
      pathPattern: /^agent\/knowledge\/.+\.md$/,
    },
    {
      field: 'evaluation',
      refKind: 'domain_quality_gate_ref',
      pathPattern: /^agent\/quality_gates\/.+\.md$/,
    },
  ];

  asObjects(stageControl.stages).forEach((stage) => {
    stageRefSpecs.forEach((spec) => {
      const refs = stage[spec.field];
      assert.ok(Array.isArray(refs), `${stage.stage_id}.${spec.field} should be an array`);
      assert.ok(refs.length > 0, `${stage.stage_id}.${spec.field} should not be empty`);
      refs.forEach((stageRef) => {
        assert.equal(stageRef.ref_kind, spec.refKind);
        assert.match(stageRef.ref, spec.pathPattern);
        assertUsablePackFile(stageRef.ref);
      });
    });
  });

  const generatedInterfaceBoundary = packCompilerInput.authority_boundary;
  assert.equal(generatedInterfaceBoundary.domain_pack_can_supply_domain_truth_refs, true);
  assert.equal(generatedInterfaceBoundary.domain_pack_can_supply_prompt_skill_stage_quality_refs, true);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_invoke_minimal_authority_functions, true);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_write_domain_truth, false);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_write_memory_body, false);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_authorize_quality_or_export, false);
});

test('semantic pack keeps Codex-first expert judgment above mechanical gates', () => {
  const requiredFragmentsByFile: Record<string, string[]> = {
    'agent/knowledge/opl-boundary-policy.md': [
      'Codex-first',
      '最强 AI executor',
      'contract completeness',
      '独立 AI reviewer',
      'no-shared-context',
    ],
    'agent/prompts/intent-intake.md': [
      'Codex-first',
      '反例',
      'knowledge/tool gap blocker',
    ],
    'agent/prompts/stage-decomposition.md': [
      'AI executor autonomy',
      '限制 AI executor',
      'knowledge/tool/rubric gap blocker',
    ],
    'agent/prompts/optimizer-iteration.md': [
      'root-cause reasoning',
      '独立 reviewer',
      'scorecard pass',
    ],
    'agent/prompts/online-learning.md': [
      '反事实',
      'direct evidence refs',
      'no-current-failure',
    ],
    'agent/quality_gates/mechanism-patch-adoption.md': [
      'independent AI reviewer direct-evidence',
      'no-shared-context',
      'suite pass',
      'Codex/owner',
    ],
  };

  Object.entries(requiredFragmentsByFile).forEach(([relativePath, fragments]) => {
    const content = readText(relativePath);
    fragments.forEach((fragment) => {
      assert.match(content, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${relativePath} should contain ${fragment}`);
    });
  });
});

test('opl-meta-agent stage plan covers research, build, eval, optimization, delivery, and learning', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  assert.equal(stageControl.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControl.version, 'family-stage-control-plane.v1');
  assert.deepEqual(asObjects(stageControl.stages).map((stage) => stage.stage_id), [
    'intent-intake',
    'web-experience-research',
    'stage-decomposition',
    'agent-skeleton-build',
    'eval-suite-build',
    'baseline-run',
    'external-agent-takeover',
    'optimizer-iteration',
    'baseline-delivery',
    'online-learning',
  ]);
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'agent-skeleton-build')?.allowed_action_refs,
    ['build-agent-baseline'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'external-agent-takeover')?.allowed_action_refs,
    ['takeover-external-agent-test'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'optimizer-iteration')?.allowed_action_refs,
    ['improve-from-external-agent-lab-suite'],
  );
  assert.equal(stageControl.opl_runtime_dependency.agent_lab_complete_control_plane, true);
  assert.equal(stageControl.opl_runtime_dependency.standard_domain_agent_scaffold, true);
  assert.equal(stageControl.opl_runtime_dependency.generated_interface_bundle, true);
  assert.equal(stageControl.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(stageControl.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(stageControl.authority_boundary.opl_can_authorize_quality_or_export, false);
});

test('action catalog and owner receipts forbid target-domain authority writes', () => {
  const actionCatalog = readJson('contracts/action_catalog.json');
  const ownerReceipt = readJson('contracts/owner_receipt_contract.json');
  const packageJson = readJson('package.json');

  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.match(packageJson.scripts['bootstrap:sample'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['improve:external-suite'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['takeover:test'], /--experimental-strip-types/);
  const actions = asObjects(actionCatalog.actions);
  assert.ok(actions.some((action) => action.action_id === 'build-agent-baseline'));
  const takeoverAction = actions.find((action) => action.action_id === 'takeover-external-agent-test');
  assert.ok(takeoverAction);
  assert.equal(takeoverAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(takeoverAction.supported_surfaces.mcp.public_runtime, false);
  assert.equal(takeoverAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(takeoverAction.authority_boundary.can_promote_default_agent_without_gate, false);
  const externalSuiteAction = actions.find(
    (action) => action.action_id === 'improve-from-external-agent-lab-suite',
  );
  assert.ok(externalSuiteAction);
  assert.equal(externalSuiteAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(externalSuiteAction.supported_surfaces.product_entry.action_key, 'improve-from-external-agent-lab-suite');
  assert.equal(externalSuiteAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_source_repo, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_tests, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_docs, true);
  assert.equal(externalSuiteAction.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  assert.ok(externalSuiteAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  const baselineAction = actions.find((action) => action.action_id === 'build-agent-baseline');
  assert.ok(baselineAction);
  assert.ok(baselineAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  const mechanismAction = actions.find((action) => action.action_id === 'generate-mechanism-patch-proposal');
  assert.ok(mechanismAction);
  assert.deepEqual(mechanismAction.workspace_locator_fields, [
    'mechanism_ref',
    'segment_run_ref',
    'evidence_delta_ref',
    'next_mechanism_candidate_ref',
  ]);
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_scheduler_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_cli_mcp_product_wrapper_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_sidecar_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_session_store_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_status_workbench_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generated_surface_owner_in_domain_repo'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('testing_takeover_self_evolution_receipt'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('mechanism_patch_proposal_receipt'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_wrote_target_domain_truth'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_promoted_default_agent_without_gate'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('mechanism_patch_proposal_recorded'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_memory_body_written'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_default_promotion'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_critique_present'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_suggestions_present'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_source_refs_valid'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_provenance_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_critique_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_suggestions_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_source_refs_valid'));
});

test('OPL owns generated interface surfaces for opl-meta-agent contract pack', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');

  assert.equal(packCompilerInput.generated_surface_owner, 'one-person-lab');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.domain_repo_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.generated_surface_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.canonical_semantic_pack_root, 'agent/');
  assert.equal(generatedSurfaceHandoff.domain_repo_can_own_generated_surface, false);
  assert.equal(privatePolicy.default_posture, 'forbidden_until_classified_and_receipted');
  assert.ok(privatePolicy.forbidden_private_surface_classes.includes('generic_cli_mcp_product_wrapper'));
});

test('registration, App workbench projection, and scaleout evidence contracts are consumable refs-only surfaces', () => {
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const appProjection = readJson('contracts/app_workbench_projection.json');
  const scaleoutEvidence = readJson('contracts/real_target_agent_scaleout_evidence.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const audit = readJson('contracts/functional_privatization_audit.json');

  assert.equal(registration.surface_kind, 'opl_domain_manifest_registration');
  assert.equal(registration.registry_owner, 'one-person-lab');
  assert.equal(registration.registration_status, 'contract_ready');
  assert.equal(registration.role, 'domain_registration_metadata_refs_only');
  assertNoForbiddenAuthority(registration, 'registration');
  assert.equal(registration.authority_boundary.registry_owner_is_opl_framework, true);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generated_surface, false);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generic_operator_workbench, false);
  Object.entries(registration.domain_manifest)
    .filter(([key]) => key.endsWith('_ref'))
    .map(([, value]) => value as string)
    .forEach(assertRepoRefExists);

  assert.equal(appProjection.surface_kind, 'opl_app_workbench_projection_contract');
  assert.equal(appProjection.projection_owner, 'one-person-lab');
  assert.equal(appProjection.projection_status, 'contract_ready');
  assert.equal(appProjection.role, 'refs_status_receipts_candidates_and_blockers_only');
  assertNoForbiddenAuthority(appProjection, 'appProjection');
  assert.equal(appProjection.authority_boundary.projection_owner_is_opl_framework, true);
  assert.equal(appProjection.authority_boundary.domain_repo_can_own_generic_operator_workbench, false);
  assert.equal(appProjection.workbench_sections.length, 6);
  assert.equal(
    asObjects(appProjection.workbench_sections).some((section) => section.section_id === 'scaleout_evidence'),
    true,
  );
  asStrings(Object.values(appProjection.source_refs)).forEach(assertRepoRefExists);

  assert.equal(scaleoutEvidence.surface_kind, 'real_target_agent_scaleout_evidence_contract');
  assert.equal(scaleoutEvidence.evidence_status, 'contract_ready_no_real_scaleout_claim_yet');
  assert.equal(scaleoutEvidence.role, 'refs_only_scaleout_evidence_gate');
  assertNoForbiddenAuthority(scaleoutEvidence, 'scaleoutEvidence');
  assert.equal(scaleoutEvidence.authority_boundary.not_target_domain_truth_writer, true);
  assert.equal(scaleoutEvidence.authority_boundary.can_treat_sample_smoke_as_real_delivery, false);
  assert.equal(scaleoutEvidence.authority_boundary.can_treat_suite_pass_as_default_promotion, false);
  assert.deepEqual(
    asObjects(scaleoutEvidence.required_evidence_classes).map((entry) => entry.evidence_class),
    [
      'real_target_agent_delivery',
      'blocked_suite_to_developer_work_order',
      'multi_target_scaleout',
    ],
  );
  asStrings(Object.values(scaleoutEvidence.source_refs)).forEach(assertRepoRefExists);

  [
    registration,
    appProjection,
    scaleoutEvidence,
  ].forEach((surface: JsonObject) => {
    surface.human_doc_refs.forEach(assertRepoRefExists);
  });

  assert.equal(
    generatedSurfaceHandoff.registration_contract_ref,
    'contracts/opl_domain_manifest_registration.json',
  );
  assert.equal(
    generatedSurfaceHandoff.app_workbench_projection_ref,
    'contracts/app_workbench_projection.json',
  );
  assert.equal(
    generatedSurfaceHandoff.scaleout_evidence_contract_ref,
    'contracts/real_target_agent_scaleout_evidence.json',
  );
  assert.equal(
    asObjects(generatedSurfaceHandoff.generated_surfaces).some((surface) =>
      surface.surface_id === 'scaleout_evidence_projection'
    ),
    true,
  );
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('opl_domain_manifest_registration_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('app_workbench_projection_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('real_target_agent_scaleout_evidence_contract'));
  assert.deepEqual(actionCatalog.registration_projection_evidence_contract_refs, {
    opl_domain_manifest_registration_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    real_target_agent_scaleout_evidence_ref: 'contracts/real_target_agent_scaleout_evidence.json',
  });
  assert.deepEqual(audit.registration_projection_evidence_contract_refs, {
    opl_domain_manifest_registration_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    real_target_agent_scaleout_evidence_ref: 'contracts/real_target_agent_scaleout_evidence.json',
  });
});

test('registration, projection, and evidence contracts are represented in functional audit', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const expectedModules = [
    {
      moduleId: 'opl_domain_manifest_registration',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/opl_domain_manifest_registration.json',
      roleScope: 'refs_only_registration_metadata_not_generic_runtime_owner',
    },
    {
      moduleId: 'app_workbench_projection',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/app_workbench_projection.json',
      roleScope: 'refs_status_receipts_candidates_and_blockers_only_not_operator_workbench_owner',
    },
    {
      moduleId: 'real_target_agent_scaleout_evidence',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/real_target_agent_scaleout_evidence.json',
      roleScope: 'refs_only_scaleout_evidence_gate_not_target_domain_truth_writer',
    },
  ];

  expectedModules.forEach((expected) => {
    const module = asObjects(audit.modules).find((entry) => entry.module_id === expected.moduleId);
    assert.ok(module, `${expected.moduleId} should be represented in functional audit`);
    assert.equal(module.owner, 'opl-meta-agent');
    assert.equal(module.classification, expected.classification);
    assert.deepEqual(module.code_paths, [expected.codePath]);
    assert.equal(module.role_scope, expected.roleScope);
    assertRepoRefExists(expected.codePath);
  });
});

test('production acceptance evidence closes conformance evidence tail through refs-only acceptance receipt', () => {
  const acceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');

  assert.equal(acceptance.surface_kind, 'opl_meta_agent_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'opl-meta-agent');
  assert.equal(acceptance.evidence_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.evidence_tail_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(
    acceptance.receipt_ref,
    'production-acceptance-receipt:opl-meta-agent/external-agent-takeover-improve-loop/2026-05-19',
  );
  assert.equal(acceptance.doc_ref, 'docs/status.md');
  assert.ok(acceptance.next_verification_command_refs.includes('cmd:rtk npm test'));
  assert.ok(acceptance.next_verification_command_refs.includes('cmd:rtk npm run typecheck'));
  assert.ok(acceptance.refs.acceptance_receipt_refs.includes(acceptance.receipt_ref));
  assert.ok(acceptance.refs.doc_refs.includes('docs/status.md'));
  assert.ok(acceptance.refs.next_verification_command_refs.includes('cmd:rtk git diff --check'));
  assert.deepEqual(acceptance.refs.typed_blocker_refs, []);
  assert.equal(acceptance.role, 'refs_only_external_agent_takeover_improve_loop_acceptance');
  assert.ok(acceptance.acceptance_scope.includes('production_live_soak_not_claimed_by_conformance'));
  assert.ok(acceptance.acceptance_scope.includes('domain_ready_not_claimed_by_conformance'));
  assert.equal(acceptance.conformance_state.structural_conformance, 'passed');
  assert.equal(acceptance.conformance_state.physical_source_morphology, 'passed');
  assert.equal(acceptance.conformance_state.not_domain_ready_authority_source, true);
  assert.equal(acceptance.conformance_state.not_production_soak_authority_source, true);
  assert.equal(acceptance.external_agent_acceptance_chain.chain_status, 'receipt_chain_present');
  assert.ok(acceptance.external_agent_acceptance_chain.intake_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.test_handoff_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.proposal_materializer_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.review_audit_receipt_refs.length > 0);
  assert.deepEqual(acceptance.external_agent_acceptance_chain.typed_blocker_refs, []);
  assert.equal(
    acceptance.acceptance_receipt.receipt_class,
    'external_agent_takeover_improve_loop_acceptance_receipt',
  );
  assert.equal(acceptance.promotion_gate.promotion_status, 'gated');
  assert.ok(acceptance.promotion_gate.required_next_verification_command_refs.includes('cmd:rtk npm test'));
  assert.ok(acceptance.promotion_gate.required_next_verification_command_refs.includes('cmd:rtk npm run typecheck'));
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/no-target-domain-truth-write',
    ),
  );
  assertNoForbiddenAuthority(acceptance, 'productionAcceptance');
  assert.equal(acceptance.authority_boundary.target_domain_authority_writes_forbidden, true);

  [
    ...asStrings(acceptance.conformance_state.conformance_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.intake_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.test_handoff_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.proposal_materializer_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.review_audit_receipt_refs),
    ...asStrings(acceptance.acceptance_receipt.source_refs),
    ...asStrings(acceptance.generated_agent_fixture_requirement.verified_by_refs),
    acceptance.doc_ref,
    ...asStrings(acceptance.refs.doc_refs),
  ].forEach(assertRepoRefExists);
});

test('minimal authority functions are explicit refs, not generic runtime owners', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');

  assert.equal(authorityFunctions.surface_kind, 'meta_agent_authority_function_refs');
  assert.equal(authorityFunctions.role, 'refs_only_minimal_authority_functions');
  assert.equal(authorityFunctions.not_generic_runtime_owner, true);
  assert.equal(authorityFunctions.opl_runtime_owner, 'one-person-lab');
  assert.ok(authorityFunctions.forbidden_roles.includes('generic_scheduler_owner'));
  assert.ok(authorityFunctions.forbidden_roles.includes('generic_cli_mcp_product_wrapper_owner'));

  const expectedAuthorityFunctions = [
    {
      moduleId: 'candidate_agent_package_builder',
      authorityRef: 'authority-function-ref:opl-meta-agent/candidate-agent-package-builder',
      implementationRefs: [
        'scripts/bootstrap-sample-agent.ts',
        'scripts/lib/meta-agent-loop.ts',
      ],
      invokedByRefs: ['action-ref:build-agent-baseline'],
    },
    {
      moduleId: 'mechanism_patch_proposal_authorizer',
      authorityRef: 'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer',
      implementationRefs: [
        'scripts/lib/meta-agent-loop.ts',
      ],
      invokedByRefs: ['action-ref:generate-mechanism-patch-proposal'],
    },
  ];

  expectedAuthorityFunctions.forEach((expected) => {
    const functionRef = asObjects(authorityFunctions.functions).find((entry) => entry.function_id === expected.moduleId);
    assert.ok(functionRef, `${expected.moduleId} should have an authority function ref`);
    assert.equal(functionRef.classification, 'minimal_authority_function');
    assert.equal(functionRef.authority_ref, expected.authorityRef);
    assert.deepEqual(functionRef.implementation_refs, expected.implementationRefs);
    assert.deepEqual(functionRef.invoked_by_refs, expected.invokedByRefs);
    assert.equal(functionRef.boundary.refs_only, true);
    assert.equal(functionRef.boundary.can_claim_generic_runtime_owner, false);
    assert.equal(functionRef.boundary.can_write_target_domain_truth, false);
    asStrings(functionRef.implementation_refs).forEach((relativePath) => {
      assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
    });

    const auditModule = asObjects(audit.modules).find((entry) => entry.module_id === expected.moduleId);
    assert.ok(auditModule, `${expected.moduleId} should be represented in functional privatization audit`);
    assert.equal(auditModule.classification, 'minimal_authority_function');
    assert.equal(auditModule.authority_function_ref, expected.authorityRef);
    assert.equal(
      auditModule.authority_function_contract_ref,
      'runtime/authority_functions/meta-agent-authority-functions.json',
    );
    assert.deepEqual(auditModule.implementation_refs, expected.implementationRefs);
    assert.deepEqual(auditModule.code_paths, ['runtime/authority_functions/meta-agent-authority-functions.json']);
    assert.equal(auditModule.role_scope, 'refs_only_minimal_authority_function_not_generic_runtime_owner');
  });
});

test('script physical morphology stays limited to authority refs and helpers', () => {
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const scripts = listFilesByExtension('scripts', '.ts');
  const morphologyPolicy = authorityFunctions.script_morphology_policy;

  assert.equal(morphologyPolicy.policy_ref, 'contracts/private_functional_surface_policy.json');
  assert.deepEqual(
    asObjects(privatePolicy.allowed_script_morphology_classes).map((entry) => entry.class_id),
    [
      'authority_function_implementation_ref',
      'smoke_helper',
      'fixture_or_proof_helper',
      'developer_work_order_materializer',
    ],
  );
  assert.deepEqual(morphologyPolicy.allowed_classes, [
    'authority_function_implementation_ref',
    'smoke_helper',
    'fixture_or_proof_helper',
    'developer_work_order_materializer',
  ]);
  assert.ok(morphologyPolicy.forbidden_roles.includes('generic_runtime_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('generic_registry_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('app_shell_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('agent_lab_execution_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('promotion_gate_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('target_domain_truth_writer'));

  const implementationRefs = new Map<string, string[]>();
  asObjects(authorityFunctions.functions).forEach((functionRef) => {
    asStrings(functionRef.implementation_refs).forEach((scriptRef) => {
      const refs = implementationRefs.get(scriptRef) ?? [];
      refs.push(functionRef.authority_ref);
      implementationRefs.set(scriptRef, refs);
    });
  });

  const classifiedScripts = asObjects(morphologyPolicy.script_classifications).map((entry) => entry.script_ref as string).sort();
  assert.deepEqual(classifiedScripts, scripts);

  asObjects(morphologyPolicy.script_classifications).forEach((entry) => {
    assertRepoRefExists(entry.script_ref);
    assert.ok(entry.classes.length > 0, `${entry.script_ref} should have at least one script class`);
    asStrings(entry.classes).forEach((classId) => {
      assert.ok(
        morphologyPolicy.allowed_classes.includes(classId),
        `${entry.script_ref} uses unsupported script morphology class ${classId}`,
      );
    });
    assert.deepEqual(entry.forbidden_roles, [], `${entry.script_ref} must not carry forbidden script roles`);
    assert.ok(entry.writes_only.length > 0, `${entry.script_ref} should declare refs-only writes`);

    const declaredAuthorityRefs = entry.authority_function_refs ?? [];
    const expectedAuthorityRefs = implementationRefs.get(entry.script_ref) ?? [];
    if (entry.classes.includes('authority_function_implementation_ref')) {
      assert.deepEqual(
        declaredAuthorityRefs.sort(),
        expectedAuthorityRefs.sort(),
        `${entry.script_ref} authority refs must match runtime authority implementation_refs`,
      );
      assert.ok(expectedAuthorityRefs.length > 0, `${entry.script_ref} should be listed by a runtime authority function`);
    } else {
      assert.deepEqual(
        declaredAuthorityRefs,
        [],
        `${entry.script_ref} should not declare authority refs unless it is an implementation ref`,
      );
      assert.equal(
        implementationRefs.has(entry.script_ref),
        false,
        `${entry.script_ref} is referenced by authority functions but not classified as implementation ref`,
      );
    }
  });
});

test('tracked contract, test, and docs surfaces do not carry placeholder markers', () => {
  const scannedDirs = ['agent', 'contracts', 'tests', 'docs'];
  const scannedFiles = [
    'README.md',
    'README.zh-CN.md',
    ...scannedDirs.flatMap((dir) =>
      listMarkdownFiles(dir).concat(
        fs.readdirSync(path.join(repoRoot, dir))
          .filter((entry) => entry.endsWith('.json') || entry.endsWith('.ts'))
          .map((entry) => `${dir}/${entry}`),
      )
    ),
  ];

  scannedFiles.forEach((relativePath) => {
    const content = readText(relativePath);
    assert.equal(placeholderPattern.test(content), false, `${relativePath} should not contain placeholder markers`);
  });
});

test('OPL generated interfaces expose CLI, MCP, Skill, and product-entry descriptors for this repo', () => {
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
  const payload = JSON.parse(result.stdout) as JsonObject;
  const bundle = payload.generated_agent_interfaces;
  assert.equal(bundle.surface_kind, 'opl_generated_agent_interface_bundle');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.source_kind, 'standard_agent_repo_contracts');
  assert.equal(bundle.repo_dir, repoRoot);
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.equal(bundle.status, 'ready');
  assert.equal(asObjects(bundle.cli.descriptors).some((entry) => entry.action_id === 'build-agent-baseline'), true);
  assert.equal(
    asObjects(bundle.mcp.descriptors).find((entry) => entry.name === 'opl_meta_agent_takeover_external_agent_test')
      ?.descriptor_only,
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.build-agent-baseline'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.improve-from-external-agent-lab-suite'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'takeover-external-agent-test'),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'improve-from-external-agent-lab-suite'),
    true,
  );
  assert.equal(bundle.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_write_memory_body, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

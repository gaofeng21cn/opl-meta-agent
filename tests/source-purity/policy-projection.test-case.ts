// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertRepoRefExists,
  asObjects,
  asStrings,
  repoRoot,
  readJson,
  type JsonObject,
} from '../support/contracts.ts';
import {
  ACTIVE_CALLER_SCAN_POLICY_ID,
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
  assertPolicyObject,
  assertPolicyStringList,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  collectFalseReadyClaimMatches,
  collectFalseReadyClaimMatchesFromSource,
  sourceRefIntegrityViolations,
  assertRepoLocalScriptRef,
  valuesAtDottedPath,
  listScriptRefs,
} from '../support/source-purity.ts';

test('developer work-order policy defaults are contract-owned and helper-projection free', () => {
  const contract = readJson(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === 'agent_evidence_and_external_suite_materializers');
  const activeConsumer = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/work-order-refs.ts');
  const retiredProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/work-order-policy-constants.ts');
  const defaultForbiddenTargetPathsOrSurfaces = assertPolicyStringList(
    contract,
    'default_forbidden_target_paths_or_surfaces',
  );
  const defaultRuntimeRequiredSurfaceRefs = assertPolicyStringList(
    contract,
    'default_runtime_required_surface_refs',
  );
  const defaultRuntimeExpectedOutcomes = assertPolicyStringList(
    contract,
    'default_runtime_expected_outcomes',
  );
  const defaultTargetWorkspaceRequiredSurfaceRefs = assertPolicyStringList(
    contract,
    'default_target_workspace_required_surface_refs',
  );
  const defaultTargetWorkspaceExpectedOutcomes = assertPolicyStringList(
    contract,
    'default_target_workspace_expected_outcomes',
  );
  const defaultNoPatchCloseoutEvidence = assertPolicyStringList(
    contract,
    'default_no_patch_closeout_evidence',
  );
  const defaultSourcePatchCloseoutEvidence = assertPolicyStringList(
    contract,
    'default_source_patch_closeout_evidence',
  );
  const targetImprovementDefaultChangeRefPolicy = assertPolicyObject(
    contract,
    'target_improvement_default_change_ref_policy',
  );

  assert.equal(contract.surface_kind, 'developer_work_order_policy');
  assert.equal(contract.state, 'active_contract');
  assert.equal(
    contract.retired_script_projection_tombstone_ref,
    'scripts/lib/work-order-policy-constants.ts',
  );
  assert.equal(contract.retired_script_projection_no_resurrection, true);
  assert.equal(Object.hasOwn(contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(contract.active_policy_consumer_refs), [
    'scripts/lib/work-order-refs.ts',
  ]);
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_write_target_memory_body, false);
  assert.equal(contract.authority_boundary.can_write_target_artifact_body, false);
  assert.equal(contract.authority_boundary.can_authorize_target_quality_or_export, false);
  assert.equal(contract.authority_boundary.can_authorize_submission_readiness, false);
  assert.equal(contract.authority_boundary.can_promote_default_agent, false);

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'scripts/lib/work-order-policy-constants.ts')),
    false,
    'developer work-order policy projection helper should be physically retired',
  );
  assert.equal(retiredProjection, undefined, 'retired work-order policy projection script should not be classified');
  assert.ok(activeConsumer, 'work-order refs helper should consume the developer work-order policy contract');
  assert.deepEqual(asStrings(activeConsumer.contract_refs), [
    DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  ]);
  assert.ok(
    asStrings(activeConsumer.writes_only).includes('developer_work_order_policy_contract_consumer_ref'),
  );
  assert.equal(
    asStrings(receipt.scanned_script_refs).includes('scripts/lib/work-order-policy-constants.ts'),
    false,
    'retired work-order policy projection helper should not appear in scanned script refs',
  );
  assert.ok(retirementGate, 'agent evidence materializer gate should exist');
  assert.ok(
    asStrings(retirementGate.closed_retention_refs).includes(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF),
    'stable developer work-order policy should be moved into a contract while script projection remains retained',
  );
  assert.ok(
    asStrings(retirementGate.closed_retention_refs)
      .includes(`${DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF}#/target_improvement_default_change_ref_policy`),
    'retired target improvement default change-ref mapping tombstone should stay in the developer work-order policy contract',
  );

  assert.ok(defaultForbiddenTargetPathsOrSurfaces.includes('target domain truth surfaces'));
  assert.ok(defaultForbiddenTargetPathsOrSurfaces.includes('export verdict bodies'));
  assert.ok(defaultRuntimeRequiredSurfaceRefs.includes('target_agent_owner_receipt_contract'));
  assert.ok(defaultRuntimeRequiredSurfaceRefs.includes('default_executor_dispatch_execution'));
  assert.ok(
    defaultRuntimeExpectedOutcomes.some((entry) => entry.includes('no forbidden target domain truth')),
  );
  assert.ok(defaultTargetWorkspaceRequiredSurfaceRefs.includes('target_workspace_pyproject_or_lock'));
  assert.ok(defaultTargetWorkspaceRequiredSurfaceRefs.includes('target_repo_hygiene_status'));
  assert.ok(
    defaultTargetWorkspaceExpectedOutcomes.some((entry) => entry.includes('target checkout .venv')),
  );
  assert.ok(
    defaultNoPatchCloseoutEvidence.some((entry) => entry.includes('no target source patch')),
  );
  assert.ok(defaultSourcePatchCloseoutEvidence.includes('patch_traceability_matrix addressed'));
  assert.ok(defaultSourcePatchCloseoutEvidence.includes('temporary worktree cleaned after absorb'));
  assert.equal(
    targetImprovementDefaultChangeRefPolicy.surface_kind,
    'retired_target_improvement_default_change_ref_policy',
  );
  assert.equal(targetImprovementDefaultChangeRefPolicy.state, 'retired_no_source_patch_target_materialization');
  assert.deepEqual(asStrings(targetImprovementDefaultChangeRefPolicy.active_policy_consumer_refs), []);
  assert.equal(targetImprovementDefaultChangeRefPolicy.source_patch_target_materialization_allowed, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.generic_keyword_patch_target_fallback_allowed, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.typed_blocker_on_miss, true);
  assert.ok(
    asStrings(targetImprovementDefaultChangeRefPolicy.replacement_policy_refs).includes('contracts/capability_map.json'),
  );
  assert.equal(Object.hasOwn(targetImprovementDefaultChangeRefPolicy, 'triggers'), false);
  assert.equal(Object.hasOwn(targetImprovementDefaultChangeRefPolicy, 'default_change_refs'), false);
  assert.equal(Object.hasOwn(targetImprovementDefaultChangeRefPolicy, 'change_ref_mappings'), false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.authority_boundary.can_write_target_owner_receipt_body, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.authority_boundary.can_authorize_target_quality_or_export, false);
});

test('standard Foundry policies are contract-owned and helper-projection free', () => {
  const contract = readJson(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers');
  const activeConsumer = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/stage-decomposition-pack-draft-parts/shared.ts');
  const retiredProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/standard-foundry-policies.ts');
  const userStageLogRequiredFields = assertPolicyStringList(contract, 'user_stage_log_required_fields');
  const userStageLogContract = assertPolicyObject(contract, 'user_stage_log_contract');
  const stageProgressDeltaPolicy = assertPolicyObject(contract, 'stage_progress_delta_policy');
  const typedBlockerLineagePolicy = assertPolicyObject(contract, 'typed_blocker_lineage_policy');
  const stageCompletionPolicy = assertPolicyObject(contract, 'stage_completion_policy');
  const seriesDesignProfile = assertPolicyObject(contract, 'series_design_profile');
  const forbiddenGenericOwnerRoles = assertPolicyStringList(contract, 'forbidden_generic_owner_roles');
  const stagePackDefaults = assertPolicyObject(contract, 'stage_pack_defaults');
  const sharedPolicyRelease = assertPolicyObject(contract, 'shared_policy_release');
  const artifactMorphologyPolicy = assertPolicyObject(seriesDesignProfile, 'artifact_morphology_policy');

  assert.equal(contract.surface_kind, 'standard_foundry_policies');
  assert.equal(contract.state, 'active_contract');
  assert.equal(
    contract.retired_script_projection_tombstone_ref,
    'scripts/lib/standard-foundry-policies.ts',
  );
  assert.equal(contract.retired_script_projection_no_resurrection, true);
  assert.equal(Object.hasOwn(contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(contract.active_policy_consumer_refs), [
    'scripts/lib/stage-decomposition-pack-draft-parts/shared.ts',
  ]);
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_read_target_domain_body, false);
  assert.equal(contract.authority_boundary.can_authorize_target_quality_or_export, false);
  assert.equal(contract.authority_boundary.can_promote_default_agent, false);
  assert.equal(contract.authority_boundary.can_replace_opl_framework_or_agent_lab, false);

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'scripts/lib/standard-foundry-policies.ts')),
    false,
    'standard Foundry policy projection helper should be physically retired',
  );
  assert.equal(retiredProjection, undefined, 'retired standard Foundry projection script should not be classified');
  assert.ok(activeConsumer, 'stage-decomposition shared helper should consume standard Foundry policies');
  assert.deepEqual(asStrings(activeConsumer.contract_refs), [
    STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  ]);
  [
    'standard_foundry_policy_ref',
    'forbidden_generic_owner_roles_ref',
    'stage_pack_defaults_ref',
    'shared_policy_release_ref',
    'stage_progress_delta_policy_ref',
    'typed_blocker_lineage_policy_ref',
    'stage_completion_policy_ref',
    'foundry_agent_series_design_profile_ref',
  ].forEach((writeRef) => {
    assert.ok(asStrings(activeConsumer.writes_only).includes(writeRef), `shared helper writes_only ${writeRef}`);
  });
  assert.equal(
    asStrings(receipt.scanned_script_refs).includes('scripts/lib/standard-foundry-policies.ts'),
    false,
    'retired standard Foundry projection helper should not appear in scanned script refs',
  );
  assert.ok(retirementGate, 'stage-decomposition materializer gate should exist');
  assert.ok(
    asStrings(retirementGate.closed_retention_refs).includes(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF),
    'stable Foundry policy should be moved into a contract while script projection remains retained',
  );

  assert.ok(userStageLogRequiredFields.includes('stage_name'));
  assert.ok(userStageLogRequiredFields.includes('evidence_refs'));
  assert.ok(forbiddenGenericOwnerRoles.includes('generic_scheduler_owner'));
  assert.ok(forbiddenGenericOwnerRoles.includes('generic_cli_mcp_product_wrapper_owner'));
  assert.ok(forbiddenGenericOwnerRoles.includes('generated_surface_owner_in_domain_repo'));
  assert.equal(stagePackDefaults.stage_pack_conformance_version, 'standard-stage-pack.v2');
  assert.equal(stagePackDefaults.default_stage_executor_binding_ref, 'default_codex_cli');
  assert.equal(
    sharedPolicyRelease.policy_release_contract_ref,
    'contracts/opl-framework/foundry-agent-series-policy-release.json',
  );
  assert.equal(sharedPolicyRelease.domain_contract_policy_release_pin_required, true);
  assert.equal(sharedPolicyRelease.domain_adapter_must_not_copy_policy_body_as_authority, true);
  assert.deepEqual(asStrings(userStageLogContract.required_domain_semantic_fields), userStageLogRequiredFields);
  assert.equal(stageProgressDeltaPolicy.surface_kind, 'opl_stage_progress_delta_policy');
  assert.equal(Object.hasOwn(stageProgressDeltaPolicy, 'deliverable_delta_aliases'), false);
  assert.equal(Object.hasOwn(stageProgressDeltaPolicy, 'platform_delta_aliases'), false);
  assert.equal(stageProgressDeltaPolicy.platform_only_is_not_deliverable_progress, true);
  assert.equal(
    stageProgressDeltaPolicy.missing_delta_policy,
    'emit_zero_deliverable_delta_and_next_forced_delta_without_inventing_target_agent_work',
  );
  assert.equal(typedBlockerLineagePolicy.surface_kind, 'family-stall-lineage.v1');
  assert.equal(typedBlockerLineagePolicy.version, 'family-stall-lineage.v1');
  assert.equal(stageCompletionPolicy.surface_kind, 'domain_stage_completion_policy');
  assert.equal(stageCompletionPolicy.completion_judgment_owner, 'domain_stage');
  assert.equal(stageCompletionPolicy.closeout_packet_required, true);
  assert.equal(stageCompletionPolicy.provider_completion_is_domain_completion, false);
  assert.equal(stageCompletionPolicy.opl_content_judgment_allowed, false);
  assert.equal(stageCompletionPolicy.next_stage_transition_owner, 'opl_runtime');
  assert.ok(asStrings(stageCompletionPolicy.required_closeout_outcomes).includes('completed_and_continue'));
  assert.ok(asStrings(stageCompletionPolicy.accepted_closeout_ref_fields).includes('owner_receipt_ref'));
  assert.equal(stageCompletionPolicy.authority_boundary.opl_can_decide_domain_completion, false);
  assert.equal(stageCompletionPolicy.authority_boundary.provider_completion_counts_as_stage_complete, false);
  assert.equal(seriesDesignProfile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('prompts'));
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('quality_gates'));
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('stage_completion_policy'));
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('artifact_morphology'));
  assert.equal(artifactMorphologyPolicy.surface_kind, 'target_domain_artifact_morphology_policy');
  assert.equal(artifactMorphologyPolicy.required_for_new_target_agent_baseline, true);
  assert.equal(artifactMorphologyPolicy.required_contract_ref, 'contracts/artifact_morphology_contract.json');
  assert.ok(asStrings(artifactMorphologyPolicy.must_cover).includes('native_source_format'));
  assert.ok(asStrings(artifactMorphologyPolicy.must_cover).includes('asset_file_path_custody'));
  assert.ok(
    asStrings(artifactMorphologyPolicy.fail_closed_conditions)
      .includes('owner/source declared extent is silently reduced'),
  );
  assert.equal(artifactMorphologyPolicy.authority_boundary.oma_can_write_target_artifact_body, false);
  assert.equal(artifactMorphologyPolicy.authority_boundary.target_domain_owner_must_accept_artifact_shape, true);
});

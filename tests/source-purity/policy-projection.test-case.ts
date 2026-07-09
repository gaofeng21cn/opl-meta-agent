// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  repoRoot,
  readJson,
  type JsonObject,
} from '../support/contracts.ts';
import {
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  assertFalseFlags,
  assertPolicyObject,
  assertPolicyStringList,
} from '../support/source-purity.ts';

function assertRetiredProjectionContract(args: {
  contract: JsonObject;
  contractRef: string;
  retiredScriptRef: string;
  activeConsumerRef: string;
  gateId: string;
  boundaryFalseFlags: string[];
}): JsonObject {
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === args.gateId);
  const activeConsumer = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === args.activeConsumerRef);
  const retiredProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === args.retiredScriptRef);

  assert.equal(args.contract.state, 'active_contract');
  assert.equal(args.contract.retired_script_projection_tombstone_ref, args.retiredScriptRef);
  assert.equal(args.contract.retired_script_projection_no_resurrection, true);
  assert.equal(Object.hasOwn(args.contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(args.contract.active_policy_consumer_refs), [args.activeConsumerRef]);
  assertFalseFlags(args.contract.authority_boundary, args.boundaryFalseFlags, `${args.contractRef} boundary`);
  assert.equal(fs.existsSync(path.join(repoRoot, args.retiredScriptRef)), false);
  assert.equal(retiredProjection, undefined, `${args.retiredScriptRef} should not be classified`);
  assert.ok(activeConsumer, `${args.activeConsumerRef} should consume ${args.contractRef}`);
  assert.deepEqual(asStrings(activeConsumer.contract_refs), [args.contractRef]);
  assert.equal(asStrings(receipt.scanned_script_refs).includes(args.retiredScriptRef), false);
  assert.ok(retirementGate, `${args.gateId} should exist`);
  assert.ok(asStrings(retirementGate.closed_retention_refs).includes(args.contractRef));
  return activeConsumer as JsonObject;
}

test('developer work-order policy is contract-owned after helper projection retirement', () => {
  const contract = readJson(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF);
  const targetImprovementDefaultChangeRefPolicy = assertPolicyObject(
    contract,
    'target_improvement_default_change_ref_policy',
  );
  const activeConsumer = assertRetiredProjectionContract({
    contract,
    contractRef: DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
    retiredScriptRef: 'scripts/lib/work-order-policy-constants.ts',
    activeConsumerRef: 'scripts/lib/work-order-refs.ts',
    gateId: 'agent_evidence_and_external_suite_materializers',
    boundaryFalseFlags: [
      'can_write_target_domain_truth',
      'can_write_target_memory_body',
      'can_write_target_artifact_body',
      'can_authorize_target_quality_or_export',
      'can_authorize_submission_readiness',
      'can_promote_default_agent',
    ],
  });

  assert.equal(contract.surface_kind, 'developer_work_order_policy');
  assert.ok(asStrings(activeConsumer.writes_only).includes('developer_work_order_policy_contract_consumer_ref'));
  assert.ok(assertPolicyStringList(contract, 'default_forbidden_target_paths_or_surfaces')
    .includes('target domain truth surfaces'));
  assert.ok(assertPolicyStringList(contract, 'default_forbidden_target_paths_or_surfaces')
    .includes('export verdict bodies'));
  assert.ok(assertPolicyStringList(contract, 'default_runtime_required_surface_refs')
    .includes('target_agent_owner_receipt_contract'));
  assert.ok(assertPolicyStringList(contract, 'default_runtime_required_surface_refs')
    .includes('default_executor_dispatch_execution'));
  assert.ok(assertPolicyStringList(contract, 'default_target_workspace_expected_outcomes')
    .some((entry) => entry.includes('target checkout .venv')));
  assert.ok(assertPolicyStringList(contract, 'default_source_patch_closeout_evidence')
    .includes('patch_traceability_matrix addressed'));
  assert.ok(assertPolicyStringList(contract, 'default_source_patch_closeout_evidence')
    .includes('temporary worktree cleaned after absorb'));

  assert.equal(targetImprovementDefaultChangeRefPolicy.surface_kind, 'retired_target_improvement_default_change_ref_policy');
  assert.equal(targetImprovementDefaultChangeRefPolicy.source_patch_target_materialization_allowed, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.generic_keyword_patch_target_fallback_allowed, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.typed_blocker_on_miss, true);
  assert.equal(Object.hasOwn(targetImprovementDefaultChangeRefPolicy, 'triggers'), false);
  assertFalseFlags(targetImprovementDefaultChangeRefPolicy.authority_boundary, [
    'can_write_target_domain_truth',
    'can_write_target_owner_receipt_body',
    'can_authorize_target_quality_or_export',
  ], 'target improvement policy boundary');
});

test('standard Foundry policies are contract-owned after helper projection retirement', () => {
  const contract = readJson(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF);
  const userStageLogRequiredFields = assertPolicyStringList(contract, 'user_stage_log_required_fields');
  const userStageLogContract = assertPolicyObject(contract, 'user_stage_log_contract');
  const stageProgressDeltaPolicy = assertPolicyObject(contract, 'stage_progress_delta_policy');
  const typedBlockerLineagePolicy = assertPolicyObject(contract, 'typed_blocker_lineage_policy');
  const stageCompletionPolicy = assertPolicyObject(contract, 'stage_completion_policy');
  const seriesDesignProfile = assertPolicyObject(contract, 'series_design_profile');
  const artifactMorphologyPolicy = assertPolicyObject(seriesDesignProfile, 'artifact_morphology_policy');
  const activeConsumer = assertRetiredProjectionContract({
    contract,
    contractRef: STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
    retiredScriptRef: 'scripts/lib/standard-foundry-policies.ts',
    activeConsumerRef: 'scripts/lib/stage-decomposition-pack-draft/shared.ts',
    gateId: 'build_agent_baseline_and_stage_decomposition_materializers',
    boundaryFalseFlags: [
      'can_write_target_domain_truth',
      'can_read_target_domain_body',
      'can_authorize_target_quality_or_export',
      'can_promote_default_agent',
      'can_replace_opl_framework_or_agent_lab',
    ],
  });

  assert.equal(contract.surface_kind, 'standard_foundry_policies');
  [
    'standard_foundry_policy_ref',
    'stage_progress_delta_policy_ref',
    'typed_blocker_lineage_policy_ref',
    'stage_completion_policy_ref',
    'foundry_agent_series_design_profile_ref',
  ].forEach((writeRef) => {
    assert.ok(asStrings(activeConsumer.writes_only).includes(writeRef));
  });
  assert.deepEqual(asStrings(userStageLogContract.required_domain_semantic_fields), userStageLogRequiredFields);
  assert.equal(stageProgressDeltaPolicy.surface_kind, 'opl_stage_progress_delta_policy');
  assert.equal(stageProgressDeltaPolicy.platform_only_is_not_deliverable_progress, true);
  assert.equal(Object.hasOwn(stageProgressDeltaPolicy, 'deliverable_delta_aliases'), false);
  assert.equal(Object.hasOwn(stageProgressDeltaPolicy, 'platform_delta_aliases'), false);
  assert.equal(typedBlockerLineagePolicy.surface_kind, 'family-stall-lineage.v1');
  assert.equal(stageCompletionPolicy.completion_judgment_owner, 'domain_stage');
  assert.equal(stageCompletionPolicy.provider_completion_is_domain_completion, false);
  assert.ok(asStrings(stageCompletionPolicy.accepted_closeout_ref_fields).includes('owner_receipt_ref'));
  assertFalseFlags(stageCompletionPolicy.authority_boundary, [
    'opl_can_decide_domain_completion',
    'provider_completion_counts_as_stage_complete',
  ], 'stage completion policy boundary');
  assert.equal(seriesDesignProfile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('artifact_morphology'));
  assert.equal(artifactMorphologyPolicy.surface_kind, 'target_domain_artifact_morphology_policy');
  assert.equal(artifactMorphologyPolicy.required_for_new_target_agent_baseline, true);
  assert.equal(artifactMorphologyPolicy.required_contract_ref, 'contracts/artifact_morphology_contract.json');
  assertFalseFlags(artifactMorphologyPolicy.authority_boundary, [
    'oma_can_write_target_artifact_body',
  ], 'artifact morphology policy boundary');
});

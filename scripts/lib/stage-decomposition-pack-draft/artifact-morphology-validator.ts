import type { JsonObject } from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import {
  asRecord,
  asString,
  asStringArray,
  assertBooleanFalse,
} from './shared.ts';

export function validateArtifactMorphologyContract(contract: JsonObject, targetAgent: TargetAgent): void {
  if (contract.surface_kind !== 'target_domain_artifact_morphology_contract') {
    throw new Error('stage-decomposition pack draft artifact_morphology_contract.surface_kind must be target_domain_artifact_morphology_contract.');
  }
  if (contract.version !== 'artifact-morphology.v1') {
    throw new Error('stage-decomposition pack draft artifact_morphology_contract.version must be artifact-morphology.v1.');
  }
  if (contract.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft artifact_morphology_contract target_domain_id does not match target agent.');
  }
  const nativeSourcePolicy = asRecord(contract.native_source_policy, 'artifact_morphology_contract.native_source_policy');
  if (nativeSourcePolicy.required !== true) {
    throw new Error('stage-decomposition pack draft artifact_morphology_contract.native_source_policy.required must be true.');
  }
  if (nativeSourcePolicy.creative_source_must_be_domain_native !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must require domain-native creative source refs.');
  }
  if (nativeSourcePolicy.creative_source_must_not_be_generator_code !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must reject generator-code prose/artifact body as source of truth.');
  }
  const generatorRoles = asStringArray(
    nativeSourcePolicy.generator_code_allowed_roles,
    'artifact_morphology_contract.native_source_policy.generator_code_allowed_roles',
  );
  ['assembly', 'metrics', 'validation', 'export', 'reporting'].forEach((role) => {
    if (!generatorRoles.includes(role)) {
      throw new Error(`stage-decomposition pack draft artifact morphology missing generator role ${role}.`);
    }
  });

  const artifactBodyPolicy = asRecord(contract.artifact_body_policy, 'artifact_morphology_contract.artifact_body_policy');
  if (artifactBodyPolicy.target_domain_owns_artifact_body !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must keep artifact body authority with target domain.');
  }
  [
    'oma_can_write_target_artifact_body',
    'opl_can_infer_artifact_body_shape',
  ].forEach((field) => assertBooleanFalse(artifactBodyPolicy, field, `artifact_morphology_contract.artifact_body_policy.${field}`));
  if (artifactBodyPolicy.scaffold_or_suite_pass_is_not_artifact_shape_evidence !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must reject scaffold/suite pass as artifact shape evidence.');
  }

  const shardingPolicy = asRecord(contract.sharding_policy, 'artifact_morphology_contract.sharding_policy');
  if (shardingPolicy.required_for_book_length_or_large_artifacts !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must require sharding for book-length or large artifacts.');
  }
  if (shardingPolicy.assembled_output_is_delivery_ref_not_primary_creative_source !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must separate creative source from assembled delivery ref.');
  }
  if (shardingPolicy.monolithic_creative_source_requires_owner_approval !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must owner-gate monolithic creative sources.');
  }

  const extentPolicy = asRecord(contract.target_extent_policy, 'artifact_morphology_contract.target_extent_policy');
  if (extentPolicy.owner_or_source_declared_extent_is_binding !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must bind owner/source-declared extent.');
  }
  if (extentPolicy.silent_extent_downgrade_forbidden !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must forbid silent extent downgrade.');
  }
  if (extentPolicy.shortfall_with_consumable_artifact !== 'completed_with_quality_debt'
    || extentPolicy.shortfall_without_consumable_artifact !== 'typed_blocker'
    || extentPolicy.shortfall_blocks_stage_transition !== false
    || extentPolicy.shortfall_blocks_quality_or_ready_claims !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must route extent shortfall through progress-first quality debt.');
  }

  const assetCustodyPolicy = asRecord(contract.asset_custody_policy, 'artifact_morphology_contract.asset_custody_policy');
  if (assetCustodyPolicy.project_local_asset_paths_required_for_final_assets !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must require project-local final asset paths.');
  }
  if (assetCustodyPolicy.generated_asset_without_exposed_path_is_typed_blocker !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must block generated assets without exposed paths.');
  }
  if (assetCustodyPolicy.placeholder_or_chat_only_asset_is_not_final_evidence !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must reject placeholder/chat-only asset evidence.');
  }

  const reviewPolicy = asRecord(contract.realistic_task_review_policy, 'artifact_morphology_contract.realistic_task_review_policy');
  if (reviewPolicy.required_before_baseline_quality_acceptance !== true
    || reviewPolicy.missing_review_with_consumable_artifact !== 'completed_with_quality_debt'
    || reviewPolicy.missing_review_blocks_stage_transition !== false) {
    throw new Error('stage-decomposition pack draft artifact morphology must keep realistic review as a quality-acceptance gate, not a stage-transition blocker.');
  }
  if (reviewPolicy.reviewer_must_check_artifact_morphology !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must require reviewer artifact-shape checks.');
  }
  if (reviewPolicy.scaffold_interface_or_scorecard_only_review_forbidden !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must reject scaffold/interface/scorecard-only review.');
  }

  const stageRefs = asRecord(contract.stage_refs, 'artifact_morphology_contract.stage_refs');
  [
    'artifact_morphology_ref',
    'native_source_format_ref',
    'shard_unit_ref',
    'extent_contract_ref',
    'asset_custody_ref',
  ].forEach((field) => asString(stageRefs[field], `artifact_morphology_contract.stage_refs.${field}`));

  const boundary = asRecord(contract.authority_boundary, 'artifact_morphology_contract.authority_boundary');
  [
    'oma_can_write_target_domain_truth',
    'oma_can_write_target_artifact_body',
    'oma_can_authorize_target_quality_or_export',
  ].forEach((field) => assertBooleanFalse(boundary, field, `artifact_morphology_contract.authority_boundary.${field}`));
  if (boundary.target_domain_owner_must_accept_morphology !== true) {
    throw new Error('stage-decomposition pack draft artifact morphology must require target-domain owner acceptance.');
  }
  if (boundary.target_domain_owner_acceptance_blocks_stage_transition !== false
    || boundary.target_domain_owner_acceptance_blocks_quality_or_ready_claims !== true) {
    throw new Error('target-domain morphology acceptance must gate quality/readiness claims without blocking artifact progress.');
  }
}

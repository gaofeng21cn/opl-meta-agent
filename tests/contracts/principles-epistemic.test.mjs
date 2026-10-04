import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { affectedDimensions, epistemicDimensions, readJson, root } from './support.mjs';
const standardAgentPrincipleIds = [
  'ai_first_execution',
  'contract_backed_boundary',
  'domain_truth_authority',
  'stage_prompt_skill_tool_separation',
  'domain_intake_mapping',
  'workspace_source_intake_shell',
  'owner_delta_progress',
  'quality_budget_progress_first',
  'parallel_executor_autonomy',
  'module_organization',
];
export function registerPrinciplesEpistemicTests() {
test('OMA adopts canonical Standard Agent principles without a second general policy body', () => {
  const adoption = readJson('contracts/standard-agent-principles-adoption.json');
  const compiler = readJson('contracts/pack_compiler_input.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const descriptor = readJson('contracts/domain_descriptor.json');
  const provider = readJson('contracts/foundry_provider.json');
  const manifest = readJson('agent/stages/manifest.json');

  assert.equal(adoption.surface_kind, 'opl_standard_agent_principles_adoption');
  assert.equal(adoption.version, 'standard-agent-principles-adoption.v1');
  assert.equal(adoption.owner, 'oma');
  assert.equal(adoption.domain_id, 'agent_engineering');
  assert.equal(adoption.state, 'active_contract');
  assert.equal(
    adoption.adopted_principle_pack_ref,
    'contracts/opl-framework/standard-agent-principles.json',
  );
  assert.deepEqual(adoption.adopted_principle_ids, standardAgentPrincipleIds);
  assert.deepEqual(adoption.source_refs, {
    opl_projection_ref: 'agent/principles/opl-standard-agent-principles.md',
    domain_specialization_ref: 'agent/principles/domain-specialization.md',
    stage_manifest_ref: 'agent/stages/manifest.json',
    stage_control_plane_ref: 'opl-generated:family_stage_control_plane',
    pack_compiler_input_ref: 'contracts/pack_compiler_input.json',
    action_catalog_ref: 'contracts/action_catalog.json',
    domain_descriptor_ref: 'contracts/domain_descriptor.json',
    foundry_provider_ref: 'contracts/foundry_provider.json',
  });
  assert.deepEqual(adoption.domain_mapping.domain_intake, {
    principle_id: 'domain_intake_mapping',
    domain_stage_ref: 'agent/stages/manifest.json#/stages/0',
    stage_id: 'mission-intake',
    prompt_ref: 'agent/prompts/mission-intake.md',
    is_standalone_skill: false,
    owner_receipt_or_typed_blocker_required: false,
    consumable_artifact_progress_receipt_allowed: true,
  });
  assert.equal(adoption.domain_mapping.workspace_source_intake_shell.domain_source_truth_owner, 'agent_engineering');
  assert.deepEqual(adoption.oma_specialization, {
    agent_id: 'oma',
    domain_id: 'agent_engineering',
    public_action_id: 'engineer-agent',
    public_action_ref: 'contracts/action_catalog.json#/actions/0',
    internal_provider_operations: ['design', 'diagnose'],
    provider_ref: 'contracts/foundry_provider.json',
    provider_role: 'foundry_semantic_provider',
  });
  assert.deepEqual(adoption.module_organization, {
    framework_module_registry_ref: 'contracts/opl-framework/brand-module-registry.json',
    domain_pack_root: 'agent/',
    domain_pack_role: 'declarative_domain_pack',
    minimal_authority_functions_ref: 'contracts/pack_compiler_input.json#/minimal_authority_functions',
    generated_surface_handoff_ref: 'contracts/generated_surface_handoff.json',
    capability_pack_is_not_domain_intake: true,
  });
  assert.deepEqual(adoption.authority_boundary, {
    adoption_can_claim_domain_ready: false,
    adoption_can_claim_production_ready: false,
    opl_can_write_domain_truth: false,
    opl_can_write_memory_body: false,
    opl_can_authorize_quality_or_export: false,
    opl_can_create_owner_receipt: false,
    opl_can_create_typed_blocker: false,
  });

  assert.equal(adoption.domain_mapping.domain_intake.stage_id, manifest.stages[0].stage_id);
  assert.equal(adoption.oma_specialization.domain_id, descriptor.domain_id);
  assert.equal(adoption.oma_specialization.public_action_id, actionCatalog.actions[0].action_id);
  assert.deepEqual(
    adoption.oma_specialization.internal_provider_operations,
    Object.keys(provider.operations),
  );
  assert.ok(compiler.required_domain_pack_paths.includes('contracts/standard-agent-principles-adoption.json'));
});

test('primary Skill is mirrored by the carrier and has explicit admission metadata', () => {
  const canonical = fs.readFileSync(path.join(root, 'agent/primary_skill/SKILL.md'), 'utf8');
  const carrier = fs.readFileSync(
    path.join(root, 'plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md'),
    'utf8',
  );

  assert.equal(carrier, canonical);
  assert.match(canonical, /^name: opl-meta-agent$/m);
  assert.match(canonical, /^description: \S.+$/m);
});

test('EvalSpec carries the reachability categories for professional Skill use', () => {
  const blueprint = readJson('contracts/fixtures/foundry-protocol/agent-blueprint.json');
  const protectedCategories = new Set(
    blueprint.eval_spec.protected_requirements.map((entry) => entry.category),
  );
  assert.ok(protectedCategories.has('production-contract-reachability'));
  assert.ok(protectedCategories.has('effective-role-prompt-reachability'));
  assert.ok(protectedCategories.has('professional-skill-consumption-reachability'));
});

test('OMA adopts epistemic provenance without making hashes review authority', () => {
  const adoption = readJson('contracts/epistemic_review_adoption.json');
  const qualityPolicy = readJson('contracts/stage_quality_cycle_policy.json');
  const compiler = readJson('contracts/pack_compiler_input.json');

  assert.equal(adoption.surface_kind, 'oma_epistemic_review_adoption');
  assert.equal(adoption.evidence_profile, 'epistemic_provenance');
  assert.equal(adoption.trust_model, 'trusted_local_workspace');
  assert.equal(
    adoption.adversary_model,
    'trusted_local_workspace_without_malicious_whole-workspace_forgery',
  );
  assert.deepEqual(adoption.framework_baseline, {
    currentness_contract_ref: 'contracts/opl-framework/epistemic-review-currentness-contract.json',
    currentness_contract_surface_kind: 'opl_epistemic_review_currentness_contract',
    currentness_contract_version: 'opl-epistemic-review-currentness-contract.v2',
    scope_schema_ref: 'contracts/opl-framework/epistemic-review-scope-v2.schema.json',
    scope_surface_kind: 'opl_epistemic_review_scope',
    scope_version: 'opl-epistemic-review-scope.v2',
    stage_quality_cycle_contract_ref: 'contracts/opl-framework/stage-quality-cycle-contract.json',
    scope_budget_version: 'opl-stage-quality-scope-budget.v1',
  });
  assert.equal(adoption.currentness_policy.hash_change_alone_invalidates_review, false);
  assert.equal(
    adoption.currentness_policy.locator_hash_role,
    'optional_locator_stale_hint_and_deduplication_only',
  );
  assert.equal(adoption.currentness_policy.exact_input_digest_is_content_authority, false);
  assert.deepEqual(Object.keys(adoption.review_dimensions), epistemicDimensions);
  assert.equal(adoption.authority_boundary.hash_is_content_authority, false);
  assert.equal(adoption.authority_boundary.oma_can_create_parallel_currentness_engine, false);

  assert.equal(
    qualityPolicy.epistemic_review_currentness.adoption_ref,
    'contracts/epistemic_review_adoption.json',
  );
  assert.deepEqual(qualityPolicy.epistemic_review_currentness.scope_budget_defaults, {
    surface_kind: 'opl_stage_quality_scope_budget',
    version: 'opl-stage-quality-scope-budget.v1',
    max_attempts: 3,
    max_elapsed_ms: null,
    max_tokens: null,
    token_budget_requires_observed_usage: true,
    foreground_execution_must_use_managed_attempt: true,
  });
  for (const [stageId, policy] of Object.entries(qualityPolicy.stages)) {
    assert.equal(
      policy.formal_review.max_repair_rounds,
      policy.formal_review.required ? 3 : 0,
      stageId,
    );
  }
  assert.ok(compiler.required_domain_pack_paths.includes('contracts/epistemic_review_adoption.json'));

  const expectations = adoption.counterexample_expectations;
  for (const caseId of [
    'hash_or_path_only_locator_change',
    'governance_or_review_receipt_only_change',
    'no_change_generation_transport',
  ]) {
    assert.deepEqual(expectations[caseId].stale_review_dimensions, [], caseId);
    assert.deepEqual(expectations[caseId].current_review_dimensions, epistemicDimensions, caseId);
  }
  const blueprintChange = expectations.agent_blueprint_semantic_change_with_unchanged_hash;
  assert.equal(blueprintChange.locator_hash_changed, false);
  assert.equal(blueprintChange.fail_closed, true);
  assert.deepEqual(
    affectedDimensions(adoption, blueprintChange.semantic_changed_dimensions),
    blueprintChange.stale_review_dimensions,
  );
  const evidenceClaimChange = expectations.evidence_bundle_claim_change;
  assert.deepEqual(
    affectedDimensions(adoption, evidenceClaimChange.semantic_changed_dimensions),
    evidenceClaimChange.stale_review_dimensions,
  );
});
}

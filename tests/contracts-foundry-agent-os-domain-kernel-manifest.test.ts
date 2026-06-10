import test from 'node:test';
import {
  assert,
  asStrings,
  readJson,
} from './support/contracts.ts';

test('OMA Foundry Agent OS domain kernel manifest declares agent-building authority', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  assert.equal(manifest.surface_kind, 'foundry_agent_os_domain_kernel_manifest');
  assert.equal(manifest.domain_id, 'opl-meta-agent');
  assert.equal(manifest.domain_agent_id, 'oma');
  assert.equal(manifest.owner, 'opl-meta-agent');
  assert.equal(manifest.role, 'w4_domain_kernel_manifest');

  const retained = new Set(asStrings(manifest.domain_authority_kernel.retained_surfaces));
  [
    'agent_building_semantics',
    'user_intent_understanding',
    'target_brief_materialization',
    'stage_decomposition',
    'candidate_agent_package_materialization_policy',
    'developer_work_order_materialization',
    'mechanism_patch_proposal_materialization',
    'target_capability_improvement_candidate',
    'independent_reviewer_evidence_requirements',
    'target_agent_no_forbidden_write_proof',
    'route_back_evidence',
    'owner_receipt_signer',
    'typed_blocker_materializer',
  ].forEach((surface) => assert.equal(retained.has(surface), true, surface));
  assert.equal(manifest.domain_authority_kernel.owner_receipt_signer, 'opl-meta-agent_authority_kernel');
  assert.equal(manifest.domain_authority_kernel.typed_blocker_signer, 'opl-meta-agent_authority_kernel');
  assert.ok(asStrings(manifest.domain_authority_kernel.accepted_answer_shapes).includes('developer_patch_work_order_ref'));
  assert.ok(asStrings(manifest.domain_authority_kernel.accepted_answer_shapes).includes('target_owner_typed_blocker_ref'));
});

test('OMA Foundry Agent OS domain kernel manifest upcollects Agent Lab and work-order primitives to OPL', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  assert.deepEqual(manifest.default_read_root, {
    surface: 'current_owner_delta',
    ordinary_operator_root: true,
    raw_agent_lab_result_role: 'drilldown_only',
    work_order_count_role: 'audit_only',
    generated_interface_readiness_role: 'audit_only',
    projection_can_be_owner_answer: false,
  });

  const upcollect = new Set(asStrings(manifest.opl_upcollect_surfaces));
  [
    'agent_lab_runtime',
    'suite_execution',
    'promotion_canary_rollback_shell',
    'scaffold_generator',
    'generated_interface_bundle',
    'work_order_execute_absorb_cleanup',
    'target_owner_closeout_hook_invocation',
    'console_current_owner_delta_projection',
    'refs_only_vault_lineage',
    'capability_registry_abi',
  ].forEach((surface) => assert.equal(upcollect.has(surface), true, surface));
});

test('OMA Foundry Agent OS domain kernel manifest forbids false authority', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  [
    'opl',
    'agent_lab',
    'vault',
    'console',
    'runway',
    'pack',
    'capability_registry',
  ].forEach((surface) => {
    assert.deepEqual(manifest.forbidden_authority_flags[surface], {
      can_write_domain_truth: false,
      can_sign_owner_receipt: false,
      can_create_domain_typed_blocker: false,
      can_authorize_quality_export_publication_or_review_verdict: false,
    });
  });

  assert.deepEqual(manifest.target_agent_forbidden_authority, {
    can_write_target_domain_truth: false,
    can_mutate_target_domain_artifact_body: false,
    can_write_target_memory_body: false,
    can_authorize_target_quality_or_export_verdict: false,
    can_write_target_owner_receipt_body: false,
    can_promote_default_agent_without_gate: false,
  });

  [
    'target_agent_ready',
    'quality_export_ready',
    'app_live_rendering_ready',
    'human_approval',
    'default_promotion',
    'family_production_ready',
    'production_ready',
  ].forEach((claim) => assert.equal(manifest.non_claims[claim], false, claim));
});

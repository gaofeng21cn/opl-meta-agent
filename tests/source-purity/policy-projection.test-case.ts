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
} from '../support/source-purity.ts';

function assertContractOwnedProjection(args: {
  contractRef: string;
  retiredScriptRef: string;
  activeConsumerRef: string;
  gateId: string;
  boundaryFalseFlags: string[];
}): { contract: JsonObject; activeConsumer: JsonObject } {
  const contract = readJson(args.contractRef);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === args.gateId);
  const activeConsumer = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === args.activeConsumerRef);

  assert.equal(contract.state, 'active_contract');
  assert.equal(contract.retired_script_projection_tombstone_ref, args.retiredScriptRef);
  assert.equal(contract.retired_script_projection_no_resurrection, true);
  assert.equal(Object.hasOwn(contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(contract.active_policy_consumer_refs), [args.activeConsumerRef]);
  assertFalseFlags(contract.authority_boundary, args.boundaryFalseFlags, `${args.contractRef} boundary`);

  assert.equal(fs.existsSync(path.join(repoRoot, args.retiredScriptRef)), false);
  assert.equal(
    asObjects(morphologyPolicy.script_classifications)
      .some((entry) => entry.script_ref === args.retiredScriptRef),
    false,
  );
  assert.equal(asStrings(receipt.scanned_script_refs).includes(args.retiredScriptRef), false);
  assert.ok(activeConsumer);
  assert.deepEqual(asStrings(activeConsumer.contract_refs), [args.contractRef]);
  assert.ok(retirementGate);
  assert.ok(asStrings(retirementGate.closed_retention_refs).includes(args.contractRef));
  return { contract, activeConsumer };
}

test('retired policy helpers cannot resurrect beside their contract owners', () => {
  const cases = [
    {
      contractRef: DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
      retiredScriptRef: 'scripts/lib/work-order-policy-constants.ts',
      activeConsumerRef: 'scripts/lib/work-order-refs.ts',
      gateId: 'agent_evidence_and_external_suite_materializers',
      boundaryFalseFlags: [
        'can_write_target_domain_truth',
        'can_write_target_memory_body',
        'can_write_target_artifact_body',
        'can_authorize_target_quality_or_export',
        'can_promote_default_agent',
      ],
      verify(contract: JsonObject, activeConsumer: JsonObject): void {
        assert.equal(contract.surface_kind, 'developer_work_order_policy');
        assert.ok(asStrings(activeConsumer.writes_only).includes('developer_work_order_policy_contract_consumer_ref'));
        const defaultChangePolicy = assertPolicyObject(contract, 'target_improvement_default_change_ref_policy');
        assert.equal(defaultChangePolicy.source_patch_target_materialization_allowed, false);
        assert.equal(defaultChangePolicy.generic_keyword_patch_target_fallback_allowed, false);
        assert.equal(defaultChangePolicy.typed_blocker_on_miss, true);
      },
    },
    {
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
      verify(contract: JsonObject, activeConsumer: JsonObject): void {
        assert.equal(contract.surface_kind, 'standard_foundry_policies');
        assert.ok(asStrings(activeConsumer.writes_only).includes('standard_foundry_policy_ref'));
        const completionPolicy = assertPolicyObject(contract, 'stage_completion_policy');
        assert.equal(completionPolicy.completion_judgment_owner, 'domain_stage');
        assert.equal(completionPolicy.provider_completion_is_domain_completion, false);
        const seriesProfile = assertPolicyObject(contract, 'series_design_profile');
        const morphologyPolicy = assertPolicyObject(seriesProfile, 'artifact_morphology_policy');
        assert.equal(morphologyPolicy.required_for_new_target_agent_baseline, true);
        assert.equal(morphologyPolicy.required_contract_ref, 'contracts/artifact_morphology_contract.json');
      },
    },
  ];

  cases.forEach(({ verify, ...contractCase }) => {
    const { contract, activeConsumer } = assertContractOwnedProjection(contractCase);
    verify(contract, activeConsumer);
  });
});

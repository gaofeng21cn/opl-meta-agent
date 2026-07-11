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
  assertEveryFlagFalse,
  asBooleanRecord,
  assertPolicyObject,
} from '../support/source-purity.ts';

function assertContractOwnedProjection(args: {
  contractRef: string;
  retiredScriptRef?: string;
  activeConsumerRef: string;
  gateId: string;
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
  assert.equal(Object.hasOwn(contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(contract.active_policy_consumer_refs), [args.activeConsumerRef]);
  assertEveryFlagFalse(asBooleanRecord(contract.authority_boundary), `${args.contractRef} boundary`);

  if (args.retiredScriptRef) {
    assert.equal(contract.retired_script_projection_tombstone_ref, args.retiredScriptRef);
    assert.equal(contract.retired_script_projection_no_resurrection, true);
    assert.equal(fs.existsSync(path.join(repoRoot, args.retiredScriptRef)), false);
    assert.equal(
      asObjects(morphologyPolicy.script_classifications)
        .some((entry) => entry.script_ref === args.retiredScriptRef),
      false,
    );
    assert.equal(asStrings(receipt.scanned_script_refs).includes(args.retiredScriptRef), false);
  }
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
      activeConsumerRef: 'scripts/lib/stage-decomposition-pack-draft/shared.ts',
      gateId: 'build_agent_baseline_and_stage_decomposition_materializers',
      verify(contract: JsonObject, activeConsumer: JsonObject): void {
        assert.equal(contract.surface_kind, 'standard_foundry_policy_consumer');
        assert.ok(asStrings(activeConsumer.writes_only).includes('standard_foundry_policy_ref'));
        assert.equal(contract.canonical_policy_export, 'opl-framework/foundry-agent-series-policy');
        const policyDelta = assertPolicyObject(contract, 'domain_policy_delta');
        const seriesProfile = assertPolicyObject(policyDelta, 'series_design_profile');
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

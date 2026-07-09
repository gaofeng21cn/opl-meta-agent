import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  assertCompleteStageNativeRefs,
} from '../support/contracts.ts';

test('stage launch contract keeps Codex-first executor, receipts, and no-ready authority guards', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  asObjects(stageControl.stages).forEach((stage) => {
    const label = String(stage.stage_id);
    assert.equal(stage.selected_executor.executor_kind, 'codex_cli', `${label}.executor`);
    assert.equal(stage.executor_binding.binding_kind, 'codex_cli_first_class_stage_executor');
    assert.equal(stage.runtime_enforced_boundary.codex_first, true);
    assert.equal(stage.runtime_enforced_boundary.can_write_domain_truth, false);
    assert.equal(stage.runtime_enforced_boundary.can_authorize_quality_or_export, false);
    assert.equal(stage.runtime_enforced_boundary.suite_pass_claims_domain_ready, false);

    const requires = asStrings(stage.requires);
    const ensures = asStrings(stage.ensures);
    assert.ok(requires.includes(`stage:${label}`), `${label}.stage ref`);
    assert.ok(requires.includes(`artifact-native-contract-ref:opl-meta-agent/${label}`), `${label}.native ref`);
    assert.ok(requires.includes(`stage-completion-policy-ref:opl-meta-agent/${label}`), `${label}.completion policy`);
    assert.ok(ensures.includes(`stage-attempt-receipt-ref:${label}`), `${label}.attempt receipt`);
    assert.ok(ensures.includes(`no-forbidden-write-proof-ref:${label}`), `${label}.boundary proof`);

    const contract = stage.stage_contract;
    assert.equal(contract.stage_completion_policy.provider_completion_is_domain_completion, false);
    assert.equal(contract.stage_completion_policy.opl_content_judgment_allowed, false);
    assert.ok(asStrings(contract.progress_delta_policy.required_fields).includes('next_forced_delta'));
    assert.ok(asStrings(contract.typed_blocker_lineage_policy.required_fields).includes('next_forced_delta'));
    assertCompleteStageNativeRefs(contract.stage_native_artifact_contract, label);
    assert.equal(contract.stage_native_artifact_contract.authority_boundary.oma_can_write_target_domain_truth, false);
    assert.equal(contract.stage_native_artifact_contract.authority_boundary.oma_can_owner_promote_target_agent, false);
  });
});

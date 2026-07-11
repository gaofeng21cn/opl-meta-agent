import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  readJsonFile as readJson,
  writeJsonFile as writeJson,
} from './support/contracts.ts';
import {
  buildFixtureAgentSkeletonBuildCloseout,
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft/builder.ts';
import {
  materializeStageDecompositionPackDraft,
  repairStageDecompositionCloseoutPacket,
} from '../scripts/lib/stage-decomposition-pack-draft/materializer.ts';
import {
  validateAgentSkeletonBuildCloseoutPacket,
  validateStageDecompositionCloseoutPacket,
} from '../scripts/lib/stage-decomposition-pack-draft/validator.ts';

const targetAgent = {
  domain_id: 'research-workbench-agent',
  domain_label: 'Research Workbench Agent',
  delivery_domain: 'research_workbench',
  target_brief: 'Create an owner-gated research workbench agent from declared workspace refs.',
  selected_opl_profile_refs: [
    'opl-profile:evidence_grounded_decision_agent_profile.v1',
  ],
  profile_selection_rationale:
    'The target agent needs refs-only grounding, mode routing, and owner-gated decision support.',
};

const sourceDerivedTargetAgent = {
  domain_id: 'surgery-risk-from-paper-agent',
  domain_label: 'Surgery Risk From Paper Agent',
  delivery_domain: 'surgical_risk_support',
  target_brief: 'Create an owner-gated surgical risk support agent from a supplied reference paper design.',
  reference_design_source_refs: ['source-material:sha256:surgical-risk-fixture'],
  reference_design_pattern_packet_refs: [
    'tests/fixtures/opl-reference-design-pattern-packet.json',
  ],
};

test('stage-decomposition materializer writes refs-only stage pack surfaces', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-stage-materializer-pass4-'));
  try {
    const targetAgentDir = path.join(outputRoot, targetAgent.domain_id);
    writeJson(path.join(targetAgentDir, 'contracts/pack_compiler_input.json'), {
      surface_kind: 'opl_domain_pack_compiler_input',
      required_domain_pack_paths: [],
    });
    const packet = buildFixtureStageDecompositionCloseout({
      targetAgent,
      stageId: 'evidence-synthesis-plan',
      actionId: 'plan-evidence-synthesis',
      title: 'Evidence Synthesis Plan',
      promptPath: 'agent/prompts/evidence-synthesis-plan.md',
      stagePath: 'agent/stages/evidence-synthesis-plan.md',
      skillPath: 'agent/skills/evidence-synthesis-domain-skill.md',
      knowledgePath: 'agent/knowledge/evidence-synthesis-boundary.md',
      qualityGatePath: 'agent/quality_gates/evidence-synthesis-plan-gate.md',
    });

    const skeletonCloseout = buildFixtureAgentSkeletonBuildCloseout({
      targetAgent,
      stageId: 'evidence-synthesis-plan',
      actionId: 'plan-evidence-synthesis',
      title: 'Evidence Synthesis Plan',
      promptPath: 'agent/prompts/evidence-synthesis-plan.md',
      stagePath: 'agent/stages/evidence-synthesis-plan.md',
      skillPath: 'agent/skills/evidence-synthesis-domain-skill.md',
      knowledgePath: 'agent/knowledge/evidence-synthesis-boundary.md',
      qualityGatePath: 'agent/quality_gates/evidence-synthesis-plan-gate.md',
    });
    const draft = validateStageDecompositionCloseoutPacket(packet, { targetAgent });
    const files = validateAgentSkeletonBuildCloseoutPacket(skeletonCloseout, {
      targetAgent,
      packDraft: draft,
    });
    materializeStageDecompositionPackDraft(targetAgentDir, draft, files);

    const stageControl = readJson(path.join(targetAgentDir, 'contracts/stage_control_plane.json'));
    const stageManifest = readJson(path.join(targetAgentDir, 'agent/stages/manifest.json'));
    const foundrySeries = readJson(path.join(targetAgentDir, 'contracts/foundry_agent_series.json'));
    const artifactMorphology = readJson(path.join(targetAgentDir, 'contracts/artifact_morphology_contract.json'));
    const compilerInput = readJson(path.join(targetAgentDir, 'contracts/pack_compiler_input.json'));
    const stage = (stageControl.stages as JsonObject[])[0];
    assert.equal(stage.stage_id, 'evidence-synthesis-plan');
    assert.equal(stage.selected_executor.executor_kind, 'codex_cli');
    assert.equal(stage.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(stage.stage_contract.stage_completion_policy.provider_completion_is_domain_completion, false);
    assert.equal(stageManifest.target_domain_id, targetAgent.domain_id);
    assert.equal(stageManifest.owner, targetAgent.domain_id);
    assert.deepEqual(stageManifest.stages.map((entry: JsonObject) => entry.stage_id), [
      'evidence-synthesis-plan',
    ]);
    assert.deepEqual(stageManifest.stages[0].allowed_action_refs, ['plan-evidence-synthesis']);
    assert.equal(stageManifest.stages[0].policy_ref, 'agent/stages/evidence-synthesis-plan.md');
    assert.equal(stageManifest.stages[0].prompt_ref, 'agent/prompts/evidence-synthesis-plan.md');
    const manifestStageContract = stageManifest.stages[0].stage_contract as JsonObject;
    for (const frameworkOwnedField of [
      'expected_receipt_refs',
      'receipt_schema_refs',
      'authority_function_refs',
      'l4_entry_gate',
      'l5_entry_gate',
      'stage_completion_policy',
      'user_stage_log_contract',
      'progress_delta_policy',
      'typed_blocker_lineage_policy',
    ]) {
      assert.equal(
        Object.hasOwn(manifestStageContract, frameworkOwnedField),
        false,
        `declarative stage manifest must delegate ${frameworkOwnedField} to OPL Pack`,
      );
    }
    assert.ok(Object.hasOwn(manifestStageContract, 'artifact_morphology_contract'));
    assert.equal(foundrySeries.stage_manifest_ref, 'agent/stages/manifest.json');
    assert.equal(foundrySeries.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
    assert.ok(foundrySeries.required_identity_fields.includes('stage_manifest_ref'));
    assert.equal(artifactMorphology.native_source_policy.creative_source_must_not_be_generator_code, true);
    assert.ok(compilerInput.required_domain_pack_paths.includes(
      'contracts/schemas/plan-evidence-synthesis.input.schema.json',
    ));
    assert.ok(compilerInput.required_domain_pack_paths.includes(
      'contracts/schemas/plan-evidence-synthesis.output.schema.json',
    ));
    assert.equal(stageControl.stage_decomposition_subpacket_set, null);
    assert.equal(
      fs.existsSync(path.join(targetAgentDir, 'contracts/stage_native_artifacts/evidence-synthesis-plan/attempt.json')),
      true,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('stage-decomposition plans files while agent-skeleton-build owns file bodies', () => {
  const decomposition = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = decomposition.stage_decomposition_pack_draft as JsonObject;
  const plan = draft.file_materialization_plan as JsonObject;
  const plannedFiles = plan.files as JsonObject[];
  assert.equal(plan.materialization_stage_ref, 'agent-skeleton-build');
  assert.ok(plannedFiles.length > 0);
  plannedFiles.forEach((file) => {
    assert.equal(file.materialization_stage_ref, 'agent-skeleton-build');
    assert.equal(Object.hasOwn(file, 'body'), false);
  });

  const skeleton = buildFixtureAgentSkeletonBuildCloseout({ targetAgent });
  const materializedFiles = skeleton.materialized_files as JsonObject[];
  assert.deepEqual(
    materializedFiles.map((file) => file.path),
    plannedFiles.map((file) => file.path),
  );
  materializedFiles.forEach((file) => assert.equal(typeof file.body, 'string'));
});

test('stage-decomposition closeout leaves domain readiness to the terminal target-owner route', () => {
  const closeout = buildFixtureStageDecompositionCloseout({ targetAgent });
  assert.equal(Object.hasOwn(closeout, 'domain_ready_verdict'), false);
  assert.equal(closeout.user_stage_log.outcome, 'stage_pack_ready_for_next_stage');
});

test('stage-decomposition file plan rejects embedded file bodies', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const plan = draft.file_materialization_plan as JsonObject;
  (plan.files as JsonObject[])[0].body = 'forged file body';
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /file plan.*must not contain.*body/i,
  );
});

test('stage-decomposition validator fails closed on untyped or unsafe closeout', () => {
  assert.throws(
    () => validateStageDecompositionCloseoutPacket('stage graph: draft then review', { targetAgent }),
    /typed JSON object/i,
  );

  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stage = ((draft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  delete stage.independent_gate_policy;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /independent_gate_policy/i,
  );
});

test('stage-decomposition bounded repair upgrades stale Foundry stage identity refs', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const foundrySeries = draft.foundry_agent_series as JsonObject;
  delete foundrySeries.stage_manifest_ref;
  foundrySeries.stage_control_plane_ref = 'contracts/stage_control_plane.json';
  foundrySeries.required_identity_fields = (foundrySeries.required_identity_fields as string[])
    .filter((field) => field !== 'stage_manifest_ref');

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /foundry_agent_series\.(?:stage_manifest_ref|required_identity_fields)/i,
  );
  const repair = repairStageDecompositionCloseoutPacket(packet, { targetAgent });
  assert.equal(repair.repaired, true);
  assert.match(repair.repair_notes.join('\n'), /foundry_agent_series\.stage_manifest_ref/);
  const repairedDraft = validateStageDecompositionCloseoutPacket(repair.packet, { targetAgent });
  assert.equal(repairedDraft.foundry_agent_series.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(
    repairedDraft.foundry_agent_series.stage_control_plane_ref,
    'opl-generated:family_stage_control_plane',
  );
  assert.ok(repairedDraft.foundry_agent_series.required_identity_fields.includes('stage_manifest_ref'));
});

test('stage-decomposition bounded repair cannot reconstruct malformed Foundry core identity', () => {
  const malformedFieldsPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const malformedFieldsSeries = (malformedFieldsPacket.stage_decomposition_pack_draft as JsonObject)
    .foundry_agent_series as JsonObject;
  malformedFieldsSeries.stage_control_plane_ref = 'contracts/stage_control_plane.json';
  delete malformedFieldsSeries.stage_manifest_ref;
  malformedFieldsSeries.required_identity_fields = 'invalid';
  const malformedFieldsRepair = repairStageDecompositionCloseoutPacket(malformedFieldsPacket, { targetAgent });
  assert.equal(malformedFieldsRepair.repaired, false);
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(malformedFieldsRepair.packet, { targetAgent }),
    /foundry_agent_series\.stage_manifest_ref|foundry_agent_series\.required_identity_fields/i,
  );

  const missingIdentityPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const missingIdentitySeries = (missingIdentityPacket.stage_decomposition_pack_draft as JsonObject)
    .foundry_agent_series as JsonObject;
  delete missingIdentitySeries.domain_id;
  missingIdentitySeries.stage_control_plane_ref = 'contracts/stage_control_plane.json';
  const missingIdentityRepair = repairStageDecompositionCloseoutPacket(missingIdentityPacket, { targetAgent });
  assert.equal(missingIdentityRepair.repaired, false);
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(missingIdentityRepair.packet, { targetAgent }),
    /foundry_agent_series\.domain_id/i,
  );
});

test('stage-decomposition validator fails closed on empty source-derived design objects', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];

  const emptyPacket = {
    surface_kind: 'opl_meta_agent_reference_design_packet',
    packet_ref: stageControl.reference_design_packet_ref,
  };
  const emptyTransferMap = {
    surface_kind: 'opl_meta_agent_transfer_map',
    transfer_map_ref: stageControl.transfer_map_ref,
  };
  const emptyAgentPackPlan = {
    surface_kind: 'opl_meta_agent_agent_pack_plan',
    plan_ref: stageControl.agent_pack_plan_ref,
  };
  const emptyDesignAdmissionReceipt = {
    surface_kind: 'opl_meta_agent_design_admission_receipt',
    receipt_ref: stageControl.design_admission_receipt_ref,
  };
  const emptyBuildReceipt = {
    surface_kind: 'opl_meta_agent_build_receipt',
    receipt_ref: stageControl.build_receipt_ref,
  };
  stageControl.reference_design_packet = emptyPacket;
  stageControl.transfer_map = emptyTransferMap;
  stageControl.agent_pack_plan = emptyAgentPackPlan;
  stageControl.design_admission_receipt = emptyDesignAdmissionReceipt;
  stageControl.build_receipt = emptyBuildReceipt;
  stage.reference_design_packet = emptyPacket;
  stage.transfer_map = emptyTransferMap;
  stage.agent_pack_plan = emptyAgentPackPlan;
  stage.design_admission_receipt = emptyDesignAdmissionReceipt;
  stage.build_receipt = emptyBuildReceipt;

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /reference_source_refs|transferable_design_patterns|extractable_design_aspects|mappings|planned_stage_refs|design_admission_receipt|build_receipt/i,
  );
});

test('stage-decomposition validator fails closed when subpacket chain is missing or reordered', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];

  delete stageControl.stage_decomposition_subpacket_set;

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /stage_decomposition_subpacket_set/i,
  );

  stageControl.stage_decomposition_subpacket_set = stage.stage_decomposition_subpacket_set;
  const steps = stageControl.stage_decomposition_subpacket_set.cognitive_step_packets as JsonObject[];
  [steps[0], steps[1]] = [steps[1], steps[0]];

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /stage_decomposition_subpacket_set step 0/i,
  );
});

test('stage-decomposition materialization repair restores mechanical subpacket projection', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  const stageContract = stage.stage_contract as JsonObject;

  delete draft.stage_decomposition_subpacket_set;
  delete draft.stage_decomposition_subpacket_set_ref;
  delete draft.stage_decomposition_subpacket_set_refs;
  delete stageControl.stage_decomposition_subpacket_set;
  delete stageControl.stage_decomposition_subpacket_set_ref;
  delete stageControl.stage_decomposition_subpacket_set_refs;
  delete stage.stage_decomposition_subpacket_set;
  delete stage.stage_decomposition_subpacket_set_ref;
  delete stage.stage_decomposition_subpacket_set_refs;
  stage.inputs = (stage.inputs as JsonObject[]).filter((input) =>
    input.ref_kind !== 'stage_decomposition_subpacket_set_ref'
  );
  stageContract.requires = (stageContract.requires as string[]).filter((entry) =>
    !entry.startsWith('stage-decomposition-subpacket-set-ref:')
  );
  stageContract.expected_receipt_refs = (stageContract.expected_receipt_refs as JsonObject[]).filter((entry) =>
    entry.ref_kind !== 'stage_decomposition_subpacket_set_ref'
  );

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /stage_decomposition_subpacket_set/i,
  );

  const repair = repairStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent });
  assert.equal(repair.repaired, true);
  assert.match(repair.repair_notes.join('\n'), /stage_decomposition_pack_draft\.stage_decomposition_subpacket_set/);
  const draftAfterRepair = validateStageDecompositionCloseoutPacket(repair.packet, {
    targetAgent: sourceDerivedTargetAgent,
  });
  assert.equal(
    (draftAfterRepair.stage_control_plane.stage_decomposition_subpacket_set as JsonObject).packet_set_ref,
    draftAfterRepair.stage_decomposition_subpacket_set_ref,
  );
});

test('stage-decomposition materialization repair does not hide empty design objects', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  const emptyPacket = {
    surface_kind: 'opl_meta_agent_reference_design_packet',
    packet_ref: stageControl.reference_design_packet_ref,
  };

  stageControl.reference_design_packet = emptyPacket;
  stage.reference_design_packet = emptyPacket;
  delete draft.stage_decomposition_subpacket_set;

  const repair = repairStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent });
  assert.equal(repair.repaired, true);
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(repair.packet, { targetAgent: sourceDerivedTargetAgent }),
    /reference_source_refs|transferable_design_patterns|extractable_design_aspects/i,
  );
});

test('stage-decomposition validator fails closed when source-derived stage lacks source pattern refs', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  delete stage.stage_pattern_source_refs;

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /stage_pattern_source_refs/i,
  );
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';
import {
  buildTargetAgentCapabilityMapProjection,
  buildTargetAgentPackageManifest,
  buildTargetAgentPrimarySkillMarkdown,
  type JsonObject,
} from '../scripts/lib/domain-pack.ts';
import {
  readJsonFile as readJson,
  repoRoot,
} from './support/contracts.ts';
import {
  buildFixtureAgentSkeletonBuildCloseout,
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft/builder.ts';
import {
  buildScaffoldMaterializationRequest,
  delegateScaffoldMaterialization,
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

function buildFixtureMaterializationRequest() {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = validateStageDecompositionCloseoutPacket(packet, { targetAgent });
  const files = validateAgentSkeletonBuildCloseoutPacket(
    buildFixtureAgentSkeletonBuildCloseout({ targetAgent }),
    { targetAgent, packDraft: draft },
  );
  return buildScaffoldMaterializationRequest({
    targetAgent,
    draft,
    materializedFiles: files,
    primarySkillBody: buildTargetAgentPrimarySkillMarkdown(targetAgent),
    descriptorProjection: { target_brief: targetAgent.target_brief },
    capabilityMapProjection: buildTargetAgentCapabilityMapProjection(targetAgent, null),
    packageManifest: buildTargetAgentPackageManifest(targetAgent),
  });
}

test('stage-decomposition emits an OPL-owned scaffold materialization request', () => {
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
  const request = buildScaffoldMaterializationRequest({
    targetAgent,
    draft,
    materializedFiles: files,
    primarySkillBody: buildTargetAgentPrimarySkillMarkdown(targetAgent),
    descriptorProjection: { target_brief: targetAgent.target_brief },
    capabilityMapProjection: buildTargetAgentCapabilityMapProjection(targetAgent, null),
    packageManifest: buildTargetAgentPackageManifest(targetAgent),
  });

  const schemaRef = 'contracts/schemas/agent-scaffold-materialization-request.producer.schema.json';
  const schema = readJson(path.join(repoRoot, schemaRef));
  const validation = validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, request);
  assert.equal(validation.ok, true, JSON.stringify(validation));
  const escapingRequest = structuredClone(request);
  (escapingRequest.files as JsonObject[])[0].path = '../outside-target.md';
  const escapingValidation = validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, escapingRequest);
  assert.equal(escapingValidation.ok, false);
  assert.equal(request.execution_owner, 'one-person-lab/OPL Foundry Lab');
  assert.equal((request.authority_boundary as JsonObject).oma_writes_target_agent_files, false);
  assert.equal((request.authority_boundary as JsonObject).opl_owns_final_build_receipt, true);
  assert.deepEqual((request.overwrite_policy as JsonObject).allowed_merge_object_paths, [
    'contracts/domain_descriptor.json',
    'contracts/capability_map.json',
  ]);
  const jsonProjections = request.json_projections as JsonObject[];
  assert.ok(jsonProjections.every((projection) => projection.merge_policy === 'merge_object'));
  assert.equal(new Set(jsonProjections.map((projection) => projection.path)).size, 2);
  assert.deepEqual((request.build_receipt_installation as JsonObject).projection_paths, [
    'contracts/domain_descriptor.json',
    'contracts/capability_map.json',
  ]);
  const stageControl = draft.stage_control_plane;
  const stageManifest = (request.stage_manifest as JsonObject).value as JsonObject;
  const contracts = request.contracts as JsonObject[];
  const actionCatalog = contracts.find((entry) => entry.path === 'contracts/action_catalog.json')?.value as JsonObject;
  const foundrySeries = contracts.find((entry) => entry.path === 'contracts/foundry_agent_series.json')?.value as JsonObject;
  const artifactMorphology = contracts.find((entry) => entry.path === 'contracts/artifact_morphology_contract.json')?.value as JsonObject;
  const compilerInput = request.pack_compiler_input as JsonObject;
  assert.equal(contracts.some((entry) => entry.path === 'contracts/stage_control_plane.json'), false);
  assert.equal(actionCatalog.version, 'family-action-catalog.v2');
  const action = (actionCatalog.actions as JsonObject[])[0];
  assert.deepEqual(action.execution_binding, {
    kind: 'stage_binding',
    stage_manifest_ref: 'agent/stages/manifest.json',
  });
  assert.deepEqual(action.stage_route, {
    entry_stage_ref: 'evidence-synthesis-plan',
    required_stage_refs: ['evidence-synthesis-plan'],
    optional_stage_refs: [],
    terminal_stage_refs: ['evidence-synthesis-plan'],
    route_policy: 'ai_selected_progress_route',
  });
  assert.deepEqual(action.required_fields, ['workspace_root']);
  assert.deepEqual(action.optional_fields, []);
  assert.equal(Object.hasOwn(action, 'source_command'), false);
  assert.deepEqual(compilerInput.implementation_profile, {
    profile_id: 'opl.standard_domain_agent.v1',
    agent_identity: 'declarative_standard_agent_pack',
    pack_formats: ['markdown', 'json'],
    helpers: {
      optional: true,
      entries: [],
      language_is_identity: false,
      rust_policy: 'framework_hot_path_only',
    },
    generated_surfaces_owner: 'one-person-lab',
  });
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
    assert.equal(foundrySeries.surface_kind, 'opl_foundry_agent_series_consumer');
    assert.equal(foundrySeries.version, 'foundry-agent-series-consumer.v1');
    assert.equal(Object.hasOwn(foundrySeries, 'required_identity_fields'), false);
    assert.equal(foundrySeries.canonical_policy_export, 'opl-framework/foundry-agent-series-policy');
    assert.equal(Object.hasOwn(foundrySeries, 'series_design_profile'), false);
    assert.equal(Object.hasOwn(foundrySeries, 'workspace_topology_profile'), false);
    assert.equal(
      foundrySeries.domain_policy_delta.series_design_profile.artifact_morphology_policy
        .required_for_new_target_agent_baseline,
      true,
    );
    assert.equal(artifactMorphology.native_source_policy.creative_source_must_not_be_generator_code, true);
    assert.ok((compilerInput.required_domain_pack_path_additions as string[]).includes(
      'contracts/schemas/plan-evidence-synthesis.input.schema.json',
    ));
    assert.ok((compilerInput.required_domain_pack_path_additions as string[]).includes(
      'contracts/schemas/plan-evidence-synthesis.output.schema.json',
    ));
  assert.equal(stageControl.stage_decomposition_subpacket_set, null);
  assert.ok((request.files as JsonObject[]).some((file) =>
    file.path === 'contracts/stage_native_artifacts/evidence-synthesis-plan/attempt.json'
  ));
});

test('materialization adapter delegates to OPL and never writes target files itself', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-scaffold-delegation-'));
  try {
    const request = buildFixtureMaterializationRequest();
    const requestPath = path.join(outputRoot, 'request.json');
    const targetDir = path.join(outputRoot, 'target-agent');
    const fakeOpl = path.join(outputRoot, 'opl');
    const expectedRef = (request.build_receipt_installation as JsonObject).expected_build_receipt_ref;
    fs.writeFileSync(fakeOpl, `#!/usr/bin/env node
const payload = {
  standard_domain_agent_scaffold: {
    materialization_receipt: {
      surface_kind: 'opl_agent_scaffold_materialization_receipt',
      status: 'materialized',
      build_receipt_ref: ${JSON.stringify(expectedRef)},
      build_receipt: { receipt_ref: ${JSON.stringify(expectedRef)} },
      materialized_file_digests: [{ path: 'agent/stages/manifest.json', sha256: '${'a'.repeat(64)}' }],
      validation_refs: ['validation-ref:scaffold/passed'],
    },
  },
};
process.stdout.write(JSON.stringify(payload));
`);
    fs.chmodSync(fakeOpl, 0o755);

    const receipt = delegateScaffoldMaterialization({
      oplBin: fakeOpl,
      targetAgentDir: targetDir,
      requestPath,
      request,
    });
    assert.equal(receipt.build_receipt_ref, expectedRef);
    assert.equal(fs.existsSync(requestPath), true);
    assert.equal(fs.existsSync(targetDir), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('materialization adapter fails closed on a missing OPL receipt', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-scaffold-delegation-blocked-'));
  try {
    const fakeOpl = path.join(outputRoot, 'opl');
    fs.writeFileSync(fakeOpl, '#!/bin/sh\nprintf \'%s\\n\' \'{"standard_domain_agent_scaffold":{"state":"scaffold_generated"}}\'\n');
    fs.chmodSync(fakeOpl, 0o755);
    assert.throws(
      () => delegateScaffoldMaterialization({
        oplBin: fakeOpl,
        targetAgentDir: path.join(outputRoot, 'target-agent'),
        requestPath: path.join(outputRoot, 'request.json'),
        request: buildFixtureMaterializationRequest(),
      }),
      /did not return opl_agent_scaffold_materialization_receipt/i,
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

test('stage-decomposition bounded repair does not preserve legacy Foundry identity fields', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const foundrySeries = draft.foundry_agent_series as JsonObject;
  foundrySeries.required_identity_fields = ['domain_id'];

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /foundry_agent_series\.required_identity_fields is retired/i,
  );
  const repair = repairStageDecompositionCloseoutPacket(packet, { targetAgent });
  assert.equal(repair.repaired, false);
});

test('stage-decomposition validator fails closed on empty source-derived design objects', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];

  const emptyPacket = {
    surface_kind: 'opl_foundry_reference_design_packet',
    version: 'opl.foundry.reference-design-packet.v1',
    packet_ref: stageControl.reference_design_packet_ref,
  };
  const emptyTransferMap = {
    surface_kind: 'opl_foundry_transfer_map',
    version: 'opl.foundry.transfer-map.v1',
    transfer_map_ref: stageControl.transfer_map_ref,
  };
  const emptyAgentPackPlan = {
    surface_kind: 'opl_foundry_agent_pack_plan',
    version: 'opl.foundry.agent-pack-plan.v1',
    plan_ref: stageControl.agent_pack_plan_ref,
  };
  const emptyDesignAdmissionReceipt = {
    surface_kind: 'opl_foundry_design_admission_receipt',
    version: 'opl.foundry.design-admission-receipt.v1',
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

test('stage-decomposition design-object packet set allows reordering and preserves dependency edges', () => {
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
  const designObjects = stageControl.stage_decomposition_subpacket_set.design_object_packets as JsonObject[];
  designObjects.reverse();
  const dependencyEdges = stageControl.stage_decomposition_subpacket_set.dependency_edges as JsonObject[];
  dependencyEdges.reverse();

  assert.doesNotThrow(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
  );

  designObjects.pop();

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /design object count|object .* missing/i,
  );

  const dependencyPacket = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const dependencyDraft = dependencyPacket.stage_decomposition_pack_draft as JsonObject;
  const dependencyControl = dependencyDraft.stage_control_plane as JsonObject;
  const edges = dependencyControl.stage_decomposition_subpacket_set.dependency_edges as JsonObject[];
  edges[0].dependent_ref = 'supported-design-claims:wrong-target';
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(dependencyPacket, { targetAgent: sourceDerivedTargetAgent }),
    /dependency edge source-evidence-before-supported-claim dependent_ref is invalid/i,
  );

  const morphologyPacket = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const morphologyDraft = morphologyPacket.stage_decomposition_pack_draft as JsonObject;
  const morphologyControl = morphologyDraft.stage_control_plane as JsonObject;
  morphologyControl.stage_decomposition_subpacket_set.artifact_morphology_ref =
    'artifact-morphology-ref:wrong-target';
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(morphologyPacket, { targetAgent: sourceDerivedTargetAgent }),
    /stage_decomposition_subpacket_set refs are invalid/i,
  );

  const objectMorphologyPacket = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const objectMorphologyDraft = objectMorphologyPacket.stage_decomposition_pack_draft as JsonObject;
  const objectMorphologyControl = objectMorphologyDraft.stage_control_plane as JsonObject;
  const morphologyObject = (
    objectMorphologyControl.stage_decomposition_subpacket_set.design_object_packets as JsonObject[]
  ).find((entry) => entry.object_id === 'artifact-morphology');
  assert.ok(morphologyObject);
  morphologyObject.packet_ref = 'artifact-morphology-ref:wrong-target';
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(objectMorphologyPacket, { targetAgent: sourceDerivedTargetAgent }),
    /object artifact-morphology packet_ref is invalid/i,
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
    surface_kind: 'opl_foundry_reference_design_packet',
    version: 'opl.foundry.reference-design-packet.v1',
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

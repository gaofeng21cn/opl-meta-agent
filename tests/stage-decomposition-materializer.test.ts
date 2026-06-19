import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft-parts/builder.ts';
import {
  materializeStageDecompositionPackDraft,
} from '../scripts/lib/stage-decomposition-pack-draft-parts/materializer.ts';
import {
  validateStageDecompositionCloseoutPacket,
} from '../scripts/lib/stage-decomposition-pack-draft-parts/validator.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targetAgent = {
  domain_id: 'research-workbench-agent',
  domain_label: 'Research Workbench Agent',
  delivery_domain: 'research_workbench',
  target_brief: 'Create an owner-gated research workbench agent from declared workspace refs.',
};

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stageById(stageControl: JsonObject, stageId: string): JsonObject {
  const stage = (stageControl.stages as JsonObject[]).find((entry) => entry.stage_id === stageId);
  assert.ok(stage, `expected ${stageId} in stage_control_plane`);
  return stage;
}

function assertCompleteStageNativeRefs(container: JsonObject, domainId: string, stageId: string): void {
  assert.equal(container.stage_json_ref, `stage-json-ref:${domainId}/${stageId}`);
  assert.equal(container.attempt_json_ref, `stage-attempt-json-ref:${domainId}/${stageId}/{stage_attempt_id}`);
  assert.equal(container.manifest_ref, `stage-manifest-ref:${domainId}/${stageId}/{stage_attempt_id}`);
  assert.equal(container.receipt_ref, `stage-attempt-receipt-ref:${domainId}/${stageId}/{stage_attempt_id}`);
  assert.equal(container.current_pointer_ref, `stage-current-pointer-ref:${domainId}/${stageId}`);
  assert.equal(container.canonical_artifact_ref, `canonical-artifact-ref:${domainId}/${stageId}`);
  assert.equal(container.export_ref, `stage-export-ref:${domainId}/${stageId}/{stage_attempt_id}`);
  assert.equal(container.lineage_ref, `stage-lineage-ref:${domainId}/${stageId}/{stage_attempt_id}`);
  assert.equal(container.retention_ref, `stage-retention-ref:${domainId}/${stageId}/{stage_attempt_id}`);
  assert.equal(container.physical_kernel_locator_ref, `opl-physical-kernel-locator-ref:${domainId}/${stageId}`);
  assert.equal(container.conformance_ref, `stage-artifact-conformance-ref:${domainId}/${stageId}`);
  assert.equal(container.workbench_consumption_ref, `stage-artifact-workbench-consumption-ref:${domainId}/${stageId}`);
}

function assertOmaRefTemplateBoundary(container: JsonObject): void {
  assert.equal(container.materialization_kind, 'compiler_ref_template_only_not_runtime_state');
  assert.equal(container.runtime_state_created, false);
  assert.equal(container.owner_promotion_created, false);
  assert.equal(container.target_worktree_lifecycle_managed, false);
  assert.equal(container.owner_receipt_body_created, false);
  assert.equal(container.contains_target_artifact_body, false);
}

const ARTIFACT_MORPHOLOGY_REQUIRED_POLICIES = [
  'native_source_policy',
  'artifact_body_policy',
  'sharding_policy',
  'target_extent_policy',
  'asset_custody_policy',
  'realistic_task_review_policy',
] as const;

function reviewerMorphologySourceRefs(domainId: string, stageId = 'agent-output-draft'): string[] {
  return [
    `artifact-morphology-ref:${domainId}`,
    `artifact-native-source-format-ref:${domainId}/${stageId}`,
    `artifact-shard-unit-ref:${domainId}/${stageId}`,
    `target-extent-contract-ref:${domainId}/${stageId}`,
    `asset-custody-ref:${domainId}/${stageId}`,
  ];
}

function reviewerMorphologyDirectEvidenceRefs(domainId: string, stageId = 'agent-output-draft'): string[] {
  return [
    `artifact-ref:${domainId}/contracts/artifact_morphology_contract.json`,
    `morphology-evidence-ref:${domainId}/${stageId}/realistic-target-task-review`,
  ];
}

test('materializer writes the target stage pack from typed stage-decomposition closeout', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-stage-materializer-'));
  try {
    const targetAgentDir = path.join(outputRoot, targetAgent.domain_id);
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

    const draft = validateStageDecompositionCloseoutPacket(packet, { targetAgent });
    assert.equal(packet.user_stage_log.stage_name, 'Stage decomposition pack draft');
    assert.deepEqual(packet.user_stage_log.changed_stage_surfaces, [
      'action_catalog',
      'stage_control_plane',
      'artifact_morphology_contract',
      'stage_native_artifact_contract',
      'agent/prompts',
      'agent/stages',
      'agent/skills',
      'agent/knowledge',
      'agent/quality_gates',
    ]);
    materializeStageDecompositionPackDraft(targetAgentDir, draft);

    const actionCatalog = readJson(path.join(targetAgentDir, 'contracts/action_catalog.json'));
    const artifactMorphology = readJson(path.join(targetAgentDir, 'contracts/artifact_morphology_contract.json'));
    const stageControl = readJson(path.join(targetAgentDir, 'contracts/stage_control_plane.json'));
    const stageNativeArtifactContract = readJson(path.join(targetAgentDir, 'contracts/stage_native_artifact_contract.json'));
    const foundrySeries = readJson(path.join(targetAgentDir, 'contracts/foundry_agent_series.json'));
    const stage = stageById(stageControl, 'evidence-synthesis-plan');

    assert.equal(actionCatalog.actions[0].action_id, 'plan-evidence-synthesis');
    assert.equal(artifactMorphology.surface_kind, 'target_domain_artifact_morphology_contract');
    assert.equal(artifactMorphology.target_domain_id, 'research-workbench-agent');
    assert.equal(artifactMorphology.native_source_policy.creative_source_must_not_be_generator_code, true);
    assert.equal(artifactMorphology.sharding_policy.assembled_output_is_delivery_ref_not_primary_creative_source, true);
    assert.equal(artifactMorphology.target_extent_policy.silent_extent_downgrade_forbidden, true);
    assert.equal(artifactMorphology.asset_custody_policy.generated_asset_without_exposed_path_is_typed_blocker, true);
    assert.deepEqual(foundrySeries.shared_policy_release, {
      policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
      policy_bundle_fingerprint: 'sha256:5d77102e99e6e49acd88714cd94dcafe0969b8f2a5529928d753002ac3d4619d',
      fingerprint_algorithm: 'sha256:stable-json',
      domain_contract_policy_release_pin_required: true,
      domain_adapter_must_not_copy_policy_body_as_authority: true,
      consumer_alignment_check: 'foundry:policy-release',
    });
    assert.equal(stageControl.stage_pack_conformance_version, 'standard-stage-pack.v2');
    assert.equal(stage.goal, targetAgent.target_brief);
    assert.deepEqual(stage.allowed_action_refs, ['plan-evidence-synthesis']);
    assert.deepEqual(stage.selected_executor, {
      executor_kind: 'codex_cli',
      default_executor: true,
      executor_binding_ref: 'default_codex_cli',
    });
    assert.equal(stage.independent_gate_policy.gate_ref, 'agent/quality_gates/evidence-synthesis-plan-gate.md');
    assert.equal(stage.independent_gate_policy.execution_review_separation_required, true);
    assert.equal(stage.independent_gate_policy.mechanical_completion_can_close_stage, false);
    assert.equal(stage.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(stage.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.ok(stage.stage_contract.requires.includes('runtime-ref:stage-progress-log-user-stage-log'));
    assert.ok(stage.stage_contract.requires.includes('artifact-native-contract-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.requires.includes('artifact-morphology-ref:research-workbench-agent'));
    assert.ok(stage.stage_contract.requires.includes('artifact-native-source-format-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.requires.includes('artifact-shard-unit-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.requires.includes('target-extent-contract-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.requires.includes('asset-custody-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.deepEqual(stage.stage_contract.artifact_morphology_contract, artifactMorphology);
    assert.ok(stage.stage_contract.ensures.includes('stage-user-log-ref:evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.ensures.includes('stage-folder-contract-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.ensures.includes('stage-json-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.ensures.includes('stage-attempt-json-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}'));
    assert.ok(stage.stage_contract.ensures.includes('stage-manifest-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}'));
    assert.ok(stage.stage_contract.ensures.includes('stage-export-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}'));
    assert.ok(stage.stage_contract.ensures.includes('stage-lineage-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}'));
    assert.ok(stage.stage_contract.ensures.includes('stage-retention-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}'));
    assert.ok(stage.stage_contract.ensures.includes('opl-physical-kernel-locator-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.ensures.includes('stage-artifact-conformance-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.ok(stage.stage_contract.ensures.includes('stage-artifact-workbench-consumption-ref:research-workbench-agent/evidence-synthesis-plan'));
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.artifact_native_contract_ref,
      'artifact-native-contract-ref:research-workbench-agent/evidence-synthesis-plan',
    );
    assertCompleteStageNativeRefs(
      stage.stage_contract.stage_native_artifact_contract,
      'research-workbench-agent',
      'evidence-synthesis-plan',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.stage_folder_contract.stage_folder_contract_ref,
      'stage-folder-contract-ref:research-workbench-agent/evidence-synthesis-plan',
    );
    assertCompleteStageNativeRefs(
      stage.stage_contract.stage_native_artifact_contract.stage_folder_contract,
      'research-workbench-agent',
      'evidence-synthesis-plan',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.stage_json_contract.stage_json_file_name,
      'stage.json',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.attempt_json_contract.attempt_json_file_name,
      'attempt.json',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.export_contract.export_file_name,
      'export.json',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.lineage_contract.lineage_file_name,
      'lineage.json',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.retention_contract.retention_file_name,
      'retention.json',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract.source_contract_ref,
      'contracts/opl-framework/stage-artifact-runtime-contract.json',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract.oma_materializes_ref_template_only,
      true,
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract.oma_can_create_runtime_state,
      false,
    );
    assert.deepEqual(
      stage.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract.required_attempt_entries,
      ['attempt.json', 'manifest.json', 'inputs/', 'outputs/', 'evidence/', 'receipts/'],
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.conformance_contract.surface_kind,
      'opl_stage_artifact_runtime_conformance',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.conformance_contract.domain_readiness_claim,
      false,
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.workbench_consumption_contract.surface_kind,
      'opl_stage_artifact_runtime_workbench_consumption',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.workbench_consumption_contract.artifact_body_access,
      false,
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.workbench_consumption_contract.domain_verdict_authority,
      false,
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.manifest_contract.missing_owner_receipt_projection,
      'orphan_artifact',
    );
    assert.equal(
      stage.stage_contract.stage_native_artifact_contract.authority_boundary.oma_can_generate_target_domain_owner_receipt,
      false,
    );
    assert.equal(stageNativeArtifactContract.surface_kind, 'opl_stage_native_artifact_contract_bundle');
    assert.deepEqual(stageNativeArtifactContract.artifact_native_contract_refs, [
      'artifact-native-contract-ref:research-workbench-agent/evidence-synthesis-plan',
    ]);
    assert.deepEqual(stageNativeArtifactContract.stage_json_refs, [
      'stage-json-ref:research-workbench-agent/evidence-synthesis-plan',
    ]);
    assert.deepEqual(stageNativeArtifactContract.attempt_json_ref_templates, [
      'stage-attempt-json-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}',
    ]);
    assert.deepEqual(stageNativeArtifactContract.export_ref_templates, [
      'stage-export-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}',
    ]);
    assert.deepEqual(stageNativeArtifactContract.lineage_ref_templates, [
      'stage-lineage-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}',
    ]);
    assert.deepEqual(stageNativeArtifactContract.retention_ref_templates, [
      'stage-retention-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}',
    ]);
    assert.deepEqual(stageNativeArtifactContract.physical_kernel_locator_refs, [
      'opl-physical-kernel-locator-ref:research-workbench-agent/evidence-synthesis-plan',
    ]);
    assert.deepEqual(stageNativeArtifactContract.conformance_refs, [
      'stage-artifact-conformance-ref:research-workbench-agent/evidence-synthesis-plan',
    ]);
    assert.deepEqual(stageNativeArtifactContract.workbench_consumption_refs, [
      'stage-artifact-workbench-consumption-ref:research-workbench-agent/evidence-synthesis-plan',
    ]);
    assert.equal(
      stageNativeArtifactContract.contracts[0].canonical_artifact_ref,
      'canonical-artifact-ref:research-workbench-agent/evidence-synthesis-plan',
    );
    assertCompleteStageNativeRefs(
      stageNativeArtifactContract.contracts[0],
      'research-workbench-agent',
      'evidence-synthesis-plan',
    );
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_own_agent_lab_runner, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_own_queue, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_own_attempt_ledger, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_own_worktree_lifecycle, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_own_promotion_gate, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_own_app_shell, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_write_target_owner_closeout, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_create_stage_folder_runtime_state, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_owner_promote_target_agent, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_write_target_owner_receipt_body, false);
    assert.equal(stageNativeArtifactContract.authority_boundary.oma_can_write_target_domain_truth, false);
    const materializedStageNativeDir = path.join(
      targetAgentDir,
      'contracts',
      'stage_native_artifacts',
      'evidence-synthesis-plan',
    );
    [
      'stage.json',
      'attempt.json',
      'stage.manifest.json',
      'receipt.json',
      'current.json',
      'canonical.json',
      'export.json',
      'lineage.json',
      'retention.json',
      'physical_kernel_locator.json',
      'conformance.json',
      'workbench_consumption.json',
    ].forEach((fileName) => {
      assert.equal(fs.existsSync(path.join(materializedStageNativeDir, fileName)), true, `${fileName} materialized ref`);
    });
    const attemptRefs = readJson(path.join(materializedStageNativeDir, 'attempt.json'));
    assertOmaRefTemplateBoundary(attemptRefs);
    assert.equal(attemptRefs.ref, 'stage-attempt-json-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}');
    assert.equal(attemptRefs.authority_boundary.oma_can_write_stage_folder_runtime_state, false);
    assert.equal(attemptRefs.authority_boundary.oma_can_write_target_owner_receipt_body, false);
    const exportRefs = readJson(path.join(materializedStageNativeDir, 'export.json'));
    assertOmaRefTemplateBoundary(exportRefs);
    assert.equal(exportRefs.ref, 'stage-export-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}');
    const lineageRefs = readJson(path.join(materializedStageNativeDir, 'lineage.json'));
    assert.equal(lineageRefs.ref, 'stage-lineage-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}');
    const retentionRefs = readJson(path.join(materializedStageNativeDir, 'retention.json'));
    assert.equal(retentionRefs.ref, 'stage-retention-ref:research-workbench-agent/evidence-synthesis-plan/{stage_attempt_id}');
    const physicalKernelLocatorRefs = readJson(path.join(materializedStageNativeDir, 'physical_kernel_locator.json'));
    assertOmaRefTemplateBoundary(physicalKernelLocatorRefs);
    assert.equal(
      physicalKernelLocatorRefs.ref,
      'opl-physical-kernel-locator-ref:research-workbench-agent/evidence-synthesis-plan',
    );
    const conformanceRefs = readJson(path.join(materializedStageNativeDir, 'conformance.json'));
    assertOmaRefTemplateBoundary(conformanceRefs);
    assert.equal(
      conformanceRefs.ref,
      'stage-artifact-conformance-ref:research-workbench-agent/evidence-synthesis-plan',
    );
    const workbenchConsumptionRefs = readJson(path.join(materializedStageNativeDir, 'workbench_consumption.json'));
    assertOmaRefTemplateBoundary(workbenchConsumptionRefs);
    assert.equal(
      workbenchConsumptionRefs.ref,
      'stage-artifact-workbench-consumption-ref:research-workbench-agent/evidence-synthesis-plan',
    );
    assert.deepEqual(
      stage.stage_contract.user_stage_log_contract.required_domain_semantic_fields,
      [
        'stage_name',
        'problem_summary',
        'stage_goal',
        'stage_work_done',
        'changed_stage_surfaces',
        'outcome',
        'remaining_blockers',
        'evidence_refs',
      ],
    );
    assert.equal(
      stage.stage_contract.progress_delta_policy.surface_kind,
      'opl_stage_progress_delta_policy',
    );
    assert.deepEqual(
      stage.stage_contract.progress_delta_policy.required_fields,
      [
        'progress_delta_classification',
        'deliverable_progress_delta',
        'platform_repair_delta',
        'next_forced_delta',
      ],
    );
    assert.equal(Object.hasOwn(stage.stage_contract.progress_delta_policy, 'deliverable_delta_aliases'), false);
    assert.equal(Object.hasOwn(stage.stage_contract.progress_delta_policy, 'platform_delta_aliases'), false);
    assert.equal(stage.stage_contract.progress_delta_policy.platform_only_is_not_deliverable_progress, true);
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.surface_kind,
      'family-stall-lineage.v1',
    );
    assert.ok(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('next_forced_delta'),
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.repeat_budget.mechanism_repair_after_repeat_count,
      2,
    );
    assert.equal(foundrySeries.series_design_profile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
    assert.deepEqual(foundrySeries.series_design_profile.stage_pack_sections, [
      'prompts',
      'stages',
      'skills',
      'knowledge',
      'quality_gates',
      'artifact_morphology',
    ]);
    assert.equal(foundrySeries.series_design_profile.shared_closeout_contract.provider_completion_is_closeout, false);
    assert.equal(foundrySeries.series_design_profile.authority_invariants.opl_can_write_domain_truth, false);

    [
      'agent/prompts/evidence-synthesis-plan.md',
      'agent/stages/evidence-synthesis-plan.md',
      'agent/skills/evidence-synthesis-domain-skill.md',
      'agent/knowledge/evidence-synthesis-boundary.md',
      'agent/quality_gates/evidence-synthesis-plan-gate.md',
    ].forEach((relativePath) => {
      const body = fs.readFileSync(path.join(targetAgentDir, relativePath), 'utf8');
      assert.ok(body.trim().length > 0, `${relativePath} should not be empty`);
    });
    assert.match(
      fs.readFileSync(path.join(targetAgentDir, 'agent/quality_gates/evidence-synthesis-plan-gate.md'), 'utf8'),
      /Quality gate declaration is required/i,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('stage-decomposition closeout validator fails closed on free text and partial packs', () => {
  assert.throws(
    () => validateStageDecompositionCloseoutPacket('stage graph: draft then review', { targetAgent }),
    /typed JSON object/i,
  );
  assert.throws(
    () => validateStageDecompositionCloseoutPacket({
      surface_kind: 'stage_attempt_closeout_packet',
      stage_id: 'stage-decomposition',
      closeout_refs: ['receipt:partial'],
    }, { targetAgent }),
    /stage_decomposition_pack_draft/i,
  );

  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  delete stage.independent_gate_policy;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /independent_gate_policy/i,
  );
});

test('stage-decomposition closeout validator fails closed without artifact morphology contract', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  delete draft.artifact_morphology_contract;

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /artifact_morphology_contract/i,
  );
});

test('stage-decomposition closeout validator rejects incomplete artifact morphology contracts', () => {
  ARTIFACT_MORPHOLOGY_REQUIRED_POLICIES.forEach((field) => {
    const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
    const draft = packet.stage_decomposition_pack_draft as JsonObject;
    const contract = draft.artifact_morphology_contract as JsonObject;
    delete contract[field];

    assert.throws(
      () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
      new RegExp(`artifact morphology|artifact_morphology_contract|${field}`, 'i'),
      `missing artifact morphology policy should fail closed: ${field}`,
    );
  });
});

test('stage-decomposition closeout validator rejects missing gate declarations and self-review', () => {
  const missingGatePacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const missingGateDraft = missingGatePacket.stage_decomposition_pack_draft as JsonObject;
  const files = missingGateDraft.files as JsonObject[];
  const gateFile = files.find((entry) => entry.path === 'agent/quality_gates/agent-output-draft-quality-gate.md');
  assert.ok(gateFile);
  gateFile.body = '# Gate\n\nLooks acceptable.\n';
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(missingGatePacket, { targetAgent }),
    /quality gate declaration/i,
  );

  const selfReviewPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const selfReviewDraft = selfReviewPacket.stage_decomposition_pack_draft as JsonObject;
  const selfReviewStage = ((selfReviewDraft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  selfReviewStage.independent_gate_policy.execution_review_separation_required = false;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(selfReviewPacket, { targetAgent }),
    /self-review|execution_review_separation_required/i,
  );

  const missingUserLogPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const missingUserLogDraft = missingUserLogPacket.stage_decomposition_pack_draft as JsonObject;
  const missingUserLogStage = ((missingUserLogDraft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  delete missingUserLogStage.stage_contract.user_stage_log_contract;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(missingUserLogPacket, { targetAgent }),
    /user_stage_log_contract/i,
  );

  const missingStageNativePacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const missingStageNativeDraft = missingStageNativePacket.stage_decomposition_pack_draft as JsonObject;
  const missingStageNativeStage = ((missingStageNativeDraft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  delete missingStageNativeStage.stage_contract.stage_native_artifact_contract;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(missingStageNativePacket, { targetAgent }),
    /stage_native_artifact_contract/i,
  );
});

test('build-agent-baseline consumes supplied fixture closeout instead of scripting a fixed stage graph', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-closeout-'));
  try {
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    fs.writeFileSync(reviewerEvaluationPath, `${JSON.stringify({
      reviewer_kind: 'ai_reviewer',
      model_or_provider: 'gpt-5.5',
      run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
      review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      no_shared_context: true,
      independent_attempt: true,
      critique: 'The baseline has explicit evidence and owner handoff refs.',
      suggestions: ['Keep source coverage evidence explicit.'],
      source_refs: [
        'review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer',
        ...reviewerMorphologySourceRefs('research-workbench-agent', 'research-question-intake'),
      ],
      direct_evidence_refs: [
        'artifact-ref:research-workbench-agent/package',
        ...reviewerMorphologyDirectEvidenceRefs('research-workbench-agent', 'research-question-intake'),
      ],
      verdict: 'baseline_ready_with_owner_gate',
      predicted_impact: 'Owner-gated baseline can be evaluated without granting OPL target authority.',
      provenance: {
        artifact_ref: 'artifact-ref:ai-reviewer/research-workbench-agent-baseline',
        reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
        created_by: 'test-fixture',
      },
    }, null, 2)}\n`);
    const closeoutPath = path.join(outputRoot, 'stage-decomposition-closeout.json');
    fs.writeFileSync(closeoutPath, `${JSON.stringify(buildFixtureStageDecompositionCloseout({
      targetAgent,
      stageId: 'research-question-intake',
      actionId: 'capture-research-question',
      title: 'Research Question Intake',
      promptPath: 'agent/prompts/research-question-intake.md',
      stagePath: 'agent/stages/research-question-intake.md',
      skillPath: 'agent/skills/research-question-intake-skill.md',
      knowledgePath: 'agent/knowledge/research-question-intake-boundary.md',
      qualityGatePath: 'agent/quality_gates/research-question-intake-gate.md',
    }), null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--stage-runner',
        'fixture',
        '--stage-closeout-packet',
        closeoutPath,
        '--opl-bin',
        process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        targetAgent.domain_id,
        '--domain-label',
        targetAgent.domain_label,
        '--delivery-domain',
        targetAgent.delivery_domain,
        '--target-brief',
        targetAgent.target_brief,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const stageControl = readJson(path.join(outputRoot, targetAgent.domain_id, 'contracts/stage_control_plane.json'));
    stageById(stageControl, 'research-question-intake');
    assert.equal(
      (stageControl.stages as JsonObject[]).some((stage) => stage.stage_id === 'agent-output-draft'),
      false,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline rejects implicit fixture closeout materialization', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-implicit-fixture-'));
  try {
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    fs.writeFileSync(reviewerEvaluationPath, `${JSON.stringify({
      reviewer_kind: 'ai_reviewer',
      model_or_provider: 'gpt-5.5',
      run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
      review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      no_shared_context: true,
      independent_attempt: true,
      critique: 'The implicit fixture path should fail before materialization.',
      suggestions: ['Require an explicit typed closeout fixture file for deterministic tests.'],
      source_refs: [
        'review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer',
        ...reviewerMorphologySourceRefs('research-workbench-agent'),
      ],
      direct_evidence_refs: [
        'artifact-ref:research-workbench-agent/package',
        ...reviewerMorphologyDirectEvidenceRefs('research-workbench-agent'),
      ],
      verdict: 'blocked',
      predicted_impact: 'Implicit fixture smoke can no longer create an unstated stage graph.',
      provenance: {
        artifact_ref: 'artifact-ref:ai-reviewer/research-workbench-agent-baseline',
        reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
        created_by: 'test-fixture',
      },
    }, null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--stage-runner',
        'fixture',
        '--opl-bin',
        process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        targetAgent.domain_id,
        '--domain-label',
        targetAgent.domain_label,
        '--delivery-domain',
        targetAgent.delivery_domain,
        '--target-brief',
        targetAgent.target_brief,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /fixture runner only consumes an explicit typed closeout packet/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline writes a typed blocker when stage-decomposition closeout is invalid', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-closeout-blocker-'));
  try {
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    fs.writeFileSync(reviewerEvaluationPath, `${JSON.stringify({
      reviewer_kind: 'ai_reviewer',
      model_or_provider: 'gpt-5.5',
      run_ref: 'run:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      execution_attempt_ref: 'attempt:executor/opl-meta-agent/research-workbench-agent/baseline',
      review_attempt_ref: 'attempt:ai-reviewer/opl-meta-agent/research-workbench-agent/baseline',
      no_shared_context: true,
      independent_attempt: true,
      critique: 'The invalid closeout should block before baseline receipt signing.',
      suggestions: ['Return a typed blocker and keep the target package unsigned.'],
      source_refs: [
        'review-ref:opl-meta-agent/research-workbench-agent/ai-reviewer',
        ...reviewerMorphologySourceRefs('research-workbench-agent'),
      ],
      direct_evidence_refs: [
        'artifact-ref:research-workbench-agent/package',
        ...reviewerMorphologyDirectEvidenceRefs('research-workbench-agent'),
      ],
      verdict: 'blocked',
      predicted_impact: 'Invalid stage decomposition cannot be materialized.',
      provenance: {
        artifact_ref: 'artifact-ref:ai-reviewer/research-workbench-agent-baseline',
        reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
        created_by: 'test-fixture',
      },
    }, null, 2)}\n`);
    const closeoutPath = path.join(outputRoot, 'invalid-stage-decomposition-closeout.json');
    fs.writeFileSync(closeoutPath, `${JSON.stringify({
      surface_kind: 'stage_attempt_closeout_packet',
      stage_id: 'stage-decomposition',
      closeout_refs: ['receipt:partial'],
    }, null, 2)}\n`);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--stage-runner',
        'fixture',
        '--stage-closeout-packet',
        closeoutPath,
        '--opl-bin',
        process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--domain-id',
        targetAgent.domain_id,
        '--domain-label',
        targetAgent.domain_label,
        '--delivery-domain',
        targetAgent.delivery_domain,
        '--target-brief',
        targetAgent.target_brief,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    const blockerPath = path.join(outputRoot, `${targetAgent.domain_id}-stage-decomposition-blocker.json`);
    assert.equal(fs.existsSync(blockerPath), true, result.stderr);
    const blocker = readJson(blockerPath);
    assert.equal(blocker.surface_kind, 'stage_attempt_closeout_packet');
    assert.equal(blocker.stage_id, 'stage-decomposition');
    assert.equal(blocker.blocked_reason, 'stage_decomposition_materialization_failed');
    assert.equal(blocker.route_impact.baseline_receipt_signed, false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

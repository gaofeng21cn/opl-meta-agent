import fs from 'node:fs';
import path from 'node:path';
import {
  buildReferenceBuildDigestTargets,
  materializeReferenceBuildFileDigest,
} from 'opl-framework-shared/reference-build-proof';
import {
  buildAgentBuildReceipt,
  buildAgentBuildReceiptRef,
  buildStageDecompositionSubpacketSet,
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import { runOpl, writeJson } from '../meta-agent-loop-io.ts';
import type {
  AgentSkeletonBuildFile,
  StageDecompositionCloseoutPacket,
  StageDecompositionPackDraft,
} from './shared.ts';
import {
  asRecordArray,
  asString,
  asStringArray,
  isRecord,
  validateBody,
  validateMaterializationPath,
  validateRelativeMarkdownPath,
} from './shared.ts';

export type StageDecompositionCloseoutRepairResult = {
  packet: unknown;
  repaired: boolean;
  repair_notes: string[];
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string =>
    typeof value === 'string' && value.trim().length > 0
  ).map((value) => value.trim()))];
}

function refValues(value: unknown, field: string): string[] {
  return asRecordArray(value, field).map((entry, index) =>
    asString(entry.ref, `${field}[${index}].ref`)
  );
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

const frameworkOwnedStageContractFields = new Set([
  'expected_receipt_refs',
  'receipt_schema_refs',
  'authority_function_refs',
  'l4_entry_gate',
  'l5_entry_gate',
  'stage_completion_policy',
  'user_stage_log_contract',
  'progress_delta_policy',
  'typed_blocker_lineage_policy',
]);

function declarativeStageContract(stageContract: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(stageContract).filter(([field]) => !frameworkOwnedStageContractFields.has(field)),
  );
}

function buildDeclarativeStageManifest(draft: StageDecompositionPackDraft): JsonObject {
  const domainId = draft.target_agent.domain_id;
  const stages = asRecordArray(draft.stage_control_plane.stages, 'stage_control_plane.stages');
  return {
    surface_kind: 'opl_standard_agent_declarative_stage_manifest',
    version: 'opl-standard-agent-declarative-stage-manifest.v1',
    target_domain_id: domainId,
    owner: domainId,
    authority_boundary: {
      domain_truth_owner: domainId,
      opl_can_write_domain_truth: false,
      opl_can_authorize_quality_or_export: false,
    },
    stages: stages.map((stage, index) => {
      const stageId = asString(stage.stage_id, `stage_control_plane.stages[${index}].stage_id`);
      const stageContract = isRecord(stage.stage_contract)
        ? stage.stage_contract
        : (() => { throw new Error(`stage_control_plane stage ${stageId} requires stage_contract.`); })();
      const promptRefs = refValues(stage.prompt_refs, `stage_control_plane.stages[${index}].prompt_refs`);
      const patternRefs = asStringArray(
        stage.stage_pattern_source_refs ?? [],
        `stage_control_plane.stages[${index}].stage_pattern_source_refs`,
      );
      const stageOrigin = optionalString(stage.stage_origin);
      const sourcePatternRef = stageOrigin === 'source_pattern_ref' ? patternRefs[0] : null;
      const policyRef = `agent/stages/${stageId}.md`;
      if (!draft.file_materialization_plan.files.some((file) => file.path === policyRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} is missing ${policyRef}.`);
      }
      const trustLane = isRecord(stage.trust_boundary)
        ? optionalString(stage.trust_boundary.lane)
        : null;
      return {
        stage_id: stageId,
        stage_kind: asString(stage.stage_kind, `stage_control_plane.stages[${index}].stage_kind`),
        title: asString(stage.title, `stage_control_plane.stages[${index}].title`),
        summary: optionalString(stage.summary) ?? undefined,
        goal: asString(stage.goal, `stage_control_plane.stages[${index}].goal`),
        policy_ref: policyRef,
        prompt_ref: asString(promptRefs[0], `stage_control_plane.stages[${index}].prompt_refs[0].ref`),
        knowledge_refs: refValues(
          stage.knowledge_refs,
          `stage_control_plane.stages[${index}].knowledge_refs`,
        ),
        quality_gate_refs: refValues(
          stage.evaluation,
          `stage_control_plane.stages[${index}].evaluation`,
        ),
        allowed_action_refs: asStringArray(
          stage.allowed_action_refs,
          `stage_control_plane.stages[${index}].allowed_action_refs`,
        ),
        requires: asStringArray(stageContract.requires, `stage_control_plane.stages[${index}].stage_contract.requires`),
        ensures: asStringArray(stageContract.ensures, `stage_control_plane.stages[${index}].stage_contract.ensures`),
        next_stage_refs: index + 1 < stages.length
          ? [asString(stages[index + 1]?.stage_id, `stage_control_plane.stages[${index + 1}].stage_id`)]
          : [],
        ...(trustLane ? { lane_kind: trustLane, trust_lane: trustLane } : {}),
        ...(stageOrigin ? { stage_origin: stageOrigin } : {}),
        ...(optionalString(stage.pattern_id) ? { pattern_id: optionalString(stage.pattern_id) } : {}),
        ...(optionalString(stage.step_id) ? { step_id: optionalString(stage.step_id) } : {}),
        ...(optionalString(stage.provenance_kind)
          ? { provenance_kind: optionalString(stage.provenance_kind) }
          : {}),
        ...(sourcePatternRef ? { source_pattern_ref: sourcePatternRef } : {}),
        ...(asStringArray(stage.source_anchor_refs ?? [], `stage_control_plane.stages[${index}].source_anchor_refs`).length > 0
          ? { source_anchor_refs: asStringArray(
              stage.source_anchor_refs,
              `stage_control_plane.stages[${index}].source_anchor_refs`,
            ) }
          : {}),
        ...(patternRefs.length > 0 ? { stage_pattern_source_refs: patternRefs } : {}),
        ...(optionalString(stage.target_only_requirement_ref)
          ? { target_only_requirement_ref: optionalString(stage.target_only_requirement_ref) }
          : {}),
        stage_contract: declarativeStageContract(stageContract),
      };
    }),
  };
}

function installBuildReceipt(surface: JsonObject, receipt: JsonObject): void {
  const receiptRef = asString(receipt.receipt_ref, 'build_receipt.receipt_ref');
  surface.expected_build_receipt_ref = receiptRef;
  surface.build_receipt = receipt;
  surface.build_receipt_ref = receiptRef;
  surface.build_receipt_refs = [receiptRef];
}

export function materializeAgentBuildReceipt(
  targetAgentDir: string,
  targetAgent: TargetAgent,
): JsonObject | null {
  const baseReceipt = buildAgentBuildReceipt(targetAgent);
  if (!baseReceipt) {
    return null;
  }
  const stageControlPath = path.join(targetAgentDir, 'contracts', 'stage_control_plane.json');
  const stageControl = JSON.parse(fs.readFileSync(stageControlPath, 'utf8')) as JsonObject;
  const agentPackPlan = isRecord(stageControl.agent_pack_plan) ? stageControl.agent_pack_plan : null;
  if (!agentPackPlan) {
    throw new Error('AgentBuildReceipt requires a materialized AgentPackPlan.');
  }
  const plannedStages = asRecordArray(agentPackPlan.planned_stage_refs, 'agent_pack_plan.planned_stage_refs');
  const materializedStages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
  const plannedStageIds = plannedStages.map((stage) =>
    asString(stage.stage_id, 'agent_pack_plan.planned_stage_refs[].stage_id')
  );
  const materializedStageIds = materializedStages.map((stage) =>
    asString(stage.stage_id, 'stage_control_plane.stages[].stage_id')
  );
  if (JSON.stringify(plannedStageIds) !== JSON.stringify(materializedStageIds)) {
    throw new Error('AgentBuildReceipt cannot be issued before every AgentPackPlan stage is materialized exactly once.');
  }
  const digestTargets = buildReferenceBuildDigestTargets(targetAgentDir, agentPackPlan);
  const receipt: JsonObject = {
    ...baseReceipt,
    receipt_timing: 'post_materialization',
    materialization: {
      status: 'passed',
      planned_stage_ids: plannedStageIds,
      materialized_stage_ids: materializedStageIds,
      materialized_file_digests: digestTargets.map((target) =>
        materializeReferenceBuildFileDigest(targetAgentDir, target)
      ),
      all_planned_stages_materialized_exactly_once: true,
      all_planned_control_refs_resolved: true,
      all_resolvable_planned_capability_refs_digested: true,
      all_planned_stage_files_present: true,
    },
  };
  if (receipt.receipt_ref !== buildAgentBuildReceiptRef(targetAgent)) {
    throw new Error('AgentBuildReceipt ref drifted from the expected pre-materialization ref.');
  }
  installBuildReceipt(stageControl, receipt);
  materializedStages.forEach((stage) => installBuildReceipt(stage, receipt));
  writeJson(stageControlPath, stageControl);
  writeJson(path.join(targetAgentDir, 'contracts', 'agent_build_receipt.json'), receipt);
  return receipt;
}

function conformanceProfileId(targetAgent: TargetAgent): string | null {
  const selectedProfileRefs = uniqueStrings(targetAgent.selected_opl_profile_refs ?? []);
  if (selectedProfileRefs.length > 1) {
    throw new Error(`OPL profile conformance requires exactly one builtin profile, found: ${selectedProfileRefs.join(', ')}`);
  }
  const selectedProfileRef = selectedProfileRefs[0];
  if (selectedProfileRef) {
    if (!selectedProfileRef.startsWith('opl-profile:') || selectedProfileRef.startsWith('opl-profile-route:')) {
      throw new Error(`OPL profile conformance received an invalid builtin profile ref: ${selectedProfileRef}`);
    }
    return selectedProfileRef.slice('opl-profile:'.length);
  }
  if (
    (targetAgent.reference_design_source_refs?.length ?? 0) > 0
    || (targetAgent.reference_design_pattern_packet_refs?.length ?? 0) > 0
  ) {
    return 'source_derived_design_profile_route.v1';
  }
  if (
    (targetAgent.research_source_refs?.length ?? 0) > 0
    || (targetAgent.expert_practice_notes?.length ?? 0) > 0
    || (targetAgent.research_synthesis_refs?.length ?? 0) > 0
  ) {
    return null;
  }
  throw new Error('OPL profile conformance requires one builtin profile or an explicit design-basis route.');
}

export function assertTargetProfileConformance(
  oplBin: string,
  targetAgentDir: string,
  targetAgent: TargetAgent,
): JsonObject {
  const profileId = conformanceProfileId(targetAgent);
  if (!profileId) {
    return {
      surface_kind: 'opl_agent_profile_conformance_not_applicable',
      version: 'agent-profile-conformance-not-applicable.v1',
      repo_dir: targetAgentDir,
      status: 'not_applicable',
      reason: 'research_driven_design_route_not_exposed_by_opl_profiles_conformance',
      authority_boundary: {
        conformance_skipped_as_success: false,
        domain_ready_claimed: false,
        production_ready_claimed: false,
      },
    };
  }
  const args = ['profiles', 'conformance', '--repo-dir', targetAgentDir];
  args.push('--profile', profileId);
  const readback = runOpl(oplBin, [...args, '--json']);
  const conformance = readback.profile_conformance;
  if (!isRecord(conformance)) {
    throw new Error('OPL profile conformance readback is missing profile_conformance.');
  }
  if (conformance.status !== 'passed') {
    throw new Error(
      `OPL profile conformance blocked after target write: ${JSON.stringify(conformance.blockers ?? [])}`,
    );
  }
  return conformance;
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    return null;
  }
  return value;
}

function canReplaceSubpacketSet(value: unknown, expectedRef: string): boolean {
  if (value == null) {
    return true;
  }
  if (!isRecord(value)) {
    return false;
  }
  const actualRef = value.packet_set_ref;
  if (actualRef == null) {
    return value.surface_kind === 'opl_meta_agent_stage_decomposition_subpacket_set';
  }
  return actualRef === expectedRef;
}

function installSubpacketSetProjection(
  surface: JsonObject,
  expectedSet: JsonObject,
  repairNotes: string[],
  surfaceName: string,
): void {
  const expectedRef = String(expectedSet.packet_set_ref);
  if (canReplaceSubpacketSet(surface.stage_decomposition_subpacket_set, expectedRef)) {
    if (JSON.stringify(surface.stage_decomposition_subpacket_set ?? null) !== JSON.stringify(expectedSet)) {
      surface.stage_decomposition_subpacket_set = cloneJson(expectedSet);
      repairNotes.push(`${surfaceName}.stage_decomposition_subpacket_set`);
    }
  }
  if (surface.stage_decomposition_subpacket_set_ref == null) {
    surface.stage_decomposition_subpacket_set_ref = expectedRef;
    repairNotes.push(`${surfaceName}.stage_decomposition_subpacket_set_ref`);
  }
  const refs = stringArray(surface.stage_decomposition_subpacket_set_refs);
  if (refs === null) {
    if (surface.stage_decomposition_subpacket_set_refs == null) {
      surface.stage_decomposition_subpacket_set_refs = [expectedRef];
      repairNotes.push(`${surfaceName}.stage_decomposition_subpacket_set_refs`);
    }
    return;
  }
  if (!refs.includes(expectedRef)) {
    surface.stage_decomposition_subpacket_set_refs = [...refs, expectedRef];
    repairNotes.push(`${surfaceName}.stage_decomposition_subpacket_set_refs`);
  }
}

function addStageSubpacketRefs(stage: JsonObject, expectedRef: string, repairNotes: string[], stageName: string): void {
  if (Array.isArray(stage.inputs) && !stage.inputs.some((entry) =>
    isRecord(entry)
    && entry.ref_kind === 'stage_decomposition_subpacket_set_ref'
    && entry.ref === expectedRef
  )) {
    stage.inputs = [
      ...stage.inputs,
      { ref_kind: 'stage_decomposition_subpacket_set_ref', ref: expectedRef },
    ];
    repairNotes.push(`${stageName}.inputs.stage_decomposition_subpacket_set_ref`);
  }

  const stageContract = isRecord(stage.stage_contract) ? stage.stage_contract : null;
  if (!stageContract) {
    return;
  }
  const requiredRef = `stage-decomposition-subpacket-set-ref:${expectedRef}`;
  if (Array.isArray(stageContract.requires) && !stageContract.requires.includes(requiredRef)) {
    stageContract.requires = [...stageContract.requires, requiredRef];
    repairNotes.push(`${stageName}.stage_contract.requires.stage_decomposition_subpacket_set_ref`);
  }
  if (Array.isArray(stageContract.expected_receipt_refs) && !stageContract.expected_receipt_refs.some((entry) =>
    isRecord(entry)
    && entry.ref === expectedRef
  )) {
    stageContract.expected_receipt_refs = [
      ...stageContract.expected_receipt_refs,
      { ref_kind: 'stage_decomposition_subpacket_set_ref', ref: expectedRef },
    ];
    repairNotes.push(`${stageName}.stage_contract.expected_receipt_refs.stage_decomposition_subpacket_set_ref`);
  }
}

function installFoundryStageIdentityProjection(
  draft: JsonObject,
  targetAgent: TargetAgent,
  repairNotes: string[],
): void {
  const foundrySeries = isRecord(draft.foundry_agent_series) ? draft.foundry_agent_series : null;
  if (!foundrySeries) {
    return;
  }
  if (!Array.isArray(foundrySeries.required_identity_fields)
    || foundrySeries.required_identity_fields.some((field) =>
      typeof field !== 'string' || field.trim().length === 0
    )) {
    return;
  }
  const requiredIdentityFields = foundrySeries.required_identity_fields.map((field) => field.trim());
  const expectedLabel = targetAgent.domain_label ?? targetAgent.domain_id;
  const expectedCoreIdentity: Record<string, string> = {
    domain_id: targetAgent.domain_id,
    foundry_agent_id: targetAgent.domain_id,
    product_layer: 'foundry_agent',
    domain_label: expectedLabel,
    authority_owner: expectedLabel,
    stage_control_plane_target_domain_id: targetAgent.domain_id,
  };
  const requiredLegacyIdentityFields = [
    'domain_id',
    'foundry_agent_id',
    'product_layer',
    'domain_label',
    'authority_owner',
    'stage_control_plane_ref',
  ];
  if (uniqueStrings(requiredIdentityFields).length !== requiredIdentityFields.length
    || requiredLegacyIdentityFields.some((field) => !requiredIdentityFields.includes(field))
    || Object.entries(expectedCoreIdentity).some(([field, expected]) => foundrySeries[field] !== expected)) {
    return;
  }
  const expectedFields: Record<string, string> = {
    stage_manifest_ref: 'agent/stages/manifest.json',
    stage_control_plane_ref: 'opl-generated:family_stage_control_plane',
  };
  Object.entries(expectedFields).forEach(([field, expected]) => {
    if (foundrySeries[field] !== expected) {
      foundrySeries[field] = expected;
      repairNotes.push(`foundry_agent_series.${field}`);
    }
  });
  for (const field of ['stage_manifest_ref', 'stage_control_plane_ref']) {
    if (!requiredIdentityFields.includes(field)) {
      requiredIdentityFields.push(field);
      repairNotes.push(`foundry_agent_series.required_identity_fields.${field}`);
    }
  }
  foundrySeries.required_identity_fields = requiredIdentityFields;
}

export function repairStageDecompositionCloseoutPacket(
  packet: unknown,
  { targetAgent }: { targetAgent: TargetAgent },
): StageDecompositionCloseoutRepairResult {
  const expectedSet = buildStageDecompositionSubpacketSet(targetAgent);
  if (!isRecord(packet)) {
    return { packet, repaired: false, repair_notes: [] };
  }
  if (
    packet.surface_kind !== 'stage_attempt_closeout_packet'
    || packet.stage_id !== 'stage-decomposition'
    || !isRecord(packet.stage_decomposition_pack_draft)
  ) {
    return { packet, repaired: false, repair_notes: [] };
  }

  const repairedPacket = cloneJson(packet) as StageDecompositionCloseoutPacket;
  const repairNotes: string[] = [];
  const draft = repairedPacket.stage_decomposition_pack_draft as unknown as JsonObject;
  installFoundryStageIdentityProjection(draft, targetAgent, repairNotes);

  if (expectedSet) {
    const expectedRef = String(expectedSet.packet_set_ref);
    installSubpacketSetProjection(draft, expectedSet, repairNotes, 'stage_decomposition_pack_draft');
    const stageControl = isRecord(draft.stage_control_plane) ? draft.stage_control_plane : null;
    if (stageControl) {
      installSubpacketSetProjection(stageControl, expectedSet, repairNotes, 'stage_control_plane');
      if (Array.isArray(stageControl.stages)) {
        stageControl.stages.forEach((stage, index) => {
          if (!isRecord(stage)) {
            return;
          }
          const stageName = `stage_control_plane.stages[${index}]`;
          installSubpacketSetProjection(stage, expectedSet, repairNotes, stageName);
          addStageSubpacketRefs(stage, expectedRef, repairNotes, stageName);
        });
      }
    }
  }

  return repairNotes.length > 0
    ? { packet: repairedPacket, repaired: true, repair_notes: repairNotes }
    : { packet, repaired: false, repair_notes: [] };
}

function refTemplateRecord({
  contract,
  fileName,
  refKind,
  refValue,
}: {
  contract: JsonObject;
  fileName: string;
  refKind: string;
  refValue: string;
}): JsonObject {
  return {
    surface_kind: 'opl_stage_native_artifact_materialized_ref',
    version: 'stage-native-artifact-materialized-ref.v1',
    target_domain_id: contract.target_domain_id,
    stage_id: contract.stage_id,
    file_name: fileName,
    ref_kind: refKind,
    ref: refValue,
    materialized_by: 'opl-meta-agent',
    materialization_kind: 'compiler_ref_template_only_not_runtime_state',
    runtime_state_created: false,
    owner_promotion_created: false,
    target_worktree_lifecycle_managed: false,
    owner_receipt_body_created: false,
    contains_target_artifact_body: false,
    authority_boundary: contract.authority_boundary,
  };
}

function materializeStageNativeArtifactRefFiles(targetAgentDir: string, draft: StageDecompositionPackDraft): void {
  const contracts = asRecordArray(draft.stage_native_artifact_contract.contracts, 'stage_native_artifact_contract.contracts');
  for (const contract of contracts) {
    const stageId = asString(contract.stage_id, 'stage_native_artifact_contract.contracts[].stage_id');
    const outputDir = path.join(targetAgentDir, 'contracts', 'stage_native_artifacts', stageId);
    fs.mkdirSync(outputDir, { recursive: true });
    const fileRefs = [
      ['stage.json', 'stage_json_ref', String(contract.stage_json_ref)],
      ['attempt.json', 'stage_attempt_json_ref', String(contract.attempt_json_ref)],
      ['stage.manifest.json', 'stage_manifest_ref', String(contract.manifest_ref)],
      ['receipt.json', 'stage_attempt_receipt_ref', String(contract.receipt_ref)],
      ['current.json', 'stage_current_pointer_ref', String(contract.current_pointer_ref)],
      ['canonical.json', 'canonical_artifact_ref', String(contract.canonical_artifact_ref)],
      ['export.json', 'stage_export_ref', String(contract.export_ref)],
      ['lineage.json', 'stage_lineage_ref', String(contract.lineage_ref)],
      ['retention.json', 'stage_retention_ref', String(contract.retention_ref)],
      ['physical_kernel_locator.json', 'opl_physical_kernel_locator_ref', String(contract.physical_kernel_locator_ref)],
      ['conformance.json', 'stage_artifact_conformance_ref', String(contract.conformance_ref)],
      ['workbench_consumption.json', 'stage_artifact_workbench_consumption_ref', String(contract.workbench_consumption_ref)],
    ] as const;
    fileRefs.forEach(([fileName, refKind, refValue]) => {
      writeJson(path.join(outputDir, fileName), refTemplateRecord({
        contract,
        fileName,
        refKind,
        refValue,
      }));
    });
  }
}

function installActionSchemaRequiredPaths(
  targetAgentDir: string,
  draft: StageDecompositionPackDraft,
): void {
  const compilerInputPath = path.join(targetAgentDir, 'contracts', 'pack_compiler_input.json');
  const compilerInput = JSON.parse(fs.readFileSync(compilerInputPath, 'utf8')) as JsonObject;
  const requiredPaths = Array.isArray(compilerInput.required_domain_pack_paths)
    ? compilerInput.required_domain_pack_paths.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const actions = asRecordArray(draft.action_catalog.actions, 'action_catalog.actions');
  const schemaRefs = actions.flatMap((action, index) => [
    asString(action.input_schema_ref, `action_catalog.actions[${index}].input_schema_ref`),
    asString(action.output_schema_ref, `action_catalog.actions[${index}].output_schema_ref`),
  ]);
  compilerInput.required_domain_pack_paths = [...new Set([...requiredPaths, ...schemaRefs])];
  writeJson(compilerInputPath, compilerInput);
}

export function materializeStageDecompositionPackDraft(
  targetAgentDir: string,
  draft: StageDecompositionPackDraft,
  materializedFiles: AgentSkeletonBuildFile[],
): void {
  for (const file of materializedFiles) {
    const relPath = validateMaterializationPath(file.path, 'materialized_files[].path');
    const body = validateBody(file.body, relPath);
    const filePath = path.join(targetAgentDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
  }
  writeJson(path.join(targetAgentDir, 'agent', 'stages', 'manifest.json'), buildDeclarativeStageManifest(draft));
  writeJson(path.join(targetAgentDir, 'contracts', 'action_catalog.json'), draft.action_catalog);
  writeJson(path.join(targetAgentDir, 'contracts', 'artifact_morphology_contract.json'), draft.artifact_morphology_contract);
  writeJson(path.join(targetAgentDir, 'contracts', 'stage_control_plane.json'), draft.stage_control_plane);
  writeJson(
    path.join(targetAgentDir, 'contracts', 'stage_native_artifact_contract.json'),
    draft.stage_native_artifact_contract,
  );
  installActionSchemaRequiredPaths(targetAgentDir, draft);
  materializeStageNativeArtifactRefFiles(targetAgentDir, draft);
  writeJson(path.join(targetAgentDir, 'contracts', 'foundry_agent_series.json'), draft.foundry_agent_series);
}

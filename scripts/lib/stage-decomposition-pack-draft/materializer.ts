import { STANDARD_AGENT_IMPLEMENTATION_PROFILE } from 'opl-framework/standard-agent-implementation-profile';

import {
  buildAgentBuildReceipt,
  buildAgentBuildReceiptRef,
  buildStageDecompositionSubpacketSet,
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
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
  optionalString,
  validateBody,
  validateMaterializationPath,
} from './shared.ts';

export type StageDecompositionCloseoutRepairResult = {
  packet: unknown;
  repaired: boolean;
  repair_notes: string[];
};

function cloneJson<T>(value: T): T {
  return structuredClone(value);
}

function refValues(value: unknown, field: string): string[] {
  return asRecordArray(value, field).map((entry, index) =>
    asString(entry.ref, `${field}[${index}].ref`)
  );
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

function buildStageNativeArtifactRefFiles(draft: StageDecompositionPackDraft) {
  const files: Array<{ path: string; body: string; role: string }> = [];
  const contracts = asRecordArray(draft.stage_native_artifact_contract.contracts, 'stage_native_artifact_contract.contracts');
  for (const contract of contracts) {
    const stageId = asString(contract.stage_id, 'stage_native_artifact_contract.contracts[].stage_id');
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
      files.push({
        path: `contracts/stage_native_artifacts/${stageId}/${fileName}`,
        body: `${JSON.stringify(refTemplateRecord({ contract, fileName, refKind, refValue }), null, 2)}\n`,
        role: 'stage_native_ref_template',
      });
    });
  }
  return files;
}

function actionSchemaRefs(draft: StageDecompositionPackDraft): string[] {
  const actions = asRecordArray(draft.action_catalog.actions, 'action_catalog.actions');
  return actions.flatMap((action, index) => [
    asString(action.input_schema_ref, `action_catalog.actions[${index}].input_schema_ref`),
    asString(action.output_schema_ref, `action_catalog.actions[${index}].output_schema_ref`),
  ]);
}

export type ScaffoldMaterializationRequestInput = {
  targetAgent: TargetAgent;
  draft: StageDecompositionPackDraft;
  materializedFiles: AgentSkeletonBuildFile[];
  primarySkillBody: string;
  descriptorProjection: JsonObject;
  capabilityMapProjection: JsonObject;
  packageManifest: JsonObject;
};

export function buildScaffoldMaterializationRequest({
  targetAgent,
  draft,
  materializedFiles,
  primarySkillBody,
  descriptorProjection,
  capabilityMapProjection,
  packageManifest,
}: ScaffoldMaterializationRequestInput): JsonObject {
  const expectedBuildReceiptRef = buildAgentBuildReceiptRef(targetAgent);
  const buildReceiptCandidate = buildAgentBuildReceipt(targetAgent) ?? {
    surface_kind: 'opl_meta_agent_build_receipt_candidate',
    version: 'opl-meta-agent.agent-build-receipt-candidate.v1',
    receipt_ref: expectedBuildReceiptRef,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    build_source_kind: 'builtin_profile',
    authority_boundary: {
      candidate_only: true,
      oma_can_finalize_materialized_file_digests: false,
      oma_can_issue_final_build_receipt: false,
    },
  };
  if (buildReceiptCandidate.receipt_ref !== expectedBuildReceiptRef) {
    throw new Error('OPL scaffold materialization requires one valid OMA build receipt candidate.');
  }
  const files = materializedFiles.map((file, index) => {
    const relPath = validateMaterializationPath(file.path, `materialized_files[${index}].path`);
    return {
      path: relPath,
      body: validateBody(file.body, relPath),
      role: 'oma_domain_pack_file',
    };
  });
  files.push({
    path: 'agent/primary_skill/SKILL.md',
    body: validateBody(primarySkillBody, 'agent/primary_skill/SKILL.md'),
    role: 'oma_primary_skill_candidate',
  });
  files.push({
    path: 'contracts/opl_agent_package_manifest.json',
    body: `${JSON.stringify(packageManifest, null, 2)}\n`,
    role: 'oma_agent_package_manifest_candidate',
  });
  files.push(...buildStageNativeArtifactRefFiles(draft));

  return {
    surface_kind: 'opl_agent_scaffold_materialization_request',
    version: 'opl-agent-scaffold-materialization-request.v1',
    canonical_schema_ref: 'contracts/opl-framework/agent-scaffold-materialization-request.schema.json',
    request_owner: 'opl-meta-agent',
    execution_owner: 'one-person-lab/OPL Foundry Lab',
    target_identity: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label ?? targetAgent.domain_id,
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    },
    overwrite_policy: {
      mode: 'replace_declared_files_only',
      allow_existing_target_dir: true,
      reject_absolute_paths: true,
      reject_parent_traversal: true,
      reject_symlink_escape: true,
      allowed_merge_object_paths: [
        'contracts/domain_descriptor.json',
        'contracts/capability_map.json',
      ],
    },
    files,
    json_projections: [
      {
        path: 'contracts/domain_descriptor.json',
        value: descriptorProjection,
        merge_policy: 'merge_object',
      },
      {
        path: 'contracts/capability_map.json',
        value: capabilityMapProjection,
        merge_policy: 'merge_object',
      },
    ],
    stage_manifest: {
      path: 'agent/stages/manifest.json',
      value: buildDeclarativeStageManifest(draft),
      write_policy: 'replace_declared_files_only',
    },
    contracts: [
      ['contracts/action_catalog.json', draft.action_catalog],
      ['contracts/artifact_morphology_contract.json', draft.artifact_morphology_contract],
      ['contracts/stage_native_artifact_contract.json', draft.stage_native_artifact_contract],
      ['contracts/foundry_agent_series.json', draft.foundry_agent_series],
    ].map(([contractPath, value]) => ({
      path: contractPath,
      value,
      write_policy: 'replace_declared_files_only',
    })),
    pack_compiler_input: {
      required_domain_pack_path_additions: [...new Set(actionSchemaRefs(draft))],
      implementation_profile: cloneJson(STANDARD_AGENT_IMPLEMENTATION_PROFILE),
    },
    build_receipt_candidate: buildReceiptCandidate,
    build_receipt_installation: {
      expected_build_receipt_ref: expectedBuildReceiptRef,
      receipt_path: 'contracts/agent_build_receipt.json',
      projection_paths: [
        'contracts/domain_descriptor.json',
        'contracts/capability_map.json',
      ],
    },
    validation_requests: [
      'standard_domain_agent_scaffold',
      'domain_pack_compiler',
      'agent_profile_conformance',
    ],
    authority_boundary: {
      oma_authors_agent_building_semantics: true,
      oma_writes_target_agent_files: false,
      opl_owns_physical_scaffold_materialization: true,
      opl_owns_materialized_file_digests: true,
      opl_owns_final_build_receipt: true,
      build_receipt_candidate_is_final_receipt: false,
      opl_can_write_target_domain_truth: false,
      opl_can_authorize_quality_or_export: false,
    },
  };
}

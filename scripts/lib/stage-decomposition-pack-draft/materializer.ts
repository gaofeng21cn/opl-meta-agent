import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildAgentBuildReceipt,
  buildAgentBuildReceiptRef,
  buildStageDecompositionSubpacketSet,
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import { runOpl, writeJson } from '../meta-agent-loop-io.ts';
import type {
  StageDecompositionCloseoutPacket,
  StageDecompositionPackDraft,
} from './shared.ts';
import {
  asRecordArray,
  asString,
  isRecord,
  validateBody,
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

type DigestTarget = {
  ref: string;
  local_file_ref: string;
  json_pointer?: string;
  source_kinds: string[];
};

const receiptProjectionFields = new Set([
  'build_receipt',
  'build_receipt_ref',
  'build_receipt_refs',
]);

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string =>
    typeof value === 'string' && value.trim().length > 0
  ).map((value) => value.trim()))];
}

function targetPath(targetAgentDir: string, fileRef: string): string {
  const root = path.resolve(targetAgentDir);
  const resolved = path.resolve(root, fileRef);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`AgentBuildReceipt local ref escapes target agent root: ${fileRef}`);
  }
  return resolved;
}

function parseDirectLocalRef(ref: string): { fileRef: string; jsonPointer?: string } | null {
  const hashIndex = ref.indexOf('#');
  const fileRef = hashIndex >= 0 ? ref.slice(0, hashIndex) : ref;
  const jsonPointer = hashIndex >= 0 ? ref.slice(hashIndex + 1) : undefined;
  if (
    !fileRef
    || path.isAbsolute(fileRef)
    || fileRef.includes(':')
    || (!fileRef.startsWith('agent/') && !fileRef.startsWith('contracts/'))
  ) {
    return null;
  }
  return { fileRef, ...(jsonPointer ? { jsonPointer } : {}) };
}

function actionDigestTarget(targetAgentDir: string, ref: string): Omit<DigestTarget, 'source_kinds'> {
  const actionId = ref.slice('action-ref:'.length);
  const actionCatalogRef = 'contracts/action_catalog.json';
  const actionCatalog = JSON.parse(fs.readFileSync(targetPath(targetAgentDir, actionCatalogRef), 'utf8')) as JsonObject;
  const actions = asRecordArray(actionCatalog.actions, 'action_catalog.actions');
  const actionIndex = actions.findIndex((action) => action.action_id === actionId);
  if (actionIndex < 0) {
    throw new Error(`AgentBuildReceipt cannot resolve planned action capability ref: ${ref}`);
  }
  return {
    ref,
    local_file_ref: actionCatalogRef,
    json_pointer: `/actions/${actionIndex}`,
  };
}

function digestTargetForRef(
  targetAgentDir: string,
  ref: string,
  sourceKind: string,
): DigestTarget | null {
  if (ref.startsWith('action-ref:')) {
    return { ...actionDigestTarget(targetAgentDir, ref), source_kinds: [sourceKind] };
  }
  const directRef = parseDirectLocalRef(
    ref.startsWith('domain-skill-ref:') ? ref.slice('domain-skill-ref:'.length) : ref,
  );
  if (!directRef) {
    return null;
  }
  return {
    ref,
    local_file_ref: directRef.fileRef,
    ...(directRef.jsonPointer ? { json_pointer: directRef.jsonPointer } : {}),
    source_kinds: [sourceKind],
  };
}

function mergeDigestTarget(targets: DigestTarget[], next: DigestTarget): void {
  const current = targets.find((target) =>
    target.ref === next.ref
    && target.local_file_ref === next.local_file_ref
    && target.json_pointer === next.json_pointer
  );
  if (current) {
    current.source_kinds = uniqueStrings([...current.source_kinds, ...next.source_kinds]);
    return;
  }
  targets.push(next);
}

function addRefs(
  targets: DigestTarget[],
  targetAgentDir: string,
  refs: unknown,
  sourceKind: string,
  requireResolution: boolean,
): void {
  for (const ref of uniqueStrings(Array.isArray(refs) ? refs : [refs])) {
    const target = digestTargetForRef(targetAgentDir, ref, sourceKind);
    if (!target) {
      if (requireResolution) {
        throw new Error(`AgentBuildReceipt cannot resolve required local ref: ${ref}`);
      }
      continue;
    }
    mergeDigestTarget(targets, target);
  }
}

function buildDigestTargets(targetAgentDir: string, agentPackPlan: JsonObject): DigestTarget[] {
  const targets: DigestTarget[] = [];
  addRefs(targets, targetAgentDir, agentPackPlan.planned_control_refs, 'planned_control_ref', true);
  addRefs(targets, targetAgentDir, agentPackPlan.planned_capability_refs, 'planned_capability_ref', false);
  addRefs(targets, targetAgentDir, agentPackPlan.planned_knowledge_refs, 'planned_knowledge_ref', true);
  addRefs(targets, targetAgentDir, agentPackPlan.planned_tool_refs, 'planned_tool_ref', true);
  addRefs(targets, targetAgentDir, agentPackPlan.planned_quality_gate_refs, 'planned_quality_gate_ref', true);

  const plannedStages = asRecordArray(agentPackPlan.planned_stage_refs, 'agent_pack_plan.planned_stage_refs');
  plannedStages.forEach((stage) => {
    addRefs(targets, targetAgentDir, stage.prompt_ref, 'planned_stage_prompt_ref', true);
    addRefs(targets, targetAgentDir, stage.stage_path, 'planned_stage_ref', true);
    addRefs(targets, targetAgentDir, stage.skill_ref, 'planned_stage_skill_ref', true);
    addRefs(targets, targetAgentDir, stage.knowledge_refs, 'planned_stage_knowledge_ref', true);
    addRefs(targets, targetAgentDir, stage.tool_refs, 'planned_stage_tool_ref', true);
    addRefs(targets, targetAgentDir, stage.quality_gate_refs, 'planned_stage_quality_gate_ref', true);
  });
  return targets;
}

function withoutReceiptProjection(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withoutReceiptProjection);
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !receiptProjectionFields.has(key))
    .map(([key, entry]) => [key, withoutReceiptProjection(entry)]));
}

function jsonPointerValue(payload: unknown, pointer: string, ref: string): unknown {
  if (!pointer.startsWith('/')) {
    throw new Error(`AgentBuildReceipt JSON pointer must start with /: ${ref}`);
  }
  let current = payload;
  for (const rawToken of pointer.slice(1).split('/')) {
    const token = rawToken.replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        throw new Error(`AgentBuildReceipt JSON pointer is unresolved: ${ref}`);
      }
      current = current[index];
      continue;
    }
    if (!isRecord(current) || !Object.hasOwn(current, token)) {
      throw new Error(`AgentBuildReceipt JSON pointer is unresolved: ${ref}`);
    }
    current = current[token];
  }
  return current;
}

function materializedFileDigest(targetAgentDir: string, target: DigestTarget): JsonObject {
  const filePath = targetPath(targetAgentDir, target.local_file_ref);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`AgentBuildReceipt cannot be issued because planned file is missing: ${target.ref}`);
  }
  const isJson = target.local_file_ref.endsWith('.json');
  let digestInput: string | Buffer;
  if (isJson) {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const selected = target.json_pointer
      ? jsonPointerValue(payload, target.json_pointer, target.ref)
      : withoutReceiptProjection(payload);
    digestInput = JSON.stringify(selected);
  } else {
    digestInput = fs.readFileSync(filePath);
  }
  return {
    ref: target.ref,
    local_file_ref: target.local_file_ref,
    ...(target.json_pointer ? { json_pointer: target.json_pointer } : {}),
    source_kinds: target.source_kinds,
    digest_scope: target.json_pointer ? 'json_pointer_value' : 'file_content',
    digest_normalization: isJson
      ? 'canonical_json_without_agent_build_receipt_projection'
      : 'raw_file_bytes',
    sha256: crypto.createHash('sha256').update(digestInput).digest('hex'),
  };
}

function installBuildReceipt(surface: JsonObject, receipt: JsonObject): void {
  const receiptRef = asString(receipt.receipt_ref, 'build_receipt.receipt_ref');
  surface.expected_build_receipt_ref = receiptRef;
  surface.build_receipt = receipt;
  surface.build_receipt_ref = receiptRef;
  surface.build_receipt_refs = [receiptRef];
}

export function writeAgentBuildReceiptExpectation(
  targetAgentDir: string,
  targetAgent: TargetAgent,
): JsonObject | null {
  const baseReceipt = buildAgentBuildReceipt(targetAgent);
  if (!baseReceipt) {
    return null;
  }
  const expectation: JsonObject = {
    surface_kind: 'opl_meta_agent_build_receipt_expectation',
    receipt_kind: 'AgentBuildReceiptExpectation',
    version: 'opl-meta-agent.agent-build-receipt-expectation.v1',
    status: 'pending_post_materialization',
    target_agent_ref: baseReceipt.target_agent_ref,
    receipt_ref: baseReceipt.receipt_ref,
  };
  writeJson(path.join(targetAgentDir, 'contracts', 'agent_build_receipt.json'), expectation);
  return expectation;
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
  const digestTargets = buildDigestTargets(targetAgentDir, agentPackPlan);
  const receipt: JsonObject = {
    ...baseReceipt,
    receipt_timing: 'post_materialization',
    materialization: {
      status: 'passed',
      planned_stage_ids: plannedStageIds,
      materialized_stage_ids: materializedStageIds,
      materialized_file_digests: digestTargets.map((target) => materializedFileDigest(targetAgentDir, target)),
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
  const selectedProfileRef = uniqueStrings(targetAgent.selected_opl_profile_refs ?? [])
    .find((ref) => ref.startsWith('opl-profile:') && !ref.startsWith('opl-profile-route:'));
  if (selectedProfileRef) {
    return selectedProfileRef.slice('opl-profile:'.length);
  }
  if (
    (targetAgent.reference_design_source_refs?.length ?? 0) > 0
    || (targetAgent.reference_design_pattern_packet_refs?.length ?? 0) > 0
  ) {
    return 'source_derived_design_profile_route.v1';
  }
  return null;
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

export function repairStageDecompositionCloseoutPacket(
  packet: unknown,
  { targetAgent }: { targetAgent: TargetAgent },
): StageDecompositionCloseoutRepairResult {
  const expectedSet = buildStageDecompositionSubpacketSet(targetAgent);
  if (!expectedSet || !isRecord(packet)) {
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

export function materializeStageDecompositionPackDraft(
  targetAgentDir: string,
  draft: StageDecompositionPackDraft,
): void {
  for (const file of draft.files) {
    const relPath = validateRelativeMarkdownPath(file.path, 'files[].path');
    const body = validateBody(file.body, relPath);
    const filePath = path.join(targetAgentDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
  }
  writeJson(path.join(targetAgentDir, 'contracts', 'action_catalog.json'), draft.action_catalog);
  writeJson(path.join(targetAgentDir, 'contracts', 'artifact_morphology_contract.json'), draft.artifact_morphology_contract);
  writeJson(path.join(targetAgentDir, 'contracts', 'stage_control_plane.json'), draft.stage_control_plane);
  writeJson(
    path.join(targetAgentDir, 'contracts', 'stage_native_artifact_contract.json'),
    draft.stage_native_artifact_contract,
  );
  materializeStageNativeArtifactRefFiles(targetAgentDir, draft);
  writeJson(path.join(targetAgentDir, 'contracts', 'foundry_agent_series.json'), draft.foundry_agent_series);
}

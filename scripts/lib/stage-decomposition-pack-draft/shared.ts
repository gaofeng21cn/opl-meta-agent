import fs from 'node:fs';
import path from 'node:path';
import type { JsonObject } from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';

type StandardFoundryPolicies = JsonObject;

const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

function stringList(policy: StandardFoundryPolicies, field: string): string[] {
  const value = policy[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`Standard Foundry policy ${field} must be a non-empty string array.`);
  }
  return value.map((entry) => entry.trim());
}

function objectField(policy: StandardFoundryPolicies, field: string): JsonObject {
  const value = policy[field];
  if (!isRecord(value)) {
    throw new Error(`Standard Foundry policy ${field} must be a JSON object.`);
  }
  return value;
}

function objectStringField(policy: JsonObject, field: string): string {
  const value = policy[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Standard Foundry policy ${field} must be a non-empty string.`);
  }
  return value.trim();
}

function assertBoolean(policy: JsonObject, field: string): void {
  if (typeof policy[field] !== 'boolean') {
    throw new Error(`Standard Foundry policy ${field} must be a boolean.`);
  }
}

function arraysMatch(left: unknown, right: string[]): boolean {
  return Array.isArray(left)
    && left.length === right.length
    && left.every((entry, index) => entry === right[index]);
}

function readStandardFoundryPolicies(): StandardFoundryPolicies {
  const policy = JSON.parse(
    fs.readFileSync(new URL('../../../contracts/standard_foundry_policies.json', import.meta.url), 'utf8'),
  ) as StandardFoundryPolicies;
  if (policy.surface_kind !== 'standard_foundry_policies') {
    throw new Error('Standard Foundry policies contract has an unexpected surface_kind.');
  }
  const consumers = Array.isArray(policy.active_policy_consumer_refs)
    ? policy.active_policy_consumer_refs
    : [];
  if (!consumers.includes('scripts/lib/stage-decomposition-pack-draft/shared.ts')) {
    throw new Error('Standard Foundry policies contract must name stage-decomposition shared as an active consumer.');
  }
  const requiredFields = stringList(policy, 'user_stage_log_required_fields');
  const userStageLogContract = objectField(policy, 'user_stage_log_contract');
  if (!arraysMatch(userStageLogContract.required_domain_semantic_fields, requiredFields)) {
    throw new Error('Standard Foundry policies contract stage-log fields drifted from required fields.');
  }
  const stagePackDefaults = objectField(policy, 'stage_pack_defaults');
  objectStringField(stagePackDefaults, 'stage_pack_conformance_version');
  objectStringField(stagePackDefaults, 'default_stage_executor_binding_ref');
  const sharedPolicyRelease = objectField(policy, 'shared_policy_release');
  [
    'policy_release_contract_ref',
    'policy_bundle_fingerprint',
    'fingerprint_algorithm',
    'consumer_alignment_check',
  ].forEach((field) => objectStringField(sharedPolicyRelease, field));
  [
    'domain_contract_policy_release_pin_required',
    'domain_adapter_must_not_copy_policy_body_as_authority',
  ].forEach((field) => assertBoolean(sharedPolicyRelease, field));
  return policy;
}

const STANDARD_FOUNDRY_POLICIES = readStandardFoundryPolicies();

export const FORBIDDEN_GENERIC_OWNER_ROLES = stringList(
  STANDARD_FOUNDRY_POLICIES,
  'forbidden_generic_owner_roles',
);

const STAGE_PACK_DEFAULTS = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'stage_pack_defaults',
);

export const STANDARD_STAGE_PACK_CONFORMANCE_VERSION = objectStringField(
  STAGE_PACK_DEFAULTS,
  'stage_pack_conformance_version',
);

export const DEFAULT_STAGE_EXECUTOR_BINDING_REF = objectStringField(
  STAGE_PACK_DEFAULTS,
  'default_stage_executor_binding_ref',
);

export const SHARED_POLICY_RELEASE = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'shared_policy_release',
);

export const USER_STAGE_LOG_REQUIRED_FIELDS = stringList(
  STANDARD_FOUNDRY_POLICIES,
  'user_stage_log_required_fields',
);

export const USER_STAGE_LOG_CONTRACT = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'user_stage_log_contract',
);

export const STAGE_PROGRESS_DELTA_POLICY = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'stage_progress_delta_policy',
);

export const TYPED_BLOCKER_LINEAGE_POLICY = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'typed_blocker_lineage_policy',
);

export const STAGE_COMPLETION_POLICY = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'stage_completion_policy',
);

export const SERIES_DESIGN_PROFILE = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'series_design_profile',
);

export const AGENT_MEMBERSHIP_PROJECTION_POLICY = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'agent_membership_projection_policy',
);

export const STANDARD_PUBLIC_PROJECTION_POLICY = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'standard_public_projection_policy',
);

export const WORKSPACE_TOPOLOGY_PROFILE = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'workspace_topology_profile',
);

export type StageDecompositionFilePlan = {
  path: string;
  materialization_stage_ref: 'agent-skeleton-build';
  body_requirement_refs: string[];
};

export type AgentSkeletonBuildFile = {
  path: string;
  body: string;
};

export type StageDecompositionPackDraft = {
  surface_kind: 'opl_meta_agent_stage_decomposition_pack_draft';
  version: 'opl-meta-agent.stage-decomposition-pack-draft.v1';
  target_agent: TargetAgent;
  owner_boundary: JsonObject;
  no_forbidden_write_policy: JsonObject;
  artifact_morphology_contract: JsonObject;
  action_catalog: JsonObject;
  stage_control_plane: JsonObject;
  stage_native_artifact_contract: JsonObject;
  foundry_agent_series: JsonObject;
  stage_decomposition_subpacket_set?: JsonObject | null;
  stage_decomposition_subpacket_set_ref?: string | null;
  stage_decomposition_subpacket_set_refs?: string[];
  file_materialization_plan: {
    surface_kind: 'opl_meta_agent_file_materialization_plan';
    version: 'opl-meta-agent.file-materialization-plan.v1';
    materialization_stage_ref: 'agent-skeleton-build';
    files: StageDecompositionFilePlan[];
  };
};

export type StageDecompositionCloseoutPacket = JsonObject & {
  surface_kind: 'stage_attempt_closeout_packet';
  stage_id: 'stage-decomposition';
  closeout_refs: string[];
  stage_decomposition_pack_draft: StageDecompositionPackDraft;
};

export type AgentSkeletonBuildCloseoutPacket = JsonObject & {
  surface_kind: 'stage_attempt_closeout_packet';
  stage_id: 'agent-skeleton-build';
  closeout_refs: string[];
  materialized_files: AgentSkeletonBuildFile[];
};

export type FixtureStageSpec = {
  targetAgent: TargetAgent;
  stageId?: string;
  actionId?: string;
  title?: string;
  summary?: string;
  promptPath?: string;
  stagePath?: string;
  skillPath?: string;
  knowledgePath?: string;
  qualityGatePath?: string;
};

export function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`stage-decomposition pack draft missing ${field}.`);
  }
  return value.trim();
}

export function asRecord(value: unknown, field: string): JsonObject {
  if (!isRecord(value)) {
    throw new Error(`stage-decomposition pack draft ${field} must be a JSON object.`);
  }
  return value;
}

export function asRecordArray(value: unknown, field: string): JsonObject[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRecord)) {
    throw new Error(`stage-decomposition pack draft ${field} must be a non-empty object array.`);
  }
  return value;
}

export function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.trim())) {
    throw new Error(`stage-decomposition pack draft ${field} must be a string array.`);
  }
  return value.map((entry) => entry.trim());
}

export function normalizedStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return asStringArray(value, field);
}

export function assertMatchingStringArray(actual: unknown, expected: unknown, field: string): void {
  const actualList = normalizedStringArray(actual, `stage_decomposition_pack_draft.${field}`);
  const expectedList = normalizedStringArray(expected, `requested_target_agent.${field}`);
  if (JSON.stringify(actualList) !== JSON.stringify(expectedList)) {
    throw new Error(`stage-decomposition pack draft ${field} does not match requested target.`);
  }
}

export function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function domainLabelFor(targetAgent: TargetAgent): string {
  return targetAgent.domain_label?.trim() || targetAgent.domain_id;
}

export function targetBriefFor(targetAgent: TargetAgent): string {
  return targetAgent.target_brief?.trim()
    || `Create an owner-gated ${domainLabelFor(targetAgent)} delivery from declared workspace refs.`;
}

export function snakeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

export function commandPrefix(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

export function ref(refKind: string, refValue: string) {
  return {
    ref_kind: refKind,
    ref: refValue,
  };
}

export function stageNativeRefsFor(domainId: string, stageId: string) {
  return {
    artifactNativeContractRef: `artifact-native-contract-ref:${domainId}/${stageId}`,
    stageFolderContractRef: `stage-folder-contract-ref:${domainId}/${stageId}`,
    stageJsonRef: `stage-json-ref:${domainId}/${stageId}`,
    attemptJsonRef: `stage-attempt-json-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    manifestRef: `stage-manifest-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    receiptRef: `stage-attempt-receipt-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    blockerRef: `stage-typed-blocker-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    currentPointerRef: `stage-current-pointer-ref:${domainId}/${stageId}`,
    canonicalArtifactRef: `canonical-artifact-ref:${domainId}/${stageId}`,
    exportRef: `stage-export-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    lineageRef: `stage-lineage-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    retentionRef: `stage-retention-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    physicalKernelLocatorRef: `opl-physical-kernel-locator-ref:${domainId}/${stageId}`,
    conformanceRef: `stage-artifact-conformance-ref:${domainId}/${stageId}`,
    workbenchConsumptionRef: `stage-artifact-workbench-consumption-ref:${domainId}/${stageId}`,
  };
}

export function validateRelativeMarkdownPath(filePath: unknown, field: string): string {
  const relPath = asString(filePath, field);
  if (path.isAbsolute(relPath) || relPath.includes('..') || !relPath.endsWith('.md')) {
    throw new Error(`stage-decomposition pack draft ${field} must be a relative markdown path.`);
  }
  if (!relPath.startsWith('agent/')) {
    throw new Error(`stage-decomposition pack draft ${field} must live under agent/.`);
  }
  return relPath;
}

export function validateMaterializationPath(filePath: unknown, field: string): string {
  const relPath = asString(filePath, field);
  if (path.isAbsolute(relPath) || relPath.includes('..')) {
    throw new Error(`stage-decomposition pack draft ${field} must be a relative path.`);
  }
  if (
    (relPath.startsWith('agent/') && relPath.endsWith('.md'))
    || (relPath.startsWith('contracts/schemas/') && relPath.endsWith('.schema.json'))
  ) {
    return relPath;
  }
  throw new Error(`stage-decomposition pack draft ${field} must be an agent markdown or action schema path.`);
}

export function validateBody(body: unknown, relPath: string): string {
  const text = asString(body, `${relPath}.body`);
  if (placeholderPattern.test(text)) {
    throw new Error(`stage-decomposition pack draft file contains placeholder marker: ${relPath}`);
  }
  return text;
}

export function filesByPath(files: unknown): Map<string, string> {
  const entries = asRecordArray(files, 'files');
  const byPath = new Map<string, string>();
  for (const entry of entries) {
    const relPath = validateMaterializationPath(entry.path, 'files[].path');
    if (byPath.has(relPath)) {
      throw new Error(`stage-decomposition pack draft file path is duplicated: ${relPath}`);
    }
    byPath.set(relPath, validateBody(entry.body, relPath));
  }
  return byPath;
}

export function filePlansByPath(plan: unknown): Map<string, StageDecompositionFilePlan> {
  const value = asRecord(plan, 'file_materialization_plan');
  if (value.surface_kind !== 'opl_meta_agent_file_materialization_plan') {
    throw new Error('stage-decomposition pack draft file_materialization_plan.surface_kind is invalid.');
  }
  if (value.version !== 'opl-meta-agent.file-materialization-plan.v1') {
    throw new Error('stage-decomposition pack draft file_materialization_plan.version is invalid.');
  }
  if (value.materialization_stage_ref !== 'agent-skeleton-build') {
    throw new Error('stage-decomposition pack draft file materialization belongs to agent-skeleton-build.');
  }
  const entries = asRecordArray(value.files, 'file_materialization_plan.files');
  const byPath = new Map<string, StageDecompositionFilePlan>();
  for (const entry of entries) {
    const relPath = validateMaterializationPath(entry.path, 'file_materialization_plan.files[].path');
    if (Object.hasOwn(entry, 'body')) {
      throw new Error(`stage-decomposition file plan must not contain file body: ${relPath}`);
    }
    if (byPath.has(relPath)) {
      throw new Error(`stage-decomposition file materialization path is duplicated: ${relPath}`);
    }
    if (entry.materialization_stage_ref !== 'agent-skeleton-build') {
      throw new Error(`stage-decomposition file body owner must be agent-skeleton-build: ${relPath}`);
    }
    const bodyRequirementRefs = asStringArray(
      entry.body_requirement_refs,
      `file_materialization_plan.files[${relPath}].body_requirement_refs`,
    );
    if (bodyRequirementRefs.length === 0) {
      throw new Error(`stage-decomposition file materialization plan requires body refs: ${relPath}`);
    }
    byPath.set(relPath, {
      path: relPath,
      materialization_stage_ref: 'agent-skeleton-build',
      body_requirement_refs: bodyRequirementRefs,
    });
  }
  return byPath;
}

export function assertBooleanFalse(record: JsonObject, field: string, label = field): void {
  if (record[field] !== false) {
    throw new Error(`stage-decomposition pack draft ${label} must be false.`);
  }
}

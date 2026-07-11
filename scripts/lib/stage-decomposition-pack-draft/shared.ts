import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import {
  FOUNDRY_AGENT_SERIES_CONTRACT_REF,
  STANDARD_DOMAIN_AGENT_SKELETON_CONTRACT_REF,
  canonicalFoundryAgentSeriesPolicy,
} from 'opl-framework/foundry-agent-series-policy';
import type { JsonObject } from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';

const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

function stringList(policy: JsonObject, field: string): string[] {
  const value = policy[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`Standard Foundry policy ${field} must be a non-empty string array.`);
  }
  return value.map((entry) => entry.trim());
}

function objectField(policy: JsonObject, field: string): JsonObject {
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

function readStandardFoundryPolicyConsumer(): JsonObject {
  const policy = JSON.parse(
    fs.readFileSync(new URL('../../../contracts/standard_foundry_policies.json', import.meta.url), 'utf8'),
  ) as JsonObject;
  if (policy.surface_kind !== 'standard_foundry_policy_consumer') {
    throw new Error('Standard Foundry policy consumer has an unexpected surface_kind.');
  }
  if (policy.canonical_policy_export !== 'opl-framework/foundry-agent-series-policy') {
    throw new Error('Standard Foundry policy consumer must use the canonical OPL public export.');
  }
  if (policy.canonical_series_contract_ref !== FOUNDRY_AGENT_SERIES_CONTRACT_REF) {
    throw new Error('Standard Foundry policy consumer series contract ref drifted from OPL.');
  }
  if (policy.canonical_skeleton_contract_ref !== STANDARD_DOMAIN_AGENT_SKELETON_CONTRACT_REF) {
    throw new Error('Standard Foundry policy consumer skeleton contract ref drifted from OPL.');
  }
  return policy;
}

const POLICY_CONSUMER = readStandardFoundryPolicyConsumer();
const CANONICAL_POLICY = canonicalFoundryAgentSeriesPolicy() as JsonObject;
const DOMAIN_POLICY_DELTA = objectField(POLICY_CONSUMER, 'domain_policy_delta');

function withAuthorityDelta(policyField: string): JsonObject {
  const canonical = objectField(CANONICAL_POLICY, policyField);
  const delta = objectField(DOMAIN_POLICY_DELTA, policyField);
  return {
    ...canonical,
    authority_boundary: {
      ...objectField(canonical, 'authority_boundary'),
      ...objectField(delta, 'authority_boundary'),
    },
  };
}

export const FORBIDDEN_GENERIC_OWNER_ROLES = stringList(CANONICAL_POLICY, 'forbidden_generic_owner_roles');

const STAGE_PACK_DEFAULTS = objectField(CANONICAL_POLICY, 'stage_pack_defaults');

export const STANDARD_STAGE_PACK_CONFORMANCE_VERSION = objectStringField(
  STAGE_PACK_DEFAULTS,
  'stage_pack_conformance_version',
);

export const DEFAULT_STAGE_EXECUTOR_BINDING_REF = objectStringField(
  STAGE_PACK_DEFAULTS,
  'default_stage_executor_binding_ref',
);

export const SHARED_POLICY_RELEASE = objectField(POLICY_CONSUMER, 'shared_policy_release');
if (!isDeepStrictEqual(SHARED_POLICY_RELEASE, objectField(CANONICAL_POLICY, 'shared_policy_release'))) {
  throw new Error('Standard Foundry policy consumer release pin drifted from OPL.');
}

export const USER_STAGE_LOG_REQUIRED_FIELDS = stringList(CANONICAL_POLICY, 'user_stage_log_required_fields');

export const USER_STAGE_LOG_CONTRACT = objectField(CANONICAL_POLICY, 'user_stage_log_contract');

export const STAGE_PROGRESS_DELTA_POLICY = withAuthorityDelta('stage_progress_delta_policy');

export const TYPED_BLOCKER_LINEAGE_POLICY = withAuthorityDelta('typed_blocker_lineage_policy');

export const STAGE_COMPLETION_POLICY = objectField(CANONICAL_POLICY, 'stage_completion_policy');

const CANONICAL_SERIES_DESIGN_PROFILE = objectField(CANONICAL_POLICY, 'series_design_profile');
const SERIES_DESIGN_DELTA = objectField(DOMAIN_POLICY_DELTA, 'series_design_profile');
export const SERIES_DESIGN_PROFILE = {
  ...CANONICAL_SERIES_DESIGN_PROFILE,
  stage_pack_sections: [...new Set([
    ...stringList(CANONICAL_SERIES_DESIGN_PROFILE, 'stage_pack_sections'),
    ...stringList(SERIES_DESIGN_DELTA, 'stage_pack_section_additions'),
  ])],
  artifact_morphology_policy: objectField(SERIES_DESIGN_DELTA, 'artifact_morphology_policy'),
};

export const AGENT_MEMBERSHIP_PROJECTION_POLICY = objectField(CANONICAL_POLICY, 'agent_membership_projection_policy');

export const STANDARD_PUBLIC_PROJECTION_POLICY = objectField(CANONICAL_POLICY, 'standard_public_projection_policy');

export const WORKSPACE_TOPOLOGY_PROFILE = objectField(CANONICAL_POLICY, 'workspace_topology_profile');

export const CANONICAL_FOUNDRY_POLICY_REFS = {
  canonical_policy_export: POLICY_CONSUMER.canonical_policy_export,
  canonical_series_contract_ref: FOUNDRY_AGENT_SERIES_CONTRACT_REF,
  canonical_skeleton_contract_ref: STANDARD_DOMAIN_AGENT_SKELETON_CONTRACT_REF,
};

export const DOMAIN_FOUNDRY_POLICY_DELTA = DOMAIN_POLICY_DELTA;

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

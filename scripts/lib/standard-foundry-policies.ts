import fs from 'node:fs';
import type { JsonObject } from './domain-pack.ts';

export const STANDARD_FOUNDRY_POLICIES_CONTRACT_REF = 'contracts/standard_foundry_policies.json';

type StandardFoundryPolicies = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

function arraysMatch(left: unknown, right: string[]): boolean {
  return Array.isArray(left)
    && left.length === right.length
    && left.every((entry, index) => entry === right[index]);
}

function readStandardFoundryPolicies(): StandardFoundryPolicies {
  const policy = JSON.parse(
    fs.readFileSync(new URL('../../contracts/standard_foundry_policies.json', import.meta.url), 'utf8'),
  ) as StandardFoundryPolicies;
  if (policy.surface_kind !== 'standard_foundry_policies') {
    throw new Error('Standard Foundry policies contract has an unexpected surface_kind.');
  }
  if (policy.script_projection_ref !== 'scripts/lib/standard-foundry-policies.ts') {
    throw new Error('Standard Foundry policies contract must name its script projection ref.');
  }
  const requiredFields = stringList(policy, 'user_stage_log_required_fields');
  const userStageLogContract = objectField(policy, 'user_stage_log_contract');
  if (!arraysMatch(userStageLogContract.required_domain_semantic_fields, requiredFields)) {
    throw new Error('Standard Foundry policies contract stage-log fields drifted from required fields.');
  }
  return policy;
}

export const STANDARD_FOUNDRY_POLICIES = readStandardFoundryPolicies();

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

export const SERIES_DESIGN_PROFILE = objectField(
  STANDARD_FOUNDRY_POLICIES,
  'series_design_profile',
);

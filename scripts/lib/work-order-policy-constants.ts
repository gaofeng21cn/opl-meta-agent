import fs from 'node:fs';

export const DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF = 'contracts/developer_work_order_policy.json';

type DeveloperWorkOrderPolicy = Record<string, unknown>;

function stringList(policy: DeveloperWorkOrderPolicy, field: string): string[] {
  const value = policy[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`Developer work-order policy ${field} must be a non-empty string array.`);
  }
  return value.map((entry) => entry.trim());
}

function readDeveloperWorkOrderPolicy(): DeveloperWorkOrderPolicy {
  const policy = JSON.parse(
    fs.readFileSync(new URL('../../contracts/developer_work_order_policy.json', import.meta.url), 'utf8'),
  ) as DeveloperWorkOrderPolicy;
  if (policy.surface_kind !== 'developer_work_order_policy') {
    throw new Error('Developer work-order policy contract has an unexpected surface_kind.');
  }
  if (policy.script_projection_ref !== 'scripts/lib/work-order-policy-constants.ts') {
    throw new Error('Developer work-order policy contract must name its script projection ref.');
  }
  return policy;
}

export const DEVELOPER_WORK_ORDER_POLICY = readDeveloperWorkOrderPolicy();

export const DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_forbidden_target_paths_or_surfaces',
);

export const DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_runtime_required_surface_refs',
);

export const DEFAULT_RUNTIME_EXPECTED_OUTCOMES = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_runtime_expected_outcomes',
);

export const DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_target_workspace_required_surface_refs',
);

export const DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_target_workspace_expected_outcomes',
);

export const DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_no_patch_closeout_evidence',
);

export const DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE = stringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_source_patch_closeout_evidence',
);

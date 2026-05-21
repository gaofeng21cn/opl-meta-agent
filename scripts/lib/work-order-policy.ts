import type { JsonObject } from './domain-pack.ts';

export const DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES = [
  'target domain truth surfaces',
  'target domain memory body',
  'target domain artifact body',
  'target quality verdict bodies',
  'submission readiness verdicts',
  'export verdict bodies',
];

export const DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS = [
  'target_agent_descriptor',
  'target_agent_owner_route',
  'target_agent_owner_receipt_contract',
  'target_agent_quality_gate_projection',
  'default_executor_dispatch_execution',
  'target_agent_status_or_progress_projection',
];

export const DEFAULT_RUNTIME_EXPECTED_OUTCOMES = [
  'patched quality contract, owner route, or owner receipt contract is visible in target runtime/read-model projection',
  'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
  'no forbidden target domain truth, artifact, memory, quality verdict, or submission readiness surface is written by opl-meta-agent',
];

export const DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS = [
  'target_workspace_pyproject_or_lock',
  'target_workspace_profile_or_config_env',
  'study_runtime_analysis_bundle',
  'target_owner_entry_redrive_report',
  'target_repo_hygiene_status',
];

export const DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES = [
  'target workspace dependency lock/profile includes required runtime extras before owner redrive',
  'owner runtime entry uses the target workspace interpreter rather than target repo checkout .venv',
  'owner redrive reports the analysis/runtime bundle as ready under the target workspace interpreter',
  'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
];

export const DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE = [
  'target owner receipt projection consumed Agent Lab suite result',
  'target owner receipt projection consumed opl-meta-agent coordination result',
  'no target source patch was requested',
  'no target domain truth, memory body, artifact body, quality verdict, or export verdict was written',
];

export const DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE = [
  'patch_traceability_matrix addressed',
  'target agent tests passed',
  'target runtime/read-model consumed patched capability',
  'target workspace dependency lock/profile migrated when runtime extras are required',
  'target owner entry redrive consumed the migrated workspace environment',
  'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
  'developer patch receipt recorded',
  'target agent status or decision docs updated',
  'temporary worktree cleaned after absorb',
];

export function buildTargetPatchLoopMachineRefs({
  domainId,
  suiteResultRef,
  workOrderId,
  requiredVerificationRefs,
  noForbiddenWriteProofRefs,
  patchMode,
}: {
  domainId: string;
  suiteResultRef: string;
  workOrderId: string;
  requiredVerificationRefs: string[];
  noForbiddenWriteProofRefs: string[];
  patchMode?: string;
}): JsonObject {
  const modeSuffix = patchMode ? `/${patchMode}` : '';
  return {
    blocked_suite_result_ref: suiteResultRef,
    developer_patch_work_order_ref: workOrderId,
    patch_traceability_matrix_ref: `${workOrderId}#/patch_traceability_matrix`,
    target_repo_verification_refs: requiredVerificationRefs,
    target_runtime_read_model_consumption_ref:
      `target-runtime-read-model-consumption:${domainId}/${workOrderId}${modeSuffix}`,
    workspace_environment_proof_ref:
      `workspace-environment-proof:${domainId}/${workOrderId}${modeSuffix}`,
    no_forbidden_write_proof_ref: noForbiddenWriteProofRefs[0]
      ?? `no-forbidden-write:${domainId}/${workOrderId}`,
    target_owner_receipt_or_typed_blocker_ref:
      `target-owner-receipt-or-typed-blocker:${domainId}/${workOrderId}`,
    patch_absorption_ref: `patch-absorption:${domainId}/${workOrderId}${modeSuffix}`,
    worktree_cleanup_ref: `worktree-cleanup:${domainId}/${workOrderId}${modeSuffix}`,
    agent_lab_re_evaluation_ref:
      `agent-lab-re-evaluation:${domainId}/${suiteResultRef}/${workOrderId}`,
  };
}

export function buildRuntimeConsumptionVerification({
  requiredSurfaceRefs,
  expectedOutcomes,
}: {
  requiredSurfaceRefs?: string[];
  expectedOutcomes?: string[];
} = {}): JsonObject {
  return {
    verification_mode: 'read_only_target_domain_runtime_projection',
    required_surface_refs: requiredSurfaceRefs?.length
      ? requiredSurfaceRefs
      : DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
    expected_outcomes: expectedOutcomes?.length
      ? expectedOutcomes
      : DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
    can_write_target_domain_truth: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
}

export function buildTargetWorkspaceEnvironmentVerification(): JsonObject {
  return {
    verification_mode: 'read_only_target_workspace_environment_and_owner_entry_redrive',
    required_surface_refs: DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS,
    expected_outcomes: DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES,
    can_write_target_domain_truth: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
}

export function targetPatchLoopCloseoutEvidence({
  sourcePatchRequired,
}: {
  sourcePatchRequired: boolean;
}): string[] {
  return sourcePatchRequired
    ? DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE
    : DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE;
}

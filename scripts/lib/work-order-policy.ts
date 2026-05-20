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

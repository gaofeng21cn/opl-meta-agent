import type { JsonObject } from './domain-pack.ts';
import {
  stableId,
} from './meta-agent-loop-io.ts';
import {
  stringList,
  targetOwnerRoute,
  verificationRefs,
} from './work-order-refs.ts';
import type { AgentContracts } from './agent-evidence-materializer.ts';

export function buildTypedBlocker({
  contracts,
  suite,
  suiteResult,
  workOrder,
  status = 'blocked_missing_ai_reviewer_evaluation',
  blockedReason = 'independent_ai_reviewer_attempt_required_before_mechanism_patch_proposal_or_delivery_receipt',
  missingRequiredFields = [],
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  workOrder: JsonObject;
  status?: string;
  blockedReason?: string;
  missingRequiredFields?: string[];
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_agent_evidence_takeover_typed_blocker',
    version: 'opl-meta-agent.agent-evidence-takeover-typed-blocker.v1',
    blocker_id: stableId('oma_agent_evidence_blocker', [suite.suite_id, suiteResult.result_id, workOrder.work_order_id]),
    status,
    blocked_reason: blockedReason,
    repeat_budget: {
      max_attempts: 2,
      remaining_attempts: 0,
      repeat_scope: 'same_target_eval_work_order_owner_route_tuple',
    },
    dead_letter_refs: [
      `dead-letter:opl-meta-agent/${String(workOrder.target_agent?.domain_id ?? 'target-agent')}/${workOrder.work_order_id}`,
    ],
    escalation_refs: [
      ...stringList(workOrder.owner_route_refs),
      String(workOrder.work_order_completeness?.fail_closed_blocker_ref),
    ],
    next_allowed_action: 'supply_missing_refs_or_escalate_to_target_owner',
    next_owner: 'opl-meta-agent',
    target_owner_route: targetOwnerRoute(contracts),
    blocked_suite_result_ref: workOrder.source_agent_lab_result_ref,
    work_order_ref: workOrder.work_order_id,
    stage_native_artifact_refs: workOrder.stage_native_artifact_refs,
    artifact_native_contract_ref: workOrder.artifact_native_contract_ref,
    stage_folder_contract: workOrder.stage_folder_contract,
    required_input_refs: ['--ai-reviewer-evaluation <json>'],
    required_source_refs: [
      contracts.productionAcceptanceRef,
      'contracts/agent_lab_handoff.json',
      'contracts/generated_surface_handoff.json',
      'contracts/owner_receipt_contract.json',
    ],
    required_verification_refs: workOrder.required_verification_refs,
    missing_required_fields: missingRequiredFields,
    rollback_version_refs: workOrder.rollback_version_refs,
    owner_route_refs: workOrder.owner_route_refs,
    ahe_developer_work_order: workOrder.ahe_developer_work_order,
    machine_closeout_refs: workOrder.machine_closeout_refs,
    required_opl_work_order_primitive_refs: workOrder.required_opl_work_order_primitive_refs,
    required_ai_reviewer_independence_fields: [
      'no_shared_context=true',
      'independent_attempt=true',
      'direct_evidence_refs[]',
      'execution_attempt_ref',
      'review_attempt_ref',
      'execution_attempt_ref != review_attempt_ref',
    ],
    no_forbidden_write: workOrder.no_forbidden_write,
    no_forbidden_write_proof: workOrder.no_forbidden_write,
    ...(workOrder.efficiency_non_regression_refs
      ? { efficiency_non_regression_refs: workOrder.efficiency_non_regression_refs }
      : {}),
    work_order_completeness: workOrder.work_order_completeness,
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    authority_boundary: {
      typed_blocker_only: true,
      no_delivery_receipt_signed: true,
      no_executable_work_order_issued: true,
      can_generate_target_domain_owner_receipt: false,
      can_write_stage_folder_runtime_state: false,
      can_write_target_domain_truth: false,
      can_authorize_target_quality_or_export: false,
      can_mutate_target_artifact_body: false,
      can_write_target_memory_body: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

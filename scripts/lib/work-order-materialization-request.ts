import type { JsonObject } from './domain-pack.ts';

export type WorkOrderMaterializationRequestKind =
  | 'developer_patch'
  | 'foundry_evaluation';

export type WorkOrderMaterializationTargetAgent = {
  domain_id: string;
  repo_dir: string;
  target_agent_ref?: string | null;
  descriptor_ref?: string | null;
};

export const OPL_WORK_ORDER_MATERIALIZATION_REQUEST_SURFACE_KIND =
  'opl_work_order_materialization_request';
export const OPL_WORK_ORDER_MATERIALIZATION_REQUEST_VERSION =
  'opl-work-order-materialization-request.v2';
export const OPL_WORK_ORDER_MATERIALIZATION_REQUEST_SCHEMA_REF =
  'contracts/opl-framework/work-order-materialization-request.schema.json';
export const OPL_WORK_ORDER_EXECUTION_OWNER = 'one-person-lab/OPL Foundry Lab';

const FOUNDRY_EVALUATION_SEMANTIC_FIELDS = new Set([
  'request_id',
  'suite_id',
  'suite_kind',
  'task_intents',
  'source_refs',
  'reviewer_refs',
  'candidate_refs',
  'production_evidence_gate_ids',
]);

const DEVELOPER_PATCH_SEMANTIC_FIELDS = new Set([
  'request_id',
  'source_agent_lab_result_ref',
  'foundry_lab_execution_receipt_ref',
  'agent_building_judgment',
  'source_refs',
  'reviewer_refs',
  'candidate_refs',
]);

const DEVELOPER_PATCH_JUDGMENT_FIELDS = new Set([
  'target_capability_improvement_candidate_ref',
  'root_cause',
  'targeted_fix',
  'predicted_impact',
  'failure_class',
  'source_morphology_proof_ref',
  'private_residue_decision_ref',
  'target_runtime_read_model_consumption_ref',
  'failure_evidence_refs',
  'target_editable_surface_refs',
  'forbidden_surfaces',
  'expected_behavior_delta',
  'verification_refs',
  'reviewer_refs',
  'owner_route_refs',
  'no_forbidden_write_proof_refs',
  'patch_traceability_refs',
  'efficiency_non_regression_refs',
]);

const DEVELOPER_PATCH_FAILURE_CLASSES = new Set([
  'stage-route',
  'specialist-skill',
  'tool-connector',
  'quality-gate',
  'read-model-currentness',
  'authority-boundary',
  'app-observability',
]);

const EFFICIENCY_NON_REGRESSION_FIELDS = new Set([
  'quality_floor_refs',
  'latency_baseline_refs',
  'usage_cost_refs',
  'cache_reuse_refs',
  'target_verification_refs',
]);

const FORBIDDEN_SEMANTIC_FIELD = /(^|_)(?:work_order|lease|worktree|lifecycle|closeout|version)(?:_|$)/;

function objectValue(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`OPL work-order materialization request requires ${field} as an object.`);
  }
  return value as JsonObject;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`OPL work-order materialization request requires ${field}.`);
  }
  return value.trim();
}

function stringList(value: unknown, field: string, minimum = 0): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`OPL work-order materialization request requires ${field} as an array.`);
  }
  const normalized = value.map((entry, index) => requiredString(entry, `${field}[${index}]`));
  if (normalized.length < minimum) {
    throw new Error(`OPL work-order materialization request requires ${field} to contain at least ${minimum} item(s).`);
  }
  return [...new Set(normalized)];
}

function assertOnlyFields(value: JsonObject, allowed: Set<string>, field: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`OPL work-order materialization request does not allow ${field}.${key}.`);
    }
  }
}

function assertNoPrivateControlPlane(value: unknown, field: string): void {
  if (typeof value === 'string') {
    if (value.startsWith('opl_meta_agent_foundry_')) {
      throw new Error(`OPL work-order materialization request rejects retired Foundry ABI at ${field}.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoPrivateControlPlane(entry, `${field}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  for (const [key, nested] of Object.entries(value as JsonObject)) {
    if (
      key.startsWith('oma_can_')
      || key === 'omaSemanticEnvelope'
      || FORBIDDEN_SEMANTIC_FIELD.test(key)
      || key === 'surface_kind'
      || key === 'version'
      || key === 'authority_boundary'
    ) {
      throw new Error(`OPL work-order materialization request rejects Framework-owned field ${field}.${key}.`);
    }
    assertNoPrivateControlPlane(nested, `${field}.${key}`);
  }
}

function normalizeTargetAgent(
  targetAgent: WorkOrderMaterializationTargetAgent,
  requestKind: WorkOrderMaterializationRequestKind,
): WorkOrderMaterializationTargetAgent {
  const targetAgentRef = targetAgent.target_agent_ref
    ? requiredString(targetAgent.target_agent_ref, 'target_agent.target_agent_ref')
    : null;
  const descriptorRef = targetAgent.descriptor_ref
    ? requiredString(targetAgent.descriptor_ref, 'target_agent.descriptor_ref')
    : null;
  if (requestKind === 'foundry_evaluation' && (!targetAgentRef || !descriptorRef)) {
    throw new Error(
      'OPL work-order materialization request requires foundry_evaluation target_agent.target_agent_ref and target_agent.descriptor_ref.',
    );
  }
  return {
    domain_id: requiredString(targetAgent.domain_id, 'target_agent.domain_id'),
    repo_dir: requiredString(targetAgent.repo_dir, 'target_agent.repo_dir'),
    ...(targetAgentRef ? { target_agent_ref: targetAgentRef } : {}),
    ...(descriptorRef ? { descriptor_ref: descriptorRef } : {}),
  };
}

function validateFoundryEvaluationSemanticRequest(semanticRequest: JsonObject): JsonObject {
  assertOnlyFields(
    semanticRequest,
    FOUNDRY_EVALUATION_SEMANTIC_FIELDS,
    'semantic_request',
  );
  const suiteKind = requiredString(semanticRequest.suite_kind, 'semantic_request.suite_kind');
  if (!['agent_lab_external_suite', 'agent_production_evidence_suite'].includes(suiteKind)) {
    throw new Error('OPL work-order materialization request has an unsupported foundry evaluation suite_kind.');
  }
  if (!Array.isArray(semanticRequest.task_intents) || semanticRequest.task_intents.length === 0) {
    throw new Error('OPL work-order materialization request requires semantic_request.task_intents.');
  }
  const taskIds = semanticRequest.task_intents.map((task, index) =>
    requiredString(
      objectValue(task, `semantic_request.task_intents[${index}]`).task_id,
      `semantic_request.task_intents[${index}].task_id`,
    )
  );
  if (new Set(taskIds).size !== taskIds.length) {
    throw new Error('OPL work-order materialization request requires unique task_intents[].task_id values.');
  }
  return {
    request_id: requiredString(semanticRequest.request_id, 'semantic_request.request_id'),
    suite_id: requiredString(semanticRequest.suite_id, 'semantic_request.suite_id'),
    suite_kind: suiteKind,
    task_intents: semanticRequest.task_intents,
    source_refs: stringList(semanticRequest.source_refs, 'semantic_request.source_refs'),
    reviewer_refs: stringList(semanticRequest.reviewer_refs, 'semantic_request.reviewer_refs'),
    candidate_refs: stringList(semanticRequest.candidate_refs, 'semantic_request.candidate_refs'),
    ...(semanticRequest.production_evidence_gate_ids
      ? {
          production_evidence_gate_ids: stringList(
            semanticRequest.production_evidence_gate_ids,
            'semantic_request.production_evidence_gate_ids',
            1,
          ),
        }
      : {}),
  };
}

function validateDeveloperPatchSemanticRequest(semanticRequest: JsonObject): JsonObject {
  assertOnlyFields(
    semanticRequest,
    DEVELOPER_PATCH_SEMANTIC_FIELDS,
    'semantic_request',
  );
  const judgment = objectValue(
    semanticRequest.agent_building_judgment,
    'semantic_request.agent_building_judgment',
  );
  assertOnlyFields(
    judgment,
    DEVELOPER_PATCH_JUDGMENT_FIELDS,
    'semantic_request.agent_building_judgment',
  );
  const failureClass = requiredString(
    judgment.failure_class,
    'semantic_request.agent_building_judgment.failure_class',
  );
  if (!DEVELOPER_PATCH_FAILURE_CLASSES.has(failureClass)) {
    throw new Error('OPL work-order materialization request has an unsupported developer patch failure_class.');
  }
  const normalizedJudgment: JsonObject = {
    target_capability_improvement_candidate_ref: requiredString(
      judgment.target_capability_improvement_candidate_ref,
      'semantic_request.agent_building_judgment.target_capability_improvement_candidate_ref',
    ),
    root_cause: requiredString(
      judgment.root_cause,
      'semantic_request.agent_building_judgment.root_cause',
    ),
    targeted_fix: stringList(
      judgment.targeted_fix,
      'semantic_request.agent_building_judgment.targeted_fix',
      1,
    ),
    predicted_impact: requiredString(
      judgment.predicted_impact,
      'semantic_request.agent_building_judgment.predicted_impact',
    ),
    failure_class: failureClass,
    source_morphology_proof_ref: requiredString(
      judgment.source_morphology_proof_ref,
      'semantic_request.agent_building_judgment.source_morphology_proof_ref',
    ),
    private_residue_decision_ref: requiredString(
      judgment.private_residue_decision_ref,
      'semantic_request.agent_building_judgment.private_residue_decision_ref',
    ),
    target_runtime_read_model_consumption_ref: requiredString(
      judgment.target_runtime_read_model_consumption_ref,
      'semantic_request.agent_building_judgment.target_runtime_read_model_consumption_ref',
    ),
    failure_evidence_refs: stringList(
      judgment.failure_evidence_refs,
      'semantic_request.agent_building_judgment.failure_evidence_refs',
      1,
    ),
    target_editable_surface_refs: stringList(
      judgment.target_editable_surface_refs,
      'semantic_request.agent_building_judgment.target_editable_surface_refs',
      1,
    ),
    forbidden_surfaces: stringList(
      judgment.forbidden_surfaces,
      'semantic_request.agent_building_judgment.forbidden_surfaces',
      1,
    ),
    expected_behavior_delta: requiredString(
      judgment.expected_behavior_delta,
      'semantic_request.agent_building_judgment.expected_behavior_delta',
    ),
    verification_refs: stringList(
      judgment.verification_refs,
      'semantic_request.agent_building_judgment.verification_refs',
      1,
    ),
    reviewer_refs: stringList(
      judgment.reviewer_refs,
      'semantic_request.agent_building_judgment.reviewer_refs',
      1,
    ),
    owner_route_refs: stringList(
      judgment.owner_route_refs,
      'semantic_request.agent_building_judgment.owner_route_refs',
      1,
    ),
    no_forbidden_write_proof_refs: stringList(
      judgment.no_forbidden_write_proof_refs,
      'semantic_request.agent_building_judgment.no_forbidden_write_proof_refs',
      1,
    ),
    patch_traceability_refs: stringList(
      judgment.patch_traceability_refs,
      'semantic_request.agent_building_judgment.patch_traceability_refs',
      1,
    ),
  };
  if (judgment.efficiency_non_regression_refs !== undefined) {
    const efficiencyRefs = objectValue(
      judgment.efficiency_non_regression_refs,
      'semantic_request.agent_building_judgment.efficiency_non_regression_refs',
    );
    assertOnlyFields(
      efficiencyRefs,
      EFFICIENCY_NON_REGRESSION_FIELDS,
      'semantic_request.agent_building_judgment.efficiency_non_regression_refs',
    );
    normalizedJudgment.efficiency_non_regression_refs = Object.fromEntries(
      Object.entries(efficiencyRefs).map(([field, value]) => [
        field,
        stringList(
          value,
          `semantic_request.agent_building_judgment.efficiency_non_regression_refs.${field}`,
        ),
      ]),
    );
  }
  return {
    request_id: requiredString(semanticRequest.request_id, 'semantic_request.request_id'),
    source_agent_lab_result_ref: requiredString(
      semanticRequest.source_agent_lab_result_ref,
      'semantic_request.source_agent_lab_result_ref',
    ),
    foundry_lab_execution_receipt_ref: requiredString(
      semanticRequest.foundry_lab_execution_receipt_ref,
      'semantic_request.foundry_lab_execution_receipt_ref',
    ),
    agent_building_judgment: normalizedJudgment,
    source_refs: stringList(semanticRequest.source_refs, 'semantic_request.source_refs', 1),
    reviewer_refs: stringList(semanticRequest.reviewer_refs, 'semantic_request.reviewer_refs', 1),
    candidate_refs: stringList(semanticRequest.candidate_refs, 'semantic_request.candidate_refs', 1),
  };
}

export function buildWorkOrderMaterializationRequest({
  requestKind,
  targetAgent,
  semanticRequest,
}: {
  requestKind: WorkOrderMaterializationRequestKind;
  targetAgent: WorkOrderMaterializationTargetAgent;
  semanticRequest: JsonObject;
}): JsonObject {
  if (requestKind !== 'developer_patch' && requestKind !== 'foundry_evaluation') {
    throw new Error('OPL work-order materialization request has an unsupported request_kind.');
  }
  assertNoPrivateControlPlane(semanticRequest, 'semantic_request');
  const normalizedSemanticRequest = requestKind === 'foundry_evaluation'
    ? validateFoundryEvaluationSemanticRequest(semanticRequest)
    : validateDeveloperPatchSemanticRequest(semanticRequest);

  return {
    surface_kind: OPL_WORK_ORDER_MATERIALIZATION_REQUEST_SURFACE_KIND,
    version: OPL_WORK_ORDER_MATERIALIZATION_REQUEST_VERSION,
    canonical_schema_ref: OPL_WORK_ORDER_MATERIALIZATION_REQUEST_SCHEMA_REF,
    request_kind: requestKind,
    request_owner: 'oma',
    producer_agent_id: 'oma',
    execution_owner: OPL_WORK_ORDER_EXECUTION_OWNER,
    target_agent: normalizeTargetAgent(targetAgent, requestKind),
    semantic_request: normalizedSemanticRequest,
    authority_boundary: {
      semantic_scope: 'agent_building_request_only',
      work_order_materialization_owner: OPL_WORK_ORDER_EXECUTION_OWNER,
      work_order_lifecycle_owner: OPL_WORK_ORDER_EXECUTION_OWNER,
      target_worktree_lifecycle_owner: OPL_WORK_ORDER_EXECUTION_OWNER,
      target_owner_closeout_owner: 'target-domain',
      producer_writes_framework_request_bundle: false,
      producer_assigns_work_order_id: false,
      producer_manages_executor_lease: false,
      producer_manages_target_worktree: false,
      producer_executes_work_order: false,
      producer_writes_work_order_receipt: false,
      producer_writes_target_owner_closeout: false,
    },
  };
}

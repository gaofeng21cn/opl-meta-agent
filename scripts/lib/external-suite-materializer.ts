import type { JsonObject } from './domain-pack.ts';
import {
  type TargetAgent,
  stableId,
} from './meta-agent-loop-io.ts';
import type {
  PatchTraceabilityEntry,
  TargetImprovementPolicy,
} from './target-improvement-policy.ts';
import {
  hasEfficiencyNonRegressionEvidence,
  type EfficiencyNonRegressionRefs,
} from './work-order-efficiency.ts';
import {
  buildWorkOrderMaterializationRequest,
} from './work-order-materialization-request.ts';

export type CapabilityCandidate = JsonObject & {
  candidate_id: string;
  target_agent: JsonObject;
  authority_boundary: JsonObject;
  target_editable_surface_refs: string[];
  proposed_change_refs: string[];
  patch_traceability_matrix: PatchTraceabilityEntry[];
  efficiency_non_regression_refs: EfficiencyNonRegressionRefs;
};

export type SuiteResult = JsonObject & {
  result_id: string;
  suite_id: string;
  status: string;
  evaluation_target_agent: {
    domain_id: string;
    target_agent_ref: string;
    descriptor_ref: string;
  };
  refs: JsonObject & {
    evaluation_provenance_refs: string[];
  };
  evaluation_provenance_bindings: JsonObject[];
  runs: JsonObject[];
  foundry_lab_execution_receipt_ref?: string;
};

function unique(values: unknown[]): string[] {
  return [...new Set(values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean))];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? unique(value) : [];
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export type DeveloperPatchMaterialization = {
  materializationRequest: JsonObject;
  agentBuildingEvidence: JsonObject;
};

export function buildDeveloperPatchMaterializationRequest({
  targetAgent,
  suite,
  suiteResult,
  foundryLabExecutionReceiptRef,
  capabilityCandidate,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  foundryLabExecutionReceiptRef: string;
  capabilityCandidate: CapabilityCandidate;
  policy: TargetImprovementPolicy;
}): DeveloperPatchMaterialization {
  const requestId = stableId('oma_developer_patch_request', {
    target_agent: targetAgent.domain_id,
    suite_id: suite.suite_id,
    suite_result_ref: suiteResult.result_id,
    candidate_ref: capabilityCandidate.candidate_id,
    foundry_lab_execution_receipt_ref: foundryLabExecutionReceiptRef,
  });
  const traceability = capabilityCandidate.patch_traceability_matrix;
  const rootCauses = unique(traceability.map((entry) => entry.root_cause));
  const targetedFix = unique([
    ...capabilityCandidate.proposed_change_refs,
    ...traceability.flatMap((entry) => entry.targeted_fix),
  ]);
  const failureEvidenceRefs = unique([
    ...strings(capabilityCandidate.failure_taxonomy_refs),
    ...strings(capabilityCandidate.ai_reviewer_evidence?.source_refs),
    ...strings(capabilityCandidate.ai_reviewer_evidence?.direct_evidence_refs),
    ...traceability.flatMap((entry) => entry.failure_evidence),
    ...traceability.flatMap((entry) => entry.source_failure_refs),
  ]);
  const verificationRefs = unique([
    ...traceability.flatMap((entry) => entry.required_verification_refs),
    ...traceability.flatMap((entry) => entry.capability_verification_refs),
    ...strings(capabilityCandidate.efficiency_non_regression_refs.target_verification_refs),
  ]);
  const reviewerRefs = unique([
    capabilityCandidate.ai_reviewer_evaluation_ref,
    ...strings(capabilityCandidate.ai_reviewer_evidence?.source_refs),
    ...strings(capabilityCandidate.ai_reviewer_evidence?.direct_evidence_refs),
  ]);
  const forbiddenSurfaces = unique([
    ...policy.forbiddenTargetPathsOrSurfaces,
    ...traceability.flatMap((entry) => entry.forbidden_target_paths_or_surfaces),
  ]);
  const ownerRouteRefs = [
    `target-agent-owner:${targetAgent.domain_id}`,
    `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
  ];
  const noForbiddenWriteProofRefs = [
    `no-forbidden-write:${targetAgent.domain_id}/${requestId}`,
  ];
  const patchTraceabilityRefs = traceability.map((entry, index) =>
    stableId('patch_traceability', {
      candidate_ref: capabilityCandidate.candidate_id,
      index,
      gap_token: entry.gap_token,
      required_patch_refs: entry.required_patch_refs,
    })
  );
  const sourceMorphologyProofRef = `source-morphology-proof:${targetAgent.domain_id}/${requestId}`;
  const privateResidueDecisionRef = `private-residue-decision:${targetAgent.domain_id}/${requestId}`;
  const targetRuntimeReadModelConsumptionRef =
    `target-runtime-read-model-consumption:${targetAgent.domain_id}/${requestId}`;
  const sourceRefs = unique([
    String(suite.suite_id ?? ''),
    suiteResult.result_id,
    suiteResult.evaluation_target_agent.target_agent_ref,
    suiteResult.evaluation_target_agent.descriptor_ref,
    ...suiteResult.refs.evaluation_provenance_refs,
    ...failureEvidenceRefs,
  ]);
  const expectedBehaviorDelta =
    'The target owner applies only evidence-traceable source changes, reruns target verification, and exposes the repaired behavior through the target runtime/read model without transferring domain authority to OMA.';

  const agentBuildingJudgment: JsonObject = {
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    root_cause: rootCauses.join(' ') ||
      'Agent Lab and independent reviewer evidence identify an owner-gated target-agent capability gap.',
    targeted_fix: targetedFix,
    predicted_impact: text(
      capabilityCandidate.ai_reviewer_review?.predicted_impact,
      'The target-owned patch closes the observed capability gap without moving authority to OMA.',
    ),
    failure_class: 'quality-gate',
    source_morphology_proof_ref: sourceMorphologyProofRef,
    private_residue_decision_ref: privateResidueDecisionRef,
    target_runtime_read_model_consumption_ref: targetRuntimeReadModelConsumptionRef,
    failure_evidence_refs: failureEvidenceRefs,
    target_editable_surface_refs: capabilityCandidate.target_editable_surface_refs,
    forbidden_surfaces: forbiddenSurfaces,
    expected_behavior_delta: expectedBehaviorDelta,
    verification_refs: verificationRefs,
    reviewer_refs: reviewerRefs,
    owner_route_refs: ownerRouteRefs,
    no_forbidden_write_proof_refs: noForbiddenWriteProofRefs,
    patch_traceability_refs: patchTraceabilityRefs,
    ...(hasEfficiencyNonRegressionEvidence(capabilityCandidate.efficiency_non_regression_refs)
      ? { efficiency_non_regression_refs: capabilityCandidate.efficiency_non_regression_refs }
      : {}),
  };

  const agentBuildingEvidence: JsonObject = {
    source_morphology_proof: {
      ref: sourceMorphologyProofRef,
      source_agent_lab_result_ref: suiteResult.result_id,
      target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
      input_surface_refs: sourceRefs,
      consumed_as_refs_only: true,
    },
    private_residue_decision: {
      ref: privateResidueDecisionRef,
      decision: 'refs_only_no_private_residue_promotion',
      source_morphology_proof_ref: sourceMorphologyProofRef,
      private_residue_body_materialized: false,
    },
    target_runtime_read_model_consumption: {
      ref: targetRuntimeReadModelConsumptionRef,
      required_surface_refs: policy.runtimeRequiredSurfaceRefs,
      expected_outcomes: policy.runtimeExpectedOutcomes,
      target_owner_verification_required: true,
    },
  };

  return {
    materializationRequest: buildWorkOrderMaterializationRequest({
      requestKind: 'developer_patch',
      targetAgent: {
        domain_id: targetAgent.domain_id,
        repo_dir: targetAgent.repo_dir ?? '',
        target_agent_ref: suiteResult.evaluation_target_agent.target_agent_ref,
        descriptor_ref: suiteResult.evaluation_target_agent.descriptor_ref,
      },
      semanticRequest: {
        request_id: requestId,
        source_agent_lab_result_ref: suiteResult.result_id,
        foundry_lab_execution_receipt_ref: foundryLabExecutionReceiptRef,
        agent_building_judgment: agentBuildingJudgment,
        source_refs: sourceRefs,
        reviewer_refs: reviewerRefs,
        candidate_refs: [capabilityCandidate.candidate_id],
      },
    }),
    agentBuildingEvidence,
  };
}

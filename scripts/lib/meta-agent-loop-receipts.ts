import type { JsonObject } from './domain-pack.ts';
import type { AiReviewerEvaluation } from './meta-agent-loop-ai-reviewer.ts';
import type { TargetAgent } from './meta-agent-loop-io.ts';
import { STAGE_COMPLETION_POLICY } from './stage-decomposition-pack-draft/shared.ts';

type AgentLabSuiteSeedOptions = {
  suiteId: string;
  taskId: string;
  taskFamily: string;
  targetAgent: TargetAgent;
  targetAgentDir: string;
  instructionsRef: string;
  agentEntryRef: string;
  stageRefs: string[];
  oracleRefs: string[];
  scorerRefs: string[];
  trajectoryRef: string;
  runRef: string;
  artifactRefs: string[];
  receiptRefs: string[];
  scorecardRef: string;
  metricRefs: string[];
  evidenceRefs: string[];
  reviewRefs: string[];
  qualityGateRefs: string[];
  improvementCandidateRef: string;
  improvementCandidateKind: string;
  improvementTargetRef: string;
  promotionGateRef: string;
  regressionSuiteRefs: string[];
  aiReviewerEvaluation?: AiReviewerEvaluation;
  aiReviewerEvaluationRef?: string;
};

function buildAgentLabStageCompletionPolicy(targetAgent: TargetAgent, taskFamily: string): JsonObject {
  return {
    ...STAGE_COMPLETION_POLICY,
    policy_ref: `stage-completion-policy:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`,
    stage_id: taskFamily,
    target_domain_id: targetAgent.domain_id,
  };
}

export function buildAgentLabSuiteSeed({
  suiteId,
  taskId,
  taskFamily,
  targetAgent,
  targetAgentDir,
  instructionsRef,
  agentEntryRef,
  stageRefs,
  oracleRefs,
  scorerRefs,
  trajectoryRef,
  runRef,
  artifactRefs,
  receiptRefs,
  scorecardRef,
  metricRefs,
  evidenceRefs,
  reviewRefs,
  qualityGateRefs,
  improvementCandidateRef,
  improvementCandidateKind,
  improvementTargetRef,
  promotionGateRef,
  regressionSuiteRefs,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
}: AgentLabSuiteSeedOptions): JsonObject {
  const reviewerEvidenceRefs = aiReviewerEvaluation && aiReviewerEvaluationRef
    ? [aiReviewerEvaluationRef, ...aiReviewerEvaluation.source_refs, ...aiReviewerEvaluation.direct_evidence_refs]
    : [];

  return {
    surface_kind: 'opl_meta_agent_agent_lab_suite_seed',
    version: 'opl-meta-agent.agent-lab-suite-seed.v1',
    suite_id: suiteId,
    suite_kind: 'agent_lab_external_suite',
    seed_status: 'declarative_seed_candidate_waiting_for_foundry_lab_consumer',
    execution_owner: 'one-person-lab/OPL Foundry Lab',
    authority_boundary: {
      oma_can_execute_suite: false,
      oma_can_write_suite_result: false,
      oma_can_write_owner_receipt_body: false,
      oma_can_write_promotion_gate: false,
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: taskId,
        domain_id: 'opl-meta-agent',
        task_family: taskFamily,
        target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
        target_agent_descriptor_ref: targetAgent.descriptor_ref,
        environment: {
          environment_kind: 'fixture',
          workspace_locator_ref: `workspace-locator:${targetAgentDir}`,
          sandbox_policy: 'fixture_only_no_artifact_mutation',
          network_policy: 'offline',
        },
        instructions_ref: instructionsRef,
        agent_entry_ref: agentEntryRef,
        stage_refs: stageRefs,
        stage_completion_policy: buildAgentLabStageCompletionPolicy(targetAgent, taskFamily),
        oracle_refs: oracleRefs,
        scorer_refs: scorerRefs,
        recovery_probe_specs: [
          {
            probe_ref: `recovery-probe:opl-meta-agent/${targetAgent.domain_id}/resume-after-interruption`,
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            source_refs: [`receipt-ref:opl-meta-agent/${targetAgent.domain_id}/resume-fixture`],
          },
          {
            probe_ref: `recovery-probe:opl-meta-agent/${targetAgent.domain_id}/retry-after-tool-failure`,
            probe_kind: 'retry_after_tool_failure',
            expected_status: 'passed',
            source_refs: [`receipt-ref:opl-meta-agent/${targetAgent.domain_id}/retry-fixture`],
          },
        ],
        trajectory_plan: {
          trajectory_ref: trajectoryRef,
          requested_run_ref: runRef,
          agent_executor: 'codex_cli',
          expected_stage_attempt_refs: [`stage-attempt:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`],
          tool_affordance_refs: ['opl-action:agent-lab/run'],
          expected_artifact_refs: artifactRefs,
          expected_receipt_refs: receiptRefs,
          trace_refs: [`trace-ref:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`],
        },
        scorecard_spec: {
          scorecard_ref: scorecardRef,
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          metric_refs: metricRefs,
          evidence_refs: [...evidenceRefs, ...reviewerEvidenceRefs],
          review_refs: [...reviewRefs, ...(aiReviewerEvaluationRef ? [aiReviewerEvaluationRef] : [])],
          quality_gate_refs: qualityGateRefs,
        },
        improvement_candidate_seed: {
          candidate_ref: improvementCandidateRef,
          candidate_kind: improvementCandidateKind,
          target_ref: improvementTargetRef,
          evidence_refs: [`failure-taxonomy:opl-meta-agent/${targetAgent.domain_id}/evaluation-pending`],
          allowed_change_scope: 'branch_only',
        },
        promotion_gate_request: {
          gate_ref: promotionGateRef,
          evaluation_owner: 'one-person-lab/OPL Foundry Lab',
          required_refs: [scorecardRef],
          regression_suite_refs: regressionSuiteRefs,
          no_forbidden_write_proof_refs: [`no-forbidden-write:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`],
        },
      },
    ],
    ...(aiReviewerEvaluationRef ? { ai_reviewer_evaluation_ref: aiReviewerEvaluationRef } : {}),
  };
}

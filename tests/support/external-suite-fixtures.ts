import path from 'node:path';
import { runImproveFromAgentLabSuite } from '../../scripts/improve-from-agent-lab-suite.ts';
import type { JsonObject } from '../../scripts/lib/domain-pack.ts';
import { readTargetAgent } from '../../scripts/lib/meta-agent-loop-io.ts';
import { buildAiReviewerEvaluation, readJsonFile, writeJsonFile } from './contracts.ts';

export { withTempDir as withOutputRoot } from './contracts.ts';

type ExternalSuiteOptions = {
  suiteId: string;
  domainId: string;
  targetAgentDir: string;
  targetDescriptorRef?: string;
  taskFamily: string;
  passed?: boolean;
  evidenceRefs?: string[];
  feedbackRefs?: string[];
  reviewerEvidenceRefs?: string[];
};

function stageCompletionPolicy(ref: string): JsonObject {
  return {
    surface_kind: 'domain_stage_completion_policy',
    policy_ref: `stage-completion-policy:${ref}`,
    completion_judgment_owner: 'domain_stage',
    closeout_packet_required: true,
    provider_completion_is_domain_completion: false,
    opl_content_judgment_allowed: false,
    next_stage_transition_owner: 'opl_runtime',
    required_closeout_outcomes: 'completed_and_continue completed_and_wait_owner route_back blocked rejected'.split(' '),
    accepted_closeout_ref_fields: ['owner_receipt_ref', 'typed_blocker_ref', 'human_gate_ref', 'route_back_ref'],
    authority_boundary: { opl_can_decide_domain_completion: false, provider_completion_counts_as_stage_complete: false },
  };
}

export function buildExternalSuite(options: ExternalSuiteOptions): JsonObject {
  const ref = `${options.domainId}/${options.taskFamily}`;
  const passed = options.passed === true;
  const evidenceRefs = [...(options.evidenceRefs ?? [`evidence-ref:${ref}`])];
  const targetAgentRef = `domain-agent:${options.domainId}`;
  const descriptorRef = options.targetDescriptorRef
    ?? path.join(options.targetAgentDir, 'contracts/domain_descriptor.json');
  return {
    suite_id: options.suiteId,
    suite_kind: 'agent_lab_external_suite',
    evaluation_target_agent: {
      domain_id: options.domainId,
      target_agent_ref: targetAgentRef,
      descriptor_ref: descriptorRef,
    },
    authority_boundary: {
      can_write_domain_truth: false, can_write_memory_body: false,
      can_authorize_quality_verdict: false, can_promote_default_agent_without_gate: false,
    },
    tasks: [{
      task_id: `agent-lab-task:${ref}`,
      domain_id: options.domainId,
      task_family: options.taskFamily,
      target_agent_ref: targetAgentRef,
      target_agent_descriptor_ref: descriptorRef,
      environment: {
        environment_kind: 'local_workspace', workspace_locator_ref: `workspace-locator:${ref}`,
        sandbox_policy: 'refs_only_no_artifact_mutation', network_policy: 'domain_owner_policy',
      },
      instructions_ref: `instructions:${ref}`,
      agent_entry_ref: `domain-agent-entry:${options.domainId}`,
      ...(options.feedbackRefs ? { feedback_refs: [...options.feedbackRefs] } : {}),
      ...(options.reviewerEvidenceRefs ? { reviewer_evidence_refs: [...options.reviewerEvidenceRefs] } : {}),
      stage_refs: [`stage:${ref}`],
      oracle_refs: [`oracle:${ref}`],
      scorer_refs: [`scorer:${ref}`],
      recovery_probes: [{
        probe_ref: `recovery-probe:${ref}`, probe_kind: 'resume_after_interruption', expected_status: 'passed',
        observed_status: passed ? 'passed' : 'blocked',
        source_refs: [...evidenceRefs],
      }],
      trajectory: {
        trajectory_ref: `trajectory:${ref}`, run_ref: `run:${ref}`, agent_executor: 'codex_cli',
        stage_attempt_refs: [`stage-attempt:${ref}`],
        tool_call_refs: [`tool-call:${ref}`],
        artifact_refs: [...evidenceRefs],
        receipt_refs: [`receipt:${ref}`],
        repair_refs: passed ? [] : [...evidenceRefs],
      },
      scorecard: {
        scorecard_ref: `quality-scorecard:${ref}`, domain_owned: true,
        opl_scorecard_role: 'scorecard_ref_projection_only', passed,
        metric_refs: [...evidenceRefs],
        evidence_refs: [...evidenceRefs],
        review_refs: [`review-ref:${ref}`],
        quality_gate_refs: [`quality-gate:${ref}`],
      },
      improvement_candidate: {
        candidate_ref: `improvement-candidate:${ref}`,
        candidate_kind: passed ? 'owner_receipt_scaleout' : 'rubric_gap', target_ref: evidenceRefs[0],
        evidence_refs: [...evidenceRefs],
        allowed_change_scope: passed ? 'manual_review_required' : 'branch_only',
        promotion_gate_ref: `promotion-gate:${ref}`,
      },
      promotion_gate: {
        gate_ref: `promotion-gate:${ref}`, gate_status: passed ? 'passed' : 'blocked',
        required_refs: [...evidenceRefs],
        regression_suite_refs: [`regression-suite:${ref}`],
        no_forbidden_write_proof_refs: [`no-forbidden-write:${ref}`],
      },
      ...(passed ? { stage_completion_policy: stageCompletionPolicy(ref) } : {}),
    }],
  };
}

export function writeTargetDescriptor(targetAgentDir: string, domainId = 'med-autoscience'): void {
  writeJsonFile(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), { domain_id: domainId });
}

export function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): void {
  writeJsonFile(filePath, buildAiReviewerEvaluation(overrides));
}

export function writeTargetImprovementPolicy(
  targetAgentDir: string,
  policy: { triggers: string[]; refs: string[]; paths: string[]; mappings?: JsonObject[] },
): void {
  writeJsonFile(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
    surface_kind: 'target_owned_explicit_improvement_policy',
    meta_agent_work_order_contract: {
      default_change_ref_triggers: [...policy.triggers],
      default_change_refs: [...policy.refs],
      canonical_paths: [...policy.paths],
      verification_refs: ['target_repo_test_receipt'],
      forbidden_target_paths_or_surfaces: ['target truth', 'target owner receipt body'],
      authority_boundary: { can_write_target_owner_receipt_body: false },
      change_ref_mappings: policy.mappings
        ?? policy.triggers.map((token) => ({ token, refs: [...policy.refs] })),
    },
  });
}

export function buildFoundryExecutionResult(args: {
  suite: JsonObject;
  targetAgentDir: string;
  status?: string;
}): JsonObject {
  const targetAgent = readTargetAgent(args.targetAgentDir);
  const suiteId = String(args.suite.suite_id);
  const taskIds = (args.suite.tasks as JsonObject[]).map((task) => String(task.task_id));
  const evaluationPacketRef = `evaluation-receipt:${suiteId}`;
  const taskReceiptRefs = taskIds.map((taskId) => `trajectory-observation-receipt:${taskId}`);
  const evaluationProvenanceRefs = [evaluationPacketRef, ...taskReceiptRefs];
  return {
    surface_kind: 'opl_foundry_lab_evaluation_work_order_execution',
    suite_result: {
      surface_kind: 'opl_agent_lab_suite_result',
      result_id: `foundry-suite-result:${suiteId}`,
      suite_id: suiteId,
      status: args.status ?? 'blocked',
      evaluation_target_agent: {
        domain_id: targetAgent.domain_id,
        target_agent_ref: targetAgent.target_agent_ref,
        descriptor_ref: targetAgent.descriptor_ref,
      },
      refs: { evaluation_provenance_refs: evaluationProvenanceRefs },
      evaluation_provenance_bindings: [
        { receipt_role: 'evaluation_packet', receipt_ref: evaluationPacketRef },
        ...taskIds.map((taskId, index) => ({
          receipt_role: 'trajectory_observation',
          receipt_ref: taskReceiptRefs[index],
          task_id: taskId,
        })),
      ],
      runs: taskIds.map((taskId) => ({ task_id: taskId })),
      summary: {
        recovery_probe_count: taskIds.length,
        recovery_passed_count: args.status === 'passed' ? taskIds.length : 0,
        forbidden_authority_flag_count: 0,
      },
    },
    receipt: {
      foundry_lab_execution_receipt_ref: `foundry-lab-execution-receipt:${suiteId}`,
    },
  };
}

export function runImproveFromSuite(args: {
  suitePath: string; targetAgentDir: string; outputRoot: string;
  reviewerEvaluationPath: string; feedbackRef?: string;
}): JsonObject {
  const suite = readJsonFile(args.suitePath);
  const task = Array.isArray(suite.tasks) ? suite.tasks[0] : {};
  const passed = task?.scorecard?.passed === true
    || task?.promotion_gate?.gate_status === 'passed';
  const suiteResultPath = path.join(args.outputRoot, 'foundry-lab-suite-result.json');
  writeJsonFile(suiteResultPath, buildFoundryExecutionResult({
    suite,
    targetAgentDir: args.targetAgentDir,
    status: passed ? 'passed' : 'blocked',
  }));
  return runImproveFromAgentLabSuite({
    suitePath: args.suitePath,
    suiteResultPath,
    targetAgentDir: args.targetAgentDir,
    feedbackRef: args.feedbackRef ?? null,
    aiReviewerEvaluationPath: args.reviewerEvaluationPath,
  });
}

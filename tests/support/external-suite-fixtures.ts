import path from 'node:path';
import {
  parseImproveFromAgentLabSuiteArgs,
  runImproveFromAgentLabSuite,
} from '../../scripts/improve-from-agent-lab-suite.ts';
import type { JsonObject } from '../../scripts/lib/domain-pack.ts';
import { oplBin, writeJsonFile } from './contracts.ts';

export { withTempDir as withOutputRoot } from './contracts.ts';
export { assertIncludesAll } from './source-purity.ts';

export const targetPatchLoopProjectionRequiredFields = [
  ...'blocked_suite_result_ref developer_patch_work_order_ref patch_traceability_matrix_ref target_repo_verification_refs target_runtime_read_model_consumption_ref workspace_environment_proof_ref no_forbidden_write_proof_ref target_owner_receipt_or_typed_blocker_ref patch_absorption_ref worktree_cleanup_ref agent_lab_re_evaluation_ref ai_reviewer_evaluation_ref ai_reviewer_evidence.source_refs ai_reviewer_evidence.direct_evidence_refs ai_reviewer_scorecard.verdict ai_reviewer_review.predicted_impact ai_reviewer_independence review_provenance reviewer_pool_refs work_order_completeness.reviewer_refs'.split(' '),
];

const refsOnlySuiteAuthorityBoundary = (): JsonObject => ({
  can_write_domain_truth: false,
  can_write_memory_body: false,
  can_authorize_quality_verdict: false,
  can_promote_default_agent_without_gate: false,
});

const localRefsOnlyEnvironment = (workspaceLocatorRef: string): JsonObject => ({
  environment_kind: 'local_workspace',
  workspace_locator_ref: workspaceLocatorRef,
  sandbox_policy: 'refs_only_no_artifact_mutation',
  network_policy: 'domain_owner_policy',
});

const medicalRubricGapRefs = 'rubric-gap:mas/002/hdl-harmonization-and-sensitivity rubric-gap:mas/002/internal-quality-language-purge'.split(' ');

const efficiencyRefs = {
  qualityFloor: 'quality-floor:target-agent/current-behavior-gate',
  latency: 'latency-baseline:target-agent/p50-p95-before',
  usageCost: 'usage-cost:target-agent/token-cost-before',
  cacheReuse: 'cache-reuse:target-agent/reused-prefix-cache',
  verification: 'target-verification:target-agent/efficiency-redrive',
};

function stageCompletionPolicy(domainId: string, taskFamily: string): JsonObject {
  return {
    surface_kind: 'domain_stage_completion_policy',
    policy_ref: `stage-completion-policy:${domainId}/${taskFamily}`,
    completion_judgment_owner: 'domain_stage',
    closeout_packet_required: true,
    provider_completion_is_domain_completion: false,
    opl_content_judgment_allowed: false,
    next_stage_transition_owner: 'opl_runtime',
    required_closeout_outcomes: 'completed_and_continue completed_and_wait_owner route_back blocked rejected'.split(' '),
    accepted_closeout_ref_fields: ['owner_receipt_ref', 'typed_blocker_ref', 'human_gate_ref', 'route_back_ref'],
    authority_boundary: {
      opl_can_decide_domain_completion: false,
      provider_completion_counts_as_stage_complete: false,
    },
  };
}

export function runImproveArgs(args: string[]): JsonObject {
  return runImproveFromAgentLabSuite(parseImproveFromAgentLabSuiteArgs(args));
}

export function writeTargetDescriptor(
  targetAgentDir: string,
  domainId = 'med-autoscience',
  deliveryDomain?: string,
): void {
  const domainLabel = domainId === 'med-autoscience' ? 'MedAutoScience'
    : domainId === 'target-agent' ? 'Target Agent'
      : domainId === 'external-agent' ? 'External Agent' : domainId;
  writeJsonFile(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
    domain_id: domainId,
    domain_label: domainLabel,
    delivery_domain: deliveryDomain ?? (domainId === 'med-autoscience'
      ? 'medical_research'
      : 'opl_compatible_target_agent'),
  });
}

export function runImproveFromSuite(args: {
  suitePath: string;
  targetAgentDir: string;
  outputRoot: string;
  reviewerEvaluationPath?: string;
  feedbackRef?: string;
}): JsonObject {
  return runImproveArgs([
    '--suite',
    args.suitePath,
    '--target-agent-dir',
    args.targetAgentDir,
    '--output-dir',
    args.outputRoot,
    ...(args.feedbackRef ? ['--feedback-ref', args.feedbackRef] : []),
    ...(args.reviewerEvaluationPath ? ['--ai-reviewer-evaluation', args.reviewerEvaluationPath] : []),
    '--opl-bin',
    oplBin,
  ]);
}

export function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const payload = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/mas/002/high-quality-medical-manuscript',
    execution_attempt_ref: 'attempt:executor/mas/002/high-quality-medical-manuscript',
    review_attempt_ref: 'attempt:ai-reviewer/mas/002/high-quality-medical-manuscript',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The blocked suite shows HDL, reviewer revision, and internal quality-control language gaps.',
    suggestions: [
      'Map HDL unit harmonization to the prediction model quality contract.',
      'Purge internal-quality language from manuscript writing prompts and reviewer rubrics.',
    ],
    source_refs: [...medicalRubricGapRefs],
    direct_evidence_refs: ['paper/evidence_ledger.json'],
    verdict: 'blocked_requires_developer_patch',
    predicted_impact: 'The patch should convert reviewer-observed quality gaps into target-owned source refs without moving publication authority out of MAS.',
    canary_refs: ['canary:mas/002/high-quality-medical-manuscript-redrive'],
    rollback_refs: ['rollback:mas/002/pre-reviewer-workorder-head'],
    version_refs: ['version:mas/002/current-head'],
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/mas/002/high-quality-medical-manuscript',
      reviewer_prompt_ref: 'instructions:mas/high-quality-medical-manuscript-ai-reviewer',
      created_by: 'test-fixture',
    },
    ...overrides,
  };
  writeJsonFile(filePath, payload);
  return payload;
}

function blockedMedicalTask(overrides: JsonObject = {}): JsonObject {
  return {
    task_id: 'agent-lab-task:mas/002/high-quality-medical-manuscript',
    domain_id: 'med-autoscience',
    task_family: 'high_quality_medical_manuscript_self_evolution',
    environment: localRefsOnlyEnvironment('workspace-locator:mas/002'),
    instructions_ref: 'instructions:mas/high-quality-medical-manuscript-ai-reviewer',
    agent_entry_ref: 'domain-agent-entry:med-autoscience',
    stage_refs: ['stage:mas/review', 'stage:mas/write'],
    oracle_refs: ['oracle:mas/ai-reviewer-publication-eval'],
    scorer_refs: ['scorer:mas/ai-reviewer-medical-publication-critique-v1'],
    reviewer_evidence_refs: ['paper/evidence_ledger.json'],
    recovery_probes: [
      {
        probe_ref: 'recovery-probe:mas/002/review-route-redrive',
        probe_kind: 'resume_after_interruption',
        expected_status: 'passed',
        observed_status: 'blocked',
        source_refs: ['rubric-gap:mas/002/hdl-harmonization-and-sensitivity'],
      },
    ],
    trajectory: {
      trajectory_ref: 'trajectory:mas/002/high-quality-medical-manuscript',
      run_ref: 'run:mas/002/high-quality-medical-manuscript-agent-lab-projection',
      agent_executor: 'codex_cli',
      stage_attempt_refs: ['stage-attempt:mas/ai-reviewer-medical-prose-quality-review'],
      tool_call_refs: ['tool-call:mas/publication-eval-read'],
      artifact_refs: ['artifacts/publication_eval/latest.json'],
      receipt_refs: ['artifacts/publication_eval/latest.json'],
      repair_refs: [...medicalRubricGapRefs],
      trace_refs: ['trace-ref:agent-lab/mas-high-quality-medical-manuscript'],
    },
    scorecard: {
      scorecard_ref: 'quality-scorecard:mas/002/high-quality-medical-manuscript',
      domain_owned: true,
      opl_scorecard_role: 'scorecard_ref_projection_only',
      passed: false,
      metric_refs: ['metric-ref:mas/002/medical_journal_prose_quality'],
      evidence_refs: ['artifacts/publication_eval/latest.json'],
      review_refs: ['paper/review/review_ledger.json'],
      quality_gate_refs: ['quality-gate:mas/publication-owner'],
    },
    improvement_candidate: {
      candidate_ref: 'improvement-candidate:mas/002/high-quality-medical-manuscript-rubric-gap',
      candidate_kind: 'rubric_gap',
      target_ref: 'rubric-gap-ref:mas/high-quality-medical-manuscript-ai-reviewer',
      evidence_refs: [...medicalRubricGapRefs],
      allowed_change_scope: 'branch_only',
      promotion_gate_ref: 'promotion-gate:mas/002/high-quality-medical-manuscript',
    },
    promotion_gate: {
      gate_ref: 'promotion-gate:mas/002/high-quality-medical-manuscript',
      gate_status: 'blocked',
      required_refs: ['quality-scorecard:mas/002/high-quality-medical-manuscript'],
      regression_suite_refs: ['regression-suite:mas/ai-first-quality-boundary'],
      no_forbidden_write_proof_refs: ['no-forbidden-write:mas/agent-lab-medical-manuscript-quality'],
    },
    ...overrides,
  };
}

export function buildBlockedMedicalManuscriptSuite(suitePath: string): JsonObject {
  return {
    suite_id: 'mas-agent-lab-suite:002:high-quality-medical-manuscript',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: refsOnlySuiteAuthorityBoundary(),
    source_refs: [suitePath],
    tasks: [blockedMedicalTask()],
  };
}

export function buildReviewerRevisionFeedbackSuite(suitePath: string): JsonObject {
  const task = blockedMedicalTask({
    task_id: 'agent-lab-task:mas/002/reviewer_revision-feedback',
    task_family: 'reviewer_revision_feedback_self_evolution',
    instructions_ref: 'instructions:mas/reviewer_revision-feedback-ai-reviewer',
    feedback_refs: [
      'feedback-ref:mas/002/reviewer_revision/mentor-round-1',
      'feedback-ref:mas/002/reviewer_revision/statistical-methods',
    ],
    reviewer_evidence_refs: [
      'reviewer-evidence:mas/002/reviewer_revision/response-matrix',
      'reviewer-evidence:mas/002/reviewer_revision/methods-completeness',
    ],
    reviewer_revision_refs: ['reviewer-revision:mas/002/checklist/text-revisions'],
    revision_checklist_refs: ['revision-checklist:mas/002/handoff-evidence-surface'],
    owner_route_refs: ['target-agent-owner:med-autoscience'],
    target_owner_closeout_refs: ['target-owner-receipt-or-typed-blocker:med-autoscience/reviewer_revision-feedback'],
  });
  return {
    suite_id: 'mas-agent-lab-suite:002:reviewer_revision-feedback',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: refsOnlySuiteAuthorityBoundary(),
    source_refs: [suitePath],
    tasks: [task],
  };
}

export function writeMedicalTargetImprovementPolicy(targetAgentDir: string): void {
  const metaAgentWorkOrderContract = {
    default_change_ref_triggers: 'medical-manuscript medical_journal_prose_quality reviewer_revision'.split(' '),
    default_change_refs: ['quality_contract_ref:prediction_model_first_draft_quality'],
    capability_id: 'med-autoscience.medical-manuscript-quality',
    canonical_paths: ['src/med_autoscience/policies/medical_reporting_checklist.py'],
    verification_refs: ['target_repo_test_receipt'],
    forbidden_target_paths_or_surfaces: ['study truth surfaces', 'submission readiness verdicts'],
    authority_boundary: { can_write_target_owner_receipt_body: false },
    change_ref_mappings: [
      {
        token: 'medical_journal_prose_quality',
        refs: ['rubric_ref:ai_reviewer/high_quality_medical_manuscript'],
      },
      {
        token: 'hdl',
        refs: ['quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization'],
      },
      {
        token: 'internal-quality-language-purge',
        refs: ['rubric_ref:ai_reviewer/high_quality_medical_manuscript/internal_quality_language_purge'],
      },
      {
        token: 'reviewer_revision',
        refs: ['quality_contract_ref:prediction_model_first_draft_quality'],
      },
    ],
    patch_surface_hints: {
      quality_contract_ref: ['src/med_autoscience/policies/medical_reporting_checklist.py'],
      rubric_ref: ['src/med_autoscience/policies/publication_critique.py'],
    },
  };
  writeJsonFile(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
    surface_kind: 'target_owned_explicit_improvement_policy',
    owner: 'MedAutoScience',
    meta_agent_work_order_contract: metaAgentWorkOrderContract,
  });
  writeJsonFile(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_production_evidence_handoff',
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    handoff_status: 'ready_for_opl_meta_agent_and_agent_lab_execution',
    external_suite_improvement_policy: {
      external_learning_refs: ['external-source:tripod-statement/scope-and-checklist'],
      forbidden_target_paths_or_surfaces: ['study truth surfaces', 'submission readiness verdicts'],
      runtime_required_surface_refs: ['study_runtime_status', 'target_agent_owner_route'],
      runtime_expected_outcomes: ['target owner can consume source-patch refs without OMA truth authority'],
    },
  });
}

export function writeEfficiencyTargetImprovementPolicy(targetAgentDir: string): void {
  writeJsonFile(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
    surface_kind: 'target_owned_explicit_improvement_policy',
    owner: 'target-agent',
    meta_agent_work_order_contract: {
      default_change_ref_triggers: ['efficiency', 'latency', 'usage cost', 'cache reuse'],
      default_change_refs: 'target_agent_efficiency_policy_ref:target-agent/non-regression-quality-floor target_agent_runtime_contract_ref:target-agent/latency-and-cache-reuse target_agent_regression_suite_ref:target-agent/efficiency-non-regression'.split(' '),
      capability_id: 'target-agent.efficiency-runtime',
      canonical_paths: ['src/runtime/efficiency-policy.ts'],
      verification_refs: [efficiencyRefs.verification],
      forbidden_target_paths_or_surfaces: ['target quality verdict bodies', 'target export authority'],
      authority_boundary: { can_write_target_owner_receipt_body: false },
      change_ref_mappings: [
        { token: 'latency', refs: ['target_agent_runtime_contract_ref:target-agent/latency-and-cache-reuse'] },
        { token: 'usage-cost', refs: ['target_agent_efficiency_policy_ref:target-agent/usage-cost-budget'] },
        { token: 'cache-reuse', refs: ['target_agent_runtime_contract_ref:target-agent/cache-reuse'] },
      ],
      patch_surface_hints: {
        target_agent_efficiency_policy_ref: ['contracts/efficiency-non-regression-policy.json'],
        target_agent_runtime_contract_ref: ['src/runtime/efficiency-policy.ts'],
        target_agent_regression_suite_ref: ['tests/efficiency-non-regression.test.ts'],
      },
    },
  });
  writeJsonFile(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_efficiency_evidence_handoff',
    domain_id: 'target-agent',
    owner: 'target-agent',
    handoff_status: 'ready_for_opl_meta_agent_efficiency_work_order',
    external_suite_improvement_policy: {
      runtime_required_surface_refs: ['target_agent_runtime_projection', 'target_agent_owner_route'],
      runtime_expected_outcomes: ['target owner route consumes efficiency non-regression refs'],
    },
  });
}

export function writeOwnerReceiptAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  return writeAiReviewerEvaluation(filePath, {
    run_ref: 'run:ai-reviewer/target-agent/owner-receipt-consumption',
    critique: 'The target-agent owner receipt evidence keeps quality or export readiness under target owner authority.',
    suggestions: ['Keep production acceptance closure tied to target owner receipt refs.'],
    source_refs: ['owner-receipt:target-agent/live-acceptance/2026-05-20'],
    direct_evidence_refs: ['owner-receipt:target-agent/live-acceptance/2026-05-20'],
    verdict: 'accepted_no_patch_required',
    predicted_impact: 'The coordination record should preserve target-owner receipt authority.',
    ...overrides,
  });
}

function buildOwnerReceiptSuite(domainId: string, passed: boolean): JsonObject {
  const receiptRef = `owner-receipt:${domainId}/live-acceptance`;
  const taskFamily = domainId === 'external-agent' ? 'owner_receipt_coordination' : 'owner_receipt_result_consumption';
  return {
    suite_id: `${domainId}-suite:owner-receipt-consumption`,
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: refsOnlySuiteAuthorityBoundary(),
    tasks: [
      {
        task_id: `agent-lab-task:${domainId}/owner-receipt-consumption`,
        domain_id: domainId,
        task_family: taskFamily,
        environment: localRefsOnlyEnvironment(`workspace-locator:${domainId}/owner-receipt`),
        instructions_ref: `instructions:${domainId}/owner-receipt-consumption`,
        agent_entry_ref: `domain-agent-entry:${domainId}`,
        stage_refs: [`stage:${domainId}/owner-review`],
        stage_completion_policy: stageCompletionPolicy(domainId, taskFamily),
        oracle_refs: [`oracle:${domainId}/owner-receipt-boundary`],
        scorer_refs: [`scorer:${domainId}/owner-receipt-ref-projection`],
        recovery_probes: [
          {
            probe_ref: `recovery-probe:${domainId}/owner-receipt-redrive`,
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: [receiptRef],
          },
        ],
        trajectory: {
          trajectory_ref: `trajectory:${domainId}/owner-receipt-consumption`,
          run_ref: `run:${domainId}/owner-receipt-consumption`,
          agent_executor: 'codex_cli',
          stage_attempt_refs: [`stage-attempt:${domainId}/owner-receipt-consumption`],
          tool_call_refs: [`tool-call:${domainId}/owner-receipt-evidence`],
          artifact_refs: [`contract-ref:${domainId}/production_acceptance.json`],
          receipt_refs: [receiptRef],
          repair_refs: [],
          trace_refs: [`trace-ref:agent-lab/${domainId}-owner-receipt`],
        },
        scorecard: {
          scorecard_ref: `quality-scorecard:${domainId}/owner-receipt`,
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed,
          metric_refs: [`metric-ref:${domainId}/owner-receipt-shape`],
          evidence_refs: [receiptRef],
          review_refs: [`review-ref:${domainId}/owner-receipt`],
          quality_gate_refs: [`quality-gate:${domainId}/owner`],
        },
        improvement_candidate: {
          candidate_ref: `improvement-candidate:${domainId}/owner-receipt`,
          candidate_kind: 'owner_receipt_scaleout',
          target_ref: `owner-receipt-contract:${domainId}/live-acceptance`,
          evidence_refs: [receiptRef],
          allowed_change_scope: 'manual_review_required',
          promotion_gate_ref: `promotion-gate:${domainId}/owner-receipt`,
        },
        promotion_gate: {
          gate_ref: `promotion-gate:${domainId}/owner-receipt`,
          gate_status: passed ? 'passed' : 'blocked',
          required_refs: [`owner-receipt-contract:${domainId}/live-acceptance`],
          regression_suite_refs: [`regression-suite:${domainId}/owner-boundary`],
          no_forbidden_write_proof_refs: [`no-forbidden-write:${domainId}/owner-receipt`],
        },
      },
    ],
  };
}

export function buildPassedTargetAgentOwnerReceiptSuite(): JsonObject {
  return buildOwnerReceiptSuite('target-agent', true);
}

export function buildPassedGenericOwnerReceiptSuite(): JsonObject {
  return buildOwnerReceiptSuite('external-agent', true);
}

export function buildBlockedEfficiencySuite(options: { includeHandoffProjection?: boolean } = {}): JsonObject {
  const suite: JsonObject = {
    suite_id: 'external-agent-suite:efficiency-non-regression',
    suite_kind: 'agent_lab_external_suite',
    required_observations: [],
    authority_boundary: refsOnlySuiteAuthorityBoundary(),
    tasks: [
      {
        task_id: 'agent-lab-task:target-agent/efficiency-non-regression',
        domain_id: 'target-agent',
        task_family: 'target_agent_generic_efficiency_work_order',
        environment: localRefsOnlyEnvironment('workspace-locator:target-agent/efficiency'),
        instructions_ref: 'instructions:target-agent/efficiency-non-regression',
        agent_entry_ref: 'domain-agent-entry:target-agent',
        stage_refs: ['stage:target-agent/efficiency-review'],
        oracle_refs: ['oracle:target-agent/quality-floor-non-regression'],
        scorer_refs: ['scorer:target-agent/efficiency-non-regression'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:target-agent/efficiency-redrive',
            probe_kind: 'efficiency_non_regression_redrive',
            expected_status: 'passed',
            observed_status: 'blocked',
            source_refs: [efficiencyRefs.verification],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:target-agent/efficiency-non-regression',
          run_ref: 'run:target-agent/efficiency-non-regression',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:target-agent/efficiency-review'],
          tool_call_refs: ['tool-call:target-agent/efficiency-evidence-read'],
          artifact_refs: ['artifact-ref:target-agent/latency-baseline'],
          receipt_refs: [efficiencyRefs.verification],
          repair_refs: ['efficiency-gap:target-agent/cache-reuse-missing'],
          trace_refs: ['trace-ref:target-agent/efficiency-non-regression'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:target-agent/efficiency-non-regression',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: false,
          metric_refs: ['metric-ref:target-agent/usage-cost-regression'],
          evidence_refs: [efficiencyRefs.qualityFloor, efficiencyRefs.latency, efficiencyRefs.usageCost, efficiencyRefs.cacheReuse, efficiencyRefs.verification],
          review_refs: ['review-ref:target-agent/efficiency-reviewer'],
          quality_gate_refs: ['quality-gate:target-agent/owner-quality-floor'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:target-agent/efficiency',
          candidate_kind: 'efficiency_non_regression',
          evidence_refs: ['efficiency-gap:target-agent/cache-reuse-missing'],
          efficiency_evidence_refs: {
            quality_floor_refs: [efficiencyRefs.qualityFloor],
            latency_baseline_refs: [efficiencyRefs.latency],
            usage_cost_refs: [efficiencyRefs.usageCost],
            cache_reuse_refs: [efficiencyRefs.cacheReuse],
            target_verification_refs: [efficiencyRefs.verification],
          },
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:target-agent/efficiency',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:target-agent/efficiency',
          gate_status: 'blocked',
          required_refs: [efficiencyRefs.qualityFloor],
          regression_suite_refs: ['regression-suite:target-agent/efficiency-non-regression'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:target-agent/efficiency'],
        },
      },
    ],
  };
  if (options.includeHandoffProjection !== false) {
    suite.target_agent_efficiency_handoff_projection = {
      efficiency_signal_refs: {
        duration_refs: ['workspace-runtime-ref:route-summary:run-1#/elapsed_ms'],
        cost_refs: ['workspace-runtime-ref:route-summary:run-1#/cost_summary'],
        cache_refs: ['workspace-runtime-ref:route-summary:run-1#/cache_status'],
        reuse_refs: ['workspace-runtime-ref:route-artifact:run-1#/render_execution/reused_slide_ids'],
        export_result_refs: ['workspace-runtime-ref:export-result:run-1'],
      },
      quality_floor_refs: {
        review_export_gate_refs: ['workspace-runtime-ref:review-export:run-1'],
        screenshot_review_gate_refs: ['workspace-runtime-ref:screenshot_review:run-1'],
      },
    };
  }
  return suite;
}

export function writeEfficiencyReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  return writeAiReviewerEvaluation(filePath, {
    critique: 'The suite shows an efficiency regression candidate with latency, usage cost, cache reuse, target verification, and preserved quality-floor evidence.',
    suggestions: ['Generate a generic target-agent efficiency work order that preserves the quality floor.'],
    source_refs: [efficiencyRefs.latency, efficiencyRefs.usageCost, efficiencyRefs.cacheReuse, efficiencyRefs.qualityFloor],
    direct_evidence_refs: [efficiencyRefs.qualityFloor, efficiencyRefs.verification],
    predicted_impact: 'The target agent can reduce latency and usage cost while proving quality-floor non-regression and cache reuse.',
    ...overrides,
  });
}

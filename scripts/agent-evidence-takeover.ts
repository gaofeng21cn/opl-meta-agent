#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  type AiReviewerEvaluation,
  loadAiReviewerEvaluation,
  runOpl,
  stableId,
  writeJson,
} from './lib/meta-agent-loop.ts';
import type { JsonObject } from './lib/domain-pack.ts';
import {
  loadAgentContracts,
  parseAgentEvidenceArgs,
} from './lib/agent-evidence-contracts.ts';
import {
  type AgentContracts,
  type TargetAgentIdentity,
  TARGET_AGENT_FORBIDDEN_WRITE_SURFACES,
  buildCapabilityCandidate,
  buildDeveloperWorkOrder,
  buildMechanismPatchProposal,
  buildOwnerReceiptRefs,
  buildTypedBlocker,
  productionEvidenceGate,
  sourceContractRefs,
  targetAgentIdentity,
} from './lib/agent-evidence-materializer.ts';
import {
  forbiddenWriteSurfaces,
  noForbiddenWriteProofRefs,
  productionAcceptanceEvidenceRefs,
  verificationRefs,
} from './lib/work-order-refs.ts';
import {
  missingEfficiencyNonRegressionFields,
} from './lib/work-order-efficiency.ts';
import {
  validateDeveloperPatchWorkOrder,
} from './lib/work-order-validation.ts';
import {
  buildStageNativeArtifactAttemptRefs,
} from './lib/stage-native-artifact-contract.ts';

function buildAgentLabSuite({
  agentRepo,
  contracts,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
}: {
  agentRepo: string;
  contracts: AgentContracts;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
}): JsonObject {
  const targetAgent = targetAgentIdentity(contracts, agentRepo);
  const receiptRefs = productionAcceptanceEvidenceRefs(contracts.productionAcceptance);
  const nextVerificationRefs = verificationRefs(contracts.productionAcceptance);
  const noForbiddenRefs = noForbiddenWriteProofRefs(contracts, targetAgent);
  const reviewerEvidenceRefs = aiReviewerEvaluation && aiReviewerEvaluationPath
    ? [aiReviewerEvaluationPath, ...aiReviewerEvaluation.source_refs, ...aiReviewerEvaluation.direct_evidence_refs]
    : [];
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domainId,
    stageId: 'agent-evidence-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: 'production-evidence-tail',
  });
  const suiteSeed = [
    agentRepo,
    contracts.productionAcceptanceRef,
    contracts.productionAcceptance.domain_acceptance_receipt?.receipt_id,
    contracts.productionAcceptance.updated_at,
    aiReviewerEvaluationPath,
  ];
  const suiteId = stableId('agent_lab_suite', suiteSeed);
  return {
    suite_id: suiteId,
    suite_kind: 'agent_production_evidence_suite',
    suite_role: 'target_agent_production_evidence_tail_testing_takeover',
    target_agent_ref: targetAgent.targetAgentRef,
    source_contract_refs: sourceContractRefs(contracts),
    stage_native_artifact_refs: stageNativeArtifactRefs,
    production_evidence_gate: productionEvidenceGate(contracts, targetAgent),
    authority_boundary: {
      refs_only: true,
      can_generate_target_domain_owner_receipt: false,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    forbidden_write_surfaces: forbiddenWriteSurfaces(contracts, TARGET_AGENT_FORBIDDEN_WRITE_SURFACES),
    },
    tasks: [
      {
        task_id: `agent-lab-task:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
        domain_id: targetAgent.domainId,
        task_family: 'target_agent_production_evidence_tail_testing_takeover',
        target_agent_ref: targetAgent.targetAgentRef,
        target_agent_descriptor_ref: path.join(agentRepo, 'contracts/domain_descriptor.json'),
        environment: {
          environment_kind: 'external_repo_contract_intake',
          workspace_locator_ref: agentRepo,
          sandbox_policy: 'refs_only_no_target_domain_mutation',
          network_policy: 'target_owner_policy',
        },
        instructions_ref: `instructions:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail-testing-takeover`,
        agent_entry_ref: `target-agent-entry:${targetAgent.domainId}`,
        stage_refs: [
          `stage:${targetAgent.domainId}/production-acceptance-contract-read`,
          `stage:${targetAgent.domainId}/agent-lab-handoff-suite-generation`,
          `stage:${targetAgent.domainId}/no-forbidden-write-verification`,
          `stage:${targetAgent.domainId}/developer-work-order-materialization`,
        ],
        oracle_refs: [
          `oracle:${targetAgent.domainId}/production-acceptance`,
          `oracle:${targetAgent.domainId}/owner-receipt-or-typed-blocker-route`,
        ],
        scorer_refs: [
          `scorer:${targetAgent.domainId}/no-forbidden-write-proof`,
          `scorer:${targetAgent.domainId}/refs-only-evidence-tail-handoff`,
        ],
        stage_native_artifact_refs: stageNativeArtifactRefs,
        stage_folder_contract: {
          artifact_native_contract_ref: stageNativeArtifactRefs.artifact_native_contract_ref,
          stage_folder_contract_ref: stageNativeArtifactRefs.stage_folder_contract_ref,
          manifest_ref: stageNativeArtifactRefs.manifest_ref,
          receipt_ref: stageNativeArtifactRefs.receipt_ref,
          blocker_ref: stageNativeArtifactRefs.blocker_ref,
          canonical_artifact_ref: stageNativeArtifactRefs.canonical_artifact_ref,
        },
        recovery_probes: [
          {
            probe_ref: `recovery-probe:${targetAgent.domainId}/production-evidence-tail/no-forbidden-write`,
            probe_kind: 'no_forbidden_authority_write',
            expected_status: 'passed',
            source_refs: [
              `${contracts.productionAcceptanceRef}#/authority_boundary`,
              'contracts/generated_surface_handoff.json#/generated_surface_policy/must_not_write',
            ],
          },
        ],
        trajectory: {
          trajectory_ref: `trajectory:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
          run_ref: `run:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail`,
          agent_executor: 'codex_cli',
          stage_attempt_refs: [
            `stage-attempt:${targetAgent.domainId}/production-acceptance-contract-read`,
            `stage-attempt:${targetAgent.domainId}/agent-lab-handoff-suite-generation`,
          ],
          tool_call_refs: ['tool-call:opl-agent-lab-run-suite'],
          artifact_refs: [
            'agent-lab-suite.json',
            'developer-patch-work-order.json',
            'target-capability-improvement-candidate.json',
            'mechanism-patch-proposal.json',
            String(stageNativeArtifactRefs.manifest_ref),
            String(stageNativeArtifactRefs.canonical_artifact_ref),
          ],
          receipt_refs: [
            ...receiptRefs,
            String(stageNativeArtifactRefs.receipt_ref),
            String(stageNativeArtifactRefs.blocker_ref),
          ],
          stage_native_artifact_refs: stageNativeArtifactRefs,
          stage_folder_contract: {
            artifact_native_contract_ref: stageNativeArtifactRefs.artifact_native_contract_ref,
            stage_folder_contract_ref: stageNativeArtifactRefs.stage_folder_contract_ref,
            manifest_ref: stageNativeArtifactRefs.manifest_ref,
            receipt_ref: stageNativeArtifactRefs.receipt_ref,
            blocker_ref: stageNativeArtifactRefs.blocker_ref,
            canonical_artifact_ref: stageNativeArtifactRefs.canonical_artifact_ref,
          },
          repair_refs: [
            `repair-ref:${targetAgent.domainId}/evidence-tail/no-active-caller-proof`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/opl-generated-surface-parity`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/domain-receipt-parity`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/independent-reviewer-auditor-receipt`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/no-forbidden-write-proof`,
          ],
          trace_refs: ['trace-ref:opl-meta-agent/agent-evidence-tail-testing-takeover'],
        },
        scorecard: {
          scorecard_ref: `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
          target_agent_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: Boolean(aiReviewerEvaluation),
          metric_refs: [
            `metric-ref:${targetAgent.domainId}/no-forbidden-write-proof`,
            `metric-ref:${targetAgent.domainId}/target-owner-route-present`,
            `metric-ref:${targetAgent.domainId}/editable-surfaces-limited`,
            `metric-ref:${targetAgent.domainId}/verification-command-refs-present`,
            `metric-ref:${targetAgent.domainId}/ai-reviewer-evaluation-present`,
            `metric-ref:${targetAgent.domainId}/ai-reviewer-independent-attempt-present`,
          ],
          evidence_refs: [
            contracts.productionAcceptanceRef,
            String(stageNativeArtifactRefs.artifact_native_contract_ref),
            String(stageNativeArtifactRefs.stage_folder_contract_ref),
            'contracts/generated_surface_handoff.json',
            'contracts/owner_receipt_contract.json',
            ...receiptRefs,
            ...nextVerificationRefs,
            ...reviewerEvidenceRefs,
          ],
          review_refs: aiReviewerEvaluationPath ? [aiReviewerEvaluationPath] : [],
          quality_gate_refs: [
            `quality-gate:${targetAgent.domainId}/owner-receipt-or-typed-blocker`,
            `quality-gate:${targetAgent.domainId}/independent-reviewer-auditor-required`,
          ],
        },
        improvement_candidate: {
          candidate_ref: `improvement-candidate:${targetAgent.domainId}/production-evidence-tail/foundry-testing-takeover`,
          candidate_kind: 'production_evidence_tail_capability_gap',
          target_ref: `${targetAgent.targetAgentRef}/production-evidence-tail`,
          evidence_refs: [
            `${contracts.productionAcceptanceRef}#/codex_first_landing_program/shared_blockers`,
            ...receiptRefs,
          ],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
        },
        promotion_gate: {
          gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
          gate_status: aiReviewerEvaluation ? 'blocked_requires_target_owner_gate' : 'blocked_missing_ai_reviewer_evaluation',
          required_refs: [
            `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
            `owner-receipt-refs:${targetAgent.domainId}/production-evidence-tail`,
            ...noForbiddenRefs,
            ...nextVerificationRefs,
          ],
          regression_suite_refs: [
            `regression-suite:${targetAgent.domainId}/agent-lab-production-evidence-tail`,
            `regression-suite:${targetAgent.domainId}/no-forbidden-write-boundary`,
          ],
          no_forbidden_write_proof_refs: noForbiddenRefs,
        },
      },
    ],
    ...(aiReviewerEvaluation && aiReviewerEvaluationPath
      ? {
          ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
          ai_reviewer_evaluation: aiReviewerEvaluation,
        }
      : {}),
  };
}

function main(): void {
  const args = parseAgentEvidenceArgs(process.argv.slice(2));
  fs.mkdirSync(args.outputDir, { recursive: true });
  const contracts = loadAgentContracts(args.agentRepo, args.productionAcceptancePath);
  const targetAgent = targetAgentIdentity(contracts, args.agentRepo);
  const aiReviewerEvaluation = args.aiReviewerEvaluationPath
    ? loadAiReviewerEvaluation(args.aiReviewerEvaluationPath)
    : null;

  const suite = buildAgentLabSuite({
    agentRepo: args.agentRepo,
    contracts,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
  });
  const suitePath = path.join(args.outputDir, 'agent-lab-suite.json');
  writeJson(suitePath, suite);

  const agentLabRun = runOpl(args.oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = (agentLabRun.agent_lab_run?.suite_result ?? {
    result_id: stableId('agent_lab_result', [suite.suite_id, 'missing-opl-suite-result']),
    status: 'blocked',
    summary: {
      recovery_probe_count: 1,
      recovery_passed_count: 0,
      forbidden_authority_flag_count: 0,
    },
  }) as JsonObject;

  const ownerReceiptRefs = buildOwnerReceiptRefs(contracts, targetAgent);
  const ownerReceiptRefsPath = path.join(args.outputDir, 'owner-receipt-refs.json');
  writeJson(ownerReceiptRefsPath, ownerReceiptRefs);

  const capabilityCandidate = buildCapabilityCandidate({
    contracts,
    suite,
    suiteResult,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
    targetAgent,
  });
  const capabilityPath = path.join(args.outputDir, 'target-capability-improvement-candidate.json');
  writeJson(capabilityPath, capabilityCandidate);

  const workOrder = buildDeveloperWorkOrder({
    contracts,
    suite,
    suiteResult,
    capabilityCandidate,
    ownerReceiptRefsPath,
    targetAgent,
  });
  const missingEfficiencyFields = missingEfficiencyNonRegressionFields(capabilityCandidate.efficiency_non_regression_refs);
  validateDeveloperPatchWorkOrder(workOrder, {
    allowMissingReviewerFields: !aiReviewerEvaluation,
  });
  const workOrderPath = path.join(args.outputDir, 'developer-patch-work-order.json');
  writeJson(workOrderPath, workOrder);

  const runPath = path.join(args.outputDir, 'agent-lab-run-result.json');
  writeJson(runPath, agentLabRun);

  const artifacts: JsonObject = {
    agent_lab_suite_path: suitePath,
    agent_lab_suite_run_path: runPath,
    owner_receipt_refs_path: ownerReceiptRefsPath,
    target_capability_improvement_candidate_path: capabilityPath,
    developer_patch_work_order_path: workOrderPath,
  };
  const learningLoop: JsonObject = {
    owner_receipt_refs: ownerReceiptRefs,
    target_capability_improvement_candidate: capabilityCandidate,
    developer_patch_work_order: workOrder,
  };

  let status = 'blocked_missing_ai_reviewer_evaluation';
  if (missingEfficiencyFields.length > 0) {
    const typedBlocker = buildTypedBlocker({
      contracts,
      suite,
      suiteResult,
      workOrder,
      status: 'blocked_efficiency_quality_floor_missing',
      blockedReason: 'efficiency_evidence_requires_quality_floor_refs',
      missingRequiredFields: missingEfficiencyFields,
    });
    const typedBlockerPath = path.join(args.outputDir, 'typed-blocker.json');
    writeJson(typedBlockerPath, typedBlocker);
    artifacts.typed_blocker_path = typedBlockerPath;
    learningLoop.typed_blocker = typedBlocker;
    status = 'blocked_efficiency_quality_floor_missing';
  } else if (aiReviewerEvaluation) {
    const mechanismPatchProposal = buildMechanismPatchProposal({
      suite,
      suiteResult,
      capabilityCandidate,
      workOrder,
      ownerReceiptRefsPath,
      targetAgent,
    });
    const mechanismPath = path.join(args.outputDir, 'mechanism-patch-proposal.json');
    writeJson(mechanismPath, mechanismPatchProposal);
    artifacts.mechanism_patch_proposal_path = mechanismPath;
    learningLoop.mechanism_patch_proposal = mechanismPatchProposal;
    status = suiteResult.status === 'passed'
      ? 'proposal_recorded_requires_target_owner_gate'
      : 'blocked_with_developer_patch_work_order';
  } else {
    const typedBlocker = buildTypedBlocker({ contracts, suite, suiteResult, workOrder });
    const typedBlockerPath = path.join(args.outputDir, 'typed-blocker.json');
    writeJson(typedBlockerPath, typedBlocker);
    artifacts.typed_blocker_path = typedBlockerPath;
    learningLoop.typed_blocker = typedBlocker;
  }

  process.stdout.write(`${JSON.stringify({
    surface_kind: 'opl_meta_agent_agent_evidence_takeover_result',
    version: 'opl-meta-agent.agent-evidence-takeover.v1',
    status,
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    artifacts,
    opl_agent_lab: agentLabRun.agent_lab_run,
    learning_loop: learningLoop,
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

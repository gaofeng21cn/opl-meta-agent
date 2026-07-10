#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from './domain-pack.ts';
import {
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
  type AiReviewerEvaluation,
} from './meta-agent-loop-ai-reviewer.ts';
import {
  stableId,
  writeJson,
} from './meta-agent-loop-io.ts';
import {
  type AgentContracts,
  TARGET_AGENT_EDITABLE_SURFACES,
  TARGET_AGENT_FORBIDDEN_WRITE_SURFACES,
  type TargetAgentIdentity,
  loadAgentContracts,
  parseAgentEvidenceArgs,
  productionEvidenceGate,
  sourceContractRefs,
  targetAgentIdentity,
} from './agent-evidence-contracts.ts';
import {
  buildExpectedTypedBlockerRef,
} from './agent-evidence-typed-blocker.ts';
import {
  buildFoundryLabWorkOrder,
} from './foundry-lab-work-order.ts';
import {
  buildStageNativeArtifactAttemptRefs,
} from './stage-native-artifact-contract.ts';
import {
  collectEfficiencyNonRegressionRefs,
} from './work-order-efficiency.ts';
import {
  forbiddenWriteSurfaces,
  noForbiddenWriteProofRefs,
  productionAcceptanceEvidenceRefs,
  requiredReturnShapes,
  targetOwnerRoute,
  uniqueRefs,
  verificationRefs,
} from './work-order-refs.ts';

export type { AgentContracts, TargetAgentIdentity } from './agent-evidence-contracts.ts';

export function buildAgentLabSuiteSeed({
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
  const noForbiddenRefs = noForbiddenWriteProofRefs(contracts, targetAgent);
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domainId,
    stageId: 'agent-evidence-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: 'production-evidence-tail',
  });
  const suiteId = stableId('agent_lab_suite_seed', [
    agentRepo,
    contracts.productionAcceptanceRef,
    contracts.productionAcceptance.updated_at,
    aiReviewerEvaluationPath,
  ]);

  return {
    surface_kind: 'opl_meta_agent_agent_lab_suite_seed',
    version: 'opl-meta-agent.agent-lab-suite-seed.v1',
    suite_id: suiteId,
    suite_kind: 'agent_production_evidence_suite',
    suite_role: 'target_agent_production_evidence_tail_testing_takeover',
    seed_status: 'declarative_seed_candidate_waiting_for_foundry_lab_consumer',
    execution_owner: 'one-person-lab/OPL Foundry Lab',
    target_agent_ref: targetAgent.targetAgentRef,
    source_contract_refs: sourceContractRefs(contracts),
    stage_native_artifact_refs: stageNativeArtifactRefs,
    production_evidence_gate: productionEvidenceGate(contracts, targetAgent),
    authority_boundary: {
      refs_only: true,
      oma_can_execute_suite: false,
      oma_can_write_suite_result: false,
      oma_can_write_owner_receipt_body: false,
      oma_can_write_promotion_gate: false,
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
          `stage:${targetAgent.domainId}/agent-lab-handoff-suite-seed`,
          `stage:${targetAgent.domainId}/no-forbidden-write-verification`,
        ],
        oracle_refs: [
          `oracle:${targetAgent.domainId}/production-acceptance`,
          `oracle:${targetAgent.domainId}/owner-receipt-or-typed-blocker-route`,
        ],
        scorer_refs: [
          `scorer:${targetAgent.domainId}/no-forbidden-write-proof`,
          `scorer:${targetAgent.domainId}/refs-only-evidence-tail-handoff`,
        ],
        recovery_probe_specs: [
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
        trajectory_plan: {
          trajectory_ref: `trajectory:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
          requested_run_ref: `run:opl-foundry-lab/${targetAgent.domainId}/production-evidence-tail`,
          agent_executor: 'codex_cli',
          tool_affordance_refs: ['opl-action:agent-lab/run'],
          expected_receipt_refs: receiptRefs,
        },
        scorecard_spec: {
          scorecard_ref: `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
          target_agent_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          metric_refs: [
            `metric-ref:${targetAgent.domainId}/no-forbidden-write-proof`,
            `metric-ref:${targetAgent.domainId}/target-owner-route-present`,
            `metric-ref:${targetAgent.domainId}/ai-reviewer-evaluation-present`,
          ],
          evidence_refs: uniqueRefs([
            contracts.productionAcceptanceRef,
            ...receiptRefs,
            ...(aiReviewerEvaluationPath ? [aiReviewerEvaluationPath] : []),
          ]),
        },
        improvement_candidate_seed: {
          candidate_ref: `improvement-candidate:${targetAgent.domainId}/production-evidence-tail/foundry-testing-takeover`,
          candidate_kind: 'production_evidence_tail_capability_gap',
          target_ref: `${targetAgent.targetAgentRef}/production-evidence-tail`,
          allowed_change_scope: 'branch_only',
        },
        promotion_gate_request: {
          gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
          evaluation_owner: 'one-person-lab/OPL Foundry Lab',
          required_refs: [
            `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
            ...noForbiddenRefs,
          ],
        },
      },
    ],
    ...(aiReviewerEvaluationPath ? { ai_reviewer_evaluation_ref: aiReviewerEvaluationPath } : {}),
  };
}

export function buildOwnerReceiptRefs(contracts: AgentContracts, targetAgent: TargetAgentIdentity): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_target_owner_receipt_refs',
    version: 'opl-meta-agent.target-owner-receipt-refs.v1',
    status: 'refs_only_no_owner_receipt_signed_by_meta_agent',
    target_agent_ref: targetAgent.targetAgentRef,
    owner: targetAgent.owner,
    receipt_refs: productionAcceptanceEvidenceRefs(contracts.productionAcceptance),
    required_return_shapes: requiredReturnShapes(contracts),
    target_owner_route: targetOwnerRoute(contracts),
  };
}

export function buildCapabilityCandidate({
  contracts,
  suiteSeed,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
  targetAgent,
}: {
  contracts: AgentContracts;
  suiteSeed: JsonObject;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  const proposedChangeRefs = [
    `agent:evidence-tail/${targetAgent.domainId}/no-active-caller-proof`,
    `agent:evidence-tail/${targetAgent.domainId}/opl-generated-surface-parity`,
    `agent:evidence-tail/${targetAgent.domainId}/domain-receipt-parity`,
    `agent:evidence-tail/${targetAgent.domainId}/independent-reviewer-auditor-receipt`,
    `agent:evidence-tail/${targetAgent.domainId}/no-forbidden-write-proof`,
  ];
  const candidateId = stableId('oma_agent_capability_candidate', [
    suiteSeed.suite_id,
    proposedChangeRefs,
    aiReviewerEvaluationPath,
  ]);
  const expectedTypedBlockerRef = aiReviewerEvaluation
    ? null
    : buildExpectedTypedBlockerRef(targetAgent.domainId, candidateId, 'missing_ai_reviewer_evaluation');

  return {
    surface_kind: 'opl_meta_agent_target_capability_improvement_candidate',
    version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
    candidate_id: candidateId,
    status: aiReviewerEvaluation
      ? 'candidate_recorded_requires_target_owner_gate'
      : 'candidate_recorded_missing_reviewer_evidence',
    target_agent: {
      domain_id: targetAgent.domainId,
      domain_label: targetAgent.domainLabel,
      owner: targetAgent.owner,
      generated_surface_owner: targetAgent.generatedSurfaceOwner,
      target_agent_ref: targetAgent.targetAgentRef,
    },
    source_agent_lab_suite_seed: {
      suite_id: suiteSeed.suite_id,
      suite_kind: suiteSeed.suite_kind,
      evaluation_status: 'pending_opl_foundry_lab_execution',
    },
    source_contract_refs: suiteSeed.source_contract_refs,
    target_owner_route: targetOwnerRoute(contracts),
    proposed_change_refs: proposedChangeRefs,
    editable_surface_limits: {
      editable_surfaces: TARGET_AGENT_EDITABLE_SURFACES,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts, TARGET_AGENT_FORBIDDEN_WRITE_SURFACES),
      proposal_only: true,
      refs_only: true,
    },
    no_forbidden_write: {
      required: true,
      proof_refs: noForbiddenWriteProofRefs(contracts, targetAgent),
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    efficiency_non_regression_refs: collectEfficiencyNonRegressionRefs(
      contracts.productionAcceptance,
      contracts.agentLabHandoff,
      suiteSeed,
      aiReviewerEvaluation,
    ),
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
    ai_reviewer_status: aiReviewerEvaluation ? 'present' : 'missing',
    expected_typed_blocker_ref: expectedTypedBlockerRef,
    ...(aiReviewerEvaluation && aiReviewerEvaluationPath
      ? aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationPath)
      : {}),
  };
}

export function materializeAgentEvidenceFromCli(argv = process.argv.slice(2)): JsonObject {
  const args = parseAgentEvidenceArgs(argv);
  fs.mkdirSync(args.outputDir, { recursive: true });
  const contracts = loadAgentContracts(args.agentRepo, args.productionAcceptancePath);
  const targetAgent = targetAgentIdentity(contracts, args.agentRepo);
  const aiReviewerEvaluation = args.aiReviewerEvaluationPath
    ? loadAiReviewerEvaluation(args.aiReviewerEvaluationPath)
    : null;

  const suiteSeed = buildAgentLabSuiteSeed({
    agentRepo: args.agentRepo,
    contracts,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
  });
  const suiteSeedPath = path.join(args.outputDir, 'agent-lab-suite-seed.json');
  writeJson(suiteSeedPath, suiteSeed);

  const ownerReceiptRefs = buildOwnerReceiptRefs(contracts, targetAgent);
  const ownerReceiptRefsPath = path.join(args.outputDir, 'owner-receipt-refs.json');
  writeJson(ownerReceiptRefsPath, ownerReceiptRefs);

  const capabilityCandidate = buildCapabilityCandidate({
    contracts,
    suiteSeed,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
    targetAgent,
  });
  const capabilityPath = path.join(args.outputDir, 'target-capability-improvement-candidate.json');
  writeJson(capabilityPath, capabilityCandidate);

  const foundryLabWorkOrder = buildFoundryLabWorkOrder({
    workOrderKind: 'target_agent_production_evidence_evaluation',
    targetAgent: {
      domain_id: targetAgent.domainId,
      domain_label: targetAgent.domainLabel,
      repo_dir: args.agentRepo,
      descriptor_ref: path.join(args.agentRepo, 'contracts/domain_descriptor.json'),
    },
    suiteSeed,
    suiteSeedRef: suiteSeedPath,
    sourceRefs: [
      ...sourceContractRefs(contracts),
      ownerReceiptRefsPath,
      ...productionAcceptanceEvidenceRefs(contracts.productionAcceptance),
    ],
    reviewerRefs: aiReviewerEvaluation && args.aiReviewerEvaluationPath
      ? [
          args.aiReviewerEvaluationPath,
          ...aiReviewerEvaluation.source_refs,
          ...aiReviewerEvaluation.direct_evidence_refs,
        ]
      : [],
    candidateRefs: [
      String(capabilityCandidate.candidate_id),
      ...([capabilityCandidate.expected_typed_blocker_ref]
        .filter((ref): ref is string => typeof ref === 'string')),
    ],
  });
  const foundryLabWorkOrderPath = path.join(args.outputDir, 'foundry-lab-work-order.json');
  writeJson(foundryLabWorkOrderPath, foundryLabWorkOrder);

  return {
    surface_kind: 'opl_meta_agent_agent_evidence_handoff',
    version: 'opl-meta-agent.agent-evidence-handoff.v1',
    status: aiReviewerEvaluation
      ? 'foundry_lab_evaluation_candidate_blocked_missing_consumer'
      : 'foundry_lab_evaluation_candidate_blocked_missing_consumer_and_reviewer_evidence',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    artifacts: {
      agent_lab_suite_seed_path: suiteSeedPath,
      owner_receipt_refs_path: ownerReceiptRefsPath,
      target_capability_improvement_candidate_path: capabilityPath,
      foundry_lab_work_order_path: foundryLabWorkOrderPath,
    },
    agent_building_judgment: {
      target_capability_improvement_candidate: capabilityCandidate,
      expected_typed_blocker_ref: capabilityCandidate.expected_typed_blocker_ref,
    },
    foundry_lab_handoff: {
      suite_seed: suiteSeed,
      work_order: foundryLabWorkOrder,
    },
    authority_boundary: foundryLabWorkOrder.authority_boundary,
  };
}

function isDirectCliEntry(): boolean {
  const entry = process.argv[1];
  return Boolean(entry) && path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectCliEntry()) {
  try {
    process.stdout.write(`${JSON.stringify(materializeAgentEvidenceFromCli(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

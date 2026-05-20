#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  type AiReviewerEvaluation,
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
  readJson,
  resolveOplBin,
  runOpl,
  stableId,
  writeJson,
} from './lib/meta-agent-loop.ts';
import type { JsonObject } from './lib/domain-pack.ts';

type AgentEvidenceArgs = {
  agentRepo: string;
  outputDir: string;
  oplBin: string;
  productionAcceptancePath: string | null;
  aiReviewerEvaluationPath: string | null;
};

type ContractRef = {
  absolutePath: string;
  ref: string;
};

type AgentContracts = {
  productionAcceptance: JsonObject;
  productionAcceptanceRef: string;
  agentLabHandoff: JsonObject;
  domainDescriptor: JsonObject;
  generatedSurfaceHandoff: JsonObject;
  ownerReceiptContract: JsonObject;
};

type TargetAgentIdentity = {
  domainId: string;
  domainLabel: string;
  owner: string;
  generatedSurfaceOwner: string;
  targetAgentRef: string;
};

const TARGET_AGENT_EDITABLE_SURFACES = [
  'agent/prompts',
  'agent/skills',
  'agent/knowledge',
  'agent/quality_gates',
  'contracts/agent_lab_handoff.json',
  'contracts/stage_control_plane.json',
  'contracts/owner_receipt_contract.json',
  'contracts/generated_surface_handoff.json',
  'contracts/functional_privatization_audit.json',
  'tests',
  'docs/status.md',
];

const TARGET_AGENT_FORBIDDEN_WRITE_SURFACES = [
  'target domain truth',
  'target memory body',
  'target artifact body',
  'target quality verdict',
  'target export verdict',
  'target owner receipt body',
  'default agent promotion without gate',
];

function parseArgs(argv: string[]): AgentEvidenceArgs {
  const parsed: {
    agentRepo: string | null;
    outputDir: string | null;
    oplBin: string;
    productionAcceptancePath: string | null;
    aiReviewerEvaluationPath: string | null;
  } = {
    agentRepo: null,
    outputDir: null,
    oplBin: resolveOplBin(),
    productionAcceptancePath: null,
    aiReviewerEvaluationPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === '--agent-repo') {
      if (!value) {
        throw new Error('Missing value for --agent-repo.');
      }
      parsed.agentRepo = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--production-acceptance') {
      if (!value) {
        throw new Error('Missing value for --production-acceptance.');
      }
      parsed.productionAcceptancePath = value;
      index += 1;
      continue;
    }
    if (token === '--output-dir') {
      if (!value) {
        throw new Error('Missing value for --output-dir.');
      }
      parsed.outputDir = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--opl-bin') {
      if (!value) {
        throw new Error('Missing value for --opl-bin.');
      }
      parsed.oplBin = resolveOplBin(value);
      index += 1;
      continue;
    }
    if (token === '--ai-reviewer-evaluation') {
      if (!value) {
        throw new Error('Missing value for --ai-reviewer-evaluation.');
      }
      parsed.aiReviewerEvaluationPath = path.resolve(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}.`);
  }

  if (!parsed.agentRepo) {
    throw new Error('Missing required --agent-repo <path>.');
  }
  if (!fs.existsSync(parsed.agentRepo)) {
    throw new Error(`target agent repo path does not exist: ${parsed.agentRepo}`);
  }
  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-agent-evidence-'));
  return {
    agentRepo: parsed.agentRepo,
    outputDir: parsed.outputDir,
    oplBin: parsed.oplBin,
    productionAcceptancePath: parsed.productionAcceptancePath,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function repoRef(agentRepo: string, absolutePath: string): string {
  const relativePath = path.relative(agentRepo, absolutePath);
  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return relativePath.split(path.sep).join('/');
  }
  return absolutePath;
}

function requiredContract(agentRepo: string, relativePath: string): ContractRef {
  const absolutePath = path.join(agentRepo, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Required target agent contract is missing: ${absolutePath}`);
  }
  return {
    absolutePath,
    ref: relativePath,
  };
}

function resolveProductionAcceptance(agentRepo: string, explicitPath: string | null): ContractRef {
  if (explicitPath) {
    const absolutePath = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.join(agentRepo, explicitPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Production acceptance contract is missing: ${absolutePath}`);
    }
    return {
      absolutePath,
      ref: repoRef(agentRepo, absolutePath),
    };
  }

  const acceptanceDir = path.join(agentRepo, 'contracts/production_acceptance');
  if (!fs.existsSync(acceptanceDir)) {
    throw new Error(`Production acceptance directory is missing: ${acceptanceDir}`);
  }
  const candidates = fs.readdirSync(acceptanceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(acceptanceDir, entry.name))
    .sort();
  if (candidates.length === 0) {
    throw new Error(`No production acceptance contract found under: ${acceptanceDir}`);
  }
  if (candidates.length > 1) {
    throw new Error(
      `Multiple production acceptance contracts found under ${acceptanceDir}; pass --production-acceptance <path>.`,
    );
  }
  return {
    absolutePath: candidates[0],
    ref: repoRef(agentRepo, candidates[0]),
  };
}

function loadAgentContracts(agentRepo: string, productionAcceptancePath: string | null): AgentContracts {
  const productionAcceptance = resolveProductionAcceptance(agentRepo, productionAcceptancePath);
  const refs = {
    agentLabHandoff: requiredContract(agentRepo, 'contracts/agent_lab_handoff.json'),
    domainDescriptor: requiredContract(agentRepo, 'contracts/domain_descriptor.json'),
    generatedSurfaceHandoff: requiredContract(agentRepo, 'contracts/generated_surface_handoff.json'),
    ownerReceiptContract: requiredContract(agentRepo, 'contracts/owner_receipt_contract.json'),
  };
  return {
    productionAcceptance: readJson(productionAcceptance.absolutePath),
    productionAcceptanceRef: productionAcceptance.ref,
    agentLabHandoff: readJson(refs.agentLabHandoff.absolutePath),
    domainDescriptor: readJson(refs.domainDescriptor.absolutePath),
    generatedSurfaceHandoff: readJson(refs.generatedSurfaceHandoff.absolutePath),
    ownerReceiptContract: readJson(refs.ownerReceiptContract.absolutePath),
  };
}

function refsFromEntries(entries: unknown): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (entry && typeof entry === 'object' && typeof (entry as JsonObject).ref === 'string') {
        return (entry as JsonObject).ref;
      }
      return null;
    })
    .filter((ref): ref is string => Boolean(ref && ref.trim()))
    .map((ref) => ref.trim());
}

function verificationRefs(productionAcceptance: JsonObject): string[] {
  return unique([
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.next_verification_command_refs),
    ...refsFromEntries(productionAcceptance.refs?.next_verification_command_refs),
    ...refsFromEntries(productionAcceptance.closure_evidence?.next_verification_ref ? [
      productionAcceptance.closure_evidence.next_verification_ref,
    ] : []),
  ]);
}

function refsFromRecord(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(refsFromRecord);
  }
  const record = value as JsonObject;
  return [
    ...(typeof record.ref === 'string' ? [record.ref] : []),
    ...Object.entries(record)
      .filter(([key]) => key !== 'ref')
      .flatMap(([, nested]) => refsFromRecord(nested)),
  ];
}

function productionAcceptanceEvidenceRefs(productionAcceptance: JsonObject): string[] {
  return unique([
    ...refsFromRecord(productionAcceptance.domain_acceptance_receipt),
    ...refsFromRecord(productionAcceptance.refs),
    ...refsFromEntries(productionAcceptance.closure_evidence?.owner_receipt_ref ? [
      productionAcceptance.closure_evidence.owner_receipt_ref,
    ] : []),
  ]);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? unique(value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()))
    : [];
}

function records(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonObject => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function firstString(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = stringValue(value);
    if (text) {
      return text;
    }
  }
  return fallback;
}

function targetAgentIdentity(contracts: AgentContracts, agentRepo: string): TargetAgentIdentity {
  const domainId = firstString([
    contracts.domainDescriptor.domain_id,
    contracts.productionAcceptance.domain_id,
    contracts.agentLabHandoff.domain_id,
  ], path.basename(agentRepo));
  const domainLabel = firstString([
    contracts.domainDescriptor.domain_label,
    contracts.productionAcceptance.domain_label,
    contracts.agentLabHandoff.domain_label,
  ], domainId);
  const owner = firstString([
    contracts.productionAcceptance.owner,
    contracts.agentLabHandoff.owner,
    contracts.domainDescriptor.owner,
  ], domainId);
  const generatedSurfaceOwner = firstString([
    contracts.domainDescriptor.generated_surface_owner,
    contracts.generatedSurfaceHandoff.generated_surface_owner,
  ], 'one-person-lab');
  return {
    domainId,
    domainLabel,
    owner,
    generatedSurfaceOwner,
    targetAgentRef: `target-agent:${domainId}`,
  };
}

function handoffTasks(agentLabHandoff: JsonObject): JsonObject[] {
  return records(agentLabHandoff.external_suite_seed?.tasks);
}

function ownerRouteRef(ownerRoute: unknown, targetAgent: TargetAgentIdentity): string | null {
  const normalized = stringValue(ownerRoute);
  if (!normalized) {
    return null;
  }
  if (normalized.startsWith('owner-route:')) {
    return normalized;
  }
  if (normalized.includes('/')) {
    return `owner-route:${normalized}`;
  }
  return `owner-route:${targetAgent.domainId}/${normalized}`;
}

function requiredReturnShapes(contracts: AgentContracts): string[] {
  return unique([
    ...textList(contracts.productionAcceptance.production_like_receipt_chain?.required_return_shapes),
    ...textList(contracts.productionAcceptance.domain_acceptance_receipt?.required_return_shapes),
  ]);
}

function taskRequiredReturnShapeRefs(tasks: JsonObject[], targetAgent: TargetAgentIdentity): string[] {
  return unique(tasks.flatMap((task) => (
    textList(task.required_return_shapes).map((shape) => `required-return-shape:${targetAgent.domainId}/${shape}`)
  )));
}

function forbiddenWriteSurfaces(contracts: AgentContracts): string[] {
  return unique([
    ...TARGET_AGENT_FORBIDDEN_WRITE_SURFACES,
    ...textList(contracts.generatedSurfaceHandoff.generated_surface_policy?.must_not_write),
    ...textList(contracts.productionAcceptance.authority_boundary?.forbidden_write_surfaces),
  ]);
}

function noForbiddenWriteProofRefs(contracts: AgentContracts, targetAgent: TargetAgentIdentity): string[] {
  const refs = unique([
    ...refsFromEntries(contracts.productionAcceptance.authority_boundary?.no_forbidden_write_proof_refs),
    ...refsFromEntries(contracts.generatedSurfaceHandoff.no_forbidden_write_proof_refs),
    ...refsFromEntries(contracts.agentLabHandoff.no_forbidden_write_proof_refs),
  ]);
  return refs.length > 0 ? refs : [`no-forbidden-write:${targetAgent.domainId}/production-evidence-tail`];
}

function sourceContractRefs(contracts: AgentContracts): string[] {
  return [
    contracts.productionAcceptanceRef,
    'contracts/agent_lab_handoff.json',
    'contracts/domain_descriptor.json',
    'contracts/generated_surface_handoff.json',
    'contracts/owner_receipt_contract.json',
  ];
}

function targetOwnerRoute(contracts: AgentContracts): JsonObject {
  const boundary = contracts.productionAcceptance.authority_boundary ?? {};
  return {
    domain_ready_requires_owner_receipt_or_typed_blocker:
      boundary.domain_ready_requires_owner_receipt_or_typed_blocker === true,
    quality_or_export_ready_requires_target_owner_gate:
      boundary.quality_or_export_ready_requires_target_owner_gate === true,
    artifact_mutation_requires_owner_receipt:
      boundary.artifact_mutation_requires_owner_receipt === true,
    source_authority_boundary_ref: `${contracts.productionAcceptanceRef}#/authority_boundary`,
  };
}

function productionEvidenceGate(contracts: AgentContracts, targetAgent: TargetAgentIdentity): JsonObject {
  const tasks = handoffTasks(contracts.agentLabHandoff);
  const handoffGateIds = tasks
    .map((task) => stringValue(task.gate_id))
    .filter((gateId): gateId is string => Boolean(gateId));
  const routeRefs = unique(
    tasks.map((task) => ownerRouteRef(task.owner_route, targetAgent)).filter((ref): ref is string => Boolean(ref)),
  );
  const evidenceRefs = productionAcceptanceEvidenceRefs(contracts.productionAcceptance);
  const returnShapeRefs = taskRequiredReturnShapeRefs(tasks, targetAgent);
  return {
    surface_kind: 'production_evidence_gate_refs',
    target_agent_ref: targetAgent.targetAgentRef,
    gate_ids: handoffGateIds.length > 0
      ? handoffGateIds
      : [
          'production_acceptance_contract_read',
          'agent_lab_handoff_suite_generation',
          'owner_receipt_or_typed_blocker_route',
          'no_forbidden_write_verification',
        ],
    owner_route_refs: routeRefs.length > 0
      ? routeRefs
      : [`owner-route:${targetAgent.domainId}/${targetAgent.owner}`],
    no_forbidden_write_proof_refs: noForbiddenWriteProofRefs(contracts, targetAgent),
    typed_blocker_refs: unique([
      ...refsFromEntries(contracts.productionAcceptance.domain_acceptance_receipt?.typed_blocker_refs),
      `typed-blocker-ref:${targetAgent.domainId}/production-evidence-tail/owner-receipt-required`,
    ]),
    required_return_shapes: requiredReturnShapes(contracts),
    required_owner_receipt_refs: evidenceRefs.length > 0 || returnShapeRefs.length > 0
      ? unique([...evidenceRefs, ...returnShapeRefs])
      : [`required-owner-receipt-ref:${targetAgent.domainId}/production-evidence-tail`],
    gate_result_refs: [`gate-result-ref:opl-agent-lab/${targetAgent.domainId}/production-evidence-tail`],
    domain_verdict_claimed: false,
    source_handoff_ref: 'contracts/agent_lab_handoff.json',
  };
}

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
    production_evidence_gate: productionEvidenceGate(contracts, targetAgent),
    authority_boundary: {
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts),
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
          ],
          receipt_refs: receiptRefs,
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

function buildOwnerReceiptRefs(contracts: AgentContracts, targetAgent: TargetAgentIdentity): JsonObject {
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

function buildCapabilityCandidate({
  contracts,
  suite,
  suiteResult,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
  targetAgent,
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  const sharedBlockers = contracts.productionAcceptance.codex_first_landing_program?.parallel_execution_model?.shared_blockers ?? [];
  const noForbiddenRefs = noForbiddenWriteProofRefs(contracts, targetAgent);
  return {
    surface_kind: 'opl_meta_agent_target_capability_improvement_candidate',
    version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
    candidate_id: stableId('oma_agent_capability_candidate', [suite.suite_id, suiteResult.result_id, sharedBlockers]),
    status: aiReviewerEvaluation
      ? 'candidate_recorded_requires_target_owner_gate'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: {
      domain_id: targetAgent.domainId,
      domain_label: targetAgent.domainLabel,
      owner: targetAgent.owner,
      generated_surface_owner: targetAgent.generatedSurfaceOwner,
      target_agent_ref: targetAgent.targetAgentRef,
    },
    source_agent_lab_suite: {
      suite_id: suite.suite_id,
      result_id: suiteResult.result_id,
      result_status: suiteResult.status,
    },
    source_contract_refs: suite.source_contract_refs,
    target_owner_route: targetOwnerRoute(contracts),
    proposed_change_refs: [
      `agent:evidence-tail/${targetAgent.domainId}/no-active-caller-proof`,
      `agent:evidence-tail/${targetAgent.domainId}/opl-generated-surface-parity`,
      `agent:evidence-tail/${targetAgent.domainId}/domain-receipt-parity`,
      `agent:evidence-tail/${targetAgent.domainId}/independent-reviewer-auditor-receipt`,
      `agent:evidence-tail/${targetAgent.domainId}/no-forbidden-write-proof`,
    ],
    editable_surface_limits: {
      editable_surfaces: TARGET_AGENT_EDITABLE_SURFACES,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts),
      proposal_only: true,
      refs_only: true,
    },
    no_forbidden_write: {
      required: true,
      proof_refs: noForbiddenRefs,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
    ai_reviewer_status: aiReviewerEvaluation ? 'present' : 'missing_typed_blocker_required',
    ...(aiReviewerEvaluation && aiReviewerEvaluationPath
      ? aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationPath)
      : {}),
  };
}

function buildTargetPatchLoopMachineRefs({
  targetAgent,
  suiteResult,
  workOrderId,
  requiredVerificationRefs,
  noForbiddenWriteProofRefs,
}: {
  targetAgent: TargetAgentIdentity;
  suiteResult: JsonObject;
  workOrderId: string;
  requiredVerificationRefs: string[];
  noForbiddenWriteProofRefs: string[];
}): JsonObject {
  const suiteResultRef = stringValue(suiteResult.result_id) ?? stableId('agent_lab_result', [workOrderId]);
  return {
    blocked_suite_result_ref: suiteResultRef,
    developer_patch_work_order_ref: workOrderId,
    patch_traceability_matrix_ref: `${workOrderId}#/patch_traceability_matrix`,
    target_repo_verification_refs: requiredVerificationRefs,
    target_runtime_read_model_consumption_ref:
      `target-runtime-read-model-consumption:${targetAgent.domainId}/${workOrderId}`,
    workspace_environment_proof_ref:
      `workspace-environment-proof:${targetAgent.domainId}/${workOrderId}`,
    no_forbidden_write_proof_ref: noForbiddenWriteProofRefs[0]
      ?? `no-forbidden-write:${targetAgent.domainId}/${workOrderId}`,
    target_owner_receipt_or_typed_blocker_ref:
      `target-owner-receipt-or-typed-blocker:${targetAgent.domainId}/${workOrderId}`,
    patch_absorption_ref: `patch-absorption:${targetAgent.domainId}/${workOrderId}`,
    worktree_cleanup_ref: `worktree-cleanup:${targetAgent.domainId}/${workOrderId}`,
    agent_lab_re_evaluation_ref:
      `agent-lab-re-evaluation:${targetAgent.domainId}/${suiteResultRef}/${workOrderId}`,
  };
}

function buildDeveloperWorkOrder({
  contracts,
  suite,
  suiteResult,
  capabilityCandidate,
  ownerReceiptRefsPath,
  targetAgent,
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  capabilityCandidate: JsonObject;
  ownerReceiptRefsPath: string;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  const verificationCommandRefs = verificationRefs(contracts.productionAcceptance);
  const workOrderId = stableId('oma_agent_developer_work_order', [
    suite.suite_id,
    suiteResult.result_id,
    capabilityCandidate.candidate_id,
  ]);
  const sourceFailureRefs = unique([
    ...productionAcceptanceEvidenceRefs(contracts.productionAcceptance),
    ...verificationCommandRefs,
    ...refsFromRecord(contracts.productionAcceptance.codex_first_landing_program?.parallel_execution_model?.shared_blockers),
  ]);
  const reviewerEvidenceRefs = capabilityCandidate.ai_reviewer_evidence
    ? unique([
        ...textList(capabilityCandidate.ai_reviewer_evidence.source_refs),
        ...textList(capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs),
      ])
    : [];
  return {
    surface_kind: 'opl_meta_agent_target_developer_patch_work_order',
    version: 'opl-meta-agent.target-developer-patch-work-order.v1',
    work_order_id: workOrderId,
    status: capabilityCandidate.ai_reviewer_status === 'present'
      ? 'ready_for_target_agent_source_patch_proposal'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_refs_ref: ownerReceiptRefsPath,
    target_owner_route: capabilityCandidate.target_owner_route,
    editable_surface_limits: capabilityCandidate.editable_surface_limits,
    allowed_editable_surfaces: capabilityCandidate.editable_surface_limits.editable_surfaces,
    target_repo_file_hints: capabilityCandidate.editable_surface_limits.editable_surfaces,
    required_verification_refs: verificationCommandRefs,
    rollback_version_refs: [
      'target_agent_current_head_ref',
      'developer_patch_branch_or_worktree_ref',
      'owner_receipt_or_typed_blocker_version_ref',
    ],
    owner_route_refs: productionEvidenceGate(contracts, targetAgent).owner_route_refs,
    proposed_change_refs: capabilityCandidate.proposed_change_refs,
    ai_reviewer_evaluation_ref: capabilityCandidate.ai_reviewer_evaluation_ref,
    ai_reviewer_status: capabilityCandidate.ai_reviewer_status,
    ...(capabilityCandidate.ai_reviewer_status === 'present'
      ? {
          ai_reviewer_review: capabilityCandidate.ai_reviewer_review,
          ai_reviewer_independence: capabilityCandidate.ai_reviewer_independence,
          ai_reviewer_evidence: capabilityCandidate.ai_reviewer_evidence,
          review_provenance: capabilityCandidate.review_provenance,
        }
      : {}),
    ahe_developer_work_order: {
      failure_evidence: unique([...sourceFailureRefs, ...reviewerEvidenceRefs]),
      root_cause: capabilityCandidate.ai_reviewer_status === 'present'
        ? 'Production evidence tail lacks target-owner-gated proof refs required for domain-ready promotion.'
        : 'Structured independent AI reviewer evaluation is missing, so the work order cannot authorize a mechanism patch proposal.',
      targeted_fix: capabilityCandidate.proposed_change_refs,
      predicted_impact: capabilityCandidate.ai_reviewer_status === 'present'
        ? capabilityCandidate.ai_reviewer_review.predicted_impact
        : 'Blocks delivery receipt and preserves target owner authority until reviewer evidence is supplied.',
    },
    implementation_controls: {
      proposal_only: true,
      refs_only: true,
      patch_must_be_limited_to_editable_surfaces: true,
      developer_must_read_target_agent_repo_context_before_editing: true,
      target_owner_receipt_or_typed_blocker_required: true,
      independent_reviewer_or_auditor_receipt_required: true,
      no_forbidden_write_proof_required: true,
      verification_command_refs_required: true,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts),
    },
    no_forbidden_write: capabilityCandidate.no_forbidden_write,
    machine_closeout_refs: buildTargetPatchLoopMachineRefs({
      targetAgent,
      suiteResult,
      workOrderId,
      requiredVerificationRefs: verificationCommandRefs,
      noForbiddenWriteProofRefs: textList(capabilityCandidate.no_forbidden_write?.proof_refs),
    }),
    verification_command_refs: verificationCommandRefs,
  };
}

function buildMechanismPatchProposal({
  suite,
  suiteResult,
  capabilityCandidate,
  workOrder,
  ownerReceiptRefsPath,
  targetAgent,
}: {
  suite: JsonObject;
  suiteResult: JsonObject;
  capabilityCandidate: JsonObject;
  workOrder: JsonObject;
  ownerReceiptRefsPath: string;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mechanism_patch_proposal',
    version: 'opl-meta-agent.mechanism-patch-proposal.v1',
    proposal_id: stableId('oma_agent_mechanism_patch', [
      suite.suite_id,
      suiteResult.result_id,
      capabilityCandidate.candidate_id,
      workOrder.work_order_id,
    ]),
    status: 'proposal_recorded_requires_target_owner_gate',
    mechanism_ref: `mechanism:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
    editable_surfaces: [
      'target_agent_pack_refs',
      'target_owner_receipt_refs',
      'target_no_forbidden_write_proof_refs',
      'target_test_refs',
      'target_status_doc_refs',
    ],
    observe: {
      segment_run_ref: suiteResult.result_id,
      source_refs: [
        suite.suite_id,
        ownerReceiptRefsPath,
        capabilityCandidate.candidate_id,
        workOrder.work_order_id,
      ],
    },
    diagnose: {
      evidence_delta_ref: `evidence-delta:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
      source_refs: capabilityCandidate.proposed_change_refs,
    },
    edit: {
      next_mechanism_candidate_ref: capabilityCandidate.candidate_id,
      proposed_change_refs: capabilityCandidate.proposed_change_refs,
      editable_surfaces: capabilityCandidate.editable_surface_limits.editable_surfaces,
      source_refs: [workOrder.work_order_id],
    },
    promotion_gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

function buildTypedBlocker({
  contracts,
  suite,
  suiteResult,
  workOrder,
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  workOrder: JsonObject;
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_agent_evidence_takeover_typed_blocker',
    version: 'opl-meta-agent.agent-evidence-takeover-typed-blocker.v1',
    blocker_id: stableId('oma_agent_evidence_blocker', [suite.suite_id, suiteResult.result_id, workOrder.work_order_id]),
    status: 'blocked_missing_ai_reviewer_evaluation',
    blocked_reason: 'independent_ai_reviewer_attempt_required_before_mechanism_patch_proposal_or_delivery_receipt',
    next_owner: 'opl-meta-agent',
    target_owner_route: targetOwnerRoute(contracts),
    blocked_suite_result_ref: workOrder.source_agent_lab_result_ref,
    work_order_ref: workOrder.work_order_id,
    required_input_refs: ['--ai-reviewer-evaluation <json>'],
    required_source_refs: [
      contracts.productionAcceptanceRef,
      'contracts/agent_lab_handoff.json',
      'contracts/generated_surface_handoff.json',
      'contracts/owner_receipt_contract.json',
    ],
    required_verification_refs: workOrder.required_verification_refs,
    rollback_version_refs: workOrder.rollback_version_refs,
    owner_route_refs: workOrder.owner_route_refs,
    ahe_developer_work_order: workOrder.ahe_developer_work_order,
    machine_closeout_refs: workOrder.machine_closeout_refs,
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
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    authority_boundary: {
      typed_blocker_only: true,
      no_delivery_receipt_signed: true,
      can_write_target_domain_truth: false,
      can_authorize_target_quality_or_export: false,
      can_mutate_target_artifact_body: false,
      can_write_target_memory_body: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
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
  if (aiReviewerEvaluation) {
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

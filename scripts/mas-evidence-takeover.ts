#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  type AiReviewerEvaluation,
  loadAiReviewerEvaluation,
  readJson,
  resolveOplBin,
  runOpl,
  stableId,
  writeJson,
} from './lib/meta-agent-loop.ts';
import type { JsonObject } from './lib/domain-pack.ts';

type MasEvidenceArgs = {
  masRepo: string;
  outputDir: string;
  oplBin: string;
  aiReviewerEvaluationPath: string | null;
};

type MasContracts = {
  productionAcceptance: JsonObject;
  agentLabHandoff: JsonObject;
  domainDescriptor: JsonObject;
  generatedSurfaceHandoff: JsonObject;
  ownerReceiptContract: JsonObject;
};

const MAS_EDITABLE_SURFACES = [
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

const MAS_FORBIDDEN_WRITE_SURFACES = [
  'MAS study truth',
  'publication_eval/latest.json',
  'controller_decisions/latest.json',
  'review_ledger body',
  'publication-route memory body',
  'artifact body',
  'manuscript/current_package',
  'submission readiness verdict',
  'AI reviewer verdict body',
];

function parseArgs(argv: string[]): MasEvidenceArgs {
  const parsed: {
    masRepo: string | null;
    outputDir: string | null;
    oplBin: string;
    aiReviewerEvaluationPath: string | null;
  } = {
    masRepo: null,
    outputDir: null,
    oplBin: resolveOplBin(),
    aiReviewerEvaluationPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === '--mas-repo') {
      if (!value) {
        throw new Error('Missing value for --mas-repo.');
      }
      parsed.masRepo = path.resolve(value);
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

  if (!parsed.masRepo) {
    throw new Error('Missing required --mas-repo <path>.');
  }
  if (!fs.existsSync(parsed.masRepo)) {
    throw new Error(`MAS repo path does not exist: ${parsed.masRepo}`);
  }
  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-mas-evidence-'));
  return {
    masRepo: parsed.masRepo,
    outputDir: parsed.outputDir,
    oplBin: parsed.oplBin,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function loadMasContracts(masRepo: string): MasContracts {
  const refs = {
    productionAcceptance: 'contracts/production_acceptance/mas-production-acceptance.json',
    agentLabHandoff: 'contracts/agent_lab_handoff.json',
    domainDescriptor: 'contracts/domain_descriptor.json',
    generatedSurfaceHandoff: 'contracts/generated_surface_handoff.json',
    ownerReceiptContract: 'contracts/owner_receipt_contract.json',
  };
  for (const relativePath of Object.values(refs)) {
    const absolutePath = path.join(masRepo, relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Required MAS contract is missing: ${absolutePath}`);
    }
  }
  return {
    productionAcceptance: readJson(path.join(masRepo, refs.productionAcceptance)),
    agentLabHandoff: readJson(path.join(masRepo, refs.agentLabHandoff)),
    domainDescriptor: readJson(path.join(masRepo, refs.domainDescriptor)),
    generatedSurfaceHandoff: readJson(path.join(masRepo, refs.generatedSurfaceHandoff)),
    ownerReceiptContract: readJson(path.join(masRepo, refs.ownerReceiptContract)),
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
  return refsFromEntries(productionAcceptance.domain_acceptance_receipt?.next_verification_command_refs);
}

function ownerRouteRefs(productionAcceptance: JsonObject): string[] {
  return [
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.owner_receipt_refs),
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.progress_delta_refs),
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.quality_publication_gate_refs),
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.typed_blocker_refs),
  ];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? unique(value.filter((entry): entry is string => typeof entry === 'string'))
    : [];
}

function records(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonObject => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}

function handoffTasks(agentLabHandoff: JsonObject): JsonObject[] {
  return records(agentLabHandoff.external_suite_seed?.tasks);
}

function ownerRouteRef(ownerRoute: unknown): string | null {
  if (typeof ownerRoute !== 'string' || ownerRoute.trim().length === 0) {
    return null;
  }
  const normalized = ownerRoute.trim();
  if (normalized === 'MedAutoScience') {
    return 'owner-route:mas/MedAutoScience';
  }
  if (normalized === 'one-person-lab') {
    return 'owner-route:opl/one-person-lab';
  }
  return normalized.startsWith('owner-route:') ? normalized : `owner-route:${normalized}`;
}

function productionEvidenceGate(contracts: MasContracts): JsonObject {
  const tasks = handoffTasks(contracts.agentLabHandoff);
  const handoffGateIds = tasks
    .map((task) => (typeof task.gate_id === 'string' ? task.gate_id : null))
    .filter((gateId): gateId is string => Boolean(gateId));
  const routeRefs = unique(
    tasks.map((task) => ownerRouteRef(task.owner_route)).filter((ref): ref is string => Boolean(ref)),
  );
  const requiredReceiptRefs = unique([
    ...ownerRouteRefs(contracts.productionAcceptance),
    ...tasks.flatMap((task) => textList(task.required_mas_return_shapes).map((shape) => `required-mas-return-shape:${shape}`)),
  ]);
  return {
    surface_kind: 'mas_production_evidence_gate_refs',
    gate_ids: handoffGateIds.length > 0
      ? handoffGateIds
      : [
          'real_paper_line_provider_canary',
          'memory_artifact_human_gate_scaleout',
          'provider_slo_long_soak',
        ],
    owner_route_refs: routeRefs.length > 0 ? routeRefs : ['owner-route:mas/MedAutoScience'],
    no_forbidden_write_proof_refs: ['no-forbidden-write:mas/production-evidence-tail'],
    typed_blocker_refs: ['typed-blocker-ref:mas/production-evidence-tail/owner-receipt-required'],
    required_owner_receipt_refs: requiredReceiptRefs.length > 0
      ? requiredReceiptRefs
      : ['required-owner-receipt-ref:mas/production-evidence-tail'],
    gate_result_refs: ['gate-result-ref:opl-agent-lab/mas-production-evidence-tail'],
    domain_verdict_claimed: false,
    source_handoff_ref: 'contracts/agent_lab_handoff.json',
  };
}

function buildMasAgentLabSuite({
  masRepo,
  contracts,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
}: {
  masRepo: string;
  contracts: MasContracts;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
}): JsonObject {
  const suiteSeed = [
    masRepo,
    contracts.productionAcceptance.domain_acceptance_receipt?.receipt_id,
    contracts.productionAcceptance.updated_at,
    aiReviewerEvaluationPath,
  ];
  const receiptRefs = ownerRouteRefs(contracts.productionAcceptance);
  const nextVerificationRefs = verificationRefs(contracts.productionAcceptance);
  const suiteKind = typeof contracts.agentLabHandoff.external_suite_seed?.suite_kind === 'string'
    ? contracts.agentLabHandoff.external_suite_seed.suite_kind
    : 'mas_production_evidence_suite';
  const suiteId = stableId('mas_agent_lab_suite', suiteSeed);
  return {
    suite_id: suiteId,
    suite_kind: suiteKind,
    suite_role: 'mas_production_evidence_tail_testing_takeover',
    source_contract_refs: [
      'contracts/production_acceptance/mas-production-acceptance.json',
      'contracts/agent_lab_handoff.json',
      'contracts/domain_descriptor.json',
      'contracts/generated_surface_handoff.json',
      'contracts/owner_receipt_contract.json',
    ],
    mas_production_evidence_gate: productionEvidenceGate(contracts),
    authority_boundary: {
      refs_only: true,
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_mutate_artifact_body: false,
      can_authorize_quality_verdict: false,
      can_update_current_package: false,
      can_promote_default_agent_without_gate: false,
      forbidden_write_surfaces: MAS_FORBIDDEN_WRITE_SURFACES,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:mas/production-evidence-tail/testing-takeover',
        domain_id: contracts.domainDescriptor.domain_id ?? 'med-autoscience',
        task_family: 'mas_production_evidence_tail_testing_takeover',
        target_agent_ref: 'domain-agent:med-autoscience',
        target_agent_descriptor_ref: path.join(masRepo, 'contracts/domain_descriptor.json'),
        environment: {
          environment_kind: 'external_repo_contract_intake',
          workspace_locator_ref: masRepo,
          sandbox_policy: 'refs_only_no_mas_domain_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:opl-meta-agent/mas-production-evidence-tail-testing-takeover',
        agent_entry_ref: 'domain-agent-entry:med-autoscience',
        stage_refs: [
          'stage:mas/production-acceptance-contract-read',
          'stage:mas/agent-lab-handoff-suite-generation',
          'stage:mas/no-forbidden-write-verification',
          'stage:mas/developer-work-order-materialization',
        ],
        oracle_refs: [
          'oracle:mas/domain-owned-production-acceptance',
          'oracle:mas/owner-receipt-or-typed-blocker-route',
        ],
        scorer_refs: [
          'scorer:mas/no-forbidden-write-proof',
          'scorer:mas/refs-only-evidence-tail-handoff',
        ],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:mas/production-evidence-tail/no-forbidden-write',
            probe_kind: 'no_forbidden_authority_write',
            expected_status: 'passed',
            source_refs: [
              'contracts/production_acceptance/mas-production-acceptance.json#/authority_boundary',
              'contracts/generated_surface_handoff.json#/generated_surface_policy/must_not_write',
            ],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:mas/production-evidence-tail/testing-takeover',
          run_ref: 'run:opl-meta-agent/mas-production-evidence-tail',
          agent_executor: 'codex_cli',
          stage_attempt_refs: [
            'stage-attempt:mas/production-acceptance-contract-read',
            'stage-attempt:mas/agent-lab-handoff-suite-generation',
          ],
          tool_call_refs: ['tool-call:opl-agent-lab-run-suite'],
          artifact_refs: [
            'mas-agent-lab-suite.json',
            'developer-patch-work-order.json',
            'mas-capability-improvement-candidate.json',
            'mechanism-patch-proposal.json',
          ],
          receipt_refs: receiptRefs,
          repair_refs: [
            'repair-ref:mas/evidence-tail/no-active-caller-proof',
            'repair-ref:mas/evidence-tail/opl-generated-surface-parity',
            'repair-ref:mas/evidence-tail/domain-receipt-parity',
            'repair-ref:mas/evidence-tail/independent-reviewer-auditor-receipt',
            'repair-ref:mas/evidence-tail/no-forbidden-write-proof',
          ],
          trace_refs: ['trace-ref:opl-meta-agent/mas-evidence-tail-testing-takeover'],
        },
        scorecard: {
          scorecard_ref: 'scorecard:mas/production-evidence-tail/testing-takeover',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: Boolean(aiReviewerEvaluation),
          metric_refs: [
            'metric-ref:mas/no-forbidden-write-proof',
            'metric-ref:mas/target-owner-route-present',
            'metric-ref:mas/editable-surfaces-limited',
            'metric-ref:mas/verification-command-refs-present',
            'metric-ref:mas/ai-reviewer-evaluation-present',
          ],
          evidence_refs: [
            'contracts/production_acceptance/mas-production-acceptance.json',
            'contracts/generated_surface_handoff.json',
            'contracts/owner_receipt_contract.json',
            ...receiptRefs,
            ...nextVerificationRefs,
            ...(aiReviewerEvaluationPath ? [aiReviewerEvaluationPath] : []),
          ],
          review_refs: aiReviewerEvaluationPath ? [aiReviewerEvaluationPath] : [],
          quality_gate_refs: [
            'quality-gate:mas/domain-owner-receipt-or-typed-blocker',
            'quality-gate:mas/independent-reviewer-auditor-required',
          ],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:mas/production-evidence-tail/foundry-testing-takeover',
          candidate_kind: 'production_evidence_tail_capability_gap',
          target_ref: 'domain-agent:med-autoscience/production-evidence-tail',
          evidence_refs: [
            'contracts/production_acceptance/mas-production-acceptance.json#/codex_first_landing_program/shared_blockers',
            ...receiptRefs,
          ],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:mas/production-evidence-tail/owner-gated',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:mas/production-evidence-tail/owner-gated',
          gate_status: aiReviewerEvaluation ? 'blocked_requires_owner_gate' : 'blocked_missing_ai_reviewer_evaluation',
          required_refs: [
            'scorecard:mas/production-evidence-tail/testing-takeover',
            'owner-receipt-refs:mas/production-evidence-tail',
            'no-forbidden-write:mas/production-evidence-tail',
            ...nextVerificationRefs,
          ],
          regression_suite_refs: [
            'regression-suite:mas/agent-lab-production-evidence-tail',
            'regression-suite:mas/no-forbidden-write-boundary',
          ],
          no_forbidden_write_proof_refs: ['no-forbidden-write:mas/production-evidence-tail'],
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

function buildOwnerReceiptRefs(contracts: MasContracts): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mas_owner_receipt_refs',
    version: 'opl-meta-agent.mas-owner-receipt-refs.v1',
    status: 'refs_only_no_owner_receipt_signed_by_meta_agent',
    owner: contracts.productionAcceptance.owner ?? 'MedAutoScience',
    receipt_refs: ownerRouteRefs(contracts.productionAcceptance),
    required_return_shapes: contracts.productionAcceptance.production_like_receipt_chain?.required_return_shapes ?? [],
    target_owner_route: {
      domain_ready_requires_mas_owner_receipt_or_typed_blocker:
        contracts.productionAcceptance.authority_boundary?.domain_ready_requires_mas_owner_receipt_or_typed_blocker === true,
      publication_ready_requires_mas_quality_publication_gate:
        contracts.productionAcceptance.authority_boundary?.publication_ready_requires_mas_quality_publication_gate === true,
      artifact_mutation_requires_mas_owner_receipt:
        contracts.productionAcceptance.authority_boundary?.artifact_mutation_requires_mas_owner_receipt === true,
    },
  };
}

function buildCapabilityCandidate({
  contracts,
  suite,
  suiteResult,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
}: {
  contracts: MasContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
}): JsonObject {
  const sharedBlockers = contracts.productionAcceptance.codex_first_landing_program?.parallel_execution_model?.shared_blockers ?? [];
  return {
    surface_kind: 'opl_meta_agent_mas_capability_improvement_candidate',
    version: 'opl-meta-agent.mas-capability-improvement-candidate.v1',
    candidate_id: stableId('oma_mas_capability_candidate', [suite.suite_id, suiteResult.result_id, sharedBlockers]),
    status: aiReviewerEvaluation
      ? 'candidate_recorded_requires_mas_owner_gate'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: {
      domain_id: contracts.domainDescriptor.domain_id ?? 'med-autoscience',
      domain_label: contracts.domainDescriptor.domain_label ?? 'Med Auto Science',
      owner: contracts.productionAcceptance.owner ?? 'MedAutoScience',
      generated_surface_owner: contracts.domainDescriptor.generated_surface_owner ?? 'one-person-lab',
    },
    source_agent_lab_suite: {
      suite_id: suite.suite_id,
      result_id: suiteResult.result_id,
      result_status: suiteResult.status,
    },
    source_contract_refs: suite.source_contract_refs,
    target_owner_route: buildOwnerReceiptRefs(contracts).target_owner_route,
    proposed_change_refs: [
      'mas:evidence-tail/no-active-caller-proof',
      'mas:evidence-tail/opl-generated-surface-parity',
      'mas:evidence-tail/domain-receipt-parity',
      'mas:evidence-tail/independent-reviewer-auditor-receipt',
      'mas:evidence-tail/no-forbidden-write-proof',
    ],
    editable_surface_limits: {
      editable_surfaces: MAS_EDITABLE_SURFACES,
      forbidden_write_surfaces: MAS_FORBIDDEN_WRITE_SURFACES,
      proposal_only: true,
      refs_only: true,
    },
    no_forbidden_write: {
      required: true,
      proof_refs: ['no-forbidden-write:mas/production-evidence-tail'],
      can_write_mas_domain_truth: false,
      can_write_publication_verdict: false,
      can_write_memory_body: false,
      can_write_current_package: false,
    },
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
    ai_reviewer_status: aiReviewerEvaluation ? 'present' : 'missing_typed_blocker_required',
  };
}

function buildDeveloperWorkOrder({
  contracts,
  suite,
  suiteResult,
  capabilityCandidate,
  ownerReceiptRefsPath,
}: {
  contracts: MasContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  capabilityCandidate: JsonObject;
  ownerReceiptRefsPath: string;
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mas_developer_patch_work_order',
    version: 'opl-meta-agent.mas-developer-patch-work-order.v1',
    work_order_id: stableId('oma_mas_developer_work_order', [
      suite.suite_id,
      suiteResult.result_id,
      capabilityCandidate.candidate_id,
    ]),
    status: capabilityCandidate.ai_reviewer_status === 'present'
      ? 'ready_for_mas_source_patch_proposal'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    mas_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_refs_ref: ownerReceiptRefsPath,
    target_owner_route: capabilityCandidate.target_owner_route,
    editable_surface_limits: capabilityCandidate.editable_surface_limits,
    proposed_change_refs: capabilityCandidate.proposed_change_refs,
    implementation_controls: {
      proposal_only: true,
      refs_only: true,
      patch_must_be_limited_to_editable_surfaces: true,
      developer_must_read_mas_repo_context_before_editing: true,
      mas_owner_receipt_or_typed_blocker_required: true,
      independent_reviewer_or_auditor_receipt_required: true,
      no_forbidden_write_proof_required: true,
      verification_command_refs_required: true,
      forbidden_write_surfaces: MAS_FORBIDDEN_WRITE_SURFACES,
    },
    no_forbidden_write: capabilityCandidate.no_forbidden_write,
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
  };
}

function buildMechanismPatchProposal({
  suite,
  suiteResult,
  capabilityCandidate,
  workOrder,
  ownerReceiptRefsPath,
}: {
  suite: JsonObject;
  suiteResult: JsonObject;
  capabilityCandidate: JsonObject;
  workOrder: JsonObject;
  ownerReceiptRefsPath: string;
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mechanism_patch_proposal',
    version: 'opl-meta-agent.mechanism-patch-proposal.v1',
    proposal_id: stableId('oma_mas_mechanism_patch', [
      suite.suite_id,
      suiteResult.result_id,
      capabilityCandidate.candidate_id,
      workOrder.work_order_id,
    ]),
    status: 'proposal_recorded_requires_mas_owner_gate',
    mechanism_ref: 'mechanism:opl-meta-agent/mas-production-evidence-tail/testing-takeover',
    editable_surfaces: [
      'mas_agent_pack_refs',
      'mas_owner_receipt_refs',
      'mas_no_forbidden_write_proof_refs',
      'mas_test_refs',
      'mas_status_doc_refs',
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
      evidence_delta_ref: 'evidence-delta:mas/production-evidence-tail/testing-takeover',
      source_refs: capabilityCandidate.proposed_change_refs,
    },
    edit: {
      next_mechanism_candidate_ref: capabilityCandidate.candidate_id,
      proposed_change_refs: capabilityCandidate.proposed_change_refs,
      editable_surfaces: capabilityCandidate.editable_surface_limits.editable_surfaces,
      source_refs: [workOrder.work_order_id],
    },
    promotion_gate_ref: 'promotion-gate:mas/production-evidence-tail/owner-gated',
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_update_current_package: false,
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
  contracts: MasContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  workOrder: JsonObject;
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mas_evidence_takeover_typed_blocker',
    version: 'opl-meta-agent.mas-evidence-takeover-typed-blocker.v1',
    blocker_id: stableId('oma_mas_evidence_blocker', [suite.suite_id, suiteResult.result_id, workOrder.work_order_id]),
    status: 'blocked_missing_ai_reviewer_evaluation',
    blocked_reason: 'ai_reviewer_evaluation_required_before_mechanism_patch_proposal_or_delivery_receipt',
    next_owner: 'opl-meta-agent',
    target_owner_route: buildOwnerReceiptRefs(contracts).target_owner_route,
    work_order_ref: workOrder.work_order_id,
    required_input_refs: ['--ai-reviewer-evaluation <json>'],
    no_forbidden_write: workOrder.no_forbidden_write,
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    authority_boundary: {
      typed_blocker_only: true,
      no_delivery_receipt_signed: true,
      can_write_mas_domain_truth: false,
      can_authorize_publication_quality: false,
      can_mutate_artifact_body: false,
      can_write_memory_body: false,
      can_update_current_package: false,
    },
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outputDir, { recursive: true });
  const contracts = loadMasContracts(args.masRepo);
  const aiReviewerEvaluation = args.aiReviewerEvaluationPath
    ? loadAiReviewerEvaluation(args.aiReviewerEvaluationPath)
    : null;

  const suite = buildMasAgentLabSuite({
    masRepo: args.masRepo,
    contracts,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
  });
  const suitePath = path.join(args.outputDir, 'mas-agent-lab-suite.json');
  writeJson(suitePath, suite);

  const agentLabRun = runOpl(args.oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = (agentLabRun.agent_lab_run?.suite_result ?? {
    result_id: stableId('mas_agent_lab_result', [suite.suite_id, 'missing-opl-suite-result']),
    status: 'blocked',
    summary: {
      recovery_probe_count: 1,
      recovery_passed_count: 0,
      forbidden_authority_flag_count: 0,
    },
  }) as JsonObject;

  const ownerReceiptRefs = buildOwnerReceiptRefs(contracts);
  const ownerReceiptRefsPath = path.join(args.outputDir, 'owner-receipt-refs.json');
  writeJson(ownerReceiptRefsPath, ownerReceiptRefs);

  const capabilityCandidate = buildCapabilityCandidate({
    contracts,
    suite,
    suiteResult,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
  });
  const capabilityPath = path.join(args.outputDir, 'mas-capability-improvement-candidate.json');
  writeJson(capabilityPath, capabilityCandidate);

  const workOrder = buildDeveloperWorkOrder({
    contracts,
    suite,
    suiteResult,
    capabilityCandidate,
    ownerReceiptRefsPath,
  });
  const workOrderPath = path.join(args.outputDir, 'developer-patch-work-order.json');
  writeJson(workOrderPath, workOrder);

  const runPath = path.join(args.outputDir, 'mas-agent-lab-suite-run.json');
  writeJson(runPath, agentLabRun);

  const artifacts: JsonObject = {
    mas_agent_lab_suite_path: suitePath,
    mas_agent_lab_suite_run_path: runPath,
    owner_receipt_refs_path: ownerReceiptRefsPath,
    mas_capability_improvement_candidate_path: capabilityPath,
    developer_patch_work_order_path: workOrderPath,
  };
  const learningLoop: JsonObject = {
    owner_receipt_refs: ownerReceiptRefs,
    mas_capability_improvement_candidate: capabilityCandidate,
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
    });
    const mechanismPath = path.join(args.outputDir, 'mechanism-patch-proposal.json');
    writeJson(mechanismPath, mechanismPatchProposal);
    artifacts.mechanism_patch_proposal_path = mechanismPath;
    learningLoop.mechanism_patch_proposal = mechanismPatchProposal;
    status = suiteResult.status === 'passed'
      ? 'proposal_recorded_requires_mas_owner_gate'
      : 'blocked_with_developer_patch_work_order';
  } else {
    const typedBlocker = buildTypedBlocker({ contracts, suite, suiteResult, workOrder });
    const typedBlockerPath = path.join(args.outputDir, 'typed-blocker.json');
    writeJson(typedBlockerPath, typedBlocker);
    artifacts.typed_blocker_path = typedBlockerPath;
    learningLoop.typed_blocker = typedBlocker;
  }

  process.stdout.write(`${JSON.stringify({
    surface_kind: 'opl_meta_agent_mas_evidence_takeover_result',
    version: 'opl-meta-agent.mas-evidence-takeover.v1',
    status,
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_mas_domain_truth: false,
      can_write_mas_memory_body: false,
      can_mutate_mas_artifact_body: false,
      can_authorize_mas_publication_or_export_verdict: false,
      can_update_current_package: false,
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

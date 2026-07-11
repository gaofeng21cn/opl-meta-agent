import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs as parseNodeArgs } from 'node:util';
import type { JsonObject } from './domain-pack.ts';
import { readJson } from './meta-agent-loop-io.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  firstString,
  noForbiddenWriteProofRefs,
  ownerRouteRef,
  productionAcceptanceEvidenceRefs,
  records,
  refsFromEntries,
  requiredReturnShapes,
  stringValue,
  taskRequiredReturnShapeRefs,
  uniqueRefs,
} from './work-order-refs.ts';

export type AgentContracts = {
  productionAcceptance: JsonObject;
  productionAcceptanceRef: string;
  agentLabHandoff: JsonObject;
  domainDescriptor: JsonObject;
  generatedSurfaceHandoff: JsonObject;
  ownerReceiptContract: JsonObject;
};

export type TargetAgentIdentity = {
  domainId: string;
  domainLabel: string;
  owner: string;
  generatedSurfaceOwner: string;
  targetAgentRef: string;
};

export const TARGET_AGENT_EDITABLE_SURFACES = [
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

export const TARGET_AGENT_FORBIDDEN_WRITE_SURFACES = [
  ...DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  'target export verdict',
  'target owner receipt body',
  'default agent promotion without gate',
];

type MutableAgentEvidenceArgs = {
  agentRepo: string | null;
  outputDir: string | null;
  productionAcceptancePath: string | null;
  aiReviewerEvaluationPath: string | null;
};

type ContractRef = {
  absolutePath: string;
  ref: string;
};

// `external_suite_seed` is target-owned intake from its handoff contract, never OMA output.
function targetOwnedExternalSuiteSeedTasks(agentLabHandoff: JsonObject): JsonObject[] {
  return records(agentLabHandoff.external_suite_seed?.tasks);
}

export function targetAgentIdentity(contracts: AgentContracts, agentRepo: string): TargetAgentIdentity {
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

export function sourceContractRefs(contracts: AgentContracts): string[] {
  return [
    contracts.productionAcceptanceRef,
    'contracts/agent_lab_handoff.json',
    'contracts/domain_descriptor.json',
    'contracts/generated_surface_handoff.json',
    'contracts/owner_receipt_contract.json',
  ];
}

export function productionEvidenceGate(contracts: AgentContracts, targetAgent: TargetAgentIdentity): JsonObject {
  const tasks = targetOwnedExternalSuiteSeedTasks(contracts.agentLabHandoff);
  const handoffGateIds = tasks
    .map((task) => stringValue(task.gate_id))
    .filter((gateId): gateId is string => Boolean(gateId));
  const routeRefs = uniqueRefs(
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
    typed_blocker_refs: uniqueRefs([
      ...refsFromEntries(contracts.productionAcceptance.domain_acceptance_receipt?.typed_blocker_refs),
      `typed-blocker-ref:${targetAgent.domainId}/production-evidence-tail/owner-receipt-required`,
    ]),
    required_return_shapes: requiredReturnShapes(contracts),
    required_owner_receipt_refs: evidenceRefs.length > 0 || returnShapeRefs.length > 0
      ? uniqueRefs([...evidenceRefs, ...returnShapeRefs])
      : [`required-owner-receipt-ref:${targetAgent.domainId}/production-evidence-tail`],
    gate_result_refs: [`gate-result-ref:opl-agent-lab/${targetAgent.domainId}/production-evidence-tail`],
    domain_verdict_claimed: false,
    source_handoff_ref: 'contracts/agent_lab_handoff.json',
  };
}

export function parseAgentEvidenceArgs(argv: string[]) {
  const parsed: MutableAgentEvidenceArgs = {
    agentRepo: null,
    outputDir: null,
    productionAcceptancePath: null,
    aiReviewerEvaluationPath: null,
  };

  const { values } = parseNodeArgs({
    args: argv,
    options: {
      'agent-repo': { type: 'string' },
      'production-acceptance': { type: 'string' },
      'output-dir': { type: 'string' },
      'ai-reviewer-evaluation': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (typeof values['agent-repo'] === 'string') {
    parsed.agentRepo = requiredPathValue('--agent-repo', values['agent-repo']);
  }
  if (typeof values['production-acceptance'] === 'string') {
    parsed.productionAcceptancePath = requiredValue('--production-acceptance', values['production-acceptance']);
  }
  if (typeof values['output-dir'] === 'string') {
    parsed.outputDir = requiredPathValue('--output-dir', values['output-dir']);
  }
  if (typeof values['ai-reviewer-evaluation'] === 'string') {
    parsed.aiReviewerEvaluationPath = requiredPathValue('--ai-reviewer-evaluation', values['ai-reviewer-evaluation']);
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
    productionAcceptancePath: parsed.productionAcceptancePath,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function requiredValue(token: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing value for ${token}.`);
  }
  return value;
}

function requiredPathValue(token: string, value: string | undefined): string {
  return path.resolve(requiredValue(token, value));
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

export function loadAgentContracts(agentRepo: string, productionAcceptancePath: string | null): AgentContracts {
  const productionAcceptance = resolveProductionAcceptance(agentRepo, productionAcceptancePath);
  const refs = {
    agentLabHandoff: requiredContract(agentRepo, 'contracts/agent_lab_handoff.json'),
    domainDescriptor: requiredContract(agentRepo, 'contracts/domain_descriptor.json'),
    generatedSurfaceHandoff: requiredContract(agentRepo, 'contracts/generated_surface_handoff.json'),
    ownerReceiptContract: requiredContract(agentRepo, 'contracts/owner_receipt_contract.json'),
  };
  return {
    productionAcceptance: readJson(productionAcceptance.absolutePath) as JsonObject,
    productionAcceptanceRef: productionAcceptance.ref,
    agentLabHandoff: readJson(refs.agentLabHandoff.absolutePath) as JsonObject,
    domainDescriptor: readJson(refs.domainDescriptor.absolutePath) as JsonObject,
    generatedSurfaceHandoff: readJson(refs.generatedSurfaceHandoff.absolutePath) as JsonObject,
    ownerReceiptContract: readJson(refs.ownerReceiptContract.absolutePath) as JsonObject,
  };
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs as parseNodeArgs } from 'node:util';
import type { JsonObject } from './domain-pack.ts';
import { readJson, resolveOplBin } from './meta-agent-loop-io.ts';
import type { AgentContracts } from './agent-evidence-materializer.ts';

type MutableAgentEvidenceArgs = {
  agentRepo: string | null;
  outputDir: string | null;
  oplBin: string;
  productionAcceptancePath: string | null;
  aiReviewerEvaluationPath: string | null;
};

type ContractRef = {
  absolutePath: string;
  ref: string;
};

export function parseAgentEvidenceArgs(argv: string[]) {
  const parsed: MutableAgentEvidenceArgs = {
    agentRepo: null,
    outputDir: null,
    oplBin: resolveOplBin(),
    productionAcceptancePath: null,
    aiReviewerEvaluationPath: null,
  };

  const { values } = parseNodeArgs({
    args: argv,
    options: {
      'agent-repo': { type: 'string' },
      'production-acceptance': { type: 'string' },
      'output-dir': { type: 'string' },
      'opl-bin': { type: 'string' },
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
  if (typeof values['opl-bin'] === 'string') {
    parsed.oplBin = resolveOplBin(requiredValue('--opl-bin', values['opl-bin']));
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
    oplBin: parsed.oplBin,
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

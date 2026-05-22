#!/usr/bin/env node
import path from 'node:path';
import {
  readJson,
  resolveOplBin,
  runOpl,
  writeJson,
} from './lib/meta-agent-loop.ts';
import type { JsonObject } from './lib/domain-pack.ts';

type ExecuteArgs = {
  workOrderPath: string;
  outputPath: string | null;
  oplBin: string;
  passthroughArgs: string[];
};

function parseArgs(argv: string[]): ExecuteArgs {
  const parsed: {
    workOrderPath: string | null;
    outputPath: string | null;
    oplBin: string;
    passthroughArgs: string[];
  } = {
    workOrderPath: null,
    outputPath: null,
    oplBin: resolveOplBin(),
    passthroughArgs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--') {
      parsed.passthroughArgs = argv.slice(index + 1);
      break;
    }
    if (token === '--work-order') {
      if (!value) {
        throw new Error('Missing value for --work-order.');
      }
      parsed.workOrderPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--output') {
      if (!value) {
        throw new Error('Missing value for --output.');
      }
      parsed.outputPath = path.resolve(value);
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
    throw new Error(`Unknown argument: ${token}.`);
  }

  if (!parsed.workOrderPath) {
    throw new Error('Missing required --work-order <path>.');
  }

  return {
    workOrderPath: parsed.workOrderPath,
    outputPath: parsed.outputPath,
    oplBin: parsed.oplBin,
    passthroughArgs: parsed.passthroughArgs,
  };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid external work order: missing ${field}.`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`Invalid external work order: missing ${field}.`);
  }
  return value;
}

function assertExternalWorkOrderIsDelegable(workOrder: JsonObject): void {
  requireString(workOrder.work_order_id, 'work_order_id');
  if (workOrder.surface_kind !== 'opl_meta_agent_developer_patch_work_order') {
    throw new Error('Invalid external work order: surface_kind must be opl_meta_agent_developer_patch_work_order.');
  }
  if (workOrder.status !== 'ready_for_target_agent_source_patch') {
    throw new Error('Invalid external work order: status must be ready_for_target_agent_source_patch.');
  }
  const executorLeaseRef = requireString(workOrder.executor_lease_ref, 'executor_lease_ref');
  if (!executorLeaseRef.startsWith('executor-lease:codex-cli/')) {
    throw new Error('Invalid external work order: executor_lease_ref must be a Codex CLI lease.');
  }
  requireStringArray(workOrder.reviewer_pool_refs, 'reviewer_pool_refs');
  requireString(workOrder.patch_execution_bundle_ref, 'patch_execution_bundle_ref');
  requireStringArray(workOrder.target_closeout_refs, 'target_closeout_refs');

  const authority = workOrder.authority_boundary as JsonObject | undefined;
  if (!authority) {
    throw new Error('Invalid external work order: missing authority_boundary.');
  }
  [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
  ].forEach((field) => {
    if (authority[field] !== false) {
      throw new Error(`Invalid external work order: authority_boundary.${field} must be false.`);
    }
  });
}

function buildOplArgs(args: ExecuteArgs): string[] {
  return [
    'agent-lab',
    'execute-work-order',
    '--work-order',
    args.workOrderPath,
    '--json',
    ...args.passthroughArgs,
  ];
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const workOrder = readJson(args.workOrderPath);
  assertExternalWorkOrderIsDelegable(workOrder);

  const oplArgs = buildOplArgs(args);
  const oplResult = runOpl(args.oplBin, oplArgs);
  const payload = {
    surface_kind: 'opl_meta_agent_external_work_order_execution_delegation',
    version: 'opl-meta-agent.external-work-order-execution-delegation.v1',
    status: 'delegated_to_opl_agent_lab',
    owner: 'opl-meta-agent',
    work_order_ref: workOrder.work_order_id,
    work_order_path: args.workOrderPath,
    oma_target_worktree_lifecycle_owner: false,
    target_worktree_lifecycle_owner: 'one-person-lab/OPL Agent Lab',
    delegated_without_generic_runner: true,
    delegated_without_target_queue_or_absorb: true,
    opl_agent_lab_command: {
      command: 'agent-lab execute-work-order',
      opl_bin: args.oplBin,
      args: oplArgs,
      passthrough_args: args.passthroughArgs,
    },
    authority_boundary: {
      can_manage_target_worktree_lifecycle: false,
      can_absorb_target_branch: false,
      can_clean_target_worktree: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    opl_result: oplResult,
  };

  if (args.outputPath) {
    writeJson(args.outputPath, payload);
  } else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  }
}

main();

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';

const DEFAULT_OPL_BIN = '/Users/gaofeng/workspace/one-person-lab/bin/opl';

export type TargetAgent = {
  domain_id: string;
  domain_label?: string | null;
  delivery_domain?: string | null;
  target_brief?: string | null;
  descriptor_ref?: string;
  repo_dir?: string;
  descriptor?: JsonObject | null;
};

export function resolveOplBin(value = process.env.OPL_BIN ?? DEFAULT_OPL_BIN): string {
  return path.resolve(value);
}

export function runOpl(oplBin: string, args: string[]): JsonObject {
  const result = spawnSync(oplBin, args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      NODE_NO_WARNINGS: '1',
    },
  });

  if (result.status !== 0) {
    throw new Error(`OPL command failed: ${oplBin} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OPL command did not return JSON: ${oplBin} ${args.join(' ')}\n${result.stdout}\n${message}`);
  }
}

export function stableId(prefix: string, payload: unknown): string {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  return `${prefix}_${hash}`;
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function readTargetAgent(targetAgentDir: string, fallback: Partial<TargetAgent> = {}): TargetAgent {
  const descriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const descriptor = fs.existsSync(descriptorPath) ? readJson(descriptorPath) : null;

  return {
    domain_id: descriptor?.domain_id ?? fallback.domain_id,
    domain_label: descriptor?.domain_label ?? fallback.domain_label,
    delivery_domain: descriptor?.delivery_domain ?? fallback.delivery_domain,
    target_brief: descriptor?.target_brief ?? fallback.target_brief,
    descriptor_ref: descriptorPath,
    repo_dir: targetAgentDir,
    descriptor,
  };
}

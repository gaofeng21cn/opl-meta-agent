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
  target_kind?: string | null;
  target_brief?: string | null;
  selected_opl_profile_refs?: string[] | null;
  profile_selection_rationale?: string | null;
  profile_requirement_refs?: string[] | null;
  reference_design_source_refs?: string[] | null;
  reference_design_pattern_notes?: string[] | null;
  reference_design_pattern_packet_refs?: string[] | null;
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

function requireString(value: unknown, field: string, descriptorPath: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Target agent descriptor is missing ${field}: ${descriptorPath}`);
  }
  return value.trim();
}

function optionalStringArray(value: unknown, field: string, descriptorPath: string): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.trim())) {
    throw new Error(`Target agent descriptor ${field} must be a non-empty string array when present: ${descriptorPath}`);
  }
  const entries = value.map((entry) => entry.trim());
  return entries.length > 0 ? entries : undefined;
}

function optionalString(value: unknown, field: string, descriptorPath: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Target agent descriptor ${field} must be a non-empty string when present: ${descriptorPath}`);
  }
  return value.trim();
}

export function readTargetAgent(targetAgentDir: string): TargetAgent {
  const domainDescriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const capabilityPackDescriptorPath = path.join(targetAgentDir, 'contracts', 'capability_pack_descriptor.json');
  const descriptorPath = fs.existsSync(domainDescriptorPath)
    ? domainDescriptorPath
    : capabilityPackDescriptorPath;
  if (!fs.existsSync(descriptorPath)) {
    throw new Error(
      `Target descriptor is required: ${domainDescriptorPath} or ${capabilityPackDescriptorPath}`,
    );
  }

  const descriptor = readJson(descriptorPath);
  const referenceDesignSourceRefs = optionalStringArray(
    descriptor.reference_design_source_refs,
    'reference_design_source_refs',
    descriptorPath,
  );
  const referenceDesignPatternNotes = optionalStringArray(
    descriptor.reference_design_pattern_notes,
    'reference_design_pattern_notes',
    descriptorPath,
  );
  const referenceDesignPatternPacketRefs = optionalStringArray(
    descriptor.reference_design_pattern_packet_refs,
    'reference_design_pattern_packet_refs',
    descriptorPath,
  );
  const selectedOplProfileRefs = optionalStringArray(
    descriptor.selected_opl_profile_refs ?? descriptor.selected_profile_refs,
    'selected_opl_profile_refs',
    descriptorPath,
  );
  const profileRequirementRefs = optionalStringArray(
    descriptor.profile_requirement_refs,
    'profile_requirement_refs',
    descriptorPath,
  );
  const domainId = requireString(
    descriptor.domain_id ?? descriptor.capability_pack_id,
    'domain_id or capability_pack_id',
    descriptorPath,
  );
  const targetKind = typeof descriptor.target_kind === 'string'
    ? descriptor.target_kind
    : typeof descriptor.surface_kind === 'string' && descriptor.surface_kind.includes('capability_pack')
      ? 'capability_pack'
      : 'domain_agent';

  return {
    domain_id: domainId,
    domain_label: typeof descriptor.domain_label === 'string'
      ? descriptor.domain_label
      : typeof descriptor.capability_pack_label === 'string'
        ? descriptor.capability_pack_label
        : null,
    delivery_domain: typeof descriptor.delivery_domain === 'string'
      ? descriptor.delivery_domain
      : targetKind === 'capability_pack'
        ? 'capability_pack'
        : null,
    target_kind: targetKind,
    target_brief: typeof descriptor.target_brief === 'string' ? descriptor.target_brief : null,
    ...(selectedOplProfileRefs ? { selected_opl_profile_refs: selectedOplProfileRefs } : {}),
    ...(optionalString(descriptor.profile_selection_rationale, 'profile_selection_rationale', descriptorPath)
      ? { profile_selection_rationale: optionalString(descriptor.profile_selection_rationale, 'profile_selection_rationale', descriptorPath) }
      : {}),
    ...(profileRequirementRefs ? { profile_requirement_refs: profileRequirementRefs } : {}),
    ...(referenceDesignSourceRefs ? { reference_design_source_refs: referenceDesignSourceRefs } : {}),
    ...(referenceDesignPatternNotes ? { reference_design_pattern_notes: referenceDesignPatternNotes } : {}),
    ...(referenceDesignPatternPacketRefs
      ? { reference_design_pattern_packet_refs: referenceDesignPatternPacketRefs }
      : {}),
    descriptor_ref: descriptorPath,
    repo_dir: targetAgentDir,
    descriptor,
  };
}

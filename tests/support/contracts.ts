import assertModule from 'node:assert/strict';
import fsModule from 'node:fs';
import osModule from 'node:os';
import pathModule from 'node:path';
import { spawnSync as spawnSyncFn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../../scripts/lib/domain-pack.ts';

export type { JsonObject };
export const assert: typeof assertModule = assertModule;
export const fs: typeof fsModule = fsModule;
export const os: typeof osModule = osModule;
export const path: typeof pathModule = pathModule;
export const spawnSync: typeof spawnSyncFn = spawnSyncFn;

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';
export const oplOwnerRepoRoot = process.env.OPL_OWNER_REPO_ROOT
  ?? '/Users/gaofeng/workspace/one-person-lab';
export const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');
export const oplSharedReleaseDependency =
  'git+https://github.com/gaofeng21cn/one-person-lab.git#05fc5aa4425acca0a5c6f3f02eafbc82ec902af4';
export const oplSharedReleaseCommit = '05fc5aa4425acca0a5c6f3f02eafbc82ec902af4';

export function asObjects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

export function asStrings(value: unknown): string[] {
  return value as string[];
}

export function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

export function readJsonFile(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJsonFile(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function readText(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

export function readOwnerJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(oplOwnerRepoRoot, relativePath), 'utf8'));
}

export function listMarkdownFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(entryRelativePath);
      }
      return entry.name.endsWith('.md') ? [entryRelativePath] : [];
    })
    .sort();
}

export function assertUsablePackFile(relativePath: string): void {
  const absolutePath = path.join(repoRoot, relativePath);
  assert.equal(fs.existsSync(absolutePath), true, `${relativePath} should exist`);
  const content = fs.readFileSync(absolutePath, 'utf8');
  assert.ok(content.trim().length > 0, `${relativePath} should not be empty`);
  assert.equal(placeholderPattern.test(content), false, `${relativePath} should not contain placeholder markers`);
}

export function assertRepoRefExists(relativePath: string): void {
  assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
}

export function assertCompleteStageNativeRefs(surface: JsonObject, label: string): void {
  assert.equal(surface.stage_json_ref, `stage-json-ref:opl-meta-agent/${label}`, `${label}.stage_json_ref`);
  assert.equal(
    surface.attempt_json_ref,
    `stage-attempt-json-ref:opl-meta-agent/${label}/{stage_attempt_id}`,
    `${label}.attempt_json_ref`,
  );
  assert.equal(
    surface.manifest_ref,
    `stage-manifest-ref:opl-meta-agent/${label}/{stage_attempt_id}`,
    `${label}.manifest_ref`,
  );
  assert.equal(
    surface.receipt_ref,
    `stage-attempt-receipt-ref:opl-meta-agent/${label}/{stage_attempt_id}`,
    `${label}.receipt_ref`,
  );
  assert.equal(
    surface.current_pointer_ref,
    `stage-current-pointer-ref:opl-meta-agent/${label}`,
    `${label}.current_pointer_ref`,
  );
  assert.equal(
    surface.canonical_artifact_ref,
    `canonical-artifact-ref:opl-meta-agent/${label}`,
    `${label}.canonical_artifact_ref`,
  );
  assert.equal(
    surface.export_ref,
    `stage-export-ref:opl-meta-agent/${label}/{stage_attempt_id}`,
    `${label}.export_ref`,
  );
  assert.equal(
    surface.lineage_ref,
    `stage-lineage-ref:opl-meta-agent/${label}/{stage_attempt_id}`,
    `${label}.lineage_ref`,
  );
  assert.equal(
    surface.retention_ref,
    `stage-retention-ref:opl-meta-agent/${label}/{stage_attempt_id}`,
    `${label}.retention_ref`,
  );
  assert.equal(
    surface.physical_kernel_locator_ref,
    `opl-physical-kernel-locator-ref:opl-meta-agent/${label}`,
    `${label}.physical_kernel_locator_ref`,
  );
  assert.equal(
    surface.conformance_ref,
    `stage-artifact-conformance-ref:opl-meta-agent/${label}`,
    `${label}.conformance_ref`,
  );
  assert.equal(
    surface.workbench_consumption_ref,
    `stage-artifact-workbench-consumption-ref:opl-meta-agent/${label}`,
    `${label}.workbench_consumption_ref`,
  );
}

export function assertNoForbiddenAuthority(surface: JsonObject, label: string): void {
  assert.equal(surface.owner, 'opl-meta-agent', `${label}.owner`);
  assert.equal(surface.authority_boundary.refs_only, true, `${label} should be refs-only`);
  assert.equal(surface.authority_boundary.not_generic_runtime_owner, true, `${label} should not own generic runtime`);
  assert.equal(surface.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(surface.authority_boundary.can_write_target_domain_memory_body, false);
  assert.equal(surface.authority_boundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(surface.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(surface.authority_boundary.can_promote_default_agent_without_gate, false);
}

export function assertNoActiveMorphologyForbiddenOwnerTokens(surface: JsonObject, label: string): void {
  const serialized = JSON.stringify(surface);
  const forbiddenOwnerTokens = [
    ['app', 'shell', 'owner'].join('_'),
    ['promotion', 'gate', 'owner'].join('_'),
  ];
  for (const token of forbiddenOwnerTokens) {
    assert.equal(
      serialized.includes(token),
      false,
      `${label} should not carry active forbidden morphology token ${token}`,
    );
  }
}

export function assertNoForbiddenDesignCenterVocabulary(relativePath: string): void {
  const content = readText(relativePath).toLowerCase();
  [
    /\bmed-autoscience\b/,
    /\bmed-autogrant\b/,
    /(?:^|[:/_.-])mas(?:$|[:/_.-])/,
    /(?:^|[:/_.-])mag(?:$|[:/_.-])/,
    /\bmedical\b/,
    /\bgrant\b/,
    /\bmanuscript\b/,
    /\bpublication\b/,
    /\bfundability\b/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(content), false, `${relativePath} should not match ${pattern}`);
  });
}

export const opl10PrincipleRefs = [
  'opl10:codex_cli_first_class_executor',
  'opl10:stage_led_execution',
  'opl10:declarative_domain_pack',
  'opl10:explicit_prompt_tools_knowledge',
  'opl10:refs_only_domain_truth_boundary',
  'opl10:receipted_handoff',
  'opl10:independent_ai_review_gate',
  'opl10:runtime_enforced_no_forbidden_writes',
  'opl10:generated_surfaces_from_contracts',
  'opl10:blockers_before_quality_or_promotion_claims',
];
export const userStageLogRequiredFields = [
  'stage_name',
  'problem_summary',
  'stage_goal',
  'stage_work_done',
  'changed_stage_surfaces',
  'outcome',
  'remaining_blockers',
  'evidence_refs',
];

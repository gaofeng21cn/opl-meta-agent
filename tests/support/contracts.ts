import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertJsonSchemaPayload } from 'opl-framework-shared/json-schema-registry';
import type { JsonObject } from '../../scripts/lib/domain-pack.ts';

export type { JsonObject };

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const oplBin = process.env.OPL_BIN
  ?? 'opl';
export const oplOwnerRepoRoot = process.env.OPL_OWNER_REPO_ROOT
  ?? '/Users/gaofeng/workspace/one-person-lab';
export const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');
export const oplSharedReleaseDependency =
  'git+https://github.com/gaofeng21cn/one-person-lab.git#f0a543e1728f8c1d35b2c5f2e035a6551a521507';
export const oplSharedReleaseCommit = 'f0a543e1728f8c1d35b2c5f2e035a6551a521507';

export function asObjects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

export function asStrings(value: unknown): string[] {
  return value as string[];
}

export function readJson(relativePath: string): JsonObject {
  return parseJsonText(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

export function readJsonFile(filePath: string): JsonObject {
  return parseJsonText(fs.readFileSync(filePath, 'utf8'));
}

export function assertMatchesJsonSchema(schemaRef: string, payload: unknown): void {
  const schema = readJson(schemaRef);
  assertJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, payload);
}

export function parseJsonText(text: string): JsonObject {
  return JSON.parse(text);
}

export function writeJsonFile(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function withTempDir<T>(prefix: string, run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function readText(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

export function readOwnerJson(relativePath: string): JsonObject {
  return parseJsonText(fs.readFileSync(path.join(oplOwnerRepoRoot, relativePath), 'utf8'));
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

export const readinessClaimFields = [
  'success_claimed',
  'closed_as_success',
  'target_agent_ready_claimed',
  'domain_ready_claimed',
  'production_ready_claimed',
  'production_readiness_verdict_claimed',
  'default_promotion_claimed',
  'long_soak_claimed',
];

export const targetAuthorityFalseFields = [
  'can_write_target_domain_truth',
  'can_write_target_domain_memory_body',
  'can_mutate_target_domain_artifact_body',
  'can_authorize_target_domain_quality_or_export',
  'can_claim_target_domain_ready',
  'can_claim_production_ready',
  'can_write_target_owner_receipt_body',
  'can_promote_default_agent_without_gate',
];

export const extendedTargetAuthorityFalseFields = [
  ...targetAuthorityFalseFields,
  'can_hold_target_artifact_authority',
  'can_manage_target_worktree_lifecycle',
  'can_own_generic_runner',
  'can_own_generic_queue_or_attempt_ledger',
];

export function assertOptionalFalseFlags(
  surface: JsonObject,
  label: string,
  fields: string[] = readinessClaimFields,
): void {
  fields.forEach((field) => {
    if (Object.hasOwn(surface, field)) assert.equal(surface[field], false, `${label}.${field}`);
  });
}

export function assertRefsOnlyAuthorityBoundary(
  boundary: JsonObject,
  label: string,
  fields: string[] = targetAuthorityFalseFields,
): void {
  assert.equal(boundary.refs_only, true, `${label}.refs_only`);
  fields.forEach((field) => {
    assert.equal(boundary[field], false, `${label}.${field}`);
  });
}

export function assertContractRefExists(ref: string): void {
  assertRepoRefExists(ref.split('#')[0]);
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

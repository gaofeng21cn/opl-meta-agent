import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, any>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = 'contracts/source_structure_policy.json';

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function sha256ForFiles(relativePaths: string[]): string {
  const hash = crypto.createHash('sha256');
  relativePaths.forEach((relativePath) => {
    const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(Buffer.byteLength(content)));
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  });
  return `sha256:${hash.digest('hex')}`;
}

function lineCount(relativePath: string): number {
  const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  if (content.length === 0) {
    return 0;
  }
  return content.endsWith('\n')
    ? content.slice(0, -1).split(/\r\n|\n|\r/).length
    : content.split(/\r\n|\n|\r/).length;
}

function trackedFiles(): string[] {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'git ls-files failed');
  }
  return result.stdout.split('\0').filter(Boolean).sort();
}

function matchesScope(relativePath: string, scanScope: JsonObject): boolean {
  const prefixes = scanScope.path_prefixes as string[];
  const extensions = scanScope.extensions as string[];
  const excluded = new Set(scanScope.excluded_paths as string[]);
  return !excluded.has(relativePath)
    && prefixes.some((prefix) => relativePath.startsWith(prefix))
    && extensions.some((extension) => relativePath.endsWith(extension));
}

function aggregateExemption(relativePath: string, policy: JsonObject): JsonObject | undefined {
  return (policy.generated_aggregate_exemptions as JsonObject[])
    .find((entry) => entry.aggregate_ref === relativePath);
}

function scriptRefsFromTrackedFiles(files: string[]): string[] {
  return files
    .filter((relativePath) => (
      relativePath.startsWith('scripts/')
      && ['.ts', '.sh'].some((extension) => relativePath.endsWith(extension))
    ))
    .sort();
}

function asStrings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${label} must be a string array`);
  }
  return [...value].sort() as string[];
}

function assertSameStringSet(actual: string[], expected: string[], label: string, violations: string[]): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    const missing = expectedSorted.filter((entry) => !actualSorted.includes(entry));
    const extra = actualSorted.filter((entry) => !expectedSorted.includes(entry));
    violations.push(`${label} drift: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
  }
}

function valueAtPath(source: JsonObject, dottedPath: string): JsonObject {
  return dottedPath.split('.').reduce<JsonObject>((current, segment) => {
    const value = current[segment];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${dottedPath} must resolve to a JSON object`);
    }
    return value as JsonObject;
  }, source);
}

function validateScriptToPackReceiptGuard(
  policy: JsonObject,
  tracked: string[],
  guardViolations: string[],
): string | undefined {
  const guard = policy.script_to_pack_receipt_guard as JsonObject | undefined;
  if (!guard) return undefined;

  const receipt = readJson(String(guard.receipt_ref));
  const authorityFunctions = readJson(String(guard.authority_functions_ref));
  const sourceReceipt = valueAtPath(authorityFunctions, String(guard.source_receipt_path));
  const scriptMorphology = valueAtPath(authorityFunctions, String(guard.script_morphology_path));
  const activeCallerScan = sourceReceipt.active_script_caller_scan as JsonObject;
  const sourceRefIntegrityGuard = scriptMorphology.source_ref_integrity_guard as JsonObject;
  const currentSummary = receipt.current_scan_summary as JsonObject;
  const trackedScriptRefs = scriptRefsFromTrackedFiles(tracked);
  const scannedScriptRefs = asStrings(sourceReceipt.scanned_script_refs, 'source_purity_scan_receipt.scanned_script_refs');
  const summaryScannedScriptRefs = asStrings(currentSummary.scanned_script_refs, 'current_scan_summary.scanned_script_refs');
  const gatedScriptRefs = asStrings(
    (scriptMorphology.script_to_pack_retirement_gates as JsonObject[])
      .flatMap((entry) => entry.tracked_script_refs as string[]),
    'script_morphology_policy.script_to_pack_retirement_gates.tracked_script_refs',
  );
  const summaryGatedScriptRefs = asStrings(currentSummary.gated_script_refs, 'current_scan_summary.gated_script_refs');
  const selfGuardRefs = asStrings(
    (scriptMorphology.active_caller_scan_policy as JsonObject).self_guard_test_refs,
    'script_morphology_policy.active_caller_scan_policy.self_guard_test_refs',
  );

  if (receipt.receipt_status !== 'current_script_morphology_machine_gate_passed') {
    guardViolations.push('script-to-pack receipt status must remain current_script_morphology_machine_gate_passed');
  }
  if (receipt.closure_status !== 'machine_gate_landed_not_success_readiness_or_retirement') {
    guardViolations.push('script-to-pack receipt closure_status must not claim success readiness or retirement');
  }
  if (sourceReceipt.status !== currentSummary.source_purity_scan_status) {
    guardViolations.push('script-to-pack current_scan_summary.source_purity_scan_status drift');
  }
  if (activeCallerScan.status !== currentSummary.active_script_caller_scan_status) {
    guardViolations.push('script-to-pack current_scan_summary.active_script_caller_scan_status drift');
  }
  if ((scriptMorphology.active_caller_scan_policy as JsonObject).policy_id !== currentSummary.active_caller_scan_policy_id) {
    guardViolations.push('script-to-pack current_scan_summary.active_caller_scan_policy_id drift');
  }
  if (sourceRefIntegrityGuard.guard_id !== currentSummary.source_ref_integrity_guard_id) {
    guardViolations.push('script-to-pack current_scan_summary.source_ref_integrity_guard_id drift');
  }
  if (currentSummary.source_ref_integrity_status !== 'passed') {
    guardViolations.push('script-to-pack source_ref_integrity_status must be passed');
  }
  if (Number(currentSummary.orphan_script_count) !== 0) {
    guardViolations.push('script-to-pack active caller scan reports orphan scripts');
  }
  if (Number(currentSummary.scanned_script_count) !== scannedScriptRefs.length) {
    guardViolations.push('script-to-pack current_scan_summary.scanned_script_count drift');
  }
  if (Number(currentSummary.gated_script_count) !== gatedScriptRefs.length) {
    guardViolations.push('script-to-pack current_scan_summary.gated_script_count drift');
  }
  if (Number(currentSummary.script_gate_count) !== (scriptMorphology.script_to_pack_retirement_gates as unknown[]).length) {
    guardViolations.push('script-to-pack current_scan_summary.script_gate_count drift');
  }
  assertSameStringSet(scannedScriptRefs, trackedScriptRefs, 'script-to-pack scanned_script_refs vs tracked scripts', guardViolations);
  assertSameStringSet(summaryScannedScriptRefs, scannedScriptRefs, 'script-to-pack summary scanned_script_refs', guardViolations);
  assertSameStringSet(summaryGatedScriptRefs, gatedScriptRefs, 'script-to-pack summary gated_script_refs', guardViolations);
  assertSameStringSet(selfGuardRefs, asStrings(currentSummary.active_caller_scan_self_guard_refs, 'current_scan_summary.active_caller_scan_self_guard_refs'), 'script-to-pack self guard refs', guardViolations);

  const forbiddenTrueClaims = [
    ['authority_boundary.can_authorize_script_retirement', receipt.authority_boundary?.can_authorize_script_retirement],
    ['authority_boundary.can_claim_OPL_primitive_parity', receipt.authority_boundary?.can_claim_OPL_primitive_parity],
    ['authority_boundary.can_promote_default_agent_without_gate', receipt.authority_boundary?.can_promote_default_agent_without_gate],
    ['authority_boundary.can_claim_target_domain_ready', receipt.authority_boundary?.can_claim_target_domain_ready],
    ['authority_boundary.can_claim_domain_ready', receipt.authority_boundary?.can_claim_domain_ready],
    ['authority_boundary.can_claim_production_ready', receipt.authority_boundary?.can_claim_production_ready],
  ];
  forbiddenTrueClaims.forEach(([label, value]) => {
    if (value !== false) {
      guardViolations.push(`script-to-pack receipt ${label} must be false`);
    }
  });

  return `script-to-pack receipt guard checked ${scannedScriptRefs.length} scripts, ${gatedScriptRefs.length} gated refs, ${activeCallerScan.orphan_script_count ?? 0} orphan scripts`;
}

function validateAggregateExemption(entry: JsonObject): string | undefined {
  const sourceRef = String(entry.source_contract_ref);
  const indexRef = String(entry.leaf_index_ref);
  const manifestRef = String(entry.bundle_manifest_ref);
  if (!fs.existsSync(path.join(repoRoot, sourceRef))) {
    return `${sourceRef} is missing`;
  }
  if (!fs.existsSync(path.join(repoRoot, indexRef))) {
    return `${indexRef} is missing`;
  }
  if (!fs.existsSync(path.join(repoRoot, manifestRef))) {
    return `${manifestRef} is missing`;
  }
  const source = readJson(sourceRef);
  const index = readJson(indexRef);
  const manifest = readJson(manifestRef);
  if (source.aggregate_ref !== entry.aggregate_ref) {
    return `${sourceRef} aggregate_ref does not match ${entry.aggregate_ref}`;
  }
  if (index.aggregate_ref !== entry.aggregate_ref) {
    return `${indexRef} aggregate_ref does not match ${entry.aggregate_ref}`;
  }
  if (manifest.aggregate_ref !== entry.aggregate_ref) {
    return `${manifestRef} aggregate_ref does not match ${entry.aggregate_ref}`;
  }
  if (source.leaf_index_ref !== indexRef) {
    return `${sourceRef} leaf_index_ref does not match ${indexRef}`;
  }
  if (source.bundle_manifest_ref !== manifestRef) {
    return `${sourceRef} bundle_manifest_ref does not match ${manifestRef}`;
  }
  if (index.bundle_manifest_ref !== manifestRef) {
    return `${indexRef} bundle_manifest_ref does not match ${manifestRef}`;
  }
  if (manifest.source_contract_ref !== sourceRef) {
    return `${manifestRef} source_contract_ref does not match ${sourceRef}`;
  }
  if (manifest.leaf_index_ref !== indexRef) {
    return `${manifestRef} leaf_index_ref does not match ${indexRef}`;
  }
  if (manifest.generator?.check_command !== entry.check_command) {
    return `${manifestRef} generator.check_command does not match ${entry.check_command}`;
  }
  if (
    entry.generated_consumer_surface_must_be_do_not_edit === true
    && manifest.generated_consumer_surface?.do_not_edit !== true
  ) {
    return `${manifestRef} generated_consumer_surface.do_not_edit must be true`;
  }
  const digestInputs = manifest.source_digest?.inputs;
  if (!Array.isArray(digestInputs)) {
    return `${manifestRef} source_digest.inputs must be an array`;
  }
  const digest = manifest.source_digest?.value;
  const expectedDigest = sha256ForFiles(digestInputs.map(String));
  if (digest !== expectedDigest) {
    return `${manifestRef} source_digest.value does not match source parts`;
  }
  return undefined;
}

const strict = process.argv.includes('--strict') || process.argv.includes('strict');
const policy = readJson(policyPath);
const lane = (policy.lanes as JsonObject)[strict ? 'strict' : 'advisory'] as JsonObject;
const budget = Number(lane.budget_lines);
const failOnOverBudget = Boolean(lane.fail_on_over_budget);
const tracked = trackedFiles();
const scanned = tracked.filter((relativePath) => matchesScope(relativePath, policy.scan_scope as JsonObject));
const violations: string[] = [];
const guardViolations: string[] = [];
const acceptedAggregates: string[] = [];
const scriptToPackReceiptGuardSummary = validateScriptToPackReceiptGuard(policy, tracked, guardViolations);

scanned.forEach((relativePath) => {
  const lines = lineCount(relativePath);
  if (lines <= budget) {
    return;
  }
  const exemption = aggregateExemption(relativePath, policy);
  if (exemption) {
    const exemptionError = validateAggregateExemption(exemption);
    if (!exemptionError) {
      acceptedAggregates.push(`${relativePath} (${lines} lines, generated aggregate)`);
      return;
    }
    violations.push(`${relativePath}: ${lines} lines, invalid generated aggregate exemption: ${exemptionError}`);
    return;
  }
  violations.push(`${relativePath}: ${lines} lines > ${budget}`);
});

console.log(`source structure ${strict ? 'strict' : 'advisory'} lane scanned ${scanned.length} tracked files`);
if (acceptedAggregates.length > 0) {
  console.log('accepted generated aggregates:');
  acceptedAggregates.forEach((entry) => console.log(`  ${entry}`));
}
if (scriptToPackReceiptGuardSummary) {
  console.log(scriptToPackReceiptGuardSummary);
}
if (guardViolations.length > 0) {
  console.log('script-to-pack receipt guard findings:');
  guardViolations.forEach((entry) => console.log(`  ${entry}`));
}
if (violations.length > 0) {
  console.log('line budget findings:');
  violations.forEach((entry) => console.log(`  ${entry}`));
}

if (guardViolations.length > 0) {
  process.exit(1);
}
if (violations.length > 0 && failOnOverBudget) {
  process.exit(1);
}

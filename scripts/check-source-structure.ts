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
const scanned = trackedFiles().filter((relativePath) => matchesScope(relativePath, policy.scan_scope as JsonObject));
const violations: string[] = [];
const acceptedAggregates: string[] = [];

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
if (violations.length > 0) {
  console.log('line budget findings:');
  violations.forEach((entry) => console.log(`  ${entry}`));
}

if (violations.length > 0 && failOnOverBudget) {
  process.exit(1);
}

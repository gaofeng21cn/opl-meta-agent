import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertRepoRefExists,
  repoRoot,
  readJson,
  readText,
  type JsonObject,
} from './contracts.ts';

export const DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF = 'contracts/developer_work_order_policy.json';
export const STANDARD_FOUNDRY_POLICIES_CONTRACT_REF = 'contracts/standard_foundry_policies.json';
export const STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF = 'contracts/stage_native_artifact_vocabulary.json';
export const ACTIVE_CALLER_SCAN_POLICY_ID = 'oma.script-active-caller-scan.v1';
export const SOURCE_PURITY_TEST_STRUCTURE_ANCHOR = 'source-purity-test-structure';

export function valuesAtDottedPath(contract: unknown, dottedPath: string): unknown[] {
  const values = dottedPath.split('.').reduce<unknown[]>((currentValues, segment) => (
    currentValues.flatMap((currentValue) => valuesAtSegment(currentValue, segment))
  ), [contract]);
  return values.flatMap((value) => Array.isArray(value) ? value : [value]);
}

export function valuesAtSegment(value: unknown, segment: string): unknown[] {
  if (Array.isArray(value)) {
    const selected = value.filter((entry) => (
      entry
      && typeof entry === 'object'
      && [
        'module_id',
        'tail_id',
        'gate_id',
        'action_id',
        'section_id',
      ].some((key) => (entry as JsonObject)[key] === segment)
    ));
    if (selected.length > 0) {
      return selected;
    }
    return value.flatMap((entry) => valuesAtSegment(entry, segment));
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  return Object.hasOwn(value as JsonObject, segment) ? [(value as JsonObject)[segment]] : [];
}

export function listFalseReadyScanSourceRefs(relativeRef: string): string[] {
  if (relativeRef === 'tests/source-purity.test.ts' || relativeRef.startsWith('tests/source-purity/')) {
    return [];
  }
  const absoluteRef = path.join(repoRoot, relativeRef);
  if (!fs.existsSync(absoluteRef)) return [];
  const stat = fs.statSync(absoluteRef);
  if (stat.isFile()) {
    return ['.json', '.ts', '.sh', '.yml', '.yaml'].includes(path.extname(relativeRef))
      ? [relativeRef]
      : [];
  }
  return fs.readdirSync(absoluteRef, { withFileTypes: true })
    .flatMap((entry) => listFalseReadyScanSourceRefs(path.join(relativeRef, entry.name)))
    .sort();
}

export function falseReadyLiteralParts(claimKey: string): string[] {
  return [
    `"${claimKey}": true`,
    `"${claimKey}": True`,
    `'${claimKey}': true`,
    `'${claimKey}': True`,
    `${claimKey}: true`,
    `${claimKey} = true`,
  ];
}

export function collectFalseReadyClaimMatchesFromSource(
  sourceRef: string,
  source: string,
  claimKeys: string[],
): { path: string; claimKey: string }[] {
  return claimKeys.flatMap((claimKey) => (
    falseReadyLiteralParts(claimKey).some((literal) => source.includes(literal))
      ? [{ path: sourceRef, claimKey }]
      : []
  ));
}

export function collectFalseReadyClaimMatches(claimKeys: string[]): { path: string; claimKey: string }[] {
  const scanRoots = ['agent', 'contracts', 'runtime', 'scripts', 'tests', 'package.json'];
  return scanRoots.flatMap((rootRef) => (
    listFalseReadyScanSourceRefs(rootRef).flatMap((sourceRef) => {
      const source = fs.readFileSync(path.join(repoRoot, sourceRef), 'utf8');
      return collectFalseReadyClaimMatchesFromSource(sourceRef, source, claimKeys);
    })
  ));
}

export function sourceRefIntegrityViolations(scriptRef: string): string[] {
  const normalized = scriptRef.replaceAll('\\', '/');
  const parts = normalized.split('/');
  const violations: string[] = [];
  if (scriptRef.trim() === '') violations.push('empty_ref');
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(scriptRef) || scriptRef.includes('://')) {
    violations.push('uri_or_url');
  }
  if (path.isAbsolute(scriptRef) || normalized.startsWith('/')) {
    violations.push('absolute_path');
  }
  if (parts.includes('..')) violations.push('parent_directory_traversal');
  if (scriptRef.startsWith('human_doc:')) violations.push('human_doc_ref_as_machine_source_ref');
  if (!normalized.startsWith('scripts/')) violations.push('non_scripts_root');
  return violations;
}

export function assertRepoLocalScriptRef(scriptRef: string): void {
  assert.deepEqual(sourceRefIntegrityViolations(scriptRef), [], `${scriptRef} should be a repo-local script ref`);
  assert.ok(['.ts', '.sh'].includes(path.extname(scriptRef)), `${scriptRef} should be a tracked script extension`);
  assertRepoRefExists(scriptRef);
}

export function sourcePuritySelfGuardRefs(policy: JsonObject): string[] {
  return [
    ...new Set([
      ...(Array.isArray(policy.self_guard_test_refs) ? policy.self_guard_test_refs as string[] : []),
      ...(typeof policy.self_guard_test_ref === 'string' ? [policy.self_guard_test_ref] : []),
    ]),
  ].sort();
}

export function sourceRefIsSelfGuard(sourceRef: string, selfGuardRefs: string[]): boolean {
  return selfGuardRefs.some((selfGuardRef) => (
    sourceRef === selfGuardRef || sourceRef.startsWith(`${selfGuardRef.replace(/\/?$/, '/')}`)
  ));
}

export function assertPolicyStringList(contract: JsonObject, field: string): string[] {
  const value = contract[field];
  assert.ok(Array.isArray(value), `${field} should be a string array`);
  assert.ok(value.length > 0, `${field} should not be empty`);
  value.forEach((entry) => {
    assert.equal(typeof entry, 'string', `${field} entries should be strings`);
    assert.notEqual(entry.trim(), '', `${field} entries should not be blank`);
  });
  return value as string[];
}

export function assertPolicyObject(contract: JsonObject, field: string): JsonObject {
  const value = contract[field];
  assert.equal(typeof value, 'object', `${field} should be a JSON object`);
  assert.notEqual(value, null, `${field} should be a JSON object`);
  assert.equal(Array.isArray(value), false, `${field} should be a JSON object`);
  return value as JsonObject;
}

export function asBooleanRecord(value: unknown): Record<string, boolean> {
  assert.equal(typeof value, 'object', 'boundary should be a JSON object');
  assert.notEqual(value, null, 'boundary should be a JSON object');
  assert.equal(Array.isArray(value), false, 'boundary should be a JSON object');
  return value as Record<string, boolean>;
}

export function assertFalseFlags(record: Record<string, boolean>, flags: string[], label: string): void {
  flags.forEach((flag) => {
    assert.equal(record[flag], false, `${label} ${flag} must be false`);
  });
}

export function assertEveryFlagFalse(
  record: Record<string, boolean>,
  label: string,
  predicate: (flag: string) => boolean = () => true,
): void {
  assertFalseFlags(record, Object.keys(record).filter(predicate), label);
}

export function listFilesByExtension(relativeDir: string, extension: string): string[] {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        return listFilesByExtension(entryRelativePath, extension);
      }
      return entry.name.endsWith(extension) ? [entryRelativePath] : [];
    })
    .sort();
}

export function listScriptRefs(): string[] {
  const tsScripts = listFilesByExtension('scripts', '.ts');
  const shellScripts = listFilesByExtension('scripts', '.sh');
  return [...tsScripts, ...shellScripts].sort();
}

function resolveScriptImport(fromFile: string, specifier: string, scriptRefs: string[]): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = path.normalize(path.join(path.dirname(fromFile), specifier));
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.js`,
    path.join(base, 'index.ts'),
  ];
  return candidates.find((candidate) => scriptRefs.includes(candidate)) ?? null;
}

function scriptImportTargets(sourceRef: string, scriptRefs: string[]): string[] {
  const source = readText(sourceRef);
  const importPattern = /(?:from|import\s*\()\s*['"]([^'"]+)['"]/g;
  const targets = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(source)) !== null) {
    const target = resolveScriptImport(sourceRef, match[1], scriptRefs);
    if (target) targets.add(target);
  }
  return [...targets].sort();
}

export function collectActiveScriptCallerScan(scriptRefs: string[]): JsonObject {
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = assertPolicyObject(
    authorityFunctions.script_morphology_policy as JsonObject,
    'active_caller_scan_policy',
  );
  assert.equal(
    morphologyPolicy.policy_id,
    ACTIVE_CALLER_SCAN_POLICY_ID,
    'active caller scan policy id should stay stable',
  );
  assert.equal(
    morphologyPolicy.active_caller_required,
    true,
    'active caller scan policy should require active callers',
  );
  assert.equal(
    morphologyPolicy.orphan_script_count_must_be,
    0,
    'active caller scan policy should fail closed on orphan scripts',
  );
  assert.equal(
    morphologyPolicy.self_guard_test_ref,
    'tests/source-purity.test.ts',
    'active caller scan policy should identify the self-guard test',
  );
  assert.deepEqual(sourcePuritySelfGuardRefs(morphologyPolicy), [
    'tests/source-purity.test.ts',
    'tests/source-purity/',
  ]);
  assert.equal(
    morphologyPolicy.self_guard_may_prove_active_caller,
    false,
    'source-purity self-guard strings must not prove active callers',
  );
  assert.deepEqual(assertPolicyStringList(morphologyPolicy, 'allowed_caller_ref_kinds'), [
    'package_json_script',
    'typescript_import',
    'shell_invocation',
    'non_self_test_direct_ref',
  ]);
  const proofSourcePolicy = assertPolicyObject(morphologyPolicy, 'proof_source_policy');
  assert.equal(proofSourcePolicy.policy_id, 'oma.script-active-caller-proof-source.v1');
  assert.equal(proofSourcePolicy.caller_proof_must_be_machine_scanned, true);
  assert.equal(proofSourcePolicy.package_script_import_shell_or_non_self_test_ref_required, true);
  assert.equal(proofSourcePolicy.self_guard_test_strings_count_as_caller, false);
  assert.equal(proofSourcePolicy.test_ref_callers_must_be_outside_self_guard, true);
  assert.equal(proofSourcePolicy.caller_ref_paths_must_exist, true);
  assert.equal(proofSourcePolicy.receipt_must_not_synthesize_callers, true);
  assert.deepEqual(assertPolicyStringList(morphologyPolicy, 'fail_closed_conditions'), [
    'orphan_script_count_nonzero',
    'source_purity_self_guard_only_caller',
    'caller_ref_path_missing',
    'caller_proof_source_not_machine_scanned',
    'script_not_in_retirement_gate',
  ]);

  const callersByScript = new Map<string, Set<string>>(
    scriptRefs.map((scriptRef) => [scriptRef, new Set<string>()]),
  );
  const packageJson = readJson('package.json');

  Object.entries(packageJson.scripts ?? {}).forEach(([scriptName, command]) => {
    scriptRefs.forEach((scriptRef) => {
      if (String(command).includes(scriptRef)) {
        callersByScript.get(scriptRef)?.add(`package.json#scripts.${scriptName}`);
      }
    });
  });

  const tsCallerRefs = [
    ...listFilesByExtension('scripts', '.ts'),
    ...listFilesByExtension('tests', '.ts'),
  ].sort();
  const selfGuardRefs = sourcePuritySelfGuardRefs(morphologyPolicy);
  tsCallerRefs.forEach((sourceRef) => {
    if (sourceRefIsSelfGuard(sourceRef, selfGuardRefs)) return;
    scriptImportTargets(sourceRef, scriptRefs).forEach((scriptRef) => {
      callersByScript.get(scriptRef)?.add(`${sourceRef}#import`);
    });
  });

  listFilesByExtension('scripts', '.sh').forEach((sourceRef) => {
    const source = readText(sourceRef);
    scriptRefs.forEach((scriptRef) => {
      if (scriptRef !== sourceRef && source.includes(scriptRef)) {
        callersByScript.get(scriptRef)?.add(`${sourceRef}#shell`);
      }
    });
  });

  listFilesByExtension('tests', '.ts')
    .filter((sourceRef) => !sourceRefIsSelfGuard(sourceRef, selfGuardRefs))
    .forEach((sourceRef) => {
      const source = readText(sourceRef);
      scriptRefs.forEach((scriptRef) => {
        if (source.includes(scriptRef)) {
          callersByScript.get(scriptRef)?.add(`${sourceRef}#test_ref`);
        }
      });
    });

  const callerRefsByScript = scriptRefs.map((scriptRef) => ({
    script_ref: scriptRef,
    active_caller_refs: [...(callersByScript.get(scriptRef) ?? new Set<string>())].sort(),
  }));

  return {
    status: 'passed',
    policy_id: morphologyPolicy.policy_id,
    active_caller_required: morphologyPolicy.active_caller_required,
    orphan_script_count: callerRefsByScript
      .filter((entry) => entry.active_caller_refs.length === 0)
      .length,
    scan_inputs: assertPolicyStringList(morphologyPolicy, 'scan_inputs'),
    caller_refs_by_script: callerRefsByScript,
  };
}

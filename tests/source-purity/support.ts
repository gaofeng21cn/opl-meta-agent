import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assert,
  assertRepoRefExists,
  asObjects,
  asStrings,
  repoRoot,
  readJson,
  type JsonObject,
} from '../support/contracts.ts';
import {
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  ACTIVE_CALLER_SCAN_POLICY_ID,
  assertPolicyObject,
  assertPolicyStringList,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  listScriptRefs,
} from '../support/source-purity.ts';

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


export {
  test,
  assert,
  assertRepoRefExists,
  asObjects,
  asStrings,
  fs,
  path,
  repoRoot,
  readJson,
  ACTIVE_CALLER_SCAN_POLICY_ID,
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
  assertPolicyObject,
  assertPolicyStringList,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  listScriptRefs,
};
export type { JsonObject };

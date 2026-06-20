import {
  assert,
  fs,
  path,
  repoRoot,
  readJson,
  readText,
  type JsonObject,
} from './contracts.ts';

export const DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF = 'contracts/developer_work_order_policy.json';
export const STANDARD_FOUNDRY_POLICIES_CONTRACT_REF = 'contracts/standard_foundry_policies.json';

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
  tsCallerRefs.forEach((sourceRef) => {
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
    .filter((sourceRef) => sourceRef !== 'tests/source-purity.test.ts')
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
    active_caller_required: true,
    orphan_script_count: callerRefsByScript
      .filter((entry) => entry.active_caller_refs.length === 0)
      .length,
    scan_inputs: [
      'package.json#scripts',
      'scripts/**/*.ts import graph',
      'tests/**/*.ts import graph excluding tests/source-purity.test.ts self-guard strings',
      'scripts/**/*.sh shell invocations',
      'tests/**/*.ts direct script refs excluding tests/source-purity.test.ts',
    ],
    caller_refs_by_script: callerRefsByScript,
  };
}

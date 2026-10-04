import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { readJson, root } from './support.mjs';
export function registerExecutionAbsenceTests() {
test('repo-local execution layer is physically absent', () => {
  const forbiddenPaths = [
    'agent/skills',
    'contracts/schemas',
    'runtime',
    'scripts/lib',
    'scripts/run-with-repo-temp-env.sh',
    'tsconfig.json',
  ];
  forbiddenPaths.forEach((relativePath) => assert.equal(fs.existsSync(path.join(root, relativePath)), false, `execution residue: ${relativePath}`));

  assert.deepEqual(fs.readdirSync(path.join(root, 'scripts')).sort(), ['repo-hygiene.sh', 'verify.sh']);
  const packageManifest = readJson('package.json');
  assert.deepEqual(Object.keys(packageManifest.scripts).sort(), [
    'repo:hygiene',
    'test',
    'test:contracts',
    'test:full',
    'verify',
  ]);
  assert.equal('dependencies' in packageManifest, false);
  assert.equal('devDependencies' in packageManifest, false);
});
}

import test from 'node:test';
import {
  assert,
  fs,
  path,
  repoRoot,
  readJson,
  readText,
  listMarkdownFiles,
  placeholderPattern,
} from './support/contracts.ts';

test('verification entrypoints route caches outside the checkout and expose hygiene fix', () => {
  const packageJson = readJson('package.json');
  const verifyScript = readText('scripts/verify.sh');
  const tempWrapper = readText('scripts/run-with-repo-temp-env.sh');
  const hygieneScript = readText('scripts/repo-hygiene.sh');
  const gitignore = readText('.gitignore');

  assert.equal(packageJson.scripts['verify'], 'scripts/verify.sh');
  assert.equal(packageJson.scripts['repo:hygiene'], 'scripts/repo-hygiene.sh');
  assert.equal(packageJson.scripts['repo:hygiene:fix'], 'scripts/repo-hygiene.sh --fix');
  assert.match(packageJson.scripts['test'], /run-with-repo-temp-env\.sh/);
  assert.match(packageJson.scripts['typecheck'], /run-with-repo-temp-env\.sh/);
  assert.match(verifyScript, /run-with-repo-temp-env\.sh/);
  assert.match(verifyScript, /scripts\/repo-hygiene\.sh --fix/);
  [
    'OPL_REPO_TEMP_ROOT',
    'PYTHONPYCACHEPREFIX',
    'PYTEST_ADDOPTS',
    'UV_PROJECT_ENVIRONMENT',
    'NPM_CONFIG_CACHE',
    'NODE_COMPILE_CACHE',
    'XDG_CACHE_HOME',
  ].forEach((fragment) => assert.match(tempWrapper, new RegExp(fragment)));
  assert.match(hygieneScript, /git ls-files --others --exclude-standard/);
  assert.match(hygieneScript, /Route the producer to OPL_REPO_TEMP_ROOT/);
  [
    'dist/',
    'build/',
    'out/',
    '.venv/',
    '__pycache__/',
    '.pytest_cache/',
    '*.egg-info/',
    '.DS_Store',
  ].forEach((fragment) => assert.match(gitignore, new RegExp(`^${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm')));
});

test('tracked contract, test, and docs surfaces do not carry placeholder markers', () => {
  const scannedDirs = ['agent', 'contracts', 'tests', 'docs'];
  const scannedFiles = [
    'README.md',
    'README.zh-CN.md',
    ...scannedDirs.flatMap((dir) =>
      listMarkdownFiles(dir).concat(
        fs.readdirSync(path.join(repoRoot, dir))
          .filter((entry) => entry.endsWith('.json') || entry.endsWith('.ts'))
          .map((entry) => `${dir}/${entry}`),
      )
    ),
  ];

  scannedFiles.forEach((relativePath) => {
    const content = readText(relativePath);
    assert.equal(placeholderPattern.test(content), false, `${relativePath} should not contain placeholder markers`);
  });
});

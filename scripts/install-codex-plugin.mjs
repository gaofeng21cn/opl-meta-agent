import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PLUGIN_NAME = 'opl-meta-agent';
const MARKETPLACE_NAME = 'opl-meta-agent-local';
const MARKETPLACE_DISPLAY_NAME = 'OPL Meta Agent Local';
const PLUGIN_CATEGORY = 'Developer';
const LEGACY_PLUGIN_NAMES = ['meta-agent'];

function resolveDefaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function usage() {
  process.stdout.write('Usage: node scripts/install-codex-plugin.mjs [--repo-root /abs/path/to/repo] [--home /abs/path/to/home]\n');
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {
    repoRoot: resolveDefaultRepoRoot(),
    home: os.homedir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo-root') {
      const value = argv[index + 1];
      if (!value) throw new Error('--repo-root requires a value');
      parsed.repoRoot = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === '--home') {
      const value = argv[index + 1];
      if (!value) throw new Error('--home requires a value');
      parsed.home = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  return parsed;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function repoMarketplacePath(repoRoot) {
  return path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');
}

function removeLegacyEntry(payload) {
  const plugins = Array.isArray(payload.plugins) ? payload.plugins : [];
  return plugins.filter((item) => item && typeof item === 'object' && !LEGACY_PLUGIN_NAMES.includes(item.name));
}

function upsertMarketplace(marketplacePath) {
  const payload = loadJson(marketplacePath);
  const pluginEntry = {
    name: PLUGIN_NAME,
    source: {
      source: 'local',
      path: `./plugins/${PLUGIN_NAME}`,
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: PLUGIN_CATEGORY,
  };
  const existingPlugins = removeLegacyEntry(payload);
  let replaced = false;
  const plugins = existingPlugins.map((item) => {
    if (item.name !== PLUGIN_NAME) return item;
    replaced = true;
    return pluginEntry;
  });
  if (!replaced) plugins.push(pluginEntry);

  const interfaceConfig = payload.interface && typeof payload.interface === 'object' && !Array.isArray(payload.interface)
    ? payload.interface
    : {};
  interfaceConfig.displayName = MARKETPLACE_DISPLAY_NAME;

  writeJson(marketplacePath, {
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name : MARKETPLACE_NAME,
    interface: interfaceConfig,
    plugins,
  });
}

function assertDirectory(dirPath, label) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`${label} not found: ${dirPath}`);
  }
}

function installCodexPlugin({ repoRoot, home }) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedHome = path.resolve(home);
  const repoPluginRoot = path.join(resolvedRepoRoot, 'plugins', PLUGIN_NAME);
  const repoSkillRoot = path.join(repoPluginRoot, 'skills', PLUGIN_NAME);
  const pluginManifestPath = path.join(repoPluginRoot, '.codex-plugin', 'plugin.json');
  const skillEntryPath = path.join(repoSkillRoot, 'SKILL.md');
  const marketplacePath = repoMarketplacePath(resolvedRepoRoot);

  assertDirectory(repoPluginRoot, 'Plugin root');
  assertDirectory(repoSkillRoot, 'Plugin skill root');
  if (!fs.existsSync(pluginManifestPath)) throw new Error(`Plugin manifest not found: ${pluginManifestPath}`);
  if (!fs.existsSync(skillEntryPath)) throw new Error(`Skill entry not found: ${skillEntryPath}`);

  upsertMarketplace(marketplacePath);

  return {
    ok: true,
    plugin_name: PLUGIN_NAME,
    repo_root: resolvedRepoRoot,
    home: resolvedHome,
    plugin_root: repoPluginRoot,
    skill_root: repoSkillRoot,
    marketplace_path: marketplacePath,
  };
}

try {
  const result = installCodexPlugin(parseArgs());
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`opl-meta-agent codex installer error: ${message}\n`);
  process.exit(1);
}

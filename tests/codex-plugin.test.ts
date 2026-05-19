import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = path.join(repoRoot, 'plugins', 'opl-meta-agent');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
const pluginIconSourcePath = path.join(pluginRoot, 'assets', 'icon.svg');

test('Codex plugin installer registers OPL Meta Agent marketplace metadata', () => {
  const homeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-plugin-home-'));

  try {
    const output = execFileSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts', 'install-codex-plugin.ts'),
        '--repo-root',
        repoRoot,
        '--home',
        homeRoot,
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    const result = JSON.parse(output) as JsonObject;
    assert.equal(result.ok, true);
    assert.equal(result.plugin_name, 'opl-meta-agent');

    const marketplacePath = path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');
    const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8')) as JsonObject;
    const plugin = (marketplace.plugins as JsonObject[]).find((entry) => entry.name === 'opl-meta-agent');
    assert.ok(plugin);
    assert.equal(plugin.source.path, './plugins/opl-meta-agent');
    assert.equal(marketplace.interface.displayName, 'OPL Meta Agent Local');

    const pluginManifest = JSON.parse(fs.readFileSync(pluginManifestPath, 'utf8')) as JsonObject;
    assert.equal(pluginManifest.name, 'opl-meta-agent');
    assert.equal(pluginManifest.skills, './skills/');
    assert.equal(pluginManifest.interface.composerIcon, './assets/icon.png');
    assert.equal(pluginManifest.interface.logo, './assets/icon.png');
    assert.equal(fs.existsSync(pluginIconPath), true);
    assert.equal(fs.existsSync(pluginIconSourcePath), true);
  } finally {
    fs.rmSync(path.join(repoRoot, '.agents'), { recursive: true, force: true });
    fs.rmSync(homeRoot, { recursive: true, force: true });
  }
});

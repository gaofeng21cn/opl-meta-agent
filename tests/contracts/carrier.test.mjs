import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { readJson, root, walk } from './support.mjs';
export function registerCarrierTests() {
test('OMA protocol declarations contain no execution or release authority fields', () => {
  const forbiddenKeys = new Set([
    'repo_path', 'repo_dir', 'repo_root', 'worktree', 'branch', 'command', 'commands',
    'queue', 'lease', 'attempt', 'patch', 'patches', 'work_order', 'work_orders', 'promotion_ledger',
    'hidden_test_body', 'hidden_test_bodies',
  ]);
  for (const relativePath of ['contracts/action_catalog.json', 'contracts/foundry_provider.json']) {
    walk(readJson(relativePath), (_value, pointer) => {
      const key = pointer.split('/').at(-1);
      assert.ok(!forbiddenKeys.has(key), `${relativePath} contains forbidden field ${pointer}`);
    });
  }
});

test('all declared repo-local refs exist and primary skill mirror is exact', () => {
  const compiler = readJson('contracts/pack_compiler_input.json');
  const requiredPaths = new Set(compiler.required_domain_pack_paths);
  const frameworkContractRefs = new Set([
    'contracts/opl-framework/brand-module-registry.json',
    'contracts/opl-framework/epistemic-review-currentness-contract.json',
    'contracts/opl-framework/epistemic-review-scope-v2.schema.json',
    'contracts/opl-framework/foundry-agent-series-contract.json',
    'contracts/opl-framework/foundry-agent-series-policy-release.json',
    'contracts/opl-framework/stage-quality-cycle-contract.json',
    'contracts/opl-framework/standard-agent-principles.json',
    'contracts/opl-framework/standard-domain-agent-skeleton-contract.json',
  ]);
  assert.equal(requiredPaths.size, compiler.required_domain_pack_paths.length, 'duplicate required domain pack path');
  for (const relativePath of compiler.required_domain_pack_paths) {
    assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing ${relativePath}`);
  }

  const manifest = readJson('agent/stages/manifest.json');
  for (const stage of manifest.stages) {
    assert.ok(requiredPaths.has(stage.prompt_ref), `Stage prompt omitted from pack: ${stage.prompt_ref}`);
    assert.ok(requiredPaths.has(`agent/stages/${stage.stage_id}.md`), `Stage definition omitted from pack: ${stage.stage_id}`);
    assert.ok(Array.isArray(stage.skill_refs) && stage.skill_refs.length > 0, `Stage skill refs missing: ${stage.stage_id}`);
    [...stage.skill_refs, ...stage.knowledge_refs, ...stage.quality_gate_refs]
      .forEach((relativePath) => assert.ok(requiredPaths.has(relativePath), `Stage ref omitted from pack: ${relativePath}`));
  }

  const qualityPolicy = readJson('contracts/stage_quality_cycle_policy.json');
  for (const policy of Object.values(qualityPolicy.stages)) {
    assert.ok(requiredPaths.has(policy.stage_prompt_ref), `quality prompt omitted from pack: ${policy.stage_prompt_ref}`);
    Object.values(policy.role_prompt_refs)
      .map((ref) => ref.split('#')[0])
      .forEach((relativePath) => assert.ok(requiredPaths.has(relativePath), `role prompt omitted from pack: ${relativePath}`));
    policy.quality_rubric_refs
      .forEach((relativePath) => assert.ok(requiredPaths.has(relativePath), `quality rubric omitted from pack: ${relativePath}`));
  }

  const capabilityMap = readJson('contracts/capability_map.json');
  assert.ok(requiredPaths.has(capabilityMap.primary_skill_capability.physical_source_ref.ref));
  capabilityMap.capabilities
    .map((entry) => entry.physical_source_ref.ref)
    .forEach((relativePath) => assert.ok(requiredPaths.has(relativePath), `professional skill omitted from pack: ${relativePath}`));
  assert.equal(
    fs.readFileSync(path.join(root, 'agent/primary_skill/SKILL.md'), 'utf8'),
    fs.readFileSync(path.join(root, 'plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md'), 'utf8'),
  );

  const jsonFiles = [];
  const collectJson = (relativePath) => {
    const absolute = path.join(root, relativePath);
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      const child = path.join(relativePath, entry.name);
      if (entry.isDirectory()) collectJson(child);
      else if (entry.name.endsWith('.json')) jsonFiles.push(child);
    }
  };
  collectJson('agent');
  collectJson('contracts');
  for (const relativePath of jsonFiles) {
    walk(readJson(relativePath), (value, pointer) => {
      if (typeof value !== 'string' || !/^(?:agent|contracts|docs|plugins|scripts)\//.test(value)) return;
      const localRef = value.split('#')[0];
      if (
        relativePath === 'contracts/opl-native-profile.json'
        && pointer.startsWith('/owned_by_repo/')
        && localRef.includes('*')
      ) return;
      if (localRef.startsWith('contracts/opl-framework/')) {
        assert.ok(frameworkContractRefs.has(localRef), `${relativePath}${pointer} has unknown Framework contract ref ${value}`);
        return;
      }
      assert.ok(fs.existsSync(path.join(root, localRef)), `${relativePath}${pointer} has dangling repo-local ref ${value}`);
    });
  }
});

test('package and plugin carriers project the canonical OMA skill at one version', () => {
  const npmPackage = readJson('package.json');
  const npmLock = readJson('package-lock.json');
  const agentPackage = readJson('contracts/opl_agent_package_manifest.json');
  const rootPackage = readJson('opl-package.json');
  const carrierPackage = readJson('plugins/opl-meta-agent/opl-package.json');
  const rootPlugin = readJson('.codex-plugin/plugin.json');
  const plugin = readJson('plugins/opl-meta-agent/.codex-plugin/plugin.json');
  const portablePlugin = readJson('plugins/opl-meta-agent/plugin.json');
  const marketplace = readJson('.agents/plugins/marketplace.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const projection = capabilityMap.primary_skill_capability.carrier_projection_contract;

  const configuredCodexPluginCarrier = {
    kind: 'codex_plugin_manager',
    plugin_selector: 'opl-meta-agent@opl-meta-agent',
    executor_route: 'codex_cli',
    marketplace_source: 'gaofeng21cn/opl-meta-agent',
    publication_ref: 'ghcr.io/gaofeng21cn/one-person-lab-packages/oma:latest-stable',
  };

  assert.equal(npmPackage.version, '0.4.12');
  assert.equal(npmLock.version, npmPackage.version);
  assert.equal(npmLock.packages[''].version, npmPackage.version);
  assert.equal(agentPackage.version, npmPackage.version);
  assert.equal(rootPackage.version, npmPackage.version);
  assert.equal(agentPackage.carrier_source_role, 'codex_plugin_default_carrier_not_package_truth');
  assert.deepEqual(agentPackage.codex_surface.configured_codex_plugin_carrier, configuredCodexPluginCarrier);
  assert.equal(rootPlugin.version, npmPackage.version);
  assert.equal(plugin.version, npmPackage.version);
  assert.equal(portablePlugin.version, npmPackage.version);
  assert.equal(
    portablePlugin.$schema,
    'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  );
  assert.equal(portablePlugin.name, plugin.name);
  assert.deepEqual(
    portablePlugin.extensions['com.openai'].interface,
    plugin.interface,
  );
  assert.equal(Object.hasOwn(portablePlugin, 'skills'), false);
  assert.equal(fs.existsSync(path.join(root, 'plugins/opl-meta-agent/mcp.json')), false);
  assert.equal(
    fs.readFileSync(path.join(root, 'opl-package.json'), 'utf8'),
    fs.readFileSync(path.join(root, 'contracts/opl_agent_package_manifest.json'), 'utf8'),
  );
  assert.deepEqual(carrierPackage, {
    surface_kind: agentPackage.surface_kind,
    kind: agentPackage.kind,
    agent_id: agentPackage.agent_id,
    package_id: agentPackage.package_id,
    domain_id: agentPackage.domain_id,
    display_name: agentPackage.display_name,
    presentation: agentPackage.presentation,
    publisher: agentPackage.publisher,
    version: agentPackage.version,
    source: agentPackage.source,
    carrier_source_role: agentPackage.carrier_source_role,
    domain_descriptor_ref: agentPackage.domain_descriptor_ref,
    action_catalog_ref: agentPackage.action_catalog_ref,
    view_refs: agentPackage.view_refs,
    provider_manifest_ref: agentPackage.provider_manifest_ref,
    entrypoints: [],
    codex_surface: {
      plugin_id: agentPackage.codex_surface.plugin_id,
      plugin_source_path: '.',
      required_skill_ids: agentPackage.codex_surface.required_skill_ids,
      configured_codex_plugin_carrier: configuredCodexPluginCarrier,
    },
    capability_dependencies: [],
  });
  assert.equal(carrierPackage.version, plugin.version);
  assert.equal(carrierPackage.codex_surface.plugin_id, plugin.name);
  assert.equal(marketplace.plugins[0].source.path, './plugins/opl-meta-agent');
  const nativeCarrierRoot = path.resolve(root, marketplace.plugins[0].source.path);
  assert.equal(nativeCarrierRoot, path.resolve(root, 'plugins/opl-meta-agent'));
  for (const relativePath of [
    'plugin.json',
    '.codex-plugin/plugin.json',
    'opl-package.json',
    'skills/opl-meta-agent/SKILL.md',
  ]) {
    assert.ok(fs.statSync(path.join(nativeCarrierRoot, relativePath)).isFile());
  }
  assert.equal(rootPlugin.name, agentPackage.codex_surface.plugin_id);
  assert.equal(rootPlugin.skills, './plugins/opl-meta-agent/skills/');
  assert.ok(fs.statSync(path.resolve(root, rootPlugin.skills)).isDirectory());
  assert.ok(fs.statSync(path.resolve(root, rootPlugin.interface.composerIcon)).isFile());
  assert.equal(plugin.name, 'opl-meta-agent');
  assert.equal(plugin.skills, './skills/');
  assert.deepEqual(agentPackage.codex_surface.required_skill_ids, ['opl-meta-agent']);
  assert.equal(projection.canonical_source, 'agent/primary_skill/SKILL.md');
  assert.equal(projection.carrier_skill_ref, 'plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md');
  assert.equal(projection.carrier_can_override_canonical_source, false);

  const forbiddenPackageLifecycleKeys = new Set([
    'lifecycle',
    'release_set_receipt_ref',
    'activation_materialization',
    'package_lock_ref',
  ]);
  for (const [relativePath, descriptor] of [
    ['contracts/opl_agent_package_manifest.json', agentPackage],
    ['opl-package.json', rootPackage],
    ['plugins/opl-meta-agent/opl-package.json', carrierPackage],
  ]) {
    walk(descriptor, (_value, pointer) => {
      const key = pointer.split('/').at(-1);
      assert.ok(
        !forbiddenPackageLifecycleKeys.has(key),
        `${relativePath} contains forbidden Package lifecycle field ${pointer}`,
      );
    });
  }
});
}

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

test('all declared repo-local refs resolve to their owners', () => {
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
      if (typeof value !== 'string') return;
      const localRef = value.split('#')[0];
      if (localRef !== 'opl-package.json' && !/^(?:agent|contracts|docs|plugins|scripts)\//.test(localRef)) return;
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

test('the OPL v2 manifest declares the canonical OMA package and Codex skill', () => {
  const npmPackage = readJson('package.json');
  const npmLock = readJson('package-lock.json');
  const manifest = readJson('opl-package.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const primary = capabilityMap.primary_skill_capability;
  const capability = capabilityMap.capabilities.find((entry) => entry.capability_id === primary.capability_id);

  assert.match(npmPackage.version, /^\d+\.\d+\.\d+$/);
  assert.equal(npmLock.version, npmPackage.version);
  assert.equal(npmLock.packages[''].version, npmPackage.version);
  assert.equal(manifest.schema_version, 'opl.package.v2');
  assert.equal(manifest.identity.id, 'oma');
  assert.equal(manifest.identity.intent, 'agent');
  assert.equal(manifest.identity.version, npmPackage.version);
  assert.equal(manifest.identity.publisher, 'one-person-lab');
  assert.equal(manifest.identity.license, npmPackage.license);
  assert.equal(manifest.identity.icon, 'assets/branding/opl-meta-agent-logo.png');
  assert.ok(fs.statSync(path.join(root, manifest.identity.icon)).isFile());
  assert.equal(manifest.dependencies.opl_base, '^2.0.0');
  assert.deepEqual(manifest.provides.skills, [
    { id: 'opl-meta-agent', path: './agent/primary_skill', exposure: 'default' },
  ]);
  assert.deepEqual(manifest.host_hints.codex, {
    sync_enabled: true,
    plugin_name: 'opl-meta-agent',
    category: 'Productivity',
    brand_color: '#4F5D95',
    capabilities: ['Interactive', 'Write'],
  });
  assert.deepEqual(manifest.distribution, {
    oci: 'ghcr.io/gaofeng21cn/one-person-lab-packages/oma',
    visibility: 'public',
  });

  const skillRef = path.posix.join(manifest.provides.skills[0].path, 'SKILL.md');
  assert.equal(primary.physical_source_ref.ref, skillRef);
  assert.equal(capability.physical_source_ref.ref, skillRef);
  assert.equal(primary.carrier_projection_contract.canonical_source, skillRef);
  assert.equal(primary.carrier_projection_contract.carrier_skill_ref, skillRef);
  assert.equal(primary.carrier_projection_contract.carrier_can_override_canonical_source, false);
  assert.deepEqual(capability.runtime_projection_refs, [
    { ref_kind: 'contract_ref', ref: 'opl-package.json', role: 'v2_package_manifest' },
  ]);

  const forbiddenPackageLifecycleKeys = new Set([
    'lifecycle',
    'release_set_receipt_ref',
    'activation_materialization',
    'package_lock_ref',
  ]);
  walk(manifest, (_value, pointer) => {
    const key = pointer.split('/').at(-1);
    assert.ok(
      !forbiddenPackageLifecycleKeys.has(key),
      `opl-package.json contains forbidden Package lifecycle field ${pointer}`,
    );
  });
});

test('retired v1 carrier artifacts and generated release lock are absent', () => {
  for (const relativePath of [
    'contracts/opl_agent_package_manifest.json',
    'contracts/carrier_projection.json',
    'plugins/opl-meta-agent',
    '.codex-plugin',
    'plugin.json',
    '.agents/plugins/marketplace.json',
    'app-contribution-adapter.json',
    'opl-release.lock.json',
  ]) {
    assert.equal(
      fs.lstatSync(path.join(root, relativePath), { throwIfNoEntry: false }),
      undefined,
      `unexpected repository artifact: ${relativePath}`,
    );
  }
});
}

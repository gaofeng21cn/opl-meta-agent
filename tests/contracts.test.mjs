import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

function walk(value, visitor, pointer = '') {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, visitor, `${pointer}/${index}`));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => walk(entry, visitor, `${pointer}/${key}`));
  }
}

test('OMA exposes one public Foundry action and two internal provider operations', () => {
  const catalog = readJson('contracts/action_catalog.json');
  const provider = readJson('contracts/foundry_provider.json');
  assert.equal(catalog.target_domain_id, 'agent_engineering');
  assert.deepEqual(catalog.actions.map((entry) => entry.action_id), ['engineer-agent']);
  assert.deepEqual(catalog.actions[0].execution_binding, {
    kind: 'foundry_binding',
    provider_manifest_ref: 'contracts/foundry_provider.json',
  });
  assert.deepEqual(Object.keys(provider.operations).sort(), ['design', 'diagnose']);
  assert.deepEqual(provider.projection_policy.public_action_ids, ['engineer-agent']);
  assert.deepEqual(provider.authority_boundary, {
    provider_owns_design_semantics: true,
    provider_owns_evaluation_semantics: true,
    provider_owns_evidence_diagnosis: true,
    provider_owns_evolution_proposals: true,
    provider_owns_foundry_run_state: false,
    provider_owns_candidate_materialization: false,
    provider_owns_evaluation_execution: false,
    provider_owns_versions_or_activation: false,
    provider_can_return_patch_or_work_order: false,
    provider_can_view_protected_test_bodies: false,
    opl_can_write_target_domain_truth: false,
  });
});

test('provider identity and stage routes are internally closed', () => {
  const identityContracts = [
    'contracts/capability_map.json',
    'contracts/domain_descriptor.json',
    'contracts/foundry_agent_series.json',
    'contracts/foundry_provider.json',
    'contracts/foundry_protocol_fixture_manifest.json',
    'contracts/opl_agent_package_manifest.json',
    'contracts/opl_domain_manifest_registration.json',
    'contracts/pack_compiler_input.json',
  ].map(readJson);
  const provider = readJson('contracts/foundry_provider.json');
  const descriptor = readJson('contracts/domain_descriptor.json');
  const manifest = readJson('agent/stages/manifest.json');
  const compiler = readJson('contracts/pack_compiler_input.json');
  const qualityPolicy = readJson('contracts/stage_quality_cycle_policy.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const expectedStageIds = [
    'mission-intake',
    'design-basis-admission',
    'target-agent-assessment',
    'stage-architecture',
    'agent-blueprint-authoring',
    'evaluation-design',
    'evidence-diagnosis',
    'evolution-proposal',
  ];
  const expectedStageKinds = {
    'mission-intake': 'intake',
    'design-basis-admission': 'source_preparation',
    'target-agent-assessment': 'review',
    'stage-architecture': 'planning',
    'agent-blueprint-authoring': 'creation',
    'evaluation-design': 'planning',
    'evidence-diagnosis': 'review',
    'evolution-proposal': 'revision',
  };
  const stageIds = new Set(manifest.stages.map((entry) => entry.stage_id));
  for (const contract of identityContracts) {
    assert.equal(contract.agent_id, 'oma');
    assert.equal(contract.package_id, 'oma');
    assert.equal(contract.domain_id, 'agent_engineering');
    if ('carrier_slug' in contract) assert.equal(contract.carrier_slug, 'opl-meta-agent');
  }
  assert.deepEqual([...stageIds], expectedStageIds);
  assert.deepEqual(
    Object.fromEntries(manifest.stages.map((stage) => [stage.stage_id, stage.stage_kind])),
    expectedStageKinds,
  );
  assert.equal(compiler.canonical_agent_id, 'oma');
  assert.equal(manifest.target_domain_id, 'agent_engineering');
  assert.equal(manifest.owner, 'agent_engineering');
  assert.equal(qualityPolicy.domain_id, 'agent_engineering');
  assert.equal(qualityPolicy.owner, 'agent_engineering');
  assert.deepEqual(Object.keys(qualityPolicy.stages), expectedStageIds);

  const routedStageIds = new Set();
  assert.equal(provider.carrier_slug, 'opl-meta-agent');
  assert.deepEqual(Object.keys(descriptor.standard_agent_interface).sort(), [
    'progress',
    'routing',
    'runtime',
    'stage_catalog',
    'version',
    'workspace_binding',
  ]);
  assert.deepEqual(descriptor.standard_agent_interface.routing.workstream_ids, ['agent_engineering']);
  for (const operation of Object.values(provider.operations)) {
    for (const stageId of [operation.entry_stage_ref, operation.terminal_stage_ref, ...operation.required_stage_refs, ...operation.optional_stage_refs]) {
      assert.ok(stageIds.has(stageId), `missing provider stage ${stageId}`);
      routedStageIds.add(stageId);
    }
  }
  assert.deepEqual([...routedStageIds].sort(), [...stageIds].sort());
  assert.deepEqual(manifest.authority_boundary, {
    domain_truth_owner: 'agent_engineering',
    provider_owns_semantic_protocol_outputs: true,
    provider_owns_materialization_evaluation_versions_activation_or_rollback: false,
    opl_can_write_target_domain_truth: false,
    provider_completion_is_qualification: false,
  });
  for (const stage of manifest.stages) {
    stage.next_stage_refs.forEach((stageId) => assert.ok(stageIds.has(stageId), `missing next Stage ${stageId}`));
  }
  for (const capability of capabilityMap.capabilities) {
    capability.stage_refs.forEach((stageId) => assert.ok(stageIds.has(stageId), `missing capability Stage ${stageId}`));
  }
  const capabilityBySkillRef = new Map(
    capabilityMap.capabilities.map((entry) => [entry.physical_source_ref.ref, new Set(entry.stage_refs)]),
  );
  for (const stage of manifest.stages) {
    for (const skillRef of stage.skill_refs) {
      assert.ok(capabilityBySkillRef.has(skillRef), `Stage skill is not capability-indexed: ${skillRef}`);
      assert.ok(capabilityBySkillRef.get(skillRef).has(stage.stage_id), `capability map omits ${stage.stage_id} for ${skillRef}`);
    }
  }
});

test('generated surfaces resolve to real refs-only OMA targets without owner proof claims', () => {
  const handoff = readJson('contracts/generated_surface_handoff.json');
  const audit = readJson('contracts/functional_privatization_audit.json');
  const compiler = readJson('contracts/pack_compiler_input.json');
  const descriptor = readJson('contracts/domain_descriptor.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const expectedSurfaceIds = [
    'cli',
    'mcp',
    'skill',
    'product_entry_manifest',
    'domain_handler',
    'status_read_model',
    'workbench_drilldown',
  ];
  const moduleBySurface = new Map();

  assert.deepEqual(handoff.handoff_surfaces.map((surface) => surface.surface_id), expectedSurfaceIds);
  assert.equal(handoff.generated_surface_owner, 'one-person-lab');
  assert.equal(handoff.domain_repo_can_own_generated_surface, false);

  for (const module of audit.modules) {
    assert.equal(module.classification, 'refs_only_domain_adapter');
    assert.equal(module.standardization_layer, 'private_platform_residue_inventory');
    assert.ok(module.active_caller_status.startsWith('refs_only_'));
    assert.ok(module.active_callers.length > 0);
    assert.ok(module.migration_action.length > 0);
    assert.ok(module.retention_reason.length > 0);
    module.code_paths.forEach((relativePath) => {
      assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing refs-only target ${relativePath}`);
    });
    module.current_surface_refs.forEach((surfaceId) => {
      assert.equal(moduleBySurface.has(surfaceId), false, `duplicate target proof for ${surfaceId}`);
      moduleBySurface.set(surfaceId, module);
    });
  }

  for (const surface of handoff.handoff_surfaces) {
    assert.equal(surface.owner, 'one-person-lab');
    assert.match(surface.target_role, /^(?:opl_generated_|opl_hosted_|refs_only_)/);
    surface.current_paths.forEach((relativePath) => {
      assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing handoff target ${relativePath}`);
    });
    assert.ok(moduleBySurface.has(surface.surface_id), `missing active-caller module for ${surface.surface_id}`);
  }

  const foundryBindingSurface = handoff.handoff_surfaces.find((surface) => surface.surface_id === 'domain_handler');
  const foundryBindingModule = moduleBySurface.get('domain_handler');
  assert.equal(foundryBindingSurface.target_role, 'refs_only_foundry_provider_descriptor_target');
  assert.equal(foundryBindingModule.module_id, 'oma_foundry_binding_descriptor_refs');
  assert.equal(foundryBindingModule.active_caller_status.includes('domain_handler'), false);

  assert.deepEqual(audit.bridge_exit_gate.physical_delete_authorization_refs, []);
  assert.deepEqual(audit.authority_boundary, {
    domain_can_claim_generic_runtime_owner: false,
    domain_repo_can_own_generated_surface: false,
    oma_can_write_foundry_run_state: false,
    oma_can_materialize_or_evaluate: false,
    oma_can_create_version_or_change_activation: false,
    opl_can_write_target_domain_truth: false,
    provider_completion_is_qualification: false,
  });
  assert.equal(audit.retired_generated_surface_provenance.length, 1);
  audit.retired_generated_surface_provenance[0].provenance_refs.forEach((relativePath) => {
    assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing retirement provenance ${relativePath}`);
  });

  assert.ok(compiler.required_domain_pack_paths.includes('contracts/functional_privatization_audit.json'));
  assert.ok(compiler.declarative_domain_pack.length > 0);
  assert.equal(
    descriptor.standard_contract_refs.functional_privatization_audit,
    'contracts/functional_privatization_audit.json',
  );
  assert.equal(
    registration.domain_manifest.functional_privatization_audit_ref,
    'contracts/functional_privatization_audit.json',
  );
});

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
      assert.ok(fs.existsSync(path.join(root, localRef)), `${relativePath}${pointer} has dangling repo-local ref ${value}`);
    });
  }
});

test('package and plugin carriers project the canonical OMA skill at one version', () => {
  const npmPackage = readJson('package.json');
  const agentPackage = readJson('contracts/opl_agent_package_manifest.json');
  const plugin = readJson('plugins/opl-meta-agent/.codex-plugin/plugin.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const projection = capabilityMap.primary_skill_capability.carrier_projection_contract;

  assert.equal(npmPackage.version, '0.4.0');
  assert.equal(agentPackage.version, npmPackage.version);
  assert.equal(plugin.version, npmPackage.version);
  assert.equal(plugin.name, 'opl-meta-agent');
  assert.equal(plugin.skills, './skills/');
  assert.deepEqual(agentPackage.codex_surface.required_skill_ids, ['opl-meta-agent']);
  assert.equal(projection.canonical_source, 'agent/primary_skill/SKILL.md');
  assert.equal(projection.carrier_skill_ref, 'plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md');
  assert.equal(projection.carrier_can_override_canonical_source, false);
});

test('active OMA surface has no retired action ABI', () => {
  const retired = [
    'opl foundry lab',
    'opl agent-lab',
    'foundry-lab',
    'agent-lab',
    'build-agent-baseline',
    'takeover-target-agent-test',
    'improve-from-external-agent-lab-suite',
    'generate-mechanism-patch-proposal',
    'materialize-trajectory-learning-proposal',
    'execute:external-work-order',
    'omaSemanticEnvelope',
    'oma_owns_',
  ];
  const activeRoots = [
    'agent', 'contracts', 'docs', 'scripts', 'plugins',
    'package.json', 'README.md', 'README.zh-CN.md', 'AGENTS.md',
  ];
  const files = [];
  const collect = (relativePath) => {
    if (relativePath === 'docs/history' || relativePath.startsWith(`docs${path.sep}history${path.sep}`)) return;
    const absolute = path.join(root, relativePath);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute)) collect(path.join(relativePath, name));
    } else if (!absolute.includes(`${path.sep}assets${path.sep}`)) files.push(relativePath);
  };
  activeRoots.forEach(collect);
  const body = files.map((entry) => fs.readFileSync(path.join(root, entry), 'utf8')).join('\n').toLowerCase();
  retired.forEach((token) => assert.equal(body.includes(token.toLowerCase()), false, `retired token remains: ${token}`));
});

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

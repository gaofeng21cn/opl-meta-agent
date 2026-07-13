import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  readText,
  listMarkdownFiles,
  assertUsablePackFile,
  assertNoForbiddenAuthority,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';
import { assertIncludesAll } from './support/source-purity.ts';

test('opl-meta-agent descriptor keeps OPL runtime authority outside the repo', () => {
  const descriptor = readJson('contracts/domain_descriptor.json');

  assert.equal(descriptor.domain_id, 'opl-meta-agent');
  assert.equal(descriptor.agent_role, 'opl_based_foundry_agent');
  assert.equal(descriptor.delivery_domain, 'agent_development');
  assert.equal(descriptor.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.opl_meta_agent_can_train_or_deploy_model_weights, false);
  assert.equal(descriptor.authority_boundary.opl_meta_agent_can_promote_default_agent_without_gate, false);
  assert.ok(asStrings(descriptor.outputs).includes('mechanism_patch_proposal_ref'));
  assert.deepEqual(descriptor.standard_agent_interface.workspace_binding, {
    locator_surface_kind: 'opl_meta_agent_workspace',
    default_profile_id: 'one_off',
    workspace_kind: 'agent_foundry_workspace',
    project_kind: 'agent_capability',
    project_collection_label: 'deliverables',
    default_workspace_id: 'agent-foundry-workspace',
    default_project_id: 'agent-001',
    required_locator_fields: ['workspace_root'],
    optional_locator_fields: [],
    entry_command_template: null,
    manifest_command_template: null,
  });
  assert.equal(descriptor.standard_agent_interface.runtime.dispatch_command, null);
  assert.deepEqual(descriptor.standard_agent_interface.progress.deliverable_delta_aliases, [
    'target_agent_substantive_delta',
  ]);
});

test('domain pack files and declarative stage refs resolve to usable repo files', () => {
  const stageManifest = readJson('agent/stages/manifest.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const refGroups = [
    { field: 'prompt_ref', pathPattern: /^agent\/prompts\/.+\.md$/ },
    { field: 'knowledge_refs', pathPattern: /^agent\/knowledge\/.+\.md$/ },
    { field: 'quality_gate_refs', pathPattern: /^agent\/quality_gates\/.+\.md$/ },
  ];

  assert.equal(packCompilerInput.domain_pack_owner, 'opl-meta-agent');
  assert.equal(packCompilerInput.domain_id, 'opl-meta-agent');
  assert.equal(packCompilerInput.canonical_agent_id, 'oma');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.deepEqual(packCompilerInput.implementation_profile, {
    profile_id: 'opl.standard_domain_agent.v1',
    agent_identity: 'declarative_standard_agent_pack',
    pack_formats: ['markdown', 'json'],
    helpers: {
      optional: true,
      entries: [{
        language: 'typescript',
        role: 'domain_helper',
        source_roots: ['scripts/'],
      }],
      language_is_identity: false,
      rust_policy: 'framework_hot_path_only',
    },
    generated_surfaces_owner: 'one-person-lab',
  });
  assert.equal(
    packCompilerInput.source_refs.quality_gate_source_ref,
    'agent/stages/manifest.json#/stages/*/quality_gate_refs',
  );
  assert.equal(generatedSurfaceHandoff.generated_interface_role, 'invoke_and_project_without_domain_authority_escalation');
  assertIncludesAll(asStrings(generatedSurfaceHandoff.required_domain_handoff), [
    'domain_pack_paths_exist_and_are_non_empty',
    'stage_prompt_refs_resolve_to_domain_pack_files',
  ], 'generated surface handoff');

  const actualDomainPackPaths = [
    'agent/stages/manifest.json',
    'contracts/stage_quality_cycle_policy.json',
    ...listMarkdownFiles('agent')
      .filter((relativePath) => !relativePath.endsWith('/README.md'))
      .filter((relativePath) => !relativePath.endsWith('/TOMBSTONE.md')),
  ].sort();
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, actualDomainPackPaths);
  actualDomainPackPaths.forEach(assertUsablePackFile);
  assert.deepEqual(
    listMarkdownFiles('agent').filter((relativePath) => relativePath.endsWith('/README.md')),
    ['agent/README.md', 'agent/professional_skills/README.md'],
  );

  refGroups.forEach(({ field, pathPattern }) => {
    asObjects(stageManifest.stages).forEach((stage) => {
      const refs = typeof stage[field] === 'string' ? [stage[field]] : asStrings(stage[field]);
      assert.ok(refs.length > 0, `${stage.stage_id}.${field} should not be empty`);
      refs.forEach((stageRef) => {
        assert.match(String(stageRef), pathPattern);
        assertUsablePackFile(String(stageRef));
      });
    });
  });

  assert.equal(packCompilerInput.authority_boundary.domain_pack_can_supply_domain_truth_refs, true);
  assert.equal(packCompilerInput.authority_boundary.generated_interface_can_invoke_minimal_authority_functions, true);
  assert.equal(packCompilerInput.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(packCompilerInput.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

test('declarative stage manifest is the OPL Pack compiler source', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const stages = asObjects(manifest.stages);
  const stageIds = stages.map((stage) => String(stage.stage_id));
  const actionIds = new Set(asObjects(actionCatalog.actions).map((action) => String(action.action_id)));

  assert.equal(manifest.surface_kind, 'opl_standard_agent_declarative_stage_manifest');
  assert.equal(manifest.version, 'opl-standard-agent-declarative-stage-manifest.v1');
  assert.equal(manifest.target_domain_id, 'opl-meta-agent');
  assert.equal(manifest.owner, 'opl-meta-agent');
  assert.equal(manifest.authority_boundary.domain_truth_owner, 'opl-meta-agent');
  assert.equal(manifest.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(manifest.authority_boundary.opl_can_authorize_quality_or_export, false);
  assert.deepEqual(stageIds, [
    'intent-intake',
    'web-experience-research',
    'stage-decomposition',
    'agent-skeleton-build',
    'eval-suite-build',
    'baseline-run',
    'target-agent-takeover',
    'optimizer-iteration',
    'baseline-delivery',
    'trajectory-learning-intake',
    'online-learning',
  ]);

  stages.forEach((stage) => {
    assertUsablePackFile(String(stage.policy_ref));
    assertUsablePackFile(String(stage.prompt_ref));
    asStrings(stage.knowledge_refs).forEach(assertUsablePackFile);
    asStrings(stage.quality_gate_refs).forEach(assertUsablePackFile);
    assert.ok(asStrings(stage.allowed_action_refs).length > 0, `${stage.stage_id}.allowed_action_refs`);
    asStrings(stage.allowed_action_refs).forEach((actionId) => {
      assert.equal(actionIds.has(actionId), true, `${stage.stage_id} references ${actionId}`);
    });
    asStrings(stage.next_stage_refs).forEach((stageId) => {
      assert.ok(stageIds.includes(stageId), `${stage.stage_id} references ${stageId}`);
    });
  });

  assert.ok(asStrings(packCompilerInput.required_domain_pack_paths).includes('agent/stages/manifest.json'));
  assertUsablePackFile('runtime/authority_functions/README.md');
  assert.equal(
    packCompilerInput.standard_stage_pack_conformance.enforcement_ref,
    'agent/stages/manifest.json',
  );
});

test('standard-agent principles bind the declarative manifest and explicit proof lane', () => {
  const principles = readJson('contracts/standard-agent-principles-adoption.json');
  const manifest = readJson('agent/stages/manifest.json');
  const skeletonBuild = asObjects(manifest.stages)
    .find((stage) => stage.stage_id === 'agent-skeleton-build');

  assert.equal(principles.source_refs.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(principles.source_refs.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
  assert.equal(
    principles.domain_mapping.domain_intake.domain_stage_ref,
    'agent/stages/manifest.json#/stages/0',
  );
  assert.equal(skeletonBuild?.lane_kind, 'proof');
});

test('agent builds reuse a persistent workspace and ingest user reference files through OPL', () => {
  const policy = readJson('contracts/workspace_lifecycle_policy.json');
  const agentBuild = policy.agent_build_workspace_policy;

  assert.equal(agentBuild.default_workspace_mode, 'series');
  assert.equal(agentBuild.reuse_workspace_by_target_agent, true);
  assert.equal(agentBuild.reference_source_ingest_required, true);
  assert.equal(agentBuild.reference_source_role, 'reference_design');
  assert.equal(agentBuild.one_off_workspace_requires_explicit_user_intent, true);
  assert.equal(agentBuild.temporary_directory_is_not_default_project_authority, true);
});

test('declared action routes publish every required predecessor condition', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const stagesById = new Map(
    asObjects(manifest.stages).map((stage) => [String(stage.stage_id), stage]),
  );
  asObjects(actionCatalog.actions).forEach((action) => {
    const actionId = String(action.action_id);
    const route = action.stage_route;
    const requiredStages = asStrings(route.required_stage_refs);
    for (let index = 1; index < requiredStages.length; index += 1) {
      const predecessorId = requiredStages[index - 1]!;
      const stageId = requiredStages[index]!;
      const predecessor = stagesById.get(predecessorId);
      const stage = stagesById.get(stageId);
      assert.ok(predecessor, `${actionId}: missing route predecessor ${predecessorId}`);
      assert.ok(stage, `${actionId}: missing route stage ${stageId}`);
      assert.ok(
        asStrings(predecessor.ensures).some((condition) => asStrings(stage.requires).includes(condition)),
        `${actionId}: ${predecessorId} must ensure at least one requirement of ${stageId}`,
      );
    }
  });

  const decomposition = stagesById.get('stage-decomposition');
  const research = stagesById.get('web-experience-research');
  assert.ok(decomposition && research);
  assert.ok(
    asStrings(research.ensures).some((condition) => asStrings(decomposition.requires).includes(condition)),
    'optional research branch must also satisfy stage-decomposition input requirements',
  );
});

test('domain skill declarations and professional skills stay separate', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const requiredPackPaths = asStrings(packCompilerInput.required_domain_pack_paths);
  const primaryPaths = requiredPackPaths.filter((ref) => ref.startsWith('agent/primary_skill/'));
  const domainSkillPaths = requiredPackPaths.filter((ref) => ref.startsWith('agent/skills/'));
  const professionalSkillPaths = requiredPackPaths.filter((ref) => ref.startsWith('agent/professional_skills/'));
  assert.deepEqual(primaryPaths, ['agent/primary_skill/SKILL.md']);
  assert.ok(domainSkillPaths.length > 0);
  assert.ok(professionalSkillPaths.length > 0);
  assert.equal(domainSkillPaths.some((ref) => /\/oma-.+\.md$/.test(ref)), false);
  professionalSkillPaths.forEach((ref) => assert.match(ref, /\/oma-[^/]+\/SKILL\.md$/));

  const primaryCapability = capabilityMap.primary_skill_capability;
  assert.equal(primaryCapability.surface_role, 'primary_skill');
  assert.equal(primaryCapability.physical_source_ref.ref, 'agent/primary_skill/SKILL.md');
  assert.equal(readText('plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md'), readText('agent/primary_skill/SKILL.md'));

  const professionalCapabilities = asObjects(capabilityMap.capabilities)
    .filter((capability) => capability.surface_role === 'professional_skill');
  assert.deepEqual(
    professionalCapabilities.map((capability) => capability.physical_source_ref.ref).sort(),
    professionalSkillPaths,
  );
  professionalCapabilities.forEach((capability) => {
    assert.equal(capability.capability_kind, 'professional_skill');
    assert.deepEqual(asStrings(capability.canonical_paths), [capability.physical_source_ref.ref]);
    assert.equal(capability.codex_default_exposure, false);
  });
});

test('capability policy profiles remove repeated no-authority blocks', () => {
  const capabilityMap = readJson('contracts/capability_map.json');
  const profiles = capabilityMap.capability_policy_profiles as JsonObject;
  const capabilities = asObjects(capabilityMap.capabilities);
  const profileCounts = new Map<string, number>();

  assert.deepEqual(Object.keys(profiles).sort(), [
    'domain_pack_guarded',
    'professional_method_guarded',
    'work_order_hygiene_guarded',
  ]);
  Object.entries(profiles).forEach(([profileId, profile]) => {
    const policyProfile = profile as JsonObject;
    const authority = policyProfile.authority_boundary as JsonObject;
    Object.entries(authority).forEach(([field, value]) => {
      assert.equal(value, false, `capability policy profile ${profileId}.${field}`);
    });
    assert.ok(asStrings(policyProfile.forbidden_surfaces).length > 0);
    assert.ok(asStrings(policyProfile.verification_refs).length > 0);
    const ownerBoundary = policyProfile.owner_closeout_boundary as JsonObject;
    assert.equal(ownerBoundary.owner, 'opl-meta-agent');
    assert.equal(ownerBoundary.can_write_owner_receipt_body, false);
    assert.equal(ownerBoundary.can_create_typed_blocker, false);
  });

  capabilities.forEach((capability) => {
    const profileRef = String(capability.capability_policy_profile_ref);
    const profileId = profileRef.replace('#/capability_policy_profiles/', '');
    assert.equal(profileRef, `#/capability_policy_profiles/${profileId}`);
    assert.ok(profiles[profileId], `${capability.capability_id} references ${profileId}`);
    profileCounts.set(profileId, (profileCounts.get(profileId) ?? 0) + 1);
    [
      'authority_boundary',
      'forbidden_surfaces',
      'verification_refs',
      'owner_closeout_boundary',
    ].forEach((field) => assert.equal(Object.hasOwn(capability, field), false, `${capability.capability_id}.${field}`));
  });
  assert.deepEqual(Object.fromEntries(profileCounts), {
    domain_pack_guarded: 5,
    professional_method_guarded: 3,
    work_order_hygiene_guarded: 1,
  });
});

test('trajectory learning stays an OMA-native refs-only proposal flow', () => {
  const trajectoryLearning = readJson('contracts/trajectory_learning_contract.json');

  assert.equal(trajectoryLearning.surface_kind, 'opl_meta_agent_trajectory_learning_contract');
  assert.equal(trajectoryLearning.source_disposition, 'clean_room_pattern_source');
  assert.equal(trajectoryLearning.contract_status, 'ready_for_agent_lab_consumption_refs_only');
  assertNoForbiddenAuthority(trajectoryLearning, 'trajectoryLearning');
  asStrings(trajectoryLearning.semantic_pack_refs).forEach(assertUsablePackFile);
});

test('active Stage prompts keep goals and professional dependencies without fixed process scripts', () => {
  const stageManifest = readJson('agent/stages/manifest.json');
  const promptSemantics: Record<string, string[]> = {
    'intent-intake': ['target-agent brief', 'owner split', 'route'],
    'web-experience-research': ['research synthesis', 'source refs', 'adopted/adapted/rejected'],
    'stage-decomposition': ['artifact morphology', 'owner split', 'adopt/adapt/merge/reject'],
    'agent-skeleton-build': ['candidate package', 'AgentBuildReceipt', '六段式'],
    'eval-suite-build': ['foundry_evaluation_request', 'OPL Foundry Lab', 'suite plan'],
    'baseline-run': ['evaluation work order', '不等待', 'expected-result'],
    'target-agent-takeover': ['takeover assessment', 'current bytes', 'owner receipt'],
    'optimizer-iteration': ['developer patch work-order', '不在 Stage 内等待', 'next owner'],
    'baseline-delivery': ['immutable refs-only', 'baseline_handoff_candidate_ref', 'owner review route'],
    'trajectory-learning-intake': ['redaction proof', 'learning candidates', 'runtime queue'],
    'online-learning': ['proposal-only', 'owner-gated', 'adoption'],
  };
  const stages = asObjects(stageManifest.stages);
  assert.equal(stages.length, 11);
  stages.forEach((stage) => {
    const stageId = String(stage.stage_id);
    const promptRef = String(stage.prompt_ref);
    const prompt = readText(promptRef);
    promptSemantics[stageId].forEach((semantic) => {
      assert.ok(prompt.toLowerCase().includes(semantic.toLowerCase()), `${promptRef} ${semantic}`);
    });
    assert.equal(prompt.includes('## 步骤'), false, `${promptRef} fixed steps`);
  });

  const decomposition = readText('agent/prompts/stage-decomposition.md');
  assert.ok(decomposition.includes('不要求每个 source workflow step 独立成 Stage'));
  assert.ok(decomposition.includes('在设计 graph 前'));
  assert.ok(decomposition.includes('owner split 贯穿'));

  const optimizer = readText('agent/prompts/optimizer-iteration.md');
  assert.ok(optimizer.includes('不在 Stage 内等待外部执行'));
  const skeleton = readText('agent/prompts/agent-skeleton-build.md');
  assert.ok(skeleton.includes('不生成六段式固定 prompt 剧本'));

  assert.equal(
    readText('agent/primary_skill/SKILL.md'),
    readText('plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md'),
  );
});

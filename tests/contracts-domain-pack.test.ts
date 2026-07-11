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
});

test('domain pack files and stage prompt refs resolve to usable repo files', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const refGroups = [
    { field: 'prompt_refs', refKind: 'domain_prompt_ref', pathPattern: /^agent\/prompts\/.+\.md$/ },
    { field: 'skills', refKind: 'domain_skill_ref', pathPattern: /^agent\/skills\/.+\.md$/ },
    { field: 'knowledge_refs', refKind: 'domain_knowledge_ref', pathPattern: /^agent\/knowledge\/.+\.md$/ },
    { field: 'evaluation', refKind: 'domain_quality_gate_ref', pathPattern: /^agent\/quality_gates\/.+\.md$/ },
  ];

  assert.equal(packCompilerInput.domain_pack_owner, 'opl-meta-agent');
  assert.equal(packCompilerInput.domain_id, 'opl-meta-agent');
  assert.equal(packCompilerInput.canonical_agent_id, 'oma');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(generatedSurfaceHandoff.generated_interface_role, 'invoke_and_project_without_domain_authority_escalation');
  assertIncludesAll(asStrings(generatedSurfaceHandoff.required_domain_handoff), [
    'domain_pack_paths_exist_and_are_non_empty',
    'stage_prompt_refs_resolve_to_domain_pack_files',
  ], 'generated surface handoff');

  const actualDomainPackPaths = [
    'agent/stages/manifest.json',
    ...listMarkdownFiles('agent')
      .filter((relativePath) => !relativePath.endsWith('/README.md'))
      .filter((relativePath) => !relativePath.endsWith('/TOMBSTONE.md')),
  ].sort();
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, actualDomainPackPaths);
  actualDomainPackPaths.forEach(assertUsablePackFile);

  refGroups.forEach(({ field, refKind, pathPattern }) => {
    asObjects(stageControl.stages).forEach((stage) => {
      const refs = asObjects(stage[field]);
      assert.ok(refs.length > 0, `${stage.stage_id}.${field} should not be empty`);
      refs.forEach((stageRef) => {
        assert.equal(stageRef.ref_kind, refKind);
        assert.match(String(stageRef.ref), pathPattern);
        assertUsablePackFile(String(stageRef.ref));
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

test('trajectory learning stays an OMA-native refs-only proposal flow', () => {
  const trajectoryLearning = readJson('contracts/trajectory_learning_contract.json');

  assert.equal(trajectoryLearning.surface_kind, 'opl_meta_agent_trajectory_learning_contract');
  assert.equal(trajectoryLearning.source_disposition, 'clean_room_pattern_source');
  assert.equal(trajectoryLearning.contract_status, 'ready_for_agent_lab_consumption_refs_only');
  assertNoForbiddenAuthority(trajectoryLearning, 'trajectoryLearning');
  asStrings(trajectoryLearning.semantic_pack_refs).forEach(assertUsablePackFile);
});

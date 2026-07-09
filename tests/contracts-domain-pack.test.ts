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

function assertIncludesAll(actual: unknown, expected: string[], label: string): void {
  const values = asStrings(actual);
  expected.forEach((value) => assert.ok(values.includes(value), `${label} should include ${value}`));
}

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

  assert.equal(packCompilerInput.domain_pack_owner, 'opl-meta-agent');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.canonical_semantic_pack_role, 'repo_source_declarative_meta_agent_pack');
  assert.equal(generatedSurfaceHandoff.generated_interface_role, 'invoke_and_project_without_domain_authority_escalation');
  assertIncludesAll(generatedSurfaceHandoff.required_domain_handoff, [
    'domain_pack_paths_exist_and_are_non_empty',
    'stage_prompt_refs_resolve_to_domain_pack_files',
  ], 'generatedSurfaceHandoff.required_domain_handoff');

  const actualDomainPackPaths = listMarkdownFiles('agent')
    .filter((relativePath) => !relativePath.endsWith('/README.md'))
    .filter((relativePath) => !relativePath.endsWith('/TOMBSTONE.md'));
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, actualDomainPackPaths);
  packCompilerInput.required_domain_pack_paths.forEach(assertUsablePackFile);

  [
    ['prompt_refs', 'domain_prompt_ref', /^agent\/prompts\/.+\.md$/],
    ['skills', 'domain_skill_ref', /^agent\/skills\/.+\.md$/],
    ['knowledge_refs', 'domain_knowledge_ref', /^agent\/knowledge\/.+\.md$/],
    ['evaluation', 'domain_quality_gate_ref', /^agent\/quality_gates\/.+\.md$/],
  ].forEach(([field, refKind, pathPattern]) => {
    asObjects(stageControl.stages).forEach((stage) => {
      const refs = stage[field as string] as Array<{ ref_kind: string; ref: string }>;
      assert.ok(refs.length > 0, `${stage.stage_id}.${field} should not be empty`);
      refs.forEach((stageRef) => {
        assert.equal(stageRef.ref_kind, refKind);
        assert.match(stageRef.ref, pathPattern as RegExp);
        assertUsablePackFile(stageRef.ref);
      });
    });
  });

  const generatedInterfaceBoundary = packCompilerInput.authority_boundary;
  assert.equal(generatedInterfaceBoundary.domain_pack_can_supply_domain_truth_refs, true);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_invoke_minimal_authority_functions, true);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_write_domain_truth, false);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_authorize_quality_or_export, false);
});

test('domain skill declarations and professional skills stay separate', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const requiredPackPaths = asStrings(packCompilerInput.required_domain_pack_paths);
  const expectedPrimarySkillPaths = ['agent/primary_skill/SKILL.md'];
  const expectedDomainSkillPaths = ['agent/skills/agent-baseline-build.md', 'agent/skills/external-suite-improvement.md', 'agent/skills/external-work-order-execution.md', 'agent/skills/opl-meta-agent-domain-skill.md', 'agent/skills/trajectory-learning-intake.md'];
  const expectedProfessionalSkillPaths = ['agent/professional_skills/oma-agent-design-evolution/SKILL.md', 'agent/professional_skills/oma-eval-takeover-review/SKILL.md', 'agent/professional_skills/oma-stage-pack-intent-architecture/SKILL.md', 'agent/professional_skills/oma-work-order-hygiene/SKILL.md'];

  assert.deepEqual(requiredPackPaths.filter((relativePath) => relativePath.startsWith('agent/primary_skill/')), expectedPrimarySkillPaths);
  assert.deepEqual(requiredPackPaths.filter((relativePath) => relativePath.startsWith('agent/skills/')), expectedDomainSkillPaths);
  assert.deepEqual(requiredPackPaths.filter((relativePath) => relativePath.startsWith('agent/professional_skills/')), expectedProfessionalSkillPaths);
  assert.deepEqual(listMarkdownFiles('agent/professional_skills').filter((relativePath) => relativePath.endsWith('/TOMBSTONE.md')), []);
  assert.equal(requiredPackPaths.some((relativePath) => /^agent\/skills\/oma-.+\.md$/.test(relativePath)), false);

  const primaryCapability = capabilityMap.primary_skill_capability;
  assert.equal(primaryCapability.surface_role, 'primary_skill');
  assert.equal(primaryCapability.physical_source_ref.ref, 'agent/primary_skill/SKILL.md');
  assert.deepEqual(asStrings(primaryCapability.canonical_paths), expectedPrimarySkillPaths);
  assert.deepEqual(primaryCapability.carrier_projection_contract, {
    canonical_source: 'agent/primary_skill/SKILL.md',
    carrier_skill_ref: 'plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md',
    carrier_materialization: 'materialized_full_skill_copy',
    codex_install_requires_real_skill_md: true,
    plugin_skill_must_remain_real_file: true,
    carrier_role: 'transport_install_detail_not_agent_membership_or_status',
    authority: false,
    carrier_can_override_canonical_source: false,
    carrier_can_claim_agent_membership_or_status: false,
    carrier_is_domain_truth_source: false,
  });
  assert.equal(readText('plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md'), readText('agent/primary_skill/SKILL.md'));
  assert.equal(readJson('plugins/opl-meta-agent/.codex-plugin/plugin.json').name, 'opl-meta-agent');

  const professionalCapabilities = asObjects(capabilityMap.capabilities)
    .filter((capability) => capability.surface_role === 'professional_skill');
  assert.deepEqual(
    professionalCapabilities.map((capability) => capability.physical_source_ref.ref).sort(),
    expectedProfessionalSkillPaths,
  );
  professionalCapabilities.forEach((capability) => {
    assert.equal(capability.capability_kind, 'professional_skill');
    assert.deepEqual(asStrings(capability.canonical_paths), [capability.physical_source_ref.ref]);
    assert.ok(asStrings(capability.improvement_tokens).length > 0);
    assert.equal(capability.codex_default_exposure, false);
  });

  const legacyRedirects = asObjects(capabilityMap.legacy_professional_skill_redirects);
  assert.equal(legacyRedirects.length, 9);
  legacyRedirects.forEach((entry) => {
    assert.equal(entry.state, 'legacy_redirect');
    assert.match(String(entry.legacy_ref), /^legacy-professional-skill:oma-.+$/);
    assert.ok(expectedProfessionalSkillPaths.includes(String(entry.canonical_ref)));
    assert.equal(entry.default_codex_exposure, false);
  });

  assert.match(readText('agent/primary_skill/SKILL.md'), /New-Agent Delivery Gate/);
  assert.match(readText('agent/skills/README.md'), /domain skill declarations/);
  assert.match(readText('agent/professional_skills/README.md'), /repo-local Codex-style/);
});

test('semantic pack keeps Codex-first expert judgment above mechanical gates', () => {
  const requiredFragmentsByFile: Record<string, string[]> = {
    'agent/knowledge/opl-boundary-policy.md': ['Codex-first', 'contract completeness', 'AI reviewer'],
    'agent/prompts/intent-intake.md': ['Codex-first', 'knowledge/tool gap blocker'],
    'agent/prompts/stage-decomposition.md': ['AI executor autonomy', 'knowledge/tool/rubric gap blocker'],
    'agent/prompts/optimizer-iteration.md': ['root-cause reasoning', 'AI reviewer'],
    'agent/prompts/online-learning.md': ['direct evidence refs', 'no-current-failure'],
    'agent/quality_gates/mechanism-patch-adoption.md': ['no-shared-context', 'suite pass', 'Codex/owner'],
  };

  Object.entries(requiredFragmentsByFile).forEach(([relativePath, fragments]) => {
    const content = readText(relativePath);
    fragments.forEach((fragment) => {
      assert.match(content, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${relativePath} should contain ${fragment}`);
    });
  });
});

test('trajectory learning contract absorbs xskill patterns as OMA-native refs-only proposals', () => {
  const trajectoryLearning = readJson('contracts/trajectory_learning_contract.json');

  assert.equal(trajectoryLearning.surface_kind, 'opl_meta_agent_trajectory_learning_contract');
  assert.equal(trajectoryLearning.source_disposition, 'clean_room_pattern_source');
  assert.equal(trajectoryLearning.source_project_ref, 'https://github.com/skillnerds/xskill');
  assert.equal(trajectoryLearning.contract_status, 'ready_for_agent_lab_consumption_refs_only');
  assertNoForbiddenAuthority(trajectoryLearning, 'trajectoryLearning');
  assert.equal(trajectoryLearning.authority_boundary.can_run_trajectory_daemon, false);
  assert.equal(trajectoryLearning.authority_boundary.can_install_user_scope_skills, false);
  assert.equal(trajectoryLearning.authority_boundary.oma_outputs_are_proposals_only, true);
  assertIncludesAll(trajectoryLearning.absorbed_pattern_refs, ['xskill-pattern:trajectory-to-single-intent-atom', 'xskill-pattern:atom-to-candidate-buffer', 'xskill-pattern:candidate-buffer-to-skill-or-policy-proposal'], 'trajectoryLearning.absorbed_pattern_refs');
  assertIncludesAll(trajectoryLearning.forbidden_imports, ['xskill-daemon-runtime', 'xskill-team-server', 'xskill-generic-scheduler'], 'trajectoryLearning.forbidden_imports');

  [
    'agent/knowledge/trajectory-learning-policy.md',
    'agent/prompts/trajectory-learning-intake.md',
    'agent/skills/trajectory-learning-intake.md',
    'agent/quality_gates/trajectory-learning-proposal.md',
    'agent/stages/trajectory-learning-intake.md',
  ].forEach((relativePath) => {
    assert.ok(asStrings(trajectoryLearning.semantic_pack_refs).includes(relativePath));
    assertUsablePackFile(relativePath);
  });

  assertIncludesAll(asObjects(trajectoryLearning.learning_flow).map((entry) => String(entry.step_id)), ['redacted_trajectory_ref_intake', 'candidate_buffer_accumulation', 'proposal_materialization', 'agent_lab_promotion_gate'], 'trajectoryLearning.learning_flow');
  assertIncludesAll(trajectoryLearning.required_receipt_refs, ['redaction-proof-ref', 'ux-signal-ref-not-quality-verdict', 'agent-lab-promotion-gate-ref'], 'trajectoryLearning.required_receipt_refs');
});

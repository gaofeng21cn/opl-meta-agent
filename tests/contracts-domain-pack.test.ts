import test from 'node:test';
import {
  assert,
  asObjects,
  asStrings,
  readJson,
  readText,
  listMarkdownFiles,
  assertUsablePackFile,
  assertNoForbiddenAuthority,
} from './support/contracts.ts';

test('opl-meta-agent descriptor keeps OPL runtime authority outside the repo', () => {
  const descriptor = readJson('contracts/domain_descriptor.json');

  assert.equal(descriptor.domain_id, 'opl-meta-agent');
  assert.equal(descriptor.domain_label, 'OPL Meta Agent');
  assert.equal(descriptor.agent_role, 'opl_based_foundry_agent');
  assert.equal(descriptor.delivery_domain, 'agent_development');
  assert.equal(descriptor.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(descriptor.authority_boundary.opl_can_authorize_quality_or_export, false);
  assert.equal(descriptor.authority_boundary.opl_meta_agent_can_train_or_deploy_model_weights, false);
  assert.equal(descriptor.authority_boundary.opl_meta_agent_can_promote_default_agent_without_gate, false);
  assert.ok(descriptor.outputs.includes('mechanism_patch_proposal_ref'));
});

test('domain pack files and stage prompt refs resolve to usable repo files', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');

  assert.equal(packCompilerInput.domain_pack_owner, 'opl-meta-agent');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.canonical_semantic_pack_role, 'repo_source_declarative_meta_agent_pack');
  assert.ok(
    asStrings(packCompilerInput.declarative_domain_pack)
      .includes('target_owner_closeout_hook_delegation_policy'),
  );
  assert.equal(generatedSurfaceHandoff.canonical_semantic_pack_root, 'agent/');
  assert.equal(generatedSurfaceHandoff.domain_pack_role, 'domain_truth_prompt_skill_stage_quality_refs_only');
  assert.equal(
    generatedSurfaceHandoff.generated_interface_role,
    'invoke_and_project_without_domain_authority_escalation',
  );
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('domain_pack_paths_exist_and_are_non_empty'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('stage_prompt_refs_resolve_to_domain_pack_files'));

  const actualDomainPackPaths = listMarkdownFiles('agent')
    .filter((relativePath) => !relativePath.endsWith('/README.md'));
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, actualDomainPackPaths);
  assert.equal(packCompilerInput.required_domain_pack_paths.some((relativePath) => (
    relativePath.endsWith('/README.md')
  )), false);
  packCompilerInput.required_domain_pack_paths.forEach(assertUsablePackFile);

  const stageRefSpecs = [
    {
      field: 'prompt_refs',
      refKind: 'domain_prompt_ref',
      pathPattern: /^agent\/prompts\/.+\.md$/,
    },
    {
      field: 'skills',
      refKind: 'domain_skill_ref',
      pathPattern: /^agent\/skills\/.+\.md$/,
    },
    {
      field: 'knowledge_refs',
      refKind: 'domain_knowledge_ref',
      pathPattern: /^agent\/knowledge\/.+\.md$/,
    },
    {
      field: 'evaluation',
      refKind: 'domain_quality_gate_ref',
      pathPattern: /^agent\/quality_gates\/.+\.md$/,
    },
  ];

  asObjects(stageControl.stages).forEach((stage) => {
    stageRefSpecs.forEach((spec) => {
      const refs = stage[spec.field];
      assert.ok(Array.isArray(refs), `${stage.stage_id}.${spec.field} should be an array`);
      assert.ok(refs.length > 0, `${stage.stage_id}.${spec.field} should not be empty`);
      refs.forEach((stageRef) => {
        assert.equal(stageRef.ref_kind, spec.refKind);
        assert.match(stageRef.ref, spec.pathPattern);
        assertUsablePackFile(stageRef.ref);
      });
    });
  });

  const generatedInterfaceBoundary = packCompilerInput.authority_boundary;
  assert.equal(generatedInterfaceBoundary.domain_pack_can_supply_domain_truth_refs, true);
  assert.equal(generatedInterfaceBoundary.domain_pack_can_supply_prompt_skill_stage_quality_refs, true);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_invoke_minimal_authority_functions, true);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_write_domain_truth, false);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_write_memory_body, false);
  assert.equal(generatedInterfaceBoundary.generated_interface_can_authorize_quality_or_export, false);
});

test('domain skill declarations and professional skills stay separate', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const requiredPackPaths = asStrings(packCompilerInput.required_domain_pack_paths);
  const expectedDomainSkillPaths = [
    'agent/skills/agent-baseline-build.md',
    'agent/skills/external-suite-improvement.md',
    'agent/skills/external-work-order-execution.md',
    'agent/skills/opl-meta-agent-domain-skill.md',
    'agent/skills/trajectory-learning-intake.md',
  ];
  const expectedProfessionalSkillPaths = [
    'agent/professional_skills/oma-agent-evolution/SKILL.md',
    'agent/professional_skills/oma-agent-lab-suite-designer/SKILL.md',
    'agent/professional_skills/oma-external-pattern-researcher/SKILL.md',
    'agent/professional_skills/oma-intent-architect/SKILL.md',
    'agent/professional_skills/oma-stage-pack-architect/SKILL.md',
    'agent/professional_skills/oma-takeover-reviewer/SKILL.md',
    'agent/professional_skills/oma-trajectory-learning-analyst/SKILL.md',
    'agent/professional_skills/oma-work-order-author/SKILL.md',
  ];

  assert.deepEqual(
    requiredPackPaths.filter((relativePath) => relativePath.startsWith('agent/skills/')),
    expectedDomainSkillPaths,
  );
  assert.deepEqual(
    requiredPackPaths.filter((relativePath) => relativePath.startsWith('agent/professional_skills/')),
    expectedProfessionalSkillPaths,
  );
  assert.equal(
    requiredPackPaths.some((relativePath) => /^agent\/skills\/oma-.+\.md$/.test(relativePath)),
    false,
  );

  const professionalCapabilities = asObjects(capabilityMap.capabilities)
    .filter((capability) => capability.surface_role === 'professional_skill');
  assert.deepEqual(
    professionalCapabilities.map((capability) => capability.physical_source_ref.ref).sort(),
    expectedProfessionalSkillPaths,
  );
  professionalCapabilities.forEach((capability) => {
    assert.equal(capability.capability_kind, 'professional_skill');
    assert.equal(capability.physical_source_ref.role, 'professional_skill_source');
    assert.deepEqual(asStrings(capability.canonical_paths), [capability.physical_source_ref.ref]);
    assert.ok(asStrings(capability.improvement_tokens).length > 0);
    assert.ok(asStrings(capability.verification_refs).length > 0);
    assert.ok(asStrings(capability.forbidden_surfaces).length > 0);
    assert.equal(typeof capability.failure_token_registry_ref, 'string');
  });

  assert.match(readText('agent/skills/README.md'), /domain skill declarations/);
  assert.match(readText('agent/professional_skills/README.md'), /repo-local Codex-style/);
});

test('semantic pack keeps Codex-first expert judgment above mechanical gates', () => {
  const requiredFragmentsByFile: Record<string, string[]> = {
    'agent/knowledge/opl-boundary-policy.md': [
      'Codex-first',
      '最强 AI executor',
      'contract completeness',
      '独立 AI reviewer',
      'no-shared-context',
    ],
    'agent/prompts/intent-intake.md': [
      'Codex-first',
      '反例',
      'knowledge/tool gap blocker',
    ],
    'agent/prompts/stage-decomposition.md': [
      'AI executor autonomy',
      '限制 AI executor',
      'knowledge/tool/rubric gap blocker',
    ],
    'agent/prompts/optimizer-iteration.md': [
      'root-cause reasoning',
      '独立 reviewer',
      'scorecard pass',
    ],
    'agent/prompts/online-learning.md': [
      '反事实',
      'direct evidence refs',
      'no-current-failure',
    ],
    'agent/quality_gates/mechanism-patch-adoption.md': [
      'independent AI reviewer direct-evidence',
      'no-shared-context',
      'suite pass',
      'Codex/owner',
    ],
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
  assert.equal(trajectoryLearning.owner, 'opl-meta-agent');
  assert.equal(trajectoryLearning.source_disposition, 'clean_room_pattern_source');
  assert.equal(trajectoryLearning.source_project_ref, 'https://github.com/skillnerds/xskill');
  assert.equal(trajectoryLearning.contract_status, 'ready_for_agent_lab_consumption_refs_only');
  assertNoForbiddenAuthority(trajectoryLearning, 'trajectoryLearning');
  assert.equal(trajectoryLearning.authority_boundary.can_run_trajectory_daemon, false);
  assert.equal(trajectoryLearning.authority_boundary.can_install_user_scope_skills, false);
  assert.equal(trajectoryLearning.authority_boundary.can_claim_ux_score_as_quality_verdict, false);
  assert.equal(trajectoryLearning.authority_boundary.opl_owns_generic_ingest_and_sync_runtime, true);
  assert.equal(trajectoryLearning.authority_boundary.agent_lab_owns_promotion_gate, true);
  assert.equal(trajectoryLearning.authority_boundary.oma_outputs_are_proposals_only, true);

  assert.deepEqual(asStrings(trajectoryLearning.absorbed_pattern_refs), [
    'xskill-pattern:trajectory-to-single-intent-atom',
    'xskill-pattern:atom-to-candidate-buffer',
    'xskill-pattern:candidate-buffer-to-skill-or-policy-proposal',
    'xskill-pattern:per-skill-versioned-canary-evidence',
    'xskill-pattern:team-redaction-before-shared-learning',
  ]);
  assert.deepEqual(asStrings(trajectoryLearning.forbidden_imports), [
    'xskill-daemon-runtime',
    'xskill-team-server',
    'xskill-user-scope-skill-installer',
    'xskill-generic-scheduler',
    'xskill-canary-as-owner-verdict',
  ]);

  const semanticRefs = asStrings(trajectoryLearning.semantic_pack_refs);
  [
    'agent/knowledge/trajectory-learning-policy.md',
    'agent/prompts/trajectory-learning-intake.md',
    'agent/skills/trajectory-learning-intake.md',
    'agent/quality_gates/trajectory-learning-proposal.md',
    'agent/stages/trajectory-learning-intake.md',
  ].forEach((relativePath) => {
    assert.ok(semanticRefs.includes(relativePath), `semantic pack should include ${relativePath}`);
    assertUsablePackFile(relativePath);
  });

  assert.deepEqual(asObjects(trajectoryLearning.learning_flow).map((entry) => entry.step_id), [
    'redacted_trajectory_ref_intake',
    'single_intent_atomization',
    'candidate_buffer_accumulation',
    'proposal_materialization',
    'agent_lab_promotion_gate',
  ]);
  assert.ok(
    asStrings(trajectoryLearning.required_receipt_refs).includes('redaction-proof-ref'),
    'redaction proof should be required',
  );
  assert.ok(
    asStrings(trajectoryLearning.required_receipt_refs).includes('ux-signal-ref-not-quality-verdict'),
    'UX signal should be explicitly downgraded from quality verdict',
  );
  assert.ok(
    asStrings(trajectoryLearning.required_receipt_refs).includes('agent-lab-promotion-gate-ref'),
    'Agent Lab promotion gate should remain the promotion authority',
  );
});

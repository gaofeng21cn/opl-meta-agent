import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

function asObjects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

function asStrings(value: unknown): string[] {
  return value as string[];
}

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function listMarkdownFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(entryRelativePath);
      }
      return entry.name.endsWith('.md') ? [entryRelativePath] : [];
    })
    .sort();
}

function listFilesByExtension(relativeDir: string, extension: string): string[] {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs.readdirSync(absoluteDir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        return listFilesByExtension(entryRelativePath, extension);
      }
      return entry.name.endsWith(extension) ? [entryRelativePath] : [];
    })
    .sort();
}

function assertUsablePackFile(relativePath: string): void {
  const absolutePath = path.join(repoRoot, relativePath);
  assert.equal(fs.existsSync(absolutePath), true, `${relativePath} should exist`);
  const content = fs.readFileSync(absolutePath, 'utf8');
  assert.ok(content.trim().length > 0, `${relativePath} should not be empty`);
  assert.equal(placeholderPattern.test(content), false, `${relativePath} should not contain placeholder markers`);
}

function assertRepoRefExists(relativePath: string): void {
  assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
}

function assertNoForbiddenAuthority(surface: JsonObject, label: string): void {
  assert.equal(surface.owner, 'opl-meta-agent', `${label}.owner`);
  assert.equal(surface.authority_boundary.refs_only, true, `${label} should be refs-only`);
  assert.equal(surface.authority_boundary.not_generic_runtime_owner, true, `${label} should not own generic runtime`);
  assert.equal(surface.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(surface.authority_boundary.can_write_target_domain_memory_body, false);
  assert.equal(surface.authority_boundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(surface.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(surface.authority_boundary.can_promote_default_agent_without_gate, false);
}

function assertNoForbiddenDesignCenterVocabulary(relativePath: string): void {
  const content = readText(relativePath).toLowerCase();
  [
    /\bmed-autoscience\b/,
    /\bmed-autogrant\b/,
    /(?:^|[:/_.-])mas(?:$|[:/_.-])/,
    /(?:^|[:/_.-])mag(?:$|[:/_.-])/,
    /\bmedical\b/,
    /\bgrant\b/,
    /\bmanuscript\b/,
    /\bpublication\b/,
    /\bfundability\b/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(content), false, `${relativePath} should not match ${pattern}`);
  });
}

const opl10PrincipleRefs = [
  'opl10:codex_cli_first_class_executor',
  'opl10:stage_led_execution',
  'opl10:declarative_domain_pack',
  'opl10:explicit_prompt_tools_knowledge',
  'opl10:refs_only_domain_truth_boundary',
  'opl10:receipted_handoff',
  'opl10:independent_ai_review_gate',
  'opl10:runtime_enforced_no_forbidden_writes',
  'opl10:generated_surfaces_from_contracts',
  'opl10:blockers_before_quality_or_promotion_claims',
];

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

test('opl-meta-agent stage plan covers research, build, eval, optimization, delivery, and learning', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  assert.equal(stageControl.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControl.version, 'family-stage-control-plane.v1');
  assert.deepEqual(asObjects(stageControl.stages).map((stage) => stage.stage_id), [
    'intent-intake',
    'web-experience-research',
    'stage-decomposition',
    'agent-skeleton-build',
    'eval-suite-build',
    'baseline-run',
    'external-agent-takeover',
    'optimizer-iteration',
    'baseline-delivery',
    'trajectory-learning-intake',
    'online-learning',
  ]);
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'agent-skeleton-build')?.allowed_action_refs,
    ['build-agent-baseline'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'external-agent-takeover')?.allowed_action_refs,
    ['takeover-external-agent-test'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'optimizer-iteration')?.allowed_action_refs,
    ['improve-from-external-agent-lab-suite'],
  );
  assert.equal(stageControl.opl_runtime_dependency.agent_lab_complete_control_plane, true);
  assert.equal(stageControl.opl_runtime_dependency.standard_domain_agent_scaffold, true);
  assert.equal(stageControl.opl_runtime_dependency.generated_interface_bundle, true);
  assert.equal(stageControl.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(stageControl.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(stageControl.authority_boundary.opl_can_authorize_quality_or_export, false);
});

test('stage launch contract is Codex-first, receipted, and OPL-10 bounded', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  asObjects(stageControl.stages).forEach((stage) => {
    const label = String(stage.stage_id);
    assert.equal(stage.selected_executor, 'codex_cli', `${label}.selected_executor`);
    assert.equal(
      stage.executor_binding.binding_kind,
      'codex_cli_first_class_stage_executor',
      `${label}.executor_binding.binding_kind`,
    );
    assert.equal(stage.executor_binding.executor_ref, 'executor:codex-cli', `${label}.executor_ref`);
    assert.equal(stage.executor_binding.executor_owner, 'OPL Framework', `${label}.executor_owner`);
    assert.equal(stage.executor_binding.launch_surface_owner, 'one-person-lab', `${label}.launch_surface_owner`);
    assert.equal(stage.executor_binding.domain_pack_owner, 'opl-meta-agent', `${label}.domain_pack_owner`);
    assert.equal(stage.executor_binding.adapter_required, false, `${label}.adapter_required`);
    assert.equal(
      stage.executor_binding.non_codex_executor_requires_explicit_adapter,
      true,
      `${label}.non_codex_executor_requires_explicit_adapter`,
    );
    assert.equal(
      stage.executor_binding.codex_first_expert_judgment_required,
      true,
      `${label}.codex_first_expert_judgment_required`,
    );

    const requires = asStrings(stage.requires);
    const ensures = asStrings(stage.ensures);
    const expectedReceiptRefs = asStrings(stage.expected_receipt_refs);
    const hardBlockerRefs = asStrings(stage.hard_blocker_refs);

    assert.ok(requires.includes(`stage:${label}`), `${label}.requires should include stage ref`);
    assert.ok(requires.includes('runtime-ref:stage-attempt-ledger'), `${label}.requires should include stage ledger`);
    assert.ok(
      requires.includes('runtime-ref:generated-interface-bundle'),
      `${label}.requires should include generated interface bundle`,
    );
    assert.ok(ensures.includes(`stage-attempt-receipt-ref:${label}`), `${label}.ensures stage receipt`);
    assert.ok(ensures.includes(`executor-receipt-ref:${label}/codex-cli`), `${label}.ensures executor receipt`);
    assert.ok(ensures.includes(`no-forbidden-write-proof-ref:${label}`), `${label}.ensures boundary proof`);
    assert.ok(ensures.includes(`independent-ai-review-ref:${label}`), `${label}.ensures AI review`);
    assert.ok(
      expectedReceiptRefs.includes(`boundary-receipt-ref:${label}/refs-only`),
      `${label}.expected_receipt_refs boundary receipt`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`independent-ai-review-ref:${label}`),
      `${label}.expected_receipt_refs AI review`,
    );

    asObjects(stage.prompt_refs).forEach((entry) => {
      assert.ok(requires.includes(`prompt-ref:${entry.ref}`), `${label}.requires prompt ref ${entry.ref}`);
    });
    asObjects(stage.skills).forEach((entry) => {
      assert.ok(requires.includes(`skill-ref:${entry.ref}`), `${label}.requires skill ref ${entry.ref}`);
    });
    asObjects(stage.knowledge_refs).forEach((entry) => {
      assert.ok(requires.includes(`knowledge-ref:${entry.ref}`), `${label}.requires knowledge ref ${entry.ref}`);
    });
    asObjects(stage.evaluation).forEach((entry) => {
      assert.ok(requires.includes(`quality-gate-ref:${entry.ref}`), `${label}.requires quality gate ref ${entry.ref}`);
    });
    asStrings(stage.allowed_action_refs).forEach((actionRef) => {
      assert.ok(requires.includes(`action-ref:${actionRef}`), `${label}.requires action ref ${actionRef}`);
    });

    assert.equal(stage.verified_static_core.status, 'required_before_launch', `${label}.verified_static_core.status`);
    [
      'prompt_refs_resolve_to_domain_pack_files',
      'skill_refs_resolve_to_domain_pack_files',
      'knowledge_refs_resolve_to_domain_pack_files',
      'quality_gate_refs_resolve_to_domain_pack_files',
      'allowed_action_refs_resolve_to_action_catalog_when_present',
      'authority_boundary_forbids_domain_truth_memory_quality_and_promotion_writes',
    ].forEach((checkRef) => {
      assert.ok(stage.verified_static_core.checks.includes(checkRef), `${label}.verified_static_core ${checkRef}`);
    });

    assert.deepEqual(stage.runtime_enforced_boundary.opl_10_principle_refs, opl10PrincipleRefs);
    assert.equal(stage.runtime_enforced_boundary.codex_first, true, `${label}.codex_first`);
    assert.equal(
      stage.runtime_enforced_boundary.selected_executor_must_match_binding,
      true,
      `${label}.selected_executor_must_match_binding`,
    );
    assert.equal(stage.runtime_enforced_boundary.stage_attempt_ledger_required, true, `${label}.ledger_required`);
    assert.equal(stage.runtime_enforced_boundary.receipt_refs_required, true, `${label}.receipt_refs_required`);
    assert.equal(
      stage.runtime_enforced_boundary.independent_ai_review_required_before_promotion,
      true,
      `${label}.independent_review_required`,
    );
    assert.equal(stage.runtime_enforced_boundary.no_shared_context_review_required, true, `${label}.no_shared_context`);
    assert.equal(stage.runtime_enforced_boundary.generated_surface_owner, 'one-person-lab', `${label}.generated owner`);
    assert.equal(stage.runtime_enforced_boundary.domain_truth_owner, 'opl-meta-agent', `${label}.truth owner`);
    assert.equal(stage.runtime_enforced_boundary.can_write_domain_truth, false, `${label}.truth write`);
    assert.equal(stage.runtime_enforced_boundary.can_write_memory_body, false, `${label}.memory write`);
    assert.equal(
      stage.runtime_enforced_boundary.can_mutate_target_domain_artifact_body,
      false,
      `${label}.artifact write`,
    );
    assert.equal(stage.runtime_enforced_boundary.can_authorize_quality_or_export, false, `${label}.quality authority`);
    assert.equal(
      stage.runtime_enforced_boundary.can_promote_default_agent_without_gate,
      false,
      `${label}.default promotion`,
    );
    assert.equal(stage.runtime_enforced_boundary.suite_pass_claims_domain_ready, false, `${label}.suite pass claim`);
    [
      'blocker:missing_prompt_ref',
      'blocker:missing_tool_or_skill_ref',
      'blocker:missing_knowledge_or_memory_ref',
      'blocker:missing_quality_gate_ref',
      'blocker:missing_expected_receipt_ref',
      'blocker:forbidden_domain_truth_or_memory_write',
      'blocker:quality_or_promotion_claim_without_independent_ai_review',
      'blocker:contract_completeness_claimed_as_quality_verdict',
    ].forEach((blockerRef) => {
      assert.ok(hardBlockerRefs.includes(blockerRef), `${label}.hard_blocker_refs ${blockerRef}`);
    });
  });
});

test('stage executor policy candidates stay gated, refs-only, and non-default explicit', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  assert.equal(stageControl.opl_runtime_dependency.agent_lab_stage_executor_policy_read_model, true);
  assert.equal(stageControl.authority_boundary.opl_can_switch_default_executor, false);
  assert.equal(stageControl.authority_boundary.oma_can_switch_default_executor, false);

  asObjects(stageControl.stages).forEach((stage) => {
    const label = String(stage.stage_id);
    assert.equal(stage.selected_executor, 'codex_cli', `${label}.selected_executor remains Codex first-class`);
    assert.ok(
      asStrings(stage.requires).includes('runtime-ref:stage-executor-policy-gate'),
      `${label}.requires stage executor policy gate`,
    );
    assert.ok(
      asStrings(stage.hard_blocker_refs).includes('blocker:missing_non_default_executor_binding_ref'),
      `${label}.hard_blocker_refs missing non-default binding blocker`,
    );

    assert.equal(
      stage.executor_policy_capability.supports_stage_level_executor_policy,
      true,
      `${label}.supports_stage_level_executor_policy`,
    );
    assert.equal(stage.executor_policy_capability.default_executor_kind, 'codex_cli', `${label}.default_executor_kind`);
    assert.equal(
      stage.executor_policy_capability.non_default_executor_policy_allowed,
      true,
      `${label}.non_default_executor_policy_allowed`,
    );
    assert.equal(
      stage.executor_policy_capability.non_default_executor_requires_explicit_adapter,
      true,
      `${label}.non_default_executor_requires_explicit_adapter`,
    );
    assert.equal(
      stage.executor_policy_capability.non_default_executor_requires_executor_binding_ref,
      true,
      `${label}.non_default_executor_requires_executor_binding_ref`,
    );
    assert.deepEqual(stage.executor_policy_capability.policy_fields, [
      'executor_kind',
      'model',
      'reasoning_effort',
      'provider',
      'executor_binding_ref',
      'executor_labels',
      'required_capabilities',
      'receipt_requirements',
    ]);
    assert.equal(
      stage.executor_policy_capability.agent_lab_trial_required_before_default_promotion,
      true,
      `${label}.agent_lab_trial_required_before_default_promotion`,
    );
    assert.equal(
      stage.executor_policy_capability.quality_equivalence_claim_allowed,
      false,
      `${label}.quality_equivalence_claim_allowed`,
    );
    assert.equal(
      stage.executor_policy_capability.default_executor_switch_allowed_by_oma,
      false,
      `${label}.default_executor_switch_allowed_by_oma`,
    );

    const candidates = asObjects(stage.stage_executor_policy_candidates);
    assert.ok(candidates.length > 0, `${label}.stage_executor_policy_candidates should not be empty`);
    candidates.forEach((candidate) => {
      assert.equal(candidate.candidate_kind, 'stage_executor_policy_candidate', `${label}.candidate_kind`);
      assert.equal(candidate.stage_id, label, `${label}.candidate stage_id`);
      assert.equal(candidate.default_executor_kind, 'codex_cli', `${label}.candidate default_executor_kind`);
      assert.equal(
        candidate.candidate_status,
        'candidate_ref_only_requires_agent_lab_trial',
        `${label}.candidate_status`,
      );
      assert.equal(candidate.can_claim_quality_equivalence, false, `${label}.candidate quality equivalence`);
      assert.equal(candidate.can_change_default_executor, false, `${label}.candidate default switch`);
      assert.match(
        candidate.candidate_ref,
        new RegExp(`^stage-executor-policy-candidate:opl-meta-agent/${label}/`),
        `${label}.candidate_ref`,
      );
      assert.ok(asStrings(candidate.receipt_requirements).length > 0, `${label}.candidate receipts`);
      assert.ok(asStrings(candidate.required_capabilities).length > 0, `${label}.candidate capabilities`);

      if (candidate.executor_kind === 'codex_cli') {
        assert.equal(candidate.can_launch_without_explicit_binding, true, `${label}.codex launch binding`);
        assert.equal(
          String(candidate.executor_binding_ref).startsWith('opl://executors/codex-cli/'),
          true,
          `${label}.codex binding ref`,
        );
      } else {
        assert.equal(candidate.can_launch_without_explicit_binding, false, `${label}.non-default launch binding`);
        assert.ok(
          asStrings(candidate.receipt_requirements).includes('executor_binding_ref'),
          `${label}.non-default requires executor_binding_ref receipt`,
        );
      }
    });
  });

  const evalSuite = asObjects(stageControl.stages).find((stage) => stage.stage_id === 'eval-suite-build');
  assert.ok(evalSuite);
  const antigravityCandidate = asObjects(evalSuite.stage_executor_policy_candidates)
    .find((candidate) => candidate.executor_kind === 'antigravity_cli');
  assert.ok(antigravityCandidate);
  assert.equal(antigravityCandidate.model, 'gemini-3.5-flash');
  assert.equal(antigravityCandidate.reasoning_effort, 'high');
  assert.equal(antigravityCandidate.provider, 'google');
  assert.equal(
    antigravityCandidate.executor_binding_ref,
    'executor-binding:antigravity/opl-meta-agent-eval-suite-build-html-authoring',
  );
  assert.ok(asStrings(antigravityCandidate.required_capabilities).includes('html_generation'));
  assert.ok(asStrings(antigravityCandidate.required_capabilities).includes('visual_layout_iteration'));
  assert.ok(
    asStrings(antigravityCandidate.receipt_requirements)
      .includes('executor-receipt-ref:eval-suite-build/antigravity-cli'),
  );
  assert.ok(
    asStrings(antigravityCandidate.receipt_requirements).includes('agent-lab-stage-executor-policy-trial-ref'),
  );

  const research = asObjects(stageControl.stages).find((stage) => stage.stage_id === 'web-experience-research');
  assert.ok(research);
  const claudeCandidate = asObjects(research.stage_executor_policy_candidates)
    .find((candidate) => candidate.executor_kind === 'claude_code');
  assert.ok(claudeCandidate);
  assert.equal(claudeCandidate.executor_binding_ref, null);
  assert.equal(claudeCandidate.can_launch_without_explicit_binding, false);
  assert.ok(asStrings(claudeCandidate.receipt_requirements).includes('executor_binding_ref'));
  assert.ok(
    asStrings(research.hard_blocker_refs).includes('blocker:missing_non_default_executor_binding_ref'),
    'web-experience-research should fail closed without a non-default executor binding ref',
  );
});

test('action catalog and owner receipts forbid target-domain authority writes', () => {
  const actionCatalog = readJson('contracts/action_catalog.json');
  const ownerReceipt = readJson('contracts/owner_receipt_contract.json');
  const packageJson = readJson('package.json');

  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.match(packageJson.scripts['bootstrap:sample'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['improve:external-suite'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['execute:external-work-order'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['agent:evidence'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['takeover:test'], /--experimental-strip-types/);
  const actions = asObjects(actionCatalog.actions);
  assert.ok(actions.some((action) => action.action_id === 'build-agent-baseline'));
  const takeoverAction = actions.find((action) => action.action_id === 'takeover-external-agent-test');
  assert.ok(takeoverAction);
  assert.equal(takeoverAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(takeoverAction.supported_surfaces.mcp.public_runtime, false);
  assert.equal(takeoverAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(takeoverAction.authority_boundary.can_promote_default_agent_without_gate, false);
  const externalSuiteAction = actions.find(
    (action) => action.action_id === 'improve-from-external-agent-lab-suite',
  );
  assert.ok(externalSuiteAction);
  assert.equal(externalSuiteAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(externalSuiteAction.supported_surfaces.product_entry.action_key, 'improve-from-external-agent-lab-suite');
  assert.equal(externalSuiteAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_source_repo, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_tests, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_docs, true);
  assert.equal(externalSuiteAction.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  assert.ok(externalSuiteAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  const executeWorkOrderAction = actions.find(
    (action) => action.action_id === 'execute-external-work-order',
  );
  assert.ok(executeWorkOrderAction);
  assert.equal(executeWorkOrderAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(executeWorkOrderAction.supported_surfaces.product_entry.action_key, 'execute-external-work-order');
  assert.equal(executeWorkOrderAction.authority_boundary.delegates_to_opl_work_order_execute, true);
  assert.equal(executeWorkOrderAction.authority_boundary.can_own_generic_runner, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_manage_target_worktree_lifecycle, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_absorb_target_branch, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_clean_target_worktree, false);
  assert.equal(executeWorkOrderAction.authority_boundary.owner_closeout_hook_delegated, true);
  assert.equal(executeWorkOrderAction.authority_boundary.target_owner_closeout_owner, 'target-domain via OPL');
  assert.equal(executeWorkOrderAction.authority_boundary.oma_can_write_owner_receipt, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_invoke_target_owner_closeout_hook, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_write_target_owner_receipt_body, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_mutate_target_domain_artifact_body, false);
  assert.ok(executeWorkOrderAction.human_gate_ids.includes('target_domain_owner_closeout_hook_gate'));
  assert.ok(executeWorkOrderAction.workspace_locator_fields.includes('work_order_path'));
  const morphologyPolicy = readJson('runtime/authority_functions/meta-agent-authority-functions.json')
    .script_morphology_policy as JsonObject;
  const executeWorkOrderFunction = asObjects(morphologyPolicy.script_classifications).find(
    (entry) => entry.script_ref === 'scripts/execute-external-work-order.ts',
  );
  assert.ok(executeWorkOrderFunction);
  assert.deepEqual(asStrings(executeWorkOrderFunction.forbidden_roles), []);
  assert.ok(asStrings(executeWorkOrderFunction.writes_only).includes('owner_closeout_hook_delegated_ref'));
  assert.ok(asStrings(executeWorkOrderFunction.writes_only).includes('no_oma_owner_receipt_write_proof_ref'));
  assert.ok(asStrings(executeWorkOrderFunction.consumes_opl_surfaces)
    .includes('opl_work_order_execute_primitive'));
  const baselineAction = actions.find((action) => action.action_id === 'build-agent-baseline');
  assert.ok(baselineAction);
  assert.ok(baselineAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  const mechanismAction = actions.find((action) => action.action_id === 'generate-mechanism-patch-proposal');
  assert.ok(mechanismAction);
  assert.equal(
    mechanismAction.source_command.command,
    'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer',
  );
  assert.equal(mechanismAction.supported_surfaces.cli.surface_kind, 'not_exposed_repo_local_cli');
  assert.equal(
    mechanismAction.supported_surfaces.product_entry.surface_kind,
    'opl_generated_product_entry_descriptor',
  );
  assert.doesNotMatch(JSON.stringify(mechanismAction), /opl-meta-agent authority-function/);
  assert.deepEqual(mechanismAction.workspace_locator_fields, [
    'mechanism_ref',
    'segment_run_ref',
    'evidence_delta_ref',
    'next_mechanism_candidate_ref',
  ]);
  const trajectoryLearningAction = actions.find(
    (action) => action.action_id === 'materialize-trajectory-learning-proposal',
  );
  assert.ok(trajectoryLearningAction);
  assert.equal(
    trajectoryLearningAction.source_command.command,
    'contract-ref:contracts/trajectory_learning_contract.json#/candidate_surfaces',
  );
  assert.equal(trajectoryLearningAction.supported_surfaces.cli.surface_kind, 'not_exposed_repo_local_cli');
  assert.equal(trajectoryLearningAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(
    trajectoryLearningAction.supported_surfaces.product_entry.surface_kind,
    'opl_generated_product_entry_descriptor',
  );
  assert.equal(trajectoryLearningAction.supported_surfaces.product_entry.action_key, 'materialize-trajectory-learning-proposal');
  assert.doesNotMatch(JSON.stringify(trajectoryLearningAction), /opl-meta-agent authority-function/);
  assert.ok(trajectoryLearningAction.workspace_locator_fields.includes('redacted_trajectory_ref'));
  assert.ok(trajectoryLearningAction.workspace_locator_fields.includes('candidate_buffer_ref'));
  assert.ok(trajectoryLearningAction.workspace_locator_fields.includes('agent_lab_promotion_gate_ref'));
  assert.equal(trajectoryLearningAction.authority_boundary.can_run_trajectory_daemon, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_install_user_scope_skills, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_claim_ux_score_as_quality_verdict, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_promote_default_agent_without_gate, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_write_target_domain_truth, false);
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_scheduler_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_cli_mcp_product_wrapper_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_sidecar_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_session_store_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_status_workbench_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_trajectory_daemon_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('user_scope_skill_installer_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generated_surface_owner_in_domain_repo'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('testing_takeover_self_evolution_receipt'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('mechanism_patch_proposal_receipt'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_wrote_target_domain_truth'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_promoted_default_agent_without_gate'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('mechanism_patch_proposal_recorded'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_memory_body_written'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_default_promotion'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_critique_present'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_suggestions_present'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_source_refs_valid'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_provenance_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_critique_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_suggestions_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_source_refs_valid'));
});

test('OPL owns generated interface surfaces for opl-meta-agent contract pack', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');

  assert.equal(packCompilerInput.generated_surface_owner, 'one-person-lab');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.domain_repo_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.generated_surface_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.canonical_semantic_pack_root, 'agent/');
  assert.equal(generatedSurfaceHandoff.domain_repo_can_own_generated_surface, false);
  assert.equal(privatePolicy.default_posture, 'forbidden_until_classified_and_receipted');
  assert.ok(privatePolicy.forbidden_private_surface_classes.includes('generic_cli_mcp_product_wrapper'));
});

test('repo source has no local generated-surface wrappers or runtime adapter placeholders', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, 'plugins')), false, 'repo-local Codex plugin wrapper should not exist');
  assert.deepEqual(
    fs.readdirSync(path.join(repoRoot, 'runtime')).sort(),
    ['authority_functions'],
  );
  assert.deepEqual(
    fs.readdirSync(path.join(repoRoot, 'runtime', 'authority_functions')).sort(),
    ['meta-agent-authority-functions.json'],
  );
});

test('registration, App workbench projection, and scaleout evidence contracts are consumable refs-only surfaces', () => {
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const appProjection = readJson('contracts/app_workbench_projection.json');
  const scaleoutEvidence = readJson('contracts/real_target_agent_scaleout_evidence.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const audit = readJson('contracts/functional_privatization_audit.json');

  assert.equal(registration.surface_kind, 'opl_domain_manifest_registration');
  assert.equal(registration.registry_owner, 'one-person-lab');
  assert.equal(registration.registration_status, 'discovery_receipt_ready');
  assert.equal(registration.role, 'domain_registration_metadata_refs_only');
  assertNoForbiddenAuthority(registration, 'registration');
  assert.equal(registration.authority_boundary.registry_owner_is_opl_framework, true);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generated_surface, false);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generic_operator_workbench, false);
  Object.entries(registration.domain_manifest)
    .filter(([key]) => key.endsWith('_ref'))
    .map(([, value]) => value as string)
    .forEach(assertRepoRefExists);
  assert.equal(registration.discovery_receipt.surface_kind, 'opl_domain_manifest_discovery_receipt');
  assert.equal(registration.discovery_receipt.status, 'ready_for_opl_registry_consumption');
  assert.equal(registration.discovery_receipt.registry_owner, 'one-person-lab');
  assert.ok(registration.discovery_receipt.safe_action_route_refs.includes('safe-action:opl-meta-agent/build-agent-baseline'));
  assert.ok(registration.discovery_receipt.blocked_claims.includes('app_live_rendering_complete'));
  assert.equal(registration.discovery_receipt.authority_boundary.refs_only, true);
  assert.equal(registration.discovery_receipt.authority_boundary.can_write_target_domain_truth, false);
  asStrings(registration.discovery_receipt.consumed_contract_refs).forEach(assertRepoRefExists);
  asStrings(registration.discovery_receipt.verified_by_refs).forEach(assertRepoRefExists);

  assert.equal(appProjection.surface_kind, 'opl_app_workbench_projection_contract');
  assert.equal(appProjection.projection_owner, 'one-person-lab');
  assert.equal(appProjection.projection_status, 'drilldown_readiness_receipt_ready');
  assert.equal(appProjection.role, 'refs_status_receipts_candidates_and_blockers_only');
  assertNoForbiddenAuthority(appProjection, 'appProjection');
  assert.equal(appProjection.authority_boundary.projection_owner_is_opl_framework, true);
  assert.equal(appProjection.authority_boundary.domain_repo_can_own_generic_operator_workbench, false);
  assert.equal(appProjection.workbench_sections.length, 7);
  assert.equal(
    asObjects(appProjection.workbench_sections).some((section) => section.section_id === 'scaleout_evidence'),
    true,
  );
  assert.equal(
    asObjects(appProjection.workbench_sections).some((section) => section.section_id === 'trajectory_learning'),
    true,
  );
  assert.equal(appProjection.drilldown_readiness_receipt.surface_kind, 'opl_app_workbench_drilldown_readiness_receipt');
  assert.equal(appProjection.drilldown_readiness_receipt.status, 'ready_for_app_consumption_refs_only');
  assert.equal(appProjection.drilldown_readiness_receipt.summary_first, true);
  assert.equal(appProjection.drilldown_readiness_receipt.detail_mode_required_for_full_refs, true);
  assert.equal(appProjection.drilldown_readiness_receipt.live_rendering_status, 'not_claimed_by_contract');
  assert.ok(appProjection.drilldown_readiness_receipt.safe_action_route_refs.includes('safe-action:opl-meta-agent/improve-from-external-agent-lab-suite'));
  assert.ok(appProjection.drilldown_readiness_receipt.blocker_ref_fields.includes('typed_blocker_refs'));
  assert.ok(appProjection.drilldown_readiness_receipt.receipt_ref_fields.includes('mechanism_patch_proposal_ref'));
  assert.equal(appProjection.drilldown_readiness_receipt.authority_boundary.refs_only, true);
  assert.equal(appProjection.drilldown_readiness_receipt.authority_boundary.can_mutate_target_domain_artifact_body, false);
  asStrings(appProjection.drilldown_readiness_receipt.verified_by_refs).forEach(assertRepoRefExists);
  asStrings(Object.values(appProjection.source_refs)).forEach(assertRepoRefExists);

  assert.equal(scaleoutEvidence.surface_kind, 'real_target_agent_scaleout_evidence_contract');
  assert.equal(scaleoutEvidence.evidence_status, 'multi_target_scaleout_closed_by_refs_only_receipts');
  assert.equal(scaleoutEvidence.role, 'refs_only_scaleout_evidence_gate');
  assertNoForbiddenAuthority(scaleoutEvidence, 'scaleoutEvidence');
  assert.equal(scaleoutEvidence.authority_boundary.not_target_domain_truth_writer, true);
  assert.equal(scaleoutEvidence.authority_boundary.can_treat_sample_smoke_as_real_delivery, false);
  assert.equal(scaleoutEvidence.authority_boundary.can_treat_suite_pass_as_default_promotion, false);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.real_target_delivery_receipt_surface_kind, 'opl_meta_agent_real_target_agent_delivery_receipt');
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.scaleout_evidence_ledger_surface_kind, 'opl_meta_agent_real_target_agent_scaleout_evidence_ledger');
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.real_target_agent_delivery_count_min_supported, true);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.multi_target_scaleout_pending, false);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.multi_target_scaleout_closed, true);
  assert.deepEqual(scaleoutEvidence.implemented_receipt_surfaces.multi_target_scaleout_verified_by_real_targets, [
    'med-autoscience',
    'med-autogrant',
  ]);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.status, 'closed_by_two_real_target_refs_only_receipts');
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.target_agent_count, 2);
  assert.equal(
    scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.multi_target_scaleout_delivery_count_met,
    true,
  );
  assert.equal(
    scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.requires_owner_receipt_or_typed_blocker_refs,
    true,
  );
  assert.equal(
    scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.requires_cleanup_closeout_refs,
    true,
  );
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.suite_pass_claims_domain_ready, false);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.provider_completion_claims_domain_ready, false);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.proposal_claims_default_promotion, false);
  asObjects(scaleoutEvidence.multi_target_scaleout_closeout.target_agents).forEach((target) => {
    assert.ok(asStrings(target.target_agent_owner_receipt_refs).length + asStrings(target.typed_blocker_refs).length > 0);
    assert.ok(asStrings(target.agent_lab_result_refs).length > 0);
    assert.ok(asStrings(target.no_forbidden_write_proof_refs).length > 0);
    assert.ok(asStrings(target.cleanup_closeout_refs).length > 0);
    assert.equal(target.domain_ready_claimed, false);
    assert.equal(target.default_promotion_claimed, false);
  });
  asStrings(scaleoutEvidence.implemented_receipt_surfaces.verified_by_refs).forEach(assertRepoRefExists);
  assert.deepEqual(
    asObjects(scaleoutEvidence.required_evidence_classes).map((entry) => entry.evidence_class),
    [
      'real_target_agent_delivery',
      'blocked_suite_to_developer_work_order',
      'multi_target_scaleout',
    ],
  );
  asStrings(Object.values(scaleoutEvidence.source_refs)).forEach(assertRepoRefExists);

  [
    registration,
    appProjection,
    scaleoutEvidence,
  ].forEach((surface: JsonObject) => {
    surface.human_doc_refs.forEach(assertRepoRefExists);
  });

  assert.equal(
    generatedSurfaceHandoff.registration_contract_ref,
    'contracts/opl_domain_manifest_registration.json',
  );
  assert.equal(
    generatedSurfaceHandoff.app_workbench_projection_ref,
    'contracts/app_workbench_projection.json',
  );
  assert.equal(
    generatedSurfaceHandoff.scaleout_evidence_contract_ref,
    'contracts/real_target_agent_scaleout_evidence.json',
  );
  assert.equal(
    generatedSurfaceHandoff.trajectory_learning_contract_ref,
    'contracts/trajectory_learning_contract.json',
  );
  assert.equal(
    generatedSurfaceHandoff.registry_discovery_receipt_ref,
    registration.discovery_receipt.receipt_ref,
  );
  assert.equal(
    generatedSurfaceHandoff.app_drilldown_readiness_receipt_ref,
    appProjection.drilldown_readiness_receipt.receipt_ref,
  );
  assert.equal(
    asObjects(generatedSurfaceHandoff.generated_surfaces).some((surface) =>
      surface.surface_id === 'scaleout_evidence_projection'
    ),
    true,
  );
  assert.equal(
    asObjects(generatedSurfaceHandoff.generated_surfaces).some((surface) =>
      surface.surface_id === 'trajectory_learning_projection'
    ),
    true,
  );
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('opl_domain_manifest_registration_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('app_workbench_projection_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('real_target_agent_scaleout_evidence_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('trajectory_learning_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('ux_signal_not_quality_verdict_boundary'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('registry_discovery_receipt'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('app_drilldown_readiness_receipt'));
  assert.deepEqual(actionCatalog.registration_projection_evidence_contract_refs, {
    opl_domain_manifest_registration_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    real_target_agent_scaleout_evidence_ref: 'contracts/real_target_agent_scaleout_evidence.json',
    trajectory_learning_contract_ref: 'contracts/trajectory_learning_contract.json',
  });
  assert.deepEqual(audit.registration_projection_evidence_contract_refs, {
    opl_domain_manifest_registration_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    real_target_agent_scaleout_evidence_ref: 'contracts/real_target_agent_scaleout_evidence.json',
    trajectory_learning_contract_ref: 'contracts/trajectory_learning_contract.json',
  });
});

test('top-level OMA commands and materializers stay target-agent generic', () => {
  [
    'package.json',
    'contracts/action_catalog.json',
    'contracts/stage_control_plane.json',
    'contracts/app_workbench_projection.json',
    'contracts/opl_domain_manifest_registration.json',
    'contracts/trajectory_learning_contract.json',
    'scripts/agent-evidence-takeover.ts',
    'scripts/improve-from-agent-lab-suite.ts',
  ].forEach(assertNoForbiddenDesignCenterVocabulary);

  const actionCatalog = readJson('contracts/action_catalog.json');
  const actionIds = asObjects(actionCatalog.actions).map((action) => action.action_id);
  assert.ok(actionIds.includes('improve-from-external-agent-lab-suite'));
  assert.ok(actionIds.includes('materialize-trajectory-learning-proposal'));
  assert.equal(actionIds.some((actionId) => /mas|mag|medical|grant|manuscript|publication|fundability/i.test(actionId)), false);

  const statusDoc = readText('docs/references/opl-meta-agent-ideal-state.md');
  assert.match(statusDoc, /target-agent generic artifacts/);
  assert.match(statusDoc, /MAS 或 MAG/);
  assert.match(statusDoc, /输出机制本身仍是通用 target-agent mechanism/);
});

test('registration, projection, and evidence contracts are represented in functional audit', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  assert.equal(audit.source_shape, 'landed');
  assert.equal(audit.standard_agent_source_shape, 'landed');
  assert.equal(audit.functional_structure_gap_count, 0);
  assert.equal(audit.domain_repo_retained_generic_surface_count, 0);
  assert.ok(asStrings(audit.remaining_tail_kinds).includes('opl_generated_default_caller_consumption_tail'));
  assert.ok(asStrings(audit.remaining_tail_kinds).includes('domain_refs_only_adapter_thinning'));
  assert.ok(asStrings(audit.remaining_tail_kinds).includes('script_to_pack_hygiene'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_generic_runtime'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_generated_shell'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_workbench'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_sidecar'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_compatibility_surface'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('agent_building_semantics'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('candidate_agent_skeleton_strategy'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('contracts_prompt_skill_quality_gate_generation_strategy'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('baseline_review_semantics'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('optimizer_review_semantics'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('developer_work_order_materialization'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('owner_receipt_refs'));
  assert.equal(asStrings(audit.domain_allowed_roles).includes('domain_entry_and_tests'), false);
  const expectedModules = [
    {
      moduleId: 'opl_domain_manifest_registration',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/opl_domain_manifest_registration.json',
      roleScope: 'refs_only_registration_metadata_not_generic_runtime_owner',
    },
    {
      moduleId: 'app_workbench_projection',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/app_workbench_projection.json',
      roleScope: 'refs_status_receipts_candidates_and_blockers_only_not_operator_workbench_owner',
    },
    {
      moduleId: 'real_target_agent_scaleout_evidence',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/real_target_agent_scaleout_evidence.json',
      roleScope: 'refs_only_scaleout_evidence_gate_not_target_domain_truth_writer',
    },
    {
      moduleId: 'trajectory_learning_contract',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/trajectory_learning_contract.json',
      roleScope: 'trajectory_atom_candidate_and_proposal_contract_not_runtime_owner',
    },
  ];

  expectedModules.forEach((expected) => {
    const module = asObjects(audit.modules).find((entry) => entry.module_id === expected.moduleId);
    assert.ok(module, `${expected.moduleId} should be represented in functional audit`);
    assert.equal(module.owner, 'opl-meta-agent');
    assert.equal(module.classification, expected.classification);
    assert.deepEqual(module.code_paths, [expected.codePath]);
    assert.equal(module.role_scope, expected.roleScope);
    assertRepoRefExists(expected.codePath);
  });
});

test('production acceptance evidence closes conformance evidence tail through refs-only acceptance receipt', () => {
  const acceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');

  assert.equal(acceptance.surface_kind, 'opl_meta_agent_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'opl-meta-agent');
  assert.equal(acceptance.evidence_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.evidence_tail_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(
    acceptance.receipt_ref,
    'production-acceptance-receipt:opl-meta-agent/external-agent-takeover-improve-loop/2026-05-19',
  );
  assert.equal(acceptance.doc_ref, 'docs/status.md');
  assert.ok(acceptance.next_verification_command_refs.includes('cmd:rtk npm test'));
  assert.ok(acceptance.next_verification_command_refs.includes('cmd:rtk npm run typecheck'));
  assert.ok(acceptance.refs.acceptance_receipt_refs.includes(acceptance.receipt_ref));
  assert.ok(acceptance.refs.doc_refs.includes('docs/status.md'));
  assert.ok(acceptance.refs.next_verification_command_refs.includes('cmd:rtk git diff --check'));
  assert.ok(
    asStrings(acceptance.refs.typed_blocker_refs)
      .includes('typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending'),
  );
  assert.equal(
    acceptance.production_consumption_followthrough.status,
    'blocked_by_domain_owned_typed_blocker',
  );
  assert.equal(acceptance.production_consumption_followthrough.production_consumption_ready, false);
  assert.equal(acceptance.production_consumption_followthrough.long_soak_claimed, false);
  assert.equal(
    acceptance.production_consumption_followthrough.typed_blocker_ref,
    'typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending',
  );
  assertRepoRefExists(acceptance.production_consumption_followthrough.typed_blocker_artifact_ref);
  assert.equal(
    acceptance.production_consumption_followthrough.authority_boundary.can_claim_production_ready,
    false,
  );
  const productionConsumptionBlocker = readJson(
    acceptance.production_consumption_followthrough.typed_blocker_artifact_ref as string,
  );
  assert.equal(
    productionConsumptionBlocker.typed_blocker_ref,
    'typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending',
  );
  assert.equal(productionConsumptionBlocker.blocked_gate, 'long_soak_refs');
  assert.equal(productionConsumptionBlocker.production_consumption_ready, false);
  assert.equal(productionConsumptionBlocker.long_soak_claimed, false);
  assert.deepEqual(productionConsumptionBlocker.accepted_resolution_paths, [
    'real_long_soak_refs',
    'operator_long_soak_refs',
    'production_soak_refs',
    'agent_lab_rerun_long_soak_refs',
  ]);
  assertNoForbiddenAuthority(productionConsumptionBlocker, 'productionConsumptionBlocker');
  assert.equal(productionConsumptionBlocker.authority_boundary.can_claim_production_ready, false);
  assert.equal(acceptance.role, 'refs_only_external_agent_takeover_improve_loop_acceptance');
  assert.ok(acceptance.acceptance_scope.includes('production_live_soak_not_claimed_by_conformance'));
  assert.ok(acceptance.acceptance_scope.includes('domain_ready_not_claimed_by_conformance'));
  assert.equal(acceptance.conformance_state.structural_conformance, 'passed');
  assert.equal(acceptance.conformance_state.physical_source_morphology, 'passed');
  assert.equal(acceptance.conformance_state.not_domain_ready_authority_source, true);
  assert.equal(acceptance.conformance_state.not_production_soak_authority_source, true);
  assert.equal(acceptance.external_agent_acceptance_chain.chain_status, 'receipt_chain_present');
  assert.ok(acceptance.external_agent_acceptance_chain.intake_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.test_handoff_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.proposal_materializer_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.review_audit_receipt_refs.length > 0);
  assert.ok(
    asStrings(acceptance.external_agent_acceptance_chain.typed_blocker_refs)
      .includes('typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending'),
  );
  assert.equal(
    acceptance.acceptance_receipt.receipt_class,
    'external_agent_takeover_improve_loop_acceptance_receipt',
  );
  assert.equal(acceptance.promotion_gate.promotion_status, 'gated');
  assert.ok(acceptance.promotion_gate.required_next_verification_command_refs.includes('cmd:rtk npm test'));
  assert.ok(acceptance.promotion_gate.required_next_verification_command_refs.includes('cmd:rtk npm run typecheck'));
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/no-target-domain-truth-write',
    ),
  );
  assertNoForbiddenAuthority(acceptance, 'productionAcceptance');
  assert.equal(acceptance.authority_boundary.target_domain_authority_writes_forbidden, true);

  [
    ...asStrings(acceptance.conformance_state.conformance_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.intake_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.test_handoff_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.proposal_materializer_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.review_audit_receipt_refs),
    ...asStrings(acceptance.acceptance_receipt.source_refs),
    ...asStrings(acceptance.generated_agent_fixture_requirement.verified_by_refs),
    acceptance.doc_ref,
    ...asStrings(acceptance.refs.doc_refs),
  ].forEach(assertRepoRefExists);
});

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

test('minimal authority functions are explicit refs, not generic runtime owners', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');

  assert.equal(authorityFunctions.surface_kind, 'meta_agent_authority_function_refs');
  assert.equal(authorityFunctions.role, 'refs_only_minimal_authority_functions');
  assert.equal(authorityFunctions.not_generic_runtime_owner, true);
  assert.equal(authorityFunctions.opl_runtime_owner, 'one-person-lab');
  assert.ok(authorityFunctions.forbidden_roles.includes('generic_scheduler_owner'));
  assert.ok(authorityFunctions.forbidden_roles.includes('generic_cli_mcp_product_wrapper_owner'));

  const expectedAuthorityFunctions = [
    {
      moduleId: 'candidate_agent_package_builder',
      authorityRef: 'authority-function-ref:opl-meta-agent/candidate-agent-package-builder',
      implementationRefs: [
        'scripts/bootstrap-sample-agent.ts',
        'scripts/lib/meta-agent-loop.ts',
      ],
      invokedByRefs: ['action-ref:build-agent-baseline'],
    },
    {
      moduleId: 'mechanism_patch_proposal_authorizer',
      authorityRef: 'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer',
      implementationRefs: [
        'scripts/lib/meta-agent-loop.ts',
      ],
      invokedByRefs: ['action-ref:generate-mechanism-patch-proposal'],
    },
  ];

  const expectedFunctionIds = expectedAuthorityFunctions.map((entry) => entry.moduleId);
  assert.deepEqual(
    asStrings(packCompilerInput.minimal_authority_functions),
    expectedFunctionIds,
  );
  assert.deepEqual(
    asObjects(authorityFunctions.functions).map((entry) => entry.function_id),
    expectedFunctionIds,
  );

  expectedAuthorityFunctions.forEach((expected) => {
    const functionRef = asObjects(authorityFunctions.functions).find((entry) => entry.function_id === expected.moduleId);
    assert.ok(functionRef, `${expected.moduleId} should have an authority function ref`);
    assert.equal(functionRef.classification, 'minimal_authority_function');
    assert.equal(functionRef.authority_ref, expected.authorityRef);
    assert.deepEqual(functionRef.implementation_refs, expected.implementationRefs);
    assert.deepEqual(functionRef.invoked_by_refs, expected.invokedByRefs);
    assert.equal(functionRef.boundary.refs_only, true);
    assert.equal(functionRef.boundary.can_claim_generic_runtime_owner, false);
    assert.equal(functionRef.boundary.can_write_target_domain_truth, false);
    asStrings(functionRef.implementation_refs).forEach((relativePath) => {
      assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
    });

    const auditModule = asObjects(audit.modules).find((entry) => entry.module_id === expected.moduleId);
    assert.ok(auditModule, `${expected.moduleId} should be represented in functional privatization audit`);
    assert.equal(auditModule.classification, 'minimal_authority_function');
    assert.equal(auditModule.authority_function_ref, expected.authorityRef);
    assert.equal(
      auditModule.authority_function_contract_ref,
      'runtime/authority_functions/meta-agent-authority-functions.json',
    );
    assert.deepEqual(auditModule.implementation_refs, expected.implementationRefs);
    assert.deepEqual(auditModule.code_paths, ['runtime/authority_functions/meta-agent-authority-functions.json']);
    assert.equal(auditModule.role_scope, 'refs_only_minimal_authority_function_not_generic_runtime_owner');
  });
});

test('script physical morphology stays limited to authority refs and helpers', () => {
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const scripts = listFilesByExtension('scripts', '.ts');
  const morphologyPolicy = authorityFunctions.script_morphology_policy;

  assert.equal(morphologyPolicy.policy_ref, 'contracts/private_functional_surface_policy.json');
  assert.deepEqual(
    asObjects(privatePolicy.allowed_script_morphology_classes).map((entry) => entry.class_id),
    [
      'authority_function_implementation_ref',
      'smoke_helper',
      'fixture_or_proof_helper',
      'developer_work_order_materializer',
    ],
  );
  assert.deepEqual(morphologyPolicy.allowed_classes, [
    'authority_function_implementation_ref',
    'smoke_helper',
    'fixture_or_proof_helper',
    'developer_work_order_materializer',
  ]);
  assert.ok(morphologyPolicy.forbidden_roles.includes('generic_runtime_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('generic_registry_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('app_shell_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('agent_lab_execution_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('promotion_gate_owner'));
  assert.ok(morphologyPolicy.forbidden_roles.includes('target_domain_truth_writer'));

  const implementationRefs = new Map<string, string[]>();
  asObjects(authorityFunctions.functions).forEach((functionRef) => {
    asStrings(functionRef.implementation_refs).forEach((scriptRef) => {
      const refs = implementationRefs.get(scriptRef) ?? [];
      refs.push(functionRef.authority_ref);
      implementationRefs.set(scriptRef, refs);
    });
  });

  const classifiedScripts = asObjects(morphologyPolicy.script_classifications).map((entry) => entry.script_ref as string).sort();
  assert.deepEqual(classifiedScripts, scripts);

  asObjects(morphologyPolicy.script_classifications).forEach((entry) => {
    assertRepoRefExists(entry.script_ref);
    assert.ok(entry.classes.length > 0, `${entry.script_ref} should have at least one script class`);
    asStrings(entry.classes).forEach((classId) => {
      assert.ok(
        morphologyPolicy.allowed_classes.includes(classId),
        `${entry.script_ref} uses unsupported script morphology class ${classId}`,
      );
    });
    assert.deepEqual(
      entry.forbidden_roles,
      [],
      `${entry.script_ref} must not declare active forbidden script roles`,
    );
    assert.ok(entry.writes_only.length > 0, `${entry.script_ref} should declare refs-only writes`);

    const declaredAuthorityRefs = entry.authority_function_refs ?? [];
    const expectedAuthorityRefs = implementationRefs.get(entry.script_ref) ?? [];
    if (entry.classes.includes('authority_function_implementation_ref')) {
      assert.deepEqual(
        declaredAuthorityRefs.sort(),
        expectedAuthorityRefs.sort(),
        `${entry.script_ref} authority refs must match runtime authority implementation_refs`,
      );
      assert.ok(expectedAuthorityRefs.length > 0, `${entry.script_ref} should be listed by a runtime authority function`);
    } else {
      assert.deepEqual(
        declaredAuthorityRefs,
        [],
        `${entry.script_ref} should not declare authority refs unless it is an implementation ref`,
      );
      assert.equal(
        implementationRefs.has(entry.script_ref),
        false,
        `${entry.script_ref} is referenced by authority functions but not classified as implementation ref`,
      );
    }
  });
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

test('OPL generated interfaces expose CLI, MCP, Skill, and product-entry descriptors for this repo', () => {
  const result = spawnSync(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    repoRoot,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout) as JsonObject;
  const bundle = payload.generated_agent_interfaces;
  assert.equal(bundle.surface_kind, 'opl_generated_agent_interface_bundle');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.source_kind, 'standard_agent_repo_contracts');
  assert.equal(bundle.repo_dir, repoRoot);
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.equal(bundle.status, 'ready');
  assert.equal(asObjects(bundle.cli.descriptors).some((entry) => entry.action_id === 'build-agent-baseline'), true);
  assert.equal(
    asObjects(bundle.mcp.descriptors).find((entry) => entry.name === 'opl_meta_agent_takeover_external_agent_test')
      ?.descriptor_only,
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.build-agent-baseline'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.improve-from-external-agent-lab-suite'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.execute-external-work-order'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'takeover-external-agent-test'),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'improve-from-external-agent-lab-suite'),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'execute-external-work-order'),
    true,
  );
  assert.equal(bundle.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_write_memory_body, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

test('OPL default-caller deletion evidence is closed by domain-owned refs without authorizing physical delete', () => {
  const evidence = readJson('contracts/default_caller_deletion_evidence.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const audit = readJson('contracts/functional_privatization_audit.json');
  const expectedSurfaces = [
    'cli',
    'mcp',
    'skill',
    'product_entry',
    'product_status',
    'product_session',
    'sidecar',
    'workbench',
  ];

  assert.equal(evidence.surface_kind, 'opl_meta_agent_default_caller_deletion_evidence');
  assert.equal(evidence.owner, 'opl-meta-agent');
  assert.equal(evidence.role, 'domain_boundary_evidence_for_opl_generated_default_caller_consumption');
  assert.equal(evidence.evidence_status, 'source_shape_landed_with_boundary_refs_only_tail');
  assert.equal(evidence.source_shape, 'landed');
  assert.equal(evidence.standard_agent_source_shape, 'landed');
  assert.equal(evidence.functional_structure_gap_count, 0);
  assert.equal(evidence.remaining_tail_kind, 'opl_generated_default_caller_consumption_tail');
  assert.equal(evidence.generated_surface_owner, 'one-person-lab');
  assert.equal(evidence.domain_repo_can_own_generated_surface, false);
  assert.equal(evidence.domain_repo_retained_generic_surface_count, 0);
  assert.equal(evidence.physical_delete_authorized, false);
  assert.equal(evidence.authority_boundary.refs_only, true);
  assert.equal(evidence.authority_boundary.can_write_domain_truth, false);
  assert.equal(evidence.authority_boundary.can_write_memory_body, false);
  assert.equal(evidence.authority_boundary.can_authorize_quality_or_export, false);
  assert.equal(evidence.authority_boundary.can_authorize_domain_repo_physical_delete, false);
  assert.equal(evidence.authority_boundary.can_restore_repo_local_default_wrapper, false);
  assert.equal(evidence.authority_boundary.can_restore_repo_owned_sidecar_or_workbench, false);
  assert.equal(evidence.authority_boundary.can_create_compatibility_facade, false);
  assert.ok(asStrings(evidence.retained_domain_authority).includes('agent_building_semantics'));
  assert.ok(
    asStrings(evidence.retained_domain_authority)
      .includes('skeleton_contracts_prompt_skill_quality_gate_generation_strategy'),
  );
  assert.ok(asStrings(evidence.retained_domain_authority).includes('baseline_review_semantics'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('optimizer_review_semantics'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('work_order_materialization_semantics'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('target_domain_truth_boundary'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('owner_receipt_ref_materialization'));
  assert.ok(asStrings(evidence.opl_owned_surfaces).includes('runtime_queue_workbench_projection'));
  assert.equal(
    generatedSurfaceHandoff.default_caller_deletion_evidence_ref,
    'contracts/default_caller_deletion_evidence.json',
  );

  const handoffSurfaces = asObjects(generatedSurfaceHandoff.handoff_surfaces);
  assert.deepEqual(asObjects(handoffSurfaces).map((surface) => surface.surface_id), expectedSurfaces);
  expectedSurfaces.forEach((surfaceId) => {
    const surfaceEvidence = evidence.surface_evidence[surfaceId] as JsonObject;
    assert.ok(surfaceEvidence, `${surfaceId} should have deletion evidence`);
    assert.ok(asStrings(surfaceEvidence.typed_blocker_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.no_forbidden_write_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.tombstone_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.provenance_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.current_surface_refs).length > 0);

    const handoffSurface = handoffSurfaces.find((entry) => entry.surface_id === surfaceId);
    assert.ok(handoffSurface, `${surfaceId} should have a handoff surface`);
    assert.equal(handoffSurface.owner, 'one-person-lab');
    assert.equal(handoffSurface.physical_delete_authorized, false);
    assert.equal(
      handoffSurface.bridge_exit_gate_ref,
      `contracts/default_caller_deletion_evidence.json#/surface_evidence/${surfaceId}`,
    );

    const moduleId = `default_caller_${surfaceId}_deletion_evidence`;
    const auditModule = asObjects(audit.modules).find((entry) => entry.module_id === moduleId);
    assert.ok(auditModule, `${moduleId} should be represented in functional audit`);
    assert.equal(auditModule.owner, 'opl-meta-agent');
    assert.equal(auditModule.classification, 'refs_only_domain_adapter');
    assert.deepEqual(auditModule.code_paths, ['contracts/default_caller_deletion_evidence.json']);
    assert.equal(
      auditModule.role_scope,
      'refs_only_default_caller_deletion_evidence_not_generated_surface_owner',
    );
    assert.equal(auditModule.bridge_exit_gate.physical_delete_authorized, false);
    assert.deepEqual(
      asStrings(auditModule.bridge_exit_gate.typed_blocker_refs),
      asStrings(surfaceEvidence.typed_blocker_refs),
    );
    assert.deepEqual(
      asStrings(auditModule.bridge_exit_gate.no_forbidden_write_refs),
      asStrings(surfaceEvidence.no_forbidden_write_refs),
    );
  });

  const result = spawnSync(oplBin, [
    'agents',
    'default-callers',
    '--agent',
    `opl-meta-agent=${repoRoot}`,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout) as JsonObject;
  const report = payload.agent_default_caller_readiness as JsonObject;
  const summary = report.summary as JsonObject;
  assert.equal(summary.generated_default_caller_surface_count, 8);
  assert.equal(summary.blocked_surface_count, 0);
  assert.equal(summary.missing_domain_owner_receipt_or_typed_blocker_count, 0);
  assert.equal(summary.missing_no_forbidden_write_proof_count, 0);
  assert.equal(summary.missing_tombstone_or_provenance_ref_count, 0);
  assert.equal(report.migration_gate_policy.physical_delete_authorized_by_this_report, false);
  assert.equal(report.authority_boundary.report_can_authorize_domain_repo_physical_delete, false);

  const repoReport = asObjects(report.reports)[0];
  assert.equal(repoReport.deletion_gate.physical_delete_authorized, false);
  assert.equal(repoReport.deletion_gate.missing_domain_owner_receipt_or_typed_blocker_count, 0);
  assert.equal(repoReport.deletion_gate.missing_no_forbidden_write_proof_count, 0);
  assert.equal(repoReport.deletion_gate.missing_tombstone_or_provenance_ref_count, 0);
  assert.equal(asObjects(repoReport.surface_gates).length, 8);
  asObjects(repoReport.surface_gates).forEach((gate) => {
    const worklist = gate.deletion_evidence_worklist as JsonObject;
    assert.equal(gate.status, 'ready_for_default_caller_cutover');
    assert.equal(worklist.physical_delete_authorized, false);
    assert.equal(worklist.domain_owner_receipt_or_typed_blocker.status, 'observed');
    assert.equal(worklist.no_forbidden_write_proof.status, 'observed');
    assert.equal(worklist.tombstone_or_provenance_ref.status, 'observed');
  });
});

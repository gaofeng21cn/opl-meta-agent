import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function listMarkdownFiles(relativeDir) {
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

function assertUsablePackFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  assert.equal(fs.existsSync(absolutePath), true, `${relativePath} should exist`);
  const content = fs.readFileSync(absolutePath, 'utf8');
  assert.ok(content.trim().length > 0, `${relativePath} should not be empty`);
  assert.equal(placeholderPattern.test(content), false, `${relativePath} should not contain placeholder markers`);
}

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

  stageControl.stages.forEach((stage) => {
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

test('opl-meta-agent stage plan covers research, build, eval, optimization, delivery, and learning', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  assert.equal(stageControl.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControl.version, 'family-stage-control-plane.v1');
  assert.deepEqual(stageControl.stages.map((stage) => stage.stage_id), [
    'intent-intake',
    'web-experience-research',
    'stage-decomposition',
    'agent-skeleton-build',
    'eval-suite-build',
    'baseline-run',
    'external-agent-takeover',
    'optimizer-iteration',
    'baseline-delivery',
    'online-learning',
  ]);
  assert.deepEqual(
    stageControl.stages.find((stage) => stage.stage_id === 'agent-skeleton-build').allowed_action_refs,
    ['build-agent-baseline'],
  );
  assert.deepEqual(
    stageControl.stages.find((stage) => stage.stage_id === 'external-agent-takeover').allowed_action_refs,
    ['takeover-external-agent-test'],
  );
  assert.deepEqual(
    stageControl.stages.find((stage) => stage.stage_id === 'optimizer-iteration').allowed_action_refs,
    ['improve-from-external-agent-lab-suite'],
  );
  assert.equal(stageControl.opl_runtime_dependency.agent_lab_complete_control_plane, true);
  assert.equal(stageControl.opl_runtime_dependency.standard_domain_agent_scaffold, true);
  assert.equal(stageControl.opl_runtime_dependency.generated_interface_bundle, true);
  assert.equal(stageControl.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(stageControl.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(stageControl.authority_boundary.opl_can_authorize_quality_or_export, false);
});

test('action catalog and owner receipts forbid target-domain authority writes', () => {
  const actionCatalog = readJson('contracts/action_catalog.json');
  const ownerReceipt = readJson('contracts/owner_receipt_contract.json');

  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.ok(actionCatalog.actions.some((action) => action.action_id === 'build-agent-baseline'));
  const takeoverAction = actionCatalog.actions.find((action) => action.action_id === 'takeover-external-agent-test');
  assert.ok(takeoverAction);
  assert.equal(takeoverAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(takeoverAction.supported_surfaces.mcp.public_runtime, false);
  assert.equal(takeoverAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(takeoverAction.authority_boundary.can_promote_default_agent_without_gate, false);
  const externalSuiteAction = actionCatalog.actions.find(
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
  const mechanismAction = actionCatalog.actions.find((action) => action.action_id === 'generate-mechanism-patch-proposal');
  assert.ok(mechanismAction);
  assert.deepEqual(mechanismAction.workspace_locator_fields, [
    'mechanism_ref',
    'segment_run_ref',
    'evidence_delta_ref',
    'next_mechanism_candidate_ref',
  ]);
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_scheduler_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_cli_mcp_product_wrapper_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_sidecar_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_session_store_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_status_workbench_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generated_surface_owner_in_domain_repo'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('testing_takeover_self_evolution_receipt'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('mechanism_patch_proposal_receipt'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_wrote_target_domain_truth'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_promoted_default_agent_without_gate'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('mechanism_patch_proposal_recorded'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_memory_body_written'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_default_promotion'));
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

test('minimal authority functions are explicit refs, not generic runtime owners', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
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
        'scripts/bootstrap-sample-agent.mjs',
        'scripts/lib/meta-agent-loop.mjs',
      ],
      invokedByRefs: ['action-ref:build-agent-baseline'],
    },
    {
      moduleId: 'mechanism_patch_proposal_authorizer',
      authorityRef: 'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer',
      implementationRefs: [
        'scripts/lib/meta-agent-loop.mjs',
      ],
      invokedByRefs: ['action-ref:generate-mechanism-patch-proposal'],
    },
  ];

  expectedAuthorityFunctions.forEach((expected) => {
    const functionRef = authorityFunctions.functions.find((entry) => entry.function_id === expected.moduleId);
    assert.ok(functionRef, `${expected.moduleId} should have an authority function ref`);
    assert.equal(functionRef.classification, 'minimal_authority_function');
    assert.equal(functionRef.authority_ref, expected.authorityRef);
    assert.deepEqual(functionRef.implementation_refs, expected.implementationRefs);
    assert.deepEqual(functionRef.invoked_by_refs, expected.invokedByRefs);
    assert.equal(functionRef.boundary.refs_only, true);
    assert.equal(functionRef.boundary.can_claim_generic_runtime_owner, false);
    assert.equal(functionRef.boundary.can_write_target_domain_truth, false);
    functionRef.implementation_refs.forEach((relativePath) => {
      assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
    });

    const auditModule = audit.modules.find((entry) => entry.module_id === expected.moduleId);
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

test('tracked contract, test, and docs surfaces do not carry placeholder markers', () => {
  const scannedDirs = ['agent', 'contracts', 'tests', 'docs'];
  const scannedFiles = [
    'README.md',
    'README.zh-CN.md',
    ...scannedDirs.flatMap((dir) =>
      listMarkdownFiles(dir).concat(
        fs.readdirSync(path.join(repoRoot, dir))
          .filter((entry) => entry.endsWith('.json') || entry.endsWith('.mjs'))
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
  const payload = JSON.parse(result.stdout);
  const bundle = payload.generated_agent_interfaces;
  assert.equal(bundle.surface_kind, 'opl_generated_agent_interface_bundle');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.source_kind, 'standard_agent_repo_contracts');
  assert.equal(bundle.repo_dir, repoRoot);
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.equal(bundle.status, 'ready');
  assert.equal(bundle.cli.descriptors.some((entry) => entry.action_id === 'build-agent-baseline'), true);
  assert.equal(
    bundle.mcp.descriptors.find((entry) => entry.name === 'opl_meta_agent_takeover_external_agent_test')
      .descriptor_only,
    true,
  );
  assert.equal(
    bundle.skill.descriptors.some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.build-agent-baseline'
    ),
    true,
  );
  assert.equal(
    bundle.skill.descriptors.some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.improve-from-external-agent-lab-suite'
    ),
    true,
  );
  assert.equal(
    bundle.product_entry.descriptors.some((entry) => entry.action_key === 'takeover-external-agent-test'),
    true,
  );
  assert.equal(
    bundle.product_entry.descriptors.some((entry) => entry.action_key === 'improve-from-external-agent-lab-suite'),
    true,
  );
  assert.equal(bundle.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_write_memory_body, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

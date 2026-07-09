import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertRepoRefExists,
  asObjects,
  asStrings,
  repoRoot,
  readJson,
  readText,
  type JsonObject,
} from './support/contracts.ts';
import {
  assertPolicyObject,
  listFilesByExtension,
} from './support/source-purity.ts';

function scriptRef(...parts: string[]): string {
  return ['scripts', ...parts].join('/');
}

test('runtime source shape keeps generated and generic wrappers out of the repo', () => {
  const packageJson = readJson('package.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;

  assert.equal(packageJson.bin, undefined);
  assert.equal(packageJson.main, undefined);
  assert.equal(packageJson.exports, undefined);
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.package_surface_boundary.has_bin, false);
  assert.equal(receipt.package_surface_boundary.has_main, false);
  assert.equal(receipt.package_surface_boundary.has_exports, false);
  [
    '.agents',
    '.codex',
    'bin',
    'cli',
    'mcp',
    'product-entry',
    'product_entry',
    'sidecar',
    'status',
    'workbench',
    'runtime/cli',
    'runtime/mcp',
    'runtime/product-entry',
    'runtime/product_entry',
    'runtime/sidecar',
    'runtime/projection_builders',
    'runtime/lifecycle_adapters',
    'runtime/status',
    'runtime/workbench',
    'runtime/wrappers',
    'src/cli',
    'src/mcp',
    'src/product-entry',
    'src/product_entry',
    'src/sidecar',
    'src/status',
    'src/workbench',
  ].forEach((relativePath) => {
    assert.ok(asStrings(receipt.absent_repo_owned_surface_paths).includes(relativePath));
  });

  asStrings(receipt.absent_repo_owned_surface_paths).forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), false, `${relativePath} should not exist`);
  });
  assert.deepEqual(fs.readdirSync(path.join(repoRoot, 'runtime')).sort(), ['authority_functions']);
  assert.deepEqual(
    fs.readdirSync(path.join(repoRoot, 'runtime', 'authority_functions')).sort(),
    [
      'meta-agent-authority-functions.bundle-manifest.json',
      'meta-agent-authority-functions.json',
      'meta-agent-authority-functions.leaf-index.json',
      'meta-agent-authority-functions.parts',
      'meta-agent-authority-functions.source.json',
    ],
  );
  [
    'runtime/authority_functions/meta-agent-authority-functions.source.json',
    'runtime/authority_functions/meta-agent-authority-functions.leaf-index.json',
    'runtime/authority_functions/meta-agent-authority-functions.bundle-manifest.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/root.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/script_morphology_policy/root.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/script_morphology_policy/script-classifications.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/script_morphology_policy/script-to-pack-retirement-gates.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/source_purity_scan_receipt.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/purpose_first_owner_delta_gate.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/functions.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/forbidden_roles.json',
  ].forEach(assertRepoRefExists);
});

test('test support does not reintroduce active forbidden owner morphology tokens', () => {
  const testSupportContracts = readText('tests/support/contracts.ts');
  [
    'app_shell_owner',
    'promotion_gate_owner',
  ].forEach((token) => {
    assert.equal(
      testSupportContracts.includes(token),
      false,
      `tests/support/contracts.ts should not contain active forbidden owner token ${token}`,
    );
  });
});

test('policy contract tests do not import script projection helpers as truth', () => {
  const forbiddenProjectionImports = [
    ['..', scriptRef('lib', 'work-order-policy-constants.ts')].join('/'),
    ['..', scriptRef('lib', 'standard-foundry-policies.ts')].join('/'),
  ];

  listFilesByExtension('tests', '.ts').forEach((testRef) => {
    const testSource = readText(testRef);
    forbiddenProjectionImports.forEach((importRef) => {
      assert.equal(
        testSource.includes(`from '${importRef}'`) || testSource.includes(`from "${importRef}"`),
        false,
        `${testRef} should read policy contracts directly instead of importing ${importRef}`,
      );
    });
  });
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
        scriptRef('build-agent-baseline.ts'),
        scriptRef('lib', 'meta-agent-loop-receipts.ts'),
      ],
      invokedByRefs: ['action-ref:build-agent-baseline'],
    },
    {
      moduleId: 'mechanism_patch_proposal_authorizer',
      authorityRef: 'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer',
      implementationRefs: [
        scriptRef('lib', 'meta-agent-loop-receipts.ts'),
      ],
      invokedByRefs: ['action-ref:generate-mechanism-patch-proposal'],
    },
  ];

  const expectedFunctionIds = expectedAuthorityFunctions.map((entry) => entry.moduleId);
  assert.deepEqual(asStrings(packCompilerInput.minimal_authority_functions), expectedFunctionIds);
  assert.deepEqual(asObjects(authorityFunctions.functions).map((entry) => entry.function_id), expectedFunctionIds);

  expectedAuthorityFunctions.forEach((expected) => {
    const functionRef = asObjects(authorityFunctions.functions)
      .find((entry) => entry.function_id === expected.moduleId);
    assert.ok(functionRef, `${expected.moduleId} should have an authority function ref`);
    assert.equal(functionRef.classification, 'minimal_authority_function');
    assert.equal(functionRef.authority_ref, expected.authorityRef);
    assert.deepEqual(functionRef.implementation_refs, expected.implementationRefs);
    assert.deepEqual(functionRef.invoked_by_refs, expected.invokedByRefs);
    assert.equal(functionRef.boundary.refs_only, true);
    assert.equal(functionRef.boundary.can_claim_generic_runtime_owner, false);
    assert.equal(functionRef.boundary.can_write_target_domain_truth, false);
    asStrings(functionRef.implementation_refs).forEach(assertRepoRefExists);

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

test('purpose-first gate prevents OMA scripts from becoming a second framework', () => {
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const gate = authorityFunctions.purpose_first_owner_delta_gate as JsonObject;
  const materializerBoundary = gate.materializer_boundary as JsonObject;
  const secondFrameworkGuard = assertPolicyObject(gate, 'second_framework_guard');

  assert.equal(materializerBoundary.scripts_may_materialize_refs_only_outputs, true);
  assert.equal(materializerBoundary.scripts_can_become_second_agent_lab, false);
  assert.equal(materializerBoundary.scripts_can_become_second_opl_framework, false);
  assert.equal(materializerBoundary.scripts_can_own_agent_lab_runner, false);
  assert.equal(materializerBoundary.scripts_can_own_promotion_gate, false);
  assert.equal(materializerBoundary.scripts_can_own_queue_or_attempt_ledger, false);
  assert.equal(materializerBoundary.scripts_can_own_work_order_absorb_or_cleanup, false);
  assert.equal(materializerBoundary.scripts_can_own_target_worktree_lifecycle, false);
  assert.equal(materializerBoundary.scripts_can_create_stage_folder_runtime_state, false);
  assert.equal(materializerBoundary.scripts_can_create_owner_promotion, false);
  assert.equal(materializerBoundary.scripts_can_write_target_owner_receipt_body, false);

  assert.equal(secondFrameworkGuard.oma_is_agent_lab_or_opl_framework_replacement, false);
  assert.deepEqual(asStrings(secondFrameworkGuard.allowed_oma_products), [
    'candidate_agent_package_ref',
    'developer_patch_work_order_ref',
    'target_capability_improvement_candidate_ref',
    'mechanism_patch_proposal_ref',
    'typed_blocker_ref',
  ]);
  [
    'agent_lab_runner',
    'promotion_gate',
    'queue_attempt_ledger',
    'physical_stage_kernel',
    'stage_artifact_conformance',
    'stage_artifact_workbench_consumption',
    'target_worktree_lifecycle',
    'work_order_absorb_cleanup',
    'target_owner_closeout_hook_invocation',
    'owner_promotion_or_receipt_body_authority',
    'registry_owner',
    'app_shell_owner',
    'target_domain_truth_or_verdict_writer',
  ].forEach((surface) => {
    assert.ok(asStrings(secondFrameworkGuard.forbidden_oma_owned_surfaces).includes(surface));
  });
});

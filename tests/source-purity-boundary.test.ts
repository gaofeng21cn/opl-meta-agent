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
  type JsonObject,
} from './support/contracts.ts';
import {
  assertEveryFlagFalse,
  assertIncludesAll,
  assertPolicyObject,
} from './support/source-purity.ts';

function scriptRef(...parts: string[]): string {
  return ['scripts', ...parts].join('/');
}

test('runtime source shape keeps generated and generic wrappers out of the repo', () => {
  const packageJson = readJson('package.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const forbiddenSurfacePaths = [
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
  ];

  assert.equal(packageJson.bin, undefined);
  assert.equal(packageJson.main, undefined);
  assert.equal(packageJson.exports, undefined);
  assert.equal(receipt.status, 'passed');
  forbiddenSurfacePaths.forEach((relativePath) => {
    assert.ok(asStrings(receipt.absent_repo_owned_surface_paths).includes(relativePath));
    assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), false, `${relativePath} should not exist`);
  });
  assert.deepEqual(fs.readdirSync(path.join(repoRoot, 'runtime')).sort(), ['authority_functions']);
  [
    'runtime/authority_functions/meta-agent-authority-functions.source.json',
    'runtime/authority_functions/meta-agent-authority-functions.bundle-manifest.json',
    'runtime/authority_functions/meta-agent-authority-functions.parts/source_purity_scan_receipt.json',
  ].forEach(assertRepoRefExists);
});

test('minimal authority functions are explicit refs, not generic runtime owners', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
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
      implementationRefs: [scriptRef('lib', 'meta-agent-loop-receipts.ts')],
      invokedByRefs: ['action-ref:generate-mechanism-patch-proposal'],
    },
  ];
  const expectedFunctionIds = expectedAuthorityFunctions.map((entry) => entry.moduleId);

  assert.equal(authorityFunctions.surface_kind, 'meta_agent_authority_function_refs');
  assert.equal(authorityFunctions.role, 'refs_only_minimal_authority_functions');
  assert.equal(authorityFunctions.not_generic_runtime_owner, true);
  assert.equal(authorityFunctions.opl_runtime_owner, 'one-person-lab');
  assert.deepEqual(asStrings(packCompilerInput.minimal_authority_functions), expectedFunctionIds);
  assert.deepEqual(asObjects(authorityFunctions.functions).map((entry) => entry.function_id), expectedFunctionIds);

  expectedAuthorityFunctions.forEach((expected) => {
    const functionRef = asObjects(authorityFunctions.functions)
      .find((entry) => entry.function_id === expected.moduleId);
    const auditModule = asObjects(audit.modules).find((entry) => entry.module_id === expected.moduleId);
    assert.ok(functionRef);
    assert.ok(auditModule);
    assert.equal(functionRef.classification, 'minimal_authority_function');
    assert.equal(functionRef.authority_ref, expected.authorityRef);
    assert.deepEqual(functionRef.implementation_refs, expected.implementationRefs);
    assert.deepEqual(functionRef.invoked_by_refs, expected.invokedByRefs);
    assert.equal(functionRef.boundary.refs_only, true);
    assert.equal(functionRef.boundary.can_claim_generic_runtime_owner, false);
    assert.equal(functionRef.boundary.can_write_target_domain_truth, false);
    asStrings(functionRef.implementation_refs).forEach(assertRepoRefExists);
    assert.equal(auditModule.authority_function_ref, expected.authorityRef);
    assert.deepEqual(auditModule.implementation_refs, expected.implementationRefs);
  });
});

test('purpose-first gate prevents OMA scripts from becoming a second framework', () => {
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const gate = authorityFunctions.purpose_first_owner_delta_gate as JsonObject;
  const materializerBoundary = gate.materializer_boundary as JsonObject;
  const secondFrameworkGuard = assertPolicyObject(gate, 'second_framework_guard');

  assert.equal(materializerBoundary.scripts_may_materialize_refs_only_outputs, true);
  assertEveryFlagFalse(
    materializerBoundary as Record<string, boolean>,
    'materializer boundary',
    (field) => field.startsWith('scripts_can_'),
  );
  assert.equal(secondFrameworkGuard.oma_is_agent_lab_or_opl_framework_replacement, false);
  assertIncludesAll(asStrings(secondFrameworkGuard.allowed_oma_products), [
    'candidate_agent_package_ref',
    'developer_patch_work_order_ref',
    'mechanism_patch_proposal_ref',
    'typed_blocker_ref',
  ], 'allowed OMA products');
  assertIncludesAll(asStrings(secondFrameworkGuard.forbidden_oma_owned_surfaces), [
    'agent_lab_runner',
    'queue_attempt_ledger',
    'physical_stage_kernel',
    'target_worktree_lifecycle',
    'app_shell_owner',
    'target_domain_truth_or_verdict_writer',
  ], 'forbidden OMA-owned surfaces');
});

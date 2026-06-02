import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, any>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function asObjects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

function asStrings(value: unknown): string[] {
  return value as string[];
}

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
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

function assertRepoRefExists(relativePath: string): void {
  assert.equal(fs.existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
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
    'plugins',
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
    ['meta-agent-authority-functions.json'],
  );
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
        'scripts/build-agent-baseline.ts',
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

test('script morphology stays limited to authority refs, materializers, and helpers', () => {
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const scripts = listFilesByExtension('scripts', '.ts');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const materializerScan = receipt.generic_script_materializer_scan as JsonObject;

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
  assert.deepEqual(morphologyPolicy.forbidden_roles, asStrings(privatePolicy.forbidden_script_roles));
  assert.ok(
    morphologyPolicy.forbidden_roles.includes(
      'generic_cli_mcp_skill_product_sidecar_status_workbench_materializer_owner',
    ),
  );
  assert.equal(materializerScan.status, 'passed');
  assert.equal(materializerScan.repo_owned_generic_wrapper_materializer_count, 0);
  assert.deepEqual(asStrings(materializerScan.excluded_standard_surface_paths), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
  ]);
  assert.deepEqual(asStrings(materializerScan.forbidden_materializer_roles_absent), [
    'repo_owned_cli_wrapper_materializer',
    'repo_owned_mcp_wrapper_materializer',
    'repo_owned_skill_wrapper_materializer',
    'repo_owned_product_entry_wrapper_materializer',
    'repo_owned_domain_action_adapter_wrapper_materializer',
    'repo_owned_status_read_model_materializer',
    'repo_owned_workbench_wrapper_materializer',
  ]);
  assert.equal(
    materializerScan.retained_materializer_role,
    'refs_only_target_agent_semantics_work_order_candidate_or_typed_blocker_materializer',
  );

  const implementationRefs = new Map<string, string[]>();
  asObjects(authorityFunctions.functions).forEach((functionRef) => {
    asStrings(functionRef.implementation_refs).forEach((scriptRef) => {
      const refs = implementationRefs.get(scriptRef) ?? [];
      refs.push(functionRef.authority_ref);
      implementationRefs.set(scriptRef, refs);
    });
  });

  const classifiedScripts = asObjects(morphologyPolicy.script_classifications)
    .map((entry) => entry.script_ref as string)
    .sort();
  assert.deepEqual(classifiedScripts, scripts);
  assert.deepEqual(asStrings(receipt.scanned_script_refs).sort(), scripts);

  asObjects(morphologyPolicy.script_classifications).forEach((entry) => {
    assertRepoRefExists(entry.script_ref);
    assert.ok(entry.classes.length > 0, `${entry.script_ref} should have at least one script class`);
    asStrings(entry.classes).forEach((classId) => {
      assert.ok(
        morphologyPolicy.allowed_classes.includes(classId),
        `${entry.script_ref} uses unsupported script morphology class ${classId}`,
      );
    });
    assert.deepEqual(entry.forbidden_roles, [], `${entry.script_ref} must not declare forbidden roles`);
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

  assert.deepEqual(asStrings(receipt.retained_non_polluting_domain_authority_surfaces), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
    'scripts authority/materializer/helper refs',
  ]);
  assert.ok(asStrings(receipt.forbidden_long_term_composition_claims).includes('repo_owned_generic_cli_mcp_skill_product_status_workbench_wrapper'));
});

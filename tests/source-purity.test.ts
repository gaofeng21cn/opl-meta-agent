import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE,
  DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
  DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
  DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE,
  DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES,
  DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS,
} from '../scripts/lib/work-order-policy-constants.ts';
import {
  SERIES_DESIGN_PROFILE,
  STAGE_PROGRESS_DELTA_POLICY,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_CONTRACT,
  USER_STAGE_LOG_REQUIRED_FIELDS,
} from '../scripts/lib/standard-foundry-policies.ts';

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
  assert.deepEqual(asStrings(materializerScan.retired_materializer_tails), [
    'build_agent_baseline_no_closeout_implicit_fixture_graph',
    'takeover_fixture_alias',
  ]);
  assert.deepEqual(asStrings(materializerScan.retired_materializer_tail_verification_refs), [
    'tests/stage-decomposition-materializer.test.ts',
    'tests/takeover-loop.test.ts',
  ]);

  const retirementGates = asObjects(morphologyPolicy.script_to_pack_retirement_gates);
  assert.deepEqual(retirementGates.map((entry) => entry.gate_id), [
    'agent_evidence_and_external_suite_materializers',
    'build_agent_baseline_and_stage_decomposition_materializers',
    'external_work_order_execution_delegation',
    'retained_thin_authority_helpers_and_takeover_smoke',
  ]);
  const gatedScriptRefs = [...new Set(
    retirementGates.flatMap((gate) => asStrings(gate.tracked_script_refs)),
  )].sort();
  assert.deepEqual(
    gatedScriptRefs,
    scripts,
    'Every repo-local TypeScript script must have an explicit script-to-pack retirement or retention gate',
  );
  retirementGates.forEach((gate) => {
    const trackedScriptRefs = asStrings(gate.tracked_script_refs);
    assert.ok(trackedScriptRefs.length > 0, `${gate.gate_id} should track at least one script`);
    trackedScriptRefs.forEach((scriptRef) => {
      assertRepoRefExists(scriptRef);
      assert.ok(scripts.includes(scriptRef), `${scriptRef} should be part of the tracked script set`);
    });
    assert.ok(
      asStrings(gate.required_before_retire_or_absorb).includes('no_active_npm_or_test_caller_ref'),
      `${gate.gate_id} should require no active caller evidence before retirement`,
    );
    assert.ok(
      asStrings(gate.required_before_retire_or_absorb).includes('tombstone_or_provenance_ref'),
      `${gate.gate_id} should require tombstone or provenance evidence`,
    );
    assert.ok(
      asStrings(gate.forbidden_long_term_claims).length > 0,
      `${gate.gate_id} should declare forbidden long-term claims`,
    );
  });
  const buildBaselineGate = retirementGates.find((gate) => (
    gate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers'
  ));
  assert.ok(buildBaselineGate, 'build-agent-baseline retirement gate should exist');
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'stable_standard_foundry_policies_moved_to_contract_or_opl_primitive_ref',
    ),
    'stage materializer retirement should require stable Foundry policy contract or OPL primitive migration',
  );
  assert.ok(
    asStrings(buildBaselineGate.closed_retention_refs).includes(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF),
    'stable Foundry policy body should be moved into a contract while script projection remains retained',
  );
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'opl_physical_kernel_locator_conformance_workbench_consumption_parity_ref',
    ),
    'stage materializer retirement should require OPL physical kernel/conformance/workbench parity',
  );
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'no_oma_runtime_state_owner_promotion_worktree_or_receipt_body_ref',
    ),
    'stage materializer retirement should prove no OMA runtime state, promotion, worktree, or receipt body ownership',
  );
  [
    'physical_kernel_runtime_state_owner',
    'conformance_gate_owner',
    'workbench_consumption_owner',
    'owner_promotion_or_receipt_body_authority',
    'target_worktree_lifecycle_owner',
  ].forEach((claim) => {
    assert.ok(
      asStrings(buildBaselineGate.forbidden_long_term_claims).includes(claim),
      `build-agent-baseline retirement gate should forbid ${claim}`,
    );
  });
  const retainedHelperGate = retirementGates.find((gate) => (
    gate.gate_id === 'retained_thin_authority_helpers_and_takeover_smoke'
  ));
  assert.ok(retainedHelperGate, 'thin helper/takeover retention gate should exist');
  assert.deepEqual(asStrings(retainedHelperGate.tracked_script_refs), [
    'scripts/lib/meta-agent-loop.ts',
    'scripts/lib/meta-agent-loop-ai-reviewer.ts',
    'scripts/lib/meta-agent-loop-io.ts',
    'scripts/lib/meta-agent-loop-receipts.ts',
    'scripts/takeover-agent.ts',
  ]);
  [
    'opl_generated_interface_or_invocation_helper_parity_ref',
    'opl_agent_lab_takeover_handoff_parity_ref',
    'no_target_truth_verdict_artifact_memory_or_owner_receipt_body_ref',
    'no_agent_lab_runner_promotion_gate_registry_or_app_shell_owner_ref',
  ].forEach((required) => {
    assert.ok(
      asStrings(retainedHelperGate.required_before_retire_or_absorb).includes(required),
      `thin helper/takeover retention gate should require ${required}`,
    );
  });
  [
    'registry_owner',
    'app_shell_owner',
    'generated_interface_owner',
    'target_owner_receipt_body_writer',
    'generic_runtime_owner',
  ].forEach((claim) => {
    assert.ok(
      asStrings(retainedHelperGate.forbidden_long_term_claims).includes(claim),
      `thin helper/takeover retention gate should forbid ${claim}`,
    );
  });

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
    if (entry.script_ref === 'scripts/lib/stage-decomposition-runner.ts') {
      assert.ok(
        asStrings(entry.writes_only).includes('fixture_closeout_packet_required_typed_blocker_ref'),
      );
      assert.deepEqual(asStrings(entry.retired_tail_refs), [
        'retired-tail:opl-meta-agent/build-agent-baseline/no-closeout-implicit-fixture-graph',
      ]);
    }
    if (entry.script_ref === 'scripts/lib/stage-decomposition-pack-draft.ts') {
      [
        'stage_native_artifact_contract_ref',
        'stage_native_artifact_ref_template_ref',
        'opl_physical_kernel_locator_ref',
        'stage_artifact_conformance_ref',
        'stage_artifact_workbench_consumption_ref',
      ].forEach((writeRef) => {
        assert.ok(asStrings(entry.writes_only).includes(writeRef), `${entry.script_ref} writes_only ${writeRef}`);
      });
    }
    if (entry.script_ref === 'scripts/lib/standard-foundry-policies.ts') {
      assert.ok(
        asStrings(entry.writes_only).includes('standard_foundry_policies_contract_projection_ref'),
      );
      assert.deepEqual(asStrings(entry.contract_refs), [
        STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
      ]);
    }
    if (entry.script_ref === 'scripts/lib/stage-native-artifact-contract.ts') {
      [
        'opl_physical_kernel_locator_ref',
        'stage_artifact_conformance_ref',
        'stage_artifact_workbench_consumption_ref',
      ].forEach((writeRef) => {
        assert.ok(asStrings(entry.writes_only).includes(writeRef), `${entry.script_ref} writes_only ${writeRef}`);
      });
    }

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

test('purpose-first gate prevents OMA scripts from becoming a second framework', () => {
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const gate = authorityFunctions.purpose_first_owner_delta_gate as JsonObject;
  const materializerBoundary = gate.materializer_boundary as JsonObject;
  const secondFrameworkGuard = gate.second_framework_guard as JsonObject;

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

test('developer work-order policy defaults are contract-backed projections', () => {
  const contract = readJson(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === 'agent_evidence_and_external_suite_materializers');
  const policyProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/work-order-policy-constants.ts');

  assert.equal(contract.surface_kind, 'developer_work_order_policy');
  assert.equal(contract.state, 'active_contract');
  assert.equal(contract.script_projection_ref, 'scripts/lib/work-order-policy-constants.ts');
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_write_target_memory_body, false);
  assert.equal(contract.authority_boundary.can_write_target_artifact_body, false);
  assert.equal(contract.authority_boundary.can_authorize_target_quality_or_export, false);
  assert.equal(contract.authority_boundary.can_authorize_submission_readiness, false);
  assert.equal(contract.authority_boundary.can_promote_default_agent, false);

  assert.ok(policyProjection, 'work-order policy projection script should be classified');
  assert.deepEqual(asStrings(policyProjection.writes_only), [
    'developer_work_order_policy_contract_projection_ref',
  ]);
  assert.deepEqual(asStrings(policyProjection.contract_refs), [
    DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  ]);
  assert.ok(retirementGate, 'agent evidence materializer gate should exist');
  assert.ok(
    asStrings(retirementGate.closed_retention_refs).includes(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF),
    'stable developer work-order policy should be moved into a contract while script projection remains retained',
  );

  assert.deepEqual(
    DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
    asStrings(contract.default_forbidden_target_paths_or_surfaces),
  );
  assert.deepEqual(
    DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
    asStrings(contract.default_runtime_required_surface_refs),
  );
  assert.deepEqual(
    DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
    asStrings(contract.default_runtime_expected_outcomes),
  );
  assert.deepEqual(
    DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS,
    asStrings(contract.default_target_workspace_required_surface_refs),
  );
  assert.deepEqual(
    DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES,
    asStrings(contract.default_target_workspace_expected_outcomes),
  );
  assert.deepEqual(
    DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE,
    asStrings(contract.default_no_patch_closeout_evidence),
  );
  assert.deepEqual(
    DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE,
    asStrings(contract.default_source_patch_closeout_evidence),
  );
});

test('standard Foundry policies are contract-backed projections', () => {
  const contract = readJson(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers');
  const policyProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/standard-foundry-policies.ts');

  assert.equal(contract.surface_kind, 'standard_foundry_policies');
  assert.equal(contract.state, 'active_contract');
  assert.equal(contract.script_projection_ref, 'scripts/lib/standard-foundry-policies.ts');
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_read_target_domain_body, false);
  assert.equal(contract.authority_boundary.can_authorize_target_quality_or_export, false);
  assert.equal(contract.authority_boundary.can_promote_default_agent, false);
  assert.equal(contract.authority_boundary.can_replace_opl_framework_or_agent_lab, false);

  assert.ok(policyProjection, 'standard Foundry policy projection script should be classified');
  assert.deepEqual(asStrings(policyProjection.contract_refs), [
    STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  ]);
  assert.ok(
    asStrings(policyProjection.writes_only).includes('standard_foundry_policies_contract_projection_ref'),
  );
  assert.ok(retirementGate, 'stage-decomposition materializer gate should exist');
  assert.ok(
    asStrings(retirementGate.closed_retention_refs).includes(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF),
    'stable Foundry policy should be moved into a contract while script projection remains retained',
  );

  assert.deepEqual(USER_STAGE_LOG_REQUIRED_FIELDS, asStrings(contract.user_stage_log_required_fields));
  assert.deepEqual(USER_STAGE_LOG_CONTRACT, contract.user_stage_log_contract);
  assert.deepEqual(STAGE_PROGRESS_DELTA_POLICY, contract.stage_progress_delta_policy);
  assert.deepEqual(TYPED_BLOCKER_LINEAGE_POLICY, contract.typed_blocker_lineage_policy);
  assert.deepEqual(SERIES_DESIGN_PROFILE, contract.series_design_profile);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';
import { readJson, repoRoot } from './support/contracts.ts';

type JsonObject = Record<string, any>;

type ActionContract = {
  action_id: string;
  input_schema_ref: string;
  output_schema_ref: string;
};

function objectValue(value: unknown, label: string): JsonObject {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  return value as JsonObject;
}

function readSchema(schemaRef: string): JsonObject {
  assert.equal(schemaRef.includes('#'), false, `${schemaRef} must reference a root schema`);
  return objectValue(readJson(schemaRef), schemaRef);
}

function validate(schemaRef: string, payload: unknown) {
  const schema = readSchema(schemaRef);
  return validateJsonSchemaPayload({
    schemaId: schema.$id,
    schema,
    sourceRef: schemaRef,
  }, payload);
}

function authorityBoundary(): JsonObject {
  return {
    source_patch_allowed_after_owner_gate: false,
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
    can_promote_default_agent_without_gate: false,
    can_train_or_deploy_model_weights: false,
  };
}

const targetAgent = {
  domain_id: 'target-agent',
  domain_label: 'Target Agent',
  delivery_domain: 'opl_compatible_target_agent',
  repo_dir: '/tmp/target-agent',
  descriptor_ref: 'contracts/domain_descriptor.json',
};

const capabilityCandidate = {
  surface_kind: 'opl_meta_agent_target_agent_capability_improvement_candidate',
  version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
  candidate_id: 'candidate:target-agent/capability-gap',
  status: 'candidate_recorded_requires_target_owner_gate',
  product_id: 'opl-meta-agent',
  target_agent: targetAgent,
  owner_receipt_ref: 'receipt:oma/target-agent/external-suite',
  efficiency_non_regression_refs: {
    quality_floor_refs: ['quality-floor:target-agent/current-behavior'],
  },
  authority_boundary: authorityBoundary(),
};

function improveOutput(status: string, delta: JsonObject = {}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_external_suite_judgment',
    version: 'opl-meta-agent.external-suite-judgment.v1',
    status,
    product_id: 'opl-meta-agent',
    target_agent: targetAgent,
    source_agent_lab_result_ref: 'result:target-agent/external',
    candidate_refs: ['candidate:target-agent/capability-gap'],
    authority_boundary: authorityBoundary(),
    agent_building_judgment: {
      target_capability_improvement_candidate: capabilityCandidate,
    },
    ...delta,
  };
}

test('all action catalog schemas are self-contained and compile in the OPL registry', () => {
  const catalog = readJson('contracts/action_catalog.json');
  const actions = catalog.actions as ActionContract[];
  assert.ok(Array.isArray(actions) && actions.length > 0, 'action catalog must contain actions');

  const ids = new Set<string>();
  for (const action of actions) {
    for (const schemaRef of [action.input_schema_ref, action.output_schema_ref]) {
      const schemaPath = path.join(repoRoot, schemaRef);
      assert.equal(fs.existsSync(schemaPath), true, `${action.action_id} schema target is missing: ${schemaRef}`);
      const schema = readSchema(schemaRef);
      assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema', `${schemaRef}.$schema`);
      assert.match(schema.$id, /^https:\/\/one-person-lab\.local\/contracts\/opl-meta-agent\/actions\//);
      assert.equal(ids.has(schema.$id), false, `${schemaRef} has a duplicate $id`);
      ids.add(schema.$id);
      assert.equal(schema.type, 'object', `${schemaRef}.type`);
      assert.ok(Array.isArray(schema.required) && schema.required.length > 0, `${schemaRef}.required`);

      const result = validateJsonSchemaPayload({
        schemaId: schema.$id,
        schema,
        sourceRef: schemaRef,
      }, {});
      assert.equal(result.ok, false, `${schemaRef} should compile and reject an empty instance`);
    }
  }

  assert.equal(ids.size, actions.length * 2, 'every action input/output must have a unique root schema');
});

test('build-agent-baseline action metadata exposes canonical intent signals and every design-basis route', () => {
  const catalog = readJson('contracts/action_catalog.json');
  const action = (catalog.actions as JsonObject[]).find((entry) => entry.action_id === 'build-agent-baseline');
  assert.ok(action);
  assert.deepEqual(action.execution_binding, {
    kind: 'stage_binding',
    stage_manifest_ref: 'agent/stages/manifest.json',
  });
  assert.equal(Object.hasOwn(action, 'source_command'), false);
  assert.deepEqual(action.supported_surfaces.cli, {});
  const routeFields = [
    'reference_design_source_refs',
    'reference_design_pattern_notes',
    'reference_design_pattern_packet_refs',
    'research_source_refs',
    'expert_practice_notes',
    'research_synthesis_refs',
  ];
  assert.ok(action.optional_fields.includes('intent_signals'));
  assert.equal(action.workspace_locator_fields.includes('intent_signals'), false);
  routeFields.forEach((field) => {
    assert.ok(action.optional_fields.includes(field), field);
    assert.ok(action.workspace_locator_fields.includes(field), field);
  });
});

test('stage manifest gives Codex unrestricted declared-stage routing', () => {
  const policy = readJson('agent/stages/manifest.json').progress_first_policy;
  assert.equal(policy.semantic_route_decision_owner, 'decisive_codex_attempt');
  assert.equal(policy.stage_transition_materialization_owner, 'opl_stage_run_controller');
  assert.equal(policy.primary_only_decisive_attempt_role, 'producer');
  assert.deepEqual(policy.formal_review_decisive_attempt_roles, ['reviewer', 're_reviewer']);
  assert.equal(policy.repairer_can_be_decisive_attempt, false);
  assert.equal(Object.hasOwn(policy, 'route_selection_owner'), false);
  assert.equal(policy.codex_may_advance_skip_repeat_reverse_or_route_back, true);
  assert.equal(policy.any_declared_stage_may_start_from_any_prior_stage_result, true);
  assert.equal(policy.declared_requires_are_quality_context_not_launch_gates, true);
  assert.equal(policy.next_stage_refs_are_recommendations_not_constraints, true);
  assert.equal(policy.no_output_or_failure_diagnostic_advances_stage, true);
});

test('stage operating principles expose the same progress-first route ABI', () => {
  const policy = readJson('contracts/stage_operating_principles.json').speed_policy;
  assert.equal(policy.semantic_route_decision_owner, 'decisive_codex_attempt');
  assert.equal(policy.stage_transition_materialization_owner, 'opl_stage_run_controller');
  assert.equal(policy.primary_only_decisive_attempt_role, 'producer');
  assert.deepEqual(policy.formal_review_decisive_attempt_roles, ['reviewer', 're_reviewer']);
  assert.equal(policy.repairer_can_be_decisive_attempt, false);
  assert.equal(Object.hasOwn(policy, 'route_selection_owner'), false);
  assert.equal(policy.codex_may_advance_skip_repeat_reverse_or_route_back, true);
  assert.equal(policy.any_declared_stage_may_start_from_any_prior_stage_result, true);
  assert.equal(policy.declared_requires_are_quality_context_not_launch_gates, true);
  assert.equal(policy.next_stage_refs_are_recommendations_not_constraints, true);
});

test('representative action inputs and outputs accept valid instances and reject invalid ones', () => {
  const buildInputRef = 'contracts/schemas/build-agent-baseline.input.schema.json';
  assert.equal(validate(buildInputRef, {
    domain_id: 'target-agent',
    ai_reviewer_evaluation: '/tmp/reviewer.json',
    intent_signals: ['risk', 'guideline'],
    selected_opl_profile_refs: ['opl-profile:default'],
    profile_selection_rationale: 'Default profile matches the target agent boundary.',
  }).ok, true);
  assert.equal(validate(buildInputRef, {
    domain_id: 'target-agent',
    ai_reviewer_evaluation: '/tmp/reviewer.json',
    intent_signals: [],
    selected_opl_profile_refs: ['opl-profile:default'],
    profile_selection_rationale: 'Default profile matches the target agent boundary.',
  }).ok, false);
  assert.equal(validate(buildInputRef, {
    domain_id: 'target-agent',
    ai_reviewer_evaluation: '/tmp/reviewer.json',
  }).ok, false);
  assert.equal(validate(buildInputRef, {
    domain_id: 'research-driven-agent',
    ai_reviewer_evaluation: '/tmp/reviewer.json',
    research_source_refs: ['research-source:expert-practice'],
    expert_practice_notes: ['Experts first frame the decision and evidence boundary.'],
    research_synthesis_refs: ['research-synthesis:expert-workflow'],
  }).ok, true);

  const trajectoryOutputRef = 'contracts/schemas/materialize-trajectory-learning-proposal.output.schema.json';
  const trajectoryOutput = {
    trajectory_atom_refs: ['trajectory-atom:target-agent/1'],
    single_intent_atom_task_refs: ['atom-task:target-agent/1'],
    candidate_buffer_refs: ['candidate-buffer:target-agent/current'],
    skill_policy_proposal_refs: ['skill-policy-proposal:target-agent/current'],
    redaction_team_sync_boundary_refs: ['redaction-boundary:target-agent/current'],
    authority_boundary: {
      refs_only: true,
      proposals_only: true,
      can_run_trajectory_daemon: false,
      can_install_user_scope_skills: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_claim_ux_score_as_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
  };
  assert.equal(validate(trajectoryOutputRef, trajectoryOutput).ok, true);
  assert.equal(validate(trajectoryOutputRef, {
    ...trajectoryOutput,
    authority_boundary: {
      ...trajectoryOutput.authority_boundary,
      can_promote_default_agent_without_gate: true,
    },
  }).ok, false);
});

test('external-suite action schema matches the three real OMA judgment branches', () => {
  const outputRef = 'contracts/schemas/improve-from-external-agent-lab-suite.output.schema.json';
  const foundryReceipt = 'receipt:opl-foundry-lab/target-agent/external-suite';
  const materializationRequest = readJson(
    'tests/fixtures/opl-work-order-materialization-request.developer-patch.v2.json',
  );
  const requestId = materializationRequest.semantic_request.request_id;

  assert.equal(validate(outputRef, improveOutput(
    'no_source_patch_required',
    { foundry_lab_execution_receipt_ref: foundryReceipt },
  )).ok, true);
  assert.equal(validate(outputRef, improveOutput(
    'completed_with_quality_debt',
    {
      candidate_refs: [
        'candidate:target-agent/capability-gap',
        'quality-debt:target-agent/missing-inputs',
      ],
      missing_required_fields: ['foundry_lab_execution_receipt_ref'],
      authority_boundary: {
        ...authorityBoundary(),
        quality_debt_blocks_stage_transition: false,
        quality_debt_blocks_delivery_patch_or_promotion_claims: true,
        executable_work_order_materialized: false,
      },
    },
  )).ok, true);
  assert.equal(validate(outputRef, improveOutput(
    'developer_patch_semantic_request_ready_for_opl_materialization',
    {
      foundry_lab_execution_receipt_ref: foundryReceipt,
      candidate_refs: [capabilityCandidate.candidate_id, requestId],
      agent_building_judgment: {
        target_capability_improvement_candidate: capabilityCandidate,
        developer_patch_evidence: { source_morphology_proof_ref: 'proof:source-morphology' },
      },
      semantic_requests: {
        work_order_materialization_request: materializationRequest,
      },
      authority_boundary: materializationRequest.authority_boundary,
    },
  )).ok, true);

  assert.equal(validate(outputRef, improveOutput(
    'completed_with_quality_debt',
    {
      missing_required_fields: ['foundry_lab_execution_receipt_ref'],
      semantic_requests: {
        work_order_materialization_request: materializationRequest,
      },
    },
  )).ok, false, 'missing-input branch must not contain an executable developer work order');
  assert.equal(validate(outputRef, improveOutput(
    'developer_patch_semantic_request_ready_for_opl_materialization',
    { foundry_lab_execution_receipt_ref: foundryReceipt },
  )).ok, false, 'ready branch requires the semantic materialization request and judgment');
});

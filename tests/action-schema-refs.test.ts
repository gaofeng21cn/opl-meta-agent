import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework-shared/json-schema-registry';
import {
  buildEfficiencyTypedBlocker,
  buildTargetImprovementPolicyTypedBlocker,
} from '../scripts/lib/external-suite-materializer.ts';
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

function resolveJsonPointer(document: unknown, fragment: string, label: string): unknown {
  assert.ok(fragment.startsWith('/'), `${label} must use a JSON Pointer fragment`);
  return fragment.slice(1).split('/').reduce<unknown>((current, rawToken) => {
    const token = decodeURIComponent(rawToken).replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(current)) {
      const index = Number(token);
      assert.ok(Number.isInteger(index) && index >= 0 && index < current.length, `${label} is missing /${token}`);
      return current[index];
    }
    const object = objectValue(current, label);
    assert.ok(Object.hasOwn(object, token), `${label} is missing /${token}`);
    return object[token];
  }, document);
}

function schemaRefs(value: unknown, label: string): string[] {
  if (Array.isArray(value)) return value.flatMap((entry, index) => schemaRefs(entry, `${label}[${index}]`));
  if (!value || typeof value !== 'object') return [];
  const object = value as JsonObject;
  const refs: string[] = [];
  if (Object.hasOwn(object, '$ref')) {
    assert.equal(typeof object.$ref, 'string', `${label}.$ref must be a string`);
    refs.push(object.$ref);
  }
  return refs.concat(
    Object.entries(object)
      .filter(([key]) => key !== '$ref')
      .flatMap(([key, entry]) => schemaRefs(entry, `${label}.${key}`)),
  );
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
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
    can_promote_default_agent_without_gate: false,
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

function improveOutput(status: string, learningLoopDelta: JsonObject): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_external_suite_self_evolution_result',
    version: 'opl-meta-agent.external-suite-self-evolution.v1',
    status,
    product_id: 'opl-meta-agent',
    target_agent: targetAgent,
    authority_boundary: authorityBoundary(),
    artifacts: {
      suite_path: '/tmp/external-suite.json',
      result_path: '/tmp/result.json',
    },
    learning_loop: {
      target_capability_improvement_candidate: capabilityCandidate,
      ...learningLoopDelta,
    },
  };
}

function developerPatchWorkOrder(status: 'ready_for_target_agent_source_patch' | 'no_patch_required'): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: `work-order:target-agent/${status}`,
    status,
    product_id: 'opl-meta-agent',
    target_agent: targetAgent,
    executor_lease_ref: 'executor-lease:codex-cli/target-agent',
    reviewer_pool_refs: ['reviewer-pool:target-agent/independent'],
    patch_execution_bundle_ref: 'patch-bundle:target-agent/current',
    target_closeout_refs: ['target-owner-receipt-or-typed-blocker:target-agent/current'],
    owner_receipt_ref: 'receipt:oma/target-agent/external-suite',
    authority_boundary: authorityBoundary(),
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

      for (const ref of schemaRefs(schema, schemaRef)) {
        assert.match(ref, /^#\//, `${schemaRef} must not depend on an unregistered external schema: ${ref}`);
        assert.notEqual(resolveJsonPointer(schema, ref.slice(1), `${schemaRef}:${ref}`), undefined);
      }

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

test('canonical typed blocker builders match their action output branches exactly', () => {
  const suite = { suite_id: 'suite:target-agent/external' };
  const suiteResult = { result_id: 'result:target-agent/external', status: 'blocked' };
  const targetImprovementBlocker = buildTargetImprovementPolicyTypedBlocker({
    targetAgent: targetAgent as any,
    suite,
    suiteResult: suiteResult as any,
    capabilityCandidate: capabilityCandidate as any,
    missingFields: ['target_improvement_policy.canonical_paths'],
  });
  const efficiencyBlocker = buildEfficiencyTypedBlocker({
    targetAgent: targetAgent as any,
    suite,
    suiteResult: suiteResult as any,
    capabilityCandidate: capabilityCandidate as any,
    missingFields: ['efficiency_non_regression_refs.quality_floor_refs'],
  });
  const outputRef = 'contracts/schemas/improve-from-external-agent-lab-suite.output.schema.json';

  assert.equal(validate(outputRef, improveOutput(
    'blocked_target_improvement_policy_missing',
    { typed_blocker: targetImprovementBlocker },
  )).ok, true);
  assert.equal(validate(outputRef, improveOutput(
    'blocked_efficiency_quality_floor_missing',
    { typed_blocker: efficiencyBlocker },
  )).ok, true);
  assert.equal(validate(outputRef, improveOutput(
    'passed',
    { developer_patch_work_order: developerPatchWorkOrder('no_patch_required') },
  )).ok, true);
  assert.equal(validate(outputRef, improveOutput(
    'blocked_with_developer_patch_work_order',
    { developer_patch_work_order: developerPatchWorkOrder('ready_for_target_agent_source_patch') },
  )).ok, true);

  const targetBlockerWithEfficiencyField = structuredClone(targetImprovementBlocker);
  delete targetBlockerWithEfficiencyField.authority_boundary.can_authorize_target_domain_quality_or_export;
  targetBlockerWithEfficiencyField.authority_boundary.can_authorize_target_quality_or_export = false;
  assert.equal(validate(outputRef, improveOutput(
    'blocked_target_improvement_policy_missing',
    { typed_blocker: targetBlockerWithEfficiencyField },
  )).ok, false);

  const efficiencyBlockerWithTargetField = structuredClone(efficiencyBlocker);
  delete efficiencyBlockerWithTargetField.authority_boundary.can_authorize_target_quality_or_export;
  efficiencyBlockerWithTargetField.authority_boundary.can_authorize_target_domain_quality_or_export = false;
  assert.equal(validate(outputRef, improveOutput(
    'blocked_efficiency_quality_floor_missing',
    { typed_blocker: efficiencyBlockerWithTargetField },
  )).ok, false);

  assert.equal(validate(outputRef, improveOutput(
    'passed',
    { typed_blocker: efficiencyBlocker },
  )).ok, false, 'passed output must not contain a typed blocker');
  assert.equal(validate(outputRef, improveOutput(
    'blocked_efficiency_quality_floor_missing',
    {
      typed_blocker: efficiencyBlocker,
      developer_patch_work_order: developerPatchWorkOrder('ready_for_target_agent_source_patch'),
    },
  )).ok, false, 'typed-blocker output must not contain a developer work order');
});

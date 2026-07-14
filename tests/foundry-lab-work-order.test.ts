import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';
import {
  buildWorkOrderMaterializationRequest,
} from '../scripts/lib/work-order-materialization-request.ts';
import {
  assertMatchesJsonSchema,
  type JsonObject,
  readJson,
} from './support/contracts.ts';

const schemaRef = 'contracts/schemas/opl-work-order-materialization-request.v2.schema.json';
const canonicalSchemaRef = 'contracts/opl-framework/work-order-materialization-request.schema.json';
const canonicalSchemaPath = fileURLToPath(new URL(
  `../../${canonicalSchemaRef}`,
  import.meta.resolve('opl-framework/json-schema-registry'),
));

function fixture(name: string): JsonObject {
  return readJson(`tests/fixtures/${name}`);
}

function buildFromFixture(value: JsonObject): JsonObject {
  return buildWorkOrderMaterializationRequest({
    requestKind: value.request_kind as 'developer_patch' | 'foundry_evaluation',
    targetAgent: value.target_agent as {
      domain_id: string;
      repo_dir: string;
      target_agent_ref?: string;
      descriptor_ref?: string;
    },
    semanticRequest: value.semantic_request as JsonObject,
  });
}

function schemaValidation(payload: unknown) {
  const schema = readJson(schemaRef);
  return validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, payload);
}

function canonicalSchemaValidation(payload: unknown) {
  const schema = JSON.parse(fs.readFileSync(canonicalSchemaPath, 'utf8')) as JsonObject;
  return validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: canonicalSchemaPath,
  }, payload);
}

test('OMA emits self-contained v2 requests and leaves work-order identity to OPL', () => {
  for (const name of [
    'opl-work-order-materialization-request.v2.json',
    'opl-work-order-materialization-request.developer-patch.v2.json',
  ]) {
    const expected = fixture(name);
    const request = buildFromFixture(expected);
    assert.deepEqual(request, expected);
    assertMatchesJsonSchema(schemaRef, request);
    assert.equal(canonicalSchemaValidation(request).ok, true);
    assert.equal(Object.hasOwn(request, 'work_order_id'), false);
    assert.equal(Object.hasOwn(request, 'executor_lease_ref'), false);
    assert.equal(Object.hasOwn(request, 'worktree'), false);
    assert.equal(Object.hasOwn(request, 'lifecycle'), false);
    assert.equal(Object.hasOwn(request, 'closeout'), false);
  }
});

test('foundry evaluation requests require the exact target identity consumed by OPL', () => {
  const value = fixture('opl-work-order-materialization-request.v2.json');
  const target = value.target_agent as JsonObject;
  assert.throws(
    () => buildWorkOrderMaterializationRequest({
      requestKind: 'foundry_evaluation',
      targetAgent: {
        domain_id: String(target.domain_id),
        repo_dir: String(target.repo_dir),
      },
      semanticRequest: value.semantic_request as JsonObject,
    }),
    /target_agent_ref and target_agent\.descriptor_ref/i,
  );
  for (const field of ['target_agent_ref', 'descriptor_ref']) {
    const invalid = structuredClone(value);
    delete (invalid.target_agent as JsonObject)[field];
    assert.equal(schemaValidation(invalid).ok, false, `local schema accepted missing ${field}`);
    assert.equal(
      canonicalSchemaValidation(invalid).ok,
      false,
      `Framework schema accepted missing ${field}`,
    );
  }
});

test('request_kind branches are mutually exclusive', () => {
  const foundry = fixture('opl-work-order-materialization-request.v2.json');
  const developer = fixture('opl-work-order-materialization-request.developer-patch.v2.json');
  assert.throws(
    () => buildWorkOrderMaterializationRequest({
      requestKind: 'developer_patch',
      targetAgent: foundry.target_agent as never,
      semanticRequest: foundry.semantic_request as JsonObject,
    }),
    /does not allow semantic_request\.suite_id/i,
  );
  assert.throws(
    () => buildWorkOrderMaterializationRequest({
      requestKind: 'foundry_evaluation',
      targetAgent: developer.target_agent as never,
      semanticRequest: developer.semantic_request as JsonObject,
    }),
    /does not allow semantic_request\.source_agent_lab_result_ref/i,
  );
});

test('developer patch requests require all three boundary proofs', () => {
  const value = fixture('opl-work-order-materialization-request.developer-patch.v2.json');
  const requiredProofs = [
    'source_morphology_proof_ref',
    'private_residue_decision_ref',
    'target_runtime_read_model_consumption_ref',
  ];
  for (const field of requiredProofs) {
    const semanticRequest = structuredClone(value.semantic_request as JsonObject);
    delete (semanticRequest.agent_building_judgment as JsonObject)[field];
    assert.throws(
      () => buildWorkOrderMaterializationRequest({
        requestKind: 'developer_patch',
        targetAgent: value.target_agent as never,
        semanticRequest,
      }),
      new RegExp(field),
    );
  }
});

test('retired private ABI and Framework mechanics fail closed', () => {
  const value = fixture('opl-work-order-materialization-request.v2.json');
  const mutations: Array<[string, (semantic: JsonObject) => void]> = [
    ['work_order_id', (semantic) => { semantic.work_order_id = 'oma-owned-id'; }],
    ['oma_can_execute', (semantic) => { semantic.oma_can_execute = false; }],
    ['omaSemanticEnvelope', (semantic) => { semantic.omaSemanticEnvelope = {}; }],
    ['retired Foundry ABI', (semantic) => { semantic.source_refs = ['opl_meta_agent_foundry_request:v1']; }],
  ];
  for (const [, mutate] of mutations) {
    const semanticRequest = structuredClone(value.semantic_request as JsonObject);
    mutate(semanticRequest);
    assert.throws(
      () => buildWorkOrderMaterializationRequest({
        requestKind: 'foundry_evaluation',
        targetAgent: value.target_agent as never,
        semanticRequest,
      }),
    );
  }

  const invalid = structuredClone(value);
  (invalid.semantic_request as JsonObject).worktree_ref = 'worktree:oma/private';
  assert.equal(schemaValidation(invalid).ok, false);
  assert.equal(canonicalSchemaValidation(invalid).ok, false);

  for (const field of ['work_order_id', 'executor_lease_ref', 'worktree', 'lifecycle', 'receipt']) {
    const privateMechanic = structuredClone(value);
    privateMechanic[field] = `retired:${field}`;
    assert.equal(schemaValidation(privateMechanic).ok, false, `local schema accepted ${field}`);
    assert.equal(
      canonicalSchemaValidation(privateMechanic).ok,
      false,
      `Framework schema accepted ${field}`,
    );
  }
});

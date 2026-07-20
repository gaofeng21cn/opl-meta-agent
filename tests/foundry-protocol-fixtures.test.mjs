import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const protocolVersion = 'opl-foundry-protocol.v1';
const protocolDefinitions = {
  DesignRequest: {
    schemaRef: 'opl://foundry-protocol/DesignRequest',
    surfaceKind: 'opl_foundry_design_request',
  },
  AgentBlueprint: {
    schemaRef: 'opl://foundry-protocol/AgentBlueprint',
    surfaceKind: 'opl_foundry_agent_blueprint',
  },
  EvidenceBundle: {
    schemaRef: 'opl://foundry-protocol/EvidenceBundle',
    surfaceKind: 'opl_foundry_evidence_bundle',
  },
  EvolutionProposal: {
    schemaRef: 'opl://foundry-protocol/EvolutionProposal',
    surfaceKind: 'opl_foundry_evolution_proposal',
  },
};

const targetIdentity = ['target_agent_id', 'target_domain_id', 'target_version_ref'];

function fixturesFromManifest(relativePath) {
  const manifest = readJson(relativePath);
  return {
    manifest,
    fixtures: Object.fromEntries(
      manifest.fixtures.map((entry) => [entry.protocol_object, readJson(entry.fixture_ref)]),
    ),
  };
}

function atJsonPointer(value, pointer) {
  return pointer.split('/').slice(1).reduce((current, token) => {
    if (current === undefined) return undefined;
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    return current[key];
  }, value);
}

test('fixture manifest maps exactly the four OPL-owned Foundry protocol schemas', () => {
  const manifest = readJson('contracts/foundry_protocol_fixture_manifest.json');
  const provider = readJson('contracts/foundry_provider.json');
  const declared = Object.fromEntries(manifest.fixtures.map((entry) => [entry.protocol_object, entry]));

  assert.deepEqual(Object.keys(declared).sort(), Object.keys(protocolDefinitions).sort());
  for (const [name, definition] of Object.entries(protocolDefinitions)) {
    assert.equal(declared[name].schema_ref, definition.schemaRef);
    assert.ok(fs.statSync(path.join(root, declared[name].fixture_ref)).isFile());
  }

  const providerRefs = new Set([
    ...provider.operations.design.input_schema_refs,
    provider.operations.design.output_schema_ref,
    ...provider.operations.diagnose.input_schema_refs,
    provider.operations.diagnose.output_schema_ref,
  ]);
  assert.deepEqual([...providerRefs].sort(), Object.values(protocolDefinitions).map((entry) => entry.schemaRef).sort());
  assert.equal(manifest.schema_authority_owner, 'one-person-lab');
  assert.equal(manifest.validation_authority_owner, 'one-person-lab');
  assert.equal(manifest.validation_surface_ref, 'opl-framework/foundry-protocol-fixture-conformance');
  assert.equal(manifest.validation_surface_version, 'opl-foundry-protocol-fixture-conformance.v1');
  assert.equal(manifest.authority_boundary.fixtures_are_schema_authority, false);
  assert.equal(manifest.authority_boundary.oma_can_validate_schema_conformance, false);
  assert.equal(manifest.authority_boundary.opl_validator_is_required_for_integration_acceptance, true);
});

test('improve fixture manifest maps a second complete set to the same OPL authority', () => {
  const createManifest = readJson('contracts/foundry_protocol_fixture_manifest.json');
  const improveManifest = readJson('contracts/foundry_protocol_improve_fixture_manifest.json');
  const declared = Object.fromEntries(improveManifest.fixtures.map((entry) => [entry.protocol_object, entry]));

  assert.deepEqual(Object.keys(declared).sort(), Object.keys(protocolDefinitions).sort());
  for (const [name, definition] of Object.entries(protocolDefinitions)) {
    assert.equal(declared[name].schema_ref, definition.schemaRef);
    assert.match(declared[name].fixture_ref, /^contracts\/fixtures\/foundry-protocol\/improve\//);
    assert.ok(fs.statSync(path.join(root, declared[name].fixture_ref)).isFile());
  }
  for (const key of [
    'schema_authority_owner',
    'validation_authority_owner',
    'validation_surface_ref',
    'validation_surface_version',
    'canonicalization',
    'digest_algorithm',
  ]) {
    assert.equal(improveManifest[key], createManifest[key], key);
  }
  assert.deepEqual(improveManifest.authority_boundary, createManifest.authority_boundary);
});

test('protocol fixtures preserve coherent OMA identity and independent review separation', () => {
  const manifest = readJson('contracts/foundry_protocol_fixture_manifest.json');
  const fixtures = Object.fromEntries(manifest.fixtures.map((entry) => [entry.protocol_object, readJson(entry.fixture_ref)]));

  for (const [name, fixture] of Object.entries(fixtures)) {
    assert.equal(fixture.surface_kind, protocolDefinitions[name].surfaceKind);
    assert.equal(fixture.version, protocolVersion);
  }
  for (const key of targetIdentity) {
    const values = Object.values(fixtures).map((fixture) => fixture[key]);
    assert.ok(values.every((value) => value === values[0]), `target identity drift for ${key}`);
  }

  assert.notEqual(
    fixtures.EvidenceBundle.independent_review.review_execution_ref,
    fixtures.EvidenceBundle.independent_review.evaluation_execution_ref,
  );
});

test('improve fixtures bind an exact baseline and propose one non-weakening generation', () => {
  const { fixtures } = fixturesFromManifest('contracts/foundry_protocol_improve_fixture_manifest.json');
  const request = fixtures.DesignRequest;
  const blueprint = fixtures.AgentBlueprint;
  const evidence = fixtures.EvidenceBundle;
  const proposal = fixtures.EvolutionProposal;
  const next = proposal.next_blueprint;

  assert.equal(request.mode, 'improve');
  assert.match(request.target_version_ref, /^sha256:[a-f0-9]{64}$/);
  for (const key of targetIdentity) {
    const values = [request, blueprint, evidence, proposal, next].map((fixture) => fixture[key]);
    assert.ok(values.every((value) => value === values[0]), `improve target identity drift for ${key}`);
  }
  assert.equal(evidence.baseline_version_digest, request.target_version_ref);
  assert.ok(evidence.baseline_public_results.length > 0);
  assert.ok(evidence.baseline_protected_aggregates.length > 0);
  assert.equal(next.generation, blueprint.generation + 1);
  assert.ok(proposal.semantic_diff.length > 0);

  for (const change of proposal.semantic_diff) {
    const previous = atJsonPointer(blueprint, change.semantic_path);
    const proposed = atJsonPointer(next, change.semantic_path);
    if (change.operation === 'add') {
      assert.equal(previous, undefined, change.semantic_path);
      assert.notEqual(proposed, undefined, change.semantic_path);
    } else if (change.operation === 'remove') {
      assert.notEqual(previous, undefined, change.semantic_path);
      assert.equal(proposed, undefined, change.semantic_path);
    } else {
      assert.notEqual(previous, undefined, change.semantic_path);
      assert.notEqual(proposed, undefined, change.semantic_path);
      assert.notDeepEqual(proposed, previous, change.semantic_path);
    }
  }

  const previousCaseIds = new Set(blueprint.eval_spec.public_cases.map((entry) => entry.case_id));
  const addedCases = next.eval_spec.public_cases
    .filter((entry) => !previousCaseIds.has(entry.case_id))
    .map(({ case_id, test_ref }) => ({ case_id, test_ref }))
    .sort((left, right) => left.case_id.localeCompare(right.case_id));
  const declaredNewTests = proposal.new_tests
    .map(({ case_id, test_ref }) => ({ case_id, test_ref }))
    .sort((left, right) => left.case_id.localeCompare(right.case_id));
  assert.deepEqual(declaredNewTests, addedCases);

  assert.deepEqual(next.authority_policy.permission_refs, request.constraints.permission_refs);
  assert.deepEqual(next.authority_policy.permission_refs, blueprint.authority_policy.permission_refs);
  for (const previousCase of blueprint.eval_spec.public_cases) {
    assert.deepEqual(
      next.eval_spec.public_cases.find((entry) => entry.case_id === previousCase.case_id),
      previousCase,
    );
  }
  assert.deepEqual(next.eval_spec.protected_requirements, blueprint.eval_spec.protected_requirements);
  assert.deepEqual(next.eval_spec.gates, blueprint.eval_spec.gates);
  assert.deepEqual(next.eval_spec.baseline_comparison, blueprint.eval_spec.baseline_comparison);
  assert.equal(next.eval_spec.independent_evaluator_required, true);
  assert.notEqual(
    evidence.independent_review.review_execution_ref,
    evidence.independent_review.evaluation_execution_ref,
  );
});

test('fixture evidence carries absolute candidate observations and typed safety evidence', () => {
  const evidence = readJson('contracts/fixtures/foundry-protocol/evidence-bundle.json');

  assert.deepEqual(evidence.candidate_cost_observations, { total_usd: 1.5 });
  assert.deepEqual(evidence.candidate_latency_observations, { p95_seconds: 8 });
  for (const observations of [evidence.candidate_cost_observations, evidence.candidate_latency_observations]) {
    Object.values(observations).forEach((value) => assert.ok(Number.isFinite(value) && value >= 0));
  }
  assert.ok(evidence.safety_observations.length > 0);
  for (const observation of evidence.safety_observations) {
    assert.deepEqual(Object.keys(observation), ['observation_id', 'event_type', 'severity', 'evidence_refs']);
    assert.ok(['low', 'medium', 'high', 'critical'].includes(observation.severity));
    assert.ok(observation.evidence_refs.length > 0);
  }
  assert.ok(Object.hasOwn(evidence, 'safety_delta'));
  assert.ok(Object.hasOwn(evidence, 'cost_delta'));
  assert.ok(Object.hasOwn(evidence, 'latency_delta'));
});

test('fixture no-change proposal preserves the exact blueprint and generated-Agent authority', () => {
  const request = readJson('contracts/fixtures/foundry-protocol/design-request.json');
  const blueprint = readJson('contracts/fixtures/foundry-protocol/agent-blueprint.json');
  const proposal = readJson('contracts/fixtures/foundry-protocol/evolution-proposal.json');
  const next = proposal.next_blueprint;

  assert.deepEqual(next, blueprint);
  assert.equal(next.generation, blueprint.generation);
  assert.deepEqual(proposal.semantic_diff, []);
  assert.deepEqual(proposal.new_tests, []);

  for (const candidate of [blueprint, next]) {
    assert.deepEqual(candidate.authority_policy.permission_refs, request.constraints.permission_refs);
    assert.equal(Object.hasOwn(candidate.authority_policy, 'owner_authority_refs'), false);
    assert.equal(Object.hasOwn(request, 'owner_authority_refs'), false);
    const authorityFlags = Object.entries(candidate.authority_policy)
      .filter(([key]) => key.startsWith('generated_agent_can_modify_'));
    assert.equal(authorityFlags.length, 4);
    authorityFlags.forEach(([, value]) => assert.equal(value, false));
  }
});

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

test('protocol fixtures preserve coherent OMA identity and independent review separation', () => {
  const manifest = readJson('contracts/foundry_protocol_fixture_manifest.json');
  const fixtures = Object.fromEntries(manifest.fixtures.map((entry) => [entry.protocol_object, readJson(entry.fixture_ref)]));
  const targetIdentity = ['target_agent_id', 'target_domain_id', 'target_version_ref'];

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

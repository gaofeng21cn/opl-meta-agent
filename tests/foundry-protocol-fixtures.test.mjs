import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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

const forbiddenProtocolKeys = new Set([
  'repo_path',
  'repo_dir',
  'repo_root',
  'worktree',
  'branch',
  'cli',
  'command',
  'commands',
  'queue',
  'lease',
  'attempt',
  'overwrite_policy',
  'promotion_ledger',
  'patch',
  'patches',
  'work_order',
  'work_orders',
  'execution_receipt',
  'hidden_test_body',
  'hidden_test_bodies',
  'protected_test_body',
  'protected_test_bodies',
]);

const forbiddenProtocolKeyPatterns = [
  /(?:^|_)attempt(?:_|$)/,
];

function walk(value, visitor, pointer = '') {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, visitor, `${pointer}/${index}`));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => walk(entry, visitor, `${pointer}/${key}`));
  }
}

function assertFixtureBoundary(value) {
  walk(value, (entry, pointer) => {
    const key = pointer.split('/').at(-1);
    assert.ok(!forbiddenProtocolKeys.has(key), `forbidden protocol field ${pointer}`);
    forbiddenProtocolKeyPatterns.forEach((pattern) => {
      assert.doesNotMatch(key, pattern, `forbidden protocol field ${pointer}`);
    });
    if (typeof entry === 'string') {
      if (key !== 'semantic_path') {
        assert.doesNotMatch(entry, /^(?:file:\/\/|\/|[A-Za-z]:[\\/])/, `physical path at ${pointer}`);
      }
      assert.doesNotMatch(entry, /^(?:git|npm|npx|node|opl)\s+/, `command at ${pointer}`);
    }
  });
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function digest(value) {
  return `sha256:${crypto.createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
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
  assert.equal(manifest.authority_boundary.fixtures_are_schema_authority, false);
  assert.equal(manifest.authority_boundary.oma_can_validate_schema_conformance, false);
  assert.equal(manifest.authority_boundary.opl_validator_is_required_for_integration_acceptance, true);
});

test('protocol fixtures are identity-coherent and carry no execution coordinates', () => {
  const manifest = readJson('contracts/foundry_protocol_fixture_manifest.json');
  const fixtures = Object.fromEntries(manifest.fixtures.map((entry) => [entry.protocol_object, readJson(entry.fixture_ref)]));
  const targetIdentity = ['target_agent_id', 'target_domain_id', 'target_version_ref'];

  for (const [name, fixture] of Object.entries(fixtures)) {
    assert.equal(fixture.surface_kind, protocolDefinitions[name].surfaceKind);
    assert.equal(fixture.version, protocolVersion);
    assertFixtureBoundary(fixture);
  }
  for (const key of targetIdentity) {
    const values = Object.values(fixtures).map((fixture) => fixture[key]);
    assert.ok(values.every((value) => value === values[0]), `target identity drift for ${key}`);
  }

  assert.throws(() => assertFixtureBoundary({ ...fixtures.DesignRequest, repo_path: '/tmp/target' }), /forbidden protocol field/);
  assert.throws(() => assertFixtureBoundary({ ...fixtures.EvidenceBundle, hidden_test_body: 'secret case' }), /forbidden protocol field/);
  assert.throws(
    () => assertFixtureBoundary({ ...fixtures.EvidenceBundle, review_attempt_ref: 'opl://review-attempt/example' }),
    /forbidden protocol field/,
  );
  assert.notEqual(
    fixtures.EvidenceBundle.independent_review.review_execution_ref,
    fixtures.EvidenceBundle.independent_review.evaluation_execution_ref,
  );
});

test('fixture digest lineage is stable over JCS canonical JSON', () => {
  const request = readJson('contracts/fixtures/foundry-protocol/design-request.json');
  const blueprint = readJson('contracts/fixtures/foundry-protocol/agent-blueprint.json');
  const evidence = readJson('contracts/fixtures/foundry-protocol/evidence-bundle.json');
  const proposal = readJson('contracts/fixtures/foundry-protocol/evolution-proposal.json');

  assert.equal(blueprint.design_request_digest, digest(request));
  assert.equal(evidence.blueprint_digest, digest(blueprint));
  assert.equal(proposal.blueprint_digest, digest(blueprint));
  assert.equal(proposal.evidence_digest, digest(evidence));
  assert.equal(proposal.next_blueprint.design_request_digest, digest(request));
  assert.match(digest(proposal), /^sha256:[a-f0-9]{64}$/);
});

test('fixture no-change proposal preserves the exact blueprint and generated-Agent authority', () => {
  const blueprint = readJson('contracts/fixtures/foundry-protocol/agent-blueprint.json');
  const proposal = readJson('contracts/fixtures/foundry-protocol/evolution-proposal.json');
  const next = proposal.next_blueprint;

  assert.deepEqual(next, blueprint);
  assert.equal(next.generation, blueprint.generation);
  assert.deepEqual(proposal.semantic_diff, []);
  assert.deepEqual(proposal.new_tests, []);

  for (const candidate of [blueprint, next]) {
    const authorityFlags = Object.entries(candidate.authority_policy)
      .filter(([key]) => key.startsWith('generated_agent_can_modify_'));
    assert.equal(authorityFlags.length, 4);
    authorityFlags.forEach(([, value]) => assert.equal(value, false));
  }
});

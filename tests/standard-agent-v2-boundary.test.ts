import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';
import { generateMechanismPatchProposal } from '../scripts/lib/mechanism-patch-proposal-handler.ts';
import {
  asObjects,
  asStrings,
  readJson,
  repoRoot,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

function sha256File(relativePath: string): string {
  const bytes = fs.readFileSync(path.join(repoRoot, relativePath));
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

test('family action catalog v2 uses only OPL-hosted stages or exact domain handlers', () => {
  const catalog = readJson('contracts/action_catalog.json');
  const frameworkRoot = fs.realpathSync(path.join(repoRoot, 'node_modules', 'opl-framework'));
  const schemaPath = path.join(
    frameworkRoot,
    'contracts',
    'family-orchestration',
    'family-action-catalog.schema.json',
  );
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as JsonObject;
  const validation = validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaPath,
  }, catalog);

  assert.equal(catalog.version, 'family-action-catalog.v2');
  assert.equal(validation.ok, true, JSON.stringify(validation));
  assert.doesNotMatch(JSON.stringify(catalog), /source_command|handler_id|entry_command_template/);

  const actions = asObjects(catalog.actions);
  const stageActions = actions.filter((action) => action.execution_binding.kind === 'stage_binding');
  const handlerActions = actions.filter((action) => action.execution_binding.kind === 'handler_ref');
  assert.equal(stageActions.length, 4);
  assert.equal(handlerActions.length, 1);
  stageActions.forEach((action) => {
    assert.deepEqual(action.execution_binding, {
      kind: 'stage_binding',
      stage_manifest_ref: 'agent/stages/manifest.json',
    });
    assert.ok(action.stage_route);
  });
  assert.equal(fs.existsSync(path.join(repoRoot, 'agent/stages/manifest.json')), true);
  assert.deepEqual(handlerActions[0]?.execution_binding, {
    kind: 'handler_ref',
    handler_ref: 'handler:oma.mechanism-patch-proposal-authorizer',
  });
  assert.equal(Object.hasOwn(handlerActions[0]!, 'stage_route'), false);
});

test('mechanism proposal handler resolves exactly and remains a pure authority function', () => {
  const registry = readJson('contracts/domain_handler_registry.json');
  const handlers = asObjects(registry.handlers);
  assert.equal(registry.version, 'domain-handler-registry.v1');
  assert.deepEqual(handlers, [{
    handler_id: 'oma.mechanism-patch-proposal-authorizer',
    binding: {
      kind: 'typescript_export',
      file: 'scripts/lib/mechanism-patch-proposal-handler.ts',
      export: 'generateMechanismPatchProposal',
    },
  }]);

  const input = {
    mechanism_ref: 'mechanism:oma/current',
    segment_run_ref: 'segment-run:oma/1',
    evidence_delta_ref: 'evidence-delta:oma/1',
    next_mechanism_candidate_ref: 'mechanism-candidate:oma/2',
    observe_refs: ['evidence:observe/b', 'evidence:observe/a'],
  };
  const inputSnapshot = structuredClone(input);
  const proposal = generateMechanismPatchProposal(input);
  assert.deepEqual(input, inputSnapshot);
  assert.equal(proposal.status, 'proposal_recorded_requires_explicit_gate');
  assert.deepEqual(proposal.observe.source_refs, [
    'evidence:observe/a',
    'evidence:observe/b',
    'segment-run:oma/1',
  ]);
  assert.equal(proposal.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(proposal.authority_boundary.can_promote_default_agent_without_gate, false);

  const source = fs.readFileSync(
    path.join(repoRoot, 'scripts/lib/mechanism-patch-proposal-handler.ts'),
    'utf8',
  );
  assert.doesNotMatch(source, /node:fs|node:child_process|\bfetch\s*\(|sqlite|writeFile|spawn/);
});

test('minimal authority refs, source audit and generated surface ids have one exact truth', () => {
  const pack = readJson('contracts/pack_compiler_input.json');
  const authorityFunctions = readJson(
    'runtime/authority_functions/meta-agent-authority-functions.parts/functions.json',
  );
  const audit = readJson('contracts/source_closure_audit.json');
  const catalog = readJson('contracts/action_catalog.json');

  assert.deepEqual(asStrings(pack.minimal_authority_functions), [
    'mechanism_patch_proposal_authorizer',
  ]);
  assert.deepEqual(asObjects(authorityFunctions).map((entry) => entry.function_id), [
    'mechanism_patch_proposal_authorizer',
  ]);

  const auditEntries = asObjects(audit.entries);
  assert.equal(auditEntries.length, 4);
  auditEntries.forEach((entry) => {
    assert.equal(entry.role, 'developer_tool');
    assert.equal(entry.source_digest, sha256File(String(entry.file)));
    assert.equal(/[*?{}[\]]/.test(String(entry.file)), false);
  });
  assert.equal(
    auditEntries.some((entry) => entry.file === 'scripts/takeover-agent.ts'),
    false,
    'the in-memory takeover request producer must not carry a stale filesystem-write authorization',
  );
  const spawnEntry = auditEntries.find((entry) => entry.allowed_effects.includes('process_spawn'));
  assert.deepEqual(spawnEntry?.allowed_targets, ['git']);

  const surfaceIds: string[] = [];
  asObjects(catalog.actions).forEach((action) => {
    const surfaces = action.supported_surfaces as JsonObject;
    [
      ['mcp', 'tool_name'],
      ['skill', 'command_contract_id'],
      ['product_entry', 'action_key'],
      ['openai', 'tool_name'],
      ['ai_sdk', 'tool_name'],
    ].forEach(([surface, field]) => {
      const value = (surfaces[surface] as JsonObject | undefined)?.[field];
      if (typeof value === 'string') surfaceIds.push(`${surface}:${value}`);
    });
  });
  assert.equal(new Set(surfaceIds).size, surfaceIds.length);
});

test('OMA package lifecycle delegates only to the current OPL Packages surface', () => {
  const manifest = readJson('contracts/opl_agent_package_manifest.json');
  assert.deepEqual(manifest.lifecycle, {
    owner: 'opl_packages',
    module_id: 'oplmetaagent',
    commands: {
      install: 'opl packages install oma',
      update: 'opl packages update oma',
      uninstall: 'opl packages uninstall oma',
    },
    repo_local_installer_allowed: false,
    repo_local_marketplace_mutation_allowed: false,
    repo_local_user_symlink_mutation_allowed: false,
  });
  assert.doesNotMatch(JSON.stringify(manifest), /opl_connect|opl connect (?:install|update|remove)/);
});

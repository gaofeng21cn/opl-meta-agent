import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const base = fileURLToPath(new URL('../contracts/fixtures/agent-apps/', import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));
const content = new Map(fs.readdirSync(path.join(base, 'content')).map((name) => {
  const bytes = fs.readFileSync(path.join(base, 'content', name));
  return [`opl-content://sha256/${crypto.createHash('sha256').update(bytes).digest('hex')}`, bytes];
}));

test('two owner designs resolve exact shared content without duplicating private knowledge', () => {
  const photo = read('photo/agent-blueprint.json');
  const relay = read('relay/agent-blueprint.json');
  assert.deepEqual(photo.content_refs.skill_refs, relay.content_refs.skill_refs);
  assert.equal(photo.actions[0].output_schema_ref, relay.actions[0].output_schema_ref);
  for (const name of ['photo', 'relay']) {
    const blueprint = read(`${name}/agent-blueprint.json`);
    const request = read(`${name}/design-request.json`);
    assert.equal(blueprint.target_agent_id, request.target_agent_id);
    for (const refs of Object.values(blueprint.content_refs)) {
      for (const ref of refs) assert.ok(content.has(ref), `missing exact bytes: ${ref}`);
    }
    assert.deepEqual(blueprint.content_refs.knowledge_refs, []);
    assert.deepEqual(blueprint.memory_policy.knowledge_requirements[0].source_modes, ['workspace', 'external']);
    assert.equal(blueprint.memory_policy.knowledge_requirements[0].action_critical, true);
    assert.deepEqual(blueprint.authority_policy.permission_refs, request.constraints.permission_refs);
  }
});

test('reference tool content retains the real owners and conditional inputs', () => {
  const photo = read('content/photo-tools.json');
  const relay = read('content/relay-tools.json');
  assert.deepEqual(photo.action_input_fields, ['plan_dir', 'plan_revision', 'request_id']);
  assert.equal(photo.connection_requirement.required, false);
  assert.equal(relay.connection_requirement.consumer_package_id, 'opl-relay');
  assert.deepEqual(relay.connection_requirement.capability_ids, ['mailbox.read', 'draft.create']);
  assert.deepEqual(relay.save_input_fields, ['account_id', 'draft_id', 'revision', 'body', 'attachment_ids']);
  assert.equal(relay.actions.includes('relay_send'), false);
});

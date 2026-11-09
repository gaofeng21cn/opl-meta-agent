import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// This is an explicit cross-owner check, separate from OMA's dependency-free tests.
// Framework remains the schema, compiler and generated action authority.
const framework = process.env.OPL_FRAMEWORK_ROOT;
if (!framework) throw new Error('Set OPL_FRAMEWORK_ROOT to the Framework checkout with knowledge-requirement support.');
const load = (relative) => import(pathToFileURL(path.join(framework, relative)).href);
const { validateAgentBlueprint, validateDesignRequest, foundryContentDigest } = await load('src/authority/evolution/index.ts');
const { ContentAddressedCandidateCompiler, FileFoundryContentStore } = await load('src/authority/evidence/foundry-persistent-adapters.ts');
const { compileStandardAgentStageManifest } = await load('src/authority/packages/standard-agent-stage-manifest.ts');
const base = fileURLToPath(new URL('../../contracts/fixtures/agent-apps/', import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));

for (const name of ['photo', 'relay']) {
  test(`${name} owner design is validated and materialized by the real Framework compiler`, async (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), `oma-agent-app-${name}-`));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const store = new FileFoundryContentStore(root);
    for (const entry of fs.readdirSync(path.join(base, 'content'))) {
      store.put(fs.readFileSync(path.join(base, 'content', entry)));
    }
    const request = validateDesignRequest(read(`${name}/design-request.json`));
    const blueprint = validateAgentBlueprint(read(`${name}/agent-blueprint.json`));
    assert.equal(blueprint.design_request_digest, foundryContentDigest(request));
    const compiler = new ContentAddressedCandidateCompiler(root);
    const candidate = await compiler.materialize({
      run_id: `agent-app-example:${name}`,
      blueprint,
      blueprint_digest: foundryContentDigest(blueprint),
    });
    const directory = compiler.candidateDirectory(candidate.candidate_digest);
    const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'contracts/action_catalog.json'), 'utf8'));
    const action = catalog.actions.find((entry) => entry.action_id === 'review-owner-object');
    assert.ok(action.supported_surfaces.mcp.tool_name);
    assert.equal(action.execution_binding.kind, 'stage_binding');
    assert.deepEqual(action.stage_route.terminal_stage_refs, ['owner-review']);
    assert.ok(action.required_fields.includes('request_id'));
    const compiled = compileStandardAgentStageManifest(directory);
    assert.equal(compiled.source_binding.canonical_agent_id, blueprint.target_agent_id);
    const memory = JSON.parse(fs.readFileSync(path.join(directory, 'contracts/memory_policy.json'), 'utf8'));
    assert.deepEqual(memory.knowledge_requirements, blueprint.memory_policy.knowledge_requirements);
    const lock = JSON.parse(fs.readFileSync(path.join(directory, 'contracts/resource-lock.json'), 'utf8'));
    const tool = lock.resources.find((entry) => entry.kind === 'tool');
    assert.ok(tool);
    const ownerTools = JSON.parse(fs.readFileSync(path.join(directory, tool.pack_path), 'utf8'));
    assert.equal(ownerTools.owner, blueprint.target_agent_id);
    const resultSchema = JSON.parse(fs.readFileSync(path.join(directory, action.output_schema_ref), 'utf8'));
    assert.ok(resultSchema.required.includes('base_revision'));
    assert.ok(resultSchema.required.includes('evidence_refs'));
    const skill = lock.resources.find((entry) => entry.kind === 'skill');
    assert.equal(skill.declared_ref, blueprint.content_refs.skill_refs[0]);
    assert.deepEqual(await compiler.materialize({run_id: `reopen:${name}`, blueprint, blueprint_digest: foundryContentDigest(blueprint)}), candidate);
  });
}

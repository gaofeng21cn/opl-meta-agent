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
const installed = process.env.OPL_FRAMEWORK_MODE === 'installed';
const load = (relative) => import(pathToFileURL(path.join(framework,
  installed ? relative.replace(/^src\//, 'dist/').replace(/\.ts$/, '.js') : relative,
)).href);
const { validateAgentBlueprint, validateDesignRequest, foundryContentDigest } = await load('src/authority/evolution/index.ts');
const { ContentAddressedCandidateCompiler, FileFoundryContentStore, LedgerVersionRegistry } = await load('src/authority/evidence/foundry-persistent-adapters.ts');
const { compileStandardAgentStageManifest } = await load('src/authority/packages/standard-agent-stage-manifest.ts');
const { DefaultHostedAgentRuntimeBindingResolver, readHostedAgentRuntimeActionContracts } = await load('src/adapters/execution/hosted-agent-runtime-binding.ts');
const { HostedFoundryActivationRuntime } = await load('src/adapters/execution/foundry-activation-runtime.ts');
const { runStandardAgentAction } = await load('src/adapters/execution/standard-agent-action-runtime.ts');
const base = fileURLToPath(new URL('../../contracts/fixtures/agent-apps/', import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));

for (const name of ['photo', 'relay']) {
  test(`${name} owner design materializes, activates, is discovered and hands off through the Framework`, async (t) => {
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

    const workspace = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `oma-agent-app-workspace-${name}-`)));
    t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
    const registry = new LedgerVersionRegistry(root);
    // Synthetic qualification is confined to this disposable registry. This
    // exercises activation mechanics, not an evaluator or production acceptance.
    const { version } = await registry.register({
      target_agent_id: blueprint.target_agent_id,
      target_domain_id: blueprint.target_domain_id,
      blueprint_digest: foundryContentDigest(blueprint),
      candidate,
      evidence_digest: foundryContentDigest({ fixture: name, evidence_layer: 'synthetic' }),
      risk_tier: blueprint.risk_hint,
      qualified_at: '2026-11-09T00:00:00.000Z',
    });
    const resolver = new DefaultHostedAgentRuntimeBindingResolver({ root_override: root });
    const runtime = new HostedFoundryActivationRuntime({
      resolver, candidate_directory: (digest) => compiler.candidateDirectory(digest), workspace_root: workspace,
    });
    const preflight = await runtime.preflight({
      transaction_kind: 'activate', version, expected_activation_revision: 0,
    });
    const transaction = await registry.compareAndSwapActivation({
      target_agent_id: blueprint.target_agent_id, target_domain_id: blueprint.target_domain_id,
      expected_revision: 0, version_digest: version.version_digest,
      occurred_at: '2026-11-09T00:00:01.000Z', authority_receipt_ref: null,
      runtime_binding_verification: {
        ...Object.fromEntries(['transaction_kind', 'target_agent_id', 'target_domain_id',
          'version_id', 'version_digest', 'candidate_digest', 'candidate_ref',
          'expected_activation_revision', 'preflight_ref', 'runtime_binding_ref']
          .map((key) => [key, preflight[key]])),
        surface_kind: 'opl_foundry_activation_runtime_binding_verification',
        version: 'opl-foundry-activation-runtime-binding-verification.v1', verification_phase: 'pre_commit',
      },
    });
    assert.equal(transaction.next_revision, 1);
    const bound = await resolver.resolve({ domainId: blueprint.target_agent_id, workspaceRoot: workspace });
    assert.equal(bound.provenance.source_kind, 'foundry_active_agent_version');
    assert.equal(bound.provenance.active_version_digest, version.version_digest);
    const discovered = readHostedAgentRuntimeActionContracts(bound.checkout_root, [blueprint.target_domain_id]);
    assert.ok(discovered.catalog.actions.some((entry) => entry.action_id === action.action_id));
    const payload = name === 'photo'
      ? { workspace_root: workspace, request_id: 'synthetic-photo', plan_dir: path.join(workspace, 'plan'), plan_revision: `sha256:${'a'.repeat(64)}` }
      : { workspace_root: workspace, request_id: 'synthetic-relay', connection_id: 'synthetic-mailbox', storage_ref: 'synthetic-message', account_id: 'synthetic-account', draft_id: 'synthetic-draft', revision: 'synthetic-r1' };
    let starts = 0;
    const dependencies = {
      foundryRootOverride: root,
      recordLedger: (input) => ({ ledger_entry: {run_id: input.runId, status: input.status}, recorded_event: {event_type: 'standard_agent_action_run_recorded'} }),
      runStageRuntime: async (args) => {
        if (args[0] === 'stage-run') return {family_runtime_stage_run_query: {workflow_id: args[2], status: 'human_gate'}};
        starts += 1;
        assert.deepEqual(args.slice(0, 2), ['attempt', 'create']);
        const locator = JSON.parse(args[args.indexOf('--workspace-locator') + 1]);
        assert.equal(locator.package_use_binding.root_package.content_digest, candidate.candidate_digest);
        const frozenInput = JSON.parse(fs.readFileSync(fileURLToPath(args[args.indexOf('--input-artifact-ref') + 1]), 'utf8'));
        assert.deepEqual(frozenInput, payload);
        const ownerHandoff = {owner: ownerTools.owner, request: frozenInput, business_action_dispatched: false};
        return {
          family_runtime_stage_run: {stage_run_input: {workflow_id: `synthetic-${name}`}, blocked_reason: null},
          synthetic_owner_handoff: ownerHandoff,
        };
      },
    };
    const invocation = await runStandardAgentAction({
      domainId: blueprint.target_agent_id, actionId: action.action_id,
      workspaceRoot: workspace, payload, runId: `acceptance-${name}`,
    }, dependencies);
    const replay = await runStandardAgentAction({
      domainId: blueprint.target_domain_id, actionId: action.action_id,
      workspaceRoot: workspace, payload, runId: `acceptance-${name}`,
    }, dependencies);
    assert.equal(starts, 1, 'reopening must query the existing StageRun rather than dispatch again');
    assert.equal(invocation.standard_agent_action_run.hosted_runtime_binding.active_version_digest, version.version_digest);
    assert.equal(replay.standard_agent_action_run.hosted_runtime_binding_ref, invocation.standard_agent_action_run.hosted_runtime_binding_ref);
    assert.equal(replay.standard_agent_action_run.status, 'human_gate');
    assert.deepEqual(invocation.standard_agent_action_run.temporal_stage_run.synthetic_owner_handoff.request, payload);
  });
}

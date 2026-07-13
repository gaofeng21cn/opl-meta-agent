import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as Record<string, any>;

test('OMA declares isolated Stage Review for every AI producer', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const profile = readJson('contracts/stage_quality_cycle_policy.json');
  assert.equal(manifest.quality_governance_profile_ref, 'contracts/opl-framework/official-knowledge-deliverable-quality-profile.json');
  assert.equal(manifest.meta_review_policy_ref, 'contracts/stage_quality_cycle_policy.json#/meta_review_policy');
  assert.equal(profile.framework_contract_ref, 'contracts/opl-framework/stage-quality-cycle-contract.json');
  const attemptContract = profile.review_attempt_contract;
  assert.deepEqual(attemptContract.attempt_roles, ['producer', 'reviewer', 'repairer', 're_reviewer']);
  assert.equal(attemptContract.new_stage_attempt_per_role, true);
  assert.equal(attemptContract.new_execution_session_per_attempt, true);
  assert.equal(attemptContract.no_context_inheritance, true);
  assert.equal(attemptContract.same_thread_resume_role, 'protocol_closeout_resume');
  assert.equal(attemptContract.same_thread_resume_counts_as_review, false);
  assert.equal(attemptContract.same_thread_resume_consumes_quality_budget, false);
  assert.deepEqual(Object.keys(attemptContract.role_prompt_refs).sort(), ['producer', 're_reviewer', 'repairer', 'reviewer']);
  assert.deepEqual(attemptContract.required_role_output_ref_fields.reviewer, [
    'finding_refs', 'repair_map_refs', 'reviewed_artifact_hashes',
  ]);
  assert.ok(attemptContract.required_role_output_ref_fields.re_reviewer.includes('re_review_closure_refs'));

  const stages = new Map<string, Record<string, any>>(
    manifest.stages.map((stage: Record<string, any>) => [String(stage.stage_id), stage]),
  );
  assert.deepEqual(new Set(Object.keys(profile.stages)), new Set(stages.keys()));
  Object.entries(profile.stages).forEach(([stageId, value]) => {
    const policy = value as Record<string, any>;
    const stage = stages.get(stageId);
    assert.ok(stage);
    assert.deepEqual(Object.keys(policy).sort(), [
      'surface_kind', 'version', 'enabled', 'stage_prompt_ref', 'role_prompt_refs',
      'quality_rubric_refs', 'in_thread_refinement', 'formal_review', 'budget_exhaustion',
      'attempt_boundary',
    ].sort());
    assert.equal(policy.enabled, true);
    assert.deepEqual(Object.keys(policy.role_prompt_refs).sort(), ['producer', 're_reviewer', 'repairer', 'reviewer']);
    assert.equal(stage.stage_quality_cycle_policy_ref, `contracts/stage_quality_cycle_policy.json#/stages/${stageId}`);
    assert.equal(policy.in_thread_refinement.authoritative, false);
    assert.equal(policy.stage_prompt_ref, stage.prompt_ref);
    assert.deepEqual(policy.quality_rubric_refs, stage.quality_gate_refs);
    assert.equal(policy.formal_review.context_isolation_required, true);
    assert.deepEqual(Object.keys(policy.attempt_boundary).sort(), [
      'inherits_stage_goal_scope_authority', 'role_overlay_may_only_narrow',
      'controller_creates_next_attempt', 'attempt_is_not_sub_stage',
    ].sort());
    Object.values(policy.attempt_boundary).forEach((flag) => assert.equal(flag, true));
    if (!['optimizer-iteration', 'baseline-delivery'].includes(stageId)) {
      assert.equal(policy.formal_review.required, true);
      assert.equal(policy.formal_review.max_repair_rounds, 3);
    }
  });
});

test('optimizer-iteration is the isolated Agent Design Meta Review on the baseline route', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const profile = readJson('contracts/stage_quality_cycle_policy.json');
  const catalog = readJson('contracts/action_catalog.json');
  const stages = new Map<string, Record<string, any>>(
    manifest.stages.map((stage: Record<string, any>) => [String(stage.stage_id), stage]),
  );
  const baseline = catalog.actions.find((action: Record<string, any>) => action.action_id === 'build-agent-baseline');
  const meta = profile.meta_review_policy;

  const optimizer = stages.get('optimizer-iteration');
  const baselineRun = stages.get('baseline-run');
  assert.ok(optimizer);
  assert.ok(baselineRun);
  assert.equal(optimizer.stage_role, 'cross_stage_meta_review');
  assert.deepEqual(baselineRun.next_stage_refs, ['optimizer-iteration']);
  assert.deepEqual(baseline.stage_route.required_stage_refs.slice(-3), [
    'baseline-run',
    'optimizer-iteration',
    'baseline-delivery',
  ]);
  assert.equal(meta.stage_id, 'optimizer-iteration');
  assert.equal(meta.attempt_role, 'producer');
  assert.equal(meta.stage_prompt_ref, 'agent/prompts/optimizer-iteration.md');
  assert.equal(meta.independent_stage_run_required, true);
  assert.equal(meta.new_execution_session_required, true);
  assert.equal(meta.no_context_inheritance, true);
  assert.equal(meta.max_route_back_rounds, 3);
  assert.ok(meta.defect_owner_route_back.stage_refs.includes('stage-decomposition'));
  assert.ok(meta.defect_owner_route_back.stage_refs.includes('agent-skeleton-build'));
});

test('quality policy does not define nested Stage, route, or owner graphs', () => {
  const profile = readJson('contracts/stage_quality_cycle_policy.json');
  const forbidden = new Set(['next_stage', 'requires', 'ensures', 'stage_route', 'sub_stage_graph', 'independent_owner']);
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => {
        assert.equal(forbidden.has(key), false, `forbidden quality policy field: ${key}`);
        walk(child);
      });
    }
  };
  walk(profile);
});

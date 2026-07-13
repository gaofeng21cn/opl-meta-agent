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
  assert.equal(
    profile.route_selection_contract_ref,
    'contracts/opl-framework/stage-quality-cycle-contract.json#/cross_stage_route_selection',
  );
  const attemptContract = profile.review_attempt_contract;
  assert.deepEqual(attemptContract.attempt_roles, ['producer', 'reviewer', 'repairer', 're_reviewer']);
  assert.equal(attemptContract.new_stage_attempt_per_role, true);
  assert.equal(attemptContract.new_execution_session_per_attempt, true);
  assert.equal(attemptContract.no_context_inheritance, true);
  assert.equal(attemptContract.same_thread_resume_role, 'protocol_closeout_resume');
  assert.equal(attemptContract.same_thread_resume_counts_as_review, false);
  assert.equal(attemptContract.same_thread_resume_consumes_quality_budget, false);
  assert.deepEqual(attemptContract.attempt_output_contract, {
    envelope_path: 'route_impact.stage_quality_cycle',
    outcome_field: 'outcome',
    outcome_required_for_roles: ['reviewer', 're_reviewer'],
    outcome_values: ['pass', 'repair_required', 'quality_debt', 'blocked', 'human_gate'],
    attempts_must_not_emit_receipt_verdict: true,
    receipt_materializer_owner: 'opl_stage_run_controller',
    review_receipt_verdict_mapping: {
      pass: 'pass',
      repair_required: 'repair_required',
      quality_debt: 'quality_debt',
      blocked: 'hard_stop',
      human_gate: 'hard_stop',
    },
  });
  assert.deepEqual(Object.keys(attemptContract.role_prompt_refs).sort(), ['producer', 're_reviewer', 'repairer', 'reviewer']);
  assert.deepEqual(attemptContract.required_role_output_ref_fields.reviewer, [
    'route_impact.stage_quality_cycle.outcome', 'finding_refs', 'evidence_refs',
    'acceptance_criteria_refs', 'reviewed_artifact_hashes',
  ]);
  assert.deepEqual(attemptContract.required_role_output_ref_fields.repairer, [
    'repair_map_refs', 'changed_artifact_refs', 'changed_artifact_hashes', 'lineage_refs',
  ]);
  assert.deepEqual(attemptContract.required_role_output_ref_fields.re_reviewer, [
    'route_impact.stage_quality_cycle.outcome', 're_review_closure_refs', 'evidence_refs',
    'remaining_quality_debt_refs', 'reviewed_artifact_hashes',
  ]);
  assert.equal(attemptContract.required_role_output_ref_fields.reviewer.includes('verdict'), false);
  assert.equal(attemptContract.required_role_output_ref_fields.re_reviewer.includes('verdict'), false);
  assert.deepEqual(attemptContract.finding_closure_contract, {
    closure_statuses: ['closed', 'partially_closed', 'still_open'],
    next_repair_round_triggers: [
      'required_finding_not_closed', 'repair_regression', 'critical_new_finding',
    ],
    ordinary_new_suggestion_disposition: 'optional_observation_or_quality_debt_without_reopening_loop',
    reviewer_creates_repair_map: false,
    repairer_closes_findings: false,
    review_receipt_materializer: 'opl_stage_run_controller',
  });

  const rolePrompt = readFileSync('agent/prompts/stage-quality-cycle-roles.md', 'utf8');
  ['finding_id', 'severity', 'required', 'evidence_refs', 'repair_expectation'].forEach((field) => {
    assert.equal(rolePrompt.includes(`\`${field}\``), true);
  });
  assert.match(rolePrompt, /Reviewer 不产 repair map/);
  assert.match(rolePrompt, /逐 `finding_id` 返回/);
  assert.match(rolePrompt, /Repairer 不关闭 findings、不做终局 Stage 判断/);
  assert.match(rolePrompt, /route_impact\.stage_route_decision/);
  assert.match(rolePrompt, /route_impact\.stage_route_recommendation/);
  assert.match(rolePrompt, /正式 Review receipt 由 StageRunController 物化/);
  assert.match(rolePrompt, /`route_impact\.stage_quality_cycle\.outcome`/);
  ['pass', 'repair_required', 'quality_debt', 'blocked', 'human_gate'].forEach((outcome) => {
    assert.equal(rolePrompt.includes(`\`${outcome}\``), true);
  });
  assert.match(rolePrompt, /`hard_stop` 不是 Attempt outcome/);
  ['closed', 'partially_closed', 'still_open'].forEach((status) => {
    assert.equal(rolePrompt.includes(`\`${status}\``), true);
  });
  ['required_finding_not_closed', 'repair_regression', 'critical_new_finding'].forEach((trigger) => {
    assert.equal(rolePrompt.includes(`\`${trigger}\``), true);
  });
  assert.match(rolePrompt, /`optional_observation` 或 quality debt，不得重开循环/);
  ['route_back_stage_ref', 'selected_next_stage_ref', 'next_stage_ref', 'workflow_complete'].forEach((field) => {
    assert.equal(rolePrompt.includes(`\`${field}\``), true);
  });

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
  assert.equal(meta.terminal_route_output, 'route_impact.stage_route_decision');
  assert.equal(meta.terminal_route_owner, 'producer');
  assert.ok(meta.required_output_ref_fields.includes('route_decision_evidence_refs'));
  assert.equal(meta.required_output_ref_fields.includes('defect_owner_route_back_refs'), false);
  assert.ok(meta.defect_owner_route_back.stage_refs.includes('stage-decomposition'));
  assert.ok(meta.defect_owner_route_back.stage_refs.includes('agent-skeleton-build'));
  const metaPrompt = readFileSync(String(meta.stage_prompt_ref), 'utf8');
  assert.match(metaPrompt, /primary-only StageRun/);
  assert.match(metaPrompt, /`producer` 是终局 route owner/);
  assert.match(metaPrompt, /route_impact\.stage_route_decision/);
  assert.match(metaPrompt, /route_decision_evidence_refs/);
});

test('baseline-delivery remains a primary-only immutable refs handoff to the owner gate', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const profile = readJson('contracts/stage_quality_cycle_policy.json');
  const stages = new Map<string, Record<string, any>>(
    manifest.stages.map((stage: Record<string, any>) => [String(stage.stage_id), stage]),
  );
  const delivery = stages.get('baseline-delivery');
  assert.ok(delivery);

  assert.deepEqual(delivery.handoff_review_boundary, {
    artifact_effect: 'reviewed_immutable_refs_only',
    freezes_canonical_artifact_bytes: false,
    issues_quality_export_publication_or_ready_claim: false,
    downstream_owner_retains_acceptance: true,
  });
  assert.equal(delivery.trust_lane, 'human_gate');
  assert.deepEqual(delivery.ensures, ['versioned_agent_handoff_ready_for_owner_review']);
  assert.deepEqual(profile.stages['baseline-delivery'].formal_review, {
    required: false,
    risk_tier: 'high',
    review_depth: 'full',
    context_isolation_required: true,
    max_repair_rounds: 0,
  });
  assert.deepEqual(profile.stages['baseline-delivery'].in_thread_refinement, {
    allowed: true,
    authoritative: false,
  });

  const prompt = readFileSync(String(delivery.prompt_ref), 'utf8');
  assert.match(prompt, /immutable refs-only/);
  assert.match(prompt, /baseline_handoff_candidate_ref/);
  assert.match(prompt, /不签发 `baseline_delivery_receipt`/);
  assert.match(prompt, /不表示 owner acceptance/);
  assert.match(prompt, /route_impact\.stage_route_decision/);
  assert.match(prompt, /decision_kind=complete/);

  const descriptor = readJson('contracts/domain_descriptor.json');
  assert.ok(descriptor.outputs.includes('baseline_handoff_candidate_ref'));
  assert.equal(descriptor.outputs.includes('baseline_delivery_receipt_ref'), false);
  const receiptContract = readJson('contracts/owner_receipt_contract.json');
  assert.equal(receiptContract.allowed_receipt_classes.includes('baseline_delivery_receipt'), false);
  assert.deepEqual(receiptContract.retired_receipt_classes, [{
    receipt_class: 'baseline_delivery_receipt',
    replacement_output_ref: 'baseline_handoff_candidate_ref',
    historical_refs_are_provenance_only: true,
    acceptance_owner: 'target_domain_owner',
  }]);
  const appProjection = readJson('contracts/app_workbench_projection.json');
  assert.ok(appProjection.drilldown_readiness_receipt.candidate_ref_fields.includes('baseline_handoff_candidate_ref'));
  assert.equal(
    appProjection.drilldown_readiness_receipt.receipt_ref_fields.includes('baseline_delivery_receipt_ref'),
    false,
  );
  const adoption = readJson('contracts/standard-agent-principles-adoption.json');
  assert.ok(adoption.domain_authority_owner.owns.includes('baseline_handoff_candidate_refs'));
  assert.equal(adoption.domain_authority_owner.owns.includes('baseline_delivery_receipts'), false);
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

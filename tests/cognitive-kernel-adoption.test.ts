import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  readJson,
  repoRoot,
} from './support/contracts.ts';

const requiredStagePackSections = 'prompt_refs skill_refs tool_refs tool_affordance_boundary knowledge_refs quality_gate_refs strategy_refs candidate_pool_policy stage_completion_policy independent_gate_policy handoff_policy'.split(' ');

function refs(entries: any[]): Set<string> {
  return new Set(entries.map((entry) => entry.ref));
}

test('OMA pack declares advisory cognitive-kernel contracts', () => {
  const pack = readJson('contracts/pack_compiler_input.json');
  const adoption = readJson('contracts/cognitive_kernel_adoption.json');
  const golden = readJson('contracts/golden_path_profile.json');

  assert.deepEqual(pack.stage_pack_required_sections, requiredStagePackSections);
  assert.ok(pack.declarative_domain_pack.includes('tool_affordance_catalog'));
  assert.ok(pack.required_domain_pack_paths.includes('agent/tools/domain_affordances.md'));
  assert.equal(fs.existsSync(path.join(repoRoot, 'agent/tools/domain_affordances.md')), true);

  assert.deepEqual(pack.tool_refs.map((entry: any) => entry.ref), ['agent/tools/domain_affordances.md']);

  assert.equal(pack.tool_affordance_boundary.executor_autonomy.executor_can_choose_order_and_parallelism, true);
  assert.equal(pack.tool_affordance_boundary.executor_autonomy.tool_catalog_can_prescribe_tool_sequence, false);
  assert.equal(refs(pack.tool_affordance_boundary.forbidden_authority_refs).has('default_agent_promotion_without_gate'), true);

  assert.deepEqual(adoption.stage_pack_required_sections, requiredStagePackSections);
  assert.equal(adoption.adoption_policy.advisory_not_launch_hard_gate, true);
  assert.equal(adoption.authority_boundary.opl_can_claim_domain_ready, false);
  assert.equal(adoption.authority_boundary.same_attempt_self_review_can_close_quality_gate, false);

  assert.equal(golden.stage_attempt_strategy, 'cognitive_kernel_stage_internal');
  assert.ok(golden.required_closeout_refs.includes('owner_receipt_ref_or_typed_blocker_ref'));
  assert.ok(golden.forbidden_claims.includes('tool_catalog_prescribes_executor_sequence'));
});

test('OMA declarative stages bind tools and independent quality gates', () => {
  const manifest = readJson('agent/stages/manifest.json');
  const pack = readJson('contracts/pack_compiler_input.json');
  const adoption = readJson('contracts/cognitive_kernel_adoption.json');
  const adoptionBoundary = adoption.tool_affordance_boundary;

  assert.deepEqual(pack.stage_pack_required_sections, requiredStagePackSections);
  assert.equal(adoption.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');

  for (const stage of manifest.stages) {
    assert.equal(stage.prompt_ref, `agent/prompts/${stage.stage_id}.md`);
    assert.ok(stage.knowledge_refs.length > 0);
    assert.ok(stage.quality_gate_refs.length > 0);
    assert.ok(stage.allowed_action_refs.length > 0);
    assert.equal(refs(adoptionBoundary.capability_refs).has('target_agent_intent_and_repo_context_reading'), true);
  }
  assert.equal(adoptionBoundary.executor_autonomy.executor_can_choose_tools, true);
  assert.equal(adoptionBoundary.executor_autonomy.tool_catalog_can_define_cognitive_strategy, false);
  assert.equal(adoptionBoundary.executor_autonomy.tool_catalog_can_authorize_forbidden_write, false);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  assertRefsOnlyAuthorityBoundary,
} from './support/contracts.ts';

test('expert workflow pattern library is a curated refs-only workflow source, not a template catalog', () => {
  const library = readJson('contracts/expert_workflow_pattern_library.json');
  const patterns = asObjects(library.seed_patterns);
  const sourceCatalog = library.source_catalog as Record<string, Record<string, unknown>>;

  assert.equal(library.surface_kind, 'opl_meta_agent_expert_workflow_pattern_library');
  assert.equal(library.state, 'seed_library_active');
  assert.equal(library.consumption_policy.user_supplied_reference_design_source_wins, true);
  assert.equal(library.consumption_policy.profile_catalog_role, 'lower_bound_conformance_guardrail_only');
  assert.equal(library.consumption_policy.scaffold_role, 'physical_skeleton_only');
  assert.deepEqual(library.consumption_policy.oma_must_materialize_before_stage_pack, [
    'ReferenceDesignPacket or ResearchSynthesisPacket',
    'TransferMap',
    'AgentPackPlan',
    'DesignAdmissionReceipt',
  ]);
  assert.deepEqual(library.consumption_policy.oma_must_materialize_after_target_pack, [
    'AgentBuildReceipt',
  ]);
  assert.equal(library.consumption_policy.forbidden_uses.includes('do_not_treat_reporting_checklists_as_expert_workflow_stages'), true);
  assert.equal(patterns.length, 8);
  assertRefsOnlyAuthorityBoundary(library.authority_boundary, 'expertWorkflowPatternLibrary');

  const firstPattern = patterns[0];
  assert.equal(firstPattern.pattern_id, 'case_grounded_expert_decision_workflow.v1');
  assert.equal(firstPattern.display_name, 'Case-Grounded Expert Decision Workflow');
  assert.equal(asStrings(firstPattern.replaces_names).includes('clinical_decision_support_template'), true);
  assert.match(JSON.stringify(firstPattern.source_refs), /s41591-026-04494-4/);
  assert.equal(JSON.stringify(firstPattern.source_refs).includes('nature-medicine-2026-case-grounded-ai-agent'), false);
  assert.equal(sourceCatalog['doi:10.1038/s41591-026-04494-4'].role, 'workflow_source');
  assert.equal(sourceCatalog['doi:10.1136/bmj.n71'].role, 'quality_gate_source');
  assert.equal(sourceCatalog['doi:10.1136/bmj-2024-082505'].role, 'evaluation_framework');
  assert.equal(
    sourceCatalog['url:https://grants.nih.gov/policy-and-compliance/policy-topics/peer-review/simplifying-review/framework'].freshness,
    'needs_manual_review',
  );
  assert.equal(JSON.stringify(library).includes('prediction-model-applicability-review'), false);

  patterns.forEach((pattern) => {
    const patternId = String(pattern.pattern_id);
    assert.match(patternId, /_workflow\.v1$/);
    assert.doesNotMatch(patternId, /template/i);
    assert.match(String(pattern.pattern_ref), /^expert-workflow-pattern:oma\/.+\.v1$/);
    assert.ok(['S', 'A', 'B', 'C'].includes(String(pattern.authority_tier)));
    assert.ok(asStrings(pattern.source_refs).length > 0, `${patternId}.source_refs`);
    assert.ok(asStrings(pattern.applicable_constraints).length > 0, `${patternId}.applicable_constraints`);
    assert.ok(asStrings(pattern.non_transferable_constraints).length > 0, `${patternId}.non_transferable_constraints`);
    assert.ok(asStrings(pattern.quality_gate_refs).length > 0, `${patternId}.quality_gate_refs`);
    assert.ok(asStrings(pattern.forbidden_claims).length > 0, `${patternId}.forbidden_claims`);

    const steps = asObjects(pattern.transferable_workflow_steps);
    assert.ok(steps.length >= 5, `${patternId}.transferable_workflow_steps`);
    steps.forEach((step) => {
      assert.match(String(step.step_id), /^[a-z0-9_]+$/);
      assert.ok(String(step.expert_question).endsWith('?'), `${patternId}.${step.step_id}.expert_question`);
      assert.match(String(step.stage_archetype), /^[a-z0-9_]+$/);
      assert.ok(
        ['source_derived', 'internal_synthesis'].includes(String(step.provenance_kind)),
        `${patternId}.${step.step_id}.provenance_kind`,
      );
      const anchors = asStrings(step.source_anchor_refs);
      assert.ok(anchors.length > 0, `${patternId}.${step.step_id}.source_anchor_refs`);
      const matchingSources = asStrings(pattern.source_refs).filter((sourceRef) =>
        anchors.some((anchor) => anchor === sourceRef || anchor.startsWith(`${sourceRef}#`))
      );
      assert.ok(matchingSources.length > 0, `${patternId}.${step.step_id}.source_anchor_refs source match`);
      if (step.provenance_kind === 'source_derived') {
        assert.ok(
          matchingSources.some((sourceRef) => sourceCatalog[sourceRef]?.role === 'workflow_source'),
          `${patternId}.${step.step_id} source-derived step requires workflow_source`,
        );
      }
    });

    const suggestedInputs = pattern.suggested_oma_inputs;
    assert.equal(
      suggestedInputs.reference_design_pattern_packet_ref,
      pattern.pattern_ref,
      `${patternId}.suggested_oma_inputs.reference_design_pattern_packet_ref`,
    );
    assert.match(String(suggestedInputs.reference_design_pattern_note), /workflow/i);
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  assertRefsOnlyAuthorityBoundary,
} from './support/contracts.ts';
import { validateExpertWorkflowPatternLibrary } from '../scripts/lib/reference-design-workflow.ts';

test('expert workflow pattern library is a curated refs-only workflow source, not a template catalog', () => {
  const library = readJson('contracts/expert_workflow_pattern_library.json');
  const patterns = asObjects(library.seed_patterns);
  const sourceCatalog = library.source_catalog as Record<string, Record<string, unknown>>;
  const anchorCatalog = library.anchor_catalog as Record<string, Record<string, unknown>>;

  assert.equal(library.surface_kind, 'opl_meta_agent_expert_workflow_pattern_library');
  assert.equal(library.state, 'seed_library_active');
  assert.equal(library.consumption_policy.user_supplied_reference_design_source_wins, true);
  assert.equal(library.consumption_policy.profile_catalog_role, 'lower_bound_conformance_guardrail_only');
  assert.equal(library.consumption_policy.scaffold_role, 'physical_skeleton_only');
  assert.equal(library.provenance_policy.step_source_anchor_refs_abi, 'opaque_catalog_key');
  assert.equal(library.provenance_policy.source_derived_requires_verified_direct_workflow_anchor, true);
  assert.equal(library.provenance_policy.source_derived_may_include_non_direct_supporting_anchors, true);
  assert.equal(library.provenance_policy.internal_synthesis_requires_explicit_rationale, true);
  assert.equal(library.provenance_policy.internal_synthesis_cannot_claim_direct_workflow_authority, true);
  assert.equal(library.provenance_policy.materialized_pattern_preserves_authority_tier, true);
  assert.equal(library.provenance_policy.materialized_pattern_embeds_resolved_anchor_subset, true);
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
  assert.ok(anchorCatalog && typeof anchorCatalog === 'object');
  assert.equal(JSON.stringify(library).includes('prediction-model-applicability-review'), false);

  const natureDirectSteps = asObjects(firstPattern.transferable_workflow_steps)
    .filter((step) => step.provenance_kind === 'source_derived');
  assert.deepEqual(
    natureDirectSteps.map((step) => step.step_id),
    [
      'case_material_intake',
      'structured_case_extraction',
      'evidence_contextualization',
      'decision_tool_selection_and_execution',
      'case_grounded_synthesis',
    ],
  );
  assert.deepEqual(
    natureDirectSteps.map((step) => asStrings(step.source_anchor_refs)[0]),
    [
      'seed-anchor:oma/nature-hemaguide/pre-runtime-memory-construction',
      'seed-anchor:oma/nature-hemaguide/structured-extraction',
      'seed-anchor:oma/nature-hemaguide/contextual-enrichment-and-routing',
      'seed-anchor:oma/nature-hemaguide/decision-tool-selection-and-execution',
      'seed-anchor:oma/nature-hemaguide/context-aggregation-transparent-reasoning',
    ],
  );
  const guidelinePattern = patterns.find((pattern) => pattern.pattern_id === 'guideline_to_decision_workflow.v1');
  const guidelineScopeFit = asObjects(guidelinePattern?.transferable_workflow_steps)
    .find((step) => step.step_id === 'guideline_scope_fit');
  assert.equal(guidelineScopeFit?.provenance_kind, 'internal_synthesis');
  assert.ok(String(guidelineScopeFit?.synthesis_rationale).length > 0);
  const cochranePattern = patterns.find(
    (pattern) => pattern.pattern_id === 'systematic_evidence_synthesis_workflow.v1',
  );
  const cochraneStepIds = asObjects(cochranePattern?.transferable_workflow_steps).map((step) => step.step_id);
  assert.ok(cochraneStepIds.includes('review_scope_and_question_definition'));
  assert.ok(cochraneStepIds.includes('data_collection_and_extraction'));
  assert.equal(cochraneStepIds.includes('review_question_feasibility'), false);
  assert.equal(cochraneStepIds.includes('data_extraction_and_normalization'), false);
  const nsfSourceRef = 'url:https://www.nsf.gov/policies/pappg/24-1/ch-3-proposal-processing-review';
  assert.equal(Object.hasOwn(sourceCatalog, nsfSourceRef), true);
  assert.equal(Object.keys(sourceCatalog).some((sourceRef) => sourceRef.endsWith('#ch3D')), false);
  const nsfAnchors = Object.values(anchorCatalog).filter((anchor) => anchor.source_ref === nsfSourceRef);
  assert.ok(nsfAnchors.length > 0);
  assert.ok(nsfAnchors.every((anchor) => anchor.support_role === 'synthesis_basis'));
  assert.ok(nsfAnchors.every((anchor) =>
    String(anchor.section_title).includes('Section III.A Merit Review Principles and Criteria')
  ));
  const incidentPattern = patterns.find((pattern) => pattern.pattern_id === 'incident_rca_postmortem_workflow.v1');
  const incidentCloseout = asObjects(incidentPattern?.transferable_workflow_steps)
    .find((step) => step.step_id === 'owner_followup_and_closeout_gate');
  assert.equal(incidentCloseout?.provenance_kind, 'internal_synthesis');
  assert.ok(String(incidentCloseout?.synthesis_rationale).length > 0);

  const usedAnchorRefs = new Set<string>();

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
      assert.ok(
        anchors.every((anchorRef) => anchorRef.startsWith('seed-anchor:oma/')),
        `${patternId}.${step.step_id}.source_anchor_refs use opaque catalog keys`,
      );
      const resolvedAnchors = anchors.map((anchorRef) => {
        usedAnchorRefs.add(anchorRef);
        const anchor = anchorCatalog[anchorRef];
        assert.ok(anchor, `${patternId}.${step.step_id}.${anchorRef} resolves`);
        assert.ok(asStrings(pattern.source_refs).includes(String(anchor.source_ref)));
        assert.equal(typeof anchor.stable_locator, 'string');
        assert.ok(String(anchor.stable_locator).length > 0);
        assert.equal(typeof anchor.section_title, 'string');
        assert.ok(String(anchor.section_title).length > 0);
        assert.equal(typeof anchor.selector, 'string');
        assert.ok(String(anchor.selector).length > 0);
        assert.ok(['direct_workflow', 'synthesis_basis', 'quality_gate', 'evaluation_constraint'].includes(
          String(anchor.support_role),
        ));
        assert.ok(['verified', 'needs_manual_review', 'stale', 'unknown'].includes(
          String(anchor.verification_status),
        ));
        assert.equal(
          anchor.source_version_or_fingerprint,
          sourceCatalog[String(anchor.source_ref)].version_or_year,
        );
        return anchor;
      });
      if (step.provenance_kind === 'source_derived') {
        assert.ok(
          resolvedAnchors.some((anchor) =>
            anchor.support_role === 'direct_workflow'
            && anchor.verification_status === 'verified'
            && sourceCatalog[String(anchor.source_ref)]?.role === 'workflow_source'
          ),
          `${patternId}.${step.step_id} source-derived step requires verified direct_workflow anchor`,
        );
        assert.ok(
          resolvedAnchors.every((anchor) => anchor.support_role === 'direct_workflow'
            || ['synthesis_basis', 'quality_gate', 'evaluation_constraint'].includes(
              String(anchor.support_role),
            )),
          `${patternId}.${step.step_id} may add only declared supporting anchors`,
        );
      } else {
        assert.equal(typeof step.synthesis_rationale, 'string');
        assert.ok(String(step.synthesis_rationale).trim().length > 0);
        assert.equal(resolvedAnchors.some((anchor) => anchor.support_role === 'direct_workflow'), false);
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

  assert.deepEqual([...usedAnchorRefs].sort(), Object.keys(anchorCatalog).sort());
});

test('expert workflow resolver fails closed for invalid seed provenance', () => {
  const pristine = readJson('contracts/expert_workflow_pattern_library.json');
  const firstPattern = asObjects(pristine.seed_patterns)[0];
  const firstStep = asObjects(firstPattern.transferable_workflow_steps)[0];
  const directAnchorRef = asStrings(firstStep.source_anchor_refs)[0];
  const internalStepIndex = asObjects(firstPattern.transferable_workflow_steps)
    .findIndex((step) => step.provenance_kind === 'internal_synthesis');
  assert.ok(internalStepIndex >= 0);
  const internalAnchorRef = asStrings(
    asObjects(firstPattern.transferable_workflow_steps)[internalStepIndex].source_anchor_refs,
  )[0];

  const cases: Array<{
    name: string;
    mutate: (library: Record<string, any>) => void;
    error: RegExp;
  }> = [
    {
      name: 'unresolved anchor',
      mutate: (library) => {
        library.seed_patterns[0].transferable_workflow_steps[0].source_anchor_refs[0] =
          'seed-anchor:oma/missing/anchor';
      },
      error: /source_anchor_unresolved/,
    },
    {
      name: 'anchor source mismatch',
      mutate: (library) => {
        library.seed_patterns[0].source_refs = ['doi:10.1136/bmj.i2016'];
      },
      error: /source_anchor_source_mismatch/,
    },
    {
      name: 'direct workflow source role mismatch',
      mutate: (library) => {
        library.source_catalog['doi:10.1038/s41591-026-04494-4'].role = 'evaluation_framework';
      },
      error: /direct_workflow_source_role_mismatch/,
    },
    {
      name: 'stale direct workflow anchor',
      mutate: (library) => {
        library.anchor_catalog[directAnchorRef].verification_status = 'stale';
      },
      error: /direct_workflow_anchor_not_verified/,
    },
    {
      name: 'unknown direct workflow anchor',
      mutate: (library) => {
        library.anchor_catalog[directAnchorRef].verification_status = 'unknown';
      },
      error: /direct_workflow_anchor_not_verified/,
    },
    {
      name: 'source-derived step without direct workflow authority',
      mutate: (library) => {
        library.anchor_catalog[directAnchorRef].support_role = 'synthesis_basis';
      },
      error: /source_derived_direct_workflow_anchor_missing/,
    },
    {
      name: 'anchor version mismatch',
      mutate: (library) => {
        library.anchor_catalog[directAnchorRef].source_version_or_fingerprint = 'stale-version';
      },
      error: /source_anchor_version_mismatch/,
    },
    {
      name: 'internal synthesis without rationale',
      mutate: (library) => {
        delete library.seed_patterns[0].transferable_workflow_steps[internalStepIndex].synthesis_rationale;
      },
      error: /synthesis_rationale_missing/,
    },
    {
      name: 'internal synthesis claiming direct workflow authority',
      mutate: (library) => {
        library.anchor_catalog[internalAnchorRef].support_role = 'direct_workflow';
      },
      error: /internal_synthesis_direct_workflow_anchor_forbidden/,
    },
  ];

  cases.forEach(({ name, mutate, error }) => {
    const library = structuredClone(pristine) as Record<string, any>;
    mutate(library);
    assert.throws(() => validateExpertWorkflowPatternLibrary(library), error, name);
  });
});

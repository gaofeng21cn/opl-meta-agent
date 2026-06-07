import test from 'node:test';
import {
  assert,
  fs,
  os,
  path,
  oplBin,
  writeJson,
  readJson,
  runImproveArgs,
  assertTargetPatchLoopMachineRefs,
  writeAiReviewerEvaluation,
  buildBlockedMedicalManuscriptSuite,
  writeMedicalTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';
import type { JsonObject } from './support/external-suite-fixtures.ts';

test('external blocked Agent Lab suite becomes a MAS developer patch work order', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    const reviewerEvaluation = writeAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'manual-review:gpt-5.5/high-quality-medical-paper-style',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.surface_kind, 'opl_meta_agent_external_suite_self_evolution_result');
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    assert.equal(payload.target_agent.domain_id, 'med-autoscience');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.developer_patch_work_order.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(payload.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(payload.opl_agent_lab.suite_result.status, 'blocked');
    assert.equal(payload.opl_agent_lab.suite_result.summary.forbidden_authority_flag_count, 0);

    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.equal(candidate.feedback_ref, 'manual-review:gpt-5.5/high-quality-medical-paper-style');
    assert.equal(candidate.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.equal(candidate.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.deepEqual(candidate.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.deepEqual(candidate.ai_reviewer_evidence.source_refs, reviewerEvaluation.source_refs);
    assert.deepEqual(candidate.ai_reviewer_evidence.direct_evidence_refs, reviewerEvaluation.direct_evidence_refs);
    assert.equal(candidate.ai_reviewer_independence.no_shared_context, true);
    assert.equal(candidate.ai_reviewer_independence.independent_attempt, true);
    assert.equal(candidate.ai_reviewer_independence.execution_attempt_ref, reviewerEvaluation.execution_attempt_ref);
    assert.equal(candidate.ai_reviewer_independence.review_attempt_ref, reviewerEvaluation.review_attempt_ref);
    assert.equal(candidate.review_provenance.run_ref, reviewerEvaluation.run_ref);
    assert.ok(candidate.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.ok(candidate.proposed_change_refs.includes('skill_ref:medical-research-write'));
    assert.ok(candidate.proposed_change_refs.includes('rubric_ref:ai_reviewer/high_quality_medical_manuscript'));
    assert.ok(candidate.proposed_change_refs.includes('prompt_ref:ai_reviewer_medical_prose_quality_review'));
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/survey_weighting_or_unweighted_framing',
      ),
    );
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/calibration_and_risk_distribution_figures',
      ),
    );
    assert.ok(candidate.external_learning_refs.includes('external-source:equator-network/tripod-reporting-guideline'));
    assert.equal(candidate.traceability_status, 'gap_to_patch_refs_mapped');
    const hdlTrace = (candidate.patch_traceability_matrix as JsonObject[]).find((item) => item.gap_token === 'hdl');
    assert.ok(hdlTrace);
    assert.ok(
      hdlTrace.required_patch_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.ok(hdlTrace.editable_surface_refs.includes('quality_contract_ref'));
    assert.ok(
      hdlTrace.target_repo_file_hints.includes(
        'src/med_autoscience/policies/medical_reporting_checklist.py',
      ),
    );
    assert.ok(
      hdlTrace.ai_reviewer_suggestions.includes(
        'Map HDL unit harmonization to the prediction model quality contract and pre-draft reporting stage policy.',
      ),
    );
    assert.ok(hdlTrace.ai_reviewer_source_refs.includes('rubric-gap:mas/002/hdl-harmonization-and-sensitivity'));
    assert.ok(hdlTrace.failure_evidence.includes('rubric-gap:mas/002/hdl-harmonization-and-sensitivity'));
    assert.match(hdlTrace.root_cause, /hdl/i);
    assert.ok(
      hdlTrace.targeted_fix.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.equal(hdlTrace.predicted_impact, reviewerEvaluation.predicted_impact);

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.ok(mechanism.editable_surfaces.includes('target_agent_stage_policy_ref'));
    assert.ok(mechanism.edit.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.ok(mechanism.observe.source_refs.includes(reviewerEvaluationPath));
    assert.ok(mechanism.diagnose.source_refs.includes('artifacts/publication_eval/latest.json'));
    assert.equal(mechanism.repeat_budget.max_attempts, 2);
    assert.equal(mechanism.repeat_budget.remaining_attempts, 1);
    assert.ok(mechanism.dead_letter_refs.includes(`dead-letter:opl-meta-agent/med-autoscience/${mechanism.proposal_id}`));
    assert.ok(mechanism.escalation_refs.includes('escalation:target-owner/med-autoscience/external-suite-self-evolution'));
    assert.equal(mechanism.next_allowed_action, 'delegate_to_opl_work_order_execute_after_currentness_gate');

    const receipt = readJson(payload.artifacts.meta_agent_improvement_receipt_path);
    assert.equal(receipt.receipt_class, 'external_suite_quality_failure_self_evolution_receipt');
    assert.equal(receipt.acceptance_gates.target_domain_truth_authority_preserved, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_critique_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_suggestions_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_source_refs_valid, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_direct_evidence_refs_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_no_shared_context, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_independent_attempt_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_attempt_refs_distinct, true);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.surface_kind, 'opl_meta_agent_developer_patch_work_order');
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch');
    assert.deepEqual(workOrder.work_order_currentness, {
      target_agent_id: 'med-autoscience',
      eval_result_ref: workOrder.source_agent_lab_result_ref,
      work_order_ref: workOrder.work_order_id,
      owner_route_ref: 'target-agent-owner:med-autoscience',
      provider_owner_route_index_evidence: {
        provider: 'opl_work_order_execute',
        owner_route_index_ref: `owner-route-index:med-autoscience/${workOrder.work_order_id}`,
        owner_route_ledger_ref: `owner-route-ledger:med-autoscience/${workOrder.work_order_id}`,
        stage_attempt_ledger_ref: `stage-attempt-ledger:med-autoscience/${workOrder.work_order_id}`,
        route_binding_ref: `route-binding:med-autoscience/${workOrder.source_agent_lab_result_ref}/${workOrder.work_order_id}`,
        target_eval_work_order_owner_route_tuple:
          `med-autoscience|${workOrder.source_agent_lab_result_ref}|${workOrder.work_order_id}|target-agent-owner:med-autoscience`,
        derived_from_current_opl_route_ledger: true,
        fail_closed_without_route_or_ledger_proof: true,
      },
    });
    assert.deepEqual(workOrder.target_progress_accounting, {
      progress_delta_classification: 'mixed',
      deliverable_progress_delta: {
        count: workOrder.proposed_change_refs.length,
        refs: workOrder.proposed_change_refs,
        domain_alias: 'target_agent_substantive_delta',
      },
      platform_repair_delta: {
        count: 7,
        refs: [
          workOrder.machine_closeout_refs.target_runtime_read_model_consumption_ref,
          workOrder.machine_closeout_refs.workspace_environment_proof_ref,
          workOrder.machine_closeout_refs.no_forbidden_write_proof_ref,
          workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
          workOrder.machine_closeout_refs.patch_absorption_ref,
          workOrder.machine_closeout_refs.worktree_cleanup_ref,
          workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref,
        ],
        domain_alias: 'platform_interface_repair_delta',
      },
      excluded_from_substantive_deliverable_progress_refs: [],
      non_substantive_progress_ref_kinds: [
        'platform_interface_repair',
        'closeout_plumbing',
        'patch_absorption',
        'worktree_cleanup',
        'agent_lab_re_evaluation',
        'currentness_repair',
        'refs_only_ledger_work',
      ],
      accounting_policy: 'deliverable_delta_is_not_closed_by_platform_interface_repair',
    });
    assert.equal(
      Object.hasOwn(workOrder.target_progress_accounting, 'substantive_deliverable_delta_refs'),
      false,
    );
    assert.equal(
      Object.hasOwn(workOrder.target_progress_accounting, 'platform_interface_repair_refs'),
      false,
    );
    assert.equal(workOrder.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.deepEqual(workOrder.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.equal(workOrder.ai_reviewer_review.predicted_impact, reviewerEvaluation.predicted_impact);
    assert.deepEqual(workOrder.ai_reviewer_independence.direct_evidence_refs, reviewerEvaluation.direct_evidence_refs);
    assert.equal(workOrder.ai_reviewer_scorecard.verdict, reviewerEvaluation.verdict);
    assert.equal(workOrder.executor_lease_ref, `executor-lease:codex-cli/${workOrder.work_order_id}`);
    assert.ok(workOrder.reviewer_pool_refs.includes(reviewerEvaluationPath));
    assert.ok(workOrder.reviewer_pool_refs.includes('paper/evidence_ledger.json'));
    assert.equal(
      workOrder.patch_execution_bundle_ref,
      `patch-execution-bundle:target-agent/${workOrder.target_agent.domain_id}/${workOrder.work_order_id}`,
    );
    assert.ok(workOrder.target_closeout_refs.includes(workOrder.machine_closeout_refs.patch_absorption_ref));
    assert.ok(workOrder.target_closeout_refs.includes(workOrder.machine_closeout_refs.worktree_cleanup_ref));
    assert.equal(
      workOrder.work_order_completeness.executor_lease_ref,
      workOrder.executor_lease_ref,
    );
    assert.deepEqual(workOrder.work_order_completeness.reviewer_pool_refs, workOrder.reviewer_pool_refs);
    assert.equal(
      workOrder.work_order_completeness.patch_execution_bundle_ref,
      workOrder.patch_execution_bundle_ref,
    );
    assert.deepEqual(workOrder.work_order_completeness.target_closeout_refs, workOrder.target_closeout_refs);
    assert.deepEqual(workOrder.ai_reviewer_recovery_refs.canary_refs, reviewerEvaluation.canary_refs);
    assert.ok(workOrder.ahe_developer_work_order.failure_evidence.includes('rubric-gap:mas/002/hdl-harmonization-and-sensitivity'));
    assert.match(workOrder.ahe_developer_work_order.root_cause, /capability gaps/);
    assert.ok(workOrder.ahe_developer_work_order.targeted_fix.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.equal(workOrder.ahe_developer_work_order.predicted_impact, reviewerEvaluation.predicted_impact);
    assert.ok(workOrder.allowed_editable_surfaces.includes('quality_contract_ref'));
    assert.ok(workOrder.target_repo_file_hints.includes('src/med_autoscience/policies/medical_reporting_checklist.py'));
    assert.ok(workOrder.required_verification_refs.includes('target_repo_test_receipt'));
    assert.ok(workOrder.rollback_version_refs.includes('target_agent_previous_head_ref'));
    assert.ok(workOrder.owner_route_refs.includes('target-agent-owner:med-autoscience'));
    assert.equal(workOrder.required_opl_work_order_primitive_refs.owner, 'one-person-lab');
    assert.equal(workOrder.required_opl_work_order_primitive_refs.consumed_as_refs_only_by_oma, true);
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.work_order_readiness_primitive_ref,
      /^opl-work-order-primitive:work-order-readiness\/med-autoscience\//,
    );
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.promotion_readiness_primitive_ref,
      /^opl-work-order-primitive:promotion-readiness\/med-autoscience\//,
    );
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.promotion_gate_projection_ref,
      /^opl-work-order-primitive:promotion-gate-projection\/med-autoscience\//,
    );
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.owner_gated_promotion_projection_ref,
      /^opl-work-order-primitive:owner-gated-promotion-projection\/med-autoscience\//,
    );
    assert.equal(workOrder.no_forbidden_write_proof.can_write_target_domain_truth, false);
    assert.equal(workOrder.work_order_completeness.required_fields_present, true);
    assert.ok(workOrder.work_order_completeness.reviewer_refs.includes(reviewerEvaluationPath));
    assert.ok(workOrder.work_order_completeness.reviewer_refs.includes('paper/evidence_ledger.json'));
    assert.equal(workOrder.work_order_completeness.executor_aperture.executor_first, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.codex_first, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.executor, 'codex_cli');
    assert.equal(
      workOrder.work_order_completeness.executor_aperture.executor_lease_ref,
      workOrder.executor_lease_ref,
    );
    assert.ok(workOrder.work_order_completeness.executor_aperture.allowed_write_surfaces.includes('quality_contract_ref'));
    assert.ok(workOrder.work_order_completeness.executor_aperture.forbidden_write_surfaces.includes('target_quality_or_export_verdict'));
    assert.equal(
      workOrder.work_order_completeness.patch_traceability.matrix_ref,
      `${workOrder.work_order_id}#/patch_traceability_matrix`,
    );
    assert.equal(workOrder.work_order_completeness.patch_traceability.traceability_status, 'gap_to_patch_refs_mapped');
    assert.ok(workOrder.work_order_completeness.target_verification.required_refs.includes('target_repo_test_receipt'));
    assert.equal(workOrder.work_order_completeness.target_verification.requires_target_owner_receipt_or_typed_blocker, true);
    assert.ok(workOrder.work_order_completeness.owner_route.route_refs.includes('target-agent-owner:med-autoscience'));
    assert.equal(workOrder.work_order_completeness.no_forbidden_write_proof.can_write_target_domain_truth, false);
    assert.ok(workOrder.work_order_completeness.no_forbidden_write_proof.proof_refs.includes('no_target_domain_truth_write_proof'));
    assert.ok(workOrder.work_order_completeness.canary_refs.includes('canary:mas/002/high-quality-medical-manuscript-redrive'));
    assert.ok(workOrder.work_order_completeness.rollback_refs.includes('rollback:mas/002/pre-reviewer-workorder-head'));
    assert.ok(workOrder.work_order_completeness.version_refs.includes('version:mas/002/current-head'));
    assert.match(workOrder.work_order_completeness.fail_closed_blocker_ref, /typed-blocker:opl-meta-agent\/med-autoscience/);
    assert.equal(workOrder.version_management.absorb_back_required, true);
    assert.equal(workOrder.version_management.temporary_worktree_cleanup_required, true);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assertTargetPatchLoopMachineRefs(workOrder.machine_closeout_refs, {
      blockedSuiteResultRef: workOrder.source_agent_lab_result_ref,
      developerPatchWorkOrderRef: workOrder.work_order_id,
      requiredVerificationRefs: workOrder.required_verification_refs,
    });
    assert.equal(
      workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
      `target-owner-receipt-or-typed-blocker:med-autoscience/${workOrder.work_order_id}`,
    );
    assert.ok(
      (workOrder.patch_traceability_matrix as JsonObject[]).some((item) => item.gap_token === 'internal-quality-language-purge'),
    );
    assert.ok(
      (workOrder.patch_traceability_matrix as JsonObject[]).some((item) =>
        item.ai_reviewer_suggestions.includes(
          'Purge internal-quality language from manuscript writing prompts and reviewer rubrics.',
        )
      ),
    );
    assert.equal(workOrder.implementation_controls.patch_must_be_limited_to_traceable_surfaces, true);
    assert.equal(workOrder.implementation_controls.developer_patch_receipt_required, true);
    assert.equal(workOrder.implementation_controls.no_target_domain_truth_write_proof_required, true);
    assert.equal(workOrder.implementation_controls.target_runtime_consumption_verification_required, true);
    assert.equal(workOrder.implementation_controls.target_workspace_environment_consumption_proof_required, true);
    assert.equal(workOrder.implementation_controls.dependency_lock_or_profile_migration_proof_required, true);
    assert.equal(workOrder.implementation_controls.owner_entry_redrive_required, true);
    assert.equal(workOrder.implementation_controls.repo_hygiene_no_checkout_venv_proof_required, true);
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target runtime/read-model consumed patched capability',
      ),
    );
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target workspace dependency lock/profile migrated when runtime extras are required',
      ),
    );
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target owner entry redrive consumed the migrated workspace environment',
      ),
    );
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
      ),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.required_surface_refs.includes('study_runtime_status'),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.required_surface_refs.includes('domain_transition'),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.required_surface_refs.includes('default_executor_dispatch_execution'),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.expected_outcomes.includes(
        'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
      ),
    );
    assert.equal(workOrder.runtime_consumption_verification.can_write_target_domain_truth, false);
    assert.equal(
      workOrder.target_workspace_environment_verification.verification_mode,
      'read_only_target_workspace_environment_and_owner_entry_redrive',
    );
    assert.ok(
      workOrder.target_workspace_environment_verification.required_surface_refs.includes(
        'target_workspace_pyproject_or_lock',
      ),
    );
    assert.ok(
      workOrder.target_workspace_environment_verification.required_surface_refs.includes(
        'study_runtime_analysis_bundle',
      ),
    );
    assert.ok(
      workOrder.target_workspace_environment_verification.expected_outcomes.includes(
        'owner runtime entry uses the target workspace interpreter rather than target repo checkout .venv',
      ),
    );
    assert.equal(workOrder.target_workspace_environment_verification.can_write_target_domain_truth, false);
    assert.ok(workOrder.implementation_controls.forbidden_target_paths_or_surfaces.includes('publication_eval/latest.json'));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

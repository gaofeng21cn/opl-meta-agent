import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildBlockedMedicalManuscriptSuite(suitePath) {
  return {
    suite_id: 'mas-agent-lab-suite:002-dm-china-us-mortality-attribution:high-quality-medical-manuscript',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:mas/002-dm-china-us-mortality-attribution/high-quality-medical-manuscript',
        domain_id: 'med-autoscience',
        task_family: 'high_quality_medical_manuscript_self_evolution',
        environment: {
          environment_kind: 'local_workspace',
          workspace_locator_ref: 'workspace-locator:mas/002-dm-china-us-mortality-attribution',
          sandbox_policy: 'refs_only_no_artifact_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:mas/high-quality-medical-manuscript-ai-reviewer',
        agent_entry_ref: 'domain-agent-entry:med-autoscience',
        stage_refs: [
          'stage:mas/review',
          'stage:mas/write',
          'stage:mas/publication-gate',
        ],
        oracle_refs: ['oracle:mas/ai-reviewer-publication-eval'],
        scorer_refs: ['scorer:mas/ai-reviewer-medical-publication-critique-v1'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:mas/002/review-route-redrive',
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: [suitePath],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:mas/002/high-quality-medical-manuscript',
          run_ref: 'run:mas/002/high-quality-medical-manuscript-agent-lab-projection',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:mas/ai-reviewer-medical-prose-quality-review'],
          tool_call_refs: ['tool-call:mas/publication-eval-read'],
          artifact_refs: ['paper/evidence_ledger.json', 'artifacts/publication_eval/latest.json'],
          receipt_refs: ['artifacts/publication_eval/latest.json'],
          repair_refs: [
            'rubric-gap:mas/002/hdl-harmonization-and-sensitivity',
            'rubric-gap:mas/002/model-reproducibility-and-baseline-survival',
            'rubric-gap:mas/002/table1-table2-visible-baseline-performance',
            'rubric-gap:mas/002/uncertainty-intervals-and-validation-metrics',
            'rubric-gap:mas/002/nhanes-survey-weighting-and-unweighted-framing',
            'rubric-gap:mas/002/calibration-risk-collapse-and-figure-quality',
            'rubric-gap:mas/002/internal-quality-language-purge',
          ],
          trace_refs: ['trace-ref:agent-lab/mas-high-quality-medical-manuscript'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:mas/002/high-quality-medical-manuscript',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: false,
          metric_refs: [
            'metric-ref:mas/002/medical_journal_prose_quality:underdefined',
            'metric-ref:mas/high-quality-medical-manuscript/reproducibility-results-tables-figures',
          ],
          evidence_refs: ['artifacts/controller/task_intake/latest.json'],
          review_refs: ['paper/review/review_ledger.json'],
          quality_gate_refs: ['quality-gate:mas/publication-owner'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:mas/002/high-quality-medical-manuscript-rubric-gap',
          candidate_kind: 'rubric_gap',
          target_ref: 'rubric-gap-ref:mas/high-quality-medical-manuscript-ai-reviewer',
          evidence_refs: [
            'rubric-gap:mas/002/hdl-harmonization-and-sensitivity',
            'rubric-gap:mas/002/model-reproducibility-and-baseline-survival',
            'rubric-gap:mas/002/table1-table2-visible-baseline-performance',
            'rubric-gap:mas/002/uncertainty-intervals-and-validation-metrics',
            'rubric-gap:mas/002/nhanes-survey-weighting-and-unweighted-framing',
            'rubric-gap:mas/002/calibration-risk-collapse-and-figure-quality',
            'rubric-gap:mas/002/internal-quality-language-purge',
          ],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:mas/002/high-quality-medical-manuscript',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:mas/002/high-quality-medical-manuscript',
          gate_status: 'blocked',
          required_refs: ['quality-scorecard:mas/002/high-quality-medical-manuscript'],
          regression_suite_refs: ['regression-suite:mas/ai-first-quality-boundary'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:mas/agent-lab-medical-manuscript-quality'],
        },
      },
    ],
  };
}

test('external blocked Agent Lab suite becomes a MAS developer patch work order', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--feedback-ref',
        'manual-review:gpt-5.5/high-quality-medical-paper-style',
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
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
    const hdlTrace = candidate.patch_traceability_matrix.find((item) => item.gap_token === 'hdl');
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

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.ok(mechanism.editable_surfaces.includes('target_agent_stage_policy_ref'));
    assert.ok(mechanism.edit.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));

    const receipt = readJson(payload.artifacts.meta_agent_improvement_receipt_path);
    assert.equal(receipt.receipt_class, 'external_suite_quality_failure_self_evolution_receipt');
    assert.equal(receipt.acceptance_gates.target_domain_truth_authority_preserved, true);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.surface_kind, 'opl_meta_agent_developer_patch_work_order');
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch');
    assert.equal(workOrder.version_management.absorb_back_required, true);
    assert.equal(workOrder.version_management.temporary_worktree_cleanup_required, true);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.ok(
      workOrder.patch_traceability_matrix.some((item) => item.gap_token === 'internal-quality-language-purge'),
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

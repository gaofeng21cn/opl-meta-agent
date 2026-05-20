import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFakeOplBin(filePath: string): void {
  fs.writeFileSync(
    filePath,
    `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const suiteIndex = process.argv.indexOf('--suite');
if (!process.argv.includes('agent-lab') || suiteIndex === -1) {
  console.error('unexpected fake opl invocation: ' + process.argv.slice(2).join(' '));
  process.exit(2);
}
const suitePath = process.argv[suiteIndex + 1];
const suite = JSON.parse(fs.readFileSync(suitePath, 'utf8'));
const passed = Boolean(suite.ai_reviewer_evaluation_ref);
const output = {
  agent_lab_run: {
    suite_path: suitePath,
    suite_result: {
      result_id: 'fake-agent-lab-result:' + path.basename(suitePath),
      suite_kind: suite.suite_kind,
      status: passed ? 'passed' : 'blocked',
      summary: {
        recovery_probe_count: 1,
        recovery_passed_count: 1,
        forbidden_authority_flag_count: 0
      }
    }
  }
};
process.stdout.write(JSON.stringify(output, null, 2) + '\\n');
`,
  );
  fs.chmodSync(filePath, 0o755);
}

function writeTargetAgentFixture(agentRepo: string): void {
  writeJson(path.join(agentRepo, 'contracts/domain_descriptor.json'), {
    surface_kind: 'domain_agent_descriptor',
    domain_id: 'med-autoscience',
    domain_label: 'Med Auto Science',
    generated_surface_owner: 'one-person-lab',
  });
  writeJson(path.join(agentRepo, 'contracts/generated_surface_handoff.json'), {
    surface_kind: 'opl_generated_surface_handoff',
    domain_id: 'med-autoscience',
    generated_surface_owner: 'one-person-lab',
    generated_surface_policy: {
      must_not_write: [
        'target study truth',
        'target quality verdict',
        'current_package',
      ],
    },
    required_domain_handoff: [
      'owner_receipt_schema',
      'typed_blocker_schema',
      'no_forbidden_write_evidence',
    ],
  });
  writeJson(path.join(agentRepo, 'contracts/owner_receipt_contract.json'), {
    surface_kind: 'owner_receipt_contract',
    domain_id: 'med-autoscience',
    allowed_receipt_classes: [
      'owner_receipt',
      'typed_blocker',
      'agent_capability_evolution_receipt',
    ],
  });
  writeJson(path.join(agentRepo, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_production_evidence_handoff',
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    handoff_status: 'ready_for_opl_meta_agent_and_agent_lab_execution',
    external_suite_seed: {
      suite_id: 'mas-production-evidence-tail-suite',
      suite_kind: 'agent_production_evidence_suite',
      required_task_ids: [
        'agent-lab-task:mas/real-paper-line-provider-canary',
        'agent-lab-task:mas/memory-artifact-human-gate-scaleout',
        'agent-lab-task:mas/provider-slo-long-soak',
      ],
      tasks: [
        {
          task_id: 'agent-lab-task:mas/real-paper-line-provider-canary',
          gate_id: 'real_paper_line_provider_canary',
          owner_route: 'MedAutoScience',
          required_return_shapes: ['owner_receipt', 'typed_blocker'],
        },
        {
          task_id: 'agent-lab-task:mas/memory-artifact-human-gate-scaleout',
          gate_id: 'memory_artifact_human_gate_scaleout',
          owner_route: 'MedAutoScience',
          required_return_shapes: ['artifact_lifecycle_receipt_or_typed_blocker'],
        },
        {
          task_id: 'agent-lab-task:mas/provider-slo-long-soak',
          gate_id: 'provider_slo_long_soak',
          owner_route: 'owner-route:one-person-lab/provider-runtime',
          required_return_shapes: ['owner_receipt_ref', 'stable_typed_blocker_ref'],
        },
      ],
    },
  });
  writeJson(path.join(agentRepo, 'contracts/production_acceptance/production-acceptance.json'), {
    surface_kind: 'mas_domain_owned_production_acceptance',
    schema_version: 1,
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    updated_at: '2026-05-19',
    acceptance_status: 'closed_by_domain_owned_acceptance_receipt',
    production_like_receipt_chain: {
      required_return_shapes: [
        'owner_receipt',
        'progress_delta',
        'quality_publication_gate_ref',
        'typed_blocker',
      ],
    },
    domain_acceptance_receipt: {
      receipt_id: 'mas-production-acceptance-2026-05-19',
      owner_receipt_refs: [
        {
          ref: 'contracts/owner_receipt_contract.json',
          role: 'domain_owner_receipt_contract',
          body_included: false,
        },
      ],
      progress_delta_refs: [
        {
          ref: 'docs/status.md#current-evidence-tail',
          role: 'human_doc_progress_delta',
          body_included: false,
        },
      ],
      quality_publication_gate_refs: [
        {
          ref: 'publication_eval/latest.json',
          role: 'mas_owned_publication_eval_surface',
          body_included: false,
        },
        {
          ref: 'controller_decisions/latest.json',
          role: 'mas_owned_route_and_gate_decision_surface',
          body_included: false,
        },
      ],
      typed_blocker_refs: [],
      next_verification_command_refs: [
        {
          ref: 'scripts/run-pytest-clean.sh -q tests/test_mas_production_acceptance.py',
          role: 'focused_contract_test',
          body_included: false,
        },
        {
          ref: 'scripts/verify.sh',
          role: 'minimum_repo_verification',
          body_included: false,
        },
      ],
    },
    codex_first_landing_program: {
      parallel_execution_model: {
        shared_blockers: [
          'no_active_caller_proof_missing',
          'opl_generated_surface_parity_missing',
          'domain_receipt_parity_missing',
          'independent_reviewer_or_auditor_receipt_missing',
          'no_forbidden_write_proof_missing',
        ],
      },
    },
    authority_boundary: {
      domain_ready_requires_owner_receipt_or_typed_blocker: true,
      quality_or_export_ready_requires_target_owner_gate: true,
      artifact_mutation_requires_owner_receipt: true,
      opl_can_write_domain_truth: false,
      opl_can_write_publication_verdict: false,
      opl_can_write_memory_body: false,
      opl_can_write_current_package: false,
    },
  });
}

function writeAiReviewerEvaluation(filePath: string): void {
  writeJson(filePath, {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/mas/production-evidence-tail',
    execution_attempt_ref: 'attempt:executor/mas/production-evidence-tail',
    review_attempt_ref: 'attempt:ai-reviewer/mas/production-evidence-tail',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'domain agent production evidence tail still needs owner-route and no-forbidden-write proof materialized as refs.',
    suggestions: [
      'Generate a refs-only Agent Lab suite from the target production acceptance contract.',
      'Emit developer work order refs without writing MAS domain truth or publication verdicts.',
    ],
    source_refs: [
      'contracts/production_acceptance/mas-production-acceptance.json',
      'contracts/generated_surface_handoff.json',
      'contracts/owner_receipt_contract.json',
    ],
    direct_evidence_refs: [
      'contracts/production_acceptance/production-acceptance.json',
      'contracts/agent_lab_handoff.json',
    ],
    verdict: 'blocked_requires_developer_patch',
    predicted_impact: 'The patch work order should expose missing owner-route and no-forbidden-write proof refs without writing MAS truth or publication verdicts.',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/mas-production-evidence-tail',
      created_by: 'test-fixture',
    },
  });
}

test('agent:evidence generates domain Agent Lab suite and proposal artifacts from target agent contracts', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-agent-evidence-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const fakeOplBin = path.join(outputRoot, 'fake-opl.js');
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeTargetAgentFixture(agentRepo);
    writeFakeOplBin(fakeOplBin);
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/agent-evidence-takeover.ts'),
        '--agent-repo',
        agentRepo,
        '--output-dir',
        outputDir,
        '--opl-bin',
        fakeOplBin,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as JsonObject;
    assert.equal(payload.surface_kind, 'opl_meta_agent_agent_evidence_takeover_result');
    assert.equal(payload.status, 'proposal_recorded_requires_target_owner_gate');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.authority_boundary.can_authorize_target_quality_or_export, false);
    assert.equal(payload.authority_boundary.can_promote_default_agent_without_gate, false);
    assert.equal(fs.existsSync(path.join(outputDir, 'agent-lab-run-result.json')), true);

    const suite = readJson(path.join(outputDir, 'agent-lab-suite.json'));
    assert.equal(suite.suite_kind, 'agent_production_evidence_suite');
    assert.equal(suite.suite_role, 'target_agent_production_evidence_tail_testing_takeover');
    assert.ok(suite.source_contract_refs.includes('contracts/agent_lab_handoff.json'));
    assert.deepEqual(suite.production_evidence_gate.gate_ids, [
      'real_paper_line_provider_canary',
      'memory_artifact_human_gate_scaleout',
      'provider_slo_long_soak',
    ]);
    assert.deepEqual(suite.production_evidence_gate.owner_route_refs, [
      'owner-route:med-autoscience/MedAutoScience',
      'owner-route:one-person-lab/provider-runtime',
    ]);
    assert.equal(suite.production_evidence_gate.domain_verdict_claimed, false);
    assert.ok(
      suite.production_evidence_gate.no_forbidden_write_proof_refs.includes(
        'no-forbidden-write:med-autoscience/production-evidence-tail',
      ),
    );
    assert.equal(suite.authority_boundary.refs_only, true);
    assert.equal(suite.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(suite.authority_boundary.can_mutate_target_artifact_body, false);
    assert.ok(suite.authority_boundary.forbidden_write_surfaces.includes('target quality verdict'));
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes('contracts/owner_receipt_contract.json'));
    assert.ok(
      suite.tasks[0].scorecard.evidence_refs.includes(
        'scripts/run-pytest-clean.sh -q tests/test_mas_production_acceptance.py',
      ),
    );
    assert.ok(suite.tasks[0].promotion_gate.no_forbidden_write_proof_refs.includes('no-forbidden-write:med-autoscience/production-evidence-tail'));
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes('contracts/agent_lab_handoff.json'));

    const workOrder = readJson(path.join(outputDir, 'developer-patch-work-order.json'));
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch_proposal');
    assert.equal(workOrder.ai_reviewer_independence.no_shared_context, true);
    assert.equal(workOrder.ai_reviewer_independence.independent_attempt, true);
    assert.equal(workOrder.ai_reviewer_independence.execution_attempt_ref, 'attempt:executor/mas/production-evidence-tail');
    assert.equal(workOrder.ai_reviewer_independence.review_attempt_ref, 'attempt:ai-reviewer/mas/production-evidence-tail');
    assert.equal(workOrder.target_owner_route.domain_ready_requires_owner_receipt_or_typed_blocker, true);
    assert.equal(workOrder.implementation_controls.proposal_only, true);
    assert.equal(workOrder.implementation_controls.refs_only, true);
    assert.equal(workOrder.implementation_controls.no_forbidden_write_proof_required, true);
    assert.ok(workOrder.editable_surface_limits.editable_surfaces.includes('agent/prompts'));
    assert.ok(workOrder.allowed_editable_surfaces.includes('agent/prompts'));
    assert.ok(workOrder.target_repo_file_hints.includes('contracts/agent_lab_handoff.json'));
    assert.ok(workOrder.editable_surface_limits.forbidden_write_surfaces.includes('current_package'));
    assert.ok(workOrder.required_verification_refs.includes('scripts/verify.sh'));
    assert.ok(workOrder.rollback_version_refs.includes('target_agent_current_head_ref'));
    assert.ok(workOrder.owner_route_refs.includes('owner-route:med-autoscience/MedAutoScience'));
    assert.ok(workOrder.ahe_developer_work_order.failure_evidence.includes('contracts/production_acceptance/mas-production-acceptance.json'));
    assert.match(workOrder.ahe_developer_work_order.root_cause, /Production evidence tail/);
    assert.ok(workOrder.ahe_developer_work_order.targeted_fix.includes('agent:evidence-tail/med-autoscience/no-forbidden-write-proof'));
    assert.match(workOrder.ahe_developer_work_order.predicted_impact, /no-forbidden-write proof refs/);
    assert.ok(workOrder.verification_command_refs.includes('scripts/verify.sh'));

    const candidate = readJson(path.join(outputDir, 'target-capability-improvement-candidate.json'));
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.equal(candidate.ai_reviewer_independence.no_shared_context, true);
    assert.deepEqual(candidate.ai_reviewer_evidence.direct_evidence_refs, [
      'contracts/production_acceptance/production-acceptance.json',
      'contracts/agent_lab_handoff.json',
    ]);
    assert.equal(candidate.target_owner_route.quality_or_export_ready_requires_target_owner_gate, true);
    assert.ok(candidate.proposed_change_refs.includes('agent:evidence-tail/med-autoscience/no-forbidden-write-proof'));
    assert.equal(candidate.no_forbidden_write.can_authorize_target_quality_or_export, false);
    assert.ok(candidate.verification_command_refs.includes('scripts/verify.sh'));

    const mechanism = readJson(path.join(outputDir, 'mechanism-patch-proposal.json'));
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.status, 'proposal_recorded_requires_target_owner_gate');
    assert.ok(mechanism.editable_surfaces.includes('target_no_forbidden_write_proof_refs'));
    assert.equal(mechanism.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(mechanism.authority_boundary.can_promote_default_agent_without_gate, false);

    const ownerRefs = readJson(path.join(outputDir, 'owner-receipt-refs.json'));
    assert.equal(ownerRefs.status, 'refs_only_no_owner_receipt_signed_by_meta_agent');
    assert.ok(ownerRefs.receipt_refs.includes('publication_eval/latest.json'));
    assert.deepEqual(ownerRefs.required_return_shapes, [
      'owner_receipt',
      'progress_delta',
      'quality_publication_gate_ref',
      'typed_blocker',
    ]);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('agent:evidence emits typed blocker and no delivery receipt when reviewer evaluation is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-agent-evidence-blocked-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const fakeOplBin = path.join(outputRoot, 'fake-opl.js');
    writeTargetAgentFixture(agentRepo);
    writeFakeOplBin(fakeOplBin);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/agent-evidence-takeover.ts'),
        '--agent-repo',
        agentRepo,
        '--output-dir',
        outputDir,
        '--opl-bin',
        fakeOplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as JsonObject;
    assert.equal(payload.status, 'blocked_missing_ai_reviewer_evaluation');
    assert.equal(fs.existsSync(path.join(outputDir, 'mechanism-patch-proposal.json')), false);
    assert.equal(fs.existsSync(path.join(outputDir, 'baseline-delivery-receipt.json')), false);

    const typedBlocker = readJson(path.join(outputDir, 'typed-blocker.json'));
    assert.equal(typedBlocker.status, 'blocked_missing_ai_reviewer_evaluation');
    assert.equal(
      typedBlocker.blocked_reason,
      'independent_ai_reviewer_attempt_required_before_mechanism_patch_proposal_or_delivery_receipt',
    );
    assert.ok(typedBlocker.required_ai_reviewer_independence_fields.includes('no_shared_context=true'));
    assert.ok(typedBlocker.required_ai_reviewer_independence_fields.includes('execution_attempt_ref != review_attempt_ref'));
    assert.equal(typedBlocker.authority_boundary.no_delivery_receipt_signed, true);
    assert.equal(typedBlocker.authority_boundary.can_write_target_domain_truth, false);
    assert.ok(typedBlocker.required_input_refs.includes('--ai-reviewer-evaluation <json>'));
    assert.ok(typedBlocker.required_source_refs.includes('contracts/agent_lab_handoff.json'));
    assert.ok(typedBlocker.required_verification_refs.includes('scripts/verify.sh'));
    assert.ok(typedBlocker.rollback_version_refs.includes('target_agent_current_head_ref'));
    assert.ok(typedBlocker.owner_route_refs.includes('owner-route:med-autoscience/MedAutoScience'));
    assert.match(typedBlocker.ahe_developer_work_order.root_cause, /reviewer evaluation is missing/);
    assert.match(typedBlocker.ahe_developer_work_order.predicted_impact, /Blocks delivery receipt/);
    assert.ok(typedBlocker.verification_command_refs.includes('scripts/verify.sh'));

    const workOrder = readJson(path.join(outputDir, 'developer-patch-work-order.json'));
    assert.equal(workOrder.status, 'blocked_missing_ai_reviewer_evaluation');
    assert.equal(workOrder.no_forbidden_write.can_write_target_domain_truth, false);
    assert.ok(workOrder.required_verification_refs.includes('scripts/verify.sh'));
    assert.ok(workOrder.ahe_developer_work_order.failure_evidence.includes('scripts/verify.sh'));
    assert.equal(workOrder.implementation_controls.target_owner_receipt_or_typed_blocker_required, true);
    assert.ok(workOrder.editable_surface_limits.forbidden_write_surfaces.includes('target quality verdict'));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

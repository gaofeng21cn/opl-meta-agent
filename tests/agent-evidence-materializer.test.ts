import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetPatchLoopMachineRefFields = [
  'blocked_suite_result_ref',
  'developer_patch_work_order_ref',
  'patch_traceability_matrix_ref',
  'target_repo_verification_refs',
  'target_runtime_read_model_consumption_ref',
  'workspace_environment_proof_ref',
  'no_forbidden_write_proof_ref',
  'target_owner_receipt_or_typed_blocker_ref',
  'patch_absorption_ref',
  'worktree_cleanup_ref',
  'agent_lab_re_evaluation_ref',
];

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertStageFolderContractRefs(
  contract: JsonObject,
  domainId: string,
  stageId: string,
  attemptId: string,
): void {
  assert.equal(contract.stage_folder_contract_ref, `stage-folder-contract-ref:${domainId}/${stageId}`);
  assert.equal(contract.stage_json_ref, `stage-json-ref:${domainId}/${stageId}`);
  assert.equal(contract.attempt_json_ref, `stage-attempt-json-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.manifest_ref, `stage-manifest-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.receipt_ref, `stage-attempt-receipt-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.current_pointer_ref, `stage-current-pointer-ref:${domainId}/${stageId}`);
  assert.equal(contract.canonical_artifact_ref, `canonical-artifact-ref:${domainId}/${stageId}`);
  assert.equal(contract.export_ref, `stage-export-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.lineage_ref, `stage-lineage-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.retention_ref, `stage-retention-ref:${domainId}/${stageId}/${attemptId}`);
  assert.equal(contract.materialization_kind, 'compiler_ref_template_only_not_runtime_state');
}

function assertTargetPatchLoopMachineRefs(refs: JsonObject, expected: {
  blockedSuiteResultRef: string;
  developerPatchWorkOrderRef: string;
  requiredVerificationRefs: string[];
}): void {
  targetPatchLoopMachineRefFields.forEach((field) => {
    assert.ok(field in refs, `machine_closeout_refs.${field} should be present`);
  });
  assert.equal(refs.blocked_suite_result_ref, expected.blockedSuiteResultRef);
  assert.equal(refs.developer_patch_work_order_ref, expected.developerPatchWorkOrderRef);
  assert.ok(String(refs.patch_traceability_matrix_ref).endsWith('#/patch_traceability_matrix'));
  assert.deepEqual(refs.target_repo_verification_refs, expected.requiredVerificationRefs);
  [
    'target_runtime_read_model_consumption_ref',
    'workspace_environment_proof_ref',
    'no_forbidden_write_proof_ref',
    'target_owner_receipt_or_typed_blocker_ref',
    'patch_absorption_ref',
    'worktree_cleanup_ref',
    'agent_lab_re_evaluation_ref',
  ].forEach((field) => {
    assert.equal(typeof refs[field], 'string', `machine_closeout_refs.${field} should be a string ref`);
    assert.ok(String(refs[field]).length > 0, `machine_closeout_refs.${field} should not be empty`);
  });
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

function writeEfficiencyProductionEvidence(agentRepo: string, withQualityFloor = true): void {
  const productionPath = path.join(agentRepo, 'contracts/production_acceptance/production-acceptance.json');
  const productionAcceptance = readJson(productionPath);
  productionAcceptance.efficiency_non_regression_refs = {
    ...(withQualityFloor
      ? { quality_floor_refs: ['quality-floor:med-autoscience/current-publication-quality'] }
      : {}),
    latency_baseline_refs: ['latency-baseline:med-autoscience/agent-evidence-tail-before'],
    usage_cost_refs: ['usage-cost:med-autoscience/agent-evidence-tail-before'],
    cache_reuse_refs: ['cache-reuse:med-autoscience/agent-evidence-tail-prefix-cache'],
    target_verification_refs: ['target-verification:med-autoscience/agent-evidence-tail-redrive'],
  };
  writeJson(productionPath, productionAcceptance);
}

function writeEfficiencyAiReviewerEvaluation(filePath: string, withQualityFloor = true): void {
  writeJson(filePath, {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/mas/production-efficiency-tail',
    execution_attempt_ref: 'attempt:executor/mas/production-efficiency-tail',
    review_attempt_ref: 'attempt:ai-reviewer/mas/production-efficiency-tail',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'Production evidence includes efficiency non-regression refs for latency, usage cost, cache reuse, target verification, and quality floor.',
    suggestions: [
      'Materialize a generic target-agent efficiency work order without claiming MAS quality or export readiness.',
    ],
    source_refs: [
      'latency-baseline:med-autoscience/agent-evidence-tail-before',
      'usage-cost:med-autoscience/agent-evidence-tail-before',
      'cache-reuse:med-autoscience/agent-evidence-tail-prefix-cache',
      ...(withQualityFloor ? ['quality-floor:med-autoscience/current-publication-quality'] : []),
    ],
    direct_evidence_refs: [
      'target-verification:med-autoscience/agent-evidence-tail-redrive',
      ...(withQualityFloor ? ['quality-floor:med-autoscience/current-publication-quality'] : []),
    ],
    verdict: 'blocked_requires_developer_patch',
    predicted_impact: 'The work order should preserve quality-floor evidence while improving latency, usage cost, and cache reuse.',
    canary_refs: ['canary:med-autoscience/production-efficiency-redrive'],
    rollback_refs: ['rollback:med-autoscience/pre-efficiency-workorder-head'],
    version_refs: ['version:med-autoscience/current-head'],
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/mas-production-efficiency-tail',
      created_by: 'test-fixture',
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
    canary_refs: ['canary:med-autoscience/production-evidence-tail-redrive'],
    rollback_refs: ['rollback:med-autoscience/pre-agent-evidence-workorder-head'],
    version_refs: ['version:med-autoscience/current-head'],
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/mas-production-evidence-tail',
      created_by: 'test-fixture',
    },
  });
}

test('agent:evidence projects production efficiency evidence into work order refs', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-agent-efficiency-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const fakeOplBin = path.join(outputRoot, 'fake-opl.js');
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeTargetAgentFixture(agentRepo);
    writeEfficiencyProductionEvidence(agentRepo);
    writeFakeOplBin(fakeOplBin);
    writeEfficiencyAiReviewerEvaluation(reviewerEvaluationPath, false);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/lib/agent-evidence-materializer.ts'),
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
    assert.equal(payload.status, 'proposal_recorded_requires_target_owner_gate');
    const workOrder = readJson(path.join(outputDir, 'developer-patch-work-order.json'));
    assert.deepEqual(workOrder.efficiency_non_regression_refs.quality_floor_refs, [
      'quality-floor:med-autoscience/current-publication-quality',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.latency_baseline_refs, [
      'latency-baseline:med-autoscience/agent-evidence-tail-before',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.usage_cost_refs, [
      'usage-cost:med-autoscience/agent-evidence-tail-before',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.cache_reuse_refs, [
      'cache-reuse:med-autoscience/agent-evidence-tail-prefix-cache',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.target_verification_refs, [
      'target-verification:med-autoscience/agent-evidence-tail-redrive',
    ]);
    assert.deepEqual(
      workOrder.work_order_completeness.efficiency_non_regression_refs,
      workOrder.efficiency_non_regression_refs,
    );
    assert.deepEqual(
      workOrder.machine_closeout_refs.efficiency_non_regression_refs,
      workOrder.efficiency_non_regression_refs,
    );
    assert.ok(workOrder.required_verification_refs.includes('target-verification:med-autoscience/agent-evidence-tail-redrive'));
    assert.equal(workOrder.implementation_controls.quality_floor_non_regression_required, true);
    assert.equal(workOrder.authority_boundary.can_authorize_target_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('agent:evidence efficiency production evidence without quality floor emits typed blocker only', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-agent-efficiency-blocker-'));
  try {
    const agentRepo = path.join(outputRoot, 'med-autoscience');
    const outputDir = path.join(outputRoot, 'out');
    const fakeOplBin = path.join(outputRoot, 'fake-opl.js');
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeTargetAgentFixture(agentRepo);
    writeEfficiencyProductionEvidence(agentRepo, false);
    writeFakeOplBin(fakeOplBin);
    writeEfficiencyAiReviewerEvaluation(reviewerEvaluationPath, false);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/lib/agent-evidence-materializer.ts'),
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
    assert.equal(payload.status, 'blocked_efficiency_quality_floor_missing');
    assert.equal(fs.existsSync(path.join(outputDir, 'mechanism-patch-proposal.json')), false);
    const typedBlocker = readJson(path.join(outputDir, 'typed-blocker.json'));
    assert.equal(typedBlocker.blocked_reason, 'efficiency_evidence_requires_quality_floor_refs');
    assert.ok(typedBlocker.missing_required_fields.includes('efficiency_non_regression_refs.quality_floor_refs'));
    assert.equal(typedBlocker.authority_boundary.no_executable_work_order_issued, true);
    assert.equal(typedBlocker.authority_boundary.can_authorize_target_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

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
        path.join(repoRoot, 'scripts/lib/agent-evidence-materializer.ts'),
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
    assert.equal(payload.surface_kind, 'opl_meta_agent_agent_evidence_materializer_result');
    assert.equal(payload.status, 'proposal_recorded_requires_target_owner_gate');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.authority_boundary.can_authorize_target_quality_or_export, false);
    assert.equal(payload.authority_boundary.can_promote_default_agent_without_gate, false);
    assert.equal(fs.existsSync(path.join(outputDir, 'agent-lab-run-result.json')), true);

    const suite = readJson(path.join(outputDir, 'agent-lab-suite.json'));
    assert.equal(suite.suite_kind, 'agent_production_evidence_suite');
    assert.equal(suite.suite_role, 'target_agent_production_evidence_tail_testing_takeover');
    assert.equal(
      suite.stage_native_artifact_refs.artifact_native_contract_ref,
      'artifact-native-contract-ref:med-autoscience/agent-evidence-takeover',
    );
    assert.equal(
      suite.stage_native_artifact_refs.attempt_json_ref,
      'stage-attempt-json-ref:med-autoscience/agent-evidence-takeover/production-evidence-tail',
    );
    assertStageFolderContractRefs(
      suite.stage_native_artifact_refs.stage_folder_contract,
      'med-autoscience',
      'agent-evidence-takeover',
      'production-evidence-tail',
    );
    assert.equal(suite.authority_boundary.can_generate_target_domain_owner_receipt, false);
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
      suite.tasks[0].scorecard.evidence_refs
        .includes('artifact-native-contract-ref:med-autoscience/agent-evidence-takeover'),
    );
    assert.equal(
      suite.tasks[0].stage_folder_contract.manifest_ref,
      'stage-manifest-ref:med-autoscience/agent-evidence-takeover/production-evidence-tail',
    );
    assertStageFolderContractRefs(
      suite.tasks[0].stage_folder_contract,
      'med-autoscience',
      'agent-evidence-takeover',
      'production-evidence-tail',
    );
    assert.equal(
      suite.tasks[0].stage_folder_contract.canonical_artifact_ref,
      'canonical-artifact-ref:med-autoscience/agent-evidence-takeover',
    );
    assert.ok(
      suite.tasks[0].scorecard.evidence_refs.includes(
        'scripts/run-pytest-clean.sh -q tests/test_mas_production_acceptance.py',
      ),
    );
    assert.ok(suite.tasks[0].promotion_gate.no_forbidden_write_proof_refs.includes('no-forbidden-write:med-autoscience/production-evidence-tail'));
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes('contracts/agent_lab_handoff.json'));

    const workOrder = readJson(path.join(outputDir, 'developer-patch-work-order.json'));
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch_proposal');
    assert.equal(
      workOrder.artifact_native_contract_ref,
      'artifact-native-contract-ref:med-autoscience/agent-evidence-takeover',
    );
    assert.equal(
      workOrder.stage_folder_contract.stage_folder_contract_ref,
      'stage-folder-contract-ref:med-autoscience/agent-evidence-takeover',
    );
    assertStageFolderContractRefs(
      workOrder.stage_folder_contract,
      'med-autoscience',
      'agent-evidence-takeover',
      String(workOrder.work_order_id),
    );
    assert.equal(
      workOrder.stage_native_artifact_refs.export_ref,
      `stage-export-ref:med-autoscience/agent-evidence-takeover/${workOrder.work_order_id}`,
    );
    assert.equal(workOrder.implementation_controls.target_owner_receipt_generated_by_oma, false);
    assert.equal(workOrder.implementation_controls.stage_folder_runtime_state_written_by_oma, false);
    assert.equal(workOrder.authority_boundary.can_generate_target_domain_owner_receipt, false);
    assert.equal(workOrder.authority_boundary.can_write_stage_folder_runtime_state, false);
    assert.equal(workOrder.ai_reviewer_independence.no_shared_context, true);
    assert.equal(workOrder.ai_reviewer_independence.independent_attempt, true);
    assert.equal(workOrder.ai_reviewer_independence.execution_attempt_ref, 'attempt:executor/mas/production-evidence-tail');
    assert.equal(workOrder.ai_reviewer_independence.review_attempt_ref, 'attempt:ai-reviewer/mas/production-evidence-tail');
    assert.equal(workOrder.ai_reviewer_scorecard.verdict, 'blocked_requires_developer_patch');
    assert.equal(workOrder.executor_lease_ref, `executor-lease:codex-cli/${workOrder.work_order_id}`);
    assert.ok(workOrder.reviewer_pool_refs.includes(reviewerEvaluationPath));
    assert.ok(workOrder.reviewer_pool_refs.includes('contracts/agent_lab_handoff.json'));
    assert.equal(
      workOrder.patch_execution_bundle_ref,
      `patch-execution-bundle:target-agent/med-autoscience/${workOrder.work_order_id}`,
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
    assert.deepEqual(workOrder.ai_reviewer_recovery_refs.canary_refs, [
      'canary:med-autoscience/production-evidence-tail-redrive',
    ]);
    assert.equal(workOrder.target_owner_route.domain_ready_requires_owner_receipt_or_typed_blocker, true);
    assert.equal(workOrder.implementation_controls.proposal_only, true);
    assert.equal(workOrder.implementation_controls.refs_only, true);
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
    assert.equal(workOrder.implementation_controls.no_forbidden_write_proof_required, true);
    assert.ok(workOrder.editable_surface_limits.editable_surfaces.includes('agent/prompts'));
    assert.ok(workOrder.allowed_editable_surfaces.includes('agent/prompts'));
    assert.ok(workOrder.target_repo_file_hints.includes('contracts/agent_lab_handoff.json'));
    assert.ok(workOrder.editable_surface_limits.forbidden_write_surfaces.includes('current_package'));
    assert.ok(workOrder.required_verification_refs.includes('scripts/verify.sh'));
    assert.ok(workOrder.rollback_version_refs.includes('target_agent_current_head_ref'));
    assert.ok(workOrder.owner_route_refs.includes('owner-route:med-autoscience/MedAutoScience'));
    assert.deepEqual(workOrder.work_order_currentness.provider_owner_route_index_evidence, {
      provider: 'opl_work_order_execute',
      owner_route_index_ref: `owner-route-index:med-autoscience/${workOrder.work_order_id}`,
      owner_route_ledger_ref: `owner-route-ledger:med-autoscience/${workOrder.work_order_id}`,
      stage_attempt_ledger_ref: `stage-attempt-ledger:med-autoscience/${workOrder.work_order_id}`,
      route_binding_ref: `route-binding:med-autoscience/${workOrder.source_agent_lab_result_ref}/${workOrder.work_order_id}`,
      target_eval_work_order_owner_route_tuple:
        `med-autoscience|${workOrder.source_agent_lab_result_ref}|${workOrder.work_order_id}|owner-route:med-autoscience/MedAutoScience`,
      derived_from_current_opl_route_ledger: true,
      fail_closed_without_route_or_ledger_proof: true,
    });
    assert.ok(workOrder.ahe_developer_work_order.failure_evidence.includes('contracts/production_acceptance/mas-production-acceptance.json'));
    assert.match(workOrder.ahe_developer_work_order.root_cause, /Production evidence tail/);
    assert.ok(workOrder.ahe_developer_work_order.targeted_fix.includes('agent:evidence-tail/med-autoscience/no-forbidden-write-proof'));
    assert.match(workOrder.ahe_developer_work_order.predicted_impact, /no-forbidden-write proof refs/);
    assert.ok(workOrder.verification_command_refs.includes('scripts/verify.sh'));
    assert.equal(workOrder.work_order_completeness.required_fields_present, true);
    assert.ok(workOrder.work_order_completeness.reviewer_refs.includes(reviewerEvaluationPath));
    assert.ok(workOrder.work_order_completeness.reviewer_refs.includes('contracts/agent_lab_handoff.json'));
    assert.equal(workOrder.work_order_completeness.executor_aperture.executor_first, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.codex_first, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.executor, 'codex_cli');
    assert.equal(
      workOrder.work_order_completeness.executor_aperture.executor_lease_ref,
      workOrder.executor_lease_ref,
    );
    assert.ok(workOrder.work_order_completeness.executor_aperture.allowed_write_surfaces.includes('agent/prompts'));
    assert.ok(workOrder.work_order_completeness.executor_aperture.forbidden_write_surfaces.includes('current_package'));
    assert.equal(
      workOrder.work_order_completeness.patch_traceability.matrix_ref,
      `${workOrder.work_order_id}#/patch_traceability_matrix`,
    );
    assert.equal(
      workOrder.work_order_completeness.patch_traceability.traceability_status,
      'reviewer_refs_to_agent_evidence_tail_refs_mapped',
    );
    assert.ok(workOrder.work_order_completeness.target_verification.required_refs.includes('scripts/verify.sh'));
    assert.equal(workOrder.work_order_completeness.target_verification.requires_no_forbidden_write_proof, true);
    assert.ok(workOrder.work_order_completeness.owner_route.route_refs.includes('owner-route:med-autoscience/MedAutoScience'));
    assert.ok(
      workOrder.work_order_completeness.no_forbidden_write_proof.proof_refs.includes(
        'no-forbidden-write:med-autoscience/production-evidence-tail',
      ),
    );
    assert.ok(workOrder.work_order_completeness.canary_refs.includes('canary:med-autoscience/production-evidence-tail-redrive'));
    assert.ok(workOrder.work_order_completeness.rollback_refs.includes('rollback:med-autoscience/pre-agent-evidence-workorder-head'));
    assert.ok(workOrder.work_order_completeness.version_refs.includes('version:med-autoscience/current-head'));
    assertTargetPatchLoopMachineRefs(workOrder.machine_closeout_refs, {
      blockedSuiteResultRef: workOrder.source_agent_lab_result_ref,
      developerPatchWorkOrderRef: workOrder.work_order_id,
      requiredVerificationRefs: workOrder.required_verification_refs,
    });
    assert.equal(
      workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
      `target-owner-receipt-or-typed-blocker:med-autoscience/${workOrder.work_order_id}`,
    );

    const candidate = readJson(path.join(outputDir, 'target-capability-improvement-candidate.json'));
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.equal(candidate.ai_reviewer_independence.no_shared_context, true);
    assert.equal(candidate.ai_reviewer_scorecard.verdict, 'blocked_requires_developer_patch');
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
        path.join(repoRoot, 'scripts/lib/agent-evidence-materializer.ts'),
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
    assertStageFolderContractRefs(
      typedBlocker.stage_folder_contract,
      'med-autoscience',
      'agent-evidence-takeover',
      String(typedBlocker.work_order_ref),
    );
    assert.ok(typedBlocker.required_ai_reviewer_independence_fields.includes('no_shared_context=true'));
    assert.ok(typedBlocker.required_ai_reviewer_independence_fields.includes('execution_attempt_ref != review_attempt_ref'));
    assert.equal(typedBlocker.authority_boundary.no_delivery_receipt_signed, true);
    assert.equal(typedBlocker.authority_boundary.can_write_target_domain_truth, false);
    assert.ok(typedBlocker.required_input_refs.includes('--ai-reviewer-evaluation <json>'));
    assert.ok(typedBlocker.required_source_refs.includes('contracts/agent_lab_handoff.json'));
    assert.equal(typedBlocker.required_opl_work_order_primitive_refs.owner, 'one-person-lab');
    assert.equal(typedBlocker.required_opl_work_order_primitive_refs.consumed_as_refs_only_by_oma, true);
    assert.match(
      typedBlocker.required_opl_work_order_primitive_refs.work_order_readiness_primitive_ref,
      /^opl-work-order-primitive:work-order-readiness\/med-autoscience\//,
    );
    assert.ok(typedBlocker.required_verification_refs.includes('scripts/verify.sh'));
    assert.ok(typedBlocker.rollback_version_refs.includes('target_agent_current_head_ref'));
    assert.ok(typedBlocker.owner_route_refs.includes('owner-route:med-autoscience/MedAutoScience'));
    assert.equal(typedBlocker.work_order_completeness.required_fields_present, false);
    assert.ok(typedBlocker.work_order_completeness.missing_required_fields.includes('ai_reviewer_evidence.direct_evidence_refs'));
    assert.equal(
      typedBlocker.work_order_completeness.patch_traceability.traceability_status,
      'blocked_missing_reviewer_refs',
    );
    assert.ok(typedBlocker.work_order_completeness.target_verification.required_refs.includes('scripts/verify.sh'));
    assert.ok(
      typedBlocker.work_order_completeness.fail_closed_blocker_ref.includes(
        'missing-required-work-order-field',
      ),
    );
    assert.match(typedBlocker.ahe_developer_work_order.root_cause, /reviewer evaluation is missing/);
    assert.match(typedBlocker.ahe_developer_work_order.predicted_impact, /Blocks delivery receipt/);
    assert.ok(typedBlocker.verification_command_refs.includes('scripts/verify.sh'));
    assertTargetPatchLoopMachineRefs(typedBlocker.machine_closeout_refs, {
      blockedSuiteResultRef: typedBlocker.blocked_suite_result_ref,
      developerPatchWorkOrderRef: typedBlocker.work_order_ref,
      requiredVerificationRefs: typedBlocker.required_verification_refs,
    });

    const workOrder = readJson(path.join(outputDir, 'developer-patch-work-order.json'));
    assert.equal(workOrder.status, 'blocked_missing_ai_reviewer_evaluation');
    assertStageFolderContractRefs(
      workOrder.stage_folder_contract,
      'med-autoscience',
      'agent-evidence-takeover',
      String(workOrder.work_order_id),
    );
    assert.equal(workOrder.executor_lease_ref, `executor-lease:codex-cli/${workOrder.work_order_id}`);
    assert.deepEqual(workOrder.reviewer_pool_refs, []);
    assert.equal(
      workOrder.patch_execution_bundle_ref,
      `patch-execution-bundle:target-agent/med-autoscience/${workOrder.work_order_id}`,
    );
    assert.ok(workOrder.target_closeout_refs.includes(workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref));
    assert.equal(workOrder.no_forbidden_write.can_write_target_domain_truth, false);
    assert.ok(workOrder.required_verification_refs.includes('scripts/verify.sh'));
    assert.ok(workOrder.ahe_developer_work_order.failure_evidence.includes('scripts/verify.sh'));
    assert.equal(workOrder.implementation_controls.target_owner_receipt_or_typed_blocker_required, true);
    assert.ok(workOrder.editable_surface_limits.forbidden_write_surfaces.includes('target quality verdict'));
    assert.equal(workOrder.work_order_completeness.required_fields_present, false);
    assert.ok(workOrder.work_order_completeness.missing_required_fields.includes('ai_reviewer_review'));
    assert.deepEqual(workOrder.work_order_completeness.reviewer_refs, []);
    assert.ok(workOrder.work_order_completeness.canary_refs.includes('agent-lab-canary:med-autoscience/production-evidence-tail'));
    assertTargetPatchLoopMachineRefs(workOrder.machine_closeout_refs, {
      blockedSuiteResultRef: workOrder.source_agent_lab_result_ref,
      developerPatchWorkOrderRef: workOrder.work_order_id,
      requiredVerificationRefs: workOrder.required_verification_refs,
    });
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

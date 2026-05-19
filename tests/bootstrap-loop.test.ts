import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/opl-meta-agent/sample-brief-agent/baseline',
    critique: 'The baseline is structurally valid but needs explicit source coverage and operator handoff evidence.',
    suggestions: [
      'Add source coverage checks to the baseline delivery scorecard.',
      'Require operator handoff evidence before signing the baseline receipt.',
    ],
    source_refs: [
      'review-ref:opl-meta-agent/sample-brief-agent/ai-reviewer',
      'evidence-ref:sample-brief-agent/scaffold-validation',
      'scorecard-ref:opl-meta-agent/baseline-acceptance',
    ],
    verdict: 'baseline_ready_with_owner_gate',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/sample-brief-agent-baseline',
      reviewer_prompt_ref: 'agent/prompts/baseline-delivery.md',
      created_by: 'test-fixture',
    },
    ...overrides,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evaluation, null, 2)}\n`);
  return evaluation;
}

test('opl-meta-agent bootstraps a sample agent and validates it through OPL Agent Lab', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  const reviewerEvaluation = writeAiReviewerEvaluation(reviewerEvaluationPath);
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
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
    const payload = JSON.parse(result.stdout);

    assert.equal(payload.surface_kind, 'opl_meta_agent_self_learning_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.product_id, 'opl-meta-agent');
    assert.equal(payload.meta_agent_kind, 'opl_compatible_meta_agent');
    assert.equal(payload.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(payload.target_agent.generated_interface_status, 'ready');
    assert.equal(payload.opl_generated_interfaces.surface_kind, 'opl_generated_agent_interface_bundle');
    assert.equal(payload.opl_generated_interfaces.owner, 'one-person-lab');
    assert.equal(payload.opl_generated_interfaces.domain_repo_can_own_generated_surface, false);
    assert.equal(payload.opl_generated_interfaces.cli.descriptors[0].action_id, 'draft-brief');
    assert.equal(payload.opl_generated_interfaces.mcp.descriptors[0].descriptor_only, true);
    assert.equal(payload.opl_generated_interfaces.skill.descriptors[0].command_contract_id, 'sample-brief-agent.draft-brief');
    assert.equal(payload.opl_generated_interfaces.product_entry.descriptors[0].action_key, 'draft-brief');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.equal(payload.learning_loop.online_learning_policy.can_promote_without_gate, false);
    assert.equal(payload.learning_loop.online_learning_policy.can_train_or_deploy_model_weights, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.status, 'proposal_recorded_requires_explicit_gate');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.observe.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.diagnose.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.edit.next_mechanism_candidate_ref, payload.learning_loop.online_learning_candidate.candidate_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_promote_default_agent_without_gate, false);
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.deepEqual(payload.learning_loop.baseline_receipt.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.deepEqual(payload.learning_loop.baseline_receipt.ai_reviewer_evidence.source_refs, reviewerEvaluation.source_refs);
    assert.equal(payload.learning_loop.baseline_receipt.ai_reviewer_scorecard.verdict, reviewerEvaluation.verdict);
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_critique_present,
      true,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_suggestions_present,
      true,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_source_refs_valid,
      true,
    );
    assert.equal(
      payload.learning_loop.baseline_receipt.acceptance_gates.ai_reviewer_provenance_present,
      true,
    );

    const targetDir = path.join(outputRoot, 'sample-brief-agent');
    const suitePath = path.join(outputRoot, 'agent-lab-suite.json');
    const receiptPath = path.join(outputRoot, 'baseline-delivery-receipt.json');
    const learningPath = path.join(outputRoot, 'online-learning-candidate.json');
    const mechanismPath = path.join(outputRoot, 'mechanism-patch-proposal.json');
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/domain_descriptor.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/action_catalog.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), true);
    assert.equal(fs.existsSync(suitePath), true);
    assert.equal(fs.existsSync(receiptPath), true);
    assert.equal(fs.existsSync(learningPath), true);
    assert.equal(fs.existsSync(mechanismPath), true);

    const suite = readJson(suitePath);
    assert.equal(suite.suite_id, 'opl-meta-agent-self-bootstrap-suite');
    assert.equal(suite.tasks[0].domain_id, 'opl-meta-agent');
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(reviewerEvaluationPath));
    assert.ok(suite.tasks[0].scorecard.review_refs.includes(reviewerEvaluationPath));
    assert.deepEqual(suite.tasks[0].ai_reviewer_evaluation.source_refs, reviewerEvaluation.source_refs);

    const receipt = readJson(receiptPath);
    assert.equal(receipt.receipt_class, 'baseline_delivery_receipt');
    assert.equal(receipt.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(receipt.agent_lab_result_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(receipt.status, 'baseline_delivered');
    assert.equal(receipt.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.equal(receipt.ai_reviewer_review.critique, reviewerEvaluation.critique);

    const learning = readJson(learningPath);
    assert.equal(learning.candidate_kind, 'rubric_gap');
    assert.deepEqual(learning.source_refs, [
      payload.opl_agent_lab.suite_result.result_id,
      receipt.receipt_id,
    ]);

    const mechanism = readJson(mechanismPath);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/sample-brief-agent/self-learning-loop');
    assert.equal(mechanism.version, 'opl-meta-agent.mechanism-patch-proposal.v1');
    assert.ok(mechanism.editable_surfaces.includes('prompt_policy_ref'));
    assert.ok(mechanism.editable_surfaces.includes('quality_gate_policy_ref'));
    assert.equal(mechanism.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline');
    assert.equal(mechanism.next_mechanism_candidate_ref, learning.candidate_id);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('baseline delivery fails closed when AI reviewer evaluation is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-missing-reviewer-'));
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ai reviewer evaluation/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('baseline delivery rejects empty AI reviewer critique and suggestions without signing receipt', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-empty-reviewer-'));
  const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
  writeAiReviewerEvaluation(reviewerEvaluationPath, {
    critique: ' ',
    suggestions: [],
  });
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /critique/i);
    assert.match(result.stderr, /suggestions/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

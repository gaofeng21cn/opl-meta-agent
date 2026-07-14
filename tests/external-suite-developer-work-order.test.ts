import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { JsonObject } from './support/contracts.ts';
import { validateFoundryLabSuiteResult } from '../scripts/improve-from-agent-lab-suite.ts';
import { readTargetAgent } from '../scripts/lib/meta-agent-loop-io.ts';
import {
  assertMatchesJsonSchema,
  parseJsonText,
  repoRoot,
  writeJsonFile as writeJson,
} from './support/contracts.ts';
import {
  buildFoundryExecutionResult,
  buildExternalSuite,
  runImproveFromSuite,
  withOutputRoot,
  writeAiReviewerEvaluation,
  writeTargetDescriptor,
  writeTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

const medicalPolicy = {
  triggers: ['medical manuscript', 'reviewer revision'],
  refs: ['quality_contract_ref:prediction_model_first_draft_quality'],
  paths: ['src/med_autoscience/policies/medical_reporting_checklist.py'],
  mappings: [
    { token: 'hdl', refs: ['quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization'] },
    { token: 'reviewer revision', refs: ['quality_contract_ref:prediction_model_first_draft_quality'] },
  ],
};

function runImproveCli(args: {
  suitePath: string;
  suiteResultPath: string;
  targetAgentDir: string;
  outputRoot: string;
  reviewerEvaluationPath: string;
}): JsonObject {
  const result = runImproveCliProcess(args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return parseJsonText(result.stdout);
}

function runImproveCliProcess(args: {
  suitePath: string;
  suiteResultPath: string;
  targetAgentDir: string;
  outputRoot: string;
  reviewerEvaluationPath: string;
}) {
  return spawnSync(process.execPath, [
    path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
    '--suite', args.suitePath,
    '--suite-result', args.suiteResultPath,
    '--target-agent-dir', args.targetAgentDir,
    '--ai-reviewer-evaluation', args.reviewerEvaluationPath,
  ], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function developerPatchRequest(payload: JsonObject): JsonObject {
  return payload.semantic_requests.work_order_materialization_request as JsonObject;
}

test('external blocked Agent Lab suite becomes a MAS developer patch semantic request', () => {
  withOutputRoot('oma-medical-suite-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const suiteResultPath = path.join(outputRoot, 'suite-result.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir);
    writeTargetImprovementPolicy(targetAgentDir, medicalPolicy);
    const suite = buildExternalSuite({
      suiteId: 'mas-suite:high-quality-medical-manuscript',
      domainId: 'med-autoscience',
      targetAgentDir,
      taskFamily: 'high_quality_medical_manuscript_self_evolution',
      evidenceRefs: [
        'rubric-gap:mas/002/hdl-harmonization',
        'rubric-gap:mas/002/internal-quality-language-purge',
      ],
      feedbackRefs: ['feedback-ref:mas/002/manuscript-review'],
    });
    writeJson(suitePath, suite);
    writeAiReviewerEvaluation(reviewerEvaluationPath);
    writeJson(suiteResultPath, {
      agent_lab_evaluation_work_order_execution: buildFoundryExecutionResult({
        suite,
        targetAgentDir,
      }),
    });

    const payload = runImproveCli({
      suitePath,
      suiteResultPath,
      targetAgentDir,
      outputRoot,
      reviewerEvaluationPath,
    });
    assertMatchesJsonSchema(
      'contracts/schemas/improve-from-external-agent-lab-suite.output.schema.json',
      payload,
    );
    assert.equal(payload.status, 'developer_patch_semantic_request_ready_for_opl_materialization');
    const request = developerPatchRequest(payload);
    const judgment = request.semantic_request.agent_building_judgment as JsonObject;
    const candidate = payload.agent_building_judgment.target_capability_improvement_candidate;
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'target-capability-improvement-candidate.json')), false);
    const expectedTarget = {
      domain_id: 'med-autoscience',
      target_agent_ref: 'domain-agent:med-autoscience',
      descriptor_ref: path.join(targetAgentDir, 'contracts/domain_descriptor.json'),
    };
    const expectedProvenanceRefs = [
      'evaluation-receipt:mas-suite:high-quality-medical-manuscript',
      'trajectory-observation-receipt:agent-lab-task:med-autoscience/high_quality_medical_manuscript_self_evolution',
    ];
    assert.equal(request.request_kind, 'developer_patch');
    assert.equal(request.request_owner, 'oma');
    assert.equal(request.producer_agent_id, 'oma');
    assert.equal(request.target_agent.domain_id, 'med-autoscience');
    assert.equal(request.target_agent.target_agent_ref, 'domain-agent:med-autoscience');
    assert.deepEqual(payload.evaluation_target_agent, expectedTarget);
    assert.deepEqual(payload.evaluation_provenance_refs, expectedProvenanceRefs);
    assert.deepEqual(candidate.evaluation_target_agent, expectedTarget);
    assert.deepEqual(candidate.evaluation_provenance_refs, expectedProvenanceRefs);
    assert.equal(
      payload.foundry_lab_execution_receipt_ref,
      'foundry-lab-execution-receipt:mas-suite:high-quality-medical-manuscript',
    );
    const hdlTrace = (candidate.patch_traceability_matrix as JsonObject[])
      .find((entry) => entry.gap_token === 'hdl');
    assert.ok(hdlTrace);
    assert.deepEqual(hdlTrace.required_patch_refs, [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
    ]);
    assert.deepEqual(hdlTrace.target_repo_file_hints, medicalPolicy.paths);
    assert.equal(judgment.failure_class, 'quality-gate');
    assert.match(String(judgment.source_morphology_proof_ref), /^source-morphology-proof:/);
    assert.match(String(judgment.private_residue_decision_ref), /^private-residue-decision:/);
    assert.equal(request.authority_boundary.producer_assigns_work_order_id, false);
    assert.equal(request.authority_boundary.producer_executes_work_order, false);
  });
});

test('external suite result rejects cross-suite, cross-target, cross-task, and unbound provenance', () => {
  withOutputRoot('oma-foundry-result-binding-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    writeTargetImprovementPolicy(targetAgentDir, {
      triggers: ['artifact morphology'],
      refs: ['target_agent_contract_ref:target-agent/artifact-morphology'],
      paths: ['contracts/artifact_morphology.json'],
    });
    const suite = buildExternalSuite({
      suiteId: 'target-agent-suite:identity-binding',
      domainId: 'target-agent',
      targetAgentDir,
      taskFamily: 'target_agent_feedback_self_evolution',
      evidenceRefs: ['rubric-gap:target-agent/artifact-morphology'],
      feedbackRefs: ['feedback-ref:target-agent/artifact-morphology/foundry-review'],
    });
    writeJson(suitePath, suite);
    writeAiReviewerEvaluation(reviewerEvaluationPath);
    const targetAgent = readTargetAgent(targetAgentDir);

    const scenarios: Array<{
      name: string;
      mutate: (payload: JsonObject) => void;
      expectedError: RegExp;
    }> = [
      {
        name: 'suite',
        mutate: (payload) => {
          (payload.suite_result as JsonObject).suite_id = 'target-agent-suite:other';
        },
        expectedError: /suite_id does not match/,
      },
      {
        name: 'target',
        mutate: (payload) => {
          ((payload.suite_result as JsonObject).evaluation_target_agent as JsonObject).target_agent_ref =
            'domain-agent:other-target';
        },
        expectedError: /evaluation_target_agent\.target_agent_ref does not match/,
      },
      {
        name: 'run-task',
        mutate: (payload) => {
          (((payload.suite_result as JsonObject).runs as JsonObject[])[0]).task_id =
            'agent-lab-task:other-target/other-task';
        },
        expectedError: /runs\[\]\.task_id does not match/,
      },
      {
        name: 'provenance-ref',
        mutate: (payload) => {
          ((payload.suite_result as JsonObject).refs as JsonObject).evaluation_provenance_refs =
            ['evaluation-receipt:unbound'];
        },
        expectedError: /evaluation provenance refs and bindings do not match/,
      },
      {
        name: 'provenance-task',
        mutate: (payload) => {
          const bindings = (payload.suite_result as JsonObject)
            .evaluation_provenance_bindings as JsonObject[];
          bindings[1].task_id = 'agent-lab-task:other-target/other-task';
        },
        expectedError: /evaluation_provenance_bindings\[\]\.task_id is not in the suite/,
      },
      {
        name: 'non-terminal-status',
        mutate: (payload) => {
          (payload.suite_result as JsonObject).status = 'running';
        },
        expectedError: /status must be passed or blocked/,
      },
      {
        name: 'missing-task-provenance',
        mutate: (payload) => {
          const result = payload.suite_result as JsonObject;
          const evaluationBinding = (result.evaluation_provenance_bindings as JsonObject[])[0];
          result.evaluation_provenance_bindings = [evaluationBinding];
          (result.refs as JsonObject).evaluation_provenance_refs = [evaluationBinding.receipt_ref];
        },
        expectedError: /requires task-scoped evaluation provenance binding/,
      },
      {
        name: 'duplicate-provenance-binding',
        mutate: (payload) => {
          const bindings = (payload.suite_result as JsonObject)
            .evaluation_provenance_bindings as JsonObject[];
          bindings.push(structuredClone(bindings[1]));
        },
        expectedError: /duplicate evaluation provenance binding/,
      },
    ];

    for (const scenario of scenarios) {
      const suiteResultPath = path.join(outputRoot, `${scenario.name}-result.json`);
      const resultPayload = buildFoundryExecutionResult({
        suite,
        targetAgentDir,
      });
      scenario.mutate(resultPayload);
      writeJson(suiteResultPath, resultPayload);
      assert.throws(
        () => validateFoundryLabSuiteResult(suiteResultPath, suite, targetAgent),
        scenario.expectedError,
        `${scenario.name} mismatch was accepted`,
      );
    }

    const wrongTargetSuite = structuredClone(suite);
    (wrongTargetSuite.evaluation_target_agent as JsonObject).descriptor_ref =
      path.join(outputRoot, 'other-agent/contracts/domain_descriptor.json');
    const wrongTargetSuitePath = path.join(outputRoot, 'wrong-target-suite.json');
    const wrongTargetResultPath = path.join(outputRoot, 'wrong-target-suite-result.json');
    writeJson(wrongTargetSuitePath, wrongTargetSuite);
    writeJson(wrongTargetResultPath, buildFoundryExecutionResult({ suite, targetAgentDir }));
    const wrongTargetResult = runImproveCliProcess({
      suitePath: wrongTargetSuitePath,
      suiteResultPath: wrongTargetResultPath,
      targetAgentDir,
      outputRoot: path.join(outputRoot, 'wrong-target-suite-output'),
      reviewerEvaluationPath,
    });
    assert.notEqual(wrongTargetResult.status, 0, 'cross-target suite was accepted');
    assert.match(wrongTargetResult.stderr, /input suite evaluation_target_agent\.descriptor_ref does not match/);
  });
});

test('passed Foundry result without an execution receipt cannot claim no source patch is required', () => {
  withOutputRoot('oma-foundry-result-missing-receipt-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const suiteResultPath = path.join(outputRoot, 'suite-result.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    const suite = buildExternalSuite({
      suiteId: 'target-agent-suite:passed-without-receipt',
      domainId: 'target-agent',
      targetAgentDir,
      taskFamily: 'owner_receipt_coordination',
      passed: true,
      evidenceRefs: ['owner-receipt:target-agent/accepted'],
    });
    writeJson(suitePath, suite);
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      verdict: 'accepted_no_patch_required',
      source_refs: ['owner-receipt:target-agent/accepted'],
      direct_evidence_refs: ['owner-receipt:target-agent/accepted'],
    });
    const resultPayload = buildFoundryExecutionResult({
      suite,
      targetAgentDir,
      status: 'passed',
    });
    delete resultPayload.receipt;
    resultPayload.execution_receipt_ref = 'foundry-lab-execution-receipt:wrong-root-alias';
    writeJson(suiteResultPath, resultPayload);

    const payload = runImproveCli({
      suitePath,
      suiteResultPath,
      targetAgentDir,
      outputRoot,
      reviewerEvaluationPath,
    });
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.deepEqual(payload.missing_required_fields, ['foundry_lab_execution_receipt_ref']);
    assert.equal(payload.next_stage_may_start, true);
    assert.equal(payload.foundry_lab_execution_receipt_ref, undefined);
    assert.equal(payload.semantic_requests, undefined);
  });
});

test('candidate identity ignores provenance order while work-order identity binds the execution receipt', () => {
  withOutputRoot('oma-foundry-stable-identity-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    writeTargetImprovementPolicy(targetAgentDir, {
      triggers: ['artifact morphology'],
      refs: ['target_agent_contract_ref:target-agent/artifact-morphology'],
      paths: ['contracts/artifact_morphology.json'],
    });
    const suite = buildExternalSuite({
      suiteId: 'target-agent-suite:stable-identity',
      domainId: 'target-agent',
      targetAgentDir,
      taskFamily: 'target_agent_feedback_self_evolution',
      evidenceRefs: ['rubric-gap:target-agent/artifact-morphology'],
      feedbackRefs: ['feedback-ref:target-agent/artifact-morphology/stable-identity'],
    });
    writeJson(suitePath, suite);
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const run = (name: string, resultPayload: JsonObject) => {
      const suiteResultPath = path.join(outputRoot, `${name}-result.json`);
      const runOutput = path.join(outputRoot, `${name}-output`);
      writeJson(suiteResultPath, resultPayload);
      const payload = runImproveCli({
        suitePath,
        suiteResultPath,
        targetAgentDir,
        outputRoot: runOutput,
        reviewerEvaluationPath,
      });
      return {
        candidate: payload.agent_building_judgment.target_capability_improvement_candidate,
        request: developerPatchRequest(payload),
      };
    };

    const original = buildFoundryExecutionResult({ suite, targetAgentDir });
    const originalBindings = (original.suite_result as JsonObject)
      .evaluation_provenance_bindings as JsonObject[];
    const evaluationPacketBinding = originalBindings[0];
    originalBindings.push(
      { ...evaluationPacketBinding, extension: { variant: 'a' } },
      { ...evaluationPacketBinding, extension: { variant: 'b' } },
    );
    const reordered = structuredClone(original);
    const reorderedResult = reordered.suite_result as JsonObject;
    (reorderedResult.refs as JsonObject).evaluation_provenance_refs =
      [...((reorderedResult.refs as JsonObject).evaluation_provenance_refs as string[])].reverse();
    reorderedResult.evaluation_provenance_bindings =
      [...(reorderedResult.evaluation_provenance_bindings as JsonObject[])]
        .reverse()
        .map((binding) => Object.fromEntries(Object.entries(binding).reverse()));
    const changedReceipt = structuredClone(original);
    (changedReceipt.receipt as JsonObject).foundry_lab_execution_receipt_ref =
      'foundry-lab-execution-receipt:target-agent-suite/stable-identity-retry';

    const first = run('first', original);
    const second = run('reordered', reordered);
    const third = run('changed-receipt', changedReceipt);
    assert.equal(second.candidate.candidate_id, first.candidate.candidate_id);
    assert.equal(
      second.request.semantic_request.request_id,
      first.request.semantic_request.request_id,
    );
    assert.equal(third.candidate.candidate_id, first.candidate.candidate_id);
    assert.notEqual(
      third.request.semantic_request.request_id,
      first.request.semantic_request.request_id,
    );
  });
});

test('generic target-agent feedback external suite is accepted without MAS-only profiles', () => {
  withOutputRoot('oma-generic-feedback-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    const directReview = 'feedback-evidence:target-agent/artifact-morphology/direct-review';
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    writeTargetImprovementPolicy(targetAgentDir, {
      triggers: ['artifact morphology'],
      refs: ['target_agent_contract_ref:target-agent/artifact-morphology'],
      paths: ['contracts/artifact_morphology.json'],
    });
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'target-agent-feedback-suite:artifact-morphology',
      domainId: 'target-agent',
      targetAgentDir,
      taskFamily: 'target_agent_feedback_self_evolution',
      evidenceRefs: ['rubric-gap:target-agent/artifact-morphology'],
      feedbackRefs: ['feedback-ref:target-agent/artifact-morphology/foundry-review'],
      reviewerEvidenceRefs: [directReview],
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: ['rubric-gap:target-agent/artifact-morphology'],
      direct_evidence_refs: [directReview],
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const request = developerPatchRequest(payload);
    assert.equal(payload.status, 'developer_patch_semantic_request_ready_for_opl_materialization');
    assert.equal(request.target_agent.domain_id, 'target-agent');
    assert.ok(request.semantic_request.reviewer_refs.includes(directReview));
    assert.equal(JSON.stringify(request).includes('mas_feedback_agent_lab_external_suite'), false);
  });
});

test('MAS reviewer_revision feedback external suite is accepted as developer work-order input', () => {
  withOutputRoot('oma-reviewer-revision-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    const reviewerEvidence = 'reviewer-evidence:mas/002/reviewer_revision/response-matrix';
    writeTargetDescriptor(targetAgentDir);
    writeTargetImprovementPolicy(targetAgentDir, medicalPolicy);
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'mas-suite:reviewer_revision-feedback',
      domainId: 'med-autoscience',
      targetAgentDir,
      taskFamily: 'reviewer_revision_feedback_self_evolution',
      evidenceRefs: ['rubric-gap:mas/002/internal-quality-language-purge'],
      feedbackRefs: ['feedback-ref:mas/002/reviewer_revision/mentor-round-1'],
      reviewerEvidenceRefs: [reviewerEvidence],
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: [reviewerEvidence, 'rubric-gap:mas/002/internal-quality-language-purge'],
      direct_evidence_refs: ['paper/evidence_ledger.json'],
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const request = developerPatchRequest(payload);
    assert.equal(request.target_agent.domain_id, 'med-autoscience');
    assert.ok(request.semantic_request.reviewer_refs.includes(reviewerEvidence));
    assert.ok(request.semantic_request.source_refs.includes(
      'rubric-gap:mas/002/internal-quality-language-purge',
    ));
    assert.equal(Object.hasOwn(request, 'work_order_id'), false);
  });
});

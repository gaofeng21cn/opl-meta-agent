import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { parseImproveFromAgentLabSuiteArgs } from '../scripts/improve-from-agent-lab-suite.ts';
import { readJsonFile as readJson, writeJsonFile as writeJson } from './support/contracts.ts';
import {
  buildExternalSuite,
  runImproveFromSuite,
  withOutputRoot,
  writeAiReviewerEvaluation,
  writeTargetDescriptor,
} from './support/external-suite-fixtures.ts';

function writeMedicalSuite(
  suitePath: string,
  targetAgentDir: string,
  domainId = 'med-autoscience',
  targetDescriptorRef?: string,
): void {
  writeJson(suitePath, buildExternalSuite({
    suiteId: 'mas-suite:high-quality-medical-manuscript',
    domainId,
    targetAgentDir,
    ...(targetDescriptorRef ? { targetDescriptorRef } : {}),
    taskFamily: 'high_quality_medical_manuscript_self_evolution',
    evidenceRefs: ['rubric-gap:mas/002/medical_journal_prose_quality'],
    feedbackRefs: ['feedback-ref:mas/002/manuscript-review'],
  }));
}

test('external suite improvement fails closed when AI reviewer evaluation is missing', () => {
  withOutputRoot('oma-missing-reviewer-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const suiteResultPath = path.join(outputRoot, 'suite-result.json');
    writeTargetDescriptor(targetAgentDir);
    writeMedicalSuite(suitePath, targetAgentDir);
    writeJson(suiteResultPath, {
      result_id: 'foundry-suite-result:missing-reviewer',
      status: 'blocked',
      foundry_lab_execution_receipt_ref: 'foundry-lab-execution-receipt:missing-reviewer',
    });
    assert.throws(() => parseImproveFromAgentLabSuiteArgs([
      '--suite', suitePath,
      '--suite-result', suiteResultPath,
      '--target-agent-dir', targetAgentDir,
    ]), /ai reviewer evaluation/i);
  });
});

const reviewerFailureCases = [
  { name: 'target descriptor is missing', descriptor: 'missing', reviewer: {}, expected: /Target descriptor is required: .*domain_descriptor\.json.*capability_pack_descriptor\.json/ },
  { name: 'target descriptor domain_id is missing', descriptor: 'missing-id', reviewer: {}, expected: /missing domain_id or capability_pack_id/ },
  { name: 'AI reviewer predicted impact is missing', descriptor: 'valid', reviewer: { predicted_impact: '' }, expected: /predicted_impact must be a non-empty string/ },
  { name: 'reviewer direct evidence is scaffold-only', descriptor: 'valid', reviewer: { direct_evidence_refs: ['suite:mas/generated-scaffold'] }, expected: /direct_evidence_refs must include direct evidence beyond suite\/scaffold refs/ },
];

for (const testCase of reviewerFailureCases) {
  test(`external suite improvement fails closed when ${testCase.name}`, () => {
    withOutputRoot('oma-reviewer-gate-', (outputRoot) => {
      const targetAgentDir = path.join(outputRoot, 'med-autoscience');
      const suitePath = path.join(outputRoot, 'suite.json');
      const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
      if (testCase.descriptor === 'valid') writeTargetDescriptor(targetAgentDir);
      if (testCase.descriptor === 'missing-id') {
        writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), { domain_label: 'MedAutoScience' });
      }
      if (testCase.descriptor === 'missing') fs.mkdirSync(targetAgentDir, { recursive: true });
      writeMedicalSuite(suitePath, targetAgentDir);
      writeAiReviewerEvaluation(reviewerEvaluationPath, testCase.reviewer);

      assert.throws(
        () => runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath }),
        testCase.expected,
      );
    });
  });
}

test('external suite improvement accepts capability pack target descriptor', () => {
  withOutputRoot('oma-capability-pack-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'mas-scholar-skills');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeJson(path.join(targetAgentDir, 'contracts/capability_pack_descriptor.json'), {
      surface_kind: 'capability_pack_descriptor',
      capability_pack_id: 'mas-scholar-skills',
    });
    writeJson(path.join(targetAgentDir, 'contracts/capability_map.json'), {
      capabilities: [{
        capability_id: 'medical-manuscript-writing',
        kind: 'professional_skill',
        canonical_paths: ['skills/medical-manuscript-writing/SKILL.md'],
        improvement_tokens: ['medical_journal_prose_quality'],
        verification_refs: ['target_repo_test_receipt'],
        forbidden_surfaces: ['target owner receipt body'],
      }],
    });
    writeMedicalSuite(
      suitePath,
      targetAgentDir,
      'mas-scholar-skills',
      path.join(targetAgentDir, 'contracts/capability_pack_descriptor.json'),
    );
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const workOrder = payload.agent_building_judgment.developer_patch_work_order;
    assert.equal(workOrder.target_agent.domain_id, 'mas-scholar-skills');
    assert.deepEqual(workOrder.proposed_change_refs, ['professional_skill_medical_manuscript_writing']);
    assert.deepEqual(workOrder.target_repo_file_hints, ['skills/medical-manuscript-writing/SKILL.md']);
  });
});

test('external suite improvement uses capability map as patch-target source when handoff duplicates token refs', () => {
  withOutputRoot('oma-capability-map-source-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir);
    writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
      external_suite_improvement_policy: {
        change_ref_mappings: [{
          token: 'medical_journal_prose_quality',
          refs: ['legacy_handoff_patch_ref:must_not_be_used'],
        }],
        external_learning_refs: ['external-source:legacy-handoff/context-only'],
      },
    });
    writeJson(path.join(targetAgentDir, 'contracts/capability_map.json'), {
      capabilities: [{
        capability_id: 'medical-journal-prose-quality',
        kind: 'professional_skill',
        canonical_paths: ['skills/medical-journal-prose-quality/SKILL.md'],
        improvement_tokens: ['medical_journal_prose_quality'],
        verification_refs: ['target_repo_test_receipt'],
        forbidden_surfaces: ['target owner receipt body'],
      }],
    });
    writeMedicalSuite(suitePath, targetAgentDir);
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const candidate = payload.agent_building_judgment.target_capability_improvement_candidate;
    assert.deepEqual(candidate.proposed_change_refs, ['professional_skill_medical_journal_prose_quality']);
    assert.deepEqual(candidate.patch_traceability_matrix[0].target_repo_file_hints, [
      'skills/medical-journal-prose-quality/SKILL.md',
    ]);
    assert.deepEqual(candidate.external_learning_refs, ['external-source:legacy-handoff/context-only']);
    assert.equal(JSON.stringify(candidate).includes('legacy_handoff_patch_ref:must_not_be_used'), false);
  });
});

test('external blocked suite emits a blocker ref when target-owned improvement policy is missing', () => {
  withOutputRoot('oma-missing-target-policy-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir);
    writeMedicalSuite(suitePath, targetAgentDir);
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const candidate = readJson(payload.artifacts.target_capability_improvement_candidate_path);
    assert.equal(payload.status, 'candidate_blocked_missing_declarative_work_order_inputs');
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'typed-blocker.json')), false);
    assert.deepEqual(candidate.proposed_change_refs, []);
    assert.equal(candidate.traceability_status, 'target_owned_patch_refs_missing');
    assert.match(candidate.expected_typed_blocker_ref, /^expected-typed-blocker-ref:/);
    assert.equal(payload.authority_boundary.executable_work_order_materialized, false);
  });
});

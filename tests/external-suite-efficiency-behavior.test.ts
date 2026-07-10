import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { readJsonFile as readJson, writeJsonFile as writeJson } from './support/contracts.ts';
import {
  buildExternalSuite,
  runImproveFromSuite,
  withOutputRoot,
  writeAiReviewerEvaluation,
  writeTargetDescriptor,
  writeTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

const efficiencyRefs = {
  quality_floor_refs: ['quality-floor:target-agent/current-behavior-gate'],
  latency_baseline_refs: ['latency-baseline:target-agent/p50-p95-before'],
  usage_cost_refs: ['usage-cost:target-agent/token-cost-before'],
  cache_reuse_refs: ['cache-reuse:target-agent/reused-prefix-cache'],
  target_verification_refs: ['target-verification:target-agent/efficiency-redrive'],
};

test('external suite efficiency evidence is projected into developer work order refs', () => {
  withOutputRoot('oma-efficiency-suite-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    writeTargetImprovementPolicy(targetAgentDir, {
      triggers: ['efficiency', 'latency', 'usage cost', 'cache reuse'],
      refs: ['target_agent_efficiency_policy_ref:target-agent/non-regression-quality-floor'],
      paths: ['src/runtime/efficiency-policy.ts'],
    });
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'target-agent-suite:efficiency-non-regression',
      domainId: 'target-agent',
      targetAgentDir,
      taskFamily: 'target_agent_generic_efficiency_work_order',
      evidenceRefs: Object.values(efficiencyRefs).flat(),
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: Object.values(efficiencyRefs).flat(),
      direct_evidence_refs: efficiencyRefs.target_verification_refs,
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(payload.status, 'developer_patch_work_order_ready_for_opl_foundry_lab');
    assert.deepEqual(workOrder.efficiency_non_regression_refs, efficiencyRefs);
    assert.equal(workOrder.implementation_controls.quality_floor_non_regression_required, true);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  });
});

test('external suite efficiency evidence without quality floor emits a blocker ref without a blocker body', () => {
  withOutputRoot('oma-efficiency-blocker-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    const refsWithoutFloor = Object.entries(efficiencyRefs)
      .filter(([field]) => field !== 'quality_floor_refs')
      .flatMap(([, refs]) => refs);
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'target-agent-suite:efficiency-non-regression',
      domainId: 'target-agent',
      targetAgentDir,
      taskFamily: 'target_agent_generic_efficiency_work_order',
      evidenceRefs: refsWithoutFloor,
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: refsWithoutFloor,
      direct_evidence_refs: ['target-verification:target-agent/efficiency-redrive'],
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    assert.equal(payload.status, 'candidate_blocked_missing_declarative_work_order_inputs');
    assert.equal(fs.existsSync(path.join(outputRoot, 'mechanism-patch-proposal.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'typed-blocker.json')), false);
    const candidate = readJson(payload.artifacts.target_capability_improvement_candidate_path);
    assert.deepEqual(candidate.missing_required_fields, [
      'efficiency_non_regression_refs.quality_floor_refs',
      'target_improvement_policy.proposed_change_refs',
      'target_improvement_policy.patch_traceability_matrix',
    ]);
    assert.match(candidate.expected_typed_blocker_ref, /^expected-typed-blocker-ref:/);
    assert.equal(payload.authority_boundary.typed_blocker_body_materialized_by_oma, false);
    assert.equal(payload.authority_boundary.executable_work_order_materialized, false);
  });
});

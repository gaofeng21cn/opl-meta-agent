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
      taskFamily: 'target_agent_generic_efficiency_work_order',
      evidenceRefs: Object.values(efficiencyRefs).flat(),
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: Object.values(efficiencyRefs).flat(),
      direct_evidence_refs: efficiencyRefs.target_verification_refs,
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    assert.deepEqual(workOrder.efficiency_non_regression_refs, efficiencyRefs);
    assert.equal(workOrder.implementation_controls.quality_floor_non_regression_required, true);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  });
});

test('external suite efficiency evidence without quality floor fails closed with typed blocker', () => {
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
      taskFamily: 'target_agent_generic_efficiency_work_order',
      evidenceRefs: refsWithoutFloor,
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: refsWithoutFloor,
      direct_evidence_refs: ['target-verification:target-agent/efficiency-redrive'],
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    assert.equal(payload.status, 'blocked_efficiency_quality_floor_missing');
    assert.equal(fs.existsSync(path.join(outputRoot, 'mechanism-patch-proposal.json')), false);
    const blocker = readJson(payload.artifacts.typed_blocker_path);
    assert.equal(blocker.blocked_reason, 'efficiency_evidence_requires_quality_floor_refs');
    assert.deepEqual(blocker.missing_required_fields, [
      'efficiency_non_regression_refs.quality_floor_refs',
    ]);
    assert.equal(blocker.authority_boundary.no_executable_work_order_issued, true);
  });
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { JsonObject } from './support/contracts.ts';
import {
  oplBin,
  writeJsonFile as writeJson,
  readJsonFile as readJson,
} from './support/contracts.ts';
import test from 'node:test';
import {
  runImproveArgs,
  buildBlockedEfficiencySuite,
  writeEfficiencyTargetImprovementPolicy,
  writeEfficiencyReviewerEvaluation,
} from './support/external-suite-fixtures.ts';

test('external suite efficiency evidence is projected into developer work order refs', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-efficiency-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'generic_target_agent',
    });
    writeEfficiencyTargetImprovementPolicy(targetAgentDir);
    writeJson(path.join(targetAgentDir, 'contracts/capability_map.json'), {
      surface_kind: 'target_capability_map',
      failure_token_registry_ref: 'failure-token-registry:target-agent/efficiency',
      capabilities: [
        {
          capability_id: 'target-agent.efficiency-runtime',
          capability_kind: 'contract_module',
          canonical_paths: ['src/runtime/efficiency-policy.ts'],
          improvement_tokens: ['efficiency', 'latency', 'usage cost', 'cache reuse'],
          verification_refs: ['target-verification:target-agent/capability-map-efficiency-redrive'],
          forbidden_surfaces: ['target_quality_verdict_body'],
          authority_boundary: {
            can_write_target_owner_receipt_body: false,
            can_create_target_typed_blocker: false,
          },
        },
      ],
    });
    const suitePath = path.join(outputRoot, 'efficiency-suite.json');
    writeJson(suitePath, buildBlockedEfficiencySuite());
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeEfficiencyReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.quality_floor_refs, [
      'quality-floor:target-agent/current-behavior-gate',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.latency_baseline_refs, [
      'latency-baseline:target-agent/p50-p95-before',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.usage_cost_refs, [
      'usage-cost:target-agent/token-cost-before',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.cache_reuse_refs, [
      'cache-reuse:target-agent/reused-prefix-cache',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.target_verification_refs, [
      'target-verification:target-agent/efficiency-redrive',
    ]);
    assert.deepEqual(
      workOrder.work_order_completeness.efficiency_non_regression_refs,
      workOrder.efficiency_non_regression_refs,
    );
    assert.deepEqual(
      workOrder.machine_closeout_refs.efficiency_non_regression_refs,
      workOrder.efficiency_non_regression_refs,
    );
    assert.ok(workOrder.required_verification_refs.includes('target-verification:target-agent/efficiency-redrive'));
    assert.ok(
      workOrder.required_verification_refs.includes(
        'target-verification:target-agent/capability-map-efficiency-redrive',
      ),
    );
    assert.deepEqual(workOrder.matched_capability_ids, ['target-agent.efficiency-runtime']);
    assert.deepEqual(workOrder.canonical_target_paths, ['src/runtime/efficiency-policy.ts']);
    assert.deepEqual(workOrder.failure_token_registry_refs, ['failure-token-registry:target-agent/efficiency']);
    assert.ok(workOrder.improvement_tokens.includes('usage cost'));
    assert.ok(workOrder.forbidden_target_paths_or_surfaces.includes('target_quality_verdict_body'));
    assert.equal(workOrder.owner_closeout_boundary.oma_can_write_target_owner_receipt_body, false);
    assert.equal(workOrder.owner_closeout_boundary.oma_can_create_target_typed_blocker, false);
    assert.equal(workOrder.implementation_controls.quality_floor_non_regression_required, true);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite efficiency evidence without quality floor fails closed with typed blocker', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-efficiency-blocker-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'generic_target_agent',
    });
    const suite = buildBlockedEfficiencySuite();
    ((suite.tasks as JsonObject[])[0].improvement_candidate as JsonObject).efficiency_evidence_refs = {
      latency_baseline_refs: ['latency-baseline:target-agent/p50-p95-before'],
      usage_cost_refs: ['usage-cost:target-agent/token-cost-before'],
      cache_reuse_refs: ['cache-reuse:target-agent/reused-prefix-cache'],
      target_verification_refs: ['target-verification:target-agent/efficiency-redrive'],
    };
    const suitePath = path.join(outputRoot, 'efficiency-suite.json');
    writeJson(suitePath, suite);
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeEfficiencyReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: [
        'latency-baseline:target-agent/p50-p95-before',
        'usage-cost:target-agent/token-cost-before',
      ],
      direct_evidence_refs: ['target-verification:target-agent/efficiency-redrive'],
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.status, 'blocked_efficiency_quality_floor_missing');
    assert.equal(fs.existsSync(path.join(outputRoot, 'mechanism-patch-proposal.json')), false);
    const typedBlocker = readJson(payload.artifacts.typed_blocker_path);
    assert.equal(typedBlocker.blocked_reason, 'efficiency_evidence_requires_quality_floor_refs');
    assert.ok(typedBlocker.missing_required_fields.includes('efficiency_non_regression_refs.quality_floor_refs'));
    assert.deepEqual(typedBlocker.efficiency_non_regression_refs.latency_baseline_refs, [
      'latency-baseline:target-agent/p50-p95-before',
    ]);
    assert.equal(typedBlocker.authority_boundary.no_executable_work_order_issued, true);
    assert.equal(typedBlocker.authority_boundary.can_authorize_target_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

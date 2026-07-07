import test from 'node:test';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  assert,
  fs,
  oplBin,
  os,
  path,
  readJsonFile as readJson,
  repoRoot,
  spawnSync,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

function writeAiReviewerEvaluation(filePath: string): void {
  writeJson(filePath, {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/redcube-ai/efficiency-handoff',
    execution_attempt_ref: 'attempt:executor/redcube-ai/efficiency-handoff',
    review_attempt_ref: 'attempt:ai-reviewer/redcube-ai/efficiency-handoff',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The efficiency handoff preserves refs-only quality floor evidence while exposing latency, cost, cache and reuse refs.',
    suggestions: [
      'Generate a developer work order that preserves screenshot review and export gates while optimizing redundant review calls.',
    ],
    source_refs: [
      'contracts/production_acceptance/efficiency-handoff-projection.json',
    ],
    direct_evidence_refs: [
      'target-verification:redcube-ai/typecheck',
      'target-verification:redcube-ai/test-fast',
    ],
    verdict: 'blocked_requires_developer_patch',
    predicted_impact: 'The target agent can reduce redundant review latency while preserving quality and export authority gates.',
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/redcube-ai/efficiency-handoff',
      reviewer_prompt_ref: 'instructions:redcube-ai/efficiency-handoff-ai-reviewer',
      created_by: 'test-fixture',
    },
  });
}

function buildEfficiencyHandoffSuite(): JsonObject {
  return {
    suite_id: 'redcube-ai.efficiency-observability.standard.v1',
    suite_kind: 'standard',
    required_observations: [],
    tasks: [
      {
        task_id: 'agent-lab-task:redcube-ai/efficiency-handoff',
        domain_id: 'redcube-ai',
        task_family: 'target_agent_efficiency_non_regression',
        environment: {
          environment_kind: 'local_workspace',
          workspace_locator_ref: 'workspace-locator:redcube-ai/efficiency',
          sandbox_policy: 'refs_only_no_artifact_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:redcube-ai/efficiency-handoff',
        agent_entry_ref: 'domain-agent-entry:redcube-ai',
        stage_refs: ['stage:redcube-ai/screenshot-review-speedup'],
        oracle_refs: ['oracle:redcube-ai/quality-floor-non-regression'],
        scorer_refs: ['scorer:redcube-ai/efficiency-non-regression'],
        recovery_probes: [],
        trajectory: {
          trajectory_ref: 'trajectory:redcube-ai/efficiency-handoff',
          run_ref: 'run:redcube-ai/efficiency-handoff',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:redcube-ai/efficiency-handoff'],
          tool_call_refs: ['tool-call:redcube-ai/efficiency-read'],
          artifact_refs: ['workspace-runtime-ref:route-summary:run-1#/elapsed_ms'],
          receipt_refs: ['target-verification:redcube-ai/typecheck'],
          repair_refs: ['efficiency-gap:redcube-ai/redundant-review-calls'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:redcube-ai/efficiency-handoff',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: false,
          metric_refs: ['workspace-runtime-ref:route-summary:run-1#/elapsed_ms'],
          evidence_refs: ['workspace-runtime-ref:screenshot_review:run-1'],
          review_refs: ['review-ref:redcube-ai/efficiency-reviewer'],
          quality_gate_refs: ['workspace-runtime-ref:review-export:run-1'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:redcube-ai/efficiency-handoff',
          candidate_kind: 'efficiency_non_regression',
          target_ref: 'domain-agent:redcube-ai/efficiency-handoff',
          evidence_refs: ['workspace-runtime-ref:route-summary:run-1#/cache_status'],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:redcube-ai/efficiency-handoff',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:redcube-ai/efficiency-handoff',
          gate_status: 'blocked',
          required_refs: ['workspace-runtime-ref:review-export:run-1'],
          regression_suite_refs: ['regression-suite:redcube-ai/efficiency-handoff'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:redcube-ai/efficiency-handoff'],
        },
      },
    ],
    target_agent_efficiency_handoff_projection: {
      surface_kind: 'target_agent_efficiency_handoff_projection',
      owner: 'target_agent',
      consumer: 'opl_agent_lab',
      refs_only: true,
      efficiency_signal_refs: {
        duration_refs: ['workspace-runtime-ref:route-summary:run-1#/elapsed_ms'],
        cost_refs: ['workspace-runtime-ref:route-summary:run-1#/cost_summary'],
        cache_refs: ['workspace-runtime-ref:route-summary:run-1#/cache_status'],
        reuse_refs: ['workspace-runtime-ref:route-artifact:run-1#/render_execution/reused_slide_ids'],
        export_result_refs: ['workspace-runtime-ref:export-result:run-1'],
      },
      quality_floor_refs: {
        review_export_gate_refs: ['workspace-runtime-ref:review-export:run-1'],
        screenshot_review_gate_refs: ['workspace-runtime-ref:screenshot_review:run-1'],
        visual_memory_authority_refs: ['redcube product manifest#/domain_memory_descriptor_locator/memory_locator'],
        owner_receipt_refs: ['rca-owner-receipt:visual-stage:run-1'],
        export_authority_refs: ['contracts/artifact_locator_contract.json'],
      },
      authority_boundary: {
        no_forbidden_write: true,
        opl_agent_lab_can_authorize_quality_verdict: false,
      },
    },
  };
}

test('external suite efficiency handoff context plus target policy becomes a developer work order', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-efficiency-handoff-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'redcube-ai');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'redcube-ai',
      domain_label: 'RedCube AI',
      delivery_domain: 'visual_deliverable',
    });
    writeJson(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
      surface_kind: 'target_owned_explicit_improvement_policy',
      owner: 'RedCube AI',
      meta_agent_work_order_contract: {
        default_change_ref_triggers: [
          'efficiency',
          'redundant review',
          'latency',
        ],
        default_change_refs: [
          'target_agent_efficiency_policy_ref:redcube-ai/redundant-review-calls',
          'target_agent_runtime_contract_ref:redcube-ai/route-summary-cache-reuse',
          'target_agent_regression_suite_ref:redcube-ai/efficiency-handoff',
        ],
        capability_id: 'redcube-ai.efficiency-runtime',
        canonical_paths: [
          'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/visual-pack-compiler-handoff.ts',
          'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/native-ppt.ts',
          'tests/opl-family-contract-adoption.test.ts',
        ],
        verification_refs: ['target-verification:redcube-ai/typecheck'],
        forbidden_target_paths_or_surfaces: [
          'target quality verdict bodies',
          'target export authority',
        ],
        authority_boundary: {
          can_write_target_owner_receipt_body: false,
        },
        change_ref_mappings: [
          {
            token: 'redundant-review',
            refs: [
              'target_agent_efficiency_policy_ref:redcube-ai/redundant-review-calls',
            ],
          },
          {
            token: 'screenshot-review',
            refs: [
              'target_agent_runtime_contract_ref:redcube-ai/screenshot-review-gate',
            ],
          },
        ],
        patch_surface_hints: {
          target_agent_efficiency_policy_ref: [
            'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/visual-pack-compiler-handoff.ts',
          ],
          target_agent_runtime_contract_ref: [
            'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/native-ppt.ts',
          ],
          target_agent_regression_suite_ref: [
            'tests/opl-family-contract-adoption.test.ts',
          ],
        },
      },
    });
    writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
      surface_kind: 'domain_agent_lab_efficiency_evidence_handoff',
      domain_id: 'redcube-ai',
      owner: 'RedCube AI',
      handoff_status: 'ready_for_opl_meta_agent_efficiency_work_order',
      external_suite_improvement_policy: {
        runtime_required_surface_refs: [
          'target_agent_efficiency_handoff_projection',
          'target_agent_owner_route',
        ],
        forbidden_target_paths_or_surfaces: [
          'target quality verdict bodies',
          'target export authority',
        ],
        runtime_expected_outcomes: [
          'RedCube runtime projection preserves screenshot review and export authority while reducing redundant review calls',
        ],
      },
    });
    const suitePath = path.join(outputRoot, 'efficiency-suite.json');
    writeJson(suitePath, buildEfficiencyHandoffSuite());
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath);

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
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
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
    const payload = JSON.parse(result.stdout) as JsonObject;
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.latency_baseline_refs, [
      'workspace-runtime-ref:route-summary:run-1#/elapsed_ms',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.usage_cost_refs, [
      'workspace-runtime-ref:route-summary:run-1#/cost_summary',
    ]);
    assert.ok(workOrder.efficiency_non_regression_refs.cache_reuse_refs.includes(
      'workspace-runtime-ref:route-summary:run-1#/cache_status',
    ));
    assert.ok(workOrder.efficiency_non_regression_refs.cache_reuse_refs.includes(
      'workspace-runtime-ref:route-artifact:run-1#/render_execution/reused_slide_ids',
    ));
    assert.ok(workOrder.efficiency_non_regression_refs.quality_floor_refs.includes(
      'workspace-runtime-ref:review-export:run-1',
    ));
    assert.ok(workOrder.efficiency_non_regression_refs.quality_floor_refs.includes(
      'workspace-runtime-ref:screenshot_review:run-1',
    ));
    assert.ok(workOrder.required_verification_refs.includes('target-verification:redcube-ai/typecheck'));
    assert.equal(workOrder.implementation_controls.quality_floor_non_regression_required, true);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

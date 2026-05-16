#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

function parseArgs(argv) {
  const parsed = {
    outputDir: null,
    oplBin: process.env.OPL_BIN ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === '--output-dir') {
      if (!value) {
        throw new Error('Missing value for --output-dir.');
      }
      parsed.outputDir = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--opl-bin') {
      if (!value) {
        throw new Error('Missing value for --opl-bin.');
      }
      parsed.oplBin = path.resolve(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}.`);
  }

  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-bootstrap-'));
  return parsed;
}

function runOpl(oplBin, args) {
  const result = spawnSync(oplBin, args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      NODE_NO_WARNINGS: '1',
    },
  });

  if (result.status !== 0) {
    throw new Error(`OPL command failed: ${oplBin} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`OPL command did not return JSON: ${oplBin} ${args.join(' ')}\n${result.stdout}\n${error.message}`);
  }
}

function stableId(prefix, payload) {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  return `${prefix}_${hash}`;
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function buildAgentLabSuite(targetAgentDir) {
  return {
    suite_id: 'opl-meta-agent-self-bootstrap-suite',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:opl-meta-agent/sample-brief-agent-baseline',
        domain_id: 'opl-meta-agent',
        task_family: 'agent_building_baseline',
        environment: {
          environment_kind: 'fixture',
          workspace_locator_ref: `workspace-locator:${targetAgentDir}`,
          sandbox_policy: 'fixture_only_no_artifact_mutation',
          network_policy: 'offline',
        },
        instructions_ref: 'instructions:opl-meta-agent/sample-brief-agent',
        agent_entry_ref: 'domain-agent-entry:sample-brief-agent',
        stage_refs: ['stage:sample-brief-agent/intake', 'stage:sample-brief-agent/draft'],
        oracle_refs: ['oracle:opl-meta-agent/baseline-contract-valid'],
        scorer_refs: ['scorer:opl-meta-agent/baseline-acceptance'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:opl-meta-agent/resume-after-interruption',
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: ['receipt:opl-meta-agent/resume-fixture'],
          },
          {
            probe_ref: 'recovery-probe:opl-meta-agent/retry-after-tool-failure',
            probe_kind: 'retry_after_tool_failure',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: ['receipt:opl-meta-agent/retry-fixture'],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:opl-meta-agent/sample-brief-agent-baseline',
          run_ref: 'run:opl-meta-agent/sample-brief-agent-baseline',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:opl-meta-agent/sample-brief-agent-baseline'],
          tool_call_refs: ['tool-call:opl-agents-scaffold', 'tool-call:opl-agent-lab-run'],
          artifact_refs: ['artifact-ref:sample-brief-agent/package'],
          receipt_refs: ['owner-receipt:opl-meta-agent/baseline-delivery'],
          repair_refs: ['repair-ref:opl-meta-agent/no-current-repair'],
          trace_refs: ['trace-ref:opl-meta-agent/self-bootstrap-fixture'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:opl-meta-agent/baseline-acceptance',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: true,
          metric_refs: ['metric-ref:descriptor-valid', 'metric-ref:agent-lab-suite-valid'],
          evidence_refs: ['evidence-ref:sample-brief-agent/scaffold-validation'],
          review_refs: ['review-ref:opl-meta-agent/baseline-review'],
          quality_gate_refs: ['quality-gate:opl-meta-agent/baseline-owner'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:opl-meta-agent/rubric-gap-tightening',
          candidate_kind: 'rubric_gap',
          target_ref: 'quality-gate:opl-meta-agent/baseline-owner',
          evidence_refs: ['failure-taxonomy:opl-meta-agent/no-current-failure-fixture'],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:opl-meta-agent/sample-brief-agent',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:opl-meta-agent/sample-brief-agent',
          gate_status: 'passed',
          required_refs: ['quality-scorecard:opl-meta-agent/baseline-acceptance'],
          regression_suite_refs: ['regression-suite:opl-meta-agent/self-bootstrap'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:opl-meta-agent/self-bootstrap'],
        },
      },
    ],
  };
}

function buildBaselineReceipt(targetAgent, suiteResult, scaffoldValidation) {
  const receiptSeed = {
    targetAgent,
    result_id: suiteResult.result_id,
    validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
  };
  return {
    surface_kind: 'opl_meta_agent_owner_receipt',
    receipt_class: 'baseline_delivery_receipt',
    receipt_id: stableId('oma_receipt', receiptSeed),
    status: 'baseline_delivered',
    product_id: 'opl-meta-agent',
    meta_agent_kind: 'opl_compatible_meta_agent',
    target_agent: targetAgent,
    scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
    agent_lab_result_ref: suiteResult.result_id,
    acceptance_gates: {
      descriptor_valid: true,
      direct_and_hosted_path_declared: true,
      agent_lab_suite_passed: suiteResult.status === 'passed',
      recovery_probes_passed: suiteResult.summary.recovery_probe_count === suiteResult.summary.recovery_passed_count,
      no_forbidden_write_proof_passed: suiteResult.summary.forbidden_authority_flag_count === 0,
      domain_authority_boundary_explicit: true,
      operator_runbook_present: true,
    },
    forbidden_claims: [],
    authority_boundary: {
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

function buildLearningCandidate(suiteResult, baselineReceipt) {
  return {
    surface_kind: 'opl_meta_agent_online_learning_candidate',
    candidate_id: stableId('oma_candidate', [suiteResult.result_id, baselineReceipt.receipt_id]),
    candidate_kind: 'rubric_gap',
    status: 'candidate_recorded_requires_explicit_gate',
    target_ref: 'quality-gate:opl-meta-agent/baseline-owner',
    source_refs: [suiteResult.result_id, baselineReceipt.receipt_id],
    proposed_change_refs: ['candidate-ref:sample-brief-agent/add-source-coverage-rubric'],
    promotion_gate_ref: 'promotion-gate:opl-meta-agent/sample-brief-agent',
    online_learning_policy: {
      can_promote_without_gate: false,
      can_train_or_deploy_model_weights: false,
      can_write_domain_memory_body: false,
      reward_authority: 'domain_owned_scorecard_or_human_owner_label',
    },
  };
}

function main() {
  const { outputDir, oplBin } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(outputDir, { recursive: true });

  const targetAgent = {
    domain_id: 'sample-brief-agent',
    domain_label: 'Sample Brief Agent',
    delivery_domain: 'knowledge_briefing',
  };
  const targetAgentDir = path.join(outputDir, targetAgent.domain_id);
  const suitePath = path.join(outputDir, 'agent-lab-suite.json');
  const receiptPath = path.join(outputDir, 'baseline-delivery-receipt.json');
  const learningPath = path.join(outputDir, 'online-learning-candidate.json');

  const scaffold = runOpl(oplBin, [
    'agents',
    'scaffold',
    '--target-dir',
    targetAgentDir,
    '--domain-id',
    targetAgent.domain_id,
    '--domain-label',
    targetAgent.domain_label,
    '--force',
    '--json',
  ]);
  const scaffoldValidation = runOpl(oplBin, [
    'agents',
    'scaffold',
    '--validate',
    targetAgentDir,
    '--json',
  ]);

  const suite = buildAgentLabSuite(targetAgentDir);
  writeJson(suitePath, suite);
  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result;

  const baselineReceipt = buildBaselineReceipt(targetAgent, suiteResult, scaffoldValidation);
  const learningCandidate = buildLearningCandidate(suiteResult, baselineReceipt);
  writeJson(receiptPath, baselineReceipt);
  writeJson(learningPath, learningCandidate);

  const payload = {
    surface_kind: 'opl_meta_agent_self_learning_loop_result',
    version: 'opl-meta-agent.self-learning-loop.v1',
    status: suiteResult.status === 'passed' ? 'passed' : 'blocked',
    product_id: 'opl-meta-agent',
    meta_agent_kind: 'opl_compatible_meta_agent',
    target_agent: {
      ...targetAgent,
      repo_dir: targetAgentDir,
      scaffold_status: scaffold.standard_domain_agent_scaffold.state,
      scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
    },
    artifacts: {
      suite_path: suitePath,
      baseline_delivery_receipt_path: receiptPath,
      online_learning_candidate_path: learningPath,
    },
    opl_agent_lab: agentLabRun.agent_lab_run,
    learning_loop: {
      baseline_receipt: baselineReceipt,
      online_learning_candidate: learningCandidate,
      online_learning_policy: learningCandidate.online_learning_policy,
    },
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

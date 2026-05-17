#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildAgentLabSuite as buildExternalSuite,
  buildLearningCandidate as buildGatedLearningCandidate,
  buildMechanismPatchProposal,
  buildOwnerReceipt,
  resolveOplBin,
  runOpl,
  writeJson,
} from './lib/meta-agent-loop.mjs';

function parseArgs(argv) {
  const parsed = {
    outputDir: null,
    oplBin: resolveOplBin(),
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
      parsed.oplBin = resolveOplBin(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}.`);
  }

  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-bootstrap-'));
  return parsed;
}

function buildAgentLabSuite(targetAgentDir) {
  return buildExternalSuite({
    suiteId: 'opl-meta-agent-self-bootstrap-suite',
    taskId: 'agent-lab-task:opl-meta-agent/sample-brief-agent-baseline',
    taskFamily: 'agent_building_baseline',
    targetAgent: {
      domain_id: 'sample-brief-agent',
      domain_label: 'Sample Brief Agent',
      delivery_domain: 'knowledge_briefing',
      descriptor_ref: path.join(targetAgentDir, 'contracts', 'domain_descriptor.json'),
    },
    targetAgentDir,
    instructionsRef: 'instructions:opl-meta-agent/sample-brief-agent',
    agentEntryRef: 'domain-agent-entry:sample-brief-agent',
    stageRefs: ['stage:sample-brief-agent/intake', 'stage:sample-brief-agent/draft'],
    oracleRefs: ['oracle:opl-meta-agent/baseline-contract-valid'],
    scorerRefs: ['scorer:opl-meta-agent/baseline-acceptance'],
    trajectoryRef: 'trajectory:opl-meta-agent/sample-brief-agent-baseline',
    runRef: 'run:opl-meta-agent/sample-brief-agent-baseline',
    artifactRefs: ['artifact-ref:sample-brief-agent/package'],
    receiptRefs: ['owner-receipt:opl-meta-agent/baseline-delivery'],
    scorecardRef: 'quality-scorecard:opl-meta-agent/baseline-acceptance',
    metricRefs: ['metric-ref:descriptor-valid', 'metric-ref:agent-lab-suite-valid'],
    evidenceRefs: ['evidence-ref:sample-brief-agent/scaffold-validation'],
    reviewRefs: ['review-ref:opl-meta-agent/baseline-review'],
    qualityGateRefs: ['quality-gate:opl-meta-agent/baseline-owner'],
    improvementCandidateRef: 'improvement-candidate:opl-meta-agent/rubric-gap-tightening',
    improvementCandidateKind: 'rubric_gap',
    improvementTargetRef: 'quality-gate:opl-meta-agent/baseline-owner',
    promotionGateRef: 'promotion-gate:opl-meta-agent/sample-brief-agent',
    regressionSuiteRefs: ['regression-suite:opl-meta-agent/self-bootstrap'],
  });
}

function writeSampleAgentDomainPack(targetAgentDir) {
  writeJson(path.join(targetAgentDir, 'contracts', 'action_catalog.json'), {
    surface_kind: 'family_action_catalog',
    version: 'family-action-catalog.v1',
    catalog_id: 'sample_brief_agent_action_catalog',
    target_domain_id: 'sample-brief-agent',
    owner: 'Sample Brief Agent',
    authority_boundary: {
      opl_role: 'generated_interface_projection_only',
      domain_truth_owner: 'Sample Brief Agent',
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      domain_repo_can_own_generated_surface: false,
    },
    actions: [
      {
        action_id: 'draft-brief',
        title: 'Draft Brief',
        summary: 'Draft a source-grounded knowledge brief from declared workspace refs.',
        owner: 'Sample Brief Agent',
        effect: 'mutating',
        source_command: {
          command: 'sample-brief-agent draft --workspace-root <workspace_root>',
          surface_kind: 'domain_cli',
        },
        input_schema_ref: 'contracts/schemas/draft-brief.input.schema.json',
        output_schema_ref: 'contracts/schemas/draft-brief.output.schema.json',
        workspace_locator_fields: ['workspace_root'],
        human_gate_ids: ['brief_owner_review'],
        supported_surfaces: {
          cli: {
            command: 'sample-brief-agent draft --workspace-root <workspace_root>',
            surface_kind: 'domain_cli',
          },
          mcp: {
            tool_name: 'sample_brief_agent_draft_brief',
            surface_kind: 'opl_generated_mcp_descriptor',
            descriptor_only: true,
            public_runtime: false,
          },
          skill: {
            command_contract_id: 'sample-brief-agent.draft-brief',
            surface_kind: 'opl_generated_skill_contract',
          },
          product_entry: {
            action_key: 'draft-brief',
            command: 'sample-brief-agent product draft --workspace-root <workspace_root>',
            surface_kind: 'domain_product_entry_action',
          },
          openai: {
            tool_name: 'sample_brief_agent_draft_brief',
          },
          ai_sdk: {
            tool_name: 'sample_brief_agent_draft_brief',
          },
        },
        authority_boundary: {
          can_write_target_domain_truth: false,
          can_write_target_domain_memory_body: false,
          can_mutate_target_domain_artifact_body: false,
          can_authorize_target_domain_quality_or_export: false,
        },
      },
    ],
    forbidden_generic_owner_roles: [
      'generic_scheduler_owner',
      'generic_daemon_owner',
      'generic_lifecycle_owner',
      'generic_queue_owner',
      'generic_attempt_ledger_owner',
      'generic_state_machine_runner_owner',
      'generic_cli_mcp_product_wrapper_owner',
      'generic_sidecar_owner',
      'generic_session_store_owner',
      'generic_status_workbench_owner',
      'generic_workspace_source_intake_owner',
      'generic_memory_transport_owner',
      'generic_artifact_gallery_owner',
      'generic_operator_workbench_owner',
      'generic_observability_slo_owner',
      'generic_persistence_engine_owner',
      'generic_sqlite_lifecycle_owner',
      'generic_native_helper_envelope_owner',
      'generic_review_repair_transport_owner',
      'generated_surface_owner_in_domain_repo',
    ],
    notes: [
      'OPL Framework generates CLI/MCP/Skill/product-entry/tool descriptors from this catalog.',
    ],
  });

  writeJson(path.join(targetAgentDir, 'contracts', 'stage_control_plane.json'), {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: 'sample_brief_agent_stage_plane',
    target_domain_id: 'sample-brief-agent',
    owner: 'Sample Brief Agent',
    authority_boundary: {
      domain_truth_owner: 'Sample Brief Agent',
      opl_role: 'stage_runtime_projection_and_generated_interface_owner',
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
    },
    stages: [
      {
        stage_id: 'brief-draft',
        stage_kind: 'creation',
        title: 'Brief Draft',
        summary: 'Draft the sample brief.',
        goal: 'Create a source-grounded knowledge brief from workspace refs.',
        owner: 'Sample Brief Agent',
        domain_stage_refs: ['brief-draft'],
        inputs: [],
        knowledge_refs: [],
        skills: [],
        prompt_refs: [],
        allowed_action_refs: ['draft-brief'],
        outputs: [],
        evaluation: [],
        handoff: null,
        source_refs: [],
        authority_boundary: {
          domain_truth_owner: 'Sample Brief Agent',
          opl_role: 'projection_only',
        },
      },
    ],
    notes: [
      'OPL Framework owns generated interfaces; this target agent owns brief semantics and owner receipts.',
    ],
  });
}

function buildBaselineReceipt(targetAgent, suiteResult, scaffoldValidation) {
  return {
    ...buildOwnerReceipt({
      receiptClass: 'baseline_delivery_receipt',
      status: 'baseline_delivered',
      targetAgent,
      suiteResult,
      extraAcceptanceGates: {
        direct_and_hosted_path_declared: true,
        operator_runbook_present: true,
      },
    }),
    target_agent: targetAgent,
    scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
  };
}

function buildLearningCandidate(suiteResult, baselineReceipt) {
  return buildGatedLearningCandidate({
    suiteResult,
    receipt: baselineReceipt,
    targetAgent: { domain_id: 'sample-brief-agent' },
    candidateKind: 'rubric_gap',
    targetRef: 'quality-gate:opl-meta-agent/baseline-owner',
    proposedChangeRefs: ['candidate-ref:sample-brief-agent/add-source-coverage-rubric'],
    promotionGateRef: 'promotion-gate:opl-meta-agent/sample-brief-agent',
  });
}

function buildBaselineMechanismPatchProposal(suiteResult, baselineReceipt, learningCandidate) {
  return buildMechanismPatchProposal({
    suiteResult,
    receipt: baselineReceipt,
    learningCandidate,
    mechanismRef: 'mechanism:opl-meta-agent/sample-brief-agent/self-learning-loop',
    editableSurfaces: [
      'prompt_policy_ref',
      'skill_policy_ref',
      'stage_policy_ref',
      'quality_gate_policy_ref',
      'agent_lab_suite_policy_ref',
    ],
    evidenceDeltaRef: 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline',
  });
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
  const mechanismPath = path.join(outputDir, 'mechanism-patch-proposal.json');

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
  writeSampleAgentDomainPack(targetAgentDir);
  const scaffoldValidation = runOpl(oplBin, [
    'agents',
    'scaffold',
    '--validate',
    targetAgentDir,
    '--json',
  ]);
  const generatedInterfaces = runOpl(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    targetAgentDir,
    '--json',
  ]);

  const suite = buildAgentLabSuite(targetAgentDir);
  writeJson(suitePath, suite);
  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result;

  const baselineReceipt = buildBaselineReceipt(targetAgent, suiteResult, scaffoldValidation);
  const learningCandidate = buildLearningCandidate(suiteResult, baselineReceipt);
  const mechanismPatchProposal = buildBaselineMechanismPatchProposal(suiteResult, baselineReceipt, learningCandidate);
  writeJson(receiptPath, baselineReceipt);
  writeJson(learningPath, learningCandidate);
  writeJson(mechanismPath, mechanismPatchProposal);

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
      generated_interface_status: generatedInterfaces.generated_agent_interfaces.status,
    },
    artifacts: {
      suite_path: suitePath,
      baseline_delivery_receipt_path: receiptPath,
      online_learning_candidate_path: learningPath,
      mechanism_patch_proposal_path: mechanismPath,
    },
    opl_agent_lab: agentLabRun.agent_lab_run,
    opl_generated_interfaces: generatedInterfaces.generated_agent_interfaces,
    learning_loop: {
      baseline_receipt: baselineReceipt,
      online_learning_candidate: learningCandidate,
      online_learning_policy: learningCandidate.online_learning_policy,
      mechanism_patch_proposal: mechanismPatchProposal,
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

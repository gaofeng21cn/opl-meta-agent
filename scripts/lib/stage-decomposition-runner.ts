import fs from 'node:fs';
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';
import type { TargetAgent } from './meta-agent-loop.ts';
import { runOpl, writeJson } from './meta-agent-loop.ts';
import {
  buildFixtureStageDecompositionCloseout,
  type StageDecompositionCloseoutPacket,
  type StageRunnerKind,
} from './stage-decomposition-pack-draft.ts';

export type StageDecompositionAttemptReceipt = {
  surface_kind: 'opl_meta_agent_stage_decomposition_attempt_receipt';
  runner_kind: StageRunnerKind;
  stage_id: 'stage-decomposition';
  status: 'typed_closeout_received';
  stage_packet_ref: string;
  stage_packet_path: string;
  closeout_packet_ref: string;
  closeout_packet_path: string;
  closeout_refs: string[];
  attempt_ref: string | null;
  provider_kind: 'fixture' | 'temporal';
  authority_boundary: {
    opl: 'stage_attempt_runtime_and_closeout_transport';
    oma: 'pack_draft_validation_and_materialization';
    target_domain: 'truth_quality_artifact_gate_owner';
  };
};

export type StageDecompositionAttemptResult = {
  receipt: StageDecompositionAttemptReceipt;
  closeoutPacket: StageDecompositionCloseoutPacket;
};

type StageDecompositionAttemptInput = {
  targetAgent: TargetAgent;
  outputDir: string;
  targetAgentDir: string;
  oplBin: string;
  runnerKind: StageRunnerKind;
  closeoutPacketPath?: string | null;
};

function readJsonFile(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asCloseoutPacket(value: JsonObject): StageDecompositionCloseoutPacket {
  return value as StageDecompositionCloseoutPacket;
}

function stagePacketPayload(input: StageDecompositionAttemptInput): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_stage_decomposition_attempt_input',
    version: 'opl-meta-agent.stage-decomposition-attempt-input.v1',
    stage_id: 'stage-decomposition',
    target_agent: input.targetAgent,
    target_agent_dir: input.targetAgentDir,
    output_dir: input.outputDir,
    authority_boundary: {
      opl_role: 'stage_attempt_runtime_and_generated_surface_owner',
      oma_role: 'agent_pack_authoring_and_strict_materialization',
      target_domain_role: 'truth_quality_artifact_gate_owner',
      opl_can_write_target_domain_truth: false,
      opl_can_write_target_domain_memory_body: false,
      opl_can_mutate_target_domain_artifact_body: false,
      opl_can_authorize_target_domain_quality_or_export: false,
      oma_can_promote_default_agent_without_gate: false,
    },
    opl_standard_constraints: [
      'codex_cli_first_class_executor',
      'stage_led_execution',
      'declarative_domain_pack',
      'explicit_prompt_tools_knowledge_quality_gate_refs',
      'refs_only_domain_truth_boundary',
      'receipted_handoff',
      'independent_ai_review_gate',
      'runtime_enforced_no_forbidden_writes',
      'generated_surfaces_from_contracts',
      'blockers_before_quality_or_promotion_claims',
    ],
    required_closeout: {
      surface_kind: 'stage_attempt_closeout_packet',
      stage_decomposition_pack_draft_required: true,
      free_text_closeout_accepted: false,
      required_pack_sections: [
        'action_catalog',
        'stage_control_plane',
        'agent/prompts',
        'agent/stages',
        'agent/skills',
        'agent/knowledge',
        'agent/quality_gates',
      ],
      required_stage_fields: [
        'selected_executor',
        'prompt_refs',
        'skills',
        'knowledge_refs',
        'evaluation',
        'independent_gate_policy',
        'stage_contract.expected_receipt_refs',
        'authority_boundary',
      ],
    },
  };
}

function writeStagePacket(input: StageDecompositionAttemptInput): { path: string; ref: string } {
  const stagePacketPath = path.join(input.outputDir, 'stage-decomposition-attempt-input.json');
  writeJson(stagePacketPath, stagePacketPayload(input));
  return {
    path: stagePacketPath,
    ref: `stage-packet:opl-meta-agent/${input.targetAgent.domain_id}/stage-decomposition`,
  };
}

function writeCloseoutPacket(
  outputDir: string,
  targetAgent: TargetAgent,
  closeoutPacket: StageDecompositionCloseoutPacket,
): { path: string; ref: string } {
  const closeoutPath = path.join(outputDir, `${targetAgent.domain_id}-stage-decomposition-closeout.json`);
  writeJson(closeoutPath, closeoutPacket);
  return {
    path: closeoutPath,
    ref: `closeout-packet:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition`,
  };
}

function receiptFor({
  runnerKind,
  targetAgent,
  stagePacket,
  closeoutPacket,
  closeoutPacketLocation,
  attemptRef,
  providerKind,
}: {
  runnerKind: StageRunnerKind;
  targetAgent: TargetAgent;
  stagePacket: { path: string; ref: string };
  closeoutPacket: StageDecompositionCloseoutPacket;
  closeoutPacketLocation: { path: string; ref: string };
  attemptRef: string | null;
  providerKind: 'fixture' | 'temporal';
}): StageDecompositionAttemptReceipt {
  return {
    surface_kind: 'opl_meta_agent_stage_decomposition_attempt_receipt',
    runner_kind: runnerKind,
    stage_id: 'stage-decomposition',
    status: 'typed_closeout_received',
    stage_packet_ref: stagePacket.ref,
    stage_packet_path: stagePacket.path,
    closeout_packet_ref: closeoutPacketLocation.ref,
    closeout_packet_path: closeoutPacketLocation.path,
    closeout_refs: closeoutPacket.closeout_refs,
    attempt_ref: attemptRef ?? `fixture-attempt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition`,
    provider_kind: providerKind,
    authority_boundary: {
      opl: 'stage_attempt_runtime_and_closeout_transport',
      oma: 'pack_draft_validation_and_materialization',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
  };
}

function fixtureCloseoutPacket(input: StageDecompositionAttemptInput): StageDecompositionCloseoutPacket {
  if (input.closeoutPacketPath) {
    return asCloseoutPacket(readJsonFile(input.closeoutPacketPath));
  }
  return buildFixtureStageDecompositionCloseout({ targetAgent: input.targetAgent });
}

function typedBlocker(reason: string, details: JsonObject = {}): JsonObject {
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'stage-decomposition',
    closeout_refs: [`typed-blocker:opl-meta-agent/stage-decomposition/${reason}`],
    blocked_reason: reason,
    domain_ready_verdict: 'blocked',
    next_owner: 'opl-meta-agent',
    user_stage_log: {
      stage_name: 'Stage decomposition pack draft',
      problem_summary: 'The stage-decomposition attempt could not produce a valid typed pack draft closeout.',
      stage_goal: 'Produce a validated OPL-compatible target-agent domain pack draft.',
      stage_work_done: ['No target-agent pack was materialized; OMA emitted a typed blocker for the failed stage-decomposition attempt.'],
      changed_stage_surfaces: [],
      outcome: 'typed_blocker',
      remaining_blockers: [reason],
      evidence_refs: [`typed-blocker:opl-meta-agent/stage-decomposition/${reason}`],
    },
    route_impact: {
      blocker: reason,
      ...details,
    },
    authority_boundary: {
      opl: 'typed_blocker_transport_only',
      oma: 'cannot_materialize_without_stage_decomposition_pack_draft',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
  };
}

function closeoutFromQuery(queryPayload: JsonObject): StageDecompositionCloseoutPacket | null {
  const query = queryPayload.family_runtime_stage_attempt_query;
  if (!isRecord(query)) {
    return null;
  }
  const stageAttemptQuery = query.stage_attempt_query;
  if (!isRecord(stageAttemptQuery)) {
    return null;
  }
  const closeouts = stageAttemptQuery.closeouts;
  if (!Array.isArray(closeouts) || closeouts.length === 0) {
    return null;
  }
  const latest = closeouts.at(-1);
  if (!isRecord(latest) || !isRecord(latest.packet)) {
    return null;
  }
  return asCloseoutPacket(latest.packet);
}

function attemptIdFromCreate(createPayload: JsonObject): string {
  const container = createPayload.family_runtime_stage_attempt;
  const attempt = isRecord(container) ? container.attempt : null;
  if (!isRecord(attempt) || typeof attempt.stage_attempt_id !== 'string' || !attempt.stage_attempt_id.trim()) {
    throw new Error('Stage-decomposition live runner did not return a stage_attempt_id.');
  }
  return attempt.stage_attempt_id;
}

function runLiveStageDecompositionAttempt(
  input: StageDecompositionAttemptInput,
  stagePacket: { path: string; ref: string },
): { packet: StageDecompositionCloseoutPacket; attemptRef: string } {
  let createPayload: JsonObject;
  try {
    createPayload = runOpl(input.oplBin, [
      'family-runtime',
      'attempt',
      'create',
      '--domain',
      'opl-meta-agent',
      '--stage',
      'stage-decomposition',
      '--provider',
      'temporal',
      '--workspace-locator',
      JSON.stringify({
        workspace_root: input.targetAgentDir,
        output_dir: input.outputDir,
        stage_packet_path: stagePacket.path,
        source_refs: [stagePacket.ref, stagePacket.path],
      }),
      '--checkpoint-ref',
      stagePacket.ref,
      '--executor-kind',
      'codex_cli',
      '--source-fingerprint',
      `oma:build-agent-baseline:${input.targetAgent.domain_id}`,
      '--new-attempt',
      '--start',
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(JSON.stringify(
      typedBlocker('opl_stage_attempt_launch_blocked', { message }),
      null,
      2,
    ));
  }

  const attemptId = attemptIdFromCreate(createPayload);
  const queryPayload = runOpl(input.oplBin, [
    'family-runtime',
    'attempt',
    'query',
    attemptId,
  ]);
  const packet = closeoutFromQuery(queryPayload);
  if (!packet) {
    throw new Error(JSON.stringify(
      typedBlocker('stage_decomposition_typed_closeout_missing', {
        stage_attempt_id: attemptId,
        query_ref: `opl://family-runtime/attempt/${attemptId}`,
      }),
      null,
      2,
    ));
  }
  return {
    packet,
    attemptRef: `opl://stage_attempts/${attemptId}`,
  };
}

export function runStageDecompositionAttempt(input: StageDecompositionAttemptInput): StageDecompositionAttemptResult {
  fs.mkdirSync(input.outputDir, { recursive: true });
  const stagePacket = writeStagePacket(input);
  const liveResult = input.runnerKind === 'live'
    ? runLiveStageDecompositionAttempt(input, stagePacket)
    : {
        packet: fixtureCloseoutPacket(input),
        attemptRef: `fixture-attempt:opl-meta-agent/${input.targetAgent.domain_id}/stage-decomposition`,
      };
  const closeoutPacketLocation = writeCloseoutPacket(input.outputDir, input.targetAgent, liveResult.packet);
  const receipt = receiptFor({
    runnerKind: input.runnerKind,
    targetAgent: input.targetAgent,
    stagePacket,
    closeoutPacket: liveResult.packet,
    closeoutPacketLocation,
    attemptRef: liveResult.attemptRef,
    providerKind: input.runnerKind === 'live' ? 'temporal' : 'fixture',
  });
  writeJson(path.join(input.outputDir, `${input.targetAgent.domain_id}-stage-decomposition-attempt-receipt.json`), receipt);
  return {
    receipt,
    closeoutPacket: liveResult.packet,
  };
}

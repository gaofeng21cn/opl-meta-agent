import {
  evaluateStandardAgentActionStageRun,
  type StandardAgentActionStageRunCloseout,
  type StandardAgentActionStageRunProgress,
} from 'opl-framework-shared/standard-agent-action-stage-run';
import type { JsonObject } from './domain-pack.ts';

export type StageRunCloseoutEvidence = StandardAgentActionStageRunCloseout & {
  closeout_packet: JsonObject;
};

export type ActionStageRouteProgress = Omit<StandardAgentActionStageRunProgress, 'stage_closeouts'> & {
  stage_closeouts: StageRunCloseoutEvidence[];
};

export function evaluateActionStageRoute(input: {
  repoRoot: string;
  actionId: string;
  stageRunReadbackPaths: string[];
}): ActionStageRouteProgress {
  const progress = evaluateStandardAgentActionStageRun({
    repoDir: input.repoRoot,
    actionId: input.actionId,
    stageRunReadbackPaths: input.stageRunReadbackPaths,
  });
  return {
    ...progress,
    stage_closeouts: progress.stage_closeouts.map((closeout) => {
      if (closeout.domain_output_metadata) {
        if (closeout.domain_output_metadata.kind !== 'oma_stage_closeout_payload') {
          throw new Error(`OPL StageRun ${closeout.stage_id} domain_output requires OMA payload metadata.`);
        }
        if (
          closeout.domain_output_packet.surface_kind !== 'stage_attempt_closeout_packet'
          || closeout.domain_output_packet.stage_id !== closeout.stage_id
          || (
            typeof closeout.domain_output_packet.closeout_id === 'string'
            && closeout.domain_output_packet.closeout_id !== closeout.closeout_id
          )
        ) {
          throw new Error(`OPL StageRun ${closeout.stage_id} domain payload identity mismatch.`);
        }
      }
      return { ...closeout, closeout_packet: closeout.domain_output_packet };
    }),
  };
}

export function buildActionStageContinuation(progress: ActionStageRouteProgress): JsonObject {
  if (progress.complete || !progress.next_stage_ref) {
    throw new Error(`${progress.action_id}: complete route cannot emit a continuation.`);
  }
  return {
    surface_kind: 'opl_meta_agent_action_stage_continuation',
    version: 'opl-meta-agent.action-stage-continuation.v1',
    status: 'continuation_required',
    action_id: progress.action_id,
    route_policy: progress.route.route_policy,
    completed_stage_refs: progress.completed_stage_refs,
    next_stage_ref: progress.next_stage_ref,
    stage_run_owner: 'one-person-lab',
    receipt_emitted: false,
    authority_boundary: {
      oma_can_create_stage_run_receipt: false,
      oma_can_skip_required_stage: false,
      optional_stage_can_replace_required_stage: false,
      continuation_is_action_completion: false,
    },
  };
}

export function buildActionStageRouteCloseoutGate(progress: ActionStageRouteProgress): JsonObject {
  if (!progress.complete) {
    throw new Error(`${progress.action_id}: incomplete route cannot pass the closeout gate.`);
  }
  return {
    surface_kind: 'opl_meta_agent_action_stage_route_closeout_gate',
    version: 'opl-meta-agent.action-stage-route-closeout-gate.v1',
    status: 'passed',
    action_id: progress.action_id,
    route_policy: progress.route.route_policy,
    required_stage_refs: progress.route.required_stage_refs,
    optional_stage_refs: progress.route.optional_stage_refs,
    completed_stage_refs: progress.completed_stage_refs,
    terminal_stage_ref: progress.completed_stage_refs.at(-1),
    stage_attempt_refs: progress.stage_closeouts.map((entry) => entry.stage_attempt_ref),
    stage_closeout_packet_refs: progress.stage_closeouts.map((entry) => entry.closeout_packet_ref),
    all_required_stages_closed: true,
    stage_receipt_order_verified: true,
    per_stage_typed_closeout_verified: true,
    authority_boundary: {
      reuses_opl_stage_run: true,
      oma_scheduler_created: false,
      oma_stage_run_receipt_created: false,
      provider_completion_alone_is_closeout: false,
    },
  };
}

export function closeoutForStage(
  progress: ActionStageRouteProgress,
  stageId: string,
): StageRunCloseoutEvidence {
  const closeout = progress.stage_closeouts.find((entry) => entry.stage_id === stageId);
  if (!closeout) {
    throw new Error(`${progress.action_id}: missing required StageRun closeout for ${stageId}.`);
  }
  return closeout;
}

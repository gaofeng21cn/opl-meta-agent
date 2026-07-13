import {
  evaluateStandardAgentActionStageRun,
  type StandardAgentActionStageRunCloseout,
  type StandardAgentActionStageRunProgress,
} from 'opl-framework/standard-agent-action-stage-run';
import type { JsonObject } from './domain-pack.ts';

export type StageRunCloseoutEvidence = StandardAgentActionStageRunCloseout & {
  closeout_packet: JsonObject;
};

export type ActionStageRouteProgress = Omit<StandardAgentActionStageRunProgress, 'stage_closeouts'> & {
  stage_closeouts: StageRunCloseoutEvidence[];
  quality_debt: string[];
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
  const qualityDebt: string[] = [...(
    progress as StandardAgentActionStageRunProgress & { quality_debt_refs?: string[] }
  ).quality_debt_refs ?? []];
  return {
    ...progress,
    stage_closeouts: progress.stage_closeouts.map((closeout) => {
      if (closeout.domain_output_metadata) {
        if (closeout.domain_output_metadata.kind !== 'oma_stage_closeout_payload') {
          qualityDebt.push(`stage_run_${closeout.stage_id}_domain_output_metadata_unrecognized`);
        }
        if (
          closeout.domain_output_packet.surface_kind !== 'stage_attempt_closeout_packet'
          || closeout.domain_output_packet.stage_id !== closeout.stage_id
          || (
            typeof closeout.domain_output_packet.closeout_id === 'string'
            && closeout.domain_output_packet.closeout_id !== closeout.closeout_id
          )
        ) {
          qualityDebt.push(`stage_run_${closeout.stage_id}_domain_payload_identity_mismatch`);
        }
      }
      return { ...closeout, closeout_packet: closeout.domain_output_packet };
    }),
    quality_debt: qualityDebt,
  };
}

export function buildActionStageRouteContext(progress: ActionStageRouteProgress): JsonObject {
  const missingStageRefs = progress.route.required_stage_refs.filter(
    (stageRef) => !progress.completed_stage_refs.includes(stageRef),
  );
  return {
    surface_kind: 'opl_meta_agent_action_stage_route_context',
    version: 'opl-meta-agent.action-stage-route-context.v1',
    status: progress.complete ? 'context_complete' : 'context_partial_quality_debt',
    action_id: progress.action_id,
    route_policy: progress.route.route_policy,
    required_stage_refs: progress.route.required_stage_refs,
    optional_stage_refs: progress.route.optional_stage_refs,
    completed_stage_refs: progress.completed_stage_refs,
    terminal_stage_ref: progress.completed_stage_refs.at(-1),
    stage_attempt_refs: progress.stage_closeouts.map((entry) => entry.stage_attempt_ref),
    stage_closeout_packet_refs: progress.stage_closeouts.map((entry) => entry.closeout_packet_ref),
    next_stage_ref: progress.next_stage_ref,
    missing_stage_refs: missingStageRefs,
    quality_debt: [...progress.quality_debt, ...missingStageRefs.map((ref) => `missing_stage_context:${ref}`)],
    next_stage_may_start: true,
    route_selection_owner: 'codex_cli',
    route_may_skip_repeat_or_reverse_to_any_declared_stage: true,
    authority_boundary: {
      reuses_opl_stage_run: true,
      oma_scheduler_created: false,
      oma_stage_run_receipt_created: false,
      provider_completion_alone_is_closeout: false,
      context_can_select_or_reject_route: false,
      missing_receipt_blocks_stage_transition: false,
    },
  };
}

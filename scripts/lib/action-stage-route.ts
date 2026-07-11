import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from './domain-pack.ts';

export type ActionStageRoute = {
  entry_stage_ref: string;
  required_stage_refs: string[];
  optional_stage_refs: string[];
  terminal_stage_refs: string[];
  route_policy: 'ordered_stage_attempts_no_skip';
};

export type StageRunCloseoutEvidence = {
  stage_id: string;
  stage_attempt_ref: string;
  closeout_id: string;
  closeout_packet_ref: string;
  closeout_packet: JsonObject;
  readback_path: string;
};

export type ActionStageRouteProgress = {
  action_id: string;
  route: ActionStageRoute;
  completed_stage_refs: string[];
  next_stage_ref: string | null;
  complete: boolean;
  stage_closeouts: StageRunCloseoutEvidence[];
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`${field} must be a non-empty string array.`);
  }
  return value.map((entry) => String(entry).trim());
}

function readJson(filePath: string): JsonObject {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!isRecord(value)) {
    throw new Error(`StageRun readback must be a JSON object: ${filePath}`);
  }
  return value;
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function domainCloseoutPayload(
  packet: JsonObject,
  attempt: JsonObject,
  stageId: string,
  closeoutId: string,
  targetDomainId: string,
  readbackPath: string,
): JsonObject | null {
  const domainOutput = isRecord(packet.domain_output) ? packet.domain_output : null;
  if (!domainOutput) return null;
  if (
    domainOutput.surface_kind !== 'domain_owned_stage_output_ref'
    || domainOutput.version !== 'domain-owned-stage-output-ref.v1'
  ) {
    throw new Error(`OPL StageRun ${stageId} domain_output uses an unsupported refs-only shape.`);
  }
  const domainOutputDomainId = nonEmptyString(
    domainOutput.domain_id,
    `${readbackPath}: closeout_packet.domain_output.domain_id`,
  );
  if (domainOutputDomainId !== targetDomainId) {
    throw new Error(`OPL StageRun ${stageId} domain_output domain mismatch.`);
  }
  const outputRef = nonEmptyString(
    domainOutput.output_ref,
    `${readbackPath}: closeout_packet.domain_output.output_ref`,
  );
  const closeoutRefs = stringArray(packet.closeout_refs, `${readbackPath}: closeout_packet.closeout_refs`);
  if (!closeoutRefs.includes(outputRef)) {
    throw new Error(`OPL StageRun ${stageId} domain_output ref is missing from closeout_refs.`);
  }
  const metadata = Array.isArray(packet.closeout_ref_metadata)
    ? packet.closeout_ref_metadata.filter(isRecord)
    : [];
  const payloadMetadata = metadata.find((entry) =>
    entry.kind === 'oma_stage_closeout_payload'
    && entry.ref === outputRef
  );
  if (!payloadMetadata) {
    throw new Error(`OPL StageRun ${stageId} domain_output requires SHA-bound OMA payload metadata.`);
  }

  const workspaceLocator = isRecord(attempt.workspace_locator) ? attempt.workspace_locator : null;
  const workspaceRoot = workspaceLocator
    ? nonEmptyString(workspaceLocator.workspace_root, `${readbackPath}: attempt.workspace_locator.workspace_root`)
    : null;
  if (!workspaceRoot || !path.isAbsolute(workspaceRoot)) {
    throw new Error(`OPL StageRun ${stageId} payload resolution requires an absolute workspace_root.`);
  }
  let outputUrl: URL;
  try {
    outputUrl = new URL(outputRef);
  } catch {
    throw new Error(`OPL StageRun ${stageId} domain_output ref must be a valid URL.`);
  }
  if (outputUrl.protocol !== 'file:') {
    throw new Error(`OPL StageRun ${stageId} domain_output currently requires a file URL.`);
  }
  const declaredRoot = path.resolve(workspaceRoot);
  const resolvedPayloadPath = fileURLToPath(outputUrl);
  const relativeToRoot = path.relative(declaredRoot, resolvedPayloadPath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error(`OPL StageRun ${stageId} payload ref escapes workspace_root.`);
  }
  const resolvedRoot = fs.realpathSync(declaredRoot);
  const realPayloadPath = fs.realpathSync(resolvedPayloadPath);
  const realRelativeToRoot = path.relative(resolvedRoot, realPayloadPath);
  if (realRelativeToRoot.startsWith('..') || path.isAbsolute(realRelativeToRoot)) {
    throw new Error(`OPL StageRun ${stageId} payload file resolves outside workspace_root.`);
  }
  const expectedSha256 = nonEmptyString(
    payloadMetadata.sha256,
    `${readbackPath}: closeout_ref_metadata.sha256`,
  );
  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || sha256File(realPayloadPath) !== expectedSha256) {
    throw new Error(`OPL StageRun ${stageId} payload sha256 mismatch.`);
  }
  const payload = readJson(realPayloadPath);
  if (payload.surface_kind !== 'stage_attempt_closeout_packet') {
    throw new Error(`OPL StageRun ${stageId} payload must be a stage_attempt_closeout_packet.`);
  }
  if (payload.stage_id !== stageId) {
    throw new Error(`OPL StageRun payload stage_id mismatch: attempt=${stageId}, payload=${String(payload.stage_id)}.`);
  }
  if (typeof payload.closeout_id === 'string' && payload.closeout_id !== closeoutId) {
    throw new Error(`OPL StageRun ${stageId} payload closeout_id mismatch.`);
  }
  return payload;
}

function loadRoute(repoRoot: string, actionId: string): {
  route: ActionStageRoute;
  targetDomainId: string;
} {
  const catalog = readJson(path.join(repoRoot, 'contracts', 'action_catalog.json'));
  const targetDomainId = nonEmptyString(catalog.target_domain_id, 'action_catalog.target_domain_id');
  const actions = Array.isArray(catalog.actions) ? catalog.actions.filter(isRecord) : [];
  const action = actions.find((entry) => entry.action_id === actionId);
  if (!action || !isRecord(action.stage_route)) {
    throw new Error(`Action ${actionId} is missing stage_route.`);
  }
  const route = action.stage_route;
  const requiredStageRefs = stringArray(route.required_stage_refs, `${actionId}.stage_route.required_stage_refs`);
  const optionalStageRefs = Array.isArray(route.optional_stage_refs)
    ? route.optional_stage_refs.map((entry, index) =>
        nonEmptyString(entry, `${actionId}.stage_route.optional_stage_refs[${index}]`))
    : (() => { throw new Error(`${actionId}.stage_route.optional_stage_refs must be an array.`); })();
  const terminalStageRefs = stringArray(route.terminal_stage_refs, `${actionId}.stage_route.terminal_stage_refs`);
  const entryStageRef = nonEmptyString(route.entry_stage_ref, `${actionId}.stage_route.entry_stage_ref`);
  if (entryStageRef !== requiredStageRefs[0]) {
    throw new Error(`${actionId}.stage_route.entry_stage_ref must equal required_stage_refs[0].`);
  }
  if (route.route_policy !== 'ordered_stage_attempts_no_skip') {
    throw new Error(`${actionId}.stage_route.route_policy must be ordered_stage_attempts_no_skip.`);
  }
  return {
    targetDomainId,
    route: {
      entry_stage_ref: entryStageRef,
      required_stage_refs: requiredStageRefs,
      optional_stage_refs: optionalStageRefs,
      terminal_stage_refs: terminalStageRefs,
      route_policy: 'ordered_stage_attempts_no_skip',
    },
  };
}

function loadStageGraph(repoRoot: string): Map<string, string[]> {
  const manifest = readJson(path.join(repoRoot, 'agent', 'stages', 'manifest.json'));
  const stages = Array.isArray(manifest.stages) ? manifest.stages.filter(isRecord) : [];
  return new Map(stages.map((stage) => [
    nonEmptyString(stage.stage_id, 'agent/stages/manifest.json stages[].stage_id'),
    Array.isArray(stage.next_stage_refs)
      ? stage.next_stage_refs.map((entry, index) => nonEmptyString(entry, `next_stage_refs[${index}]`))
      : [],
  ]));
}

function canReach(
  from: string,
  to: string,
  routeStageRefs: Set<string>,
  graph: Map<string, string[]>,
): boolean {
  if (from === to) return true;
  const pending = [from];
  const seen = new Set(pending);
  while (pending.length > 0) {
    const current = pending.shift()!;
    for (const next of graph.get(current) ?? []) {
      if (!routeStageRefs.has(next) || seen.has(next)) continue;
      if (next === to) return true;
      seen.add(next);
      pending.push(next);
    }
  }
  return false;
}

function stageRunCloseout(readbackPath: string, targetDomainId: string): StageRunCloseoutEvidence {
  const readback = readJson(readbackPath);
  const envelope = isRecord(readback.family_runtime_stage_attempt_query)
    ? readback.family_runtime_stage_attempt_query
    : readback;
  const query = isRecord(envelope.stage_attempt_query) ? envelope.stage_attempt_query : null;
  const attempt = query && isRecord(query.attempt) ? query.attempt : null;
  if (!query || !attempt) {
    throw new Error(`OPL StageRun readback is missing family_runtime_stage_attempt_query.stage_attempt_query: ${readbackPath}`);
  }
  const stageId = nonEmptyString(attempt.stage_id, `${readbackPath}: attempt.stage_id`);
  const stageAttemptId = nonEmptyString(attempt.stage_attempt_id, `${readbackPath}: attempt.stage_attempt_id`);
  const attemptDomainId = nonEmptyString(attempt.domain_id, `${readbackPath}: attempt.domain_id`);
  if (attemptDomainId !== targetDomainId) {
    throw new Error(`OPL StageRun ${stageId} domain mismatch: expected=${targetDomainId}, actual=${attemptDomainId}.`);
  }
  const expectedStageAttemptRef = `opl://stage_attempts/${stageAttemptId}`;
  const stageAttemptRef = nonEmptyString(envelope.attempt_ref, `${readbackPath}: attempt_ref`);
  if (stageAttemptRef !== expectedStageAttemptRef) {
    throw new Error(`OPL StageRun ${stageId} attempt_ref mismatch: expected=${expectedStageAttemptRef}, actual=${stageAttemptRef}.`);
  }
  if (attempt.status !== 'completed' || attempt.closeout_receipt_status !== 'accepted_typed_closeout') {
    throw new Error(`OPL StageRun ${stageId} closeout is not an accepted completed attempt.`);
  }
  if (query.canonical_outcome !== 'completed_with_receipt') {
    throw new Error(`OPL StageRun ${stageId} canonical outcome is not completed_with_receipt.`);
  }
  if (!Array.isArray(query.conflict_or_blocker_envelopes)) {
    throw new Error(`OPL StageRun ${stageId} query is missing conflict_or_blocker_envelopes.`);
  }
  if (query.conflict_or_blocker_envelopes.length > 0) {
    throw new Error(`OPL StageRun ${stageId} query contains a conflict or blocker envelope.`);
  }
  const closeouts = Array.isArray(query.closeouts) ? query.closeouts.filter(isRecord) : [];
  const latest = closeouts.at(-1);
  if (!latest || !isRecord(latest.packet)) {
    throw new Error(`OPL StageRun ${stageId} has no typed closeout packet.`);
  }
  const closeoutId = nonEmptyString(latest.closeout_id, `${readbackPath}: closeouts[].closeout_id`);
  if (latest.stage_attempt_id !== stageAttemptId) {
    throw new Error(`OPL StageRun ${stageId} closeout ledger attempt mismatch.`);
  }
  const packet = latest.packet;
  if (packet.surface_kind !== 'stage_attempt_closeout_packet') {
    throw new Error(`OPL StageRun ${stageId} closeout must use surface_kind stage_attempt_closeout_packet.`);
  }
  if (typeof packet.stage_id === 'string' && packet.stage_id !== stageId) {
    throw new Error(`OPL StageRun closeout stage_id mismatch: attempt=${stageId}, closeout=${String(packet.stage_id)}.`);
  }
  if (typeof packet.stage_attempt_id === 'string' && packet.stage_attempt_id !== stageAttemptId) {
    throw new Error(`OPL StageRun ${stageId} closeout packet attempt mismatch.`);
  }
  if (typeof packet.closeout_id === 'string' && packet.closeout_id !== closeoutId) {
    throw new Error(`OPL StageRun ${stageId} closeout packet id mismatch.`);
  }
  if (Array.isArray(packet.rejected_writes) && packet.rejected_writes.length > 0) {
    throw new Error(`OPL StageRun ${stageId} closeout contains rejected writes.`);
  }
  stringArray(packet.closeout_refs, `${readbackPath}: closeout_packet.closeout_refs`);
  const closeoutPacket = domainCloseoutPayload(
    packet,
    attempt,
    stageId,
    closeoutId,
    targetDomainId,
    readbackPath,
  ) ?? packet;
  return {
    stage_id: stageId,
    stage_attempt_ref: stageAttemptRef,
    closeout_id: closeoutId,
    closeout_packet_ref: `${stageAttemptRef}/closeouts/${encodeURIComponent(closeoutId)}`,
    closeout_packet: closeoutPacket,
    readback_path: readbackPath,
  };
}

export function evaluateActionStageRoute(input: {
  repoRoot: string;
  actionId: string;
  stageRunReadbackPaths: string[];
}): ActionStageRouteProgress {
  const { route, targetDomainId } = loadRoute(input.repoRoot, input.actionId);
  const graph = loadStageGraph(input.repoRoot);
  const routeStageRefs = new Set([...route.required_stage_refs, ...route.optional_stage_refs]);
  const stageCloseouts = input.stageRunReadbackPaths.map((readbackPath) =>
    stageRunCloseout(path.resolve(readbackPath), targetDomainId)
  );
  const completedStageRefs = stageCloseouts.map((entry) => entry.stage_id);
  if (new Set(completedStageRefs).size !== completedStageRefs.length) {
    throw new Error(`${input.actionId}: duplicate StageRun closeout in route evidence.`);
  }
  const unknown = completedStageRefs.filter((stageId) => !routeStageRefs.has(stageId));
  if (unknown.length > 0) {
    throw new Error(`${input.actionId}: StageRun closeout is outside stage_route: ${unknown.join(', ')}.`);
  }
  if (completedStageRefs.length > 0 && completedStageRefs[0] !== route.entry_stage_ref) {
    throw new Error(`${input.actionId}: route skip rejected; first closeout must be ${route.entry_stage_ref}.`);
  }
  for (let index = 1; index < completedStageRefs.length; index += 1) {
    const previous = completedStageRefs[index - 1]!;
    const current = completedStageRefs[index]!;
    if (!canReach(previous, current, routeStageRefs, graph)) {
      throw new Error(`${input.actionId}: StageRun closeout order is unreachable: ${previous} -> ${current}.`);
    }
  }
  const completedRequired = completedStageRefs.filter((stageId) => route.required_stage_refs.includes(stageId));
  completedRequired.forEach((stageId, index) => {
    const expected = route.required_stage_refs[index];
    if (stageId !== expected) {
      throw new Error(`${input.actionId}: route skip rejected; expected ${expected} before ${stageId}.`);
    }
  });
  const nextStageRef = route.required_stage_refs[completedRequired.length] ?? null;
  const complete = nextStageRef === null;
  if (complete && !route.terminal_stage_refs.includes(completedStageRefs.at(-1) ?? '')) {
    throw new Error(`${input.actionId}: complete route must end at a declared terminal Stage.`);
  }
  for (let index = 1; index < stageCloseouts.length; index += 1) {
    const previous = stageCloseouts[index - 1]!;
    const current = stageCloseouts[index]!;
    const consumedRefs = Array.isArray(current.closeout_packet.consumed_refs)
      ? current.closeout_packet.consumed_refs.filter((ref): ref is string => typeof ref === 'string')
      : [];
    if (!consumedRefs.includes(previous.closeout_packet_ref)) {
      throw new Error(
        `${input.actionId}: StageRun ${current.stage_id} must consume preceding accepted closeout ref ${previous.closeout_packet_ref}.`,
      );
    }
  }
  return {
    action_id: input.actionId,
    route,
    completed_stage_refs: completedStageRefs,
    next_stage_ref: nextStageRef,
    complete,
    stage_closeouts: stageCloseouts,
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

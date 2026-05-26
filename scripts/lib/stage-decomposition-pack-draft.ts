import fs from 'node:fs';
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';
import type { TargetAgent } from './meta-agent-loop.ts';
import { writeJson } from './meta-agent-loop.ts';

const FORBIDDEN_GENERIC_OWNER_ROLES = [
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
] as const;

const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

export type StageRunnerKind = 'fixture' | 'live';

export type StageDecompositionFileDraft = {
  path: string;
  body: string;
};

export type StageDecompositionPackDraft = {
  surface_kind: 'opl_meta_agent_stage_decomposition_pack_draft';
  version: 'opl-meta-agent.stage-decomposition-pack-draft.v1';
  target_agent: TargetAgent;
  owner_boundary: JsonObject;
  no_forbidden_write_policy: JsonObject;
  action_catalog: JsonObject;
  stage_control_plane: JsonObject;
  files: StageDecompositionFileDraft[];
};

export type StageDecompositionCloseoutPacket = JsonObject & {
  surface_kind: 'stage_attempt_closeout_packet';
  stage_id: 'stage-decomposition';
  closeout_refs: string[];
  stage_decomposition_pack_draft: StageDecompositionPackDraft;
};

type FixtureStageSpec = {
  targetAgent: TargetAgent;
  stageId?: string;
  actionId?: string;
  title?: string;
  summary?: string;
  promptPath?: string;
  stagePath?: string;
  skillPath?: string;
  knowledgePath?: string;
  qualityGatePath?: string;
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`stage-decomposition pack draft missing ${field}.`);
  }
  return value.trim();
}

function asRecord(value: unknown, field: string): JsonObject {
  if (!isRecord(value)) {
    throw new Error(`stage-decomposition pack draft ${field} must be a JSON object.`);
  }
  return value;
}

function asRecordArray(value: unknown, field: string): JsonObject[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRecord)) {
    throw new Error(`stage-decomposition pack draft ${field} must be a non-empty object array.`);
  }
  return value;
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.trim())) {
    throw new Error(`stage-decomposition pack draft ${field} must be a string array.`);
  }
  return value.map((entry) => entry.trim());
}

function domainLabelFor(targetAgent: TargetAgent): string {
  return targetAgent.domain_label?.trim() || targetAgent.domain_id;
}

function targetBriefFor(targetAgent: TargetAgent): string {
  return targetAgent.target_brief?.trim()
    || `Create an owner-gated ${domainLabelFor(targetAgent)} delivery from declared workspace refs.`;
}

function snakeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function commandPrefix(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function ref(refKind: string, refValue: string) {
  return {
    ref_kind: refKind,
    ref: refValue,
  };
}

function authorityBoundary(domainTruthOwner: string) {
  return {
    domain_truth_owner: domainTruthOwner,
    opl_role: 'projection_only',
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
}

function noForbiddenWritePolicy(domainTruthOwner: string) {
  return {
    refs_only: true,
    generated_interface_owner: 'one-person-lab',
    domain_truth_owner: domainTruthOwner,
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
    can_promote_default_agent_without_gate: false,
  };
}

function buildActionCatalog({
  targetAgent,
  actionId,
  owner,
}: {
  targetAgent: TargetAgent;
  actionId: string;
  owner: string;
}): JsonObject {
  const domainId = targetAgent.domain_id;
  const brief = targetBriefFor(targetAgent);
  const actionSummary = actionId === 'draft-brief'
    ? 'Draft a source-grounded knowledge brief from declared workspace refs.'
    : actionId === 'draft-agent-output'
      ? `Draft the owner-gated ${owner} delivery from declared workspace refs.`
      : `Run the owner-gated ${owner} stage from declared workspace refs.`;
  return {
    surface_kind: 'family_action_catalog',
    version: 'family-action-catalog.v1',
    catalog_id: `${snakeId(domainId)}_action_catalog`,
    target_domain_id: domainId,
    owner,
    authority_boundary: {
      opl_role: 'generated_interface_projection_only',
      domain_truth_owner: owner,
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      domain_repo_can_own_generated_surface: false,
    },
    actions: [
      {
        action_id: actionId,
        title: actionId.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' '),
        summary: actionSummary,
        natural_language_intent: brief,
        owner,
        effect: 'mutating',
        source_command: {
          command: `${commandPrefix(domainId)} ${commandPrefix(actionId)} --workspace-root <workspace_root>`,
          surface_kind: 'domain_cli',
        },
        input_schema_ref: `contracts/schemas/${actionId}.input.schema.json`,
        output_schema_ref: `contracts/schemas/${actionId}.output.schema.json`,
        workspace_locator_fields: ['workspace_root'],
        human_gate_ids: [`${snakeId(actionId)}_owner_review`],
        supported_surfaces: {
          cli: {
            command: `${commandPrefix(domainId)} ${commandPrefix(actionId)} --workspace-root <workspace_root>`,
            surface_kind: 'domain_cli',
          },
          mcp: {
            tool_name: `${snakeId(domainId)}_${snakeId(actionId)}`,
            surface_kind: 'opl_generated_mcp_descriptor',
            descriptor_only: true,
            public_runtime: false,
          },
          skill: {
            command_contract_id: `${domainId}.${actionId}`,
            surface_kind: 'opl_generated_skill_contract',
          },
          product_entry: {
            action_key: actionId,
            command: `${commandPrefix(domainId)} product ${commandPrefix(actionId)} --workspace-root <workspace_root>`,
            surface_kind: 'domain_product_entry_action',
          },
          openai: {
            tool_name: `${snakeId(domainId)}_${snakeId(actionId)}`,
          },
          ai_sdk: {
            tool_name: `${snakeId(domainId)}_${snakeId(actionId)}`,
          },
        },
        authority_boundary: authorityBoundary(owner),
      },
    ],
    forbidden_generic_owner_roles: [...FORBIDDEN_GENERIC_OWNER_ROLES],
  };
}

function buildStageControlPlane({
  targetAgent,
  stageId,
  actionId,
  title,
  summary,
  promptPath,
  skillPath,
  knowledgePath,
  qualityGatePath,
  owner,
}: Required<FixtureStageSpec> & { owner: string }): JsonObject {
  const domainId = targetAgent.domain_id;
  return {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: `${snakeId(domainId)}_stage_plane`,
    target_domain_id: domainId,
    owner,
    authority_boundary: {
      domain_truth_owner: owner,
      opl_role: 'stage_runtime_projection_and_generated_interface_owner',
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
    },
    stages: [
      {
        stage_id: stageId,
        stage_kind: 'creation',
        title,
        summary,
        goal: targetBriefFor(targetAgent),
        owner,
        stage_pack_conformance_version: 'standard-stage-pack.v2',
        selected_executor: {
          executor_kind: 'codex_cli',
          default_executor: true,
          executor_binding_ref: 'executor:codex-cli',
        },
        domain_stage_refs: [stageId],
        inputs: [
          ref('workspace_scope_ref', `workspace-scope:${stageId}`),
          ref('source_scope_ref', `source-scope:${stageId}`),
        ],
        knowledge_refs: [ref('domain_knowledge_ref', knowledgePath)],
        skills: [ref('domain_skill_ref', skillPath)],
        prompt_refs: [ref('domain_prompt_ref', promptPath)],
        allowed_action_refs: [actionId],
        outputs: [
          ref('artifact_ref', `artifact-ref:${stageId}/draft-output`),
          ref('owner_handoff_ref', `owner-handoff-ref:${stageId}`),
        ],
        evaluation: [ref('domain_quality_gate_ref', qualityGatePath)],
        independent_gate_policy: {
          gate_ref: `quality-gate:${stageId}`,
          gate_owner: owner,
          execution_review_separation_required: true,
          mechanical_completion_can_close_stage: false,
          provider_completion_can_claim_domain_ready: false,
          generated_surface_readiness_can_claim_quality_or_export: false,
          dedicated_review_stage_required_when: [
            'expert_judgment',
            'artifact_or_export_mutation',
            'domain_truth_movement',
            'quality_or_export_verdict',
            'high_risk_handoff',
          ],
          lightweight_gate_receipt_allowed_when: [
            'read_only_projection',
            'mechanical_packaging',
            'low_risk_owner_handoff',
          ],
        },
        handoff: {
          next_owner: owner,
          allowed_closure_refs: [
            `independent-gate-receipt-ref:${stageId}`,
            `owner-receipt-ref:${stageId}`,
            `typed-blocker-ref:${stageId}`,
            `route-back-ref:${stageId}`,
          ],
        },
        stage_contract: {
          requires: [
            `stage:${stageId}`,
            `prompt-ref:${promptPath}`,
            `skill-ref:${skillPath}`,
            `knowledge-ref:${knowledgePath}`,
            `quality-gate-ref:${qualityGatePath}`,
            `action-ref:${actionId}`,
            `workspace-scope-ref:${stageId}`,
            `source-scope-ref:${stageId}`,
          ],
          ensures: [
            `stage-attempt-receipt-ref:${stageId}`,
            `executor-receipt-ref:${stageId}/codex-cli`,
            `boundary-receipt-ref:${stageId}/refs-only`,
            `independent-gate-receipt-ref:${stageId}`,
            `owner-handoff-ref:${stageId}`,
          ],
          expected_receipt_refs: [
            ref('stage_attempt_receipt_ref', `stage-attempt-receipt-ref:${stageId}`),
            ref('executor_receipt_ref', `executor-receipt-ref:${stageId}/codex-cli`),
            ref('boundary_receipt_ref', `boundary-receipt-ref:${stageId}/refs-only`),
            ref('independent_gate_receipt_ref', `independent-gate-receipt-ref:${stageId}`),
          ],
          source_scope_refs: [ref('source_scope_ref', `source-scope:${stageId}`)],
          artifact_scope_refs: [ref('artifact_scope_ref', `artifact-scope:${stageId}`)],
          workspace_scope_refs: [ref('workspace_scope_ref', `workspace-scope:${stageId}`)],
        },
        trust_boundary: {
          lane: 'domain_agent',
          static_check_eligible: true,
          effect_boundary: true,
          owner_receipt_required: true,
          runtime_guard_required: true,
        },
        authority_boundary: authorityBoundary(owner),
      },
    ],
  };
}

function buildFiles({
  targetAgent,
  stageId,
  actionId,
  title,
  promptPath,
  stagePath,
  skillPath,
  knowledgePath,
  qualityGatePath,
  owner,
}: Required<FixtureStageSpec> & { owner: string }): StageDecompositionFileDraft[] {
  const brief = targetBriefFor(targetAgent);
  return [
    {
      path: promptPath,
      body: [
        `# ${title} Prompt`,
        '',
        `Goal: ${brief}`,
        '',
        'Use declared workspace, source, artifact, and owner refs only.',
        'Keep the work Codex-first: the executor may plan, inspect evidence, request source refs, route back when inputs are incomplete, and choose the reasoning path.',
        'Do not write target domain truth, memory bodies, artifact bodies, quality verdicts, export verdicts, or promotion state.',
        'Close the execution attempt with explicit artifact refs, owner handoff refs, typed blockers, or route-back refs.',
        '',
      ].join('\n'),
    },
    {
      path: stagePath,
      body: [
        `# ${title} Stage`,
        '',
        `Stage id: \`${stageId}\``,
        `Action ref: \`${actionId}\``,
        '',
        'The stage is executed by Codex CLI through OPL stage runtime and remains bounded by refs-only target authority.',
        'The stage may ask for missing source, workspace, artifact, rubric, or owner-gate refs instead of producing a hollow output.',
        '',
      ].join('\n'),
    },
    {
      path: skillPath,
      body: [
        `# ${owner} Domain Skill`,
        '',
        `Run the \`${stageId}\` stage through the domain action \`${actionId}\` while preserving OPL generated-interface boundaries.`,
        'Use OPL-hosted runtime, queue, attempt ledger, generated CLI/MCP/Skill/product-entry surfaces, and owner receipt projection as external framework services.',
        'Return typed blockers when source refs, workspace scope, artifact scope, or owner gate evidence is missing.',
        '',
      ].join('\n'),
    },
    {
      path: knowledgePath,
      body: [
        `# ${owner} Boundary Knowledge`,
        '',
        'OPL owns generated interfaces, provider lifecycle, Agent Lab, queue, attempt ledger, and projection.',
        `${owner} owns domain semantics, accepted source refs, artifact authority, quality/export verdicts, memory body decisions, and owner receipts.`,
        'Mechanical scaffold validation, suite pass, provider completion, generated surface readiness, or scorecard pass is evidence only.',
        'A domain-ready or quality/export-ready claim requires an owner receipt, independent gate receipt, typed blocker closure, or route-back receipt from the declared owner boundary.',
        '',
      ].join('\n'),
    },
    {
      path: qualityGatePath,
      body: [
        `# ${title} Quality Gate`,
        '',
        'Quality gate declaration is required for every generated OPL-compatible stage.',
        'Dedicated review stage is conditional: create one only when the stage performs expert judgment, artifact/export mutation, domain truth movement, quality verdict, or a high-risk handoff.',
        '',
        'Pass conditions:',
        '',
        `- The \`${stageId}\` execution attempt produced explicit refs or an explicit typed blocker.`,
        '- The reviewer or owner gate reads direct evidence refs rather than shared execution context.',
        '- Mechanical completion, generated surface readiness, provider completion, or suite pass is not treated as a quality/export verdict.',
        '- Handoff is allowed only with an independent gate receipt, owner receipt, typed blocker closure, or route-back receipt.',
        '',
        'Fail-closed conditions:',
        '',
        '- Missing prompt, skill/tool, knowledge, source, artifact, workspace, or quality gate refs.',
        '- Missing independent review path for high-risk outputs.',
        '- Attempt self-review, shared-context review, stale evidence, or missing owner receipt.',
        '- Any request to write target truth, memory body, artifact body, quality/export verdict, or default promotion state from OPL generated surfaces.',
        '',
      ].join('\n'),
    },
  ];
}

export function buildFixtureStageDecompositionCloseout(input: FixtureStageSpec): StageDecompositionCloseoutPacket {
  const targetAgent = input.targetAgent;
  const owner = domainLabelFor(targetAgent);
  const stageId = input.stageId ?? (
    targetAgent.domain_id === 'sample-brief-agent' ? 'brief-draft' : 'agent-output-draft'
  );
  const actionId = input.actionId ?? (
    targetAgent.domain_id === 'sample-brief-agent' ? 'draft-brief' : 'draft-agent-output'
  );
  const title = input.title ?? (
    targetAgent.domain_id === 'sample-brief-agent' ? 'Brief Draft' : 'Agent Output Draft'
  );
  const summary = input.summary ?? (
    targetAgent.domain_id === 'sample-brief-agent'
      ? 'Draft the sample brief.'
      : `Draft the owner-gated ${owner} delivery.`
  );
  const promptPath = input.promptPath ?? (
    targetAgent.domain_id === 'sample-brief-agent'
      ? 'agent/prompts/brief-draft.md'
      : 'agent/prompts/agent-output-draft.md'
  );
  const stagePath = input.stagePath ?? (
    targetAgent.domain_id === 'sample-brief-agent'
      ? 'agent/stages/brief-draft.md'
      : 'agent/stages/agent-output-draft.md'
  );
  const skillPath = input.skillPath ?? (
    targetAgent.domain_id === 'sample-brief-agent'
      ? 'agent/skills/sample-brief-agent-domain-skill.md'
      : 'agent/skills/target-agent-domain-skill.md'
  );
  const knowledgePath = input.knowledgePath ?? (
    targetAgent.domain_id === 'sample-brief-agent'
      ? 'agent/knowledge/sample-brief-boundary-policy.md'
      : 'agent/knowledge/target-agent-boundary-policy.md'
  );
  const qualityGatePath = input.qualityGatePath ?? (
    targetAgent.domain_id === 'sample-brief-agent'
      ? 'agent/quality_gates/brief-draft-quality-gate.md'
      : 'agent/quality_gates/agent-output-draft-quality-gate.md'
  );
  const spec = {
    targetAgent,
    stageId,
    actionId,
    title,
    summary,
    promptPath,
    stagePath,
    skillPath,
    knowledgePath,
    qualityGatePath,
    owner,
  };
  const draft: StageDecompositionPackDraft = {
    surface_kind: 'opl_meta_agent_stage_decomposition_pack_draft',
    version: 'opl-meta-agent.stage-decomposition-pack-draft.v1',
    target_agent: targetAgent,
    owner_boundary: {
      target_domain_owner: owner,
      opl_framework_owner: 'one-person-lab',
      opl_meta_agent_role: 'stage_pack_authoring_refs_only',
      target_owner_keeps_truth_quality_artifact_authority: true,
    },
    no_forbidden_write_policy: noForbiddenWritePolicy(owner),
    action_catalog: buildActionCatalog({ targetAgent, actionId, owner }),
    stage_control_plane: buildStageControlPlane(spec),
    files: buildFiles(spec),
  };
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'stage-decomposition',
    closeout_id: `stage-decomposition-closeout:${targetAgent.domain_id}`,
    closeout_refs: [`receipt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-pack-draft`],
    consumed_refs: [`stage-packet:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-input`],
    consumed_memory_refs: [],
    writeback_receipt_refs: [],
    rejected_writes: [],
    next_owner: 'opl-meta-agent',
    domain_ready_verdict: 'domain_gate_pending',
    route_impact: {
      next_owner: 'opl-meta-agent',
      materialization_required: true,
      target_owner_gate_required: true,
    },
    authority_boundary: {
      opl: 'stage_attempt_closeout_transport_only',
      oma: 'pack_draft_authoring_refs_only',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
    stage_decomposition_pack_draft: draft,
  };
}

function validateRelativeMarkdownPath(filePath: unknown, field: string): string {
  const relPath = asString(filePath, field);
  if (path.isAbsolute(relPath) || relPath.includes('..') || !relPath.endsWith('.md')) {
    throw new Error(`stage-decomposition pack draft ${field} must be a relative markdown path.`);
  }
  if (!relPath.startsWith('agent/')) {
    throw new Error(`stage-decomposition pack draft ${field} must live under agent/.`);
  }
  return relPath;
}

function validateBody(body: unknown, relPath: string): string {
  const text = asString(body, `${relPath}.body`);
  if (placeholderPattern.test(text)) {
    throw new Error(`stage-decomposition pack draft file contains placeholder marker: ${relPath}`);
  }
  return text;
}

function filesByPath(files: unknown): Map<string, string> {
  const entries = asRecordArray(files, 'files');
  const byPath = new Map<string, string>();
  for (const entry of entries) {
    const relPath = validateRelativeMarkdownPath(entry.path, 'files[].path');
    if (byPath.has(relPath)) {
      throw new Error(`stage-decomposition pack draft file path is duplicated: ${relPath}`);
    }
    byPath.set(relPath, validateBody(entry.body, relPath));
  }
  return byPath;
}

function assertBooleanFalse(record: JsonObject, field: string, label = field): void {
  if (record[field] !== false) {
    throw new Error(`stage-decomposition pack draft ${label} must be false.`);
  }
}

function validateNoForbiddenWritePolicy(policy: JsonObject): void {
  if (policy.refs_only !== true) {
    throw new Error('stage-decomposition pack draft no_forbidden_write_policy.refs_only must be true.');
  }
  [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
  ].forEach((field) => assertBooleanFalse(policy, field, `no_forbidden_write_policy.${field}`));
}

function validateActionCatalog(catalog: JsonObject, targetAgent: TargetAgent): void {
  if (catalog.surface_kind !== 'family_action_catalog') {
    throw new Error('stage-decomposition pack draft action_catalog.surface_kind must be family_action_catalog.');
  }
  if (catalog.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft action_catalog target_domain_id does not match target agent.');
  }
  const actions = asRecordArray(catalog.actions, 'action_catalog.actions');
  actions.forEach((action) => {
    asString(action.action_id, 'action_catalog.actions[].action_id');
    const boundary = asRecord(action.authority_boundary, 'action_catalog.actions[].authority_boundary');
    [
      'can_write_target_domain_truth',
      'can_write_target_domain_memory_body',
      'can_mutate_target_domain_artifact_body',
      'can_authorize_target_domain_quality_or_export',
    ].forEach((field) => assertBooleanFalse(boundary, field, `action_catalog.actions[].authority_boundary.${field}`));
  });
}

function validateStageRefs(
  stage: JsonObject,
  field: string,
  refKind: string,
  prefix: string,
  files: Map<string, string>,
): string[] {
  const refs = asRecordArray(stage[field], `stage.${field}`);
  return refs.map((entry) => {
    if (entry.ref_kind !== refKind) {
      throw new Error(`stage-decomposition pack draft ${field} must use ${refKind}.`);
    }
    const relPath = validateRelativeMarkdownPath(entry.ref, `stage.${field}.ref`);
    if (!relPath.startsWith(prefix)) {
      throw new Error(`stage-decomposition pack draft ${field} refs must live under ${prefix}.`);
    }
    if (!files.has(relPath)) {
      throw new Error(`stage-decomposition pack draft ${field} ref has no file body: ${relPath}`);
    }
    return relPath;
  });
}

function validateQualityGateBody(files: Map<string, string>, qualityGatePath: string): void {
  const body = files.get(qualityGatePath) ?? '';
  if (!/Quality gate declaration is required/i.test(body)) {
    throw new Error(`stage-decomposition pack draft quality gate declaration missing: ${qualityGatePath}`);
  }
  if (!/Dedicated review stage is conditional/i.test(body)) {
    throw new Error(`stage-decomposition pack draft dedicated review stage policy missing: ${qualityGatePath}`);
  }
}

function validateStageControlPlane(
  stageControl: JsonObject,
  actionCatalog: JsonObject,
  targetAgent: TargetAgent,
  files: Map<string, string>,
): void {
  if (stageControl.surface_kind !== 'family_stage_control_plane') {
    throw new Error('stage-decomposition pack draft stage_control_plane.surface_kind must be family_stage_control_plane.');
  }
  if (stageControl.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft stage_control_plane target_domain_id does not match target agent.');
  }
  const actionIds = new Set(asRecordArray(actionCatalog.actions, 'action_catalog.actions').map((action) => (
    asString(action.action_id, 'action.action_id')
  )));
  const stages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
  const hasStageFile = [...files.keys()].some((relPath) => relPath.startsWith('agent/stages/') && !relPath.endsWith('/README.md'));
  if (!hasStageFile) {
    throw new Error('stage-decomposition pack draft must include a real agent/stages markdown file.');
  }
  stages.forEach((stage) => {
    const stageId = asString(stage.stage_id, 'stage.stage_id');
    const executor = asRecord(stage.selected_executor, `stage ${stageId}.selected_executor`);
    if (executor.executor_kind !== 'codex_cli' || executor.default_executor !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} must select codex_cli as default executor.`);
    }
    const promptRefs = validateStageRefs(stage, 'prompt_refs', 'domain_prompt_ref', 'agent/prompts/', files);
    const skillRefs = validateStageRefs(stage, 'skills', 'domain_skill_ref', 'agent/skills/', files);
    const knowledgeRefs = validateStageRefs(stage, 'knowledge_refs', 'domain_knowledge_ref', 'agent/knowledge/', files);
    const qualityGateRefs = validateStageRefs(stage, 'evaluation', 'domain_quality_gate_ref', 'agent/quality_gates/', files);
    qualityGateRefs.forEach((qualityGatePath) => validateQualityGateBody(files, qualityGatePath));

    const allowedActions = asStringArray(stage.allowed_action_refs, `stage ${stageId}.allowed_action_refs`);
    allowedActions.forEach((actionId) => {
      if (!actionIds.has(actionId)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} references unknown action ${actionId}.`);
      }
    });
    const gate = asRecord(stage.independent_gate_policy, `stage ${stageId}.independent_gate_policy`);
    if (gate.execution_review_separation_required !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} rejects self-review: execution_review_separation_required must be true.`);
    }
    [
      'mechanical_completion_can_close_stage',
      'provider_completion_can_claim_domain_ready',
      'generated_surface_readiness_can_claim_quality_or_export',
    ].forEach((field) => assertBooleanFalse(gate, field, `stage ${stageId}.independent_gate_policy.${field}`));

    const contract = asRecord(stage.stage_contract, `stage ${stageId}.stage_contract`);
    const requires = asStringArray(contract.requires, `stage ${stageId}.stage_contract.requires`);
    const ensures = asStringArray(contract.ensures, `stage ${stageId}.stage_contract.ensures`);
    [
      ...promptRefs.map((entry) => `prompt-ref:${entry}`),
      ...skillRefs.map((entry) => `skill-ref:${entry}`),
      ...knowledgeRefs.map((entry) => `knowledge-ref:${entry}`),
      ...qualityGateRefs.map((entry) => `quality-gate-ref:${entry}`),
      ...allowedActions.map((entry) => `action-ref:${entry}`),
    ].forEach((requiredRef) => {
      if (!requires.includes(requiredRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing required ref ${requiredRef}.`);
      }
    });
    if (!ensures.includes(`stage-attempt-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing stage attempt receipt ensure.`);
    }
    if (!ensures.includes(`independent-gate-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing independent gate receipt ensure.`);
    }
    const expectedReceiptRefs = asRecordArray(contract.expected_receipt_refs, `stage ${stageId}.stage_contract.expected_receipt_refs`);
    if (!expectedReceiptRefs.some((entry) => entry.ref === `independent-gate-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected independent gate receipt ref.`);
    }
    const boundary = asRecord(stage.authority_boundary, `stage ${stageId}.authority_boundary`);
    [
      'can_write_target_domain_truth',
      'can_write_target_domain_memory_body',
      'can_mutate_target_domain_artifact_body',
      'can_authorize_target_domain_quality_or_export',
    ].forEach((field) => assertBooleanFalse(boundary, field, `stage ${stageId}.authority_boundary.${field}`));
  });
}

export function validateStageDecompositionCloseoutPacket(
  packet: unknown,
  { targetAgent }: { targetAgent: TargetAgent },
): StageDecompositionPackDraft {
  if (!isRecord(packet)) {
    throw new Error('stage-decomposition closeout must be a typed JSON object.');
  }
  if (packet.surface_kind !== 'stage_attempt_closeout_packet') {
    throw new Error('stage-decomposition closeout must use surface_kind stage_attempt_closeout_packet.');
  }
  if (packet.stage_id !== 'stage-decomposition') {
    throw new Error('stage-decomposition closeout stage_id must be stage-decomposition.');
  }
  const closeoutRefs = asStringArray(packet.closeout_refs, 'closeout_refs');
  if (closeoutRefs.length === 0) {
    throw new Error('stage-decomposition closeout must include closeout_refs.');
  }
  const draft = asRecord(packet.stage_decomposition_pack_draft, 'stage_decomposition_pack_draft') as StageDecompositionPackDraft;
  if (draft.surface_kind !== 'opl_meta_agent_stage_decomposition_pack_draft') {
    throw new Error('stage-decomposition pack draft must declare surface_kind opl_meta_agent_stage_decomposition_pack_draft.');
  }
  if (draft.version !== 'opl-meta-agent.stage-decomposition-pack-draft.v1') {
    throw new Error('stage-decomposition pack draft version is unsupported.');
  }
  const draftTarget = asRecord(draft.target_agent, 'stage_decomposition_pack_draft.target_agent') as TargetAgent;
  if (draftTarget.domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft target_agent.domain_id does not match requested target.');
  }
  if ((draftTarget.domain_label ?? null) !== (targetAgent.domain_label ?? null)) {
    throw new Error('stage-decomposition pack draft target_agent.domain_label does not match requested target.');
  }
  if ((draftTarget.delivery_domain ?? null) !== (targetAgent.delivery_domain ?? null)) {
    throw new Error('stage-decomposition pack draft target_agent.delivery_domain does not match requested target.');
  }
  if ((draftTarget.target_brief ?? null) !== (targetAgent.target_brief ?? null)) {
    throw new Error('stage-decomposition pack draft target_agent.target_brief does not match requested target.');
  }
  validateNoForbiddenWritePolicy(asRecord(draft.no_forbidden_write_policy, 'no_forbidden_write_policy'));
  const files = filesByPath(draft.files);
  const actionCatalog = asRecord(draft.action_catalog, 'action_catalog');
  const stageControl = asRecord(draft.stage_control_plane, 'stage_control_plane');
  validateActionCatalog(actionCatalog, targetAgent);
  validateStageControlPlane(stageControl, actionCatalog, targetAgent, files);
  return {
    ...draft,
    files: [...files.entries()].map(([filePath, body]) => ({ path: filePath, body })),
  };
}

export function materializeStageDecompositionPackDraft(
  targetAgentDir: string,
  draft: StageDecompositionPackDraft,
): void {
  for (const file of draft.files) {
    const relPath = validateRelativeMarkdownPath(file.path, 'files[].path');
    const body = validateBody(file.body, relPath);
    const filePath = path.join(targetAgentDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
  }
  writeJson(path.join(targetAgentDir, 'contracts', 'action_catalog.json'), draft.action_catalog);
  writeJson(path.join(targetAgentDir, 'contracts', 'stage_control_plane.json'), draft.stage_control_plane);
}

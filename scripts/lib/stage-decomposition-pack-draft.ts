import fs from 'node:fs';
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';
import type { TargetAgent } from './meta-agent-loop.ts';
import { writeJson } from './meta-agent-loop.ts';
import {
  SERIES_DESIGN_PROFILE,
  STAGE_PROGRESS_DELTA_POLICY,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_CONTRACT,
  USER_STAGE_LOG_REQUIRED_FIELDS,
} from './standard-foundry-policies.ts';
import {
  buildStageNativeArtifactContract,
  buildStageNativeArtifactContractBundle,
} from './stage-native-artifact-contract.ts';

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

const STANDARD_STAGE_PACK_CONFORMANCE_VERSION = 'standard-stage-pack.v2';
const DEFAULT_STAGE_EXECUTOR_BINDING_REF = 'default_codex_cli';
const SHARED_POLICY_RELEASE = {
  policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
  policy_bundle_fingerprint: 'sha256:5d77102e99e6e49acd88714cd94dcafe0969b8f2a5529928d753002ac3d4619d',
  fingerprint_algorithm: 'sha256:stable-json',
  domain_contract_policy_release_pin_required: true,
  domain_adapter_must_not_copy_policy_body_as_authority: true,
  consumer_alignment_check: 'foundry:policy-release',
} as const;

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
  stage_native_artifact_contract: JsonObject;
  foundry_agent_series: JsonObject;
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

function stageNativeRefsFor(domainId: string, stageId: string) {
  return {
    artifactNativeContractRef: `artifact-native-contract-ref:${domainId}/${stageId}`,
    stageFolderContractRef: `stage-folder-contract-ref:${domainId}/${stageId}`,
    stageJsonRef: `stage-json-ref:${domainId}/${stageId}`,
    attemptJsonRef: `stage-attempt-json-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    manifestRef: `stage-manifest-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    receiptRef: `stage-attempt-receipt-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    blockerRef: `stage-typed-blocker-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    currentPointerRef: `stage-current-pointer-ref:${domainId}/${stageId}`,
    canonicalArtifactRef: `canonical-artifact-ref:${domainId}/${stageId}`,
    exportRef: `stage-export-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    lineageRef: `stage-lineage-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    retentionRef: `stage-retention-ref:${domainId}/${stageId}/{stage_attempt_id}`,
    physicalKernelLocatorRef: `opl-physical-kernel-locator-ref:${domainId}/${stageId}`,
    conformanceRef: `stage-artifact-conformance-ref:${domainId}/${stageId}`,
    workbenchConsumptionRef: `stage-artifact-workbench-consumption-ref:${domainId}/${stageId}`,
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
  const actionSummary = actionId === 'draft-agent-output'
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
  const stageNativeArtifactContract = buildStageNativeArtifactContract({
    domainId,
    stageId,
    domainTruthOwner: owner,
  });
  const stageNativeRefs = stageNativeRefsFor(domainId, stageId);
  return {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: `${snakeId(domainId)}_stage_plane`,
    target_domain_id: domainId,
    owner,
    stage_pack_conformance_version: STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
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
        stage_pack_conformance_version: STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
        selected_executor: {
          executor_kind: 'codex_cli',
          default_executor: true,
          executor_binding_ref: DEFAULT_STAGE_EXECUTOR_BINDING_REF,
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
          gate_ref: qualityGatePath,
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
            stageNativeRefs.artifactNativeContractRef,
            `prompt-ref:${promptPath}`,
            `skill-ref:${skillPath}`,
            `knowledge-ref:${knowledgePath}`,
            `quality-gate-ref:${qualityGatePath}`,
            `action-ref:${actionId}`,
            `workspace-scope-ref:${stageId}`,
            `source-scope-ref:${stageId}`,
            'runtime-ref:stage-progress-log-user-stage-log',
          ],
          ensures: [
            `stage-attempt-receipt-ref:${stageId}`,
            `executor-receipt-ref:${stageId}/codex-cli`,
            `boundary-receipt-ref:${stageId}/refs-only`,
            `independent-gate-receipt-ref:${stageId}`,
            `owner-handoff-ref:${stageId}`,
            `stage-user-log-ref:${stageId}`,
            stageNativeRefs.stageFolderContractRef,
            stageNativeRefs.stageJsonRef,
            stageNativeRefs.attemptJsonRef,
            stageNativeRefs.manifestRef,
            stageNativeRefs.receiptRef,
            stageNativeRefs.currentPointerRef,
            stageNativeRefs.canonicalArtifactRef,
            stageNativeRefs.exportRef,
            stageNativeRefs.lineageRef,
            stageNativeRefs.retentionRef,
            stageNativeRefs.physicalKernelLocatorRef,
            stageNativeRefs.conformanceRef,
            stageNativeRefs.workbenchConsumptionRef,
          ],
          expected_receipt_refs: [
            ref('stage_attempt_receipt_ref', `stage-attempt-receipt-ref:${stageId}`),
            ref('executor_receipt_ref', `executor-receipt-ref:${stageId}/codex-cli`),
            ref('boundary_receipt_ref', `boundary-receipt-ref:${stageId}/refs-only`),
            ref('independent_gate_receipt_ref', `independent-gate-receipt-ref:${stageId}`),
            ref('user_stage_log_ref', `stage-user-log-ref:${stageId}`),
            ref('artifact_native_contract_ref', stageNativeRefs.artifactNativeContractRef),
            ref('stage_folder_contract_ref', stageNativeRefs.stageFolderContractRef),
            ref('stage_json_ref', stageNativeRefs.stageJsonRef),
            ref('stage_attempt_json_ref', stageNativeRefs.attemptJsonRef),
            ref('stage_manifest_ref', stageNativeRefs.manifestRef),
            ref('stage_attempt_receipt_ref', stageNativeRefs.receiptRef),
            ref('stage_typed_blocker_ref', stageNativeRefs.blockerRef),
            ref('stage_current_pointer_ref', stageNativeRefs.currentPointerRef),
            ref('canonical_artifact_ref', stageNativeRefs.canonicalArtifactRef),
            ref('stage_export_ref', stageNativeRefs.exportRef),
            ref('stage_lineage_ref', stageNativeRefs.lineageRef),
            ref('stage_retention_ref', stageNativeRefs.retentionRef),
            ref('opl_physical_kernel_locator_ref', stageNativeRefs.physicalKernelLocatorRef),
            ref('stage_artifact_conformance_ref', stageNativeRefs.conformanceRef),
            ref('stage_artifact_workbench_consumption_ref', stageNativeRefs.workbenchConsumptionRef),
          ],
          source_scope_refs: [ref('source_scope_ref', `source-scope:${stageId}`)],
          artifact_scope_refs: [ref('artifact_scope_ref', `artifact-scope:${stageId}`)],
          workspace_scope_refs: [ref('workspace_scope_ref', `workspace-scope:${stageId}`)],
          stage_native_artifact_contract: stageNativeArtifactContract,
          user_stage_log_contract: USER_STAGE_LOG_CONTRACT,
          progress_delta_policy: STAGE_PROGRESS_DELTA_POLICY,
          typed_blocker_lineage_policy: TYPED_BLOCKER_LINEAGE_POLICY,
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

function buildFoundryAgentSeriesContract(targetAgent: TargetAgent, stageControlPlane: JsonObject, owner: string): JsonObject {
  const domainId = targetAgent.domain_id;
  return {
    surface_kind: 'opl_foundry_agent_series_contract',
    version: 'foundry-agent-series.v1',
    owner: 'one-person-lab',
    product_layer: 'foundry_agent',
    product_model: 'OPL Framework -> One Person Lab App -> Foundry Agents',
    standard_agent_requirement:
      'foundry_agents_share_identity_stage_authority_progress_currentness_closeout_and_app_projection_packets',
    contract_version_policy: {
      current_version: 'foundry-agent-series.v1',
      domain_contract_ref: 'contracts/foundry_agent_series.json',
      exact_version_pin_required: true,
      compatible_version_range: ['foundry-agent-series.v1'],
      breaking_change_requires_new_version: true,
      domain_descriptor_must_reference_domain_contract: true,
    },
    shared_release_pin_strategy: {
      owner_release_contract_ref: 'contracts/family-release/shared-owner-release.json',
      owner_commit_pin_required: true,
      domain_dependency_pin_required: true,
      supported_pin_sources: [
        'pyproject.toml',
        'uv.lock',
        'package.json',
        'package-lock.json',
      ],
      consumer_alignment_check: 'family:shared-release',
      domain_contract_version_pin_does_not_authorize_domain_truth: true,
    },
    shared_policy_release: SHARED_POLICY_RELEASE,
    domain_id: domainId,
    foundry_agent_id: domainId,
    domain_label: targetAgent.domain_label ?? domainId,
    domain_aliases: [],
    authority_owner: owner,
    stage_control_plane_ref: 'contracts/stage_control_plane.json',
    stage_control_plane_target_domain_id: stageControlPlane.target_domain_id,
    app_projection_ref: 'contracts/generated_surface_handoff.json#/product_entry',
    required_identity_fields: [
      'domain_id',
      'foundry_agent_id',
      'product_layer',
      'domain_label',
      'authority_owner',
      'stage_control_plane_ref',
    ],
    required_stage_packets: [
      'user_stage_log_contract',
      'stage_native_artifact_contract',
      'progress_delta_policy',
      'typed_blocker_lineage_policy',
      'effective_current_context',
      'owner_receipt_or_typed_blocker_closeout',
    ],
    shared_progress_projection_fields: [
      'progress_delta_classification',
      'deliverable_progress_delta',
      'platform_repair_delta',
      'next_forced_delta',
    ],
    domain_progress_aliases: {
      deliverable: ['target_agent_progress', 'foundry_agent_progress', 'agent_build_progress'],
      platform: ['platform_interface_repair', 'agent_lab_or_opl_surface_repair', 'platform_repair_delta'],
    },
    domain_adapter_policy: {
      domain_specific_aliases_only: true,
      no_parallel_progress_schema: true,
      no_parallel_blocker_lineage_schema: true,
      no_domain_runtime_fork: true,
    },
    app_projection_policy: {
      app_consumes_shared_progress_projection_only: true,
      app_can_read_domain_body: false,
      app_can_write_domain_truth: false,
      app_can_claim_quality_or_export: false,
      display_policy: 'classification_only_no_domain_artifact_body',
    },
    authority_boundary: {
      opl_owns_series_contract: true,
      domain_owns_truth_quality_artifact_memory_and_receipts: true,
      app_owns_display_and_user_action_shell: true,
      generated_surface_can_claim_domain_ready: false,
    },
    series_design_profile: SERIES_DESIGN_PROFILE,
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
  const stageId = input.stageId ?? 'agent-output-draft';
  const actionId = input.actionId ?? 'draft-agent-output';
  const title = input.title ?? 'Agent Output Draft';
  const summary = input.summary ?? `Draft the owner-gated ${owner} delivery.`;
  const promptPath = input.promptPath ?? 'agent/prompts/agent-output-draft.md';
  const stagePath = input.stagePath ?? 'agent/stages/agent-output-draft.md';
  const skillPath = input.skillPath ?? 'agent/skills/target-agent-domain-skill.md';
  const knowledgePath = input.knowledgePath ?? 'agent/knowledge/target-agent-boundary-policy.md';
  const qualityGatePath = input.qualityGatePath ?? 'agent/quality_gates/agent-output-draft-quality-gate.md';
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
  const stageControlPlane = buildStageControlPlane(spec);
  const stageNativeArtifactContract = buildStageNativeArtifactContractBundle({
    domainId: targetAgent.domain_id,
    domainTruthOwner: owner,
    stageIds: [stageId],
  });
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
    stage_control_plane: stageControlPlane,
    stage_native_artifact_contract: stageNativeArtifactContract,
    foundry_agent_series: buildFoundryAgentSeriesContract(targetAgent, stageControlPlane, owner),
    files: buildFiles(spec),
  };
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'stage-decomposition',
    closeout_id: `stage-decomposition-closeout:${targetAgent.domain_id}`,
    closeout_refs: [
      `receipt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-pack-draft`,
      `artifact-native-contract-ref:${targetAgent.domain_id}/${stageId}`,
      `stage-folder-contract-ref:${targetAgent.domain_id}/${stageId}`,
    ],
    consumed_refs: [`stage-packet:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-input`],
    consumed_memory_refs: [],
    writeback_receipt_refs: [],
    rejected_writes: [],
    next_owner: 'opl-meta-agent',
    domain_ready_verdict: 'domain_gate_pending',
    user_stage_log: {
      stage_name: 'Stage decomposition pack draft',
      problem_summary: `The ${owner} target agent needs an OPL-compatible declarative domain pack before baseline generation.`,
      stage_goal: 'Produce action, stage, prompt, skill, knowledge, quality-gate, and authority-boundary refs for the target agent.',
      stage_work_done: [
        `Generated the ${stageId} stage pack draft with Codex CLI executor binding, independent gate policy, and owner handoff refs.`,
        'Materialized action catalog, stage control plane, prompt, skill, knowledge, and quality gate draft refs without writing target-domain truth.',
        'Generated Stage-Native Artifact Contract refs for stage folder, manifest, receipt, blocker, current pointer, and canonical artifact refs.',
      ],
      changed_stage_surfaces: [
        'action_catalog',
        'stage_control_plane',
        'stage_native_artifact_contract',
        'agent/prompts',
        'agent/stages',
        'agent/skills',
        'agent/knowledge',
        'agent/quality_gates',
      ],
      outcome: 'domain_gate_pending',
      remaining_blockers: ['target owner gate and baseline validation still required before promotion'],
      evidence_refs: [
        `receipt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-pack-draft`,
        `artifact-native-contract-ref:${targetAgent.domain_id}/${stageId}`,
        `stage-folder-contract-ref:${targetAgent.domain_id}/${stageId}`,
      ],
    },
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
  if (stageControl.stage_pack_conformance_version !== STANDARD_STAGE_PACK_CONFORMANCE_VERSION) {
    throw new Error(`stage-decomposition pack draft stage_control_plane.stage_pack_conformance_version must be ${STANDARD_STAGE_PACK_CONFORMANCE_VERSION}.`);
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
    if (executor.executor_binding_ref !== DEFAULT_STAGE_EXECUTOR_BINDING_REF) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} must use ${DEFAULT_STAGE_EXECUTOR_BINDING_REF} executor binding.`);
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
    if (!qualityGateRefs.includes(String(gate.gate_ref))) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} independent_gate_policy.gate_ref must reference a declared quality gate file.`);
    }
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
    const stageNativeRefs = stageNativeRefsFor(targetAgent.domain_id, stageId);
    const expectedArtifactNativeContractRef = stageNativeRefs.artifactNativeContractRef;
    const expectedStageFolderContractRef = stageNativeRefs.stageFolderContractRef;
    const expectedStageJsonRef = stageNativeRefs.stageJsonRef;
    const expectedAttemptJsonRef = stageNativeRefs.attemptJsonRef;
    const expectedManifestRef = stageNativeRefs.manifestRef;
    const expectedReceiptRef = stageNativeRefs.receiptRef;
    const expectedBlockerRef = stageNativeRefs.blockerRef;
    const expectedCurrentPointerRef = stageNativeRefs.currentPointerRef;
    const expectedCanonicalArtifactRef = stageNativeRefs.canonicalArtifactRef;
    const expectedExportRef = stageNativeRefs.exportRef;
    const expectedLineageRef = stageNativeRefs.lineageRef;
    const expectedRetentionRef = stageNativeRefs.retentionRef;
    const expectedPhysicalKernelLocatorRef = stageNativeRefs.physicalKernelLocatorRef;
    const expectedConformanceRef = stageNativeRefs.conformanceRef;
    const expectedWorkbenchConsumptionRef = stageNativeRefs.workbenchConsumptionRef;
    [
      expectedArtifactNativeContractRef,
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
    if (!requires.includes('runtime-ref:stage-progress-log-user-stage-log')) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing user stage log projection requirement.`);
    }
    if (!ensures.includes(`stage-user-log-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing user stage log ensure.`);
    }
    [
      expectedStageFolderContractRef,
      expectedStageJsonRef,
      expectedAttemptJsonRef,
      expectedManifestRef,
      expectedReceiptRef,
      expectedCurrentPointerRef,
      expectedCanonicalArtifactRef,
      expectedExportRef,
      expectedLineageRef,
      expectedRetentionRef,
      expectedPhysicalKernelLocatorRef,
      expectedConformanceRef,
      expectedWorkbenchConsumptionRef,
    ].forEach((ensuredRef) => {
      if (!ensures.includes(ensuredRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing stage-native ensure ${ensuredRef}.`);
      }
    });
    const expectedReceiptRefs = asRecordArray(contract.expected_receipt_refs, `stage ${stageId}.stage_contract.expected_receipt_refs`);
    if (!expectedReceiptRefs.some((entry) => entry.ref === `independent-gate-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected independent gate receipt ref.`);
    }
    if (!expectedReceiptRefs.some((entry) => entry.ref === `stage-user-log-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected user stage log receipt ref.`);
    }
    [
      expectedArtifactNativeContractRef,
      expectedStageFolderContractRef,
      expectedStageJsonRef,
      expectedAttemptJsonRef,
      expectedManifestRef,
      expectedReceiptRef,
      expectedBlockerRef,
      expectedCurrentPointerRef,
      expectedCanonicalArtifactRef,
      expectedExportRef,
      expectedLineageRef,
      expectedRetentionRef,
      expectedPhysicalKernelLocatorRef,
      expectedConformanceRef,
      expectedWorkbenchConsumptionRef,
    ].forEach((expectedRef) => {
      if (!expectedReceiptRefs.some((entry) => entry.ref === expectedRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected stage-native ref ${expectedRef}.`);
      }
    });
    const stageNativeArtifactContract = asRecord(
      contract.stage_native_artifact_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract`,
    );
    if (stageNativeArtifactContract.surface_kind !== 'opl_stage_native_artifact_contract') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_native_artifact_contract.surface_kind is invalid.`);
    }
    if (stageNativeArtifactContract.artifact_native_contract_ref !== expectedArtifactNativeContractRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} artifact_native_contract_ref is invalid.`);
    }
    if (stageNativeArtifactContract.stage_folder_contract_ref !== expectedStageFolderContractRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_folder_contract_ref is invalid.`);
    }
    if (stageNativeArtifactContract.stage_json_ref !== expectedStageJsonRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_json_ref is invalid.`);
    }
    if (stageNativeArtifactContract.attempt_json_ref !== expectedAttemptJsonRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} attempt_json_ref is invalid.`);
    }
    if (stageNativeArtifactContract.manifest_ref !== expectedManifestRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} manifest_ref is invalid.`);
    }
    if (stageNativeArtifactContract.receipt_ref !== expectedReceiptRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} receipt_ref is invalid.`);
    }
    if (stageNativeArtifactContract.blocker_ref !== expectedBlockerRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} blocker_ref is invalid.`);
    }
    if (stageNativeArtifactContract.current_pointer_ref !== expectedCurrentPointerRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} current_pointer_ref is invalid.`);
    }
    if (stageNativeArtifactContract.canonical_artifact_ref !== expectedCanonicalArtifactRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} canonical_artifact_ref is invalid.`);
    }
    if (stageNativeArtifactContract.export_ref !== expectedExportRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} export_ref is invalid.`);
    }
    if (stageNativeArtifactContract.lineage_ref !== expectedLineageRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} lineage_ref is invalid.`);
    }
    if (stageNativeArtifactContract.retention_ref !== expectedRetentionRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} retention_ref is invalid.`);
    }
    if (stageNativeArtifactContract.physical_kernel_locator_ref !== expectedPhysicalKernelLocatorRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_ref is invalid.`);
    }
    if (stageNativeArtifactContract.conformance_ref !== expectedConformanceRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_ref is invalid.`);
    }
    if (stageNativeArtifactContract.workbench_consumption_ref !== expectedWorkbenchConsumptionRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_ref is invalid.`);
    }
    const folderContract = asRecord(
      stageNativeArtifactContract.stage_folder_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.stage_folder_contract`,
    );
    [
      ['stage_folder_contract_ref', expectedStageFolderContractRef],
      ['stage_json_ref', expectedStageJsonRef],
      ['attempt_json_ref', expectedAttemptJsonRef],
      ['manifest_ref', expectedManifestRef],
      ['receipt_ref', expectedReceiptRef],
      ['blocker_ref', expectedBlockerRef],
      ['current_pointer_ref', expectedCurrentPointerRef],
      ['canonical_artifact_ref', expectedCanonicalArtifactRef],
      ['export_ref', expectedExportRef],
      ['lineage_ref', expectedLineageRef],
      ['retention_ref', expectedRetentionRef],
      ['physical_kernel_locator_ref', expectedPhysicalKernelLocatorRef],
      ['conformance_ref', expectedConformanceRef],
      ['workbench_consumption_ref', expectedWorkbenchConsumptionRef],
    ].forEach(([field, expectedValue]) => {
      if (folderContract[field] !== expectedValue) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} stage_folder_contract.${field} is invalid.`);
      }
    });
    const physicalKernelLocatorContract = asRecord(
      stageNativeArtifactContract.physical_kernel_locator_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract`,
    );
    if (physicalKernelLocatorContract.physical_kernel_locator_ref !== expectedPhysicalKernelLocatorRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_contract ref is invalid.`);
    }
    if (physicalKernelLocatorContract.source_contract_ref !== 'contracts/opl-framework/stage-artifact-runtime-contract.json') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_contract source contract is invalid.`);
    }
    if (physicalKernelLocatorContract.oma_materializes_ref_template_only !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical kernel locator must be refs-only.`);
    }
    assertBooleanFalse(
      physicalKernelLocatorContract,
      'oma_can_create_runtime_state',
      `stage ${stageId}.physical_kernel_locator_contract.oma_can_create_runtime_state`,
    );
    const conformanceContract = asRecord(
      stageNativeArtifactContract.conformance_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.conformance_contract`,
    );
    if (conformanceContract.surface_kind !== 'opl_stage_artifact_runtime_conformance') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_contract.surface_kind is invalid.`);
    }
    if (conformanceContract.conformance_ref !== expectedConformanceRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_contract ref is invalid.`);
    }
    assertBooleanFalse(
      conformanceContract,
      'domain_readiness_claim',
      `stage ${stageId}.conformance_contract.domain_readiness_claim`,
    );
    assertBooleanFalse(
      conformanceContract,
      'oma_can_claim_conformance_pass',
      `stage ${stageId}.conformance_contract.oma_can_claim_conformance_pass`,
    );
    const workbenchConsumptionContract = asRecord(
      stageNativeArtifactContract.workbench_consumption_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.workbench_consumption_contract`,
    );
    if (workbenchConsumptionContract.surface_kind !== 'opl_stage_artifact_runtime_workbench_consumption') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_contract.surface_kind is invalid.`);
    }
    if (workbenchConsumptionContract.workbench_consumption_ref !== expectedWorkbenchConsumptionRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_contract ref is invalid.`);
    }
    assertBooleanFalse(
      workbenchConsumptionContract,
      'artifact_body_access',
      `stage ${stageId}.workbench_consumption_contract.artifact_body_access`,
    );
    assertBooleanFalse(
      workbenchConsumptionContract,
      'domain_verdict_authority',
      `stage ${stageId}.workbench_consumption_contract.domain_verdict_authority`,
    );
    assertBooleanFalse(
      workbenchConsumptionContract,
      'oma_can_write_workbench_state',
      `stage ${stageId}.workbench_consumption_contract.oma_can_write_workbench_state`,
    );
    const stageNativeBoundary = asRecord(
      stageNativeArtifactContract.authority_boundary,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.authority_boundary`,
    );
    [
      'oma_can_write_stage_folder_runtime_state',
      'oma_can_generate_target_domain_owner_receipt',
      'oma_can_write_target_domain_truth',
      'oma_can_write_target_domain_memory_body',
      'oma_can_mutate_target_domain_artifact_body',
      'oma_can_authorize_target_quality_or_export',
      'oma_can_promote_default_agent_without_gate',
      'oma_can_own_agent_lab_runner',
      'oma_can_own_queue',
      'oma_can_own_attempt_ledger',
      'oma_can_own_worktree_lifecycle',
      'oma_can_own_promotion_gate',
      'oma_can_own_app_shell',
      'oma_can_write_target_owner_closeout',
      'oma_can_create_stage_folder_runtime_state',
      'oma_can_write_target_owner_receipt_body',
      'oma_can_owner_promote_target_agent',
      'oma_can_manage_target_worktree_lifecycle',
    ].forEach((field) => assertBooleanFalse(
      stageNativeBoundary,
      field,
      `stage ${stageId}.stage_native_artifact_contract.authority_boundary.${field}`,
    ));
    const userStageLog = asRecord(contract.user_stage_log_contract, `stage ${stageId}.stage_contract.user_stage_log_contract`);
    const requiredFields = asStringArray(
      userStageLog.required_domain_semantic_fields,
      `stage ${stageId}.stage_contract.user_stage_log_contract.required_domain_semantic_fields`,
    );
    for (const field of USER_STAGE_LOG_REQUIRED_FIELDS) {
      if (!requiredFields.includes(field)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} user_stage_log_contract missing field ${field}.`);
      }
    }
    const progressDeltaPolicy = asRecord(contract.progress_delta_policy, `stage ${stageId}.stage_contract.progress_delta_policy`);
    if (progressDeltaPolicy.surface_kind !== STAGE_PROGRESS_DELTA_POLICY.surface_kind) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} progress_delta_policy.surface_kind is invalid.`);
    }
    const progressRequiredFields = asStringArray(
      progressDeltaPolicy.required_fields,
      `stage ${stageId}.stage_contract.progress_delta_policy.required_fields`,
    );
    [
      'progress_delta_classification',
      'deliverable_progress_delta',
      'platform_repair_delta',
      'next_forced_delta',
    ].forEach((field) => {
      if (!progressRequiredFields.includes(field)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} progress_delta_policy missing field ${field}.`);
      }
    });
    const typedBlockerLineagePolicy = asRecord(
      contract.typed_blocker_lineage_policy,
      `stage ${stageId}.stage_contract.typed_blocker_lineage_policy`,
    );
    if (typedBlockerLineagePolicy.surface_kind !== TYPED_BLOCKER_LINEAGE_POLICY.surface_kind) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} typed_blocker_lineage_policy.surface_kind is invalid.`);
    }
    const blockerRequiredFields = asStringArray(
      typedBlockerLineagePolicy.required_fields,
      `stage ${stageId}.stage_contract.typed_blocker_lineage_policy.required_fields`,
    );
    [
      'blocker_family',
      'repeat_count',
      'next_forced_delta',
      'escalation_owner',
    ].forEach((field) => {
      if (!blockerRequiredFields.includes(field)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} typed_blocker_lineage_policy missing field ${field}.`);
      }
    });
    const boundary = asRecord(stage.authority_boundary, `stage ${stageId}.authority_boundary`);
    [
      'can_write_target_domain_truth',
      'can_write_target_domain_memory_body',
      'can_mutate_target_domain_artifact_body',
      'can_authorize_target_domain_quality_or_export',
    ].forEach((field) => assertBooleanFalse(boundary, field, `stage ${stageId}.authority_boundary.${field}`));
  });
}

function validateStageNativeArtifactContractBundle(
  bundle: JsonObject,
  stageControl: JsonObject,
  targetAgent: TargetAgent,
): void {
  if (bundle.surface_kind !== 'opl_stage_native_artifact_contract_bundle') {
    throw new Error('stage-decomposition pack draft stage_native_artifact_contract.surface_kind is invalid.');
  }
  if (bundle.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft stage_native_artifact_contract target_domain_id does not match target agent.');
  }
  const stages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
  const contracts = asRecordArray(bundle.contracts, 'stage_native_artifact_contract.contracts');
  if (contracts.length !== stages.length) {
    throw new Error('stage-decomposition pack draft stage_native_artifact_contract must include one contract per stage.');
  }
  const contractRefs = asStringArray(
    bundle.artifact_native_contract_refs,
    'stage_native_artifact_contract.artifact_native_contract_refs',
  );
  const folderRefs = asStringArray(
    bundle.stage_folder_contract_refs,
    'stage_native_artifact_contract.stage_folder_contract_refs',
  );
  const stageJsonRefs = asStringArray(
    bundle.stage_json_refs,
    'stage_native_artifact_contract.stage_json_refs',
  );
  const attemptJsonRefs = asStringArray(
    bundle.attempt_json_ref_templates,
    'stage_native_artifact_contract.attempt_json_ref_templates',
  );
  const manifestRefs = asStringArray(
    bundle.manifest_ref_templates,
    'stage_native_artifact_contract.manifest_ref_templates',
  );
  const receiptRefs = asStringArray(
    bundle.receipt_ref_templates,
    'stage_native_artifact_contract.receipt_ref_templates',
  );
  const currentPointerRefs = asStringArray(
    bundle.current_pointer_refs,
    'stage_native_artifact_contract.current_pointer_refs',
  );
  const canonicalRefs = asStringArray(
    bundle.canonical_artifact_refs,
    'stage_native_artifact_contract.canonical_artifact_refs',
  );
  const exportRefs = asStringArray(
    bundle.export_ref_templates,
    'stage_native_artifact_contract.export_ref_templates',
  );
  const lineageRefs = asStringArray(
    bundle.lineage_ref_templates,
    'stage_native_artifact_contract.lineage_ref_templates',
  );
  const retentionRefs = asStringArray(
    bundle.retention_ref_templates,
    'stage_native_artifact_contract.retention_ref_templates',
  );
  const physicalKernelLocatorRefs = asStringArray(
    bundle.physical_kernel_locator_refs,
    'stage_native_artifact_contract.physical_kernel_locator_refs',
  );
  const conformanceRefs = asStringArray(
    bundle.conformance_refs,
    'stage_native_artifact_contract.conformance_refs',
  );
  const workbenchConsumptionRefs = asStringArray(
    bundle.workbench_consumption_refs,
    'stage_native_artifact_contract.workbench_consumption_refs',
  );
  stages.forEach((stage) => {
    const stageId = asString(stage.stage_id, 'stage.stage_id');
    const stageNativeRefs = stageNativeRefsFor(targetAgent.domain_id, stageId);
    const expectedRefs = [
      [contractRefs, stageNativeRefs.artifactNativeContractRef],
      [folderRefs, stageNativeRefs.stageFolderContractRef],
      [stageJsonRefs, stageNativeRefs.stageJsonRef],
      [attemptJsonRefs, stageNativeRefs.attemptJsonRef],
      [manifestRefs, stageNativeRefs.manifestRef],
      [receiptRefs, stageNativeRefs.receiptRef],
      [currentPointerRefs, stageNativeRefs.currentPointerRef],
      [canonicalRefs, stageNativeRefs.canonicalArtifactRef],
      [exportRefs, stageNativeRefs.exportRef],
      [lineageRefs, stageNativeRefs.lineageRef],
      [retentionRefs, stageNativeRefs.retentionRef],
      [physicalKernelLocatorRefs, stageNativeRefs.physicalKernelLocatorRef],
      [conformanceRefs, stageNativeRefs.conformanceRef],
      [workbenchConsumptionRefs, stageNativeRefs.workbenchConsumptionRef],
    ] as const;
    expectedRefs.forEach(([refs, expectedRef]) => {
      if (!refs.includes(expectedRef)) {
        throw new Error(`stage-decomposition pack draft stage_native_artifact_contract missing ${expectedRef}.`);
      }
    });
    const embedded = asRecord(
      asRecord(stage.stage_contract, `stage ${stageId}.stage_contract`).stage_native_artifact_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract`,
    );
    const matching = contracts.find((contract) => (
      contract.artifact_native_contract_ref === stageNativeRefs.artifactNativeContractRef
    ));
    if (!matching) {
      throw new Error(
        `stage-decomposition pack draft stage_native_artifact_contract missing stage contract ${stageNativeRefs.artifactNativeContractRef}.`,
      );
    }
    if (JSON.stringify(matching) !== JSON.stringify(embedded)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} embedded and bundled stage-native contracts must match.`);
    }
  });
  const boundary = asRecord(bundle.authority_boundary, 'stage_native_artifact_contract.authority_boundary');
  [
    'oma_can_write_stage_folder_runtime_state',
    'oma_can_generate_target_domain_owner_receipt',
    'oma_can_write_target_domain_truth',
    'oma_can_write_target_domain_memory_body',
    'oma_can_mutate_target_domain_artifact_body',
    'oma_can_authorize_target_quality_or_export',
    'oma_can_promote_default_agent_without_gate',
    'oma_can_own_agent_lab_runner',
    'oma_can_own_queue',
    'oma_can_own_attempt_ledger',
    'oma_can_own_worktree_lifecycle',
    'oma_can_own_promotion_gate',
    'oma_can_own_app_shell',
    'oma_can_write_target_owner_closeout',
    'oma_can_create_stage_folder_runtime_state',
    'oma_can_write_target_owner_receipt_body',
    'oma_can_owner_promote_target_agent',
    'oma_can_manage_target_worktree_lifecycle',
  ].forEach((field) => assertBooleanFalse(boundary, field, `stage_native_artifact_contract.authority_boundary.${field}`));
}

function refTemplateRecord({
  contract,
  fileName,
  refKind,
  refValue,
}: {
  contract: JsonObject;
  fileName: string;
  refKind: string;
  refValue: string;
}): JsonObject {
  return {
    surface_kind: 'opl_stage_native_artifact_materialized_ref',
    version: 'stage-native-artifact-materialized-ref.v1',
    target_domain_id: contract.target_domain_id,
    stage_id: contract.stage_id,
    file_name: fileName,
    ref_kind: refKind,
    ref: refValue,
    materialized_by: 'opl-meta-agent',
    materialization_kind: 'compiler_ref_template_only_not_runtime_state',
    runtime_state_created: false,
    owner_promotion_created: false,
    target_worktree_lifecycle_managed: false,
    owner_receipt_body_created: false,
    contains_target_artifact_body: false,
    authority_boundary: contract.authority_boundary,
  };
}

function materializeStageNativeArtifactRefFiles(targetAgentDir: string, draft: StageDecompositionPackDraft): void {
  const contracts = asRecordArray(draft.stage_native_artifact_contract.contracts, 'stage_native_artifact_contract.contracts');
  for (const contract of contracts) {
    const stageId = asString(contract.stage_id, 'stage_native_artifact_contract.contracts[].stage_id');
    const outputDir = path.join(targetAgentDir, 'contracts', 'stage_native_artifacts', stageId);
    fs.mkdirSync(outputDir, { recursive: true });
    const fileRefs = [
      ['stage.json', 'stage_json_ref', String(contract.stage_json_ref)],
      ['attempt.json', 'stage_attempt_json_ref', String(contract.attempt_json_ref)],
      ['stage.manifest.json', 'stage_manifest_ref', String(contract.manifest_ref)],
      ['receipt.json', 'stage_attempt_receipt_ref', String(contract.receipt_ref)],
      ['current.json', 'stage_current_pointer_ref', String(contract.current_pointer_ref)],
      ['canonical.json', 'canonical_artifact_ref', String(contract.canonical_artifact_ref)],
      ['export.json', 'stage_export_ref', String(contract.export_ref)],
      ['lineage.json', 'stage_lineage_ref', String(contract.lineage_ref)],
      ['retention.json', 'stage_retention_ref', String(contract.retention_ref)],
      ['physical_kernel_locator.json', 'opl_physical_kernel_locator_ref', String(contract.physical_kernel_locator_ref)],
      ['conformance.json', 'stage_artifact_conformance_ref', String(contract.conformance_ref)],
      ['workbench_consumption.json', 'stage_artifact_workbench_consumption_ref', String(contract.workbench_consumption_ref)],
    ] as const;
    fileRefs.forEach(([fileName, refKind, refValue]) => {
      writeJson(path.join(outputDir, fileName), refTemplateRecord({
        contract,
        fileName,
        refKind,
        refValue,
      }));
    });
  }
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
  const stageNativeArtifactContract = asRecord(
    draft.stage_native_artifact_contract,
    'stage_native_artifact_contract',
  );
  validateStageNativeArtifactContractBundle(stageNativeArtifactContract, stageControl, targetAgent);
  const foundrySeries = asRecord(draft.foundry_agent_series, 'foundry_agent_series');
  const seriesDesignProfile = asRecord(foundrySeries.series_design_profile, 'foundry_agent_series.series_design_profile');
  if (seriesDesignProfile.surface_kind !== SERIES_DESIGN_PROFILE.surface_kind) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.series_design_profile.surface_kind is invalid.');
  }
  if (seriesDesignProfile.profile_id !== SERIES_DESIGN_PROFILE.profile_id) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.series_design_profile.profile_id is invalid.');
  }
  const stagePackSections = asStringArray(
    seriesDesignProfile.stage_pack_sections,
    'foundry_agent_series.series_design_profile.stage_pack_sections',
  );
  asStringArray(
    SERIES_DESIGN_PROFILE.stage_pack_sections,
    'standard_foundry_policy.series_design_profile.stage_pack_sections',
  ).forEach((section) => {
    if (!stagePackSections.includes(section)) {
      throw new Error(`stage-decomposition pack draft foundry_agent_series.series_design_profile missing ${section} section.`);
    }
  });
  const sharedCloseout = asRecord(
    seriesDesignProfile.shared_closeout_contract,
    'foundry_agent_series.series_design_profile.shared_closeout_contract',
  );
  assertBooleanFalse(
    sharedCloseout,
    'provider_completion_is_closeout',
    'foundry_agent_series.series_design_profile.shared_closeout_contract.provider_completion_is_closeout',
  );
  return {
    ...draft,
    stage_native_artifact_contract: stageNativeArtifactContract,
    foundry_agent_series: foundrySeries,
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
  writeJson(
    path.join(targetAgentDir, 'contracts', 'stage_native_artifact_contract.json'),
    draft.stage_native_artifact_contract,
  );
  materializeStageNativeArtifactRefFiles(targetAgentDir, draft);
  writeJson(path.join(targetAgentDir, 'contracts', 'foundry_agent_series.json'), draft.foundry_agent_series);
}

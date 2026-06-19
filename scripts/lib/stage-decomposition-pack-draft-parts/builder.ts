import type { JsonObject } from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import {
  buildStageNativeArtifactContract,
  buildStageNativeArtifactContractBundle,
} from '../stage-native-artifact-contract.ts';
import type {
  FixtureStageSpec,
  StageDecompositionCloseoutPacket,
  StageDecompositionFileDraft,
  StageDecompositionPackDraft,
} from './shared.ts';
import {
  DEFAULT_STAGE_EXECUTOR_BINDING_REF,
  FORBIDDEN_GENERIC_OWNER_ROLES,
  SERIES_DESIGN_PROFILE,
  SHARED_POLICY_RELEASE,
  STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
  STAGE_PROGRESS_DELTA_POLICY,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_CONTRACT,
  commandPrefix,
  domainLabelFor,
  ref,
  snakeId,
  stageNativeRefsFor,
  targetBriefFor,
} from './shared.ts';

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

function buildArtifactMorphologyContract({
  targetAgent,
  owner,
  stageId,
}: {
  targetAgent: TargetAgent;
  owner: string;
  stageId: string;
}): JsonObject {
  return {
    surface_kind: 'target_domain_artifact_morphology_contract',
    version: 'artifact-morphology.v1',
    contract_id: `${snakeId(targetAgent.domain_id)}_artifact_morphology`,
    target_domain_id: targetAgent.domain_id,
    owner,
    purpose:
      'Require OMA stage decomposition to preserve the target-domain deliverable shape before generating an agent pack.',
    native_source_policy: {
      required: true,
      native_source_format_refs: [
        `artifact-native-source-format-ref:${targetAgent.domain_id}/${stageId}`,
      ],
      creative_source_must_be_domain_native: true,
      creative_source_must_not_be_generator_code: true,
      generator_code_allowed_roles: [
        'assembly',
        'metrics',
        'validation',
        'export',
        'reporting',
      ],
    },
    artifact_body_policy: {
      target_domain_owns_artifact_body: true,
      oma_can_write_target_artifact_body: false,
      opl_can_infer_artifact_body_shape: false,
      scaffold_or_suite_pass_is_not_artifact_shape_evidence: true,
    },
    sharding_policy: {
      required_for_book_length_or_large_artifacts: true,
      shard_unit_refs: [
        `artifact-shard-unit-ref:${targetAgent.domain_id}/${stageId}`,
      ],
      assembled_output_is_delivery_ref_not_primary_creative_source: true,
      monolithic_creative_source_requires_owner_approval: true,
    },
    target_extent_policy: {
      owner_or_source_declared_extent_is_binding: true,
      silent_extent_downgrade_forbidden: true,
      shortfall_requires_typed_blocker: true,
    },
    asset_custody_policy: {
      project_local_asset_paths_required_for_final_assets: true,
      generated_asset_without_exposed_path_is_typed_blocker: true,
      placeholder_or_chat_only_asset_is_not_final_evidence: true,
    },
    realistic_task_review_policy: {
      required_before_baseline_delivery: true,
      reviewer_must_check_artifact_morphology: true,
      scaffold_interface_or_scorecard_only_review_forbidden: true,
    },
    stage_refs: {
      artifact_morphology_ref: `artifact-morphology-ref:${targetAgent.domain_id}`,
      native_source_format_ref: `artifact-native-source-format-ref:${targetAgent.domain_id}/${stageId}`,
      shard_unit_ref: `artifact-shard-unit-ref:${targetAgent.domain_id}/${stageId}`,
      extent_contract_ref: `target-extent-contract-ref:${targetAgent.domain_id}/${stageId}`,
      asset_custody_ref: `asset-custody-ref:${targetAgent.domain_id}/${stageId}`,
    },
    authority_boundary: {
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_artifact_body: false,
      oma_can_authorize_target_quality_or_export: false,
      target_domain_owner_must_accept_morphology: true,
    },
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
  artifactMorphologyContract,
}: Required<FixtureStageSpec> & { owner: string; artifactMorphologyContract: JsonObject }): JsonObject {
  const domainId = targetAgent.domain_id;
  const stageNativeArtifactContract = buildStageNativeArtifactContract({
    domainId,
    stageId,
    domainTruthOwner: owner,
  });
  const stageNativeRefs = stageNativeRefsFor(domainId, stageId);
  const morphologyRefs = artifactMorphologyContract.stage_refs as JsonObject;
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
            String(morphologyRefs.artifact_morphology_ref),
            String(morphologyRefs.native_source_format_ref),
            String(morphologyRefs.shard_unit_ref),
            String(morphologyRefs.extent_contract_ref),
            String(morphologyRefs.asset_custody_ref),
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
          artifact_morphology_contract: artifactMorphologyContract,
          artifact_morphology_refs: [
            ref('artifact_morphology_ref', String(morphologyRefs.artifact_morphology_ref)),
            ref('artifact_native_source_format_ref', String(morphologyRefs.native_source_format_ref)),
            ref('artifact_shard_unit_ref', String(morphologyRefs.shard_unit_ref)),
            ref('target_extent_contract_ref', String(morphologyRefs.extent_contract_ref)),
            ref('asset_custody_ref', String(morphologyRefs.asset_custody_ref)),
          ],
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
  const artifactMorphologyContract = buildArtifactMorphologyContract({ targetAgent, owner, stageId });
  const stageControlPlane = buildStageControlPlane({ ...spec, artifactMorphologyContract });
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
    artifact_morphology_contract: artifactMorphologyContract,
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
        'Attached a target-domain artifact morphology contract covering native source format, shard units, target extent, asset custody, and realistic task review.',
        'Materialized action catalog, stage control plane, prompt, skill, knowledge, and quality gate draft refs without writing target-domain truth.',
        'Generated Stage-Native Artifact Contract refs for stage folder, manifest, receipt, blocker, current pointer, and canonical artifact refs.',
      ],
      changed_stage_surfaces: [
        'action_catalog',
        'stage_control_plane',
        'artifact_morphology_contract',
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
        `artifact-morphology-ref:${targetAgent.domain_id}`,
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

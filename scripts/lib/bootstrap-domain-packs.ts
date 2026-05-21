import path from 'node:path';
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

export function writeSampleAgentDomainPack(targetAgentDir: string): void {
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
    forbidden_generic_owner_roles: FORBIDDEN_GENERIC_OWNER_ROLES,
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

export function writeRealTargetAgentDomainPack(
  targetAgentDir: string,
  targetAgent: TargetAgent,
): void {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  writeJson(path.join(targetAgentDir, 'contracts', 'action_catalog.json'), {
    surface_kind: 'family_action_catalog',
    version: 'family-action-catalog.v1',
    catalog_id: `${domainId.replaceAll('-', '_')}_action_catalog`,
    target_domain_id: domainId,
    owner: domainLabel,
    authority_boundary: {
      opl_role: 'generated_interface_projection_only',
      domain_truth_owner: domainLabel,
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      domain_repo_can_own_generated_surface: false,
    },
    actions: [
      {
        action_id: 'draft-real-target-brief',
        title: 'Draft Real Target Brief',
        summary: 'Draft a source-grounded real target brief from declared workspace refs.',
        owner: domainLabel,
        effect: 'mutating',
        source_command: {
          command: `${domainId} draft --workspace-root <workspace_root>`,
          surface_kind: 'domain_cli',
        },
        input_schema_ref: 'contracts/schemas/draft-real-target-brief.input.schema.json',
        output_schema_ref: 'contracts/schemas/draft-real-target-brief.output.schema.json',
        workspace_locator_fields: ['workspace_root'],
        human_gate_ids: ['real_target_owner_review'],
        supported_surfaces: {
          cli: {
            command: `${domainId} draft --workspace-root <workspace_root>`,
            surface_kind: 'domain_cli',
          },
          mcp: {
            tool_name: `${domainId.replaceAll('-', '_')}_draft_real_target_brief`,
            surface_kind: 'opl_generated_mcp_descriptor',
            descriptor_only: true,
            public_runtime: false,
          },
          skill: {
            command_contract_id: `${domainId}.draft-real-target-brief`,
            surface_kind: 'opl_generated_skill_contract',
          },
          product_entry: {
            action_key: 'draft-real-target-brief',
            command: `${domainId} product draft --workspace-root <workspace_root>`,
            surface_kind: 'domain_product_entry_action',
          },
          openai: {
            tool_name: `${domainId.replaceAll('-', '_')}_draft_real_target_brief`,
          },
          ai_sdk: {
            tool_name: `${domainId.replaceAll('-', '_')}_draft_real_target_brief`,
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
    forbidden_generic_owner_roles: FORBIDDEN_GENERIC_OWNER_ROLES,
  });

  writeJson(path.join(targetAgentDir, 'contracts', 'stage_control_plane.json'), {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: `${domainId.replaceAll('-', '_')}_stage_plane`,
    target_domain_id: domainId,
    owner: domainLabel,
    authority_boundary: {
      domain_truth_owner: domainLabel,
      opl_role: 'stage_runtime_projection_and_generated_interface_owner',
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
    },
    stages: [
      {
        stage_id: 'real-target-brief-draft',
        stage_kind: 'creation',
        title: 'Real Target Brief Draft',
        summary: 'Draft the real target brief.',
        goal: 'Create a source-grounded brief from workspace refs.',
        owner: domainLabel,
        domain_stage_refs: ['real-target-brief-draft'],
        inputs: [],
        knowledge_refs: [],
        skills: [],
        prompt_refs: [],
        allowed_action_refs: ['draft-real-target-brief'],
        outputs: [],
        evaluation: [],
        handoff: null,
        source_refs: [],
        authority_boundary: {
          domain_truth_owner: domainLabel,
          opl_role: 'projection_only',
        },
      },
    ],
  });
}

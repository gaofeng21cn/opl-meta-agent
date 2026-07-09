import fs from 'node:fs';
import path from 'node:path';

export type JsonObject = Record<string, any>;

type DomainPackRefsField =
  | 'prompt_policy_refs'
  | 'stage_policy_refs'
  | 'skill_policy_refs'
  | 'quality_gate_refs'
  | 'knowledge_policy_refs';

type DomainPackSection = {
  section: string;
  dir: string;
  refsField: DomainPackRefsField;
  refKind: string;
};

type DomainPackFileSummary = {
  section: string;
  path: string;
  ref: string;
  byte_length: number;
  non_empty: true;
};

export type DomainPackSummary = {
  status: 'ready';
  domain_id: string;
  pack_root: 'agent';
  required_section_count: number;
  required_file_count: number;
  verified_file_count: number;
  required_files: DomainPackFileSummary[];
  section_file_counts: Record<string, number>;
  prompt_policy_refs: string[];
  stage_policy_refs: string[];
  skill_policy_refs: string[];
  quality_gate_refs: string[];
  knowledge_policy_refs: string[];
};

export type DomainPackReceiptFields = {
  domain_pack_status: DomainPackSummary['status'];
  prompt_policy_refs: string[];
  skill_policy_refs: string[];
  quality_gate_refs: string[];
  knowledge_policy_refs: string[];
};

export type MinimalTargetAgent = {
  domain_id: string;
  domain_label?: string | null;
  target_brief?: string | null;
  reference_design_source_refs?: string[] | null;
  reference_design_pattern_notes?: string[] | null;
};

const DOMAIN_PACK_SECTIONS: DomainPackSection[] = [
  {
    section: 'prompts',
    dir: 'agent/prompts',
    refsField: 'prompt_policy_refs',
    refKind: 'prompt_policy_ref',
  },
  {
    section: 'stages',
    dir: 'agent/stages',
    refsField: 'stage_policy_refs',
    refKind: 'stage_policy_ref',
  },
  {
    section: 'skills',
    dir: 'agent/skills',
    refsField: 'skill_policy_refs',
    refKind: 'skill_policy_ref',
  },
  {
    section: 'quality_gates',
    dir: 'agent/quality_gates',
    refsField: 'quality_gate_refs',
    refKind: 'quality_gate_ref',
  },
  {
    section: 'knowledge',
    dir: 'agent/knowledge',
    refsField: 'knowledge_policy_refs',
    refKind: 'knowledge_policy_ref',
  },
];

const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

function stringList(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry) => entry.trim()).map((entry) => entry.trim()) : [];
}

function buildReferenceDesignBoundary(targetAgent: MinimalTargetAgent): JsonObject {
  return {
    source_refs: stringList(targetAgent.reference_design_source_refs),
    pattern_notes: stringList(targetAgent.reference_design_pattern_notes),
    role: 'external_architecture_inspiration_not_target_domain_truth',
    may_inform_stage_graph: true,
    may_inform_quality_gate_design: true,
    may_inform_agent_lab_suite_seed: true,
    can_copy_external_runtime: false,
    can_write_target_domain_truth: false,
    can_replace_target_owner_judgment: false,
  };
}

function referenceDesignMarkdown(targetAgent: MinimalTargetAgent): string[] {
  const sourceRefs = stringList(targetAgent.reference_design_source_refs);
  const patternNotes = stringList(targetAgent.reference_design_pattern_notes);
  if (sourceRefs.length === 0 && patternNotes.length === 0) {
    return [];
  }
  return [
    '## Reference Design Inputs',
    '',
    'OMA recorded these external refs as design inspiration only; they are not target-domain truth, owner acceptance, or runtime dependencies.',
    ...sourceRefs.map((ref) => `- Source ref: ${ref}`),
    ...patternNotes.map((note) => `- Transfer pattern: ${note}`),
    'Extract transferable architecture, workflow, rubric, handoff, evaluation, and failure-taxonomy patterns. Do not copy external runtime ownership, private data, or domain verdicts.',
    '',
  ];
}

const targetPrimarySkillRef = 'agent/primary_skill/SKILL.md';

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function policyRef({
  domainId,
  refKind,
  relPath,
}: {
  domainId: string;
  refKind: string;
  relPath: string;
}): string {
  return `${refKind}:${domainId}/${relPath}`;
}

export function readDomainPackSummary(
  repoDir: string,
  { domainId }: { domainId?: string } = {},
): DomainPackSummary {
  const resolvedRepoDir = path.resolve(repoDir);
  const resolvedDomainId = domainId ?? path.basename(resolvedRepoDir);
  const summary: DomainPackSummary = {
    status: 'ready',
    domain_id: resolvedDomainId,
    pack_root: 'agent',
    required_section_count: DOMAIN_PACK_SECTIONS.length,
    required_file_count: 0,
    verified_file_count: 0,
    required_files: [],
    section_file_counts: {},
    prompt_policy_refs: [],
    stage_policy_refs: [],
    skill_policy_refs: [],
    quality_gate_refs: [],
    knowledge_policy_refs: [],
  };

  for (const section of DOMAIN_PACK_SECTIONS) {
    const dirPath = path.join(resolvedRepoDir, section.dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Domain pack directory is missing: ${section.dir}`);
    }
    const relPaths = fs.readdirSync(dirPath)
      .filter((entry) => entry.endsWith('.md'))
      .sort()
      .map((entry) => path.join(section.dir, entry));
    if (relPaths.length === 0) {
      throw new Error(`Domain pack directory has no markdown files: ${section.dir}`);
    }
    summary.section_file_counts[section.section] = relPaths.length;
    summary.required_file_count += relPaths.length;

    for (const relPath of relPaths) {
      const filePath = path.join(resolvedRepoDir, relPath);
      const body = fs.readFileSync(filePath, 'utf8');
      if (!body.trim()) {
        throw new Error(`Domain pack file is empty: ${relPath}`);
      }
      if (placeholderPattern.test(body)) {
        throw new Error(`Domain pack file contains placeholder marker: ${relPath}`);
      }
      const ref = policyRef({
        domainId: resolvedDomainId,
        refKind: section.refKind,
        relPath,
      });
      summary.required_files.push({
        section: section.section,
        path: relPath,
        ref,
        byte_length: Buffer.byteLength(body),
        non_empty: true,
      });
      summary[section.refsField].push(ref);
      summary.verified_file_count += 1;
    }
  }

  return summary;
}

export function domainPackReceiptFields(summary: DomainPackSummary): DomainPackReceiptFields {
  return {
    domain_pack_status: summary.status,
    prompt_policy_refs: summary.prompt_policy_refs,
    skill_policy_refs: summary.skill_policy_refs,
    quality_gate_refs: summary.quality_gate_refs,
    knowledge_policy_refs: summary.knowledge_policy_refs,
  };
}

export function writeMinimalAgentDomainPack(targetAgentDir: string, targetAgent: MinimalTargetAgent): void {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  const files = {
    'agent/prompts/README.md': [
      `# ${domainLabel} Prompts`,
      '',
      'Prompt policies stay domain-owned. OPL may project prompt refs but does not copy domain truth or memory bodies.',
      '',
    ].join('\n'),
    'agent/stages/README.md': [
      `# ${domainLabel} Stages`,
      '',
      'Stage policy refs describe the minimal agent flow. OPL owns generated runtime projection and hosted interfaces.',
      '',
    ].join('\n'),
    'agent/skills/README.md': [
      `# ${domainLabel} Skills`,
      '',
      'Skill policy refs declare direct domain entry points and keep parity with OPL-hosted invocation receipts.',
      '',
    ].join('\n'),
    'agent/quality_gates/README.md': [
      `# ${domainLabel} Quality Gates`,
      '',
      'Quality and readiness verdicts stay domain-owned. OPL projects refs and receipts only.',
      '',
    ].join('\n'),
    'agent/knowledge/README.md': [
      `# ${domainLabel} Knowledge`,
      '',
      'Knowledge policy refs locate source and memory policies. Runtime memory bodies stay outside OPL state.',
      '',
    ].join('\n'),
  };

  for (const [relPath, body] of Object.entries(files)) {
    const filePath = path.join(targetAgentDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
  }

  const fixturePath = path.join(
    targetAgentDir,
    'contracts',
    'production_acceptance',
    'morphology_conformance_fixture.json',
  );
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(
    fixturePath,
    `${JSON.stringify({
      surface_kind: 'generated_agent_morphology_conformance_fixture',
      schema_version: 1,
      domain_id: domainId,
      owner: domainId,
      fixture_status: 'required_by_default_generated_agent',
      canonical_semantic_pack_root: 'agent/',
      required_check_refs: [
        'check-ref:generated-agent/domain-pack-files-present',
        'check-ref:generated-agent/stage-action-contracts-present',
        'check-ref:generated-agent/OPL-generated-interface-owner',
        'check-ref:generated-agent/no-target-domain-truth-write',
        'check-ref:generated-agent/no-default-promotion-without-gate',
      ],
      conformance_refs: [
        'contracts/domain_descriptor.json',
        'contracts/foundry_agent_series.json',
        'contracts/action_catalog.json',
        'contracts/stage_control_plane.json',
        'agent/prompts/README.md',
        'agent/stages/README.md',
        'agent/skills/README.md',
        'agent/quality_gates/README.md',
        'agent/knowledge/README.md',
      ],
      authority_boundary: {
        refs_only: true,
        generated_interface_owner: 'one-person-lab',
        domain_repo_can_own_generated_surface: false,
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_domain_quality_or_export: false,
        can_promote_default_agent_without_gate: false,
      },
    }, null, 2)}\n`,
  );
}

function buildTargetAgentPrimarySkillMarkdown(targetAgent: MinimalTargetAgent): string {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  const targetBrief = targetAgent.target_brief
    ?? `Create an owner-gated ${domainLabel} delivery from declared workspace refs.`;
  return [
    '---',
    `name: ${domainId}`,
    `description: Use when Codex should operate ${domainLabel} as an OPL-compatible target agent.`,
    '---',
    '',
    `# ${domainLabel}`,
    '',
    '## Purpose',
    '',
    `Use this primary skill to operate the OPL-compatible ${domainLabel} target agent. The target job is: ${targetBrief}`,
    '',
    '## Entry',
    '',
    '- Start from the user-visible requested deliverable, source refs, quality bar, non-goals, and owner boundary.',
    '- Route work through this target agent primary skill before invoking narrower prompt, stage, quality gate, or method refs.',
    '- Keep OPL generated interfaces as carrier and runtime projection surfaces, not as target truth or quality verdicts.',
    '',
    '## Agent Lab And Owner Handoff',
    '',
    '- Preserve descriptor, action catalog, stage control plane, quality gate, capability map, and owner route refs.',
    '- Return Agent Lab evidence, independent reviewer evidence, no-forbidden-write proof, and owner-facing closeout refs.',
    '- When the target cannot proceed without authority, return typed blocker, human gate, route-back, or owner-gated continuation.',
    '',
    ...referenceDesignMarkdown(targetAgent),
    '## Delivery Gate',
    '',
    '- Scaffold exists is not completion.',
    '- Generated interface readiness is not completion.',
    '- Contract or manifest validation is not completion.',
    '- Suite pass is not completion.',
    '- Provider completion is not domain completion.',
    '- Complete delivery requires owner-routable evidence and one accepted closeout outcome: owner receipt, typed blocker, human gate, route-back, or owner-gated continuation.',
    '',
    '## Authority Boundary',
    '',
    '- OPL owns standard runtime, generated / hosted surfaces, package validation, Agent Lab execution, registry / App projection, and work-order lifecycle.',
    '- OPL Meta Agent generated this candidate primary skill and capability sidecar, but does not own final target truth.',
    '- The target domain owner owns domain truth, memory body, artifact body, quality/export verdict, owner receipt, human gate, and default promotion authority.',
    '',
  ].join('\n');
}

export function writeTargetAgentPrimarySkill(targetAgentDir: string, targetAgent: MinimalTargetAgent): string {
  const primarySkillPath = path.join(targetAgentDir, targetPrimarySkillRef);
  fs.mkdirSync(path.dirname(primarySkillPath), { recursive: true });
  fs.writeFileSync(primarySkillPath, buildTargetAgentPrimarySkillMarkdown(targetAgent), 'utf8');
  return primarySkillPath;
}

function buildTargetAgentPrimarySkillCapability(targetAgent: MinimalTargetAgent): JsonObject {
  const domainId = targetAgent.domain_id;
  return {
    capability_id: `${domainId}.primary-skill.codex_entry`,
    surface_role: 'primary_skill',
    capability_kind: 'primary_skill',
    canonical_owner: domainId,
    physical_source_ref: { ref_kind: 'repo_path', ref: targetPrimarySkillRef, role: 'primary_skill_source' },
    reference_design_boundary: buildReferenceDesignBoundary(targetAgent),
    canonical_paths: [targetPrimarySkillRef],
    improvement_tokens: ['primary skill', 'agent entry', 'owner handoff', 'delivery gate'],
    failure_token_registry_ref: `failure-token-registry:${domainId}/primary-skill`,
    verification_refs: [
      'git diff --check',
      'opl agents scaffold --validate <target-agent-dir> --json',
      'opl connect agent-packages validate-manifest --manifest-url <sidecar> --json',
    ],
    forbidden_surfaces: [
      'target domain truth',
      'target memory body',
      'target artifact body',
      'target owner receipt body',
      'target typed blocker body',
      'quality/export verdict',
      'promotion gate state',
    ],
    runtime_projection_refs: [{
      ref_kind: 'contract_ref',
      ref: 'contracts/opl_agent_package_manifest.json#/codex_surface/primary_skill_ref',
      role: 'package_primary_skill_ref',
    }],
    sync_policy: 'oma_generated_candidate_refs_only',
    externalization_reason: 'standard generated target agent primary Codex entry; OPL owns generated carrier projection and package validation',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_mutate_artifact_body: false,
      can_sign_owner_receipt: false,
      can_create_typed_blocker: false,
      can_authorize_quality_or_export: false,
      can_claim_domain_ready: false,
      can_claim_production_ready: false,
    },
    exposure_layer: 'codex_default_primary_skill',
    codex_default_exposure: true,
    allowed_exposure_scopes: ['codex_default_entry', 'opl_generated_plugin_carrier'],
    codex_visibility_policy: 'registered_as_primary_codex_skill_entry',
    exposure_owner: domainId,
    canonical_target_paths: [targetPrimarySkillRef],
  };
}

export function writeTargetAgentCapabilityMap(targetAgentDir: string, targetAgent: MinimalTargetAgent): string {
  const capabilityMapPath = path.join(targetAgentDir, 'contracts', 'capability_map.json');
  const capabilityMap = JSON.parse(fs.readFileSync(capabilityMapPath, 'utf8')) as JsonObject;
  const resolverIndex = typeof capabilityMap.resolver_index === 'object'
    && capabilityMap.resolver_index !== null
    && !Array.isArray(capabilityMap.resolver_index)
    ? capabilityMap.resolver_index as JsonObject
    : {};
  writeJson(capabilityMapPath, {
    ...capabilityMap,
    primary_skill_capability: buildTargetAgentPrimarySkillCapability(targetAgent),
    resolver_index: {
      ...resolverIndex,
      primary_skill_refs: ['contracts/capability_map.json#/primary_skill_capability'],
    },
  });
  return capabilityMapPath;
}

function buildTargetAgentPackageManifest(targetAgent: MinimalTargetAgent): JsonObject {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  return {
    surface_kind: 'opl_agent_package_manifest.v1',
    agent_id: domainId,
    package_id: domainId,
    display_name: domainLabel,
    publisher: 'one-person-lab',
    version: '0.1.0',
    source: 'oma_generated_target_agent',
    carrier_source_role: 'codex_plugin_default_carrier_not_package_truth',
    schema_ref: 'contracts/opl-framework/agent-package-manifest.schema.json',
    machine_boundary: 'OMA generates this package sidecar for OPL App/package management. Codex consumes the projected .codex-plugin carrier; this sidecar does not write target truth, owner receipts, runtime queues, or quality/export verdicts.',
    package_core: {
      core_kind: 'opl_agent_package_core',
      identity_fields: ['package_id', 'agent_id', 'version'],
      content_identity_fields: [
        'manifest_sha256',
        'payload_digest_ref',
        'required_skill_pack_lock_refs',
        'package_lock_ref',
      ],
      dependency_source: 'manifest_declared_capability_dependencies',
      lock_owner: 'opl_connect_agent_package_registry',
      lifecycle_receipt_owner: 'opl_connect_agent_package_registry',
      exposure_owner: 'opl_connect_agent_package_registry',
    },
    distribution_payload: {
      payload_kind: 'oma_generated_agent_package',
      payload_ref: `opl://agent-packages/${domainId}/candidate`,
      payload_digest_ref: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      required_skill_pack_lock_refs: [],
      proof_status: 'candidate_sidecar_pending_publish',
      live_download_proof: false,
      installed_reload_proof: false,
      oci_ref: `ghcr.io/gaofeng21cn/opl-agent-${domainId}:latest`,
      oci_media_type: 'application/vnd.oci.image.manifest.v1+json',
      immutable_tag: '0.1.0',
      rolling_tag: 'latest',
      promotion_policy: 'daily_candidate_gates_then_promote_latest',
      install_truth: 'resolved_digest_lock',
    },
    codex_surface: {
      plugin_id: domainId,
      standalone_distribution: 'generated_carrier_surface',
      required_skill_ids: [domainId],
      primary_skill_ref: targetPrimarySkillRef,
      primary_skill_capability_ref: 'contracts/capability_map.json#/primary_skill_capability',
      bundled_capability_package_ids: [],
      user_install_action_count: 1,
    },
    carrier_adapters: [{
      adapter_kind: 'codex_plugin_carrier',
      carrier: 'codex_plugin',
      source_surface: 'codex_surface',
      projection_role: 'package_carrier_adapter',
      owns_package_core: false,
      owns_domain_truth: false,
    }],
    opl_managed_surface: {
      package_shape: 'thin_agent_package',
      dependency_resolution: 'managed_dependency_graph',
      dependency_update_policy: 'independent_package_target',
      developer_mode_dependency_policy: 'source_checkout_when_authorized_else_pull_request',
    },
    capability_dependencies: [],
  };
}

export function writeTargetAgentPackageManifest(targetAgentDir: string, targetAgent: MinimalTargetAgent): string {
  const packageManifestPath = path.join(targetAgentDir, 'contracts', 'opl_agent_package_manifest.json');
  writeJson(packageManifestPath, buildTargetAgentPackageManifest(targetAgent));
  return packageManifestPath;
}

import fs from 'node:fs';
import path from 'node:path';

const DOMAIN_PACK_SECTIONS = [
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

function policyRef({ domainId, refKind, relPath }) {
  return `${refKind}:${domainId}/${relPath}`;
}

export function readDomainPackSummary(repoDir, { domainId } = {}) {
  const resolvedRepoDir = path.resolve(repoDir);
  const resolvedDomainId = domainId ?? path.basename(resolvedRepoDir);
  const summary = {
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

export function domainPackReceiptFields(summary) {
  return {
    domain_pack_status: summary.status,
    prompt_policy_refs: summary.prompt_policy_refs,
    skill_policy_refs: summary.skill_policy_refs,
    quality_gate_refs: summary.quality_gate_refs,
    knowledge_policy_refs: summary.knowledge_policy_refs,
  };
}

export function writeMinimalAgentDomainPack(targetAgentDir, targetAgent) {
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

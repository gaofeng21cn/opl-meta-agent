import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertTargetProfileConformance,
} from '../scripts/lib/stage-decomposition-pack-draft/materializer.ts';
import {
  buildProfileSelectionReceipt,
  type JsonObject,
} from '../scripts/lib/domain-pack.ts';
import {
  oplOwnerRepoRoot,
  readJsonFile as readJson,
  withTempDir,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

const canonicalOplBin = path.join(oplOwnerRepoRoot, 'bin', 'opl');
const profileRef = 'opl-profile:evidence_grounded_decision_agent_profile.v1';
const targetAgent = {
  domain_id: 'reference-build-conformance-agent',
  target_brief: 'Create colorectal evidence-grounded decision support with an owner gate.',
  selected_opl_profile_refs: [profileRef],
  profile_selection_rationale: 'The target requires the evidence-grounded decision profile.',
};

function writeConformantProfileFixture(targetDir: string): void {
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const profileRequirements = profileSelectionReceipt.profile_requirements;
  const domainId = targetAgent.domain_id;
  const schemaRefs = [
    'contracts/schemas/evaluate-evidence.input.schema.json',
    'contracts/schemas/evaluate-evidence.output.schema.json',
  ];
  const stageRefs = [
    'agent/stages/evidence-review.md',
    'agent/prompts/evidence-review.md',
    'agent/knowledge/evidence.md',
    'agent/quality_gates/evidence.md',
    'agent/tools/evidence.md',
  ];
  for (const ref of stageRefs) {
    const file = path.join(targetDir, ref);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `materialized:${ref}\n`);
  }
  for (const ref of schemaRefs) {
    writeJson(path.join(targetDir, ref), {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      additionalProperties: true,
    });
  }
  fs.mkdirSync(path.join(targetDir, 'runtime', 'authority_functions'), { recursive: true });
  fs.writeFileSync(
    path.join(targetDir, 'runtime', 'authority_functions', 'README.md'),
    '# Authority functions\n',
  );
  writeJson(path.join(targetDir, 'contracts', 'capability_map.json'), {
    selected_profile_refs: [profileRef],
    profile_requirements: profileRequirements,
    profile_selection_receipt: profileSelectionReceipt,
    capabilities: [
      { capability_kind: 'stage_prompt', surface_role: 'stage_prompt' },
      { capability_kind: 'tool_connector', surface_role: 'tool_connector' },
      { capability_kind: 'reference_pack', surface_role: 'knowledge_pack' },
      { capability_kind: 'contract_module', surface_role: 'quality_gate' },
      { capability_kind: 'contract_module', surface_role: 'eval_suite' },
    ],
  });
  writeJson(path.join(targetDir, 'contracts', 'owner_receipt_contract.json'), {
    surface_kind: 'owner_receipt_contract',
  });
  writeJson(path.join(targetDir, 'contracts', 'domain_descriptor.json'), {
    surface_kind: 'domain_agent_descriptor',
    domain_id: domainId,
    domain_label: 'Reference Build Conformance Agent',
    authority_boundary: {
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
    },
  });
  writeJson(path.join(targetDir, 'contracts', 'action_catalog.json'), {
    surface_kind: 'family_action_catalog',
    version: 'family-action-catalog.v2',
    catalog_id: `${domainId}.profile-actions`,
    target_domain_id: domainId,
    owner: domainId,
    authority_boundary: { opl_role: 'projection_consumer_only' },
    actions: [{
      action_id: 'evaluate-evidence',
      title: 'Evaluate evidence',
      summary: 'Evaluate evidence under the target owner gate.',
      owner: domainId,
      effect: 'mutating',
      execution_binding: {
        kind: 'stage_binding',
        stage_manifest_ref: 'agent/stages/manifest.json',
      },
      input_schema_ref: schemaRefs[0],
      output_schema_ref: schemaRefs[1],
      required_fields: [],
      optional_fields: [],
      workspace_locator_fields: ['workspace_root'],
      human_gate_ids: [],
      stage_route: {
        entry_stage_ref: 'evidence-review',
        required_stage_refs: ['evidence-review'],
        optional_stage_refs: [],
        terminal_stage_refs: ['evidence-review'],
        route_policy: 'ai_selected_progress_route',
      },
      supported_surfaces: {
        cli: {},
        mcp: { tool_name: 'evaluate_evidence', descriptor_only: true, public_runtime: false },
        skill: { command_contract_id: 'evaluate-evidence' },
        product_entry: { action_key: 'evaluate-evidence' },
        openai: { tool_name: 'evaluate_evidence' },
        ai_sdk: { tool_name: 'evaluate_evidence' },
      },
      authority_boundary: {
        can_write_target_domain_truth: false,
        can_authorize_target_domain_quality_or_export: false,
      },
    }],
    notes: [],
  });
  writeJson(path.join(targetDir, 'contracts', 'pack_compiler_input.json'), {
    surface_kind: 'opl_domain_pack_compiler_input',
    domain_id: domainId,
    canonical_agent_id: domainId,
    required_domain_pack_paths: ['agent/stages/manifest.json', ...stageRefs, ...schemaRefs],
  });
  writeJson(path.join(targetDir, 'agent', 'stages', 'manifest.json'), {
    surface_kind: 'opl_standard_agent_declarative_stage_manifest',
    version: 'opl-standard-agent-declarative-stage-manifest.v1',
    target_domain_id: domainId,
    owner: domainId,
    authority_boundary: {
      domain_truth_owner: domainId,
      opl_can_write_domain_truth: false,
      opl_can_authorize_quality_or_export: false,
    },
    stages: [{
      stage_id: 'evidence-review',
      stage_kind: 'creation',
      title: 'Evidence Review',
      summary: 'Review target evidence with an explicit owner gate.',
      goal: 'Produce an evidence-grounded owner-gated review packet.',
      policy_ref: 'agent/stages/evidence-review.md',
      prompt_ref: 'agent/prompts/evidence-review.md',
      knowledge_refs: ['agent/knowledge/evidence.md'],
      quality_gate_refs: ['agent/quality_gates/evidence.md'],
      allowed_action_refs: ['evaluate-evidence'],
      requires: ['structured-evidence-ref'],
      ensures: ['owner-receipt-or-typed-blocker-ref'],
      next_stage_refs: [],
      trust_lane: 'domain_agent',
    }],
  });
  writeJson(path.join(targetDir, 'contracts', 'stage_control_plane.json'), {
    selected_profile_refs: [profileRef],
    profile_requirements: profileRequirements,
    stages: [{
      stage_id: 'evidence-review',
      stage_kind: 'creation',
      title: 'Evidence Review',
      summary: 'Review target evidence with an explicit owner gate.',
      goal: 'Produce an evidence-grounded owner-gated review packet.',
      policy_ref: 'agent/stages/evidence-review.md',
      prompt_ref: 'agent/prompts/evidence-review.md',
      knowledge_refs: ['agent/knowledge/evidence.md'],
      quality_gate_refs: ['agent/quality_gates/evidence.md'],
      allowed_action_refs: ['evaluate-evidence'],
      requires: ['structured-evidence-ref'],
      ensures: ['owner-receipt-or-typed-blocker-ref'],
      next_stage_refs: [],
      trust_lane: 'domain_agent',
    }],
  });
}

test('post-write profile conformance uses the canonical OPL CLI and records file drift as quality debt', () => {
  assert.equal(fs.existsSync(canonicalOplBin), true, canonicalOplBin);
  withTempDir('oma-reference-build-conformance-', (targetDir) => {
    writeConformantProfileFixture(targetDir);
    const passed = assertTargetProfileConformance(canonicalOplBin, targetDir, targetAgent);
    assert.ok(['passed', 'completed_with_quality_debt'].includes(String(passed.status)));
    if (passed.status === 'completed_with_quality_debt') {
      assert.equal(passed.next_stage_may_start, true);
    }

    const capabilityMapPath = path.join(targetDir, 'contracts', 'capability_map.json');
    const capabilityMap = readJson(capabilityMapPath) as JsonObject;
    capabilityMap.selected_profile_refs = [];
    delete capabilityMap.profile_selection_receipt;
    writeJson(capabilityMapPath, capabilityMap);

    const drifted = assertTargetProfileConformance(canonicalOplBin, targetDir, targetAgent);
    assert.equal(drifted.status, 'completed_with_quality_debt');
    assert.equal(drifted.next_stage_may_start, true);
    assert.equal(drifted.quality_debt.blocks_stage_transition, false);
  });
});

test('research-driven design stays not applicable when OPL exposes no matching conformance route', () => {
  const result = assertTargetProfileConformance(canonicalOplBin, '/tmp/not-materialized', {
    domain_id: 'research-driven-agent',
    research_source_refs: ['research-source-ref:public/expert-workflow-review'],
    research_synthesis_refs: ['research-synthesis-ref:oma/research-driven-agent'],
  });
  assert.equal(result.status, 'not_applicable');
  assert.equal(result.reason, 'research_driven_design_route_not_exposed_by_opl_profiles_conformance');
  assert.equal(result.authority_boundary.conformance_skipped_as_success, false);
});

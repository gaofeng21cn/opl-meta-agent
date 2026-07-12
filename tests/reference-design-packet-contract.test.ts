import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildAgentBuildReceipt,
  buildAgentPackPlan,
  buildDesignAdmissionReceipt,
  buildReferenceDesignPacket,
  buildStageDecompositionSubpacketSet,
  buildTransferMap,
} from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('OMA ReferenceDesignPacket materialization matches its owned handoff contract', () => {
  const contract = JSON.parse(fs.readFileSync(
    path.join(repoRoot, 'contracts', 'reference_design_packet.json'),
    'utf8',
  ));
  const targetAgent = {
    domain_id: 'colorectal-surgery-risk',
    reference_design_source_refs: ['source-material:sha256:surgical-risk-fixture'],
    reference_design_pattern_packet_refs: [
      path.join(repoRoot, 'tests/fixtures/opl-reference-design-pattern-packet.json'),
    ],
  };
  const packet = buildReferenceDesignPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent);
  const agentPackPlan = buildAgentPackPlan(targetAgent);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent);
  const agentBuildReceipt = buildAgentBuildReceipt(targetAgent);
  const designObjectSet = buildStageDecompositionSubpacketSet(targetAgent);

  assert.ok(packet);
  assert.equal(packet.surface_kind, contract.object_surface_kind);
  assert.equal(packet.version, contract.object_version);
  for (const field of contract.required_fields) {
    assert.equal(Object.hasOwn(packet, field), true, `ReferenceDesignPacket requires ${field}`);
  }
  for (const field of contract.required_non_empty_fields) {
    assert.ok(Array.isArray(packet[field]) && packet[field].length > 0, `${field} must be non-empty`);
  }
  assert.equal(
    contract.required_any_non_empty_fields.some((field: string) =>
      Array.isArray(packet[field]) && packet[field].length > 0
    ),
    true,
  );
  assert.equal(packet.source_body_policy.refs_only, true);
  assert.equal(packet.source_body_policy.source_bodies_copied, false);
  assert.equal(packet.design_origin.origin_kind, 'user_supplied_reference_design');
  assert.equal(packet.transferable_design_patterns[0].transferable_workflow_steps.length, 4);
  assert.ok(packet.source_anchor_refs.every((ref: string) => ref.startsWith('fixture-source:')));
  assert.equal(contract.input_handoff_schema_id, 'opl.reference_design_pattern_packet.v1');
  assert.equal(
    contract.input_handoff_schema_ref,
    'https://one-person-lab.local/contracts/opl-framework/reference-design-pattern-packet.schema.json',
  );
  assert.equal(
    contract.seed_provenance_policy_ref,
    'contracts/expert_workflow_pattern_library.json#/provenance_policy',
  );
  assert.deepEqual(contract.seed_pattern_materialization_required_fields, [
    'authority_tier',
    'resolved_source_anchors',
  ]);
  assert.equal(Object.hasOwn(contract, 'typed_pattern_input'), false);
  assert.ok(transferMap);
  transferMap.mappings.forEach((mapping: Record<string, unknown>) => {
    for (const field of contract.transfer_map_canonical_fields) {
      assert.equal(Object.hasOwn(mapping, field), true, `TransferMap mapping requires ${field}`);
    }
    assert.ok(contract.transfer_map_allowed_dispositions.includes(mapping.disposition));
  });
  assert.ok(agentPackPlan);
  const workflowStages = agentPackPlan.planned_stage_refs.filter(
    (stage: Record<string, unknown>) => stage.origin === 'source_pattern_ref',
  );
  assert.equal(workflowStages.length, 4);
  assert.equal(new Set(workflowStages.map((stage: Record<string, unknown>) => stage.stage_id)).size, 4);
  assert.equal(workflowStages.some((stage: Record<string, unknown>) => stage.stage_id === 'agent-output-draft'), false);
  assert.ok(workflowStages.every((stage: Record<string, unknown>) =>
    !Object.hasOwn(stage, 'synthesis_rationale')
    && !Object.hasOwn(stage, 'source_authority_tier')
    && !Object.hasOwn(stage, 'resolved_source_anchors')
  ));
  assert.ok(designAdmissionReceipt);
  assert.ok(agentBuildReceipt);
  assert.ok(designObjectSet);
  const setPolicy = contract.stage_decomposition_design_object_set_policy;
  assert.equal(designObjectSet.version, setPolicy.version);
  assert.deepEqual(
    new Set(designObjectSet.design_object_packets.map((packet: Record<string, unknown>) => packet.object_id)),
    new Set(setPolicy.required_object_ids),
  );
  assert.deepEqual(
    new Set(designObjectSet.dependency_edges.map((edge: Record<string, unknown>) => edge.edge_id)),
    new Set(setPolicy.required_dependency_edge_ids),
  );
  assert.equal(setPolicy.collection_is_unordered, true);
  assert.equal(setPolicy.transfer_pack_and_morphology_have_no_fixed_cognitive_order, true);
  [designAdmissionReceipt.design_derived_stage_refs, agentBuildReceipt.design_derived_stage_refs]
    .forEach((stageRefs: Array<Record<string, unknown>>) => {
      assert.ok(stageRefs.every((stage) =>
        !Object.hasOwn(stage, 'source_authority_tier')
        && !Object.hasOwn(stage, 'resolved_source_anchors')
      ));
    });
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_claim_target_ready, false);
});

test('OMA materializes seed provenance from the root anchor catalog', () => {
  const targetAgent = {
    domain_id: 'seed-provenance-fixture',
    reference_design_pattern_packet_refs: [
      'expert-workflow-pattern:oma/case-grounded-expert-decision-workflow.v1',
    ],
  };
  const packet = buildReferenceDesignPacket(targetAgent);
  const agentPackPlan = buildAgentPackPlan(targetAgent);

  assert.ok(packet);
  assert.equal(packet.design_origin.origin_kind, 'oma_seed_library_fallback');
  const pattern = packet.transferable_design_patterns[0];
  assert.equal(pattern.authority_tier, 'A');
  const resolvedAnchors = pattern.resolved_source_anchors as Array<Record<string, unknown>>;
  assert.equal(resolvedAnchors.length, pattern.source_anchor_refs.length);
  assert.deepEqual(
    resolvedAnchors.map((anchor) => anchor.anchor_ref),
    pattern.source_anchor_refs,
  );
  assert.ok(resolvedAnchors.every((anchor) =>
    typeof anchor.stable_locator === 'string'
    && typeof anchor.section_title === 'string'
    && typeof anchor.selector === 'string'
    && typeof anchor.support_role === 'string'
    && typeof anchor.verification_status === 'string'
    && typeof anchor.source_version_or_fingerprint === 'string'
  ));
  const steps = pattern.transferable_workflow_steps as Array<Record<string, unknown>>;
  assert.ok(steps.length > 0);
  assert.ok(steps.every((step) =>
    (step.source_anchor_refs as string[]).every((anchorRef) => anchorRef.startsWith('seed-anchor:oma/'))
  ));
  const synthesisSteps = steps.filter((step) => step.provenance_kind === 'internal_synthesis');
  assert.ok(synthesisSteps.length > 0);
  assert.ok(synthesisSteps.every((step) =>
    typeof step.synthesis_rationale === 'string' && step.synthesis_rationale.trim().length > 0
  ));
  assert.ok(agentPackPlan);
  const synthesisStages = agentPackPlan.planned_stage_refs.filter(
    (stage: Record<string, unknown>) => stage.provenance_kind === 'internal_synthesis',
  );
  assert.equal(synthesisStages.length, synthesisSteps.length);
  assert.ok(synthesisStages.every((stage: Record<string, unknown>) =>
    typeof stage.synthesis_rationale === 'string' && stage.synthesis_rationale.trim().length > 0
  ));
  const sourceStages = agentPackPlan.planned_stage_refs.filter(
    (stage: Record<string, unknown>) => stage.origin === 'source_pattern_ref',
  );
  assert.ok(sourceStages.every((stage: Record<string, unknown>) => stage.source_authority_tier === 'A'));
  assert.ok(sourceStages.every((stage: Record<string, unknown>) =>
    Array.isArray(stage.resolved_source_anchors)
    && stage.resolved_source_anchors.length === (stage.source_anchor_refs as string[]).length
  ));
});

test('OMA rejects OPL semantic JSON pointers outside the packet directory', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-reference-design-pointer-'));
  try {
    const sourcePacketPath = path.join(
      repoRoot,
      'tests/fixtures/opl-reference-design-pattern-packet.json',
    );
    const packet = JSON.parse(fs.readFileSync(sourcePacketPath, 'utf8'));
    packet.pattern_summary_ref = '/etc/passwd#/summary';
    const packetPath = path.join(tempDir, 'packet.json');
    fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`);

    assert.throws(
      () => buildReferenceDesignPacket({
        domain_id: 'unsafe-reference-pointer',
        reference_design_source_refs: ['source-material:sha256:surgical-risk-fixture'],
        reference_design_pattern_packet_refs: [packetPath],
      }),
      /pattern_summary_ref_relative_path_required/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('OMA delegates the OPL handoff envelope ABI to the canonical validator', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-reference-design-schema-'));
  try {
    const packet = JSON.parse(fs.readFileSync(
      path.join(repoRoot, 'tests/fixtures/opl-reference-design-pattern-packet.json'),
      'utf8',
    ));
    packet.authority_boundary.opl_can_claim_target_ready = true;
    const packetPath = path.join(tempDir, 'packet.json');
    fs.writeFileSync(packetPath, `${JSON.stringify(packet, null, 2)}\n`);

    assert.throws(
      () => buildReferenceDesignPacket({
        domain_id: 'authority-overclaiming-reference-packet',
        reference_design_source_refs: ['source-material:sha256:surgical-risk-fixture'],
        reference_design_pattern_packet_refs: [packetPath],
      }),
      /opl_pattern_packet_schema_invalid:.*can_claim_target_ready.*:const/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

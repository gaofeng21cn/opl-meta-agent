import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildAgentPackPlan,
  buildReferenceDesignPacket,
  buildTransferMap,
} from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_claim_target_ready, false);
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

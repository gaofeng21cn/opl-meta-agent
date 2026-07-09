import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import { readJsonFile as readJson } from './support/contracts.ts';
import {
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft/builder.ts';
import {
  materializeStageDecompositionPackDraft,
} from '../scripts/lib/stage-decomposition-pack-draft/materializer.ts';
import {
  validateStageDecompositionCloseoutPacket,
} from '../scripts/lib/stage-decomposition-pack-draft/validator.ts';

const targetAgent = {
  domain_id: 'research-workbench-agent',
  domain_label: 'Research Workbench Agent',
  delivery_domain: 'research_workbench',
  target_brief: 'Create an owner-gated research workbench agent from declared workspace refs.',
  selected_opl_profile_refs: [
    'opl-profile:evidence_grounded_decision_agent_profile.v1',
  ],
  profile_selection_rationale:
    'The target agent needs refs-only grounding, mode routing, and owner-gated decision support.',
};

const sourceDerivedTargetAgent = {
  domain_id: 'surgery-risk-from-paper-agent',
  domain_label: 'Surgery Risk From Paper Agent',
  delivery_domain: 'surgical_risk_support',
  target_brief: 'Create an owner-gated surgical risk support agent from a supplied reference paper design.',
  reference_design_source_refs: ['paper-ref:uploaded-surgical-risk-agent-framework'],
  reference_design_pattern_notes: [
    'extract source case representation, route selection, grounding, rubric, validation, and handoff patterns',
  ],
  reference_design_pattern_packet_refs: [
    'pattern-packet-ref:oma/reference-designs/uploaded-surgical-risk-agent-framework/distilled-agent-design',
  ],
};

test('stage-decomposition materializer writes refs-only stage pack surfaces', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-stage-materializer-pass4-'));
  try {
    const targetAgentDir = path.join(outputRoot, targetAgent.domain_id);
    const packet = buildFixtureStageDecompositionCloseout({
      targetAgent,
      stageId: 'evidence-synthesis-plan',
      actionId: 'plan-evidence-synthesis',
      title: 'Evidence Synthesis Plan',
      promptPath: 'agent/prompts/evidence-synthesis-plan.md',
      stagePath: 'agent/stages/evidence-synthesis-plan.md',
      skillPath: 'agent/skills/evidence-synthesis-domain-skill.md',
      knowledgePath: 'agent/knowledge/evidence-synthesis-boundary.md',
      qualityGatePath: 'agent/quality_gates/evidence-synthesis-plan-gate.md',
    });

    const draft = validateStageDecompositionCloseoutPacket(packet, { targetAgent });
    materializeStageDecompositionPackDraft(targetAgentDir, draft);

    const stageControl = readJson(path.join(targetAgentDir, 'contracts/stage_control_plane.json'));
    const artifactMorphology = readJson(path.join(targetAgentDir, 'contracts/artifact_morphology_contract.json'));
    const stage = (stageControl.stages as JsonObject[])[0];
    assert.equal(stage.stage_id, 'evidence-synthesis-plan');
    assert.equal(stage.selected_executor.executor_kind, 'codex_cli');
    assert.equal(stage.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(stage.stage_contract.stage_completion_policy.provider_completion_is_domain_completion, false);
    assert.equal(artifactMorphology.native_source_policy.creative_source_must_not_be_generator_code, true);
    assert.equal(
      fs.existsSync(path.join(targetAgentDir, 'contracts/stage_native_artifacts/evidence-synthesis-plan/attempt.json')),
      true,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('stage-decomposition validator fails closed on untyped or unsafe closeout', () => {
  assert.throws(
    () => validateStageDecompositionCloseoutPacket('stage graph: draft then review', { targetAgent }),
    /typed JSON object/i,
  );

  const packet = buildFixtureStageDecompositionCloseout({ targetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stage = ((draft.stage_control_plane as JsonObject).stages as JsonObject[])[0];
  delete stage.independent_gate_policy;
  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent }),
    /independent_gate_policy/i,
  );
});

test('stage-decomposition validator fails closed on empty source-derived design objects', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];

  const emptyPacket = {
    surface_kind: 'opl_meta_agent_reference_design_packet',
    packet_ref: stageControl.reference_design_packet_ref,
  };
  const emptyTransferMap = {
    surface_kind: 'opl_meta_agent_transfer_map',
    transfer_map_ref: stageControl.transfer_map_ref,
  };
	  const emptyAgentPackPlan = {
	    surface_kind: 'opl_meta_agent_agent_pack_plan',
	    plan_ref: stageControl.agent_pack_plan_ref,
	  };
	  const emptyDesignAdmissionReceipt = {
	    surface_kind: 'opl_meta_agent_design_admission_receipt',
	    receipt_ref: stageControl.design_admission_receipt_ref,
	  };
	  const emptyBuildReceipt = {
	    surface_kind: 'opl_meta_agent_build_receipt',
	    receipt_ref: stageControl.build_receipt_ref,
	  };
	  stageControl.reference_design_packet = emptyPacket;
	  stageControl.transfer_map = emptyTransferMap;
	  stageControl.agent_pack_plan = emptyAgentPackPlan;
	  stageControl.design_admission_receipt = emptyDesignAdmissionReceipt;
	  stageControl.build_receipt = emptyBuildReceipt;
	  stage.reference_design_packet = emptyPacket;
	  stage.transfer_map = emptyTransferMap;
	  stage.agent_pack_plan = emptyAgentPackPlan;
	  stage.design_admission_receipt = emptyDesignAdmissionReceipt;
	  stage.build_receipt = emptyBuildReceipt;

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
	    /reference_source_refs|transferable_design_patterns|extractable_design_aspects|mappings|planned_stage_refs|design_admission_receipt|build_receipt/i,
	  );
	});

test('stage-decomposition validator fails closed when source-derived stage lacks source pattern refs', () => {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  delete stage.stage_pattern_source_refs;

  assert.throws(
    () => validateStageDecompositionCloseoutPacket(packet, { targetAgent: sourceDerivedTargetAgent }),
    /stage_pattern_source_refs/i,
  );
});

import {
  buildAgentPackPlan,
  buildReferenceDesignPacket,
  buildResearchSynthesisPacket,
  buildStageDecompositionSubpacketSet,
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import {
  asRecord,
  asRecordArray,
  asStringArray,
  assertBooleanFalse,
} from './shared.ts';

function normalizedStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return asStringArray(value, field);
}
function assertMatchingStringArray(actual: unknown, expected: unknown, field: string): void {
  const actualList = normalizedStringArray(actual, `stage_decomposition_pack_draft.${field}`);
  const expectedList = normalizedStringArray(expected, `requested_target_agent.${field}`);
  if (JSON.stringify(actualList) !== JSON.stringify(expectedList)) {
    throw new Error(`stage-decomposition pack draft ${field} does not match requested target.`);
  }
}

function optionalStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return asStringArray(value, field);
}

function expectedReferencePatternRefs(targetAgent: TargetAgent): string[] {
  return buildReferenceDesignPacket(targetAgent)?.transferable_design_patterns
    ?.map((pattern: JsonObject) => String(pattern.source_pattern_ref)) ?? [];
}

function expectedResearchPatternRefs(targetAgent: TargetAgent): string[] {
  return buildResearchSynthesisPacket(targetAgent)?.transferable_design_patterns
    ?.map((pattern: JsonObject) => String(pattern.source_pattern_ref)) ?? [];
}

export function expectedSourcePatternRefs(targetAgent: TargetAgent): string[] {
  const referencePatternRefs = expectedReferencePatternRefs(targetAgent);
  return referencePatternRefs.length > 0 ? referencePatternRefs : expectedResearchPatternRefs(targetAgent);
}

function assertHasStringRef(list: unknown, expected: string, field: string): void {
  if (!asStringArray(list, field).includes(expected)) {
    throw new Error(`stage-decomposition pack draft ${field} missing ${expected}.`);
  }
}

export function validateReferenceDesignPacketObject(
  actualPacket: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  agentPackPlanRef: string,
  field: string,
): void {
  if (actualPacket.surface_kind !== 'opl_meta_agent_reference_design_packet' || actualPacket.packet_ref !== packetRef) {
    throw new Error(`stage-decomposition pack draft ${field}.reference_design_packet identity is invalid.`);
  }
  assertMatchingStringArray(
    actualPacket.reference_source_refs,
    targetAgent.reference_design_source_refs,
    `${field}.reference_design_packet.reference_source_refs`,
  );
  assertMatchingStringArray(
    actualPacket.reference_design_pattern_packet_refs,
    targetAgent.reference_design_pattern_packet_refs,
    `${field}.reference_design_packet.reference_design_pattern_packet_refs`,
  );
  assertMatchingStringArray(
    actualPacket.reference_design_pattern_notes,
    targetAgent.reference_design_pattern_notes,
    `${field}.reference_design_packet.reference_design_pattern_notes`,
  );
  const expectedPatternRefs = expectedReferencePatternRefs(targetAgent);
  if (expectedPatternRefs.length === 0) {
    throw new Error(`stage-decomposition pack draft ${field}.reference_design_packet requires extracted pattern refs.`);
  }
  const patterns = asRecordArray(
    actualPacket.transferable_design_patterns,
    `${field}.reference_design_packet.transferable_design_patterns`,
  );
  const expectedPacket = buildReferenceDesignPacket(targetAgent);
  if (!expectedPacket) {
    throw new Error(`stage-decomposition pack draft ${field}.reference_design_packet expected packet is missing.`);
  }
  [
    'design_origin',
    'pattern_dispositions',
    'source_anchor_refs',
    'transferable_design_patterns',
    'extractable_design_aspects',
    'applicable_constraints',
    'non_transferable_constraints',
  ].forEach((packetField) => {
    if (JSON.stringify(actualPacket[packetField]) !== JSON.stringify(expectedPacket[packetField])) {
      throw new Error(`stage-decomposition pack draft ${field}.reference_design_packet.${packetField} is not canonical.`);
    }
  });
  const aspects = asRecordArray(
    actualPacket.extractable_design_aspects,
    `${field}.reference_design_packet.extractable_design_aspects`,
  );
  patterns.forEach((pattern) => {
    const steps = asRecordArray(
      pattern.transferable_workflow_steps,
      `${field}.reference_design_packet.${pattern.pattern_id}.transferable_workflow_steps`,
    );
    steps.forEach((step) => {
      const anchors = asStringArray(
        step.source_anchor_refs,
        `${field}.reference_design_packet.${pattern.pattern_id}.${step.step_id}.source_anchor_refs`,
      );
      if (anchors.length === 0 || !['source_derived', 'internal_synthesis'].includes(String(step.provenance_kind))) {
        throw new Error(`stage-decomposition pack draft ${field}.reference_design_packet step provenance is invalid.`);
      }
      if (!aspects.some((aspect) =>
        aspect.source_pattern_ref === pattern.source_pattern_ref
        && aspect.step_id === step.step_id
        && JSON.stringify(aspect.source_anchor_refs) === JSON.stringify(anchors)
        && aspect.required_output_ref === transferMapRef
        && aspect.extracted_design_claim ===
          (step.target_adaptation ?? step.expert_question ?? step.transferable_pattern)
      )) {
        throw new Error(
          `stage-decomposition pack draft ${field}.reference_design_packet missing workflow-step aspect ${pattern.pattern_id}/${step.step_id}.`,
        );
      }
    });
  });
  const policy = asRecord(
    actualPacket.source_body_policy,
    `${field}.reference_design_packet.source_body_policy`,
  );
  if (policy.refs_only !== true || policy.extracted_pattern_refs_required !== true) {
    throw new Error(`stage-decomposition pack draft ${field}.reference_design_packet source body policy is invalid.`);
  }
}

export function validateResearchSynthesisPacketObject(
  actualPacket: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  agentPackPlanRef: string,
  field: string,
): void {
  if (actualPacket.surface_kind !== 'opl_meta_agent_research_synthesis_packet' || actualPacket.packet_ref !== packetRef) {
    throw new Error(`stage-decomposition pack draft ${field}.research_synthesis_packet identity is invalid.`);
  }
  assertMatchingStringArray(
    actualPacket.research_source_refs,
    targetAgent.research_source_refs,
    `${field}.research_synthesis_packet.research_source_refs`,
  );
  assertMatchingStringArray(
    actualPacket.expert_practice_notes,
    targetAgent.expert_practice_notes,
    `${field}.research_synthesis_packet.expert_practice_notes`,
  );
  assertMatchingStringArray(
    actualPacket.research_synthesis_refs,
    targetAgent.research_synthesis_refs,
    `${field}.research_synthesis_packet.research_synthesis_refs`,
  );
  const expectedPatternRefs = expectedResearchPatternRefs(targetAgent);
  if (expectedPatternRefs.length === 0) {
    throw new Error(`stage-decomposition pack draft ${field}.research_synthesis_packet requires extracted pattern refs.`);
  }
  const patterns = asRecordArray(
    actualPacket.transferable_design_patterns,
    `${field}.research_synthesis_packet.transferable_design_patterns`,
  );
  expectedPatternRefs.forEach((expectedRef) => {
    if (!patterns.some((pattern) => pattern.source_pattern_ref === expectedRef)) {
      throw new Error(`stage-decomposition pack draft ${field}.research_synthesis_packet missing transferable pattern ${expectedRef}.`);
    }
  });
  const expectedPacket = buildResearchSynthesisPacket(targetAgent);
  if (!expectedPacket || JSON.stringify(actualPacket.extractable_design_aspects) !==
    JSON.stringify(expectedPacket.extractable_design_aspects)) {
    throw new Error(`stage-decomposition pack draft ${field}.research_synthesis_packet aspects are not canonical.`);
  }
  const policy = asRecord(
    actualPacket.source_body_policy,
    `${field}.research_synthesis_packet.source_body_policy`,
  );
  if (policy.refs_only !== true || policy.extracted_pattern_refs_required !== true) {
    throw new Error(`stage-decomposition pack draft ${field}.research_synthesis_packet source body policy is invalid.`);
  }
}

export function validateTransferMapObject(
  actualTransferMap: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  field: string,
): void {
  if (actualTransferMap.surface_kind !== 'opl_meta_agent_transfer_map' || actualTransferMap.transfer_map_ref !== transferMapRef) {
    throw new Error(`stage-decomposition pack draft ${field}.transfer_map identity is invalid.`);
  }
  if (
    actualTransferMap.reference_design_packet_ref !== packetRef
    && actualTransferMap.research_synthesis_packet_ref !== packetRef
    && actualTransferMap.design_basis_ref !== packetRef
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.transfer_map design basis ref is invalid.`);
  }
  const expectedPatternRefs = expectedSourcePatternRefs(targetAgent);
  const mappings = asRecordArray(actualTransferMap.mappings, `${field}.transfer_map.mappings`);
  const expectedPlan = buildAgentPackPlan(targetAgent);
  const allExpectedStages = asRecordArray(
    expectedPlan?.planned_stage_refs,
    `${field}.transfer_map.expected_agent_pack_plan.planned_stage_refs`,
  );
  const expectedStages = allExpectedStages.filter((stage) => stage.origin === 'source_pattern_ref');
  expectedStages.forEach((stage) => {
    const anchors = asStringArray(
      stage.source_anchor_refs,
      `${field}.transfer_map.expected_stage.${stage.stage_id}.source_anchor_refs`,
    );
    if (!mappings.some((mapping) =>
      mapping.pattern_id === stage.pattern_id
      && mapping.step_id === stage.step_id
      && anchors.includes(String(mapping.source_anchor_ref))
      && mapping.target_stage_or_capability_slot === stage.stage_ref
      && ['adapt', 'adopt'].includes(String(mapping.disposition))
      && typeof mapping.transfer_rationale === 'string'
      && mapping.transfer_rationale.trim().length > 0
      && Array.isArray(mapping.known_limits)
      && mapping.known_limits.length > 0
    )) {
      throw new Error(
        `stage-decomposition pack draft ${field}.transfer_map missing canonical mapping ${stage.pattern_id}/${stage.step_id}.`,
      );
    }
  });
  expectedPatternRefs.forEach((expectedRef) => {
    if (!expectedStages.some((stage) => stage.source_pattern_ref === expectedRef)) {
      throw new Error(`stage-decomposition pack draft ${field}.transfer_map missing workflow stages for ${expectedRef}.`);
    }
  });
  if (!mappings.some((mapping) =>
    mapping.disposition === 'reject'
    && String(mapping.source_anchor_ref).startsWith('non-transferable:')
  )) {
    throw new Error(`stage-decomposition pack draft ${field}.transfer_map missing non-transferable rejection mapping.`);
  }
  const nonRejectTargets = mappings
    .filter((mapping) => mapping.disposition !== 'reject')
    .map((mapping) => String(mapping.target_stage_or_capability_slot));
  const expectedTargets = allExpectedStages.map((stage) => String(stage.stage_ref));
  if (
    nonRejectTargets.length !== expectedTargets.length
    || expectedTargets.some((target) => nonRejectTargets.filter((entry) => entry === target).length !== 1)
    || nonRejectTargets.some((target) => !expectedTargets.includes(target))
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.transfer_map targets must map one-to-one to AgentPackPlan stages.`);
  }
}

export function validateAgentPackPlanObject(
  actualAgentPackPlan: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  agentPackPlanRef: string,
  field: string,
): void {
  if (actualAgentPackPlan.surface_kind !== 'opl_meta_agent_agent_pack_plan' || actualAgentPackPlan.plan_ref !== agentPackPlanRef) {
    throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan identity is invalid.`);
  }
  if (
    (
      actualAgentPackPlan.reference_design_packet_ref !== packetRef
      && actualAgentPackPlan.research_synthesis_packet_ref !== packetRef
      && actualAgentPackPlan.design_basis_ref !== packetRef
    )
    || actualAgentPackPlan.transfer_map_ref !== transferMapRef
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan source refs are invalid.`);
  }
  const expectedPatternRefs = expectedSourcePatternRefs(targetAgent);
  const plannedStageRefs = asRecordArray(
    actualAgentPackPlan.planned_stage_refs,
    `${field}.agent_pack_plan.planned_stage_refs`,
  );
  expectedPatternRefs.forEach((expectedRef) => {
    if (!plannedStageRefs.some((stageRef) =>
      stageRef.origin === 'source_pattern_ref'
      && stageRef.source_pattern_ref === expectedRef
      && typeof stageRef.stage_id === 'string'
      && String(stageRef.stage_id).trim().length > 0
    )) {
      throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan missing source-pattern planned stage ${expectedRef}.`);
    }
  });
  const sourceStages = plannedStageRefs.filter((stageRef) => stageRef.origin === 'source_pattern_ref');
  if (new Set(sourceStages.map((stageRef) => String(stageRef.stage_id))).size !== sourceStages.length) {
    throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan workflow stage ids must be unique.`);
  }
  sourceStages.forEach((stageRef) => {
    if (
      typeof stageRef.pattern_id !== 'string'
      || typeof stageRef.step_id !== 'string'
      || !['source_derived', 'internal_synthesis'].includes(String(stageRef.provenance_kind))
      || asStringArray(
        stageRef.source_anchor_refs,
        `${field}.agent_pack_plan.${stageRef.stage_id}.source_anchor_refs`,
      ).length === 0
    ) {
      throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan workflow stage provenance is invalid.`);
    }
  });
  const targetOnlyStages = plannedStageRefs.filter((stageRef) => stageRef.origin === 'target_only_requirement');
  if (
    targetOnlyStages.length !== 1
    || typeof targetOnlyStages[0].target_only_requirement_ref !== 'string'
    || !String(targetOnlyStages[0].target_only_requirement_ref).trim()
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan requires one target-only owner gate stage.`);
  }
  plannedStageRefs.forEach((stageRef) => {
    ['prompt_ref', 'stage_path', 'skill_ref'].forEach((pathField) => {
      if (typeof stageRef[pathField] !== 'string' || !String(stageRef[pathField]).trim()) {
        throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan.${stageRef.stage_id}.${pathField} is missing.`);
      }
    });
    ['knowledge_refs', 'tool_refs', 'quality_gate_refs'].forEach((listField) => {
      if (asStringArray(
        stageRef[listField],
        `${field}.agent_pack_plan.${stageRef.stage_id}.${listField}`,
      ).length === 0) {
        throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan.${stageRef.stage_id}.${listField} is empty.`);
      }
    });
  });
  [
    'planned_control_refs',
    'planned_capability_refs',
    'planned_knowledge_refs',
    'planned_tool_refs',
    'planned_quality_gate_refs',
  ].forEach((listField) => {
    if (asStringArray(actualAgentPackPlan[listField], `${field}.agent_pack_plan.${listField}`).length === 0) {
      throw new Error(`stage-decomposition pack draft ${field}.agent_pack_plan.${listField} must not be empty.`);
    }
  });
  assertHasStringRef(
    actualAgentPackPlan.source_pattern_ref_requirements,
    packetRef,
    `${field}.agent_pack_plan.source_pattern_ref_requirements`,
  );
  assertHasStringRef(
    actualAgentPackPlan.source_pattern_ref_requirements,
    transferMapRef,
    `${field}.agent_pack_plan.source_pattern_ref_requirements`,
  );
  assertHasStringRef(
    actualAgentPackPlan.source_pattern_ref_requirements,
    agentPackPlanRef,
    `${field}.agent_pack_plan.source_pattern_ref_requirements`,
  );
}

export function validateDesignAdmissionReceiptObject(
  actualReceipt: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  agentPackPlanRef: string,
  receiptRef: string,
  field: string,
): void {
  if (
    actualReceipt.surface_kind !== 'opl_meta_agent_design_admission_receipt'
    || actualReceipt.receipt_ref !== receiptRef
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.design_admission_receipt identity is invalid.`);
  }
  if (
    (
      actualReceipt.reference_design_packet_ref !== packetRef
      && actualReceipt.research_synthesis_packet_ref !== packetRef
      && actualReceipt.design_basis_ref !== packetRef
    )
    || actualReceipt.transfer_map_ref !== transferMapRef
    || actualReceipt.agent_pack_plan_ref !== agentPackPlanRef
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.design_admission_receipt source object refs are invalid.`);
  }
  [
    buildReferenceDesignPacket(targetAgent) ? 'ReferenceDesignPacket' : 'ResearchSynthesisPacket',
    'TransferMap',
    'AgentPackPlan',
  ].forEach((objectName) => assertHasStringRef(
    actualReceipt.required_design_objects,
    objectName,
    `${field}.design_admission_receipt.required_design_objects`,
  ));
  assertHasStringRef(
    actualReceipt.required_admission_receipts,
    'DesignAdmissionReceipt',
    `${field}.design_admission_receipt.required_admission_receipts`,
  );
  const sourceStageRefs = asRecordArray(
    actualReceipt.design_derived_stage_refs ?? actualReceipt.source_derived_stage_refs,
    `${field}.design_admission_receipt.design_derived_stage_refs`,
  );
  expectedSourcePatternRefs(targetAgent).forEach((expectedRef) => {
    if (!sourceStageRefs.some((stageRef) => stageRef.source_pattern_ref === expectedRef)) {
      throw new Error(`stage-decomposition pack draft ${field}.design_admission_receipt missing design-derived stage ${expectedRef}.`);
    }
  });
  if (asStringArray(
    actualReceipt.target_only_requirement_refs,
    `${field}.design_admission_receipt.target_only_requirement_refs`,
  ).length === 0) {
    throw new Error(`stage-decomposition pack draft ${field}.design_admission_receipt target-only requirements must not be empty.`);
  }
  if (!asStringArray(
    actualReceipt.rejected_source_pattern_refs,
    `${field}.design_admission_receipt.rejected_source_pattern_refs`,
  ).some((entry) => entry.startsWith('non-transferable:'))) {
    throw new Error(`stage-decomposition pack draft ${field}.design_admission_receipt missing rejected source pattern refs.`);
  }
  [
    'target_domain_ready',
    'production_ready',
    'owner_accepted',
    'quality_or_export_approved',
    'runtime_live_promoted',
  ].forEach((claim) => assertHasStringRef(
    actualReceipt.forbidden_claims,
    claim,
    `${field}.design_admission_receipt.forbidden_claims`,
  ));
  const boundary = asRecord(actualReceipt.authority_boundary, `${field}.design_admission_receipt.authority_boundary`);
  if (boundary.refs_only !== true) {
    throw new Error(`stage-decomposition pack draft ${field}.design_admission_receipt.authority_boundary.refs_only must be true.`);
  }
  [
    'can_copy_external_runtime',
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_create_target_owner_receipt',
    'can_promote_live_or_default_agent',
  ].forEach((fieldName) => assertBooleanFalse(boundary, fieldName, `${field}.design_admission_receipt.authority_boundary.${fieldName}`));
}

export function validateBuildReceiptObject(
  actualBuildReceipt: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  agentPackPlanRef: string,
  designAdmissionReceiptRef: string,
  buildReceiptRef: string,
  field: string,
): void {
  if (
    actualBuildReceipt.surface_kind !== 'opl_meta_agent_build_receipt'
    || actualBuildReceipt.receipt_ref !== buildReceiptRef
    || actualBuildReceipt.receipt_kind !== 'AgentBuildReceipt'
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.build_receipt identity is invalid.`);
  }
  if (
    (
      actualBuildReceipt.reference_design_packet_ref !== packetRef
      && actualBuildReceipt.research_synthesis_packet_ref !== packetRef
      && actualBuildReceipt.design_basis_ref !== packetRef
    )
    || actualBuildReceipt.transfer_map_ref !== transferMapRef
    || actualBuildReceipt.agent_pack_plan_ref !== agentPackPlanRef
    || actualBuildReceipt.design_admission_receipt_ref !== designAdmissionReceiptRef
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.build_receipt source object refs are invalid.`);
  }
  [
    buildReferenceDesignPacket(targetAgent) ? 'ReferenceDesignPacket' : 'ResearchSynthesisPacket',
    'TransferMap',
    'AgentPackPlan',
  ].forEach((objectName) => assertHasStringRef(
    actualBuildReceipt.required_design_objects,
    objectName,
    `${field}.build_receipt.required_design_objects`,
  ));
  if (optionalStringArray(
    actualBuildReceipt.required_machine_objects,
    `${field}.build_receipt.required_machine_objects`,
  ).includes('BuildReceipt')) {
    throw new Error(`stage-decomposition pack draft ${field}.build_receipt must not list BuildReceipt as a design object.`);
  }
  assertHasStringRef(
    actualBuildReceipt.required_admission_receipts,
    'DesignAdmissionReceipt',
    `${field}.build_receipt.required_admission_receipts`,
  );
  const sourceStageRefs = asRecordArray(
    actualBuildReceipt.design_derived_stage_refs ?? actualBuildReceipt.source_derived_stage_refs,
    `${field}.build_receipt.design_derived_stage_refs`,
  );
  expectedSourcePatternRefs(targetAgent).forEach((expectedRef) => {
    if (!sourceStageRefs.some((stageRef) => stageRef.source_pattern_ref === expectedRef)) {
      throw new Error(`stage-decomposition pack draft ${field}.build_receipt missing source-derived stage ${expectedRef}.`);
    }
  });
  if (asStringArray(
    actualBuildReceipt.target_only_requirement_refs,
    `${field}.build_receipt.target_only_requirement_refs`,
  ).length === 0) {
    throw new Error(`stage-decomposition pack draft ${field}.build_receipt target-only requirements must not be empty.`);
  }
  if (!asStringArray(
    actualBuildReceipt.rejected_source_pattern_refs,
    `${field}.build_receipt.rejected_source_pattern_refs`,
  ).some((entry) => entry.startsWith(`non-transferable:${targetAgent.domain_id}/`))) {
    throw new Error(`stage-decomposition pack draft ${field}.build_receipt missing rejected source pattern refs.`);
  }
  [
    'target_domain_ready',
    'production_ready',
    'owner_accepted',
    'quality_or_export_approved',
    'runtime_live_promoted',
  ].forEach((claim) => assertHasStringRef(
    actualBuildReceipt.forbidden_claims,
    claim,
    `${field}.build_receipt.forbidden_claims`,
  ));
  const boundary = asRecord(actualBuildReceipt.authority_boundary, `${field}.build_receipt.authority_boundary`);
  if (boundary.refs_only !== true) {
    throw new Error(`stage-decomposition pack draft ${field}.build_receipt.authority_boundary.refs_only must be true.`);
  }
  [
    'can_copy_external_runtime',
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_create_target_owner_receipt',
    'can_promote_live_or_default_agent',
  ].forEach((fieldName) => assertBooleanFalse(boundary, fieldName, `${field}.build_receipt.authority_boundary.${fieldName}`));
}

export function validateStageDecompositionSubpacketSetObject(
  actualSubpacketSet: JsonObject,
  targetAgent: TargetAgent,
  packetRef: string,
  transferMapRef: string,
  agentPackPlanRef: string,
  designAdmissionReceiptRef: string,
  buildReceiptRef: string,
  subpacketSetRef: string,
  field: string,
): void {
  const expectedSet = buildStageDecompositionSubpacketSet(targetAgent);
  if (!expectedSet) {
    throw new Error(`stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set is not expected.`);
  }
  if (
    actualSubpacketSet.surface_kind !== 'opl_meta_agent_stage_decomposition_subpacket_set'
    || actualSubpacketSet.packet_set_ref !== subpacketSetRef
    || actualSubpacketSet.stage_id !== 'stage-decomposition'
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set identity is invalid.`);
  }
  if (
    actualSubpacketSet.design_basis_packet_ref !== packetRef
    || actualSubpacketSet.transfer_map_ref !== transferMapRef
    || actualSubpacketSet.agent_pack_plan_ref !== agentPackPlanRef
    || actualSubpacketSet.design_admission_receipt_ref !== designAdmissionReceiptRef
    || actualSubpacketSet.build_receipt_ref !== buildReceiptRef
  ) {
    throw new Error(`stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set refs are invalid.`);
  }
  const actualSteps = asRecordArray(
    actualSubpacketSet.cognitive_step_packets,
    `${field}.stage_decomposition_subpacket_set.cognitive_step_packets`,
  );
  const expectedSteps = asRecordArray(
    expectedSet.cognitive_step_packets,
    `${field}.expected_stage_decomposition_subpacket_set.cognitive_step_packets`,
  );
  if (actualSteps.length !== expectedSteps.length) {
    throw new Error(`stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set cognitive step count is invalid.`);
  }
  expectedSteps.forEach((expectedStep, index) => {
    const actualStep = actualSteps[index];
    ['step_id', 'packet_kind', 'packet_ref'].forEach((stepField) => {
      if (actualStep[stepField] !== expectedStep[stepField]) {
        throw new Error(
          `stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set step ${index} ${stepField} is invalid.`,
        );
      }
    });
  });
  const boundary = asRecord(
    actualSubpacketSet.materialization_boundary,
    `${field}.stage_decomposition_subpacket_set.materialization_boundary`,
  );
  [
    'packet_set_is_materialization_source_of_truth',
    'generated_files_are_projection_surface',
    'final_files_must_trace_to_agent_pack_plan',
    'build_receipt_is_post_materialization_proof',
  ].forEach((fieldName) => {
    if (boundary[fieldName] !== true) {
      throw new Error(`stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set.materialization_boundary.${fieldName} must be true.`);
    }
  });
  if (boundary.ai_freeform_file_bodies_are_design_source_of_truth !== false) {
    throw new Error(
      `stage-decomposition pack draft ${field}.stage_decomposition_subpacket_set must not treat AI freeform file bodies as source of truth.`,
    );
  }
  [
    'design_basis_packet_present',
    'transfer_map_present',
    'agent_pack_plan_present',
    'design_admission_receipt_present_before_materialization',
    'agent_build_receipt_present_after_materialization',
    'generated_files_trace_to_agent_pack_plan',
  ].forEach((check) => assertHasStringRef(
    actualSubpacketSet.fail_closed_checks,
    check,
    `${field}.stage_decomposition_subpacket_set.fail_closed_checks`,
  ));
}

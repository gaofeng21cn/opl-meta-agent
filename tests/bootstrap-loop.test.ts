import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  oplBin,
  readJsonFile as readJson,
  repoRoot,
  writeJsonFile as writeJson,
} from './support/contracts.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import type { TargetAgent } from '../scripts/lib/meta-agent-loop-io.ts';
import {
  parseBuildAgentBaselineArgs,
  runBuildAgentBaseline,
} from '../scripts/build-agent-baseline.ts';
import {
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft/builder.ts';

type BaselineFixtureTargetAgent = TargetAgent & {
  domain_label: NonNullable<TargetAgent['domain_label']>;
  delivery_domain: NonNullable<TargetAgent['delivery_domain']>;
  target_brief: NonNullable<TargetAgent['target_brief']>;
};

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
  reference_design_source_refs: [
    'paper-ref:Zoller-2026-HemaGuide-case-grounded-agent',
    'repo-ref:https://github.com/Friedrich-Lab/HemaGuide',
  ],
  reference_design_pattern_notes: [
    'structured case extraction plus autonomous mode routing',
    'blinded benchmark, ablation, external validation, and silent-trial gates',
  ],
  reference_design_pattern_packet_refs: [
    'pattern-packet-ref:oma/reference-designs/HemaGuide/distilled-agent-design',
  ],
};

const sourceDerivedTargetAgent = {
  domain_id: 'surgery-risk-from-paper-agent',
  domain_label: 'Surgery Risk From Paper Agent',
  delivery_domain: 'surgical_risk_support',
  target_brief: 'Create an owner-gated surgical risk support agent from a supplied reference paper design.',
  reference_design_source_refs: [
    'paper-ref:uploaded-surgical-risk-agent-framework',
  ],
  reference_design_pattern_notes: [
    'extract source case representation, route selection, grounding, rubric, validation, and handoff patterns',
  ],
  reference_design_pattern_packet_refs: [
    'pattern-packet-ref:oma/reference-designs/uploaded-surgical-risk-agent-framework/distilled-agent-design',
  ],
};

const sourceDerivedObjectRefs = {
  referenceDesignPacketRef: 'reference-design-packet:opl-meta-agent/surgery-risk-from-paper-agent',
  transferMapRef: 'transfer-map:opl-meta-agent/surgery-risk-from-paper-agent',
  agentPackPlanRef: 'agent-pack-plan:opl-meta-agent/surgery-risk-from-paper-agent',
  designAdmissionReceiptRef: 'design-admission-receipt-ref:opl-meta-agent/surgery-risk-from-paper-agent',
  buildReceiptRef: 'build-receipt-ref:opl-meta-agent/surgery-risk-from-paper-agent',
  stageDecompositionSubpacketSetRef:
    'stage-decomposition-subpacket-set:opl-meta-agent/surgery-risk-from-paper-agent',
  patternNoteRef: 'reference-design-pattern-note:surgery-risk-from-paper-agent/1',
};

const researchDrivenTargetAgent = {
  domain_id: 'vague-idea-researched-agent',
  domain_label: 'Vague Idea Researched Agent',
  delivery_domain: 'knowledge_delivery',
  target_brief: 'Create an owner-gated target agent from a vague idea after researching expert practice.',
  research_source_refs: [
    'research-source-ref:public/expert-workflow-review',
  ],
  expert_practice_notes: [
    'experts first clarify target job, constraints, evidence sources, evaluation rubric, and handoff policy',
  ],
  research_synthesis_refs: [
    'research-synthesis-ref:oma/vague-idea/expert-practice-synthesis',
  ],
};

const researchDrivenObjectRefs = {
  researchSynthesisPacketRef: 'research-synthesis-packet:opl-meta-agent/vague-idea-researched-agent',
  transferMapRef: 'transfer-map:opl-meta-agent/vague-idea-researched-agent',
  agentPackPlanRef: 'agent-pack-plan:opl-meta-agent/vague-idea-researched-agent',
  designAdmissionReceiptRef: 'design-admission-receipt-ref:opl-meta-agent/vague-idea-researched-agent',
  buildReceiptRef: 'build-receipt-ref:opl-meta-agent/vague-idea-researched-agent',
  stageDecompositionSubpacketSetRef:
    'stage-decomposition-subpacket-set:opl-meta-agent/vague-idea-researched-agent',
  expertPracticeNoteRef: 'expert-practice-note:vague-idea-researched-agent/1',
  researchSourcePatternRef: 'research-source-ref:vague-idea-researched-agent/1',
};

const sourceDerivedRequiredDesignObjects = ['ReferenceDesignPacket', 'TransferMap', 'AgentPackPlan'];
const researchDrivenRequiredDesignObjects = ['ResearchSynthesisPacket', 'TransferMap', 'AgentPackPlan'];

const sourceDerivedCoreRefs = {
  reference_design_packet_ref: sourceDerivedObjectRefs.referenceDesignPacketRef,
  transfer_map_ref: sourceDerivedObjectRefs.transferMapRef,
  agent_pack_plan_ref: sourceDerivedObjectRefs.agentPackPlanRef,
  design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
  build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
  stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
};

const researchDrivenCoreRefs = {
  research_synthesis_packet_ref: researchDrivenObjectRefs.researchSynthesisPacketRef,
  transfer_map_ref: researchDrivenObjectRefs.transferMapRef,
  agent_pack_plan_ref: researchDrivenObjectRefs.agentPackPlanRef,
  design_admission_receipt_ref: researchDrivenObjectRefs.designAdmissionReceiptRef,
  build_receipt_ref: researchDrivenObjectRefs.buildReceiptRef,
  stage_decomposition_subpacket_set_ref: researchDrivenObjectRefs.stageDecompositionSubpacketSetRef,
};

function morphologyRefs(domainId: string, stageId = 'agent-output-draft'): string[] {
  return [
    `artifact-morphology-ref:${domainId}`,
    `artifact-native-source-format-ref:${domainId}/${stageId}`,
    `artifact-shard-unit-ref:${domainId}/${stageId}`,
    `target-extent-contract-ref:${domainId}/${stageId}`,
    `asset-custody-ref:${domainId}/${stageId}`,
    `artifact-ref:${domainId}/contracts/artifact_morphology_contract.json`,
  ];
}

function writeReviewerEvaluation(
  filePath: string,
  overrides: JsonObject = {},
  domainId = targetAgent.domain_id,
): void {
  writeJson(filePath, {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/oma/pass4',
    execution_attempt_ref: 'attempt:executor/oma/pass4',
    review_attempt_ref: 'attempt:ai-reviewer/oma/pass4',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The generated target agent keeps owner handoff and source morphology refs explicit.',
    suggestions: ['Keep baseline receipt gated by independent reviewer evidence.'],
    source_refs: ['review-ref:oma/pass4', ...morphologyRefs(domainId)],
    direct_evidence_refs: [`artifact-ref:${domainId}/package`, ...morphologyRefs(domainId)],
    verdict: 'baseline_ready_with_owner_gate',
    predicted_impact: 'Owner-gated target baseline remains auditable without OPL target truth authority.',
    provenance: { artifact_ref: 'artifact-ref:oma/pass4-review', created_by: 'test-fixture' },
    ...overrides,
  });
}

function writeStageCloseout(filePath: string, agent: TargetAgent = targetAgent): void {
  writeJson(filePath, buildFixtureStageDecompositionCloseout({ targetAgent: agent }));
}

function writeStageCloseoutWithoutSubpacketProjection(filePath: string, agent: TargetAgent): void {
  const packet = buildFixtureStageDecompositionCloseout({ targetAgent: agent });
  const draft = packet.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const stage = (stageControl.stages as JsonObject[])[0];
  const stageContract = stage.stage_contract as JsonObject;
  delete draft.stage_decomposition_subpacket_set;
  delete draft.stage_decomposition_subpacket_set_ref;
  delete draft.stage_decomposition_subpacket_set_refs;
  delete stageControl.stage_decomposition_subpacket_set;
  delete stageControl.stage_decomposition_subpacket_set_ref;
  delete stageControl.stage_decomposition_subpacket_set_refs;
  delete stage.stage_decomposition_subpacket_set;
  delete stage.stage_decomposition_subpacket_set_ref;
  delete stage.stage_decomposition_subpacket_set_refs;
  stage.inputs = (stage.inputs as JsonObject[]).filter((input) =>
    input.ref_kind !== 'stage_decomposition_subpacket_set_ref'
  );
  stageContract.requires = (stageContract.requires as string[]).filter((entry) =>
    !entry.startsWith('stage-decomposition-subpacket-set-ref:')
  );
  stageContract.expected_receipt_refs = (stageContract.expected_receipt_refs as JsonObject[]).filter((entry) =>
    entry.ref_kind !== 'stage_decomposition_subpacket_set_ref'
  );
  writeJson(filePath, packet);
}

function runBaselineFixture(
  outputRoot: string,
  reviewerPath: string,
  closeoutPath: string,
  agent: BaselineFixtureTargetAgent,
  extraArgs: string[],
): ReturnType<typeof runBuildAgentBaseline> {
  return runBuildAgentBaseline(parseBuildAgentBaselineArgs([
    '--output-dir',
    outputRoot,
    '--opl-bin',
    oplBin,
    '--ai-reviewer-evaluation',
    reviewerPath,
    '--stage-runner',
    'fixture',
    '--stage-decomposition-closeout',
    closeoutPath,
    '--domain-id',
    agent.domain_id,
    '--domain-label',
    agent.domain_label,
    '--delivery-domain',
    agent.delivery_domain,
    '--target-brief',
    agent.target_brief,
    ...extraArgs,
  ]));
}

function assertRefFields(surface: JsonObject, expected: Record<string, string>): void {
  Object.entries(expected).forEach(([field, value]) => assert.equal(surface[field], value, field));
}

function assertSingleRefArrays(surface: JsonObject, expected: Record<string, string>): void {
  Object.entries(expected).forEach(([field, value]) => assert.deepEqual(surface[field], [value], field));
}

test('build-agent-baseline materializes an explicit target package and owner-gated receipt', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-pass4-'));
  try {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    const closeoutPath = path.join(outputRoot, 'stage-closeout.json');
    writeReviewerEvaluation(reviewerPath);
    writeStageCloseout(closeoutPath);

    const payload = runBaselineFixture(outputRoot, reviewerPath, closeoutPath, targetAgent, [
      '--selected-opl-profile',
      targetAgent.selected_opl_profile_refs[0],
      '--profile-selection-rationale',
      targetAgent.profile_selection_rationale,
      '--reference-design-source',
      targetAgent.reference_design_source_refs[0],
      '--reference-design-source',
      targetAgent.reference_design_source_refs[1],
      '--reference-design-pattern',
      targetAgent.reference_design_pattern_notes[0],
      '--reference-design-pattern',
      targetAgent.reference_design_pattern_notes[1],
      '--reference-design-pattern-packet',
      targetAgent.reference_design_pattern_packet_refs[0],
    ]);

    const targetDir = path.join(outputRoot, targetAgent.domain_id);
    const receipt = readJson(path.join(outputRoot, 'baseline-delivery-receipt.json'));
    const suite = readJson(path.join(outputRoot, 'agent-lab-suite.json'));
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, 'agent/prompts/agent-output-draft.md'), 'utf8');
    const generatedKnowledge = fs.readFileSync(path.join(targetDir, 'agent/knowledge/target-agent-boundary-policy.md'), 'utf8');
    const evidenceRefs = suite.tasks[0].scorecard.evidence_refs as string[];
    assert.equal(payload.status, 'passed');
    assert.equal(descriptor.domain_id, targetAgent.domain_id);
    assert.deepEqual(descriptor.selected_opl_profile_refs, targetAgent.selected_opl_profile_refs);
    assert.equal(descriptor.profile_selection_rationale, targetAgent.profile_selection_rationale);
    assert.deepEqual(descriptor.reference_design_source_refs, targetAgent.reference_design_source_refs);
    assert.deepEqual(descriptor.reference_design_pattern_notes, targetAgent.reference_design_pattern_notes);
    assert.deepEqual(
      descriptor.reference_design_pattern_packet_refs,
      targetAgent.reference_design_pattern_packet_refs,
    );
    assert.deepEqual(capabilityMap.selected_profile_refs, targetAgent.selected_opl_profile_refs);
    assert.deepEqual(
      capabilityMap.profile_selection_receipt.selected_profile_refs,
      targetAgent.selected_opl_profile_refs,
    );
    assert.ok(
      capabilityMap.profile_selection_receipt.profile_catalog_refs.includes(
        'opl profiles select --intent <target-agent-intent> --json',
      ),
    );
    assert.ok(
      capabilityMap.profile_selection_receipt.profile_catalog_refs.includes(
        'opl profiles inspect evidence_grounded_decision_agent_profile.v1 --json',
      ),
    );
    assert.equal(
      JSON.stringify(capabilityMap.profile_selection_receipt).includes('opl foundry evidence-profile inspect'),
      false,
    );
    assert.ok(
      capabilityMap.profile_requirements.required_stage_archetypes.includes('mode_routing'),
    );
    assert.deepEqual(stageControl.selected_profile_refs, targetAgent.selected_opl_profile_refs);
    assert.ok(
      stageControl.profile_requirements.required_evidence_objects.includes('EvidencePacket'),
    );
    assert.equal(stageControl.stages[0].selected_executor.executor_kind, 'codex_cli');
    assert.deepEqual(stageControl.stages[0].selected_profile_refs, targetAgent.selected_opl_profile_refs);
    assert.ok(
      stageControl.stages[0].inputs.some((entry: JsonObject) =>
        entry.ref_kind === 'profile_selection_receipt_ref'
      ),
    );
    assert.deepEqual(
      stageControl.stages[0].reference_design_boundary.source_refs,
      targetAgent.reference_design_source_refs,
    );
    assert.deepEqual(
      stageControl.stages[0].reference_design_boundary.pattern_packet_refs,
      targetAgent.reference_design_pattern_packet_refs,
    );
    assert.ok(
      stageControl.stages[0].inputs.some((entry: JsonObject) => entry.ref_kind === 'reference_design_source_refs'),
    );
    assert.ok(
      stageControl.stages[0].inputs.some((entry: JsonObject) =>
        entry.ref_kind === 'reference_design_pattern_packet_refs'
      ),
    );
    assert.ok(evidenceRefs.includes(targetAgent.reference_design_source_refs[0]));
    assert.ok(evidenceRefs.includes(targetAgent.reference_design_pattern_packet_refs[0]));
    assert.equal(receipt.status, 'baseline_delivered');
    assert.deepEqual(receipt.reference_design.source_refs, targetAgent.reference_design_source_refs);
    assert.deepEqual(
      receipt.reference_design.pattern_packet_refs,
      targetAgent.reference_design_pattern_packet_refs,
    );
    assert.equal(
      receipt.reference_design.reference_design_packet_ref,
      'reference-design-packet:opl-meta-agent/research-workbench-agent',
    );
    assert.equal(receipt.reference_design.transfer_map_ref, 'transfer-map:opl-meta-agent/research-workbench-agent');
    assert.equal(receipt.reference_design.agent_pack_plan_ref, 'agent-pack-plan:opl-meta-agent/research-workbench-agent');
    assert.equal(receipt.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(receipt.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.ok(primarySkill.includes(targetAgent.reference_design_pattern_packet_refs[0]));
    assert.ok(generatedPrompt.includes(targetAgent.selected_opl_profile_refs[0]));
    assert.ok(generatedKnowledge.includes('EvidencePacket'));
    assert.ok(
      stageControl.profile_requirements.required_reference_pack_roles.includes(
        'evidence_source_freshness_policy',
      ),
    );
    assert.ok(
      capabilityMap.profile_selection_receipt.profile_catalog_refs.includes(
        'opl profiles select --intent <target-agent-intent> --reference-source <source-ref> --json',
      ),
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline repairs mechanical subpacket projection without blocking materialization', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-source-derived-repair-'));
  try {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    const closeoutPath = path.join(outputRoot, 'stage-closeout.json');
    writeReviewerEvaluation(reviewerPath, {}, sourceDerivedTargetAgent.domain_id);
    writeStageCloseoutWithoutSubpacketProjection(closeoutPath, sourceDerivedTargetAgent);

    const payload = runBaselineFixture(outputRoot, reviewerPath, closeoutPath, sourceDerivedTargetAgent, [
      '--reference-design-source',
      sourceDerivedTargetAgent.reference_design_source_refs[0],
      '--reference-design-pattern',
      sourceDerivedTargetAgent.reference_design_pattern_notes[0],
      '--reference-design-pattern-packet',
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0],
    ]);

    const targetDir = path.join(outputRoot, sourceDerivedTargetAgent.domain_id);
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    const stage = stageControl.stages[0] as JsonObject;
    const stageContract = stage.stage_contract as JsonObject;
    assert.equal(payload.status, 'passed');
    assert.equal(
      fs.existsSync(path.join(outputRoot, `${sourceDerivedTargetAgent.domain_id}-stage-decomposition-blocker.json`)),
      false,
    );
    assert.equal(
      stageControl.stage_decomposition_subpacket_set_ref,
      sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    );
    assert.equal(
      stage.stage_decomposition_subpacket_set_ref,
      sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    );
    assert.ok((stage.inputs as JsonObject[]).some((entry) =>
      entry.ref_kind === 'stage_decomposition_subpacket_set_ref'
      && entry.ref === sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef
    ));
    assert.ok((stageContract.requires as string[]).includes(
      `stage-decomposition-subpacket-set-ref:${sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef}`,
    ));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline materializes a source-derived target package without a builtin profile', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-source-derived-'));
  try {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    const closeoutPath = path.join(outputRoot, 'stage-closeout.json');
    writeReviewerEvaluation(reviewerPath, {}, sourceDerivedTargetAgent.domain_id);
    writeStageCloseout(closeoutPath, sourceDerivedTargetAgent);

    const payload = runBaselineFixture(outputRoot, reviewerPath, closeoutPath, sourceDerivedTargetAgent, [
      '--reference-design-source',
      sourceDerivedTargetAgent.reference_design_source_refs[0],
      '--reference-design-pattern',
      sourceDerivedTargetAgent.reference_design_pattern_notes[0],
      '--reference-design-pattern-packet',
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0],
    ]);

    const targetDir = path.join(outputRoot, sourceDerivedTargetAgent.domain_id);
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    const stageAttemptInput = readJson(path.join(outputRoot, 'stage-decomposition-attempt-input.json'));
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, 'agent/prompts/agent-output-draft.md'), 'utf8');

    assert.equal(payload.status, 'passed');
    assert.equal(descriptor.profile_selection_mode, 'source_derived_design');
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.equal(
      descriptor.source_derived_design_receipt.route_ref,
      'opl-profile-route:source_derived_design_profile_route.v1',
    );
    assertRefFields(descriptor, sourceDerivedCoreRefs);
    assert.deepEqual(descriptor.build_receipt.required_design_objects, sourceDerivedRequiredDesignObjects);
    assert.equal(descriptor.build_receipt.design_admission_receipt_ref, sourceDerivedObjectRefs.designAdmissionReceiptRef);
    assert.ok(descriptor.build_receipt.forbidden_claims.includes('runtime_live_promoted'));
    assert.deepEqual(
      descriptor.stage_decomposition_subpacket_set.cognitive_step_packets.map((entry: JsonObject) => entry.step_id),
      ['design-basis', 'transfer-planning', 'agent-pack-planning', 'design-admission', 'build-verification'],
    );
    assert.equal(
      descriptor.stage_decomposition_subpacket_set.materialization_boundary
        .ai_freeform_file_bodies_are_design_source_of_truth,
      false,
    );
    assert.deepEqual(
      descriptor.source_derived_design_receipt.reference_design_pattern_packet_refs,
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs,
    );
    assert.deepEqual(
      descriptor.source_derived_design_receipt.required_design_objects,
      sourceDerivedRequiredDesignObjects,
    );
    assert.deepEqual(
      descriptor.source_derived_design_receipt.required_machine_objects,
      sourceDerivedRequiredDesignObjects,
    );
    assert.equal(capabilityMap.profile_selection_mode, 'source_derived_design');
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
    assert.equal(
      capabilityMap.source_derived_design_receipt.route_ref,
      'opl-profile-route:source_derived_design_profile_route.v1',
    );
    assert.ok(
      capabilityMap.profile_requirements.required_stage_archetypes.includes('reference_design_pattern_extraction'),
    );
    assertRefFields(capabilityMap, sourceDerivedCoreRefs);
    assertSingleRefArrays(capabilityMap, {
      reference_design_packet_refs: sourceDerivedObjectRefs.referenceDesignPacketRef,
      transfer_map_refs: sourceDerivedObjectRefs.transferMapRef,
      agent_pack_plan_refs: sourceDerivedObjectRefs.agentPackPlanRef,
      design_admission_receipt_refs: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      build_receipt_refs: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_refs: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assertRefFields(capabilityMap.profile_selection_receipt as JsonObject, sourceDerivedCoreRefs);
    assert.deepEqual(
      capabilityMap.reference_design_pattern_packet_refs,
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs,
    );
    assert.equal(stageControl.profile_selection_mode, 'source_derived_design');
    assert.deepEqual(stageControl.selected_profile_refs, []);
    assert.equal(
      stageControl.source_derived_design_receipt.route_ref,
      'opl-profile-route:source_derived_design_profile_route.v1',
    );
    assertRefFields(stageControl, sourceDerivedCoreRefs);
    assert.equal(stageControl.build_receipt.build_source_kind, 'source_derived_design');
    assert.equal(stageControl.build_receipt.receipt_kind, 'AgentBuildReceipt');
    assert.equal(stageControl.build_receipt.design_admission_receipt_ref, sourceDerivedObjectRefs.designAdmissionReceiptRef);
    assert.deepEqual(stageControl.build_receipt.target_only_requirement_refs, [
      'target-only-requirement:surgery-risk-from-paper-agent/owner-gated-closeout',
    ]);
    assert.deepEqual(stageControl.design_admission_receipt.required_design_objects, sourceDerivedRequiredDesignObjects);
    assert.ok(stageControl.build_receipt.rejected_source_pattern_refs.some((ref: string) =>
      ref.startsWith('non-transferable:surgery-risk-from-paper-agent/')
    ));
    assert.deepEqual(stageControl.stages[0].stage_pattern_source_refs, [
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0],
      sourceDerivedObjectRefs.patternNoteRef,
    ]);
    assert.ok(
      stageControl.reference_design_packet.extractable_design_aspects.some((aspect: JsonObject) =>
        aspect.source_pattern_ref === sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0]
        && aspect.target_design_slot === 'stage_control_plane'
      ),
    );
    assert.ok(
      stageControl.transfer_map.mappings.some((mapping: JsonObject) =>
        mapping.source_pattern_ref === sourceDerivedObjectRefs.patternNoteRef
        && mapping.target_capability_slot === 'prompt_knowledge_tool_quality_gate_refs'
      ),
    );
    assert.ok(
      stageControl.agent_pack_plan.planned_stage_refs.some((stageRef: JsonObject) =>
        stageRef.source_pattern_ref === sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0]
      ),
    );
    assert.ok(stageControl.stages[0].inputs.some((entry: JsonObject) =>
      entry.ref_kind === 'reference_design_packet_ref'
      && entry.ref === sourceDerivedObjectRefs.referenceDesignPacketRef
    ));
    assert.ok(stageControl.stages[0].inputs.some((entry: JsonObject) =>
      entry.ref_kind === 'design_admission_receipt_ref'
      && entry.ref === sourceDerivedObjectRefs.designAdmissionReceiptRef
    ));
    assert.ok(stageControl.stages[0].inputs.some((entry: JsonObject) =>
      entry.ref_kind === 'stage_decomposition_subpacket_set_ref'
      && entry.ref === sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef
    ));
    assert.equal(stageControl.stages[0].inputs.some((entry: JsonObject) =>
      entry.ref_kind === 'build_receipt_ref'
      && entry.ref === sourceDerivedObjectRefs.buildReceiptRef
    ), false);
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `reference-design-packet-ref:${sourceDerivedObjectRefs.referenceDesignPacketRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `transfer-map-ref:${sourceDerivedObjectRefs.transferMapRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `agent-pack-plan-ref:${sourceDerivedObjectRefs.agentPackPlanRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `design-admission-receipt-ref:${sourceDerivedObjectRefs.designAdmissionReceiptRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `stage-decomposition-subpacket-set-ref:${sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.expected_receipt_refs.some((entry: JsonObject) =>
        entry.ref === sourceDerivedObjectRefs.buildReceiptRef
      ),
    );
    assert.deepEqual(
      stageAttemptInput.profile_selection_input_policy.required_design_objects,
      sourceDerivedRequiredDesignObjects,
    );
    assert.deepEqual(
      stageAttemptInput.profile_selection_input_policy.required_machine_objects,
      sourceDerivedRequiredDesignObjects,
    );
    assertRefFields(stageAttemptInput.profile_selection_input_policy as JsonObject, {
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assertRefFields(stageAttemptInput.reference_design_input_policy as JsonObject, {
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assert.ok(
      stageControl.capability_plan_requirements.includes(
        'map_transferable_patterns_into_stage_control_plane_prompt_knowledge_quality_gate_and_agent_lab_suite_seed',
      ),
    );
    assert.ok(primarySkill.includes('Profile selection mode: source_derived_design'));
    assert.ok(primarySkill.includes('Selected profile ref: none; source-derived design refs are the active design input.'));
    assert.ok(primarySkill.includes(sourceDerivedObjectRefs.referenceDesignPacketRef));
    assert.ok(primarySkill.includes(sourceDerivedObjectRefs.transferMapRef));
    assert.ok(primarySkill.includes(sourceDerivedObjectRefs.agentPackPlanRef));
    assert.ok(primarySkill.includes(sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef));
    assert.ok(generatedPrompt.includes('ReferenceDesignPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt'));
    assert.ok(generatedPrompt.includes(sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0]));
    assert.equal(payload.target_agent.selected_opl_profile_refs, undefined);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline materializes a research-driven target package from vague idea inputs', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-research-driven-'));
  try {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    const closeoutPath = path.join(outputRoot, 'stage-closeout.json');
    writeReviewerEvaluation(reviewerPath, {}, researchDrivenTargetAgent.domain_id);
    writeStageCloseout(closeoutPath, researchDrivenTargetAgent);

    const payload = runBaselineFixture(outputRoot, reviewerPath, closeoutPath, researchDrivenTargetAgent, [
      '--research-source',
      researchDrivenTargetAgent.research_source_refs[0],
      '--expert-practice',
      researchDrivenTargetAgent.expert_practice_notes[0],
      '--research-synthesis',
      researchDrivenTargetAgent.research_synthesis_refs[0],
    ]);

    const targetDir = path.join(outputRoot, researchDrivenTargetAgent.domain_id);
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    const receipt = readJson(path.join(outputRoot, 'baseline-delivery-receipt.json'));
    const suite = readJson(path.join(outputRoot, 'agent-lab-suite.json'));
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, 'agent/prompts/agent-output-draft.md'), 'utf8');

    assert.equal(payload.status, 'passed');
    assert.equal(descriptor.profile_selection_mode, 'research_driven_design');
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.equal(
      descriptor.research_driven_design_receipt.route_ref,
      'opl-profile-route:research_driven_design_profile_route.v1',
    );
    assert.deepEqual(descriptor.research_source_refs, researchDrivenTargetAgent.research_source_refs);
    assert.deepEqual(descriptor.expert_practice_notes, researchDrivenTargetAgent.expert_practice_notes);
    assert.deepEqual(descriptor.research_synthesis_refs, researchDrivenTargetAgent.research_synthesis_refs);
    assertRefFields(descriptor, researchDrivenCoreRefs);
    assert.deepEqual(descriptor.build_receipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.equal(descriptor.build_receipt.build_source_kind, 'research_driven_design');
    assert.equal(descriptor.build_receipt.design_admission_receipt_ref, researchDrivenObjectRefs.designAdmissionReceiptRef);
    assert.equal(
      descriptor.stage_decomposition_subpacket_set.design_basis_object,
      'ResearchSynthesisPacket',
    );
    assert.equal(capabilityMap.profile_selection_mode, 'research_driven_design');
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
    assert.equal(
      capabilityMap.research_driven_design_receipt.route_ref,
      'opl-profile-route:research_driven_design_profile_route.v1',
    );
    assert.ok(
      capabilityMap.profile_requirements.required_stage_archetypes.includes('expert_practice_research'),
    );
    assertRefFields(capabilityMap, researchDrivenCoreRefs);
    assertSingleRefArrays(capabilityMap, {
      research_synthesis_packet_refs: researchDrivenObjectRefs.researchSynthesisPacketRef,
      stage_decomposition_subpacket_set_refs: researchDrivenObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assert.equal(stageControl.profile_selection_mode, 'research_driven_design');
    assert.equal(
      stageControl.research_driven_design_receipt.route_ref,
      'opl-profile-route:research_driven_design_profile_route.v1',
    );
    assertRefFields(stageControl, {
      research_synthesis_packet_ref: researchDrivenObjectRefs.researchSynthesisPacketRef,
      design_admission_receipt_ref: researchDrivenObjectRefs.designAdmissionReceiptRef,
      stage_decomposition_subpacket_set_ref: researchDrivenObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assert.deepEqual(stageControl.design_admission_receipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.deepEqual(stageControl.build_receipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.equal(stageControl.build_receipt.design_admission_receipt_ref, researchDrivenObjectRefs.designAdmissionReceiptRef);
    assert.deepEqual(stageControl.stages[0].stage_pattern_source_refs, [
      researchDrivenTargetAgent.research_synthesis_refs[0],
      researchDrivenObjectRefs.expertPracticeNoteRef,
      researchDrivenObjectRefs.researchSourcePatternRef,
    ]);
    assert.ok(
      stageControl.research_synthesis_packet.extractable_design_aspects.some((aspect: JsonObject) =>
        aspect.source_pattern_ref === researchDrivenTargetAgent.research_synthesis_refs[0]
        && aspect.target_design_slot === 'stage_control_plane'
      ),
    );
    assert.ok(
      stageControl.stages[0].inputs.some((entry: JsonObject) =>
        entry.ref_kind === 'research_synthesis_packet_ref'
        && entry.ref === researchDrivenObjectRefs.researchSynthesisPacketRef
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `research-synthesis-packet-ref:${researchDrivenObjectRefs.researchSynthesisPacketRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `design-admission-receipt-ref:${researchDrivenObjectRefs.designAdmissionReceiptRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.requires.includes(
        `stage-decomposition-subpacket-set-ref:${researchDrivenObjectRefs.stageDecompositionSubpacketSetRef}`,
      ),
    );
    assert.ok(
      stageControl.capability_plan_requirements.includes(
        'map_researched_expert_practice_into_stage_control_plane_prompt_knowledge_quality_gate_and_agent_lab_suite_seed',
      ),
    );
    assert.deepEqual(
      receipt.research_driven_design.source_refs,
      researchDrivenTargetAgent.research_source_refs,
    );
    assert.equal(
      receipt.research_driven_design.research_synthesis_packet_ref,
      researchDrivenObjectRefs.researchSynthesisPacketRef,
    );
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(researchDrivenTargetAgent.research_source_refs[0]));
    assert.ok(suite.tasks[0].scorecard.evidence_refs.includes(researchDrivenTargetAgent.research_synthesis_refs[0]));
    assert.ok(primarySkill.includes('Profile selection mode: research_driven_design'));
    assert.ok(primarySkill.includes('Selected profile ref: none; research-driven design refs are the active design input.'));
    assert.ok(primarySkill.includes(researchDrivenObjectRefs.researchSynthesisPacketRef));
    assert.ok(primarySkill.includes(researchDrivenObjectRefs.stageDecompositionSubpacketSetRef));
    assert.ok(generatedPrompt.includes('ResearchSynthesisPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt'));
    assert.ok(generatedPrompt.includes(researchDrivenTargetAgent.research_synthesis_refs[0]));
    assert.equal(payload.target_agent.selected_opl_profile_refs, undefined);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline fails closed without independent reviewer evidence', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-missing-reviewer-pass4-'));
  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/build-agent-baseline.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
        '--domain-id',
        'missing-reviewer-agent',
        '--target-brief',
        'Create an OPL-compatible fixture agent.',
      ],
      { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ai reviewer evaluation/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('build-agent-baseline fails closed when no builtin profile or design-basis refs exist', () => {
  assert.throws(
    () => parseBuildAgentBaselineArgs([
      '--ai-reviewer-evaluation',
      '/tmp/reviewer.json',
      '--domain-id',
      'unrouted-agent',
      '--target-brief',
      'Create an OPL-compatible fixture agent.',
    ]),
    /selected-opl-profile.*source-derived design refs.*research-driven design refs/i,
  );
});

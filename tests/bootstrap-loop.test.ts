import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateJsonSchemaPayload } from 'opl-framework-shared/json-schema-registry';
import {
  buildAiReviewerEvaluation,
  oplOwnerRepoRoot,
  readJsonFile as readJson,
  repoRoot,
  withTempDir,
  writeJsonFile as writeJson,
} from './support/contracts.ts';
import {
  buildAgentPackPlan,
  buildDesignAdmissionReceipt,
  buildProfileSelectionReceipt,
  buildReferenceDesignPacket,
  buildResearchSynthesisPacket,
  buildTransferMap,
  type JsonObject,
} from '../scripts/lib/domain-pack.ts';
import type { TargetAgent } from '../scripts/lib/meta-agent-loop-io.ts';
import {
  parseBuildAgentBaselineArgs,
  resolveTargetAgentProfileSelection,
  runBuildAgentBaseline,
} from '../scripts/build-agent-baseline.ts';
import {
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft/builder.ts';
import { runStageDecompositionAttempt } from '../scripts/lib/stage-decomposition-runner.ts';

const oplBin = path.join(oplOwnerRepoRoot, 'bin', 'opl');

type BaselineFixtureTargetAgent = TargetAgent & {
  domain_label: NonNullable<TargetAgent['domain_label']>;
  delivery_domain: NonNullable<TargetAgent['delivery_domain']>;
  target_brief: NonNullable<TargetAgent['target_brief']>;
};

const canonicalOplPatternPacketPath = path.join(
  repoRoot,
  'tests/fixtures/opl-reference-design-pattern-packet.json',
);
const canonicalOplSourceMaterialRef = 'source-material:sha256:surgical-risk-fixture';

function writeReferenceDesignPacketFixture(
  dir: string,
  mutatePacket?: (packet: JsonObject, notesPath: string) => void,
  mutateNotes?: (notes: JsonObject) => void,
): string {
  const packetPath = path.join(dir, 'pattern-packet.json');
  const notesPath = path.join(dir, 'opl-reference-design-pattern-notes.json');
  const packet = readJson(canonicalOplPatternPacketPath);
  const notes = readJson(path.join(repoRoot, 'tests/fixtures/opl-reference-design-pattern-notes.json'));
  mutatePacket?.(packet, notesPath);
  mutateNotes?.(notes);
  writeJson(notesPath, notes);
  writeJson(packetPath, packet);
  return packetPath;
}

function packetTarget(packetPath: string): typeof sourceDerivedTargetAgent {
  return {
    ...sourceDerivedTargetAgent,
    reference_design_pattern_packet_refs: [packetPath],
  };
}

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
    canonicalOplSourceMaterialRef,
  ],
  reference_design_pattern_notes: [
    'structured case extraction plus autonomous mode routing',
    'blinded benchmark, ablation, external validation, and silent-trial gates',
  ],
  reference_design_pattern_packet_refs: [
    canonicalOplPatternPacketPath,
  ],
};

const sourceDerivedTargetAgent = {
  domain_id: 'surgery-risk-from-paper-agent',
  domain_label: 'Surgery Risk From Paper Agent',
  delivery_domain: 'surgical_risk_support',
  target_brief: 'Create an owner-gated expert workflow transfer agent from a supplied reference paper design.',
  reference_design_source_refs: [
    canonicalOplSourceMaterialRef,
  ],
  reference_design_pattern_notes: [
    'extract source case representation, route selection, grounding, rubric, validation, and handoff patterns',
  ],
  reference_design_pattern_packet_refs: [
    canonicalOplPatternPacketPath,
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
  sourcePatternRef: 'tests/fixtures/opl-reference-design-pattern-packet.json',
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
  writeJson(filePath, buildAiReviewerEvaluation({
    source_refs: ['review-ref:oma/pass4', ...morphologyRefs(domainId)],
    direct_evidence_refs: [`artifact-ref:${domainId}/package`, ...morphologyRefs(domainId)],
    ...overrides,
  }));
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

function validateBuildAgentBaselineOutput(payload: unknown) {
  const schemaRef = 'contracts/schemas/build-agent-baseline.output.schema.json';
  const schema = readJson(path.join(repoRoot, schemaRef));
  return validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, payload);
}

function assertBuildAgentBaselineOutputSchema(payload: unknown): void {
  const result = validateBuildAgentBaselineOutput(payload);
  assert.equal(result.ok, true, JSON.stringify(result));
}

function assertRefFields(surface: JsonObject, expected: Record<string, string>): void {
  Object.entries(expected).forEach(([field, value]) => assert.equal(surface[field], value, field));
}

function assertStageInput(stage: JsonObject, refKind: string, ref?: string): void {
  assert.ok((stage.inputs as JsonObject[]).some((entry) =>
    entry.ref_kind === refKind && (ref === undefined || entry.ref === ref)
  ), `${refKind} input`);
}

test('build-agent-baseline writes a conformant hybrid package and canonical Foundry handoff', () => {
  withTempDir('oma-bootstrap-pass4-', (outputRoot) => {
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
      '--reference-design-pattern',
      targetAgent.reference_design_pattern_notes[0],
      '--reference-design-pattern',
      targetAgent.reference_design_pattern_notes[1],
      '--reference-design-pattern-packet',
      targetAgent.reference_design_pattern_packet_refs[0],
    ]);

    const targetDir = path.join(outputRoot, targetAgent.domain_id);
    const workOrder = readJson(path.join(outputRoot, 'foundry-lab-work-order.json'));
    const suite = readJson(path.join(outputRoot, 'agent-lab-suite-seed.json'));
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    const firstStage = stageControl.stages[0] as JsonObject;
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, firstStage.prompt_refs[0].ref), 'utf8');
    const generatedKnowledge = fs.readFileSync(path.join(targetDir, firstStage.knowledge_refs[0].ref), 'utf8');
    const evidenceRefs = suite.tasks[0].scorecard_spec.evidence_refs as string[];
    assert.deepEqual(suite.evaluation_target_agent, {
      domain_id: targetAgent.domain_id,
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      descriptor_ref: path.join(targetDir, 'contracts/domain_descriptor.json'),
    });
    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.opl_profile_conformance.status, 'passed');
    assertBuildAgentBaselineOutputSchema(payload);
    assert.equal(payload.artifacts.agent_build_receipt_path, path.join(targetDir, 'contracts/agent_build_receipt.json'));
    assert.equal(payload.artifacts.agent_build_receipt_ref, `build-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`);
    const missingBuildReceiptRef = structuredClone(payload);
    delete missingBuildReceiptRef.artifacts.agent_build_receipt_ref;
    assert.equal(validateBuildAgentBaselineOutput(missingBuildReceiptRef).ok, false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'agent-lab-suite.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'online-learning-candidate.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'mechanism-patch-proposal.json')), false);
    assert.equal(descriptor.domain_id, targetAgent.domain_id);
    assert.deepEqual(descriptor.selected_opl_profile_refs, targetAgent.selected_opl_profile_refs);
    assert.equal(descriptor.profile_selection_rationale, targetAgent.profile_selection_rationale);
    assert.deepEqual(descriptor.reference_design_source_refs, targetAgent.reference_design_source_refs);
    assert.deepEqual(descriptor.reference_design_pattern_notes, targetAgent.reference_design_pattern_notes);
    assert.deepEqual(descriptor.reference_design_pattern_packet_refs, targetAgent.reference_design_pattern_packet_refs);
    assert.deepEqual(capabilityMap.selected_profile_refs, targetAgent.selected_opl_profile_refs);
    assert.deepEqual(capabilityMap.profile_selection_receipt.selected_profile_refs, targetAgent.selected_opl_profile_refs);
    const profileCatalogRefs = capabilityMap.profile_selection_receipt.profile_catalog_refs.join('\n');
    assert.match(profileCatalogRefs, /opl profiles select/);
    assert.match(profileCatalogRefs, /opl profiles inspect/);
    assert.doesNotMatch(profileCatalogRefs, /opl foundry evidence-profile inspect/);
    assert.ok(capabilityMap.profile_requirements.required_stage_archetypes.includes('mode_routing'));
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
    assert.equal(workOrder.work_order_kind, 'agent_baseline_evaluation');
    assert.equal(workOrder.status, 'ready_for_opl_foundry_lab_evaluation');
    assert.equal(workOrder.consumer_dependency.status, 'available');
    assert.equal(
      workOrder.execution_aperture.action_ref,
      'opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>',
    );
    assert.equal(workOrder.target_agent.domain_id, targetAgent.domain_id);
    assert.equal(workOrder.target_agent.target_agent_ref, `domain-agent:${targetAgent.domain_id}`);
    assert.equal(workOrder.target_agent.descriptor_ref, path.join(targetDir, 'contracts/domain_descriptor.json'));
    assert.equal(suite.target_agent_ref, `domain-agent:${targetAgent.domain_id}`);
    assert.equal(suite.target_agent_descriptor_ref, path.join(targetDir, 'contracts/domain_descriptor.json'));
    assert.equal(suite.tasks[0].target_agent_ref, `domain-agent:${targetAgent.domain_id}`);
    assert.equal(suite.tasks[0].target_agent_descriptor_ref, path.join(targetDir, 'contracts/domain_descriptor.json'));
    assert.equal(suite.tasks[0].scorecard_spec.passed, undefined);
    assert.equal(suite.tasks[0].promotion_gate_request.gate_status, undefined);
    assert.equal(suite.tasks[0].recovery_probe_specs[0].observed_status, undefined);
    assert.equal(workOrder.authority_boundary.oma_can_execute_agent_lab_suite, false);
    assert.equal(workOrder.authority_boundary.oma_can_write_owner_receipt_body, false);
    assert.ok(primarySkill.includes(targetAgent.reference_design_pattern_packet_refs[0]));
    assert.ok(generatedPrompt.includes(targetAgent.selected_opl_profile_refs[0]));
    assert.ok(generatedKnowledge.includes('EvidencePacket'));
    assert.ok(stageControl.profile_requirements.required_reference_pack_roles.includes('evidence_source_freshness_policy'));
  });
});

test('build-agent-baseline repairs mechanical subpacket projection before conformant delivery', () => {
  withTempDir('oma-bootstrap-source-derived-repair-', (outputRoot) => {
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
    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.opl_profile_conformance.status, 'passed');
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
  });
});

test('build-agent-baseline materializes source-derived proof with canonical OPL conformance', () => {
  withTempDir('oma-bootstrap-source-derived-', (outputRoot) => {
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
    const buildReceipt = readJson(path.join(targetDir, 'contracts/agent_build_receipt.json'));
    const stageAttemptInput = readJson(path.join(outputRoot, 'stage-decomposition-attempt-input.json'));
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, stageControl.stages[0].prompt_refs[0].ref), 'utf8');

    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.opl_profile_conformance.status, 'passed');
    assertBuildAgentBaselineOutputSchema(payload);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
    assert.equal(descriptor.profile_selection_mode, 'source_derived_design');
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
    assert.deepEqual(stageControl.selected_profile_refs, []);
    assert.deepEqual(descriptor.build_receipt.required_design_objects, sourceDerivedRequiredDesignObjects);
    assert.ok(descriptor.build_receipt.forbidden_claims.includes('runtime_live_promoted'));
    assertRefFields(capabilityMap.profile_selection_receipt as JsonObject, {
      reference_design_packet_ref: sourceDerivedObjectRefs.referenceDesignPacketRef,
      transfer_map_ref: sourceDerivedObjectRefs.transferMapRef,
      agent_pack_plan_ref: sourceDerivedObjectRefs.agentPackPlanRef,
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      expected_build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assert.equal(Object.hasOwn(capabilityMap.profile_selection_receipt, 'build_receipt'), false);
    assert.equal(stageControl.build_receipt.build_source_kind, 'source_derived_design');
    assert.equal(stageControl.build_receipt.receipt_kind, 'AgentBuildReceipt');
    assert.equal(stageControl.stages.length, 5);
    assert.deepEqual(
      stageControl.stages
        .filter((stage: JsonObject) => stage.stage_origin === 'source_pattern_ref')
        .map((stage: JsonObject) => stage.step_id),
      ['risk-case-intake', 'model-evidence-review', 'risk-interpretation', 'owner-handoff-gate'],
    );
    assert.equal(stageControl.stages.at(-1).stage_origin, 'target_only_requirement');
    assert.equal(
      stageControl.stages.at(-1).target_only_requirement_ref,
      'target-only-requirement:surgery-risk-from-paper-agent/owner-gated-closeout',
    );
    assert.equal(stageControl.build_receipt.receipt_timing, 'post_materialization');
    [descriptor, capabilityMap, stageControl].forEach((surface) => assert.deepEqual(surface.build_receipt, buildReceipt));
    assert.deepEqual(
      stageControl.build_receipt.materialization.materialized_stage_ids,
      stageControl.stages.map((stage: JsonObject) => stage.stage_id),
    );
    const plan = stageControl.agent_pack_plan as JsonObject;
    const digestRefs = new Set(
      stageControl.build_receipt.materialization.materialized_file_digests
        .map((entry: JsonObject) => entry.ref),
    );
    const plannedRefs = [
      ...(plan.planned_control_refs as string[]),
      ...(plan.planned_capability_refs as string[]),
      ...(plan.planned_stage_refs as JsonObject[]).flatMap((stage) => [
        stage.prompt_ref,
        stage.stage_path,
        stage.skill_ref,
        ...(stage.knowledge_refs as string[]),
        ...(stage.tool_refs as string[]),
        ...(stage.quality_gate_refs as string[]),
      ]),
    ];
    plannedRefs.forEach((ref) => assert.ok(digestRefs.has(ref), `missing build receipt digest: ${ref}`));
    assert.deepEqual(stageControl.build_receipt.target_only_requirement_refs, [
      'target-only-requirement:surgery-risk-from-paper-agent/owner-gated-closeout',
    ]);
    assert.deepEqual(stageControl.stages[0].stage_pattern_source_refs, [
      sourceDerivedObjectRefs.sourcePatternRef,
    ]);
    const firstStage = stageControl.stages[0] as JsonObject;
    [
      ['reference_design_packet_ref', sourceDerivedObjectRefs.referenceDesignPacketRef],
      ['design_admission_receipt_ref', sourceDerivedObjectRefs.designAdmissionReceiptRef],
      ['stage_decomposition_subpacket_set_ref', sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef],
    ].forEach(([kind, ref]) => assertStageInput(firstStage, kind, ref));
    assert.equal((firstStage.inputs as JsonObject[]).some((entry) => entry.ref_kind === 'build_receipt_ref'), false);
    [
      `reference-design-packet-ref:${sourceDerivedObjectRefs.referenceDesignPacketRef}`,
      `transfer-map-ref:${sourceDerivedObjectRefs.transferMapRef}`,
      `agent-pack-plan-ref:${sourceDerivedObjectRefs.agentPackPlanRef}`,
      `design-admission-receipt-ref:${sourceDerivedObjectRefs.designAdmissionReceiptRef}`,
      `stage-decomposition-subpacket-set-ref:${sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef}`,
    ].forEach((ref) => assert.ok(firstStage.stage_contract.requires.includes(ref), ref));
    assert.ok(firstStage.stage_contract.expected_receipt_refs.some((entry: JsonObject) =>
      entry.ref === sourceDerivedObjectRefs.buildReceiptRef
    ));
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
      expected_build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assertRefFields(stageAttemptInput.reference_design_input_policy as JsonObject, {
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      expected_build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    [
      'Profile selection mode: source_derived_design',
      sourceDerivedObjectRefs.referenceDesignPacketRef,
      sourceDerivedObjectRefs.transferMapRef,
      sourceDerivedObjectRefs.agentPackPlanRef,
      sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    ].forEach((text) => assert.ok(primarySkill.includes(text), text));
    assert.ok(generatedPrompt.includes('ReferenceDesignPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt'));
    assert.ok(generatedPrompt.includes(sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0]));
  });
});

test('build-agent-baseline materializes a research-driven target package from vague idea inputs', () => {
  withTempDir('oma-bootstrap-research-driven-', (outputRoot) => {
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
    const workOrder = readJson(path.join(outputRoot, 'foundry-lab-work-order.json'));
    const suite = readJson(path.join(outputRoot, 'agent-lab-suite-seed.json'));
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, stageControl.stages[0].prompt_refs[0].ref), 'utf8');

    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.opl_profile_conformance.status, 'not_applicable');
    assertBuildAgentBaselineOutputSchema(payload);
    assert.equal(payload.artifacts.agent_build_receipt_ref, researchDrivenObjectRefs.buildReceiptRef);
    [descriptor, capabilityMap, stageControl].forEach((surface) => {
      assert.equal(surface.profile_selection_mode, 'research_driven_design');
      assert.equal(surface.research_driven_design_receipt.route_ref, 'opl-profile-route:research_driven_design_profile_route.v1');
    });
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.deepEqual(descriptor.research_source_refs, researchDrivenTargetAgent.research_source_refs);
    assert.deepEqual(descriptor.expert_practice_notes, researchDrivenTargetAgent.expert_practice_notes);
    assert.deepEqual(descriptor.research_synthesis_refs, researchDrivenTargetAgent.research_synthesis_refs);
    [descriptor, capabilityMap].forEach((surface) => assertRefFields(surface, researchDrivenCoreRefs));
    assert.deepEqual(descriptor.build_receipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.equal(descriptor.build_receipt.build_source_kind, 'research_driven_design');
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
    assertRefFields(stageControl, {
      research_synthesis_packet_ref: researchDrivenObjectRefs.researchSynthesisPacketRef,
      design_admission_receipt_ref: researchDrivenObjectRefs.designAdmissionReceiptRef,
      stage_decomposition_subpacket_set_ref: researchDrivenObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assert.deepEqual(stageControl.build_receipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.equal(stageControl.stages.length, 4);
    assert.deepEqual(stageControl.stages.flatMap((stage: JsonObject) => stage.stage_pattern_source_refs), [
      researchDrivenTargetAgent.research_synthesis_refs[0],
      researchDrivenObjectRefs.expertPracticeNoteRef,
      researchDrivenObjectRefs.researchSourcePatternRef,
    ]);
    const firstStage = stageControl.stages[0] as JsonObject;
    assertStageInput(firstStage, 'research_synthesis_packet_ref', researchDrivenObjectRefs.researchSynthesisPacketRef);
    [
      `research-synthesis-packet-ref:${researchDrivenObjectRefs.researchSynthesisPacketRef}`,
      `design-admission-receipt-ref:${researchDrivenObjectRefs.designAdmissionReceiptRef}`,
      `stage-decomposition-subpacket-set-ref:${researchDrivenObjectRefs.stageDecompositionSubpacketSetRef}`,
    ].forEach((ref) => assert.ok(firstStage.stage_contract.requires.includes(ref), ref));
    assert.deepEqual(
      workOrder.source_refs.includes(researchDrivenTargetAgent.research_source_refs[0]),
      true,
    );
    assert.ok(suite.tasks[0].scorecard_spec.evidence_refs.includes(researchDrivenTargetAgent.research_source_refs[0]));
    assert.ok(suite.tasks[0].scorecard_spec.evidence_refs.includes(researchDrivenTargetAgent.research_synthesis_refs[0]));
    assert.ok(primarySkill.includes('Profile selection mode: research_driven_design'));
    assert.ok(primarySkill.includes('Selected profile ref: none; research-driven design refs are the active design input.'));
    assert.ok(primarySkill.includes(researchDrivenObjectRefs.researchSynthesisPacketRef));
    assert.ok(primarySkill.includes(researchDrivenObjectRefs.stageDecompositionSubpacketSetRef));
    assert.ok(generatedPrompt.includes('ResearchSynthesisPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt'));
    assert.ok(generatedPrompt.includes(researchDrivenTargetAgent.research_synthesis_refs[0]));
    assert.equal(payload.target_agent.selected_opl_profile_refs, undefined);
  });
});

test('expert workflow seeds produce different workflow-step stage graphs for the same target goal', () => {
  const targetGoal = {
    domain_id: 'same-goal-agent',
    target_brief: 'Create an owner-gated expert analysis agent for the same target goal.',
  };
  const casePlan = buildAgentPackPlan({
    ...targetGoal,
    reference_design_pattern_packet_refs: [
      'expert-workflow-pattern:oma/case-grounded-expert-decision-workflow.v1',
    ],
  });
  const rcaPlan = buildAgentPackPlan({
    ...targetGoal,
    reference_design_pattern_packet_refs: [
      'expert-workflow-pattern:oma/incident-rca-postmortem-workflow.v1',
    ],
  });

  assert.ok(casePlan);
  assert.ok(rcaPlan);
  const stageIds = (plan: JsonObject) => (plan.planned_stage_refs as JsonObject[])
    .filter((stage) => stage.origin === 'source_pattern_ref')
    .map((stage) => stage.stage_id);
  assert.notDeepEqual(stageIds(casePlan), stageIds(rcaPlan));
  assert.ok(stageIds(casePlan).some((stageId) => String(stageId).includes('case-material-intake')));
  assert.ok(stageIds(rcaPlan).some((stageId) => String(stageId).includes('timeline-and-impact-reconstruction')));
});

test('build-agent-baseline consumes raw OPL receipts for a Chinese hybrid intent', () => {
  const chineseIntent = '参考这篇论文的设计思路，构建一个肠癌手术风险决策支持智能体。';
  const intentSignals = ['risk', 'guideline'];
  const builtinProfileRef = 'opl-profile:evidence_grounded_decision_agent_profile.v1';
  const sourceRouteRef = 'opl-profile-route:source_derived_design_profile_route.v1';
  const selectorArgs = [
    'profiles',
    'select',
    '--intent',
    chineseIntent,
    '--reference-source',
    sourceDerivedTargetAgent.reference_design_source_refs[0],
    '--pattern-packet',
    sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0],
  ];
  const readSelectorReceipt = (signalArgs: string[]): JsonObject => {
    const result = spawnSync(oplBin, [...selectorArgs, ...signalArgs, '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout) as JsonObject;
    assert.ok(payload.profile_selection_receipt);
    return payload.profile_selection_receipt as JsonObject;
  };

  const hybridReceipt = readSelectorReceipt([
    '--intent-signal',
    intentSignals[0],
    '--intent-signal',
    intentSignals[1],
  ]);
  assert.equal(hybridReceipt.profile_selection_mode, 'hybrid');
  assert.deepEqual(hybridReceipt.selected_profile_refs, [builtinProfileRef, sourceRouteRef]);
  assert.deepEqual(
    [...hybridReceipt.matched_trigger_signals].sort(),
    [...intentSignals].sort(),
  );
  assert.deepEqual(hybridReceipt.intent_signals, intentSignals);

  const sourceDerivedReceipt = readSelectorReceipt([]);
  assert.equal(sourceDerivedReceipt.profile_selection_mode, 'source_derived_design');
  assert.deepEqual(sourceDerivedReceipt.selected_profile_refs, [sourceRouteRef]);
  assert.deepEqual(sourceDerivedReceipt.matched_trigger_signals, []);
  assert.deepEqual(sourceDerivedReceipt.intent_signals, []);

  const parsed = parseBuildAgentBaselineArgs([
    '--output-dir',
    '/tmp/oma-intent-signal-standard-boundary',
    '--opl-bin',
    oplBin,
    '--ai-reviewer-evaluation',
    '/tmp/reviewer.json',
    '--domain-id',
    sourceDerivedTargetAgent.domain_id,
    '--domain-label',
    sourceDerivedTargetAgent.domain_label,
    '--delivery-domain',
    sourceDerivedTargetAgent.delivery_domain,
    '--target-brief',
    chineseIntent,
    '--intent-signal',
    intentSignals[0],
    '--intent-signal',
    intentSignals[1],
    '--reference-design-source',
    sourceDerivedTargetAgent.reference_design_source_refs[0],
    '--reference-design-pattern',
    sourceDerivedTargetAgent.reference_design_pattern_notes[0],
    '--reference-design-pattern-packet',
    sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0],
  ]);

  assert.equal(parsed.targetAgent.target_brief, chineseIntent);
  assert.deepEqual(parsed.targetAgent.intent_signals, intentSignals);
  const selected = resolveTargetAgentProfileSelection(parsed.targetAgent, parsed.oplBin);

  assert.equal(selected.target_brief, chineseIntent);
  assert.deepEqual(selected.intent_signals, intentSignals);
  assert.deepEqual(selected.selected_opl_profile_refs, [builtinProfileRef]);
  assert.deepEqual(selected.reference_design_source_refs, sourceDerivedTargetAgent.reference_design_source_refs);
});

test('OMA canonicalizes and validates explicit builtin profile refs', () => {
  const selected = resolveTargetAgentProfileSelection({
    ...targetAgent,
    selected_opl_profile_refs: ['evidence_grounded_decision_agent_profile.v1'],
  }, oplBin);
  assert.deepEqual(selected.selected_opl_profile_refs, [
    'opl-profile:evidence_grounded_decision_agent_profile.v1',
  ]);
  assert.throws(
    () => resolveTargetAgentProfileSelection({
      ...targetAgent,
      selected_opl_profile_refs: ['unknown_profile.v1'],
    }, oplBin),
    /unknown or unavailable/i,
  );
});

test('canonical OPL refs-only pattern packet produces its own stable workflow stages', () => {
  const packet = buildReferenceDesignPacket(sourceDerivedTargetAgent);
  const plan = buildAgentPackPlan(sourceDerivedTargetAgent);

  assert.ok(packet);
  assert.ok(plan);
  assert.deepEqual(
    packet.transferable_design_patterns[0].transferable_workflow_steps.map((step: JsonObject) => step.step_id),
    ['risk-case-intake', 'model-evidence-review', 'risk-interpretation', 'owner-handoff-gate'],
  );
  assert.deepEqual(
    (plan.planned_stage_refs as JsonObject[])
      .filter((stage) => stage.origin === 'source_pattern_ref')
      .map((stage) => stage.stage_id),
    [
      'reference-design-pattern-packet-surgical-risk-fixture-v1-risk-case-intake',
      'reference-design-pattern-packet-surgical-risk-fixture-v1-model-evidence-review',
      'reference-design-pattern-packet-surgical-risk-fixture-v1-risk-interpretation',
      'reference-design-pattern-packet-surgical-risk-fixture-v1-owner-handoff-gate',
    ],
  );
});

test('user typed packet remains design origin when a seed is also supplied', () => {
  const target = {
    ...sourceDerivedTargetAgent,
    reference_design_pattern_packet_refs: [
      canonicalOplPatternPacketPath,
      'expert-workflow-pattern:oma/case-grounded-expert-decision-workflow.v1',
    ],
  };
  const packet = buildReferenceDesignPacket(target);
  const plan = buildAgentPackPlan(target);

  assert.ok(packet);
  assert.ok(plan);
  assert.equal(packet.design_origin.origin_kind, 'user_supplied_reference_design');
  assert.deepEqual(packet.design_origin.primary_pattern_refs, [sourceDerivedObjectRefs.sourcePatternRef]);
  assert.deepEqual(packet.design_origin.secondary_seed_pattern_refs, [
    'expert-workflow-pattern:oma/case-grounded-expert-decision-workflow.v1',
  ]);
  assert.ok(packet.pattern_dispositions.some((entry: JsonObject) =>
    entry.pattern_ref === sourceDerivedObjectRefs.sourcePatternRef
    && entry.pattern_origin === 'user_typed_pattern_packet'
    && entry.disposition === 'adopt'
  ));
  assert.ok(packet.pattern_dispositions.some((entry: JsonObject) =>
    entry.pattern_ref === 'expert-workflow-pattern:oma/case-grounded-expert-decision-workflow.v1'
    && entry.pattern_origin === 'oma_seed_library'
    && entry.disposition === 'adapt'
  ));
  assert.ok(packet.pattern_dispositions.some((entry: JsonObject) => entry.disposition === 'reject'));
  assert.deepEqual(
    packet.transferable_design_patterns.map((pattern: JsonObject) => pattern.pattern_origin),
    ['user_typed_pattern_packet'],
  );
  assert.equal(
    (plan.planned_stage_refs as JsonObject[]).some((stage) =>
      String(stage.source_pattern_ref).includes('case-grounded-expert-decision-workflow')
    ),
    false,
  );
});

test('every declared reference source requires its own typed pattern packet', () => {
  assert.throws(
    () => buildReferenceDesignPacket({
      ...sourceDerivedTargetAgent,
      reference_design_source_refs: [
        canonicalOplSourceMaterialRef,
        'source-material:sha256:unextracted-secondary-source',
      ],
    }),
    /reference_sources_missing_typed_pattern_packets.*unextracted-secondary-source/,
  );
});

test('local semantic pointers reject absolute paths and URIs', () => {
  withTempDir('oma-reference-pointer-absolute-', (dir) => {
    const absolutePacketPath = writeReferenceDesignPacketFixture(dir, (packet, notesPath) => {
      packet.pattern_summary_ref = `${notesPath}#/summary`;
    });
    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(absolutePacketPath)),
      /pattern_summary_ref_(?:relative_path_required|local_path_required)/,
    );

    const uriPacketPath = writeReferenceDesignPacketFixture(path.join(dir, 'uri'), (packet, notesPath) => {
      packet.pattern_summary_ref = `${new URL(`file://${notesPath}`).href}#/summary`;
    });
    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(uriPacketPath)),
      /pattern_summary_ref_local_path_required/,
    );
  });
});

test('local semantic pointers reject traversal outside the packet directory', () => {
  withTempDir('oma-reference-pointer-traversal-', (dir) => {
    const packetDir = path.join(dir, 'packet');
    const outsidePath = path.join(dir, 'outside-notes.json');
    writeJson(outsidePath, readJson(path.join(repoRoot, 'tests/fixtures/opl-reference-design-pattern-notes.json')));
    const packetPath = writeReferenceDesignPacketFixture(packetDir, (packet) => {
      packet.pattern_summary_ref = '../outside-notes.json#/summary';
    });

    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(packetPath)),
      /pattern_summary_ref_(?:path_traversal_forbidden|path_outside_packet_directory)/,
    );
  });
});

test('local semantic pointers reject file symlink escape', () => {
  withTempDir('oma-reference-pointer-file-symlink-', (dir) => {
    const packetDir = path.join(dir, 'packet');
    const outsidePath = path.join(dir, 'outside-notes.json');
    writeJson(outsidePath, readJson(path.join(repoRoot, 'tests/fixtures/opl-reference-design-pattern-notes.json')));
    const packetPath = writeReferenceDesignPacketFixture(packetDir, (packet) => {
      packet.pattern_summary_ref = 'linked-notes.json#/summary';
    });
    fs.symlinkSync(outsidePath, path.join(packetDir, 'linked-notes.json'));

    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(packetPath)),
      /pattern_summary_ref_real_path_outside_packet_directory/,
    );
  });
});

test('local semantic pointers reject directory symlink escape', () => {
  withTempDir('oma-reference-pointer-dir-symlink-', (dir) => {
    const packetDir = path.join(dir, 'packet');
    const outsideDir = path.join(dir, 'outside');
    const outsidePath = path.join(outsideDir, 'pattern-notes.json');
    writeJson(outsidePath, readJson(path.join(repoRoot, 'tests/fixtures/opl-reference-design-pattern-notes.json')));
    const packetPath = writeReferenceDesignPacketFixture(packetDir, (packet) => {
      packet.pattern_summary_ref = 'linked/pattern-notes.json#/summary';
    });
    fs.symlinkSync(outsideDir, path.join(packetDir, 'linked'));

    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(packetPath)),
      /pattern_summary_ref_real_path_outside_packet_directory/,
    );
  });
});

test('semantic anchors and source fingerprint stay bound to the OPL envelope', () => {
  withTempDir('oma-reference-anchor-boundary-', (dir) => {
    const badAnchorPacketPath = writeReferenceDesignPacketFixture(
      path.join(dir, 'anchor'),
      undefined,
      (notes) => {
        (notes.patterns as JsonObject[])[0].source_anchor_refs = ['unrelated-source:other-paper#L1-L2'];
      },
    );
    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(badAnchorPacketPath)),
      /semantic_anchor_outside_envelope_namespace/,
    );

    const badFingerprintPacketPath = writeReferenceDesignPacketFixture(
      path.join(dir, 'fingerprint'),
      (packet) => {
        packet.source_fingerprint_ref = 'sha256:different-source';
      },
    );
    assert.throws(
      () => buildReferenceDesignPacket(packetTarget(badFingerprintPacketPath)),
      /source_fingerprint_ref_mismatch/,
    );
  });
});

test('primary reference design remains the only required design basis when research context is also supplied', () => {
  const hybridTarget = {
    ...sourceDerivedTargetAgent,
    research_source_refs: researchDrivenTargetAgent.research_source_refs,
    expert_practice_notes: researchDrivenTargetAgent.expert_practice_notes,
    research_synthesis_refs: researchDrivenTargetAgent.research_synthesis_refs,
  };
  const referencePacket = buildReferenceDesignPacket(hybridTarget);
  const researchPacket = buildResearchSynthesisPacket(hybridTarget);
  const transferMap = buildTransferMap(hybridTarget);
  const plan = buildAgentPackPlan(hybridTarget);
  const admission = buildDesignAdmissionReceipt(hybridTarget);

  assert.ok(referencePacket);
  assert.ok(researchPacket);
  assert.ok(transferMap);
  assert.ok(plan);
  assert.ok(admission);
  assert.equal(transferMap.design_basis_kind, 'source_derived_design');
  assert.equal(plan.design_basis_kind, 'source_derived_design');
  assert.deepEqual(admission.required_design_objects, sourceDerivedRequiredDesignObjects);
  assert.deepEqual(
    (plan.planned_stage_refs as JsonObject[])
      .filter((stage) => stage.origin === 'source_pattern_ref')
      .map((stage) => stage.source_pattern_ref),
    (referencePacket.transferable_design_patterns as JsonObject[]).flatMap((pattern) =>
      (pattern.transferable_workflow_steps as JsonObject[]).map(() => pattern.source_pattern_ref)
    ),
  );
});

test('every planned stage and non-reject TransferMap target is materialized exactly once', () => {
  const plan = buildAgentPackPlan(sourceDerivedTargetAgent);
  const transferMap = buildTransferMap(sourceDerivedTargetAgent);
  const closeout = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = closeout.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  const nativeBundle = draft.stage_native_artifact_contract as JsonObject;
  assert.ok(plan);
  assert.ok(transferMap);

  const plannedStages = plan.planned_stage_refs as JsonObject[];
  const materializedStages = stageControl.stages as JsonObject[];
  assert.deepEqual(
    materializedStages.map((stage) => stage.stage_id),
    plannedStages.map((stage) => stage.stage_id),
  );
  assert.deepEqual(
    (nativeBundle.contracts as JsonObject[]).map((contract) => contract.stage_id),
    plannedStages.map((stage) => stage.stage_id),
  );
  assert.deepEqual(
    [...new Set((transferMap.mappings as JsonObject[])
      .filter((mapping) => mapping.disposition !== 'reject')
      .map((mapping) => mapping.target_stage_or_capability_slot))],
    plannedStages.map((stage) => stage.stage_ref),
  );
  const files = new Set((draft.files as JsonObject[]).map((file) => file.path));
  plannedStages.forEach((stage) => {
    assert.ok(files.has(stage.prompt_ref));
    assert.ok(files.has(stage.stage_path));
    assert.ok(files.has(stage.skill_ref));
    assert.ok((stage.knowledge_refs as string[]).every((ref) => files.has(ref)));
    assert.ok((stage.quality_gate_refs as string[]).every((ref) => files.has(ref)));
  });
});

test('pre-materialization packets carry only the expected AgentBuildReceipt ref', () => {
  withTempDir('oma-build-receipt-pre-materialization-', (dir) => {
    const closeoutPath = path.join(dir, 'closeout.json');
    writeStageCloseout(closeoutPath, sourceDerivedTargetAgent);
    const attempt = runStageDecompositionAttempt({
      targetAgent: sourceDerivedTargetAgent,
      outputDir: dir,
      targetAgentDir: path.join(dir, sourceDerivedTargetAgent.domain_id),
      oplBin,
      runnerKind: 'fixture',
      closeoutPacketPath: closeoutPath,
    });
    const stageInput = readJson(path.join(dir, 'stage-decomposition-attempt-input.json'));
    const draft = attempt.closeoutPacket.stage_decomposition_pack_draft as JsonObject;
    const policy = stageInput.profile_selection_input_policy as JsonObject;
    const referencePolicy = stageInput.reference_design_input_policy as JsonObject;
    const stageControl = draft.stage_control_plane as JsonObject;

    [policy, referencePolicy, stageControl, ...(stageControl.stages as JsonObject[])].forEach((surface) => {
      assert.equal(Object.hasOwn(surface, 'build_receipt'), false);
      assert.equal(surface.expected_build_receipt_ref, sourceDerivedObjectRefs.buildReceiptRef);
    });
  });
});

test('raw reference source and opaque packet fail closed with a typed blocker', () => {
  withTempDir('oma-bootstrap-raw-reference-design-', (outputRoot) => {
    const rawTargetAgent: BaselineFixtureTargetAgent = {
      domain_id: 'raw-reference-design-agent',
      domain_label: 'Raw Reference Design Agent',
      delivery_domain: 'knowledge_delivery',
      target_brief: 'Create an owner-gated agent from an unextracted raw source.',
      reference_design_source_refs: ['paper-ref:raw-unextracted-source'],
      reference_design_pattern_notes: ['opaque summary without typed steps or source anchors'],
      reference_design_pattern_packet_refs: ['packet-ref:opaque-unresolved-pattern'],
    };
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeReviewerEvaluation(reviewerPath, {}, rawTargetAgent.domain_id);

    assert.throws(
      () => runBuildAgentBaseline({
        outputDir: outputRoot,
        oplBin,
        aiReviewerEvaluationPath: reviewerPath,
        targetAgent: rawTargetAgent,
        stageRunner: 'fixture',
        stageCloseoutPacketPath: null,
      }),
      /typed blocker written/i,
    );
    const blocker = readJson(path.join(
      outputRoot,
      `${rawTargetAgent.domain_id}-stage-decomposition-blocker.json`,
    ));
    assert.equal(blocker.blocked_reason, 'reference_design_resolution_failed');
    assert.match(blocker.blocker_message, /opaque_pattern_packet_unresolved/);
    assert.equal(blocker.route_impact.materialization_allowed, false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'profile-selection.json')), false);
  });
});

test('build-agent-baseline fails closed without independent reviewer evidence', () => {
  withTempDir('oma-bootstrap-missing-reviewer-pass4-', (outputRoot) => {
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
    assert.equal(fs.existsSync(path.join(outputRoot, 'foundry-lab-work-order.json')), false);
  });
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

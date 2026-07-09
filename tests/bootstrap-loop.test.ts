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
  buildReceiptRef: 'build-receipt-ref:opl-meta-agent/surgery-risk-from-paper-agent',
  patternNoteRef: 'reference-design-pattern-note:surgery-risk-from-paper-agent/1',
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

test('build-agent-baseline materializes an explicit target package and owner-gated receipt', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oma-bootstrap-pass4-'));
  try {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    const closeoutPath = path.join(outputRoot, 'stage-closeout.json');
    writeReviewerEvaluation(reviewerPath);
    writeStageCloseout(closeoutPath);

    const payload = runBuildAgentBaseline(parseBuildAgentBaselineArgs([
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
      targetAgent.domain_id,
      '--domain-label',
      targetAgent.domain_label,
      '--delivery-domain',
      targetAgent.delivery_domain,
      '--target-brief',
      targetAgent.target_brief,
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
    ]));

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
    assert.equal(fs.existsSync(path.join(targetDir, 'agent/primary_skill/SKILL.md')), true);
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

    const payload = runBuildAgentBaseline(parseBuildAgentBaselineArgs([
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
      sourceDerivedTargetAgent.domain_id,
      '--domain-label',
      sourceDerivedTargetAgent.domain_label,
      '--delivery-domain',
      sourceDerivedTargetAgent.delivery_domain,
      '--target-brief',
      sourceDerivedTargetAgent.target_brief,
      '--reference-design-source',
      sourceDerivedTargetAgent.reference_design_source_refs[0],
      '--reference-design-pattern',
      sourceDerivedTargetAgent.reference_design_pattern_notes[0],
      '--reference-design-pattern-packet',
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0],
    ]));

    const targetDir = path.join(outputRoot, sourceDerivedTargetAgent.domain_id);
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, 'agent/prompts/agent-output-draft.md'), 'utf8');

    assert.equal(payload.status, 'passed');
    assert.equal(descriptor.profile_selection_mode, 'source_derived_design');
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.equal(
      descriptor.source_derived_design_receipt.route_ref,
      'opl-profile-route:source_derived_design_profile_route.v1',
    );
    assert.equal(
      descriptor.reference_design_packet_ref,
      sourceDerivedObjectRefs.referenceDesignPacketRef,
    );
    assert.equal(descriptor.transfer_map_ref, sourceDerivedObjectRefs.transferMapRef);
    assert.equal(descriptor.agent_pack_plan_ref, sourceDerivedObjectRefs.agentPackPlanRef);
    assert.equal(descriptor.build_receipt_ref, sourceDerivedObjectRefs.buildReceiptRef);
    assert.deepEqual(
      descriptor.build_receipt.required_machine_objects,
      ['ReferenceDesignPacket', 'TransferMap', 'AgentPackPlan', 'BuildReceipt'],
    );
    assert.ok(
      descriptor.build_receipt.forbidden_claims.includes('runtime_live_promoted'),
    );
    assert.deepEqual(
      descriptor.source_derived_design_receipt.reference_design_pattern_packet_refs,
      sourceDerivedTargetAgent.reference_design_pattern_packet_refs,
    );
    assert.deepEqual(
      descriptor.source_derived_design_receipt.required_machine_objects,
      ['ReferenceDesignPacket', 'TransferMap', 'AgentPackPlan', 'BuildReceipt'],
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
    assert.equal(capabilityMap.reference_design_packet_ref, sourceDerivedObjectRefs.referenceDesignPacketRef);
    assert.deepEqual(capabilityMap.reference_design_packet_refs, [sourceDerivedObjectRefs.referenceDesignPacketRef]);
    assert.equal(capabilityMap.transfer_map_ref, sourceDerivedObjectRefs.transferMapRef);
    assert.deepEqual(capabilityMap.transfer_map_refs, [sourceDerivedObjectRefs.transferMapRef]);
    assert.equal(capabilityMap.agent_pack_plan_ref, sourceDerivedObjectRefs.agentPackPlanRef);
    assert.deepEqual(capabilityMap.agent_pack_plan_refs, [sourceDerivedObjectRefs.agentPackPlanRef]);
    assert.equal(capabilityMap.build_receipt_ref, sourceDerivedObjectRefs.buildReceiptRef);
    assert.deepEqual(capabilityMap.build_receipt_refs, [sourceDerivedObjectRefs.buildReceiptRef]);
    assert.equal(
      capabilityMap.profile_selection_receipt.reference_design_packet_ref,
      sourceDerivedObjectRefs.referenceDesignPacketRef,
    );
    assert.equal(capabilityMap.profile_selection_receipt.transfer_map_ref, sourceDerivedObjectRefs.transferMapRef);
    assert.equal(capabilityMap.profile_selection_receipt.agent_pack_plan_ref, sourceDerivedObjectRefs.agentPackPlanRef);
    assert.equal(capabilityMap.profile_selection_receipt.build_receipt_ref, sourceDerivedObjectRefs.buildReceiptRef);
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
    assert.equal(stageControl.reference_design_packet_ref, sourceDerivedObjectRefs.referenceDesignPacketRef);
    assert.equal(stageControl.transfer_map_ref, sourceDerivedObjectRefs.transferMapRef);
    assert.equal(stageControl.agent_pack_plan_ref, sourceDerivedObjectRefs.agentPackPlanRef);
    assert.equal(stageControl.build_receipt_ref, sourceDerivedObjectRefs.buildReceiptRef);
    assert.equal(stageControl.build_receipt.build_source_kind, 'source_derived_design');
    assert.deepEqual(stageControl.build_receipt.target_only_requirement_refs, [
      'target-only-requirement:surgery-risk-from-paper-agent/owner-gated-closeout',
    ]);
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
    assert.ok(
      stageControl.stages[0].inputs.some((entry: JsonObject) =>
        entry.ref_kind === 'reference_design_packet_ref'
        && entry.ref === sourceDerivedObjectRefs.referenceDesignPacketRef
      ),
    );
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
        `build-receipt-ref:${sourceDerivedObjectRefs.buildReceiptRef}`,
      ),
    );
    assert.ok(
      stageControl.stages[0].stage_contract.expected_receipt_refs.some((entry: JsonObject) =>
        entry.ref === sourceDerivedObjectRefs.buildReceiptRef
      ),
    );
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
    assert.ok(generatedPrompt.includes('ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> BuildReceipt'));
    assert.ok(generatedPrompt.includes(sourceDerivedTargetAgent.reference_design_pattern_packet_refs[0]));
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

test('build-agent-baseline fails closed when neither builtin profile nor source-derived design refs exist', () => {
  assert.throws(
    () => parseBuildAgentBaselineArgs([
      '--ai-reviewer-evaluation',
      '/tmp/reviewer.json',
      '--domain-id',
      'unrouted-agent',
      '--target-brief',
      'Create an OPL-compatible fixture agent.',
    ]),
    /selected-opl-profile.*source-derived design refs/i,
  );
});

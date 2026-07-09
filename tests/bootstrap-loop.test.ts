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

function writeReviewerEvaluation(filePath: string, overrides: JsonObject = {}): void {
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
    source_refs: ['review-ref:oma/pass4', ...morphologyRefs(targetAgent.domain_id)],
    direct_evidence_refs: ['artifact-ref:research-workbench-agent/package', ...morphologyRefs(targetAgent.domain_id)],
    verdict: 'baseline_ready_with_owner_gate',
    predicted_impact: 'Owner-gated target baseline remains auditable without OPL target truth authority.',
    provenance: { artifact_ref: 'artifact-ref:oma/pass4-review', created_by: 'test-fixture' },
    ...overrides,
  });
}

function writeStageCloseout(filePath: string): void {
  writeJson(filePath, buildFixtureStageDecompositionCloseout({ targetAgent }));
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
        'opl profiles inspect evidence_grounded_decision_agent_profile.v1 --json',
      ),
    );
    assert.equal(
      JSON.stringify(capabilityMap.profile_selection_receipt).includes('opl foundry evidence-profile'),
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
    assert.equal(receipt.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(receipt.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.ok(primarySkill.includes(targetAgent.reference_design_pattern_packet_refs[0]));
    assert.equal(fs.existsSync(path.join(targetDir, 'agent/primary_skill/SKILL.md')), true);
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

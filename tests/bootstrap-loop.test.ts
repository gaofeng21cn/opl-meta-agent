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
    ]));

    const targetDir = path.join(outputRoot, targetAgent.domain_id);
    const receipt = readJson(path.join(outputRoot, 'baseline-delivery-receipt.json'));
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const stageControl = readJson(path.join(targetDir, 'contracts/stage_control_plane.json'));
    assert.equal(payload.status, 'passed');
    assert.equal(descriptor.domain_id, targetAgent.domain_id);
    assert.equal(stageControl.stages[0].selected_executor.executor_kind, 'codex_cli');
    assert.equal(receipt.status, 'baseline_delivered');
    assert.equal(receipt.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(receipt.authority_boundary.can_authorize_target_domain_quality_or_export, false);
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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  parseJsonText,
  repoRoot,
  oplBin,
  readJsonFile as readJson,
  writeJsonFile as writeJson,
} from './support/contracts.ts';
import test from 'node:test';
import {
  runImproveArgs,
  writeAiReviewerEvaluation,
  buildBlockedMedicalManuscriptSuite,
  writeMedicalTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

function spawnImprove(args: {
  suitePath: string;
  targetAgentDir: string;
  outputRoot: string;
  reviewerEvaluationPath?: string;
}) {
  return spawnSync(
    process.execPath,
    [
      path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
      '--suite',
      args.suitePath,
      '--target-agent-dir',
      args.targetAgentDir,
      '--output-dir',
      args.outputRoot,
      ...(args.reviewerEvaluationPath ? ['--ai-reviewer-evaluation', args.reviewerEvaluationPath] : []),
      '--opl-bin',
      oplBin,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  );
}

test('external suite improvement fails closed when AI reviewer evaluation is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-reviewer-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));

    const result = spawnImprove({ suitePath, targetAgentDir, outputRoot });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ai reviewer evaluation/i);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement fails closed when target descriptor is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-descriptor-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    fs.mkdirSync(targetAgentDir, { recursive: true });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const result = spawnImprove({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Target descriptor is required: .*contracts\/domain_descriptor\.json.*contracts\/capability_pack_descriptor\.json/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement fails closed when target descriptor domain_id is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-domain-id-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const result = spawnImprove({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Target agent descriptor is missing domain_id or capability_pack_id: .*contracts\/domain_descriptor\.json/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement accepts capability pack target descriptor', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-capability-pack-target-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'mas-scholar-skills');
    writeJson(path.join(targetAgentDir, 'contracts/capability_pack_descriptor.json'), {
      surface_kind: 'capability_pack_descriptor',
      capability_pack_id: 'mas-scholar-skills',
      capability_pack_label: 'MAS Scholar Skills',
    });
    writeJson(path.join(targetAgentDir, 'contracts/capability_map.json'), {
      surface_kind: 'target_capability_map',
      capabilities: [
        {
          capability_id: 'medical-manuscript-writing',
          kind: 'professional_skill',
          canonical_paths: ['skills/medical-manuscript-writing/SKILL.md'],
          improvement_tokens: ['medical_journal_prose_quality'],
          verification_refs: ['target_repo_test_receipt'],
          forbidden_surfaces: ['target owner receipt body'],
        },
      ],
    });
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      critique: 'The medical_journal_prose_quality gap belongs in the writing capability pack.',
      source_refs: ['rubric-gap:medical_journal_prose_quality'],
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'manual-review:capability-pack/medical-writing',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);

    const workOrder = payload.learning_loop.developer_patch_work_order;
    assert.equal(workOrder.target_agent.domain_id, 'mas-scholar-skills');
    assert.ok(workOrder.proposed_change_refs.includes('professional_skill_medical_manuscript_writing'));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement uses capability map as patch-target source when handoff duplicates token refs', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-capability-map-source-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
      surface_kind: 'domain_agent_lab_production_evidence_handoff',
      domain_id: 'med-autoscience',
      owner: 'MedAutoScience',
      handoff_status: 'ready_for_opl_meta_agent_and_agent_lab_execution',
      external_suite_improvement_policy: {
        default_change_ref_triggers: ['medical_journal_prose_quality'],
        default_change_refs: ['legacy_handoff_patch_ref:must_not_be_used'],
        change_ref_mappings: [
          {
            token: 'medical_journal_prose_quality',
            refs: ['legacy_handoff_patch_ref:must_not_be_used'],
          },
        ],
        patch_surface_hints: {
          legacy_handoff_patch_ref: ['legacy/handoff/path.ts'],
        },
        external_learning_refs: ['external-source:legacy-handoff/context-only'],
        runtime_required_surface_refs: ['target_agent_owner_route'],
      },
    });
    writeJson(path.join(targetAgentDir, 'contracts/capability_map.json'), {
      surface_kind: 'target_capability_map',
      capabilities: [
        {
          capability_id: 'medical-journal-prose-quality',
          kind: 'professional_skill',
          failure_token_registry_ref: 'failure-token-registry:mas/medical-journal-prose-quality',
          canonical_paths: ['skills/medical-journal-prose-quality/SKILL.md'],
          improvement_tokens: ['medical_journal_prose_quality'],
          verification_refs: ['target_repo_test_receipt'],
          forbidden_surfaces: ['target owner receipt body'],
          authority_boundary: {
            can_write_target_owner_receipt_body: false,
          },
        },
      ],
    });
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      critique: 'The medical_journal_prose_quality gap belongs to the target capability map.',
      source_refs: ['rubric-gap:mas/002/medical_journal_prose_quality'],
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'manual-review:capability-map-source-of-truth',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);

    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.deepEqual(candidate.proposed_change_refs, ['professional_skill_medical_journal_prose_quality']);
    assert.equal(candidate.proposed_change_refs.includes('legacy_handoff_patch_ref:must_not_be_used'), false);
    assert.ok(candidate.external_learning_refs.includes('external-source:legacy-handoff/context-only'));
    const trace = candidate.patch_traceability_matrix[0];
    assert.deepEqual(trace.required_patch_refs, ['professional_skill_medical_journal_prose_quality']);
    assert.deepEqual(trace.target_repo_file_hints, ['skills/medical-journal-prose-quality/SKILL.md']);
    assert.equal(trace.capability_authority_boundary.can_write_target_owner_receipt_body, false);

    const workOrder = readJson(path.join(outputRoot, 'developer-patch-work-order.json'));
    assert.equal(workOrder.proposed_change_refs.includes('legacy_handoff_patch_ref:must_not_be_used'), false);
    assert.deepEqual(workOrder.target_repo_file_hints, ['skills/medical-journal-prose-quality/SKILL.md']);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement fails closed when AI reviewer predicted impact is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-impact-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, { predicted_impact: '' });

    const result = spawnImprove({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /predicted_impact must be a non-empty string/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement fails closed when reviewer direct evidence is scaffold-only', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-scaffold-reviewer-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      direct_evidence_refs: ['suite:mas/002/generated-scaffold'],
    });

    const result = spawnImprove({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /direct_evidence_refs must include direct evidence beyond suite\/scaffold refs/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external blocked suite writes typed blocker when target-owned improvement policy is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-target-policy-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      critique: 'The owner-receipt package typed-blocker language is generic and has no target-owned patch target.',
      suggestions: ['Do not synthesize a package patch target without a capability_map or target-owned policy.'],
      source_refs: [
        'owner-receipt:external-agent/live-acceptance',
        'typed-blocker:external-agent/package-closeout',
      ],
      direct_evidence_refs: ['agent-lab-result:external-agent/generic-owner-boundary'],
    });

    const result = spawnImprove({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });

    assert.equal(result.status, 0);
    const payload = parseJsonText(result.stdout);
    assert.equal(payload.status, 'blocked_target_improvement_policy_missing');
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'typed-blocker.json')), true);

    const candidate = readJson(path.join(outputRoot, 'target-capability-improvement-candidate.json'));
    assert.deepEqual(candidate.proposed_change_refs, []);
    assert.deepEqual(candidate.patch_traceability_matrix, []);
    assert.equal(candidate.traceability_status, 'target_owned_patch_refs_missing');
    assert.equal(
      candidate.target_editable_surface_refs.some((ref: string) => ref.startsWith('target_agent_')),
      false,
    );

    const blocker = readJson(path.join(outputRoot, 'typed-blocker.json'));
    assert.equal(blocker.status, 'blocked_target_improvement_policy_missing');
    assert.equal(blocker.blocked_reason, 'target_owned_change_refs_required');
    assert.equal(blocker.authority_boundary.typed_blocker_only, true);
    assert.equal(blocker.authority_boundary.no_executable_work_order_issued, true);
    assert.equal(payload.authority_boundary.no_executable_work_order_issued, true);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

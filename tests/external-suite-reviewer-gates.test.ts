import test from 'node:test';
import {
  assert,
  fs,
  os,
  path,
  spawnSync,
  repoRoot,
  runImproveArgs,
  oplBin,
  writeJson,
  writeAiReviewerEvaluation,
  buildBlockedMedicalManuscriptSuite,
  writeMedicalTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

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

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ai reviewer evaluation/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'meta-agent-improvement-receipt.json')), false);
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

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Target descriptor is required: .*contracts\/domain_descriptor\.json.*contracts\/capability_pack_descriptor\.json/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'target-capability-improvement-candidate.json')), false);
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

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Target agent descriptor is missing domain_id or capability_pack_id: .*contracts\/domain_descriptor\.json/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'target-capability-improvement-candidate.json')), false);
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
    assert.equal(workOrder.target_agent.delivery_domain, 'capability_pack');
    assert.ok(workOrder.proposed_change_refs.includes('professional_skill_medical_manuscript_writing'));
    assert.deepEqual(workOrder.target_repo_file_hints, ['skills/medical-manuscript-writing/SKILL.md']);
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

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /predicted_impact must be a non-empty string/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
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

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /direct_evidence_refs must include direct evidence beyond suite\/scaffold refs/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
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
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, 'blocked_target_improvement_policy_missing');
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'typed-blocker.json')), true);

    const candidate = JSON.parse(
      fs.readFileSync(path.join(outputRoot, 'target-capability-improvement-candidate.json'), 'utf8'),
    );
    assert.deepEqual(candidate.proposed_change_refs, []);
    assert.deepEqual(candidate.patch_traceability_matrix, []);
    assert.equal(candidate.traceability_status, 'target_owned_patch_refs_missing');

    const blocker = JSON.parse(fs.readFileSync(path.join(outputRoot, 'typed-blocker.json'), 'utf8'));
    assert.equal(blocker.surface_kind, 'opl_meta_agent_target_improvement_policy_typed_blocker');
    assert.equal(blocker.status, 'blocked_target_improvement_policy_missing');
    assert.equal(blocker.blocked_reason, 'target_owned_change_refs_required');
    assert.ok(
      blocker.required_input_refs.includes(
        'contracts/agent_lab_handoff.json#external_suite_improvement_policy.default_change_refs',
      ),
    );
    assert.equal(blocker.authority_boundary.typed_blocker_only, true);
    assert.equal(blocker.authority_boundary.no_executable_work_order_issued, true);
    assert.equal(payload.authority_boundary.no_executable_work_order_issued, true);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

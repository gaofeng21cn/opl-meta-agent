import test from 'node:test';
import {
  assert,
  fs,
  os,
  path,
  spawnSync,
  repoRoot,
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
    assert.match(result.stderr, /Target agent descriptor is required: .*contracts\/domain_descriptor\.json/);
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
    assert.match(result.stderr, /Target agent descriptor is missing domain_id: .*contracts\/domain_descriptor\.json/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'target-capability-improvement-candidate.json')), false);
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

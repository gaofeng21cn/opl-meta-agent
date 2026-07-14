import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';
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
  buildReferenceDesignPacket,
  buildResearchSynthesisPacket,
  buildTransferMap,
  type JsonObject,
} from '../scripts/lib/domain-pack.ts';
import type { TargetAgent } from '../scripts/lib/meta-agent-loop-io.ts';
import {
  buildWorkflowStagePlans,
  buildWorkflowTransferMappings,
} from '../scripts/lib/reference-design-workflow.ts';
import {
  type BuildAgentBaselineArgs,
  parseBuildAgentBaselineArgs,
  runBuildAgentBaseline,
} from '../scripts/build-agent-baseline.ts';
import {
  applyDeveloperProofProfileSelection,
  normalizeRequestedProfileRefs,
  type StandardAgentDeveloperProofReceipt,
  type StandardAgentDeveloperProofRequest,
} from '../scripts/lib/standard-agent-developer-proof.ts';
import {
  buildFixtureAgentSkeletonBuildCloseout,
  buildFixtureStageDecompositionCloseout,
} from '../scripts/lib/stage-decomposition-pack-draft/builder.ts';

const oplBin = path.join(oplOwnerRepoRoot, 'bin', 'opl');

function generatedStageControl(payload: JsonObject): JsonObject {
  const interfaces = payload.opl_generated_interfaces as JsonObject;
  const productEntry = interfaces?.product_entry as JsonObject;
  const stageControl = productEntry?.family_stage_control_plane;
  assert.ok(stageControl && typeof stageControl === 'object' && !Array.isArray(stageControl));
  return stageControl as JsonObject;
}

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

function writeBuildStageArtifactRefs(
  outputRoot: string,
  stagePackets: Map<string, JsonObject>,
): {
  stageDecompositionCloseoutRef: string | null;
  agentSkeletonBuildCloseoutRef: string | null;
} {
  const writePacket = (stageId: 'stage-decomposition' | 'agent-skeleton-build') => {
    const packet = stagePackets.get(stageId);
    if (!packet) return null;
    const packetPath = path.join(outputRoot, `${stageId}-closeout-packet.json`);
    writeJson(packetPath, packet);
    return packetPath;
  };
  return {
    stageDecompositionCloseoutRef: writePacket('stage-decomposition'),
    agentSkeletonBuildCloseoutRef: writePacket('agent-skeleton-build'),
  };
}

function runOplJson(args: string[]): JsonObject {
  const result = spawnSync(oplBin, [...args, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout) as JsonObject;
}

function materializeDeveloperProofReceipt(
  requestPath: string,
  mutate?: (receipt: StandardAgentDeveloperProofReceipt) => void,
): string {
  const request = readJson(requestPath) as StandardAgentDeveloperProofRequest;
  const profileInput = request.inputs.profile_inspect_select;
  const inspectionReadbacks = profileInput.requested_profile_refs.map((profileRef) => {
    const profileId = profileRef.slice('opl-profile:'.length);
    return runOplJson(['profiles', 'inspect', profileId]).agent_profile_inspect as JsonObject;
  });
  const selectorArgs = ['profiles', 'select', '--intent', profileInput.target_brief];
  profileInput.intent_signals.forEach((signal) => selectorArgs.push('--intent-signal', signal));
  profileInput.reference_design_source_refs.forEach((ref) =>
    selectorArgs.push('--reference-source', ref)
  );
  profileInput.reference_design_pattern_packet_refs.forEach((ref) =>
    selectorArgs.push('--pattern-packet', ref)
  );
  profileInput.research_source_refs.forEach((ref) => selectorArgs.push('--reference-source', ref));
  const profileSelectionReadback = runOplJson(selectorArgs);
  const profileSelectionReceipt = profileSelectionReadback.profile_selection_receipt as JsonObject;
  profileSelectionReceipt.selected_profile_refs = [...new Set([
    ...profileInput.requested_profile_refs,
    ...((profileSelectionReceipt.selected_profile_refs as string[] | undefined) ?? []),
  ])];

  const scaffoldInput = request.inputs.scaffold_materialize_validate;
  const scaffoldRequestPath = fileURLToPath(scaffoldInput.scaffold_materialization_request_ref);
  const targetDir = fileURLToPath(scaffoldInput.target_repo_ref);
  const materialization = runOplJson([
    'agents',
    'scaffold',
    '--materialize-request',
    scaffoldRequestPath,
    '--target-dir',
    targetDir,
  ]);
  const standardScaffold = materialization.standard_domain_agent_scaffold as JsonObject;
  const materializationReceipt = standardScaffold.materialization_receipt as JsonObject;
  const scaffoldValidation = runOplJson([
    'agents',
    'scaffold',
    '--validate',
    targetDir,
  ]).standard_domain_agent_scaffold as JsonObject;
  const generatedInterfaces = runOplJson([
    'agents',
    'interfaces',
    '--repo-dir',
    targetDir,
  ]).generated_agent_interfaces as JsonObject;
  const manifestInput = request.inputs.package_manifest_validate;
  const packageManifestValidation = runOplJson([
    'packages',
    'validate-manifest',
    '--manifest-url',
    manifestInput.package_manifest_ref,
    '--trust-tier',
    manifestInput.trust_tier,
    '--source-kind',
    manifestInput.source_kind,
  ]).opl_agent_package_manifest as JsonObject;
  const conformanceInput = request.inputs.profile_conformance;
  const profileConformance = conformanceInput.mode === 'not_applicable'
    ? {
        surface_kind: 'opl_agent_profile_conformance_not_applicable',
        status: 'not_applicable',
        reason: conformanceInput.not_applicable_reason,
      }
    : runOplJson([
        'profiles',
        'conformance',
        '--repo-dir',
        targetDir,
        ...(conformanceInput.profile_id ? ['--profile', conformanceInput.profile_id] : []),
      ]).profile_conformance as JsonObject;
  const inputRefs = Object.fromEntries(
    request.operations.map((operation) => [operation.operation_id, operation.input_refs]),
  ) as Record<string, string[]>;
  const receipt: StandardAgentDeveloperProofReceipt = {
    surface_kind: 'opl_standard_agent_developer_proof_receipt',
    version: 'opl-standard-agent-developer-proof-receipt.v1',
    request_id: request.request_id,
    request_ref: request.request_ref,
    request_sha256: createHash('sha256').update(fs.readFileSync(requestPath)).digest('hex'),
    target_identity: request.target_identity,
    status: 'passed',
    proofs: {
      profile_inspect_select: {
        operation_id: 'profile_inspect_select',
        status: 'passed',
        input_refs: inputRefs.profile_inspect_select,
        output: {
          profile_selection_receipt: profileSelectionReceipt,
          profile_inspection_readbacks: inspectionReadbacks,
        },
      },
      scaffold_materialize_validate: {
        operation_id: 'scaffold_materialize_validate',
        status: 'passed',
        input_refs: inputRefs.scaffold_materialize_validate,
        output: {
          scaffold_materialization_receipt: materializationReceipt,
          standard_domain_agent_scaffold: scaffoldValidation,
        },
      },
      generated_interfaces: {
        operation_id: 'generated_interfaces',
        status: 'passed',
        input_refs: inputRefs.generated_interfaces,
        output: { generated_agent_interfaces: generatedInterfaces },
      },
      package_manifest_validate: {
        operation_id: 'package_manifest_validate',
        status: 'passed',
        input_refs: inputRefs.package_manifest_validate,
        output: { opl_agent_package_manifest: packageManifestValidation },
      },
      profile_conformance: {
        operation_id: 'profile_conformance',
        status: 'passed',
        input_refs: inputRefs.profile_conformance,
        output: { profile_conformance: profileConformance },
      },
    },
    authority_boundary: {
      execution_owner: 'one-person-lab/OPL Framework',
      receipt_owner: 'one-person-lab/OPL Framework',
      oma_consumes_receipt_only: true,
      receipt_can_write_target_domain_truth: false,
      receipt_can_authorize_target_quality_or_export: false,
    },
  };
  mutate?.(receipt);
  const receiptPath = path.join(path.dirname(requestPath), 'standard-agent-developer-proof-receipt.json');
  writeJson(receiptPath, receipt as unknown as JsonObject);
  return receiptPath;
}

function runBaselineWithDeveloperProof(
  args: BuildAgentBaselineArgs,
  mutate?: (receipt: StandardAgentDeveloperProofReceipt) => void,
): ReturnType<typeof runBuildAgentBaseline> {
  const pending = runBuildAgentBaseline({ ...args, developerProofReceiptRef: null });
  assert.equal(pending.developer_proof_receipt_state, 'pending_framework_receipt');
  assert.equal(
    (pending.developer_proof_request as JsonObject).surface_kind,
    'opl_standard_agent_developer_proof_request',
  );
  const requestSchemaRef =
    'contracts/schemas/standard-agent-developer-proof-request.producer.schema.json';
  const requestSchema = readJson(path.join(repoRoot, requestSchemaRef));
  const requestValidation = validateJsonSchemaPayload({
    schemaId: String(requestSchema.$id),
    schema: requestSchema,
    sourceRef: requestSchemaRef,
  }, pending.developer_proof_request);
  assert.equal(requestValidation.ok, true, JSON.stringify(requestValidation));
  const receiptPath = materializeDeveloperProofReceipt(
    String(pending.developer_proof_request_path),
    mutate,
  );
  return runBuildAgentBaseline({ ...args, developerProofReceiptRef: receiptPath });
}

function runBaselineFixture(
  outputRoot: string,
  reviewerPath: string,
  closeoutPath: string,
  agent: BaselineFixtureTargetAgent,
  extraArgs: string[],
): ReturnType<typeof runBuildAgentBaseline> {
  const stageArtifacts = writeBuildStageArtifactRefs(outputRoot, new Map([
    ['stage-decomposition', readJson(closeoutPath)],
    ['agent-skeleton-build', buildFixtureAgentSkeletonBuildCloseout({ targetAgent: agent })],
  ]));
  return runBaselineWithDeveloperProof(parseBuildAgentBaselineArgs([
    '--output-dir',
    outputRoot,
    '--ai-reviewer-evaluation',
    reviewerPath,
    '--stage-decomposition-closeout-ref',
    stageArtifacts.stageDecompositionCloseoutRef!,
    '--agent-skeleton-build-closeout-ref',
    stageArtifacts.agentSkeletonBuildCloseoutRef!,
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

function assertBuildAgentBaselineOutputSchemaRejectsLegacyAndUnknownFields(payload: JsonObject): void {
  for (const mutate of [
    (candidate: JsonObject) => { candidate.suite_seed = {}; },
    (candidate: JsonObject) => { (candidate.foundry_lab_handoff as JsonObject).work_order = {
      ...((candidate.foundry_lab_handoff as JsonObject).work_order as JsonObject),
      suite_plan: {},
    }; },
    (candidate: JsonObject) => { (candidate.target_agent as JsonObject).unknown_target_identity = 'forbidden'; },
    (candidate: JsonObject) => { (candidate.authority_boundary as JsonObject).unknown_authority = false; },
  ]) {
    const forged = structuredClone(payload);
    mutate(forged);
    assert.equal(validateBuildAgentBaselineOutput(forged).ok, false);
  }
}

function assertRefFields(surface: JsonObject, expected: Record<string, string>): void {
  Object.entries(expected).forEach(([field, value]) => assert.equal(surface[field], value, field));
}

test('build-agent-baseline advances with quality debt before OMA stage artifacts exist', () => {
  withTempDir('oma-bootstrap-continuation-', (outputRoot) => {
    const payload = runBuildAgentBaseline({
      outputDir: outputRoot,
      aiReviewerEvaluationPath: path.join(outputRoot, 'not-consumed-before-stage-closeout.json'),
      targetAgent,
      stageDecompositionCloseoutRef: null,
      agentSkeletonBuildCloseoutRef: null,
    });
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.equal(payload.next_stage_may_start, true);
    assert.equal(payload.semantic_route_decision_owner, 'decisive_codex_attempt');
    assert.equal(payload.stage_transition_materialization_owner, 'opl_stage_run_controller');
    assert.equal(Object.hasOwn(payload, 'route_back_selection_owner'), false);
    assert.deepEqual(payload.missing_specialized_input_stages, [
      'stage-decomposition',
      'agent-skeleton-build',
    ]);
    assertBuildAgentBaselineOutputSchema(payload);
    assert.equal(fs.existsSync(path.join(outputRoot, targetAgent.domain_id)), false);
  });
});

test('build-agent-baseline reports the exact missing OMA stage artifact', () => {
  withTempDir('oma-bootstrap-missing-stage-artifact-', (outputRoot) => {
    const stageArtifacts = writeBuildStageArtifactRefs(outputRoot, new Map([
      ['stage-decomposition', buildFixtureStageDecompositionCloseout({ targetAgent })],
    ]));
    const payload = runBuildAgentBaseline({
      outputDir: outputRoot,
      aiReviewerEvaluationPath: path.join(outputRoot, 'not-consumed-before-route-validation.json'),
      targetAgent,
      ...stageArtifacts,
    });
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.equal(payload.next_stage_may_start, true);
    assert.deepEqual(payload.missing_specialized_input_stages, ['agent-skeleton-build']);
  });
});

test('build-agent-baseline rejects a domain artifact bound to the wrong OMA stage', () => {
  withTempDir('oma-bootstrap-wrong-stage-artifact-', (outputRoot) => {
    const wrongPacketPath = path.join(outputRoot, 'wrong-stage-closeout.json');
    writeJson(wrongPacketPath, {
      surface_kind: 'stage_attempt_closeout_packet',
      stage_id: 'intent-intake',
      closeout_refs: [],
    });
    assert.throws(
      () => runBuildAgentBaseline({
        outputDir: outputRoot,
        aiReviewerEvaluationPath: '',
        targetAgent,
        stageDecompositionCloseoutRef: wrongPacketPath,
        agentSkeletonBuildCloseoutRef: null,
      }),
      /stage-decomposition closeout ref must resolve to its OMA stage_attempt_closeout_packet/,
    );
  });
});

test('build-agent-baseline consumes explicit OMA domain closeout packet refs', () => {
  withTempDir('oma-bootstrap-domain-closeout-refs-', (outputRoot) => {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeReviewerEvaluation(reviewerPath);
    const stageArtifacts = writeBuildStageArtifactRefs(outputRoot, new Map<string, JsonObject>([
      ['stage-decomposition', buildFixtureStageDecompositionCloseout({ targetAgent })],
      ['agent-skeleton-build', buildFixtureAgentSkeletonBuildCloseout({ targetAgent })],
    ]));

    const payload = runBaselineWithDeveloperProof({
      outputDir: outputRoot,
      aiReviewerEvaluationPath: reviewerPath,
      targetAgent,
      ...stageArtifacts,
    });

    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.match(payload.stage_decomposition_artifact.closeout_packet_ref, /^file:/);
    assert.match(payload.agent_skeleton_build_artifact.closeout_packet_ref, /^file:/);
    assert.equal(Object.hasOwn(payload, 'action_stage_route_context'), false);
  });
});

test('build-agent-baseline preserves materialized artifacts when OPL scaffold validation reports debt', () => {
  withTempDir('oma-bootstrap-scaffold-blocked-', (outputRoot) => {
    const reviewerPath = path.join(outputRoot, 'reviewer.json');
    writeReviewerEvaluation(reviewerPath);
    const stageArtifacts = writeBuildStageArtifactRefs(outputRoot, new Map<string, JsonObject>([
      ['stage-decomposition', buildFixtureStageDecompositionCloseout({ targetAgent })],
      ['agent-skeleton-build', buildFixtureAgentSkeletonBuildCloseout({ targetAgent })],
    ]));

    const payload = runBaselineWithDeveloperProof({
      outputDir: outputRoot,
      aiReviewerEvaluationPath: reviewerPath,
      targetAgent,
      ...stageArtifacts,
    }, (receipt) => {
      const output = receipt.proofs.scaffold_materialize_validate.output;
      const scaffold = output.standard_domain_agent_scaffold as JsonObject;
      const validation = scaffold.validation as JsonObject;
      validation.status = 'blocked';
      validation.blockers = ['fixture_scaffold_validation_blocker'];
    });
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.equal(payload.next_stage_may_start, true);
    assert.equal(payload.developer_proof_receipt_state, 'invalid_receipt_fail_closed');
    assert.equal(
      (payload.developer_proof_failure as JsonObject)
        .materialization_or_validation_accepted_as_evidence,
      false,
    );
    assert.equal(
      Object.hasOwn(
        payload.developer_proof_failure as JsonObject,
        'candidate_materialized_or_validated',
      ),
      false,
    );
    const debt = readJson(payload.quality_debt_ref as string);
    assert.match((debt.quality_debt_reasons as string[]).join(' '), /fixture_scaffold_validation_blocker/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'agent-lab-suite-seed.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'foundry-lab-work-order.json')), false);
  });
});

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
    const materializationRequest = payload.foundry_lab_handoff.materialization_request as JsonObject;
    const evaluationRequest = materializationRequest.semantic_request as JsonObject;
    const descriptor = readJson(path.join(targetDir, 'contracts/domain_descriptor.json'));
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const packageManifest = readJson(path.join(targetDir, 'contracts/opl_agent_package_manifest.json'));
    const stageControl = generatedStageControl(payload);
    const firstStage = stageControl.stages[0] as JsonObject;
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, firstStage.prompt_refs[0].ref), 'utf8');
    const generatedKnowledge = fs.readFileSync(path.join(targetDir, firstStage.knowledge_refs[0].ref), 'utf8');
    const evidenceRefs = evaluationRequest.task_intents[0].evidence_refs as string[];
    assert.equal(Object.hasOwn(evaluationRequest, 'evaluation_target_agent'), false);
    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.target_agent.scaffold_validation_status, 'passed');
    assert.equal(payload.opl_profile_conformance.status, 'passed');
    assertBuildAgentBaselineOutputSchema(payload);
    assertBuildAgentBaselineOutputSchemaRejectsLegacyAndUnknownFields(payload);
    assert.equal(payload.artifacts.agent_build_receipt_path, path.join(targetDir, 'contracts/agent_build_receipt.json'));
    assert.equal(payload.artifacts.agent_build_receipt_ref, `build-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`);
    const missingBuildReceiptRef = structuredClone(payload);
    delete missingBuildReceiptRef.artifacts.agent_build_receipt_ref;
    assert.equal(validateBuildAgentBaselineOutput(missingBuildReceiptRef).ok, false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'agent-lab-suite.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'online-learning-candidate.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'mechanism-patch-proposal.json')), false);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), false);
    assert.equal(descriptor.domain_id, targetAgent.domain_id);
    assert.equal(packageManifest.distribution_payload, undefined);
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
    assert.ok(
      capabilityMap.profile_requirements.required_evidence_objects.includes('EvidencePacket'),
    );
    assert.equal(stageControl.stages[0].selected_executor.executor_kind, 'codex_cli');
    assert.deepEqual(
      capabilityMap.reference_design_source_refs,
      targetAgent.reference_design_source_refs,
    );
    assert.deepEqual(
      capabilityMap.reference_design_pattern_packet_refs,
      targetAgent.reference_design_pattern_packet_refs,
    );
    assert.ok(evidenceRefs.includes(targetAgent.reference_design_source_refs[0]));
    assert.ok(evidenceRefs.includes(targetAgent.reference_design_pattern_packet_refs[0]));
    assert.equal(materializationRequest.request_kind, 'foundry_evaluation');
    assert.equal(materializationRequest.request_owner, 'oma');
    assert.equal(materializationRequest.producer_agent_id, 'oma');
    assert.equal(materializationRequest.target_agent.domain_id, targetAgent.domain_id);
    assert.equal(
      materializationRequest.target_agent.target_agent_ref,
      `domain-agent:${targetAgent.domain_id}`,
    );
    assert.equal(
      materializationRequest.target_agent.descriptor_ref,
      path.join(targetDir, 'contracts/domain_descriptor.json'),
    );
    assert.equal(evaluationRequest.task_intents[0].domain_id, 'opl-meta-agent');
    assert.equal(Object.hasOwn(evaluationRequest.task_intents[0], 'target_agent_ref'), false);
    assert.equal(Object.hasOwn(evaluationRequest.task_intents[0], 'scorecard_spec'), false);
    assert.deepEqual(evaluationRequest.task_intents[0].receipt_refs, [
      `expected-owner-receipt:target-domain/${targetAgent.domain_id}/baseline-delivery`,
    ]);
    assert.equal(
      (evaluationRequest.task_intents[0].receipt_refs as string[]).some((ref) =>
        ref.startsWith('owner-receipt:opl-meta-agent/')
      ),
      false,
    );
    assert.equal(materializationRequest.authority_boundary.producer_assigns_work_order_id, false);
    assert.equal(materializationRequest.authority_boundary.producer_executes_work_order, false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'foundry-lab-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'foundry-evaluation-request.json')), false);
    assert.ok(primarySkill.includes(targetAgent.reference_design_pattern_packet_refs[0]));
    assert.ok(generatedPrompt.includes(targetAgent.selected_opl_profile_refs[0]));
    assert.ok(generatedKnowledge.includes('EvidencePacket'));
    assert.ok(capabilityMap.profile_requirements.required_reference_pack_roles.includes('evidence_source_freshness_policy'));
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
    const capabilityMap = readJson(path.join(targetDir, 'contracts/capability_map.json'));
    const stageControl = generatedStageControl(payload);
    const stage = stageControl.stages[0] as JsonObject;
    const stageContract = stage.stage_contract as JsonObject;
    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.opl_profile_conformance.status, 'passed');
    assert.equal(
      fs.existsSync(path.join(outputRoot, `${sourceDerivedTargetAgent.domain_id}-stage-decomposition-blocker.json`)),
      false,
    );
    assert.equal(
      capabilityMap.stage_decomposition_subpacket_set_ref,
      sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    );
    assert.ok((stageContract.requires as string[]).includes(
      `stage-decomposition-subpacket-set-ref:${sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef}`,
    ));
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), false);
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
    const stageControl = generatedStageControl(payload);
    const buildReceipt = readJson(path.join(targetDir, 'contracts/agent_build_receipt.json'));
    const compilerInput = readJson(path.join(targetDir, 'contracts/pack_compiler_input.json'));
    const generatedSeries = readJson(path.join(targetDir, 'contracts/foundry_agent_series.json'));
    const sourceDesignReceipt = capabilityMap.profile_selection_receipt.source_derived_design_receipt as JsonObject;
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, stageControl.stages[0].prompt_refs[0].ref), 'utf8');

    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.deepEqual(compilerInput.implementation_profile, {
      profile_id: 'opl.standard_domain_agent.v1',
      agent_identity: 'declarative_standard_agent_pack',
      pack_formats: ['markdown', 'json'],
      helpers: {
        optional: true,
        entries: [],
        language_is_identity: false,
        rust_policy: 'framework_hot_path_only',
      },
      generated_surfaces_owner: 'one-person-lab',
    });
    assert.equal(payload.opl_profile_conformance.status, 'passed');
    assertBuildAgentBaselineOutputSchema(payload);
    assert.equal(fs.existsSync(path.join(outputRoot, 'baseline-delivery-receipt.json')), false);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), false);
    assert.equal(descriptor.profile_selection_mode, 'source_derived_design');
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
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
    assert.equal(buildReceipt.build_source_kind, 'source_derived_design');
    assert.equal(buildReceipt.receipt_kind, 'AgentBuildReceipt');
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
    assert.equal(buildReceipt.receipt_timing, 'post_materialization');
    for (const field of [
      'domain_can_write_other_domain_truth',
      'domain_can_write_other_domain_memory_body',
      'domain_can_mutate_other_domain_artifact_body',
      'domain_can_authorize_other_domain_quality_or_export',
    ]) {
      assert.equal(generatedSeries.authority_boundary[field], false, field);
    }
    for (const schemaRef of [
      'contracts/schemas/draft-agent-output.input.schema.json',
      'contracts/schemas/draft-agent-output.output.schema.json',
    ]) {
      assert.equal(fs.existsSync(path.join(targetDir, schemaRef)), true, schemaRef);
      assert.ok(compilerInput.required_domain_pack_paths.includes(schemaRef), schemaRef);
      assert.equal(readJson(path.join(targetDir, schemaRef)).type, 'object');
    }
    [descriptor, capabilityMap].forEach((surface) => assert.deepEqual(surface.build_receipt, buildReceipt));
    assert.deepEqual(
      buildReceipt.materialization.materialized_stage_ids,
      stageControl.stages.map((stage: JsonObject) => stage.stage_id),
    );
    const plan = capabilityMap.agent_pack_plan as JsonObject;
    const digestRefs = new Set(
      buildReceipt.materialization.materialized_file_digests
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
    [
      'contracts/schemas/draft-agent-output.input.schema.json',
      'contracts/schemas/draft-agent-output.output.schema.json',
    ].forEach((ref) => assert.ok(digestRefs.has(ref), `missing action schema build receipt digest: ${ref}`));
    assert.deepEqual(buildReceipt.target_only_requirement_refs, [
      'target-only-requirement:surgery-risk-from-paper-agent/owner-gated-closeout',
    ]);
    assert.deepEqual(stageControl.stages[0].stage_pattern_source_refs, [
      sourceDerivedObjectRefs.sourcePatternRef,
    ]);
    const firstStage = stageControl.stages[0] as JsonObject;
    assertRefFields(capabilityMap, {
      reference_design_packet_ref: sourceDerivedObjectRefs.referenceDesignPacketRef,
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    [
      `reference-design-packet-ref:${sourceDerivedObjectRefs.referenceDesignPacketRef}`,
      `transfer-map-ref:${sourceDerivedObjectRefs.transferMapRef}`,
      `agent-pack-plan-ref:${sourceDerivedObjectRefs.agentPackPlanRef}`,
      `design-admission-receipt-ref:${sourceDerivedObjectRefs.designAdmissionReceiptRef}`,
      `stage-decomposition-subpacket-set-ref:${sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef}`,
    ].forEach((ref) => assert.ok(firstStage.stage_contract.requires.includes(ref), ref));
    assert.equal(firstStage.stage_contract.expected_receipt_refs.some((entry: JsonObject) =>
      entry.ref === sourceDerivedObjectRefs.buildReceiptRef
    ), false, 'post-materialization AgentBuildReceipt must not become a target stage receipt');
    assert.deepEqual(sourceDesignReceipt.required_design_objects, sourceDerivedRequiredDesignObjects);
    assert.deepEqual(sourceDesignReceipt.required_machine_objects, sourceDerivedRequiredDesignObjects);
    assertRefFields(capabilityMap.profile_selection_receipt as JsonObject, {
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      expected_build_receipt_ref: sourceDerivedObjectRefs.buildReceiptRef,
      stage_decomposition_subpacket_set_ref: sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assertRefFields(sourceDesignReceipt, {
      design_admission_receipt_ref: sourceDerivedObjectRefs.designAdmissionReceiptRef,
      reference_design_packet_ref: sourceDerivedObjectRefs.referenceDesignPacketRef,
      transfer_map_ref: sourceDerivedObjectRefs.transferMapRef,
      agent_pack_plan_ref: sourceDerivedObjectRefs.agentPackPlanRef,
    });
    [
      'Profile selection mode: source_derived_design',
      sourceDerivedObjectRefs.referenceDesignPacketRef,
      sourceDerivedObjectRefs.transferMapRef,
      sourceDerivedObjectRefs.agentPackPlanRef,
      sourceDerivedObjectRefs.stageDecompositionSubpacketSetRef,
    ].forEach((text) => assert.ok(primarySkill.includes(text), text));
    assert.ok(generatedPrompt.includes('Map source steps to adopted, adapted, merged, stage-internal, or rejected dispositions'));
    assert.ok(generatedPrompt.includes('## A Good Result'));
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
    const stageControl = generatedStageControl(payload);
    const buildReceipt = readJson(path.join(targetDir, 'contracts/agent_build_receipt.json'));
    const materializationRequest = payload.foundry_lab_handoff.materialization_request as JsonObject;
    const evaluationRequest = materializationRequest.semantic_request as JsonObject;
    const primarySkill = fs.readFileSync(path.join(targetDir, 'agent/primary_skill/SKILL.md'), 'utf8');
    const generatedPrompt = fs.readFileSync(path.join(targetDir, stageControl.stages[0].prompt_refs[0].ref), 'utf8');

    assert.equal(payload.status, 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation');
    assert.equal(payload.opl_profile_conformance.status, 'not_applicable');
    assertBuildAgentBaselineOutputSchema(payload);
    assert.equal(payload.artifacts.agent_build_receipt_ref, researchDrivenObjectRefs.buildReceiptRef);
    [descriptor, capabilityMap].forEach((surface) => {
      assert.equal(surface.profile_selection_mode, 'research_driven_design');
      assert.equal(surface.research_driven_design_receipt.route_ref, 'opl-profile-route:research_driven_design_profile_route.v1');
    });
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), false);
    assert.equal(descriptor.selected_opl_profile_refs, undefined);
    assert.deepEqual(descriptor.research_source_refs, researchDrivenTargetAgent.research_source_refs);
    assert.deepEqual(descriptor.expert_practice_notes, researchDrivenTargetAgent.expert_practice_notes);
    assert.deepEqual(descriptor.research_synthesis_refs, researchDrivenTargetAgent.research_synthesis_refs);
    [descriptor, capabilityMap].forEach((surface) => assertRefFields(surface, researchDrivenCoreRefs));
    assert.deepEqual(descriptor.build_receipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.equal(descriptor.build_receipt.build_source_kind, 'research_driven_design');
    assert.deepEqual(capabilityMap.selected_profile_refs, []);
    assertRefFields(capabilityMap, {
      research_synthesis_packet_ref: researchDrivenObjectRefs.researchSynthesisPacketRef,
      design_admission_receipt_ref: researchDrivenObjectRefs.designAdmissionReceiptRef,
      stage_decomposition_subpacket_set_ref: researchDrivenObjectRefs.stageDecompositionSubpacketSetRef,
    });
    assert.deepEqual(buildReceipt.required_design_objects, researchDrivenRequiredDesignObjects);
    assert.equal(stageControl.stages.length, 4);
    assert.deepEqual(stageControl.stages.flatMap((stage: JsonObject) => stage.stage_pattern_source_refs ?? []), [
      researchDrivenTargetAgent.research_synthesis_refs[0],
      researchDrivenObjectRefs.expertPracticeNoteRef,
      researchDrivenObjectRefs.researchSourcePatternRef,
    ]);
    const firstStage = stageControl.stages[0] as JsonObject;
    [
      `research-synthesis-packet-ref:${researchDrivenObjectRefs.researchSynthesisPacketRef}`,
      `design-admission-receipt-ref:${researchDrivenObjectRefs.designAdmissionReceiptRef}`,
      `stage-decomposition-subpacket-set-ref:${researchDrivenObjectRefs.stageDecompositionSubpacketSetRef}`,
    ].forEach((ref) => assert.ok(firstStage.stage_contract.requires.includes(ref), ref));
    assert.deepEqual(
      evaluationRequest.source_refs.includes(researchDrivenTargetAgent.research_source_refs[0]),
      true,
    );
    assert.ok(evaluationRequest.task_intents[0].evidence_refs.includes(researchDrivenTargetAgent.research_source_refs[0]));
    assert.ok(evaluationRequest.task_intents[0].evidence_refs.includes(researchDrivenTargetAgent.research_synthesis_refs[0]));
    assert.ok(primarySkill.includes('Profile selection mode: research_driven_design'));
    assert.ok(primarySkill.includes('Selected profile ref: none; research-driven design refs are the active design input.'));
    assert.ok(primarySkill.includes(researchDrivenObjectRefs.researchSynthesisPacketRef));
    assert.ok(primarySkill.includes(researchDrivenObjectRefs.stageDecompositionSubpacketSetRef));
    assert.ok(generatedPrompt.includes('Do not turn each research workflow step into an independent Stage by default'));
    assert.ok(generatedPrompt.includes('## Professional Dependencies And Authority Boundary'));
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

test('source workflow steps merge only when the design packet explicitly shares a target group', () => {
  const pattern: JsonObject = {
    pattern_id: 'grouped-workflow.v1',
    source_pattern_ref: 'pattern:grouped-workflow.v1',
    transferable_workflow_steps: [
      {
        step_id: 'inspect-a',
        stage_archetype: 'evidence-appraisal',
        provenance_kind: 'source_derived',
        source_anchor_refs: ['anchor:a'],
        target_adaptation: 'Appraise evidence A.',
        known_limits: ['A is scoped.'],
      },
      {
        step_id: 'inspect-b',
        stage_archetype: 'evidence-appraisal',
        provenance_kind: 'source_derived',
        source_anchor_refs: ['anchor:b'],
        target_adaptation: 'Appraise evidence B.',
        known_limits: ['B is scoped.'],
      },
      {
        step_id: 'owner-closeout',
        stage_archetype: 'owner-closeout',
        provenance_kind: 'source_derived',
        source_anchor_refs: ['anchor:c'],
        target_adaptation: 'Prepare the owner closeout.',
        known_limits: ['Owner authority remains external.'],
      },
    ],
    non_transferable_constraints: [],
  };
  const target = { domain_id: 'grouped-agent' };
  const ungroupedStages = buildWorkflowStagePlans(target, [pattern]);
  assert.equal(ungroupedStages.length, 3);
  assert.deepEqual(ungroupedStages.map((stage) => stage.source_step_ids), [
    ['inspect-a'],
    ['inspect-b'],
    ['owner-closeout'],
  ]);

  const groupedPattern = structuredClone(pattern);
  groupedPattern.transferable_workflow_steps[0].target_stage_group = 'evidence-appraisal';
  groupedPattern.transferable_workflow_steps[1].target_stage_group = 'evidence-appraisal';
  const stages = buildWorkflowStagePlans(target, [groupedPattern]);
  assert.equal(stages.length, 2);
  assert.deepEqual(stages[0].source_step_ids, ['inspect-a', 'inspect-b']);

  const mappings = buildWorkflowTransferMappings({
    targetAgent: target,
    patterns: [groupedPattern],
    fallbackStageId: 'agent-output-draft',
    actionId: 'draft-agent-output',
  });
  const appraisalMappings = mappings.filter((mapping) =>
    mapping.target_stage_or_capability_slot === stages[0].stage_ref
  );
  assert.deepEqual(appraisalMappings.map((mapping) => mapping.step_id), ['inspect-a', 'inspect-b']);
  assert.ok(appraisalMappings.every((mapping) => mapping.disposition === 'merged'));
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
  const selected = applyDeveloperProofProfileSelection(parsed.targetAgent, hybridReceipt);

  assert.equal(selected.target_brief, chineseIntent);
  assert.deepEqual(selected.intent_signals, intentSignals);
  assert.deepEqual(selected.selected_opl_profile_refs, [builtinProfileRef]);
  assert.deepEqual(selected.reference_design_source_refs, sourceDerivedTargetAgent.reference_design_source_refs);
});

test('OMA canonicalizes explicit profile refs and defers availability proof to OPL', () => {
  const selected = normalizeRequestedProfileRefs({
    ...targetAgent,
    selected_opl_profile_refs: ['evidence_grounded_decision_agent_profile.v1'],
  });
  assert.deepEqual(selected.selected_opl_profile_refs, [
    'opl-profile:evidence_grounded_decision_agent_profile.v1',
  ]);
  assert.deepEqual(normalizeRequestedProfileRefs({
    ...targetAgent,
    selected_opl_profile_refs: ['unknown_profile.v1'],
  }).selected_opl_profile_refs, ['opl-profile:unknown_profile.v1']);
  assert.throws(
    () => normalizeRequestedProfileRefs({
      ...targetAgent,
      selected_opl_profile_refs: ['../invalid-profile'],
    }),
    /profile ref is invalid/i,
  );
});

test('canonical OPL refs-only pattern packet produces its own stable workflow stages', () => {
  const packet = buildReferenceDesignPacket(sourceDerivedTargetAgent);
  const plan = buildAgentPackPlan(sourceDerivedTargetAgent);

  assert.ok(packet);
  assert.ok(plan);
  assert.equal(packet.surface_kind, 'opl_foundry_reference_design_packet');
  assert.equal(packet.version, 'opl.foundry.reference-design-packet.v1');
  assert.equal(plan.surface_kind, 'opl_foundry_agent_pack_plan');
  assert.equal(plan.version, 'opl.foundry.agent-pack-plan.v1');
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
  assert.equal(transferMap.surface_kind, 'opl_foundry_transfer_map');
  assert.equal(transferMap.version, 'opl.foundry.transfer-map.v1');
  assert.equal(admission.surface_kind, 'opl_foundry_design_admission_receipt');
  assert.equal(admission.version, 'opl.foundry.design-admission-receipt.v1');
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
  const filePlan = draft.file_materialization_plan as JsonObject;
  const files = new Set((filePlan.files as JsonObject[]).map((file) => file.path));
  plannedStages.forEach((stage) => {
    assert.ok(files.has(stage.prompt_ref));
    assert.ok(files.has(stage.stage_path));
    assert.ok(files.has(stage.skill_ref));
    assert.ok((stage.knowledge_refs as string[]).every((ref) => files.has(ref)));
    assert.ok((stage.quality_gate_refs as string[]).every((ref) => files.has(ref)));
  });
});

test('pre-materialization packets carry only the expected AgentBuildReceipt ref', () => {
  const closeout = buildFixtureStageDecompositionCloseout({ targetAgent: sourceDerivedTargetAgent });
  const draft = closeout.stage_decomposition_pack_draft as JsonObject;
  const stageControl = draft.stage_control_plane as JsonObject;
  [stageControl, ...(stageControl.stages as JsonObject[])].forEach((surface) => {
    assert.equal(Object.hasOwn(surface, 'build_receipt'), false);
    assert.equal(surface.expected_build_receipt_ref, sourceDerivedObjectRefs.buildReceiptRef);
  });
});

test('raw reference source and opaque packet become routeable quality debt', () => {
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

    const payload = runBuildAgentBaseline({
      outputDir: outputRoot,
      aiReviewerEvaluationPath: reviewerPath,
      targetAgent: rawTargetAgent,
      ...writeBuildStageArtifactRefs(outputRoot, new Map<string, JsonObject>([
        ['stage-decomposition', {
          surface_kind: 'stage_attempt_closeout_packet',
          stage_id: 'stage-decomposition',
          closeout_refs: [],
        }],
        ['agent-skeleton-build', {
          surface_kind: 'stage_attempt_closeout_packet',
          stage_id: 'agent-skeleton-build',
          closeout_refs: [],
        }],
      ])),
    });
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.equal(payload.next_stage_may_start, true);
    const debt = readJson(path.join(
      outputRoot,
      `${rawTargetAgent.domain_id}-stage-decomposition-quality-debt.json`,
    ));
    assert.match((debt.quality_debt_reasons as string[]).join(' '), /opaque_pattern_packet_unresolved/);
    assert.equal(debt.route_impact.materialization_allowed, false);
    assert.equal(debt.route_impact.semantic_route_decision_owner, 'decisive_codex_attempt');
    assert.equal(
      debt.route_impact.stage_transition_materialization_owner,
      'opl_stage_run_controller',
    );
    assert.equal(Object.hasOwn(debt.route_impact, 'route_back_selection_owner'), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'profile-selection.json')), false);
  });
});

test('build-agent-baseline records missing independent reviewer evidence as quality debt', () => {
  withTempDir('oma-bootstrap-missing-reviewer-pass4-', (outputRoot) => {
    const payload = runBaselineWithDeveloperProof({
      outputDir: outputRoot,
      aiReviewerEvaluationPath: '',
      targetAgent,
      ...writeBuildStageArtifactRefs(outputRoot, new Map<string, JsonObject>([
        ['stage-decomposition', buildFixtureStageDecompositionCloseout({ targetAgent })],
        ['agent-skeleton-build', buildFixtureAgentSkeletonBuildCloseout({ targetAgent })],
      ])),
    });
    assert.equal(payload.status, 'completed_with_quality_debt');
    assert.equal(payload.next_stage_may_start, true);
    assert.equal(payload.quality_debt.blocks_delivery_or_promotion_claims, true);
    assert.equal(fs.existsSync(path.join(outputRoot, 'foundry-lab-work-order.json')), false);
    assert.equal(
      payload.foundry_lab_handoff.materialization_request.request_kind,
      'foundry_evaluation',
    );
    assert.equal(
      payload.foundry_lab_handoff.materialization_request.semantic_request.reviewer_refs.length,
      1,
    );
  });
});

test('build-agent-baseline accepts missing profile or design-basis refs as a later quality decision', () => {
  const parsed = parseBuildAgentBaselineArgs([
    '--domain-id',
    'unrouted-agent',
    '--target-brief',
    'Create an OPL-compatible fixture agent.',
  ]);
  assert.deepEqual(parsed.targetAgent.selected_opl_profile_refs ?? [], []);
  assert.deepEqual(parsed.targetAgent.reference_design_source_refs ?? [], []);
  assert.deepEqual(parsed.targetAgent.research_source_refs ?? [], []);
  assert.equal(parsed.aiReviewerEvaluationPath, '');
});

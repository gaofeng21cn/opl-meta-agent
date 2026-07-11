#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs as parseNodeArgs } from 'node:util';
import {
  type DomainPackSummary,
  type JsonObject,
  domainPackReceiptFields,
  readDomainPackSummary,
} from './lib/domain-pack.ts';
import {
  type AiReviewerEvaluation,
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type TargetAgent,
  readJson,
  readTargetAgent,
  stableId,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import type { SuiteResult } from './lib/external-suite-materializer.ts';
import {
  collectEfficiencyNonRegressionRefs,
  type EfficiencyNonRegressionRefs,
  missingEfficiencyNonRegressionFields,
} from './lib/work-order-efficiency.ts';
import {
  validateDeveloperPatchWorkOrder,
} from './lib/work-order-validation.ts';
import {
  type PatchTraceabilityEntry,
  type TargetImprovementPolicy,
  buildPatchTraceabilityMatrix,
  inferProposedChangeRefs,
  targetEditableSurfaceRefs,
  targetImprovementPolicy,
} from './lib/target-improvement-policy.ts';
import {
  type CapabilityCandidate,
  buildDeveloperPatchWorkOrder,
} from './lib/external-suite-materializer.ts';
import {
  buildExpectedTypedBlockerRef,
} from './lib/agent-evidence-typed-blocker.ts';

const repoRoot = path.resolve(import.meta.dirname, '..');

export type ImproveArgs = {
  suitePath: string;
  suiteResultPath: string;
  targetAgentDir: string;
  outputDir: string;
  feedbackRef: string | null;
  aiReviewerEvaluationPath: string;
};

export function parseImproveFromAgentLabSuiteArgs(argv: string[]): ImproveArgs {
  const parsed: {
    suitePath: string | null;
    suiteResultPath: string | null;
    targetAgentDir: string | null;
    outputDir: string | null;
    feedbackRef: string | null;
    aiReviewerEvaluationPath: string | null;
  } = {
    suitePath: null,
    suiteResultPath: null,
    targetAgentDir: null,
    outputDir: null,
    feedbackRef: null,
    aiReviewerEvaluationPath: null,
  };

  const { values, tokens } = parseNodeArgs({
    args: argv,
    options: {
      suite: { type: 'string' },
      'suite-result': { type: 'string' },
      'target-agent-dir': { type: 'string' },
      'agent-dir': { type: 'string' },
      'output-dir': { type: 'string' },
      'feedback-ref': { type: 'string' },
      'ai-reviewer-evaluation': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
    tokens: true,
  });
  if (typeof values.suite === 'string') {
    parsed.suitePath = path.resolve(values.suite);
  }
  if (typeof values['suite-result'] === 'string') {
    parsed.suiteResultPath = path.resolve(values['suite-result']);
  }
  const targetAgentDir = tokens
    .filter((token) =>
      token.kind === 'option'
      && (token.name === 'target-agent-dir' || token.name === 'agent-dir')
    )
    .at(-1);
  if (targetAgentDir?.kind === 'option' && typeof targetAgentDir.value === 'string') {
    parsed.targetAgentDir = path.resolve(targetAgentDir.value);
  }
  if (typeof values['output-dir'] === 'string') {
    parsed.outputDir = path.resolve(values['output-dir']);
  }
  if (typeof values['feedback-ref'] === 'string') {
    parsed.feedbackRef = values['feedback-ref'];
  }
  if (typeof values['ai-reviewer-evaluation'] === 'string') {
    parsed.aiReviewerEvaluationPath = path.resolve(values['ai-reviewer-evaluation']);
  }

  if (!parsed.suitePath) {
    throw new Error('Missing required --suite <path>.');
  }
  if (!fs.existsSync(parsed.suitePath)) {
    throw new Error(`Suite path does not exist: ${parsed.suitePath}`);
  }
  if (!parsed.suiteResultPath) {
    throw new Error('Missing required --suite-result <path>.');
  }
  if (!fs.existsSync(parsed.suiteResultPath)) {
    throw new Error(`Suite result path does not exist: ${parsed.suiteResultPath}`);
  }
  if (!parsed.targetAgentDir) {
    throw new Error('Missing required --target-agent-dir <path>.');
  }
  if (!fs.existsSync(parsed.targetAgentDir)) {
    throw new Error(`Target agent path does not exist: ${parsed.targetAgentDir}`);
  }
  if (!parsed.aiReviewerEvaluationPath) {
    throw new Error(
      'Missing required --ai-reviewer-evaluation <path>; external-suite improvement fails closed without structured AI reviewer evaluation.',
    );
  }

  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-'));
  return {
    suitePath: parsed.suitePath,
    suiteResultPath: parsed.suiteResultPath,
    targetAgentDir: parsed.targetAgentDir,
    outputDir: parsed.outputDir,
    feedbackRef: parsed.feedbackRef,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function collectSuiteRefs(suite: JsonObject): string[] {
  const refs: unknown[] = [];
  for (const task of Array.isArray(suite.tasks) ? suite.tasks : []) {
    refs.push(task.task_id, task.task_family, task.instructions_ref, task.agent_entry_ref);
    refs.push(...arrayOfStrings(task.feedback_refs));
    refs.push(...arrayOfStrings(task.reviewer_evidence_refs));
    refs.push(...arrayOfStrings(task.reviewer_revision_refs));
    refs.push(...arrayOfStrings(task.revision_checklist_refs));
    refs.push(...arrayOfStrings(task.owner_route_refs));
    refs.push(...arrayOfStrings(task.target_owner_closeout_refs));
    refs.push(...arrayOfStrings(task.stage_refs));
    refs.push(...arrayOfStrings(task.oracle_refs));
    refs.push(...arrayOfStrings(task.scorer_refs));
    refs.push(...arrayOfStrings(task.trajectory?.artifact_refs));
    refs.push(...arrayOfStrings(task.trajectory?.repair_refs));
    refs.push(...arrayOfStrings(task.scorecard?.metric_refs));
    refs.push(...arrayOfStrings(task.scorecard?.evidence_refs));
    refs.push(...arrayOfStrings(task.scorecard?.review_refs));
    refs.push(...arrayOfStrings(task.scorecard?.quality_gate_refs));
    refs.push(...arrayOfStrings(task.improvement_candidate?.evidence_refs));
    refs.push(task.improvement_candidate?.target_ref, task.improvement_candidate?.candidate_kind);
    refs.push(task.improvement_candidate?.promotion_gate_ref);
    refs.push(task.promotion_gate?.gate_ref);
    refs.push(...arrayOfStrings(task.promotion_gate?.required_refs));
    refs.push(...arrayOfStrings(task.promotion_gate?.regression_suite_refs));
    refs.push(...arrayOfStrings(task.promotion_gate?.no_forbidden_write_proof_refs));
  }
  return refs
    .filter((ref): ref is string => typeof ref === 'string' && ref.trim().length > 0)
    .map((ref) => ref.trim());
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function jsonObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonObject
    : null;
}

function nonEmptyString(value: unknown, field: string, suiteResultPath: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Foundry Lab suite result requires ${field}: ${suiteResultPath}`);
  }
  return value.trim();
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function canonicalJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalJsonValue);
  }
  const object = jsonObject(value);
  if (!object) {
    return value;
  }
  return Object.fromEntries(
    Object.keys(object)
      .sort()
      .map((key) => [key, canonicalJsonValue(object[key])]),
  );
}

function canonicalProvenanceBindings(bindings: JsonObject[]): JsonObject[] {
  return bindings
    .map((binding) => canonicalJsonValue(binding) as JsonObject)
    .sort((left, right) => {
      const leftKey = JSON.stringify(left);
      const rightKey = JSON.stringify(right);
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
}

const taskScopedProvenanceRoles = new Set([
  'promotion_gate_observation',
  'recovery_probe_observation',
  'scorecard_observation',
  'stage_completion_policy',
  'trajectory_observation',
]);

function readFoundryLabSuiteResult(
  suiteResultPath: string,
  suite: JsonObject,
  targetAgent: TargetAgent,
): SuiteResult {
  const payload = readJson(suiteResultPath);
  const execution = jsonObject(payload.agent_lab_evaluation_work_order_execution) ?? payload;
  const nestedResult = jsonObject(payload.agent_lab_run)?.suite_result
    ?? execution.suite_result
    ?? payload.suite_result
    ?? payload;
  const result = jsonObject(nestedResult);
  if (!result) {
    throw new Error(`Foundry Lab suite result is invalid: ${suiteResultPath}`);
  }
  const resultId = nonEmptyString(result.result_id, 'result_id', suiteResultPath);
  const status = nonEmptyString(result.status, 'status', suiteResultPath);
  if (status !== 'passed' && status !== 'blocked') {
    throw new Error(`Foundry Lab suite result status must be passed or blocked: ${suiteResultPath}`);
  }
  const expectedSuiteId = nonEmptyString(suite.suite_id, 'input suite.suite_id', suiteResultPath);
  const resultSuiteId = nonEmptyString(result.suite_id, 'suite_id', suiteResultPath);
  if (resultSuiteId !== expectedSuiteId) {
    throw new Error(`Foundry Lab suite result suite_id does not match the input suite: ${suiteResultPath}`);
  }

  const expectedTarget = {
    domain_id: nonEmptyString(targetAgent.domain_id, 'target_agent.domain_id', suiteResultPath),
    target_agent_ref: nonEmptyString(
      targetAgent.target_agent_ref,
      'target_agent.target_agent_ref',
      suiteResultPath,
    ),
    descriptor_ref: nonEmptyString(
      targetAgent.descriptor_ref,
      'target_agent.descriptor_ref',
      suiteResultPath,
    ),
  };
  const assertTargetIdentity = (value: unknown, field: string) => {
    const target = jsonObject(value);
    if (!target) {
      throw new Error(`Foundry Lab ${field} is required: ${suiteResultPath}`);
    }
    for (const targetField of ['domain_id', 'target_agent_ref', 'descriptor_ref'] as const) {
      if (nonEmptyString(target[targetField], `${field}.${targetField}`, suiteResultPath)
        !== expectedTarget[targetField]) {
        throw new Error(
          `Foundry Lab ${field}.${targetField} does not match the target agent: ${suiteResultPath}`,
        );
      }
    }
    return target;
  };
  assertTargetIdentity(suite.evaluation_target_agent, 'input suite evaluation_target_agent');
  const evaluationTarget = jsonObject(result.evaluation_target_agent);
  assertTargetIdentity(evaluationTarget, 'suite result evaluation_target_agent');

  const suiteTasks = Array.isArray(suite.tasks) ? suite.tasks : [];
  const expectedTaskIds = suiteTasks.map((task, index) =>
    nonEmptyString(jsonObject(task)?.task_id, `input suite.tasks[${index}].task_id`, suiteResultPath));
  if (expectedTaskIds.length === 0 || uniqueStrings(expectedTaskIds).length !== expectedTaskIds.length) {
    throw new Error(`Foundry Lab input suite requires unique task ids: ${suiteResultPath}`);
  }
  if (!Array.isArray(result.runs)) {
    throw new Error(`Foundry Lab suite result requires runs: ${suiteResultPath}`);
  }
  const resultTaskIds = result.runs.map((run, index) =>
    nonEmptyString(jsonObject(run)?.task_id, `runs[${index}].task_id`, suiteResultPath));
  if (
    uniqueStrings(resultTaskIds).length !== resultTaskIds.length
    || !sameStringSet(resultTaskIds, expectedTaskIds)
  ) {
    throw new Error(`Foundry Lab suite result runs[].task_id does not match the input suite: ${suiteResultPath}`);
  }

  const refs = jsonObject(result.refs);
  if (!refs || !Array.isArray(refs.evaluation_provenance_refs)) {
    throw new Error(`Foundry Lab suite result requires refs.evaluation_provenance_refs: ${suiteResultPath}`);
  }
  const provenanceRefs = refs.evaluation_provenance_refs.map((ref, index) =>
    nonEmptyString(ref, `refs.evaluation_provenance_refs[${index}]`, suiteResultPath));
  if (provenanceRefs.length === 0 || uniqueStrings(provenanceRefs).length !== provenanceRefs.length) {
    throw new Error(`Foundry Lab suite result requires unique evaluation provenance refs: ${suiteResultPath}`);
  }
  if (!Array.isArray(result.evaluation_provenance_bindings)
    || result.evaluation_provenance_bindings.length === 0) {
    throw new Error(`Foundry Lab suite result requires evaluation_provenance_bindings: ${suiteResultPath}`);
  }
  const provenanceBindings = result.evaluation_provenance_bindings.map((binding, index) => {
    const record = jsonObject(binding);
    if (!record) {
      throw new Error(`Foundry Lab suite result has invalid evaluation_provenance_bindings[${index}]: ${suiteResultPath}`);
    }
    const receiptRole = nonEmptyString(
      record.receipt_role,
      `evaluation_provenance_bindings[${index}].receipt_role`,
      suiteResultPath,
    );
    nonEmptyString(record.receipt_ref, `evaluation_provenance_bindings[${index}].receipt_ref`, suiteResultPath);
    if (record.task_id !== undefined) {
      const taskId = nonEmptyString(
        record.task_id,
        `evaluation_provenance_bindings[${index}].task_id`,
        suiteResultPath,
      );
      if (!expectedTaskIds.includes(taskId)) {
        throw new Error(
          `Foundry Lab suite result evaluation_provenance_bindings[].task_id is not in the suite: ${suiteResultPath}`,
        );
      }
      if (!taskScopedProvenanceRoles.has(receiptRole)) {
        throw new Error(
          `Foundry Lab suite result has non-canonical task-scoped evaluation provenance binding: ${suiteResultPath}`,
        );
      }
    }
    return record;
  });
  for (const taskId of expectedTaskIds) {
    if (!provenanceBindings.some((binding) => binding.task_id === taskId)) {
      throw new Error(
        `Foundry Lab suite result requires task-scoped evaluation provenance binding for ${taskId}: ${suiteResultPath}`,
      );
    }
  }
  const canonicalBindings = canonicalProvenanceBindings(provenanceBindings);
  const canonicalBindingKeys = canonicalBindings.map((binding) => JSON.stringify(binding));
  if (uniqueStrings(canonicalBindingKeys).length !== canonicalBindingKeys.length) {
    throw new Error(`Foundry Lab suite result has duplicate evaluation provenance binding: ${suiteResultPath}`);
  }
  const bindingRefs = uniqueStrings(canonicalBindings.map((binding) => String(binding.receipt_ref)));
  if (!sameStringSet(bindingRefs, provenanceRefs)) {
    throw new Error(
      `Foundry Lab suite result evaluation provenance refs and bindings do not match: ${suiteResultPath}`,
    );
  }

  const executionReceiptRef = jsonObject(execution.receipt)?.foundry_lab_execution_receipt_ref;
  return {
    ...result,
    result_id: resultId,
    suite_id: resultSuiteId,
    status,
    evaluation_target_agent: expectedTarget,
    refs: { ...refs, evaluation_provenance_refs: provenanceRefs },
    evaluation_provenance_bindings: canonicalBindings,
    runs: result.runs,
    ...(typeof executionReceiptRef === 'string'
      ? { foundry_lab_execution_receipt_ref: executionReceiptRef.trim() }
      : {}),
  } as SuiteResult;
}

function suiteTaskFamilies(suite: JsonObject): string[] {
  return uniqueStrings((Array.isArray(suite.tasks) ? suite.tasks : [])
    .map((task) => task.task_family)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim()));
}

function feedbackProfiles({
  suite,
  suiteRefs,
}: {
  suite: JsonObject;
  suiteRefs: string[];
}): string[] {
  const joined = [
    String(suite.suite_id ?? ''),
    String(suite.suite_kind ?? ''),
    ...suiteTaskFamilies(suite),
    ...suiteRefs,
  ].join('\n').toLowerCase();
  const normalizedJoined = joined.replace(/-/g, '_');
  const profiles: string[] = [];
  if (
    normalizedJoined.includes('high_quality_medical_manuscript')
    || normalizedJoined.includes('reviewer_revision')
    || normalizedJoined.includes('feedback')
  ) {
    profiles.push('target_agent_feedback_external_suite');
  }
  if (
    normalizedJoined.includes('high_quality_medical_manuscript')
    || normalizedJoined.includes('reviewer_revision')
  ) {
    profiles.push('mas_feedback_agent_lab_external_suite');
  }
  if (normalizedJoined.includes('high_quality_medical_manuscript')) {
    profiles.push('high_quality_medical_manuscript_feedback');
  }
  if (normalizedJoined.includes('reviewer_revision')) {
    profiles.push('reviewer_revision_feedback');
  }
  return uniqueStrings(profiles);
}

function reviewerEvidenceRefs({
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
  suiteRefs,
}: {
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
  suiteRefs: string[];
}): string[] {
  return uniqueStrings([
    aiReviewerEvaluationRef,
    ...aiReviewerEvaluation.source_refs,
    ...aiReviewerEvaluation.direct_evidence_refs,
    ...suiteRefs.filter((ref) =>
      ref.includes('review')
      || ref.includes('reviewer')
      || ref.includes('evidence')
      || ref.includes('rubric-gap:')
      || ref.includes('quality-scorecard:')
      || ref.includes('quality-gate:')
    ),
  ]);
}

function sourceFeedbackRefs({
  suite,
  feedbackRef,
}: {
  suite: JsonObject;
  feedbackRef: string | null;
}): string[] {
  return uniqueStrings([
    ...(feedbackRef ? [feedbackRef] : []),
    ...(Array.isArray(suite.tasks) ? suite.tasks : []).flatMap((task) => [
      ...arrayOfStrings(task.feedback_refs),
      ...arrayOfStrings(task.reviewer_evidence_refs),
    ]),
  ]);
}

function buildExternalSuiteConsumptionContract({
  suite,
  suiteResult,
  targetAgent,
  feedbackRef,
  suiteRefs,
  reviewerRefs,
  developerPatchWorkOrder,
}: {
  suite: JsonObject;
  suiteResult: SuiteResult;
  targetAgent: TargetAgent;
  feedbackRef: string | null;
  suiteRefs: string[];
  reviewerRefs: string[];
  developerPatchWorkOrder: JsonObject;
}): JsonObject {
  const profiles = feedbackProfiles({ suite, suiteRefs });
  const targetCloseoutRefs = arrayOfStrings(developerPatchWorkOrder.target_closeout_refs);
  return {
    source_external_suite_intake: {
      surface_kind: 'opl_meta_agent_external_agent_lab_suite_intake',
      status: 'accepted_external_agent_lab_suite_input',
      suite_id: suite.suite_id,
      suite_kind: suite.suite_kind,
      accepted_input_profiles: profiles,
      task_families: suiteTaskFamilies(suite),
      target_agent: targetAgent.domain_id,
      source_agent_lab_result_ref: suiteResult.result_id,
      feedback_ref: feedbackRef,
      source_feedback_refs: sourceFeedbackRefs({ suite, feedbackRef }),
      consumed_as_refs_only: true,
      authority_boundary: {
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_domain_quality_or_export: false,
        can_promote_default_agent_without_gate: false,
      },
    },
    reviewer_evidence_refs: reviewerRefs,
    target_owner_closeout_refs: targetCloseoutRefs,
    opl_work_order_delegation_aperture: {
      delegates_to_opl_work_order_execute: true,
      primitive_owner: 'one-person-lab/OPL',
      command: 'work-order execute',
      executor_first: true,
      executor: 'codex_cli',
      executor_lease_ref: developerPatchWorkOrder.executor_lease_ref,
      patch_execution_bundle_ref: developerPatchWorkOrder.patch_execution_bundle_ref,
      target_owner_closeout_refs: targetCloseoutRefs,
      owner_closeout_hook_delegated: true,
      target_owner_closeout_owner: 'target-domain via OPL',
      oma_can_manage_target_worktree_lifecycle: false,
      oma_can_write_owner_receipt_body: false,
      required_opl_work_order_primitive_refs: developerPatchWorkOrder.required_opl_work_order_primitive_refs,
      authority_boundary: {
        can_manage_target_worktree_lifecycle: false,
        can_absorb_target_branch: false,
        can_clean_target_worktree: false,
        can_invoke_target_owner_closeout_hook: false,
        can_write_target_owner_receipt_body: false,
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_domain_quality_or_export: false,
        can_promote_default_agent_without_gate: false,
      },
    },
  };
}

function improvementAreaForTarget(targetAgent: TargetAgent): string {
  return `${targetAgent.domain_id.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_agent_lab_result_consumption_capability`;
}

function traceabilityStatus({
  suiteResult,
  patchTraceabilityMatrix,
}: {
  suiteResult: SuiteResult;
  patchTraceabilityMatrix: PatchTraceabilityEntry[];
}): string {
  if (patchTraceabilityMatrix.length > 0) {
    return 'gap_to_patch_refs_mapped';
  }
  return suiteResult.status === 'passed'
    ? 'no_source_patch_required'
    : 'target_owned_patch_refs_missing';
}

function missingTargetImprovementPolicyFields({
  suiteResult,
  proposedChangeRefs,
  patchTraceabilityMatrix,
}: {
  suiteResult: SuiteResult;
  proposedChangeRefs: string[];
  patchTraceabilityMatrix: PatchTraceabilityEntry[];
}): string[] {
  if (suiteResult.status === 'passed') {
    return [];
  }
  const missing: string[] = [];
  if (proposedChangeRefs.length === 0) {
    missing.push('target_improvement_policy.proposed_change_refs');
  }
  if (patchTraceabilityMatrix.length === 0) {
    missing.push('target_improvement_policy.patch_traceability_matrix');
  }
  if (
    patchTraceabilityMatrix.some((entry) =>
      entry.canonical_target_paths.length === 0 && entry.target_repo_file_hints.length === 0
    )
  ) {
    missing.push('target_improvement_policy.capability_map_or_explicit_policy_canonical_paths');
  }
  if (
    patchTraceabilityMatrix.some((entry) => entry.capability_verification_refs.length === 0)
  ) {
    missing.push('target_improvement_policy.capability_map_or_explicit_policy_verification_refs');
  }
  if (
    patchTraceabilityMatrix.some((entry) => entry.forbidden_target_paths_or_surfaces.length === 0)
  ) {
    missing.push('target_improvement_policy.capability_map_or_explicit_policy_forbidden_surfaces');
  }
  return missing;
}

function buildCapabilityCandidate({
  targetAgent,
  suite,
  suiteResult,
  proposedChangeRefs,
  suiteRefs,
  feedbackRef,
  patchTraceabilityMatrix,
  efficiencyNonRegressionRefs,
  domainPackSummary,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  proposedChangeRefs: string[];
  suiteRefs: string[];
  feedbackRef: string | null;
  patchTraceabilityMatrix: PatchTraceabilityEntry[];
  efficiencyNonRegressionRefs: EfficiencyNonRegressionRefs;
  domainPackSummary: DomainPackSummary;
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
  policy: TargetImprovementPolicy;
}): CapabilityCandidate {
  return {
    surface_kind: 'opl_meta_agent_target_agent_capability_improvement_candidate',
    version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
    candidate_id: stableId('oma_target_capability_candidate', [
      targetAgent.domain_id,
      targetAgent.target_agent_ref,
      targetAgent.descriptor_ref,
      suite.suite_id,
      suiteResult.result_id,
      suiteResult.evaluation_target_agent,
      canonicalProvenanceBindings(suiteResult.evaluation_provenance_bindings),
      [...proposedChangeRefs].sort(),
    ]),
    status: 'candidate_recorded_requires_target_owner_gate',
    product_id: 'opl-meta-agent',
    target_agent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      delivery_domain: targetAgent.delivery_domain,
      repo_dir: targetAgent.repo_dir,
      target_agent_ref: targetAgent.target_agent_ref,
      descriptor_ref: targetAgent.descriptor_ref,
    },
    source_agent_lab_suite: {
      suite_id: suite.suite_id,
      suite_kind: suite.suite_kind,
      result_id: suiteResult.result_id,
      result_status: suiteResult.status,
      suite_passed: suiteResult.status === 'passed',
    },
    evaluation_target_agent: suiteResult.evaluation_target_agent,
    evaluation_provenance_refs: suiteResult.refs.evaluation_provenance_refs,
    evaluation_provenance_bindings: suiteResult.evaluation_provenance_bindings,
    feedback_ref: feedbackRef,
    ai_reviewer_evaluation: aiReviewerEvaluation,
    ...aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationRef),
    improvement_area: improvementAreaForTarget(targetAgent),
    failure_taxonomy_refs: suiteRefs.filter((ref) =>
      ref.includes('rubric-gap:')
      || ref.includes('metric-ref:')
      || ref.includes('quality-scorecard:')
      || ref.includes('repair-ref:')
    ).concat(aiReviewerEvaluation.source_refs),
    proposed_change_refs: proposedChangeRefs,
    patch_traceability_matrix: patchTraceabilityMatrix,
    efficiency_non_regression_refs: efficiencyNonRegressionRefs,
    traceability_status: traceabilityStatus({
      suiteResult,
      patchTraceabilityMatrix,
    }),
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    target_editable_surface_refs: targetEditableSurfaceRefs(proposedChangeRefs),
    external_learning_refs: policy.externalLearningRefs,
    foundry_lab_execution_receipt_ref: suiteResult.foundry_lab_execution_receipt_ref,
    authority_boundary: {
      source_patch_allowed_after_owner_gate: suiteResult.status !== 'passed',
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

export function runImproveFromAgentLabSuite({
  suitePath,
  suiteResultPath,
  targetAgentDir,
  outputDir,
  feedbackRef,
  aiReviewerEvaluationPath,
}: ImproveArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);
  const suite = readJson(suitePath);
  const targetAgent = readTargetAgent(targetAgentDir);
  const suiteResult = readFoundryLabSuiteResult(suiteResultPath, suite, targetAgent);
  const policy = targetImprovementPolicy(targetAgentDir);

  const suiteRefs = collectSuiteRefs(suite);
  const directReviewerEvidenceRefs = reviewerEvidenceRefs({
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    suiteRefs,
  });
  const proposedChangeRefs = inferProposedChangeRefs({
    suiteRefs,
    aiReviewerEvaluation,
    policy,
  });
  const patchTraceabilityMatrix = buildPatchTraceabilityMatrix({
    suiteRefs,
    proposedChangeRefs,
    aiReviewerEvaluation,
    policy,
  });
  const efficiencyNonRegressionRefs = collectEfficiencyNonRegressionRefs(suite, aiReviewerEvaluation);
  const capabilityCandidate = buildCapabilityCandidate({
    targetAgent,
    suite,
    suiteResult,
    proposedChangeRefs,
    suiteRefs,
    feedbackRef,
    patchTraceabilityMatrix,
    efficiencyNonRegressionRefs,
    domainPackSummary,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    policy,
  });
  const capabilityPath = path.join(outputDir, 'target-capability-improvement-candidate.json');
  const missingFields = [
    ...missingEfficiencyNonRegressionFields(capabilityCandidate.efficiency_non_regression_refs),
    ...missingTargetImprovementPolicyFields({
      suiteResult,
      proposedChangeRefs,
      patchTraceabilityMatrix,
    }),
    ...(typeof suiteResult.foundry_lab_execution_receipt_ref === 'string'
      && suiteResult.foundry_lab_execution_receipt_ref.length > 0
      ? []
      : ['foundry_lab_execution_receipt_ref']),
  ];

  if (missingFields.length > 0) {
    const expectedTypedBlockerRef = buildExpectedTypedBlockerRef(
      targetAgent.domain_id,
      capabilityCandidate.candidate_id,
      'developer_work_order_inputs_missing',
    );
    capabilityCandidate.status = 'candidate_blocked_missing_declarative_work_order_inputs';
    capabilityCandidate.missing_required_fields = uniqueStrings(missingFields);
    capabilityCandidate.expected_typed_blocker_ref = expectedTypedBlockerRef;
    writeJson(capabilityPath, capabilityCandidate);
    return {
      surface_kind: 'opl_meta_agent_external_suite_judgment',
      version: 'opl-meta-agent.external-suite-judgment.v1',
      status: 'candidate_blocked_missing_declarative_work_order_inputs',
      product_id: 'opl-meta-agent',
      target_agent: capabilityCandidate.target_agent,
      source_agent_lab_result_ref: suiteResult.result_id,
      evaluation_target_agent: suiteResult.evaluation_target_agent,
      evaluation_provenance_refs: suiteResult.refs.evaluation_provenance_refs,
      candidate_refs: [capabilityCandidate.candidate_id, expectedTypedBlockerRef],
      missing_required_fields: uniqueStrings(missingFields),
      artifacts: {
        target_capability_improvement_candidate_path: capabilityPath,
      },
      authority_boundary: {
        ...capabilityCandidate.authority_boundary,
        typed_blocker_body_materialized_by_oma: false,
        executable_work_order_materialized: false,
      },
    };
  }

  if (suiteResult.status === 'passed') {
    capabilityCandidate.status = 'evaluated_no_source_patch_required';
    writeJson(capabilityPath, capabilityCandidate);
    return {
      surface_kind: 'opl_meta_agent_external_suite_judgment',
      version: 'opl-meta-agent.external-suite-judgment.v1',
      status: 'no_source_patch_required',
      product_id: 'opl-meta-agent',
      target_agent: capabilityCandidate.target_agent,
      source_agent_lab_result_ref: suiteResult.result_id,
      foundry_lab_execution_receipt_ref: suiteResult.foundry_lab_execution_receipt_ref,
      evaluation_target_agent: suiteResult.evaluation_target_agent,
      evaluation_provenance_refs: suiteResult.refs.evaluation_provenance_refs,
      candidate_refs: [capabilityCandidate.candidate_id],
      artifacts: {
        target_capability_improvement_candidate_path: capabilityPath,
      },
      authority_boundary: capabilityCandidate.authority_boundary,
    };
  }

  const developerPatchWorkOrder = buildDeveloperPatchWorkOrder({
    targetAgent,
    suite,
    suiteResult,
    foundryLabExecutionReceiptRef: String(suiteResult.foundry_lab_execution_receipt_ref),
    capabilityCandidate,
    policy,
  });
  Object.assign(developerPatchWorkOrder, buildExternalSuiteConsumptionContract({
    suite,
    suiteResult,
    targetAgent,
    feedbackRef,
    suiteRefs,
    reviewerRefs: directReviewerEvidenceRefs,
    developerPatchWorkOrder,
  }));
  Object.assign(developerPatchWorkOrder.work_order_completeness as JsonObject, {
    reviewer_evidence: { refs: directReviewerEvidenceRefs },
    opl_work_order_delegation_aperture: developerPatchWorkOrder.opl_work_order_delegation_aperture,
  });
  validateDeveloperPatchWorkOrder(developerPatchWorkOrder);
  const workOrderPath = path.join(outputDir, 'developer-patch-work-order.json');
  writeJson(capabilityPath, capabilityCandidate);
  writeJson(workOrderPath, developerPatchWorkOrder);

  return {
    surface_kind: 'opl_meta_agent_external_suite_judgment',
    version: 'opl-meta-agent.external-suite-judgment.v1',
    status: 'developer_patch_work_order_ready_for_opl_foundry_lab',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    foundry_lab_execution_receipt_ref: suiteResult.foundry_lab_execution_receipt_ref,
    evaluation_target_agent: suiteResult.evaluation_target_agent,
    evaluation_provenance_refs: suiteResult.refs.evaluation_provenance_refs,
    candidate_refs: [
      capabilityCandidate.candidate_id,
      developerPatchWorkOrder.work_order_id,
    ],
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    artifacts: {
      target_capability_improvement_candidate_path: capabilityPath,
      developer_patch_work_order_path: workOrderPath,
    },
    agent_building_judgment: {
      target_capability_improvement_candidate: capabilityCandidate,
      developer_patch_work_order: developerPatchWorkOrder,
    },
    authority_boundary: {
      ...capabilityCandidate.authority_boundary,
      oma_can_execute_agent_lab_suite: false,
      oma_can_execute_developer_work_order: false,
      oma_can_write_owner_receipt_body: false,
      oma_can_write_typed_blocker_body: false,
      oma_can_manage_target_worktree_lifecycle: false,
    },
  };
}

function main() {
  const payload = runImproveFromAgentLabSuite(parseImproveFromAgentLabSuiteArgs(process.argv.slice(2)));

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

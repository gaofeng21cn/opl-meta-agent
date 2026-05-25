import fs from 'node:fs';
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';
import { readJson } from './meta-agent-loop-io.ts';

export type AiReviewerEvaluation = JsonObject & {
  reviewer_kind: string;
  model_or_provider: string;
  run_ref: string;
  execution_attempt_ref: string;
  review_attempt_ref: string;
  no_shared_context: boolean;
  independent_attempt: boolean;
  critique: string;
  suggestions: string[];
  source_refs: string[];
  direct_evidence_refs: string[];
  verdict: string;
  predicted_impact: string;
  provenance: JsonObject;
  canary_refs?: string[];
  rollback_refs?: string[];
  version_refs?: string[];
};

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);
}

function suiteOrScaffoldOnlyRef(ref: string): boolean {
  const normalized = ref.toLowerCase();
  return normalized.includes('suite') || normalized.includes('scaffold');
}

function validateAiReviewerEvaluation(
  payload: JsonObject,
  sourceRef: string,
): AiReviewerEvaluation {
  const errors: string[] = [];
  for (const field of [
    'reviewer_kind',
    'model_or_provider',
    'run_ref',
    'execution_attempt_ref',
    'review_attempt_ref',
    'critique',
    'verdict',
    'predicted_impact',
  ]) {
    if (!nonEmptyString(payload[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (payload.no_shared_context !== true) {
    errors.push('no_shared_context must be true');
  }
  if (payload.independent_attempt !== true) {
    errors.push('independent_attempt must be true');
  }
  if (
    nonEmptyString(payload.execution_attempt_ref)
    && nonEmptyString(payload.review_attempt_ref)
    && payload.execution_attempt_ref.trim() === payload.review_attempt_ref.trim()
  ) {
    errors.push('execution_attempt_ref and review_attempt_ref must be different');
  }
  if (!nonEmptyStringArray(payload.suggestions)) {
    errors.push('suggestions must be a non-empty string array');
  }
  if (!nonEmptyStringArray(payload.source_refs)) {
    errors.push('source_refs must be a non-empty string array');
  } else if ((payload.source_refs as string[]).every(suiteOrScaffoldOnlyRef)) {
    errors.push('source_refs must include reviewer evidence beyond suite/scaffold refs');
  }
  if (!nonEmptyStringArray(payload.direct_evidence_refs)) {
    errors.push('direct_evidence_refs must be a non-empty string array');
  } else if ((payload.direct_evidence_refs as string[]).every(suiteOrScaffoldOnlyRef)) {
    errors.push('direct_evidence_refs must include direct evidence beyond suite/scaffold refs');
  }
  if (!payload.provenance || typeof payload.provenance !== 'object' || Array.isArray(payload.provenance)) {
    errors.push('provenance must be a non-empty object');
  } else if (Object.keys(payload.provenance).length === 0) {
    errors.push('provenance must be a non-empty object');
  }
  for (const field of ['canary_refs', 'rollback_refs', 'version_refs']) {
    if (payload[field] !== undefined && !nonEmptyStringArray(payload[field])) {
      errors.push(`${field} must be a non-empty string array when present`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid AI reviewer evaluation ${sourceRef}: ${errors.join('; ')}`);
  }

  return {
    ...payload,
    reviewer_kind: payload.reviewer_kind.trim(),
    model_or_provider: payload.model_or_provider.trim(),
    run_ref: payload.run_ref.trim(),
    execution_attempt_ref: payload.execution_attempt_ref.trim(),
    review_attempt_ref: payload.review_attempt_ref.trim(),
    no_shared_context: true,
    independent_attempt: true,
    critique: payload.critique.trim(),
    suggestions: (payload.suggestions as string[]).map((suggestion) => suggestion.trim()),
    source_refs: (payload.source_refs as string[]).map((ref) => ref.trim()),
    direct_evidence_refs: (payload.direct_evidence_refs as string[]).map((ref) => ref.trim()),
    verdict: payload.verdict.trim(),
    predicted_impact: payload.predicted_impact.trim(),
    provenance: payload.provenance,
    ...(payload.canary_refs !== undefined
      ? { canary_refs: (payload.canary_refs as string[]).map((ref) => ref.trim()) }
      : {}),
    ...(payload.rollback_refs !== undefined
      ? { rollback_refs: (payload.rollback_refs as string[]).map((ref) => ref.trim()) }
      : {}),
    ...(payload.version_refs !== undefined
      ? { version_refs: (payload.version_refs as string[]).map((ref) => ref.trim()) }
      : {}),
  };
}

export function loadAiReviewerEvaluation(filePath: string): AiReviewerEvaluation {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`AI reviewer evaluation path does not exist: ${resolvedPath}`);
  }
  return validateAiReviewerEvaluation(readJson(resolvedPath), resolvedPath);
}

export function aiReviewerReceiptFields(
  aiReviewerEvaluation: AiReviewerEvaluation,
  aiReviewerEvaluationRef: string,
): JsonObject {
  return {
    ai_reviewer_evaluation_ref: aiReviewerEvaluationRef,
    ai_reviewer_review: {
      reviewer_kind: aiReviewerEvaluation.reviewer_kind,
      model_or_provider: aiReviewerEvaluation.model_or_provider,
      run_ref: aiReviewerEvaluation.run_ref,
      execution_attempt_ref: aiReviewerEvaluation.execution_attempt_ref,
      review_attempt_ref: aiReviewerEvaluation.review_attempt_ref,
      critique: aiReviewerEvaluation.critique,
      suggestions: aiReviewerEvaluation.suggestions,
      predicted_impact: aiReviewerEvaluation.predicted_impact,
    },
    ai_reviewer_independence: {
      no_shared_context: aiReviewerEvaluation.no_shared_context,
      independent_attempt: aiReviewerEvaluation.independent_attempt,
      execution_attempt_ref: aiReviewerEvaluation.execution_attempt_ref,
      review_attempt_ref: aiReviewerEvaluation.review_attempt_ref,
      direct_evidence_refs: aiReviewerEvaluation.direct_evidence_refs,
    },
    ai_reviewer_evidence: {
      source_refs: aiReviewerEvaluation.source_refs,
      direct_evidence_refs: aiReviewerEvaluation.direct_evidence_refs,
    },
    ai_reviewer_scorecard: {
      verdict: aiReviewerEvaluation.verdict,
      predicted_impact: aiReviewerEvaluation.predicted_impact,
    },
    ai_reviewer_recovery_refs: {
      canary_refs: aiReviewerEvaluation.canary_refs ?? [],
      rollback_refs: aiReviewerEvaluation.rollback_refs ?? [],
      version_refs: aiReviewerEvaluation.version_refs ?? [],
    },
    review_provenance: {
      reviewer_kind: aiReviewerEvaluation.reviewer_kind,
      model_or_provider: aiReviewerEvaluation.model_or_provider,
      run_ref: aiReviewerEvaluation.run_ref,
      execution_attempt_ref: aiReviewerEvaluation.execution_attempt_ref,
      review_attempt_ref: aiReviewerEvaluation.review_attempt_ref,
      ...aiReviewerEvaluation.provenance,
    },
  };
}

export function aiReviewerAcceptanceGates(): JsonObject {
  return {
    ai_reviewer_evaluation_present: true,
    ai_reviewer_critique_present: true,
    ai_reviewer_suggestions_present: true,
    ai_reviewer_source_refs_valid: true,
    ai_reviewer_direct_evidence_refs_present: true,
    ai_reviewer_direct_evidence_refs_valid: true,
    ai_reviewer_provenance_present: true,
    ai_reviewer_no_shared_context: true,
    ai_reviewer_independent_attempt_present: true,
    ai_reviewer_attempt_refs_distinct: true,
  };
}

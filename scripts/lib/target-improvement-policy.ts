import fs from 'node:fs';
import path from 'node:path';
import type { AiReviewerEvaluation, TargetAgent } from './meta-agent-loop.ts';
import { readJson } from './meta-agent-loop.ts';
import type { JsonObject } from './domain-pack.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
  DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
} from './work-order-policy-constants.ts';
import {
  records,
  stringList,
  stringValue,
  uniqueRefs,
} from './work-order-refs.ts';

type ChangeRefMapping = {
  token: string;
  refs: string[];
};

export type PatchTraceabilityEntry = JsonObject & {
  gap_token: string;
  failure_evidence: string[];
  root_cause: string;
  targeted_fix: string[];
  predicted_impact: string;
  source_failure_refs: string[];
  required_patch_refs: string[];
  editable_surface_refs: string[];
  target_repo_file_hints: string[];
  required_verification_refs: string[];
  ai_reviewer_suggestions: string[];
  ai_reviewer_source_refs: string[];
};

export type TargetImprovementPolicy = {
  defaultChangeRefs: string[];
  defaultChangeRefTriggers: string[];
  changeRefMappings: ChangeRefMapping[];
  patchSurfaceHints: Record<string, string[]>;
  externalLearningRefs: string[];
  forbiddenTargetPathsOrSurfaces: string[];
  runtimeRequiredSurfaceRefs: string[];
  runtimeExpectedOutcomes: string[];
};

const OWNER_RECEIPT_CHANGE_REFS = [
  {
    token: 'live-acceptance',
    refs: [
      'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
      'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
    ],
  },
  {
    token: 'owner-receipt',
    refs: [
      'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
      'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
    ],
  },
  {
    token: 'package',
    refs: [
      'target_agent_delivery_policy_ref:target_agent/package-owner-closeout',
      'target_agent_quality_gate_ref:target_agent/export-owner',
    ],
  },
  {
    token: 'typed-blocker',
    refs: [
      'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
      'target_agent_regression_suite_ref:target_agent/owner-boundary',
    ],
  },
];

const OWNER_RECEIPT_DEFAULT_CHANGE_REFS = [
  'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
  'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
  'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
  'target_agent_quality_gate_ref:target_agent/export-owner',
  'target_agent_regression_suite_ref:target_agent/owner-boundary',
];

const GENERIC_IMPROVEMENT_POLICY: TargetImprovementPolicy = {
  defaultChangeRefs: [
    'target_agent_stage_policy_ref:external_agent/failure_taxonomy_to_mechanism_candidate',
    'target_agent_rubric_ref:external_agent/domain_quality_scorecard',
    'target_agent_regression_suite_ref:external_agent/blocked_suite_replay',
  ],
  defaultChangeRefTriggers: [],
  changeRefMappings: [],
  patchSurfaceHints: {},
  externalLearningRefs: [],
  forbiddenTargetPathsOrSurfaces: DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  runtimeRequiredSurfaceRefs: DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
  runtimeExpectedOutcomes: DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
};

function optionalJson(targetAgentDir: string, relativePath: string): JsonObject | null {
  const filePath = path.join(targetAgentDir, relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJson(filePath);
}

function mappingFromRecord(entry: JsonObject): ChangeRefMapping | null {
  const token = stringValue(entry.token) ?? stringValue(entry.gap_token) ?? stringValue(entry.trigger_token);
  const refs = uniqueRefs([
    ...stringList(entry.refs),
    ...stringList(entry.required_patch_refs),
    ...stringList(entry.change_refs),
  ]);
  if (!token || refs.length === 0) {
    return null;
  }
  return { token, refs };
}

function collectPatchSurfaceHints(...sources: Array<JsonObject | null>): Record<string, string[]> {
  const hints: Record<string, string[]> = {};
  for (const source of sources) {
    const raw = source?.meta_agent_work_order_contract?.patch_surface_hints
      ?? source?.oma_handoff?.patch_surface_hints
      ?? source?.external_suite_improvement_policy?.patch_surface_hints
      ?? source?.patch_surface_hints
      ?? {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    for (const [surface, values] of Object.entries(raw as Record<string, unknown>)) {
      hints[surface] = uniqueRefs([...(hints[surface] ?? []), ...stringList(values)]);
    }
  }
  return hints;
}

function collectMappings(...sources: Array<JsonObject | null>): ChangeRefMapping[] {
  return sources.flatMap((source) => [
    ...records(source?.external_suite_improvement_policy?.change_ref_mappings),
    ...records(source?.meta_agent_work_order_contract?.change_ref_mappings),
    ...records(source?.oma_handoff?.change_ref_mappings),
    ...records(source?.change_ref_mappings),
  ]).map(mappingFromRecord).filter((entry): entry is ChangeRefMapping => Boolean(entry));
}

export function targetImprovementPolicy(targetAgentDir: string): TargetImprovementPolicy {
  const agentLabHandoff = optionalJson(targetAgentDir, 'contracts/agent_lab_handoff.json');
  const omaHandoff = optionalJson(targetAgentDir, 'contracts/oma_handoff_refs.json');
  const generatedSurfaceHandoff = optionalJson(targetAgentDir, 'contracts/generated_surface_handoff.json');
  const productionAcceptanceDir = path.join(targetAgentDir, 'contracts/production_acceptance');
  const productionAcceptances = fs.existsSync(productionAcceptanceDir)
    ? fs.readdirSync(productionAcceptanceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => readJson(path.join(productionAcceptanceDir, entry.name)))
    : [];
  const sources = [agentLabHandoff, omaHandoff, generatedSurfaceHandoff, ...productionAcceptances];
  const defaultChangeRefs = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.default_change_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.default_change_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.default_change_refs)),
  ]);
  const defaultChangeRefTriggers = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.default_change_ref_triggers)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.default_change_ref_triggers)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.default_change_ref_triggers)),
  ]);
  const externalLearningRefs = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.external_learning_refs)),
  ]);
  const forbiddenTargetPathsOrSurfaces = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.forbidden_target_writes)),
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.forbidden_target_paths_or_surfaces)),
    ...stringList(generatedSurfaceHandoff?.generated_surface_policy?.must_not_write),
  ]);
  const runtimeRequiredSurfaceRefs = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.runtime_required_surface_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.runtime_required_surface_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.runtime_required_surface_refs)),
  ]);
  const runtimeExpectedOutcomes = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.runtime_expected_outcomes)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.runtime_expected_outcomes)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.runtime_expected_outcomes)),
  ]);
  return {
    defaultChangeRefs: defaultChangeRefs.length ? defaultChangeRefs : GENERIC_IMPROVEMENT_POLICY.defaultChangeRefs,
    defaultChangeRefTriggers,
    changeRefMappings: collectMappings(...sources),
    patchSurfaceHints: collectPatchSurfaceHints(...sources),
    externalLearningRefs,
    forbiddenTargetPathsOrSurfaces: forbiddenTargetPathsOrSurfaces.length
      ? forbiddenTargetPathsOrSurfaces
      : GENERIC_IMPROVEMENT_POLICY.forbiddenTargetPathsOrSurfaces,
    runtimeRequiredSurfaceRefs: runtimeRequiredSurfaceRefs.length
      ? runtimeRequiredSurfaceRefs
      : GENERIC_IMPROVEMENT_POLICY.runtimeRequiredSurfaceRefs,
    runtimeExpectedOutcomes: runtimeExpectedOutcomes.length
      ? runtimeExpectedOutcomes
      : GENERIC_IMPROVEMENT_POLICY.runtimeExpectedOutcomes,
  };
}

function textMatchesToken(text: string, token: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedToken = token.toLowerCase();
  if (normalizedText.includes(normalizedToken)) {
    return true;
  }
  const tokenWords = normalizedToken.split(/[-_]/).filter((word) => word.length > 2);
  return tokenWords.length > 0 && tokenWords.every((word) => normalizedText.includes(word));
}

function reviewerEvidenceText(aiReviewerEvaluation: AiReviewerEvaluation): string[] {
  return [
    aiReviewerEvaluation.critique,
    ...aiReviewerEvaluation.suggestions,
    ...aiReviewerEvaluation.source_refs,
    aiReviewerEvaluation.verdict,
  ];
}

export function inferProposedChangeRefs({
  suiteRefs,
  aiReviewerEvaluation,
  policy,
}: {
  suiteRefs: string[];
  aiReviewerEvaluation: AiReviewerEvaluation;
  policy: TargetImprovementPolicy;
}): string[] {
  const combined = [...suiteRefs, ...reviewerEvidenceText(aiReviewerEvaluation)].join('\n').toLowerCase();
  const inferred = new Set<string>();
  const triggeredByDefaultPolicy = policy.defaultChangeRefTriggers.length === 0
    ? false
    : policy.defaultChangeRefTriggers.some((token) => textMatchesToken(combined, token));
  if (triggeredByDefaultPolicy) {
    policy.defaultChangeRefs.forEach((ref) => inferred.add(ref));
  }
  if (
    combined.includes('owner-receipt')
    || combined.includes('owner_receipt')
    || combined.includes('live-acceptance')
    || combined.includes('production-acceptance')
    || combined.includes('production_acceptance')
  ) {
    OWNER_RECEIPT_DEFAULT_CHANGE_REFS.forEach((ref) => inferred.add(ref));
  }
  for (const mapping of policy.changeRefMappings) {
    if (combined.includes(mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
  }
  for (const mapping of OWNER_RECEIPT_CHANGE_REFS) {
    if (combined.includes(mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
  }
  if (inferred.size === 0) {
    policy.defaultChangeRefs.forEach((ref) => inferred.add(ref));
  }
  return [...inferred].sort();
}

export function buildPatchTraceabilityMatrix({
  suiteRefs,
  proposedChangeRefs,
  aiReviewerEvaluation,
  policy,
}: {
  suiteRefs: string[];
  proposedChangeRefs: string[];
  aiReviewerEvaluation: AiReviewerEvaluation;
  policy: TargetImprovementPolicy;
}): PatchTraceabilityEntry[] {
  const combined = [...suiteRefs, ...reviewerEvidenceText(aiReviewerEvaluation)].join('\n').toLowerCase();
  const sourceFailureRefs = [...suiteRefs, ...aiReviewerEvaluation.source_refs].filter((ref) =>
    ref.includes('rubric-gap:')
    || ref.includes('metric-ref:')
    || ref.includes('quality-scorecard:')
    || ref.includes('evidence-delta:')
    || ref.includes('owner-receipt')
    || ref.includes('production-acceptance')
    || ref.includes('owner_receipt')
    || ref.includes('typed-blocker')
  );
  const matrix = [];
  for (const mapping of [...policy.changeRefMappings, ...OWNER_RECEIPT_CHANGE_REFS]) {
    if (!textMatchesToken(combined, mapping.token)) {
      continue;
    }
    const requiredPatchRefs = mapping.refs.filter((ref: string) => proposedChangeRefs.includes(ref));
    const reviewerSuggestions = aiReviewerEvaluation.suggestions.filter((suggestion) =>
      textMatchesToken(suggestion, mapping.token)
    );
    const reviewerSourceRefs = aiReviewerEvaluation.source_refs.filter((ref) => textMatchesToken(ref, mapping.token));
    const failureEvidence = uniqueRefs([
      ...sourceFailureRefs.filter((ref) => textMatchesToken(ref, mapping.token)),
      ...reviewerSourceRefs,
      ...reviewerSuggestions.map((suggestion) => `ai-reviewer-suggestion:${suggestion}`),
    ]);
    matrix.push({
      gap_token: mapping.token,
      failure_evidence: failureEvidence.length ? failureEvidence : uniqueRefs([
        ...aiReviewerEvaluation.source_refs,
        ...aiReviewerEvaluation.direct_evidence_refs,
      ]),
      root_cause: `AI reviewer identified ${mapping.token} as a target-agent capability gap requiring owner-gated source changes.`,
      targeted_fix: requiredPatchRefs,
      predicted_impact: aiReviewerEvaluation.predicted_impact,
      source_failure_refs: sourceFailureRefs.filter((ref) => textMatchesToken(ref, mapping.token)),
      required_patch_refs: requiredPatchRefs,
      editable_surface_refs: surfaceRefsForPatchRefs(requiredPatchRefs),
      target_repo_file_hints: fileHintsForPatchRefs({
        patchRefs: requiredPatchRefs,
        policy,
      }),
      required_verification_refs: [
        'target_repo_test_receipt',
        'no_target_domain_truth_write_proof',
        'developer_patch_receipt',
      ],
      ai_reviewer_suggestions: reviewerSuggestions,
      ai_reviewer_source_refs: reviewerSourceRefs,
    });
  }
  return matrix;
}

function surfaceRefsForPatchRefs(patchRefs: string[]): string[] {
  const surfaces = new Set<string>();
  for (const ref of patchRefs) {
    const prefix = String(ref).split(':')[0];
    if (prefix) {
      surfaces.add(prefix);
    }
  }
  return [...surfaces].sort();
}

function fileHintsForPatchRefs({ patchRefs, policy }: { patchRefs: string[]; policy: TargetImprovementPolicy }): string[] {
  const files = new Set<string>();
  for (const surfaceRef of surfaceRefsForPatchRefs(patchRefs)) {
    for (const filePath of policy.patchSurfaceHints[surfaceRef] ?? []) {
      files.add(filePath);
    }
  }
  return [...files].sort();
}

export function targetEditableSurfaceRefs(proposedChangeRefs: string[]): string[] {
  return surfaceRefsForPatchRefs(proposedChangeRefs);
}

export function mechanismEditableSurfaces(proposedChangeRefs: string[]): string[] {
  return surfaceRefsForPatchRefs(proposedChangeRefs).map((surfaceRef) =>
    surfaceRef.startsWith('target_agent_') ? surfaceRef : `target_agent_${surfaceRef}`
  );
}

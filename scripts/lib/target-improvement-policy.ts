import fs from 'node:fs';
import path from 'node:path';
import type { AiReviewerEvaluation } from './meta-agent-loop-ai-reviewer.ts';
import { readJson } from './meta-agent-loop-io.ts';
import type { JsonObject } from './domain-pack.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
  DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
  records,
  stringList,
  stringValue,
  uniqueRefs,
} from './work-order-refs.ts';

type ChangeRefMapping = {
  token: string;
  refs: string[];
  capability?: CapabilityMapEntry;
};

export type CapabilityMapEntry = {
  capabilityId: string;
  capabilityRef: string;
  canonicalTargetPaths: string[];
  requiredVerificationRefs: string[];
  forbiddenTargetPathsOrSurfaces: string[];
  failureTokenRegistryRef: string | null;
  improvementTokens: string[];
  authorityBoundary: JsonObject;
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
  capability_ids: string[];
  canonical_target_paths: string[];
  capability_verification_refs: string[];
  forbidden_target_paths_or_surfaces: string[];
  failure_token_registry_refs: string[];
  improvement_tokens: string[];
  capability_authority_boundary: JsonObject;
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
  contextualForbiddenTargetPathsOrSurfaces: string[];
  runtimeRequiredSurfaceRefs: string[];
  contextualRuntimeRequiredSurfaceRefs: string[];
  runtimeExpectedOutcomes: string[];
  contextualRuntimeExpectedOutcomes: string[];
};

function optionalJson(targetAgentDir: string, relativePath: string): JsonObject | null {
  const filePath = path.join(targetAgentDir, relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJson(filePath);
}

function objectRecord(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function explicitPolicyCapability(token: string, entry: JsonObject, policy: JsonObject): CapabilityMapEntry | undefined {
  const authorityBoundary = Object.keys(objectRecord(entry.authority_boundary)).length > 0
    ? objectRecord(entry.authority_boundary)
    : objectRecord(policy.authority_boundary);
  const canonicalTargetPaths = uniqueRefs([
    ...stringList(policy.canonical_paths),
    ...stringList(policy.target_repo_file_hints),
    ...refsFromRefLike(policy.physical_source_ref),
    ...stringList(entry.canonical_paths),
    ...stringList(entry.target_repo_file_hints),
    ...refsFromRefLike(entry.physical_source_ref),
  ]);
  const requiredVerificationRefs = uniqueRefs([
    ...stringList(policy.verification_refs),
    ...stringList(policy.required_verification_refs),
    ...stringList(entry.verification_refs),
    ...stringList(entry.required_verification_refs),
  ]);
  const forbiddenTargetPathsOrSurfaces = uniqueRefs([
    ...stringList(policy.forbidden_surfaces),
    ...stringList(policy.forbidden_target_paths_or_surfaces),
    ...stringList(policy.forbidden_target_writes),
    ...stringList(entry.forbidden_surfaces),
    ...stringList(entry.forbidden_target_paths_or_surfaces),
    ...stringList(entry.forbidden_target_writes),
    ...stringList(authorityBoundary.forbidden_surfaces),
  ]);
  const failureTokenRegistryRef = stringValue(entry.failure_token_registry_ref)
    ?? stringValue(policy.failure_token_registry_ref);
  const improvementTokens = uniqueRefs([
    ...stringList(policy.improvement_tokens),
    ...stringList(policy.failure_tokens),
    ...stringList(policy.trigger_terms),
    ...stringList(policy.triggers),
    ...stringList(entry.improvement_tokens),
    ...stringList(entry.failure_tokens),
    ...stringList(entry.trigger_terms),
    ...stringList(entry.triggers),
    token,
  ]);
  if (
    canonicalTargetPaths.length === 0
    && requiredVerificationRefs.length === 0
    && forbiddenTargetPathsOrSurfaces.length === 0
    && !failureTokenRegistryRef
    && Object.keys(authorityBoundary).length === 0
  ) {
    return undefined;
  }
  const capabilityId = stringValue(entry.capability_id)
    ?? stringValue(policy.capability_id)
    ?? token;
  const capabilityRef = stringValue(entry.capability_ref)
    ?? stringValue(policy.capability_ref)
    ?? `explicit_policy_${slug(capabilityId)}`;
  return {
    capabilityId,
    capabilityRef,
    canonicalTargetPaths,
    requiredVerificationRefs,
    forbiddenTargetPathsOrSurfaces,
    failureTokenRegistryRef,
    improvementTokens,
    authorityBoundary,
  };
}

function mappingFromRecord(entry: JsonObject, metadataSource: JsonObject = {}): ChangeRefMapping | null {
  const token = stringValue(entry.token) ?? stringValue(entry.gap_token) ?? stringValue(entry.trigger_token);
  const refs = uniqueRefs([
    ...stringList(entry.refs),
    ...stringList(entry.required_patch_refs),
    ...stringList(entry.change_refs),
  ]);
  if (!token || refs.length === 0) {
    return null;
  }
  const capability = explicitPolicyCapability(token, entry, metadataSource);
  return { token, refs, ...(capability ? { capability } : {}) };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'capability';
}

function capabilityRecords(source: JsonObject | null): JsonObject[] {
  return [
    ...records(source?.capabilities),
    ...records(source?.capability_map?.capabilities),
  ];
}

function capabilityRef(entry: JsonObject): string | null {
  const capabilityId = stringValue(entry.capability_id) ?? stringValue(entry.id) ?? stringValue(entry.name);
  if (!capabilityId) {
    return null;
  }
  const kind = slug(stringValue(entry.kind) ?? stringValue(entry.capability_kind) ?? 'capability');
  return `${kind}_${slug(capabilityId)}`;
}

function refsFromRefLike(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(refsFromRefLike);
  }
  if (value && typeof value === 'object') {
    const record = value as JsonObject;
    return [
      ...(typeof record.ref === 'string' ? [record.ref] : []),
      ...(typeof record.path === 'string' ? [record.path] : []),
    ];
  }
  return [];
}

function capabilityMapEntry(source: JsonObject | null, entry: JsonObject): CapabilityMapEntry | null {
  const capabilityId = stringValue(entry.capability_id) ?? stringValue(entry.id) ?? stringValue(entry.name);
  const capabilityMapRef = capabilityRef(entry);
  if (!capabilityId || !capabilityMapRef) {
    return null;
  }
  const authorityBoundary = objectRecord(entry.authority_boundary);
  const fallbackRegistryRef = stringValue(source?.failure_token_registry_ref)
    ?? stringValue(source?.capability_map?.failure_token_registry_ref);
  return {
    capabilityId,
    capabilityRef: capabilityMapRef,
    canonicalTargetPaths: uniqueRefs([
      ...stringList(entry.canonical_paths),
      ...stringList(entry.paths),
      ...stringList(entry.target_repo_file_hints),
      ...refsFromRefLike(entry.physical_source_ref),
    ]),
    requiredVerificationRefs: uniqueRefs([
      ...stringList(entry.verification_refs),
      ...stringList(entry.required_verification_refs),
    ]),
    forbiddenTargetPathsOrSurfaces: uniqueRefs([
      ...stringList(entry.forbidden_surfaces),
      ...stringList(entry.forbidden_target_paths_or_surfaces),
      ...stringList(authorityBoundary.forbidden_surfaces),
    ]),
    failureTokenRegistryRef: stringValue(entry.failure_token_registry_ref) ?? fallbackRegistryRef,
    improvementTokens: uniqueRefs([
      ...stringList(entry.improvement_tokens),
      ...stringList(entry.failure_tokens),
      ...stringList(entry.trigger_terms),
      ...stringList(entry.triggers),
    ]),
    authorityBoundary,
  };
}

function capabilityMappings(source: JsonObject | null): ChangeRefMapping[] {
  return capabilityRecords(source).flatMap((entry) => {
    const capability = capabilityMapEntry(source, entry);
    if (!capability) {
      return [];
    }
    const tokens = uniqueRefs([
      ...capability.improvementTokens,
    ]);
    const refs = uniqueRefs([
      ...stringList(entry.refs),
      ...stringList(entry.required_patch_refs),
      ...stringList(entry.change_refs),
      capability.capabilityRef,
    ]);
    return tokens.map((token) => ({ token, refs, capability })).filter((mapping) => mapping.refs.length > 0);
  });
}

function collectPatchSurfaceHints(...sources: Array<JsonObject | null>): Record<string, string[]> {
  const hints: Record<string, string[]> = {};
  for (const source of sources) {
    const raw = source?.meta_agent_work_order_contract?.patch_surface_hints
      ?? source?.patch_surface_hints
      ?? {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    for (const [surface, values] of Object.entries(raw as Record<string, unknown>)) {
      hints[surface] = uniqueRefs([...(hints[surface] ?? []), ...stringList(values)]);
    }
    for (const capability of capabilityRecords(source)) {
      const metadata = capabilityMapEntry(source, capability);
      if (!metadata) {
        continue;
      }
      const paths = uniqueRefs([
        ...metadata.canonicalTargetPaths,
      ]);
      if (paths.length > 0) {
        hints[metadata.capabilityRef] = uniqueRefs([...(hints[metadata.capabilityRef] ?? []), ...paths]);
      }
    }
  }
  return hints;
}

function collectMappings(...sources: Array<JsonObject | null>): ChangeRefMapping[] {
  return [
    ...sources.flatMap(capabilityMappings),
    ...sources.flatMap((source) => [
      ...records(source?.meta_agent_work_order_contract?.change_ref_mappings)
        .map((entry) => mappingFromRecord(entry, objectRecord(source?.meta_agent_work_order_contract))),
      ...records(source?.change_ref_mappings)
        .map((entry) => mappingFromRecord(entry, objectRecord(source))),
    ]).filter((entry): entry is ChangeRefMapping => Boolean(entry)),
  ];
}

export function targetImprovementPolicy(targetAgentDir: string): TargetImprovementPolicy {
  const agentLabHandoff = optionalJson(targetAgentDir, 'contracts/agent_lab_handoff.json');
  const omaHandoff = optionalJson(targetAgentDir, 'contracts/oma_handoff_refs.json');
  const capabilityMap = optionalJson(targetAgentDir, 'contracts/capability_map.json');
  const generatedSurfaceHandoff = optionalJson(targetAgentDir, 'contracts/generated_surface_handoff.json');
  const productionAcceptanceDir = path.join(targetAgentDir, 'contracts/production_acceptance');
  const productionAcceptances = fs.existsSync(productionAcceptanceDir)
    ? fs.readdirSync(productionAcceptanceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => readJson(path.join(productionAcceptanceDir, entry.name)))
    : [];
  // Patch targets only come from target-owned policy surfaces; handoff files stay context-only.
  const patchTargetSources = [capabilityMap, ...productionAcceptances];
  const contextSources = [agentLabHandoff, omaHandoff, generatedSurfaceHandoff];
  const sources = [...patchTargetSources, ...contextSources];
  const defaultChangeRefs = uniqueRefs([
    ...patchTargetSources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.default_change_refs)),
  ]);
  const defaultChangeRefTriggers = uniqueRefs([
    ...patchTargetSources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.default_change_ref_triggers)),
  ]);
  const externalLearningRefs = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.external_learning_refs)),
  ]);
  const contextualForbiddenTargetPathsOrSurfaces = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.forbidden_target_writes)),
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.forbidden_target_paths_or_surfaces)),
    ...sources.flatMap((source) => stringList(source?.authority_boundary?.forbidden_surfaces)),
    ...sources.flatMap((source) => capabilityRecords(source).flatMap((entry) => stringList(entry.forbidden_surfaces))),
    ...stringList(generatedSurfaceHandoff?.generated_surface_policy?.must_not_write),
  ]);
  const contextualRuntimeRequiredSurfaceRefs = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.runtime_required_surface_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.runtime_required_surface_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.runtime_required_surface_refs)),
  ]);
  const contextualRuntimeExpectedOutcomes = uniqueRefs([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.runtime_expected_outcomes)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.runtime_expected_outcomes)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.runtime_expected_outcomes)),
  ]);
  return {
    defaultChangeRefs,
    defaultChangeRefTriggers,
    changeRefMappings: collectMappings(...patchTargetSources),
    patchSurfaceHints: collectPatchSurfaceHints(...patchTargetSources),
    externalLearningRefs,
    forbiddenTargetPathsOrSurfaces: contextualForbiddenTargetPathsOrSurfaces.length
      ? contextualForbiddenTargetPathsOrSurfaces
      : DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
    contextualForbiddenTargetPathsOrSurfaces,
    runtimeRequiredSurfaceRefs: contextualRuntimeRequiredSurfaceRefs.length
      ? contextualRuntimeRequiredSurfaceRefs
      : DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
    contextualRuntimeRequiredSurfaceRefs,
    runtimeExpectedOutcomes: contextualRuntimeExpectedOutcomes.length
      ? contextualRuntimeExpectedOutcomes
      : DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
    contextualRuntimeExpectedOutcomes,
  };
}

function normalizeTokenSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function textMatchesToken(text: string, token: string): boolean {
  const normalizedToken = normalizeTokenSearchText(token);
  if (!normalizedToken) {
    return false;
  }
  return ` ${normalizeTokenSearchText(text)} `.includes(` ${normalizedToken} `);
}

function textMentionsTokenWords(text: string, token: string): boolean {
  const normalizedText = ` ${normalizeTokenSearchText(text)} `;
  const tokenWords = normalizeTokenSearchText(token).split(' ').filter((word) => word.length > 2);
  return tokenWords.length > 0 && tokenWords.every((word) => normalizedText.includes(` ${word} `));
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
  for (const mapping of policy.changeRefMappings) {
    if (textMatchesToken(combined, mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
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
  for (const mapping of policy.changeRefMappings) {
    if (!textMatchesToken(combined, mapping.token)) {
      continue;
    }
    const requiredPatchRefs = mapping.refs.filter((ref: string) => proposedChangeRefs.includes(ref));
    const reviewerSuggestions = aiReviewerEvaluation.suggestions.filter((suggestion) =>
      textMatchesToken(suggestion, mapping.token) || textMentionsTokenWords(suggestion, mapping.token)
    );
    const reviewerSourceRefs = aiReviewerEvaluation.source_refs.filter((ref) => textMatchesToken(ref, mapping.token));
    const capability = mapping.capability;
    const capabilityVerificationRefs = capability?.requiredVerificationRefs ?? [];
    const canonicalTargetPaths = capability?.canonicalTargetPaths ?? [];
    const forbiddenTargetPathsOrSurfaces = capability?.forbiddenTargetPathsOrSurfaces ?? [];
    const failureEvidence = uniqueRefs([
      ...sourceFailureRefs.filter((ref) => textMatchesToken(ref, mapping.token)),
      ...reviewerSourceRefs,
      ...reviewerSuggestions.map((suggestion) => `ai-reviewer-suggestion:${suggestion}`),
    ]);
    const targetRepoFileHints = uniqueRefs([
      ...fileHintsForPatchRefs({
        patchRefs: requiredPatchRefs,
        policy,
      }),
      ...canonicalTargetPaths,
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
      target_repo_file_hints: targetRepoFileHints,
      required_verification_refs: uniqueRefs([
        'target_repo_test_receipt',
        'no_target_domain_truth_write_proof',
        'developer_patch_receipt',
        ...capabilityVerificationRefs,
      ]),
      capability_ids: capability ? [capability.capabilityId] : [],
      canonical_target_paths: canonicalTargetPaths,
      capability_verification_refs: capabilityVerificationRefs,
      forbidden_target_paths_or_surfaces: forbiddenTargetPathsOrSurfaces,
      failure_token_registry_refs: capability?.failureTokenRegistryRef ? [capability.failureTokenRegistryRef] : [],
      improvement_tokens: capability?.improvementTokens ?? [],
      capability_authority_boundary: capability?.authorityBoundary ?? {},
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
  for (const patchRef of patchRefs) {
    for (const filePath of policy.patchSurfaceHints[patchRef] ?? []) {
      files.add(filePath);
    }
  }
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

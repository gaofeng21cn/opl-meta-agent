import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReferenceDesignPatternPacket } from 'opl-framework-shared/reference-design-pattern-packet';

type JsonObject = Record<string, any>;

export type ReferenceDesignWorkflowTarget = {
  domain_id: string;
  reference_design_source_refs?: string[] | null;
  reference_design_pattern_notes?: string[] | null;
  reference_design_pattern_packet_refs?: string[] | null;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const expertWorkflowPatternLibraryPath = path.join(
  repoRoot,
  'contracts',
  'expert_workflow_pattern_library.json',
);

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()))
      .map((entry) => entry.trim())
    : [];
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`reference_design_resolution_failed:${field}_missing`);
  }
  return value.trim();
}

function requiredStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`reference_design_resolution_failed:${field}_missing`);
  }
  const entries = value.map((entry, index) => requiredString(entry, `${field}[${index}]`));
  if (entries.length === 0) {
    throw new Error(`reference_design_resolution_failed:${field}_empty`);
  }
  return entries;
}

function requiredObjectArray(value: unknown, field: string): JsonObject[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`reference_design_resolution_failed:${field}_empty`);
  }
  return value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error(`reference_design_resolution_failed:${field}[${index}]_invalid`);
    }
    return entry as JsonObject;
  });
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function stageSlug(value: string): string {
  const slug = value
    .replace(/\.v\d+$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  if (!slug) {
    throw new Error('reference_design_resolution_failed:workflow_stage_id_invalid');
  }
  return slug;
}

function readJsonObject(filePath: string, field: string): JsonObject {
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `reference_design_resolution_failed:${field}_unreadable:${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`reference_design_resolution_failed:${field}_invalid`);
  }
  return value as JsonObject;
}

function canonicalSeedReferenceDesignPattern({
  pattern,
  sourceInputRef,
  sourceMetadata,
}: {
  pattern: JsonObject;
  sourceInputRef: string;
  sourceMetadata: JsonObject[];
}): JsonObject {
  const patternId = requiredString(pattern.pattern_id, 'pattern_id');
  const patternRef = requiredString(pattern.pattern_ref, `${patternId}.pattern_ref`);
  const metadata = sourceMetadata.map((entry, index) => ({
    source_ref: requiredString(entry.source_ref, `${patternId}.source_metadata[${index}].source_ref`),
    locator: requiredString(entry.locator, `${patternId}.source_metadata[${index}].locator`),
    version_or_year: requiredString(
      entry.version_or_year,
      `${patternId}.source_metadata[${index}].version_or_year`,
    ),
    role: requiredString(entry.role, `${patternId}.source_metadata[${index}].role`),
    ...(typeof entry.freshness === 'string' && entry.freshness.trim()
      ? { freshness: entry.freshness.trim() }
      : {}),
  }));
  const workflowSourceRefs = metadata
    .filter((entry) => entry.role === 'workflow_source')
    .map((entry) => entry.source_ref);
  const knownSourceRefs = metadata.map((entry) => entry.source_ref);
  const steps = requiredObjectArray(
    pattern.transferable_workflow_steps,
    `${patternId}.transferable_workflow_steps`,
  ).map((step, index) => {
    const stepId = requiredString(step.step_id, `${patternId}.steps[${index}].step_id`);
    const sourceAnchorRefs = requiredStringArray(
      step.source_anchor_refs,
      `${patternId}.${stepId}.source_anchor_refs`,
    );
    const provenanceKind = requiredString(
      step.provenance_kind,
      `${patternId}.${stepId}.provenance_kind`,
    );
    if (!['source_derived', 'internal_synthesis'].includes(provenanceKind)) {
      throw new Error(`reference_design_resolution_failed:${patternId}.${stepId}.provenance_kind_invalid`);
    }
    const anchorMatches = (sourceRefs: string[]) => sourceAnchorRefs.some((anchor) =>
      sourceRefs.some((sourceRef) => anchor === sourceRef || anchor.startsWith(`${sourceRef}#`))
    );
    if (!anchorMatches(knownSourceRefs)) {
      throw new Error(`reference_design_resolution_failed:${patternId}.${stepId}.source_anchor_unknown`);
    }
    if (provenanceKind === 'source_derived' && !anchorMatches(workflowSourceRefs)) {
      throw new Error(
        `reference_design_resolution_failed:${patternId}.${stepId}.workflow_source_anchor_missing`,
      );
    }
    return {
      step_id: stepId,
      expert_question: requiredString(step.expert_question, `${patternId}.${stepId}.expert_question`),
      stage_archetype: requiredString(step.stage_archetype, `${patternId}.${stepId}.stage_archetype`),
      provenance_kind: provenanceKind,
      source_anchor_refs: sourceAnchorRefs,
    };
  });
  return {
    pattern_id: patternId,
    source_pattern_ref: patternRef,
    source_input_ref: sourceInputRef,
    pattern_origin: 'oma_seed_library',
    source_kind: 'oma_expert_workflow_seed',
    display_name: requiredString(pattern.display_name, `${patternId}.display_name`),
    primary_use: requiredString(pattern.primary_use, `${patternId}.primary_use`),
    source_metadata: metadata,
    source_anchor_refs: uniqueStrings(steps.flatMap((step) => step.source_anchor_refs)),
    transferable_workflow_steps: steps,
    applicable_constraints: requiredStringArray(
      pattern.applicable_constraints,
      `${patternId}.applicable_constraints`,
    ),
    non_transferable_constraints: requiredStringArray(
      pattern.non_transferable_constraints,
      `${patternId}.non_transferable_constraints`,
    ),
    quality_gate_refs: stringList(pattern.quality_gate_refs),
    forbidden_claims: stringList(pattern.forbidden_claims),
  };
}

function resolveSeedPattern(packetRef: string): JsonObject {
  const library = readJsonObject(expertWorkflowPatternLibraryPath, 'expert_workflow_pattern_library');
  if (
    library.surface_kind !== 'opl_meta_agent_expert_workflow_pattern_library'
    || library.state !== 'seed_library_active'
  ) {
    throw new Error('reference_design_resolution_failed:expert_workflow_pattern_library_invalid');
  }
  const patterns = requiredObjectArray(library.seed_patterns, 'expert_workflow_pattern_library.seed_patterns');
  const pattern = patterns.find((entry) => entry.pattern_ref === packetRef);
  if (!pattern) {
    throw new Error(`reference_design_resolution_failed:expert_workflow_pattern_not_found:${packetRef}`);
  }
  const sourceCatalog = library.source_catalog;
  if (typeof sourceCatalog !== 'object' || sourceCatalog === null || Array.isArray(sourceCatalog)) {
    throw new Error('reference_design_resolution_failed:expert_workflow_pattern_library.source_catalog_missing');
  }
  const metadata = requiredStringArray(pattern.source_refs, `${pattern.pattern_id}.source_refs`).map((sourceRef) => {
    const entry = (sourceCatalog as JsonObject)[sourceRef];
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error(`reference_design_resolution_failed:source_metadata_missing:${sourceRef}`);
    }
    return { source_ref: sourceRef, ...(entry as JsonObject) };
  });
  return canonicalSeedReferenceDesignPattern({
    pattern,
    sourceInputRef: packetRef,
    sourceMetadata: metadata,
  });
}

function validateOplPatternPacket(packet: JsonObject): void {
  const validation = validateReferenceDesignPatternPacket(packet);
  if (!validation.ok) {
    const issue = validation.errors[0];
    throw new Error(
      `reference_design_resolution_failed:opl_pattern_packet_schema_invalid:${issue.instance_path || '/'}:${issue.keyword}`,
    );
  }
}

function localJsonPointerValue(packetPath: string, ref: string, field: string): unknown {
  const hashIndex = ref.indexOf('#');
  if (hashIndex < 0 || !ref.slice(hashIndex + 1).startsWith('/')) {
    throw new Error(`reference_design_resolution_failed:${field}_json_pointer_required`);
  }
  const rawPath = ref.slice(0, hashIndex);
  if (!rawPath || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(rawPath)) {
    throw new Error(`reference_design_resolution_failed:${field}_local_path_required`);
  }
  if (path.isAbsolute(rawPath)) {
    throw new Error(`reference_design_resolution_failed:${field}_relative_path_required`);
  }
  if (rawPath.split(/[\\/]+/).includes('..')) {
    throw new Error(`reference_design_resolution_failed:${field}_path_traversal_forbidden`);
  }
  const packetDir = fs.realpathSync.native(path.dirname(fs.realpathSync.native(packetPath)));
  const targetPath = path.resolve(packetDir, rawPath);
  let targetRealPath: string;
  try {
    targetRealPath = fs.realpathSync.native(targetPath);
  } catch (error) {
    throw new Error(
      `reference_design_resolution_failed:${field}_unreadable:${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const relative = path.relative(packetDir, targetRealPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`reference_design_resolution_failed:${field}_real_path_outside_packet_directory`);
  }
  if (!fs.statSync(targetRealPath).isFile()) {
    throw new Error(`reference_design_resolution_failed:${field}_target_file_required`);
  }
  let value: unknown = readJsonObject(targetRealPath, field);
  for (const token of ref.slice(hashIndex + 2).split('/').map((entry) =>
    entry.replace(/~1/g, '/').replace(/~0/g, '~')
  )) {
    if (Array.isArray(value)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= value.length) {
        throw new Error(`reference_design_resolution_failed:${field}_json_pointer_missing`);
      }
      value = value[index];
    } else if (typeof value === 'object' && value !== null && Object.hasOwn(value, token)) {
      value = (value as JsonObject)[token];
    } else {
      throw new Error(`reference_design_resolution_failed:${field}_json_pointer_missing`);
    }
  }
  return value;
}

function sourceAnchorNamespace(ref: string): string {
  return ref.split('#', 1)[0];
}

function assertSemanticAnchorsBoundToEnvelope(packet: JsonObject, semanticAnchors: string[]): void {
  const envelopeAnchors = requiredStringArray(packet.source_anchor_refs, 'opl_packet.source_anchor_refs');
  const envelopeNamespaces = new Set(envelopeAnchors.map(sourceAnchorNamespace));
  semanticAnchors.forEach((anchor) => {
    if (!envelopeNamespaces.has(sourceAnchorNamespace(anchor))) {
      throw new Error('reference_design_resolution_failed:semantic_anchor_outside_envelope_namespace');
    }
  });
}

function assertSourceFingerprintBinding(packet: JsonObject): void {
  const sourceMaterialRef = requiredString(packet.source_material_ref, 'opl_packet.source_material_ref');
  const sourceFingerprintRef = requiredString(packet.source_fingerprint_ref, 'opl_packet.source_fingerprint_ref');
  const sourceDigest = /^source-material:sha256:(.+)$/.exec(sourceMaterialRef)?.[1];
  if (sourceDigest && sourceFingerprintRef !== `sha256:${sourceDigest}`) {
    throw new Error('reference_design_resolution_failed:source_fingerprint_ref_mismatch');
  }
}

function resolvedOplTransferablePattern(packetPath: string, ref: string, index: number): JsonObject {
  const value = localJsonPointerValue(packetPath, ref, `transferable_pattern_refs[${index}]`);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`reference_design_resolution_failed:transferable_pattern_refs[${index}]_invalid`);
  }
  const pattern = value as JsonObject;
  const patternId = requiredString(pattern.pattern_id, `transferable_pattern_refs[${index}].pattern_id`);
  return {
    step_id: patternId,
    transferable_pattern: requiredString(pattern.transferable_pattern, `${patternId}.transferable_pattern`),
    target_adaptation: requiredString(pattern.target_adaptation, `${patternId}.target_adaptation`),
    stage_archetype: requiredString(
      pattern.target_stage_or_capability_slot,
      `${patternId}.target_stage_or_capability_slot`,
    ),
    provenance_kind: 'source_derived',
    source_anchor_refs: requiredStringArray(pattern.source_anchor_refs, `${patternId}.source_anchor_refs`),
    known_limits: [requiredString(pattern.known_limits, `${patternId}.known_limits`)],
  };
}

function resolvedOplConstraint(packetPath: string, ref: string, index: number): JsonObject {
  const value = localJsonPointerValue(packetPath, ref, `non_transferable_constraint_refs[${index}]`);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`reference_design_resolution_failed:non_transferable_constraint_refs[${index}]_invalid`);
  }
  const constraint = value as JsonObject;
  return {
    constraint_ref: ref,
    constraint_id: requiredString(constraint.constraint_id, `constraint[${index}].constraint_id`),
    source_anchor_refs: requiredStringArray(constraint.source_anchor_refs, `constraint[${index}].source_anchor_refs`),
    reason: requiredString(constraint.reason, `constraint[${index}].reason`),
  };
}

function resolveExternalPattern(packetRef: string): JsonObject {
  const requestedPacketPath = packetRef.startsWith('file:') ? fileURLToPath(packetRef) : path.resolve(packetRef);
  if (!fs.existsSync(requestedPacketPath)) {
    throw new Error(`reference_design_resolution_failed:opaque_pattern_packet_unresolved:${packetRef}`);
  }
  const packetPath = fs.realpathSync.native(requestedPacketPath);
  const packet = readJsonObject(packetPath, 'opl_reference_design_pattern_packet');
  validateOplPatternPacket(packet);
  assertSourceFingerprintBinding(packet);
  const summary = localJsonPointerValue(packetPath, packet.pattern_summary_ref, 'pattern_summary_ref');
  if (typeof summary !== 'string' || !summary.trim()) {
    throw new Error('reference_design_resolution_failed:pattern_summary_ref_invalid');
  }
  const steps = requiredStringArray(packet.transferable_pattern_refs, 'transferable_pattern_refs')
    .map((ref, index) => resolvedOplTransferablePattern(packetPath, ref, index));
  const constraints = requiredStringArray(
    packet.non_transferable_constraint_refs,
    'non_transferable_constraint_refs',
  ).map((ref, index) => resolvedOplConstraint(packetPath, ref, index));
  assertSemanticAnchorsBoundToEnvelope(packet, [
    ...steps.flatMap((step) => requiredStringArray(step.source_anchor_refs, `${step.step_id}.source_anchor_refs`)),
    ...constraints.flatMap((constraint) =>
      requiredStringArray(constraint.source_anchor_refs, `${constraint.constraint_id}.source_anchor_refs`)
    ),
  ]);
  const authorityBoundaryNotes = localJsonPointerValue(
    packetPath,
    packet.authority_boundary_notes_ref,
    'authority_boundary_notes_ref',
  );
  if (typeof authorityBoundaryNotes !== 'object' || authorityBoundaryNotes === null || Array.isArray(authorityBoundaryNotes)) {
    throw new Error('reference_design_resolution_failed:authority_boundary_notes_ref_invalid');
  }
  return {
    pattern_id: requiredString(packet.packet_id, 'opl_packet.packet_id'),
    source_pattern_ref: requiredString(packet.packet_ref, 'opl_packet.packet_ref'),
    source_input_ref: packetRef,
    pattern_origin: 'user_typed_pattern_packet',
    source_kind: 'opl_reference_design_pattern_packet',
    display_name: requiredString(packet.packet_id, 'opl_packet.packet_id'),
    primary_use: summary.trim(),
    source_material_ref: packet.source_material_ref,
    source_anchor_refs: uniqueStrings([
      ...requiredStringArray(packet.source_anchor_refs, 'opl_packet.source_anchor_refs'),
      ...steps.flatMap((step) => step.source_anchor_refs),
    ]),
    pattern_summary_ref: packet.pattern_summary_ref,
    pattern_summary: summary.trim(),
    transferable_pattern_refs: packet.transferable_pattern_refs,
    transferable_workflow_steps: steps,
    applicable_constraints: [summary.trim()],
    non_transferable_constraints: constraints.map((constraint) => constraint.constraint_ref),
    non_transferable_constraint_details: constraints,
    authority_boundary_notes_ref: packet.authority_boundary_notes_ref,
    authority_boundary_notes: authorityBoundaryNotes,
    opl_packet_schema_id: 'opl.reference_design_pattern_packet.v1',
    opl_packet_schema_ref:
      'https://one-person-lab.local/contracts/opl-framework/reference-design-pattern-packet.schema.json',
  };
}

export function resolveReferenceDesignPatterns(targetAgent: ReferenceDesignWorkflowTarget): JsonObject[] {
  const patterns = stringList(targetAgent.reference_design_pattern_packet_refs).map((packetRef) =>
    packetRef.startsWith('expert-workflow-pattern:oma/')
      ? resolveSeedPattern(packetRef)
      : resolveExternalPattern(packetRef)
  );
  const uniquePatterns = [...new Map(
    patterns.map((pattern) => [String(pattern.source_pattern_ref), pattern]),
  ).values()];
  const userPatterns = uniquePatterns.filter((pattern) => pattern.pattern_origin === 'user_typed_pattern_packet');
  const referenceSourceRefs = stringList(targetAgent.reference_design_source_refs);
  const hasUnextractedUserSource = referenceSourceRefs.length > 0
    || stringList(targetAgent.reference_design_pattern_notes).length > 0;
  if (hasUnextractedUserSource && userPatterns.length === 0) {
    throw new Error(
      'reference_design_resolution_failed:user_source_requires_typed_pattern_packet_with_steps_and_anchors',
    );
  }
  const packetSourceRefs = uniqueStrings(userPatterns.map((pattern) =>
    requiredString(pattern.source_material_ref, `${pattern.pattern_id}.source_material_ref`)
  ));
  if (
    referenceSourceRefs.length > 0
    && packetSourceRefs.some((sourceRef) => !referenceSourceRefs.includes(sourceRef))
  ) {
    throw new Error('reference_design_resolution_failed:opl_packet_source_material_ref_mismatch');
  }
  const unresolvedSourceRefs = referenceSourceRefs.filter((sourceRef) => !packetSourceRefs.includes(sourceRef));
  if (unresolvedSourceRefs.length > 0) {
    throw new Error(
      `reference_design_resolution_failed:reference_sources_missing_typed_pattern_packets:${unresolvedSourceRefs.join(',')}`,
    );
  }
  if (uniquePatterns.length === 0) {
    throw new Error('reference_design_resolution_failed:workflow_steps_and_source_anchors_missing');
  }
  return uniquePatterns;
}

export function buildReferenceDesignAspects(refs: JsonObject, patterns: JsonObject[]): JsonObject[] {
  return patterns.flatMap((pattern) => requiredObjectArray(
    pattern.transferable_workflow_steps,
    `${pattern.pattern_id}.transferable_workflow_steps`,
  ).map((step) => ({
    aspect_id: `${pattern.pattern_id}:${step.step_id}`,
    pattern_id: pattern.pattern_id,
    step_id: step.step_id,
    source_pattern_ref: pattern.source_pattern_ref,
    source_anchor_refs: step.source_anchor_refs,
    target_design_slot: `workflow_stage:${step.stage_archetype}`,
    required_output_ref: refs.transfer_map_ref,
    extracted_design_claim: step.target_adaptation ?? step.expert_question ?? step.transferable_pattern,
  })));
}

export function buildReferenceDesignPacketContent(
  targetAgent: ReferenceDesignWorkflowTarget,
  refs: JsonObject,
): JsonObject {
  const patterns = resolveReferenceDesignPatterns(targetAgent);
  const userPatterns = patterns.filter((pattern) => pattern.pattern_origin === 'user_typed_pattern_packet');
  const seedPatterns = patterns.filter((pattern) => pattern.pattern_origin === 'oma_seed_library');
  const hasUserOrigin = userPatterns.length > 0;
  const activePatterns = hasUserOrigin ? userPatterns : seedPatterns;
  return {
    surface_kind: 'opl_meta_agent_reference_design_packet',
    version: 'opl-meta-agent.reference-design-packet.v1',
    packet_ref: refs.reference_design_packet_ref,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    reference_source_refs: stringList(targetAgent.reference_design_source_refs),
    reference_design_pattern_packet_refs: stringList(targetAgent.reference_design_pattern_packet_refs),
    reference_design_pattern_notes: stringList(targetAgent.reference_design_pattern_notes),
    design_origin: {
      origin_kind: hasUserOrigin ? 'user_supplied_reference_design' : 'oma_seed_library_fallback',
      primary_source_refs: hasUserOrigin
        ? uniqueStrings([
            ...stringList(targetAgent.reference_design_source_refs),
            ...userPatterns.map((pattern) => String(pattern.source_material_ref)),
            ...userPatterns.map((pattern) => String(pattern.source_input_ref)),
          ])
        : seedPatterns.map((pattern) => String(pattern.source_pattern_ref)),
      primary_pattern_refs: userPatterns.map((pattern) => String(pattern.source_pattern_ref)),
      secondary_seed_pattern_refs: seedPatterns.map((pattern) => String(pattern.source_pattern_ref)),
      seed_library_role: hasUserOrigin ? 'secondary_context_only' : 'fallback_design_origin',
    },
    pattern_dispositions: [
      ...patterns.map((pattern) => ({
        pattern_id: pattern.pattern_id,
        pattern_ref: pattern.source_pattern_ref,
        pattern_origin: pattern.pattern_origin,
        disposition: pattern.pattern_origin === 'oma_seed_library' && hasUserOrigin ? 'adapt' : 'adopt',
        rationale: pattern.pattern_origin === 'oma_seed_library' && hasUserOrigin
          ? 'Seed workflow is secondary context and cannot replace the user-provided design origin.'
          : 'Workflow steps and source anchors are admitted as the active design basis.',
      })),
      ...patterns.flatMap((pattern) => stringList(pattern.non_transferable_constraints).map((constraint) => ({
        pattern_id: pattern.pattern_id,
        pattern_ref: `non-transferable:${pattern.source_pattern_ref}/${constraint}`,
        pattern_origin: pattern.pattern_origin,
        disposition: 'reject',
        rationale: `Constraint ${constraint} cannot transfer into the target Agent Pack.`,
      }))),
    ],
    opl_pattern_packet_schema_refs: uniqueStrings(
      userPatterns.map((pattern) => String(pattern.opl_packet_schema_ref)),
    ),
    resolved_pattern_summary_refs: userPatterns.map((pattern) => String(pattern.pattern_summary_ref)),
    resolved_transferable_pattern_refs: userPatterns.flatMap((pattern) =>
      stringList(pattern.transferable_pattern_refs)
    ),
    source_anchor_refs: uniqueStrings(activePatterns.flatMap((pattern) => stringList(pattern.source_anchor_refs))),
    transferable_design_patterns: activePatterns,
    extractable_design_aspects: buildReferenceDesignAspects(refs, activePatterns),
    applicable_constraints: uniqueStrings(activePatterns.flatMap((pattern) =>
      stringList(pattern.applicable_constraints)
    )),
    non_transferable_constraints: uniqueStrings([
      ...activePatterns.flatMap((pattern) => stringList(pattern.non_transferable_constraints)),
      'external_runtime_or_scheduler_not_importable',
      'external_private_data_not_importable',
      'external_domain_truth_or_verdict_not_importable',
      'external_owner_receipt_or_promotion_authority_not_importable',
    ]),
    non_transferable_constraint_details: activePatterns.flatMap((pattern) =>
      Array.isArray(pattern.non_transferable_constraint_details)
        ? pattern.non_transferable_constraint_details as JsonObject[]
        : []
    ),
    source_body_policy: {
      refs_only: true,
      source_bodies_copied: false,
      pattern_packet_body_copied: false,
      opl_refs_only_packet_envelope_validated: userPatterns.length > 0,
      local_json_pointer_semantic_refs_resolved: userPatterns.length > 0,
      packet_body_required_for_target_truth: false,
      extracted_pattern_refs_required: true,
      route_back_when_extractable_design_aspects_are_missing: true,
    },
  };
}

function workflowStepsForPattern(pattern: JsonObject): JsonObject[] {
  return requiredObjectArray(
    pattern.transferable_workflow_steps,
    `${requiredString(pattern.pattern_id, 'pattern_id')}.transferable_workflow_steps`,
  );
}

export function buildWorkflowStagePlans(
  targetAgent: { domain_id: string },
  patterns: JsonObject[],
): JsonObject[] {
  return patterns.flatMap((pattern) => workflowStepsForPattern(pattern).map((step) => {
    const stageId = `${stageSlug(String(pattern.pattern_id))}-${stageSlug(String(step.step_id))}`;
    return {
      stage_id: stageId,
      stage_ref: `stage:${targetAgent.domain_id}/${stageId}`,
      stage_archetype: step.stage_archetype,
      stage_goal: step.target_adaptation ?? step.expert_question ?? step.transferable_pattern,
      origin: 'source_pattern_ref',
      pattern_id: pattern.pattern_id,
      step_id: step.step_id,
      provenance_kind: step.provenance_kind,
      source_pattern_ref: pattern.source_pattern_ref,
      source_anchor_refs: step.source_anchor_refs,
      transferable_pattern: step.transferable_pattern ?? null,
      target_adaptation: step.target_adaptation ?? null,
      known_limits: stringList(step.known_limits),
    };
  }));
}

export function buildWorkflowTransferMappings({
  targetAgent,
  patterns,
  fallbackStageId,
  actionId,
}: {
  targetAgent: { domain_id: string };
  patterns: JsonObject[];
  fallbackStageId: string;
  actionId: string;
}): JsonObject[] {
  return [
    ...buildWorkflowStagePlans(targetAgent, patterns).map((stage) => ({
      mapping_id: `${stage.pattern_id}:${stage.step_id}`,
      pattern_id: stage.pattern_id,
      step_id: stage.step_id,
      source_anchor_ref: stage.source_anchor_refs[0],
      target_stage_or_capability_slot: stage.stage_ref,
      transfer_rationale: stage.stage_goal,
      known_limits: uniqueStrings([
        ...stringList(stage.known_limits),
        'source runtime topology and stage names are not copied verbatim',
        'target domain truth and quality verdict remain target-owner owned',
      ]),
      disposition: 'adapt',
    })),
    ...patterns.flatMap((pattern) => stringList(pattern.non_transferable_constraints).map((constraint) => ({
      mapping_id: `${pattern.pattern_id}:reject:${stageSlug(constraint)}`,
      pattern_id: pattern.pattern_id,
      step_id: null,
      source_anchor_ref: `non-transferable:${pattern.source_pattern_ref}/${constraint}`,
      target_stage_or_capability_slot: 'authority_boundary',
      transfer_rationale: `Constraint ${constraint} cannot transfer into the target Agent Pack.`,
      known_limits: ['requires route-back if the target design depends on this rejected source behavior'],
      disposition: 'reject',
    }))),
    {
      mapping_id: 'source-runtime-and-truth-boundary',
      pattern_id: 'external-runtime-truth-authority',
      step_id: null,
      source_anchor_ref: `non-transferable:${targetAgent.domain_id}/external-runtime-truth-authority`,
      target_stage_or_capability_slot: 'authority_boundary',
      transfer_rationale: 'External runtime, private data, target truth, verdicts, owner receipts, and promotion authority cannot transfer.',
      known_limits: ['requires route-back if design cannot be expressed without forbidden imports'],
      disposition: 'reject',
    },
    {
      mapping_id: 'target-requirement-to-action',
      pattern_id: 'target-only-requirement',
      step_id: actionId,
      source_anchor_ref: `target-only-requirement:${targetAgent.domain_id}/${actionId}`,
      target_stage_or_capability_slot: `stage:${targetAgent.domain_id}/${fallbackStageId}-owner-gate`,
      transfer_rationale: 'Target action naming and owner handoff derive from the requested target job, not from the reference source.',
      known_limits: ['target owner must still accept the resulting action semantics'],
      disposition: 'adapt',
    },
  ];
}

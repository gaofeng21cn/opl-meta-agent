type MechanismPatchProposalInput = {
  mechanism_ref: string;
  segment_run_ref: string;
  evidence_delta_ref: string;
  next_mechanism_candidate_ref: string;
  editable_surfaces?: string[];
  observe_refs?: string[];
  diagnose_refs?: string[];
  edit_refs?: string[];
};

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Mechanism patch proposal requires ${field}.`);
  }
  return value.trim();
}

function optionalRefs(value: unknown, field: string): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Mechanism patch proposal ${field} must be a non-empty string array.`);
  }
  const refs = value.map((entry, index) => requiredString(entry, `${field}[${index}]`));
  return [...new Set(refs)];
}

function canonicalRefs(...groups: string[][]): string[] {
  return [...new Set(groups.flat())].sort();
}

export function generateMechanismPatchProposal(input: MechanismPatchProposalInput) {
  const mechanismRef = requiredString(input.mechanism_ref, 'mechanism_ref');
  const segmentRunRef = requiredString(input.segment_run_ref, 'segment_run_ref');
  const evidenceDeltaRef = requiredString(input.evidence_delta_ref, 'evidence_delta_ref');
  const nextMechanismCandidateRef = requiredString(
    input.next_mechanism_candidate_ref,
    'next_mechanism_candidate_ref',
  );
  const editableSurfaces = optionalRefs(input.editable_surfaces, 'editable_surfaces');
  const resolvedEditableSurfaces = editableSurfaces.length > 0 ? editableSurfaces : [mechanismRef];
  const observeRefs = optionalRefs(input.observe_refs, 'observe_refs');
  const diagnoseRefs = optionalRefs(input.diagnose_refs, 'diagnose_refs');
  const editRefs = optionalRefs(input.edit_refs, 'edit_refs');

  return {
    surface_kind: 'opl_meta_agent_mechanism_patch_proposal',
    version: 'opl-meta-agent.mechanism-patch-proposal.v1',
    proposal_id: `mechanism-patch-proposal:${mechanismRef}:${nextMechanismCandidateRef}`,
    status: 'proposal_recorded_requires_explicit_gate',
    mechanism_ref: mechanismRef,
    editable_surfaces: [...resolvedEditableSurfaces],
    observe: {
      segment_run_ref: segmentRunRef,
      source_refs: canonicalRefs([segmentRunRef], observeRefs),
    },
    diagnose: {
      evidence_delta_ref: evidenceDeltaRef,
      source_refs: canonicalRefs([evidenceDeltaRef], diagnoseRefs),
    },
    edit: {
      next_mechanism_candidate_ref: nextMechanismCandidateRef,
      proposed_change_refs: canonicalRefs([nextMechanismCandidateRef], editRefs),
      editable_surfaces: [...resolvedEditableSurfaces],
      source_refs: canonicalRefs([mechanismRef, nextMechanismCandidateRef], editRefs),
    },
    segment_run_ref: segmentRunRef,
    evidence_delta_ref: evidenceDeltaRef,
    next_mechanism_candidate_ref: nextMechanismCandidateRef,
    promotion_gate_ref: 'human-gate:mechanism_patch_owner_review',
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

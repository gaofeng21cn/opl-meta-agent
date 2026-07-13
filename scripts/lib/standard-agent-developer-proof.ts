import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { JsonObject } from './domain-pack.ts';
import type { TargetAgent } from './meta-agent-loop-io.ts';
import { stableId } from './meta-agent-loop-io.ts';

export const STANDARD_AGENT_DEVELOPER_PROOF_OPERATION_IDS = [
  'profile_inspect_select',
  'scaffold_materialize_validate',
  'generated_interfaces',
  'package_manifest_validate',
  'profile_conformance',
] as const;

export type StandardAgentDeveloperProofOperationId =
  typeof STANDARD_AGENT_DEVELOPER_PROOF_OPERATION_IDS[number];

export type StandardAgentDeveloperProofOperation = {
  operation_id: StandardAgentDeveloperProofOperationId;
  execution_owner: 'one-person-lab/OPL Framework';
  input_refs: string[];
  depends_on: StandardAgentDeveloperProofOperationId[];
  required_output_ref: string;
};

export type StandardAgentDeveloperProofRequest = {
  surface_kind: 'opl_standard_agent_developer_proof_request';
  version: 'opl-standard-agent-developer-proof-request.v1';
  request_id: string;
  request_ref: string;
  request_owner: 'opl-meta-agent';
  execution_owner: 'one-person-lab/OPL Framework';
  status: 'pending_framework_receipt';
  target_identity: {
    domain_id: string;
    target_agent_ref: string;
  };
  inputs: {
    profile_inspect_select: {
      target_brief: string;
      intent_signals: string[];
      requested_profile_refs: string[];
      reference_design_source_refs: string[];
      reference_design_pattern_packet_refs: string[];
      research_source_refs: string[];
      research_synthesis_refs: string[];
    };
    scaffold_materialize_validate: {
      scaffold_materialization_request_ref: string;
      target_repo_ref: string;
      stage_decomposition_closeout_ref: string;
      agent_skeleton_build_closeout_ref: string;
      profile_result_binding_ref: string;
    };
    generated_interfaces: {
      target_repo_ref: string;
      scaffold_proof_binding_ref: string;
    };
    package_manifest_validate: {
      package_manifest_ref: string;
      scaffold_proof_binding_ref: string;
      trust_tier: 'first_party';
      source_kind: 'local_file';
    };
    profile_conformance: {
      target_repo_ref: string;
      mode: 'validate' | 'not_applicable';
      profile_id: string | null;
      not_applicable_reason: string | null;
      profile_result_binding_ref: string;
    };
  };
  operations: StandardAgentDeveloperProofOperation[];
  required_receipt_surface_kind: 'opl_standard_agent_developer_proof_receipt';
  receipt_contract_ref: 'contracts/schemas/standard-agent-developer-proof-receipt.consumer.schema.json';
  authority_boundary: {
    oma_authors_request_and_consumes_receipt_only: true;
    oma_executes_framework_operations: false;
    opl_owns_operation_execution_and_receipt: true;
    request_is_execution_receipt: false;
    request_can_claim_materialization_or_validation: false;
    opl_can_write_target_domain_truth: false;
    opl_can_authorize_target_quality_or_export: false;
  };
};

type StandardAgentDeveloperProofResult = {
  operation_id: StandardAgentDeveloperProofOperationId;
  status: 'passed' | 'blocked';
  input_refs: string[];
  output: JsonObject;
  blockers?: string[];
};

export type StandardAgentDeveloperProofReceipt = {
  surface_kind: 'opl_standard_agent_developer_proof_receipt';
  version: 'opl-standard-agent-developer-proof-receipt.v1';
  request_id: string;
  request_ref: string;
  request_sha256: string;
  target_identity: {
    domain_id: string;
    target_agent_ref: string;
  };
  status: 'passed' | 'blocked';
  proofs: Record<StandardAgentDeveloperProofOperationId, StandardAgentDeveloperProofResult>;
  blockers?: string[];
  authority_boundary: {
    execution_owner: 'one-person-lab/OPL Framework';
    receipt_owner: 'one-person-lab/OPL Framework';
    oma_consumes_receipt_only: true;
    receipt_can_write_target_domain_truth: false;
    receipt_can_authorize_target_quality_or_export: false;
  };
};

export type StandardAgentDeveloperProofOutputs = {
  profileSelectionReceipt: JsonObject;
  profileInspectionReadbacks: JsonObject[];
  scaffoldMaterializationReceipt: JsonObject;
  scaffoldValidation: JsonObject;
  generatedInterfaces: JsonObject;
  packageManifestValidation: JsonObject;
  profileConformance: JsonObject;
};

const receiptSchemaRef =
  'contracts/schemas/standard-agent-developer-proof-receipt.consumer.schema.json';

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => entry.trim())
    : [];
}

function asRecord(value: unknown, field: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be a JSON object.`);
  }
  return value as JsonObject;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function assertExactKeys(value: JsonObject, allowed: readonly string[], field: string): void {
  const allowedSet = new Set(allowed);
  const unexpected = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unexpected.length > 0) {
    throw new Error(`${field} contains unsupported fields: ${unexpected.join(', ')}`);
  }
}

function sameStrings(left: unknown, right: unknown): boolean {
  return JSON.stringify(stringList(left)) === JSON.stringify(stringList(right));
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function localRefPath(sourceRef: string): string {
  if (sourceRef.startsWith('file:')) {
    try {
      return fileURLToPath(sourceRef);
    } catch {
      throw new Error(`Developer proof receipt ref is not a valid file URL: ${sourceRef}`);
    }
  }
  return path.resolve(sourceRef);
}

export function canonicalBuiltinProfileRef(value: string): string {
  if (value.startsWith('opl-profile-route:')) {
    throw new Error(`Selected OPL profile must be a builtin profile, not a route ref: ${value}`);
  }
  const profileId = value.startsWith('opl-profile:')
    ? value.slice('opl-profile:'.length)
    : value;
  if (!/^[A-Za-z0-9._-]+$/.test(profileId)) {
    throw new Error(`Selected OPL profile ref is invalid: ${value}`);
  }
  return `opl-profile:${profileId}`;
}

export function normalizeRequestedProfileRefs(targetAgent: TargetAgent): TargetAgent {
  const selectedProfileRefs = [...new Set(
    stringList(targetAgent.selected_opl_profile_refs).map(canonicalBuiltinProfileRef),
  )];
  if (selectedProfileRefs.length > 1) {
    throw new Error(
      `Multiple builtin OPL profiles are not supported for one target agent: ${selectedProfileRefs.join(', ')}`,
    );
  }
  return {
    ...targetAgent,
    selected_opl_profile_refs: selectedProfileRefs.length > 0 ? selectedProfileRefs : undefined,
  };
}

function conformanceProfileId(targetAgent: TargetAgent): {
  mode: 'validate' | 'not_applicable';
  profileId: string | null;
  reason: string | null;
} {
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  if (selectedProfileRefs.length > 1) {
    throw new Error(
      `OPL profile conformance requires exactly one builtin profile, found: ${selectedProfileRefs.join(', ')}`,
    );
  }
  const selectedProfileRef = selectedProfileRefs[0];
  if (selectedProfileRef) {
    return {
      mode: 'validate',
      profileId: canonicalBuiltinProfileRef(selectedProfileRef).slice('opl-profile:'.length),
      reason: null,
    };
  }
  if (
    stringList(targetAgent.reference_design_source_refs).length > 0
    || stringList(targetAgent.reference_design_pattern_packet_refs).length > 0
  ) {
    return {
      mode: 'validate',
      profileId: 'source_derived_design_profile_route.v1',
      reason: null,
    };
  }
  if (
    stringList(targetAgent.research_source_refs).length > 0
    || stringList(targetAgent.expert_practice_notes).length > 0
    || stringList(targetAgent.research_synthesis_refs).length > 0
  ) {
    return {
      mode: 'not_applicable',
      profileId: null,
      reason: 'research_driven_design_route_not_exposed_by_opl_profiles_conformance',
    };
  }
  return {
    mode: 'validate',
    profileId: null,
    reason: null,
  };
}

function inputPointer(requestRef: string, inputId: StandardAgentDeveloperProofOperationId): string {
  return `${requestRef}#/inputs/${inputId}`;
}

function proofOutputRef(operationId: StandardAgentDeveloperProofOperationId): string {
  return `${receiptSchemaRef}#/properties/proofs/properties/${operationId}/properties/output`;
}

export function buildStandardAgentDeveloperProofRequest({
  requestRef,
  targetAgent,
  targetRepoRef,
  packageManifestRef,
  scaffoldMaterializationRequestRef,
  stageDecompositionCloseoutRef,
  agentSkeletonBuildCloseoutRef,
}: {
  requestRef: string;
  targetAgent: TargetAgent;
  targetRepoRef: string;
  packageManifestRef: string;
  scaffoldMaterializationRequestRef: string;
  stageDecompositionCloseoutRef: string;
  agentSkeletonBuildCloseoutRef: string;
}): StandardAgentDeveloperProofRequest {
  const normalizedTargetAgent = normalizeRequestedProfileRefs(targetAgent);
  const conformance = conformanceProfileId(normalizedTargetAgent);
  const profileResultBindingRef = proofOutputRef('profile_inspect_select');
  const scaffoldProofBindingRef = proofOutputRef('scaffold_materialize_validate');
  const targetIdentity = {
    domain_id: normalizedTargetAgent.domain_id,
    target_agent_ref: normalizedTargetAgent.target_agent_ref
      ?? `domain-agent:${normalizedTargetAgent.domain_id}`,
  };
  const inputs: StandardAgentDeveloperProofRequest['inputs'] = {
    profile_inspect_select: {
      target_brief: normalizedTargetAgent.target_brief?.trim() ?? '',
      intent_signals: stringList(normalizedTargetAgent.intent_signals),
      requested_profile_refs: stringList(normalizedTargetAgent.selected_opl_profile_refs),
      reference_design_source_refs: stringList(normalizedTargetAgent.reference_design_source_refs),
      reference_design_pattern_packet_refs: stringList(
        normalizedTargetAgent.reference_design_pattern_packet_refs,
      ),
      research_source_refs: stringList(normalizedTargetAgent.research_source_refs),
      research_synthesis_refs: stringList(normalizedTargetAgent.research_synthesis_refs),
    },
    scaffold_materialize_validate: {
      scaffold_materialization_request_ref: scaffoldMaterializationRequestRef,
      target_repo_ref: targetRepoRef,
      stage_decomposition_closeout_ref: stageDecompositionCloseoutRef,
      agent_skeleton_build_closeout_ref: agentSkeletonBuildCloseoutRef,
      profile_result_binding_ref: profileResultBindingRef,
    },
    generated_interfaces: {
      target_repo_ref: targetRepoRef,
      scaffold_proof_binding_ref: scaffoldProofBindingRef,
    },
    package_manifest_validate: {
      package_manifest_ref: packageManifestRef,
      scaffold_proof_binding_ref: scaffoldProofBindingRef,
      trust_tier: 'first_party',
      source_kind: 'local_file',
    },
    profile_conformance: {
      target_repo_ref: targetRepoRef,
      mode: conformance.mode,
      profile_id: conformance.profileId,
      not_applicable_reason: conformance.reason,
      profile_result_binding_ref: profileResultBindingRef,
    },
  };
  const requestId = stableId('standard_agent_developer_proof_request', {
    requestRef,
    targetIdentity,
    inputs,
  });
  const operation = (
    operationId: StandardAgentDeveloperProofOperationId,
    dependsOn: StandardAgentDeveloperProofOperationId[],
    extraInputRefs: string[] = [],
  ): StandardAgentDeveloperProofOperation => ({
    operation_id: operationId,
    execution_owner: 'one-person-lab/OPL Framework',
    input_refs: [inputPointer(requestRef, operationId), ...extraInputRefs],
    depends_on: dependsOn,
    required_output_ref: proofOutputRef(operationId),
  });
  return {
    surface_kind: 'opl_standard_agent_developer_proof_request',
    version: 'opl-standard-agent-developer-proof-request.v1',
    request_id: requestId,
    request_ref: requestRef,
    request_owner: 'opl-meta-agent',
    execution_owner: 'one-person-lab/OPL Framework',
    status: 'pending_framework_receipt',
    target_identity: targetIdentity,
    inputs,
    operations: [
      operation('profile_inspect_select', []),
      operation('scaffold_materialize_validate', ['profile_inspect_select'], [
        scaffoldMaterializationRequestRef,
        stageDecompositionCloseoutRef,
        agentSkeletonBuildCloseoutRef,
      ]),
      operation('generated_interfaces', ['scaffold_materialize_validate'], [targetRepoRef]),
      operation('package_manifest_validate', ['scaffold_materialize_validate'], [packageManifestRef]),
      operation('profile_conformance', [
        'profile_inspect_select',
        'scaffold_materialize_validate',
      ], [targetRepoRef]),
    ],
    required_receipt_surface_kind: 'opl_standard_agent_developer_proof_receipt',
    receipt_contract_ref: receiptSchemaRef,
    authority_boundary: {
      oma_authors_request_and_consumes_receipt_only: true,
      oma_executes_framework_operations: false,
      opl_owns_operation_execution_and_receipt: true,
      request_is_execution_receipt: false,
      request_can_claim_materialization_or_validation: false,
      opl_can_write_target_domain_truth: false,
      opl_can_authorize_target_quality_or_export: false,
    },
  };
}

function proofRecord(
  receipt: JsonObject,
  operation: StandardAgentDeveloperProofOperation,
): StandardAgentDeveloperProofResult {
  const proofs = asRecord(receipt.proofs, 'developer proof receipt proofs');
  const proof = asRecord(
    proofs[operation.operation_id],
    `developer proof receipt proofs.${operation.operation_id}`,
  );
  assertExactKeys(
    proof,
    ['operation_id', 'status', 'input_refs', 'output', 'blockers'],
    `developer proof receipt proofs.${operation.operation_id}`,
  );
  if (proof.operation_id !== operation.operation_id) {
    throw new Error(`Developer proof receipt operation mismatch: ${operation.operation_id}.`);
  }
  if (!sameStrings(proof.input_refs, operation.input_refs)) {
    throw new Error(`Developer proof receipt input refs drifted: ${operation.operation_id}.`);
  }
  if (proof.status !== 'passed') {
    const blockers = stringList(proof.blockers);
    throw new Error(
      `Developer proof operation did not pass: ${operation.operation_id}`
      + `${blockers.length > 0 ? ` (${blockers.join(', ')})` : ''}.`,
    );
  }
  return proof as StandardAgentDeveloperProofResult;
}

function validateProfileProof(output: JsonObject): {
  profileSelectionReceipt: JsonObject;
  profileInspectionReadbacks: JsonObject[];
} {
  const profileSelectionReceipt = asRecord(
    output.profile_selection_receipt,
    'profile proof profile_selection_receipt',
  );
  if (profileSelectionReceipt.surface_kind !== 'opl_profile_selection_receipt') {
    throw new Error('Profile proof must carry opl_profile_selection_receipt.');
  }
  const selectedBuiltinRefs = stringList(profileSelectionReceipt.selected_profile_refs)
    .filter((ref) => ref.startsWith('opl-profile:') && !ref.startsWith('opl-profile-route:'))
    .map(canonicalBuiltinProfileRef);
  const inspections = Array.isArray(output.profile_inspection_readbacks)
    ? output.profile_inspection_readbacks.map((entry, index) =>
      asRecord(entry, `profile proof profile_inspection_readbacks[${index}]`)
    )
    : [];
  for (const profileRef of selectedBuiltinRefs) {
    const found = inspections.some((inspection) => {
      const profile = inspection.status === 'found' && typeof inspection.profile === 'object'
        ? asRecord(inspection.profile, 'profile inspection profile')
        : null;
      return profile?.profile_ref === profileRef;
    });
    if (!found) {
      throw new Error(`Profile proof is missing a found inspection for ${profileRef}.`);
    }
  }
  return { profileSelectionReceipt, profileInspectionReadbacks: inspections };
}

function validateScaffoldProof(output: JsonObject): {
  scaffoldMaterializationReceipt: JsonObject;
  scaffoldValidation: JsonObject;
} {
  const receipt = asRecord(
    output.scaffold_materialization_receipt,
    'scaffold proof scaffold_materialization_receipt',
  );
  if (receipt.surface_kind !== 'opl_agent_scaffold_materialization_receipt'
    || receipt.status !== 'materialized') {
    throw new Error('Scaffold proof must carry a materialized opl_agent_scaffold_materialization_receipt.');
  }
  const buildReceipt = asRecord(receipt.build_receipt, 'scaffold proof build_receipt');
  const buildReceiptRef = asString(receipt.build_receipt_ref, 'scaffold proof build_receipt_ref');
  if (buildReceipt.receipt_ref !== buildReceiptRef) {
    throw new Error('Scaffold proof build receipt/ref mismatch.');
  }
  if (!Array.isArray(receipt.materialized_file_digests)
    || receipt.materialized_file_digests.length === 0) {
    throw new Error('Scaffold proof requires materialized_file_digests.');
  }
  if (stringList(receipt.validation_refs).length === 0) {
    throw new Error('Scaffold proof requires validation_refs.');
  }
  const standardScaffold = asRecord(
    output.standard_domain_agent_scaffold,
    'scaffold proof standard_domain_agent_scaffold',
  );
  const validation = asRecord(
    standardScaffold.validation,
    'scaffold proof standard_domain_agent_scaffold.validation',
  );
  if (validation.status !== 'passed') {
    throw new Error(
      `Scaffold proof validation did not pass: ${stringList(validation.blockers).join(', ') || 'unknown'}.`,
    );
  }
  return {
    scaffoldMaterializationReceipt: receipt,
    scaffoldValidation: { standard_domain_agent_scaffold: standardScaffold },
  };
}

function validateGeneratedInterfacesProof(output: JsonObject): JsonObject {
  const generated = asRecord(
    output.generated_agent_interfaces,
    'generated interfaces proof generated_agent_interfaces',
  );
  if (generated.status !== 'ready') {
    throw new Error(`Generated interfaces proof is not ready: ${String(generated.status)}.`);
  }
  return { generated_agent_interfaces: generated };
}

function validatePackageManifestProof(output: JsonObject): JsonObject {
  const validation = asRecord(
    output.opl_agent_package_manifest,
    'package manifest proof opl_agent_package_manifest',
  );
  if (validation.status !== 'valid') {
    throw new Error(`Package manifest proof is not valid: ${String(validation.status)}.`);
  }
  return { opl_agent_package_manifest: validation };
}

function validateProfileConformanceProof(output: JsonObject): JsonObject {
  const conformance = asRecord(
    output.profile_conformance,
    'profile conformance proof profile_conformance',
  );
  if (conformance.status !== 'passed' && conformance.status !== 'not_applicable') {
    throw new Error(`Profile conformance proof did not pass: ${String(conformance.status)}.`);
  }
  return conformance;
}

export function readStandardAgentDeveloperProofReceipt({
  receiptRef,
  requestPath,
  request,
}: {
  receiptRef: string;
  requestPath: string;
  request: StandardAgentDeveloperProofRequest;
}): {
  receipt: StandardAgentDeveloperProofReceipt;
  outputs: StandardAgentDeveloperProofOutputs;
} {
  const receiptPath = localRefPath(receiptRef);
  if (!fs.existsSync(receiptPath) || !fs.statSync(receiptPath).isFile()) {
    throw new Error(`Developer proof receipt is not a readable file: ${receiptPath}`);
  }
  const receipt = asRecord(
    JSON.parse(fs.readFileSync(receiptPath, 'utf8')),
    'developer proof receipt',
  );
  assertExactKeys(
    receipt,
    [
      'surface_kind',
      'version',
      'request_id',
      'request_ref',
      'request_sha256',
      'target_identity',
      'status',
      'proofs',
      'blockers',
      'authority_boundary',
    ],
    'developer proof receipt',
  );
  if (receipt.surface_kind !== 'opl_standard_agent_developer_proof_receipt'
    || receipt.version !== 'opl-standard-agent-developer-proof-receipt.v1') {
    throw new Error('Only opl_standard_agent_developer_proof_receipt.v1 is accepted.');
  }
  if (receipt.request_id !== request.request_id || receipt.request_ref !== request.request_ref) {
    throw new Error('Developer proof receipt request identity does not match the current request.');
  }
  if (receipt.request_sha256 !== sha256File(requestPath)) {
    throw new Error('Developer proof receipt request_sha256 does not match the current request bytes.');
  }
  const targetIdentity = asRecord(receipt.target_identity, 'developer proof receipt target_identity');
  assertExactKeys(
    targetIdentity,
    ['domain_id', 'target_agent_ref'],
    'developer proof receipt target_identity',
  );
  if (targetIdentity.domain_id !== request.target_identity.domain_id
    || targetIdentity.target_agent_ref !== request.target_identity.target_agent_ref) {
    throw new Error('Developer proof receipt target identity does not match the current request.');
  }
  const authority = asRecord(receipt.authority_boundary, 'developer proof receipt authority_boundary');
  assertExactKeys(
    authority,
    [
      'execution_owner',
      'receipt_owner',
      'oma_consumes_receipt_only',
      'receipt_can_write_target_domain_truth',
      'receipt_can_authorize_target_quality_or_export',
    ],
    'developer proof receipt authority_boundary',
  );
  if (authority.execution_owner !== 'one-person-lab/OPL Framework'
    || authority.receipt_owner !== 'one-person-lab/OPL Framework'
    || authority.oma_consumes_receipt_only !== true
    || authority.receipt_can_write_target_domain_truth !== false
    || authority.receipt_can_authorize_target_quality_or_export !== false) {
    throw new Error('Developer proof receipt authority boundary is invalid.');
  }
  if (receipt.status !== 'passed') {
    throw new Error(
      `Developer proof receipt did not pass${stringList(receipt.blockers).length > 0
        ? `: ${stringList(receipt.blockers).join(', ')}`
        : '.'}`,
    );
  }
  const proofKeys = Object.keys(asRecord(receipt.proofs, 'developer proof receipt proofs')).sort();
  const expectedProofKeys = [...STANDARD_AGENT_DEVELOPER_PROOF_OPERATION_IDS].sort();
  if (JSON.stringify(proofKeys) !== JSON.stringify(expectedProofKeys)) {
    throw new Error('Developer proof receipt must contain exactly the five declared proof operations.');
  }
  const proofs = Object.fromEntries(
    request.operations.map((operation) => [operation.operation_id, proofRecord(receipt, operation)]),
  ) as Record<StandardAgentDeveloperProofOperationId, StandardAgentDeveloperProofResult>;
  const profile = validateProfileProof(proofs.profile_inspect_select.output);
  const scaffold = validateScaffoldProof(proofs.scaffold_materialize_validate.output);
  const generatedInterfaces = validateGeneratedInterfacesProof(proofs.generated_interfaces.output);
  const packageManifestValidation = validatePackageManifestProof(
    proofs.package_manifest_validate.output,
  );
  const profileConformance = validateProfileConformanceProof(proofs.profile_conformance.output);
  return {
    receipt: receipt as StandardAgentDeveloperProofReceipt,
    outputs: {
      ...profile,
      ...scaffold,
      generatedInterfaces,
      packageManifestValidation,
      profileConformance,
    },
  };
}

export function applyDeveloperProofProfileSelection(
  targetAgent: TargetAgent,
  profileSelectionReceipt: JsonObject,
): TargetAgent {
  const requestedProfileRefs = stringList(targetAgent.selected_opl_profile_refs)
    .map(canonicalBuiltinProfileRef);
  const selectedProfileRefs = stringList(profileSelectionReceipt.selected_profile_refs)
    .filter((profileRef) =>
      profileRef.startsWith('opl-profile:') && !profileRef.startsWith('opl-profile-route:')
    )
    .map(canonicalBuiltinProfileRef);
  for (const requestedProfileRef of requestedProfileRefs) {
    if (!selectedProfileRefs.includes(requestedProfileRef)) {
      throw new Error(`Developer proof profile selection omitted requested profile: ${requestedProfileRef}.`);
    }
  }
  const mergedProfileRefs = [...new Set([...requestedProfileRefs, ...selectedProfileRefs])];
  if (mergedProfileRefs.length > 1) {
    throw new Error(
      `Multiple builtin OPL profiles are not supported for one target agent: ${mergedProfileRefs.join(', ')}`,
    );
  }
  const matchedSignals = stringList(profileSelectionReceipt.matched_trigger_signals);
  return {
    ...targetAgent,
    ...(mergedProfileRefs.length > 0
      ? {
          selected_opl_profile_refs: mergedProfileRefs,
          profile_selection_rationale: targetAgent.profile_selection_rationale?.trim()
            || `OPL profile selector matched lower-bound signals: ${matchedSignals.join(', ') || 'explicit profile selection'}.`,
        }
      : {
          selected_opl_profile_refs: undefined,
          profile_selection_rationale: undefined,
        }),
  };
}

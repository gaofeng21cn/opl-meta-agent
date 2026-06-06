import fs from 'node:fs';
import type { JsonObject } from './domain-pack.ts';

export const DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF = 'contracts/developer_work_order_policy.json';

type DeveloperWorkOrderPolicy = JsonObject;

function contractStringList(policy: DeveloperWorkOrderPolicy, field: string): string[] {
  const value = policy[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`Developer work-order policy ${field} must be a non-empty string array.`);
  }
  return value.map((entry) => entry.trim());
}

function readDeveloperWorkOrderPolicy(): DeveloperWorkOrderPolicy {
  const policy = JSON.parse(
    fs.readFileSync(new URL('../../contracts/developer_work_order_policy.json', import.meta.url), 'utf8'),
  ) as DeveloperWorkOrderPolicy;
  if (policy.surface_kind !== 'developer_work_order_policy') {
    throw new Error('Developer work-order policy contract has an unexpected surface_kind.');
  }
  const consumers = stringList(policy.active_policy_consumer_refs);
  if (!consumers.includes('scripts/lib/work-order-refs.ts')) {
    throw new Error('Developer work-order policy contract must name work-order refs as an active consumer.');
  }
  return policy;
}

export const DEVELOPER_WORK_ORDER_POLICY = readDeveloperWorkOrderPolicy();

export const DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_forbidden_target_paths_or_surfaces',
);

export const DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_runtime_required_surface_refs',
);

export const DEFAULT_RUNTIME_EXPECTED_OUTCOMES = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_runtime_expected_outcomes',
);

export const DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_target_workspace_required_surface_refs',
);

export const DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_target_workspace_expected_outcomes',
);

export const DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_no_patch_closeout_evidence',
);

export const DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE = contractStringList(
  DEVELOPER_WORK_ORDER_POLICY,
  'default_source_patch_closeout_evidence',
);

export function uniqueRefs(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? uniqueRefs(value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()))
    : [];
}

export function records(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonObject => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}

export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function firstString(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = stringValue(value);
    if (text) {
      return text;
    }
  }
  return fallback;
}

export function refsFromEntries(entries: unknown): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (entry && typeof entry === 'object' && typeof (entry as JsonObject).ref === 'string') {
        return (entry as JsonObject).ref;
      }
      return null;
    })
    .filter((ref): ref is string => Boolean(ref && ref.trim()))
    .map((ref) => ref.trim());
}

export function refsFromRecord(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(refsFromRecord);
  }
  const record = value as JsonObject;
  return [
    ...(typeof record.ref === 'string' ? [record.ref] : []),
    ...Object.entries(record)
      .filter(([key]) => key !== 'ref')
      .flatMap(([, nested]) => refsFromRecord(nested)),
  ];
}

export function verificationRefs(productionAcceptance: JsonObject): string[] {
  return uniqueRefs([
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.next_verification_command_refs),
    ...refsFromEntries(productionAcceptance.refs?.next_verification_command_refs),
    ...refsFromEntries(productionAcceptance.closure_evidence?.next_verification_ref ? [
      productionAcceptance.closure_evidence.next_verification_ref,
    ] : []),
  ]);
}

export function productionAcceptanceEvidenceRefs(productionAcceptance: JsonObject): string[] {
  return uniqueRefs([
    ...refsFromRecord(productionAcceptance.domain_acceptance_receipt),
    ...refsFromRecord(productionAcceptance.refs),
    ...refsFromEntries(productionAcceptance.closure_evidence?.owner_receipt_ref ? [
      productionAcceptance.closure_evidence.owner_receipt_ref,
    ] : []),
  ]);
}

export function ownerRouteRef(
  ownerRoute: unknown,
  targetAgent: { domainId: string },
): string | null {
  const normalized = stringValue(ownerRoute);
  if (!normalized) {
    return null;
  }
  if (normalized.startsWith('owner-route:')) {
    return normalized;
  }
  if (normalized.includes('/')) {
    return `owner-route:${normalized}`;
  }
  return `owner-route:${targetAgent.domainId}/${normalized}`;
}

export function requiredReturnShapes(contracts: { productionAcceptance: JsonObject }): string[] {
  return uniqueRefs([
    ...stringList(contracts.productionAcceptance.production_like_receipt_chain?.required_return_shapes),
    ...stringList(contracts.productionAcceptance.domain_acceptance_receipt?.required_return_shapes),
  ]);
}

export function taskRequiredReturnShapeRefs(
  tasks: JsonObject[],
  targetAgent: { domainId: string },
): string[] {
  return uniqueRefs(tasks.flatMap((task) => (
    stringList(task.required_return_shapes).map((shape) => `required-return-shape:${targetAgent.domainId}/${shape}`)
  )));
}

export function forbiddenWriteSurfaces(contracts: {
  generatedSurfaceHandoff: JsonObject;
  productionAcceptance: JsonObject;
}, baseSurfaces: string[] = DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES): string[] {
  return uniqueRefs([
    ...baseSurfaces,
    ...stringList(contracts.generatedSurfaceHandoff.generated_surface_policy?.must_not_write),
    ...stringList(contracts.productionAcceptance.authority_boundary?.forbidden_write_surfaces),
  ]);
}

export function noForbiddenWriteProofRefs(
  contracts: {
    productionAcceptance: JsonObject;
    generatedSurfaceHandoff: JsonObject;
    agentLabHandoff: JsonObject;
  },
  targetAgent: { domainId: string },
): string[] {
  const refs = uniqueRefs([
    ...refsFromEntries(contracts.productionAcceptance.authority_boundary?.no_forbidden_write_proof_refs),
    ...refsFromEntries(contracts.generatedSurfaceHandoff.no_forbidden_write_proof_refs),
    ...refsFromEntries(contracts.agentLabHandoff.no_forbidden_write_proof_refs),
  ]);
  return refs.length > 0 ? refs : [`no-forbidden-write:${targetAgent.domainId}/production-evidence-tail`];
}

export function targetOwnerRoute(contracts: {
  productionAcceptance: JsonObject;
  productionAcceptanceRef: string;
}): JsonObject {
  const boundary = contracts.productionAcceptance.authority_boundary ?? {};
  return {
    domain_ready_requires_owner_receipt_or_typed_blocker:
      boundary.domain_ready_requires_owner_receipt_or_typed_blocker === true,
    quality_or_export_ready_requires_target_owner_gate:
      boundary.quality_or_export_ready_requires_target_owner_gate === true,
    artifact_mutation_requires_owner_receipt:
      boundary.artifact_mutation_requires_owner_receipt === true,
    source_authority_boundary_ref: `${contracts.productionAcceptanceRef}#/authority_boundary`,
  };
}

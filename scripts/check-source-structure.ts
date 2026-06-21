import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, any>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = 'contracts/source_structure_policy.json';

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function sha256ForFiles(relativePaths: string[]): string {
  const hash = crypto.createHash('sha256');
  relativePaths.forEach((relativePath) => {
    const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(Buffer.byteLength(content)));
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  });
  return `sha256:${hash.digest('hex')}`;
}

function lineCount(relativePath: string): number {
  const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  if (content.length === 0) {
    return 0;
  }
  return content.endsWith('\n')
    ? content.slice(0, -1).split(/\r\n|\n|\r/).length
    : content.split(/\r\n|\n|\r/).length;
}

function trackedFiles(): string[] {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'git ls-files failed');
  }
  return result.stdout.split('\0').filter(Boolean).sort();
}

function matchesScope(relativePath: string, scanScope: JsonObject): boolean {
  const prefixes = scanScope.path_prefixes as string[];
  const extensions = scanScope.extensions as string[];
  const excluded = new Set(scanScope.excluded_paths as string[]);
  return !excluded.has(relativePath)
    && prefixes.some((prefix) => relativePath.startsWith(prefix))
    && extensions.some((extension) => relativePath.endsWith(extension));
}

function aggregateExemption(relativePath: string, policy: JsonObject): JsonObject | undefined {
  return (policy.generated_aggregate_exemptions as JsonObject[])
    .find((entry) => entry.aggregate_ref === relativePath);
}

function scriptRefsFromTrackedFiles(files: string[]): string[] {
  return files
    .filter((relativePath) => (
      relativePath.startsWith('scripts/')
      && ['.ts', '.sh'].some((extension) => relativePath.endsWith(extension))
    ))
    .sort();
}

function asStrings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${label} must be a string array`);
  }
  return [...value].sort() as string[];
}

function assertSameStringSet(actual: string[], expected: string[], label: string, violations: string[]): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    const missing = expectedSorted.filter((entry) => !actualSorted.includes(entry));
    const extra = actualSorted.filter((entry) => !expectedSorted.includes(entry));
    violations.push(`${label} drift: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
  }
}

function valueAtPath(source: JsonObject, dottedPath: string): JsonObject {
  return dottedPath.split('.').reduce<JsonObject>((current, segment) => {
    const value = current[segment];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${dottedPath} must resolve to a JSON object`);
    }
    return value as JsonObject;
  }, source);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function firstString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function byScriptRef(entries: unknown): Map<string, JsonObject> {
  const map = new Map<string, JsonObject>();
  if (!Array.isArray(entries)) return map;
  entries.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const scriptRef = firstString((entry as JsonObject).script_ref);
    if (scriptRef) {
      map.set(scriptRef, entry as JsonObject);
    }
  });
  return map;
}

function gateByScriptRef(gates: unknown): Map<string, JsonObject> {
  const map = new Map<string, JsonObject>();
  if (!Array.isArray(gates)) return map;
  gates.forEach((gate) => {
    if (!gate || typeof gate !== 'object' || Array.isArray(gate)) return;
    asStringArray((gate as JsonObject).tracked_script_refs).forEach((scriptRef) => {
      map.set(scriptRef, gate as JsonObject);
    });
  });
  return map;
}

function cleanupReadbackForScripts(
  receipt: JsonObject,
  sourceReceipt: JsonObject,
  scriptMorphology: JsonObject,
): JsonObject {
  const cleanupGuard = scriptMorphology.retirement_readback_cleanup_guard as JsonObject;
  const classificationsByScript = byScriptRef(scriptMorphology.script_classifications);
  const activeCallersByScript = byScriptRef((sourceReceipt.active_script_caller_scan as JsonObject).caller_refs_by_script);
  const gatesByScript = gateByScriptRef(scriptMorphology.script_to_pack_retirement_gates);
  const scannedScriptRefs = asStrings(sourceReceipt.scanned_script_refs, 'source_purity_scan_receipt.scanned_script_refs');
  const requiredByReceipt = asStringArray(receipt.future_retirement_or_absorb_still_requires);
  const requiredByGuard = asStringArray(cleanupGuard.required_before_cleanup_apply);
  const requiredBeforeCleanup = requiredByGuard.length > 0 ? requiredByGuard : requiredByReceipt;
  const defaultMissingEvidence = requiredByReceipt.length > 0
    ? requiredByReceipt
    : requiredBeforeCleanup.filter((entry) => !entry.startsWith('owner_receipt://'));

  const cleanupCandidates = scannedScriptRefs.map((scriptRef) => {
    const gate = gatesByScript.get(scriptRef) ?? {};
    const classification = classificationsByScript.get(scriptRef) ?? {};
    const activeCaller = activeCallersByScript.get(scriptRef) ?? {};
    const missingEvidence = asStringArray(gate.required_before_retire_or_absorb);
    const gateId = firstString(gate.gate_id);

    return {
      script_ref: scriptRef,
      gate_id: gateId ?? 'missing_script_to_pack_gate',
      current_role: firstString(gate.current_role) ?? 'unknown_retained_script_role',
      classes: asStringArray(classification.classes),
      authority_function_refs: asStringArray(classification.authority_function_refs),
      consumes_opl_surfaces: asStringArray(classification.consumes_opl_surfaces),
      active_caller_refs: asStringArray(activeCaller.active_caller_refs),
      missing_evidence: missingEvidence.length > 0 ? missingEvidence : defaultMissingEvidence,
      closed_retention_refs: asStringArray(gate.closed_retention_refs),
      owner_delta_route: gateId
        ? `route-to-owner:opl-framework-or-target-owner/script-to-pack/${gateId}`
        : 'route-to-owner:opl-meta-agent/script-to-pack/missing-script-gate',
      typed_blocker_ref_shape: gateId
        ? `oma-typed-blocker:script-to-pack/${gateId}/${scriptRef}`
        : `oma-typed-blocker:script-to-pack/missing-script-gate/${scriptRef}`,
      can_apply_cleanup: false,
    };
  });

  return {
    surface_kind: 'oma_script_to_pack_retirement_cleanup_readback',
    version: 'script-to-pack-retirement-cleanup-readback.v1',
    owner: 'opl-meta-agent',
    target_domain_id: 'opl-meta-agent',
    state: 'readback_available_cleanup_not_authorized',
    ok: true,
    source_refs: {
      receipt_ref: 'contracts/script_to_pack_gate_receipt.json',
      authority_functions_ref: 'runtime/authority_functions/meta-agent-authority-functions.json',
      script_morphology_policy_ref:
        'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy',
      active_caller_scan_ref:
        'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.active_script_caller_scan',
    },
    readback_guard_ref:
      'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.retirement_readback_cleanup_guard',
    command_ref: 'npm run script-to-pack:readback',
    readback_is_authority: false,
    cleanup_candidate_count: cleanupCandidates.length,
    cleanup_apply_candidate_count: 0,
    missing_evidence_item_count: cleanupCandidates.reduce(
      (count, candidate) => count + asStringArray(candidate.missing_evidence).length,
      0,
    ),
    required_before_cleanup_apply: requiredBeforeCleanup,
    cleanup_candidates: cleanupCandidates,
    false_ready_claims: {
      claims_cleanup_readback_authorizes_delete: false,
      claims_retirement_cleanup_applied: false,
      claims_retirement_cleanup_complete: false,
      claims_opl_primitive_parity: false,
      claims_no_active_caller: false,
      claims_app_or_registry_readiness: false,
      claims_generated_hosted_readiness: false,
      claims_target_agent_ready: false,
      claims_domain_ready: false,
      claims_production_ready: false,
    },
    authority_boundary: {
      can_identify_cleanup_candidates: true,
      can_route_owner_delta: true,
      can_authorize_physical_delete: false,
      can_sign_owner_receipt: false,
      can_create_typed_blocker_instance: false,
      can_claim_opl_primitive_parity: false,
      can_claim_no_active_caller: false,
      can_claim_app_or_registry_readiness: false,
      can_claim_generated_hosted_readiness: false,
      can_claim_target_agent_ready: false,
      can_claim_domain_ready: false,
      can_claim_production_ready: false,
    },
  };
}

function compactCleanupReadback(readback: JsonObject): JsonObject {
  const candidates = Array.isArray(readback.cleanup_candidates)
    ? readback.cleanup_candidates as JsonObject[]
    : [];
  const sampleCleanupCandidates = candidates.slice(0, 3);
  return {
    summary_id: 'oma.script_to_pack_retirement_cleanup.compact_summary.v1',
    surface_kind: readback.surface_kind,
    version: readback.version,
    summary_role: 'compact_cleanup_summary_not_second_script_inventory',
    state: readback.state,
    command_ref: readback.command_ref,
    readback_is_authority: readback.readback_is_authority,
    cleanup_candidate_count: readback.cleanup_candidate_count,
    cleanup_apply_candidate_count: readback.cleanup_apply_candidate_count,
    missing_evidence_item_count: readback.missing_evidence_item_count,
    sample_cleanup_candidate_count: sampleCleanupCandidates.length,
    sample_cleanup_candidates: sampleCleanupCandidates,
    false_ready_claims: readback.false_ready_claims,
    authority_boundary: readback.authority_boundary,
  };
}

function validateScriptToPackReceiptGuard(
  policy: JsonObject,
  tracked: string[],
  guardViolations: string[],
): JsonObject | undefined {
  const guard = policy.script_to_pack_receipt_guard as JsonObject | undefined;
  if (!guard) return undefined;

  const receipt = readJson(String(guard.receipt_ref));
  const authorityFunctions = readJson(String(guard.authority_functions_ref));
  const sourceReceipt = valueAtPath(authorityFunctions, String(guard.source_receipt_path));
  const scriptMorphology = valueAtPath(authorityFunctions, String(guard.script_morphology_path));
  const activeCallerScan = sourceReceipt.active_script_caller_scan as JsonObject;
  const sourceRefIntegrityGuard = scriptMorphology.source_ref_integrity_guard as JsonObject;
  const currentSummary = receipt.current_scan_summary as JsonObject;
  const cleanupReadback = cleanupReadbackForScripts(receipt, sourceReceipt, scriptMorphology);
  const compactCleanupSummary = compactCleanupReadback(cleanupReadback);
  const trackedScriptRefs = scriptRefsFromTrackedFiles(tracked);
  const scannedScriptRefs = asStrings(sourceReceipt.scanned_script_refs, 'source_purity_scan_receipt.scanned_script_refs');
  const summaryScannedScriptRefs = asStrings(currentSummary.scanned_script_refs, 'current_scan_summary.scanned_script_refs');
  const gatedScriptRefs = asStrings(
    (scriptMorphology.script_to_pack_retirement_gates as JsonObject[])
      .flatMap((entry) => entry.tracked_script_refs as string[]),
    'script_morphology_policy.script_to_pack_retirement_gates.tracked_script_refs',
  );
  const summaryGatedScriptRefs = asStrings(currentSummary.gated_script_refs, 'current_scan_summary.gated_script_refs');
  const selfGuardRefs = asStrings(
    (scriptMorphology.active_caller_scan_policy as JsonObject).self_guard_test_refs,
    'script_morphology_policy.active_caller_scan_policy.self_guard_test_refs',
  );

  if (receipt.receipt_status !== 'current_script_morphology_machine_gate_passed') {
    guardViolations.push('script-to-pack receipt status must remain current_script_morphology_machine_gate_passed');
  }
  if (receipt.closure_status !== 'machine_gate_landed_not_success_readiness_or_retirement') {
    guardViolations.push('script-to-pack receipt closure_status must not claim success readiness or retirement');
  }
  if (sourceReceipt.status !== currentSummary.source_purity_scan_status) {
    guardViolations.push('script-to-pack current_scan_summary.source_purity_scan_status drift');
  }
  if (activeCallerScan.status !== currentSummary.active_script_caller_scan_status) {
    guardViolations.push('script-to-pack current_scan_summary.active_script_caller_scan_status drift');
  }
  if ((scriptMorphology.active_caller_scan_policy as JsonObject).policy_id !== currentSummary.active_caller_scan_policy_id) {
    guardViolations.push('script-to-pack current_scan_summary.active_caller_scan_policy_id drift');
  }
  if (sourceRefIntegrityGuard.guard_id !== currentSummary.source_ref_integrity_guard_id) {
    guardViolations.push('script-to-pack current_scan_summary.source_ref_integrity_guard_id drift');
  }
  if (currentSummary.source_ref_integrity_status !== 'passed') {
    guardViolations.push('script-to-pack source_ref_integrity_status must be passed');
  }
  if (Number(currentSummary.orphan_script_count) !== 0) {
    guardViolations.push('script-to-pack active caller scan reports orphan scripts');
  }
  if (Number(currentSummary.scanned_script_count) !== scannedScriptRefs.length) {
    guardViolations.push('script-to-pack current_scan_summary.scanned_script_count drift');
  }
  if (Number(currentSummary.gated_script_count) !== gatedScriptRefs.length) {
    guardViolations.push('script-to-pack current_scan_summary.gated_script_count drift');
  }
  if (Number(currentSummary.script_gate_count) !== (scriptMorphology.script_to_pack_retirement_gates as unknown[]).length) {
    guardViolations.push('script-to-pack current_scan_summary.script_gate_count drift');
  }
  if (cleanupReadback.cleanup_candidate_count !== scannedScriptRefs.length) {
    guardViolations.push('script-to-pack cleanup readback candidate count drift');
  }
  if (cleanupReadback.cleanup_apply_candidate_count !== 0) {
    guardViolations.push('script-to-pack cleanup readback must not authorize cleanup apply');
  }
  if (currentSummary.compact_cleanup_summary_id !== compactCleanupSummary.summary_id) {
    guardViolations.push('script-to-pack compact cleanup summary id drift');
  }
  if (currentSummary.compact_cleanup_summary_output_ref !== 'script-to-pack-readback.compact_cleanup_summary') {
    guardViolations.push('script-to-pack compact cleanup summary output ref drift');
  }
  if (Number(currentSummary.compact_cleanup_candidate_count) !== cleanupReadback.cleanup_candidate_count) {
    guardViolations.push('script-to-pack compact cleanup candidate count drift');
  }
  if (Number(currentSummary.compact_cleanup_apply_candidate_count) !== cleanupReadback.cleanup_apply_candidate_count) {
    guardViolations.push('script-to-pack compact cleanup apply candidate count drift');
  }
  if (Number(currentSummary.compact_cleanup_missing_evidence_item_count) !== cleanupReadback.missing_evidence_item_count) {
    guardViolations.push('script-to-pack compact cleanup missing evidence item count drift');
  }
  if (Number(currentSummary.compact_cleanup_sample_candidate_count) !== Number(compactCleanupSummary.sample_cleanup_candidate_count)) {
    guardViolations.push('script-to-pack compact cleanup sample candidate count drift');
  }
  if (currentSummary.compact_cleanup_readback_can_authorize_delete !== false) {
    guardViolations.push('script-to-pack compact cleanup summary must not authorize physical delete');
  }
  if (currentSummary.compact_cleanup_readback_can_claim_retirement_complete !== false) {
    guardViolations.push('script-to-pack compact cleanup summary must not claim retirement complete');
  }
  (cleanupReadback.cleanup_candidates as JsonObject[]).forEach((candidate) => {
    if (candidate.can_apply_cleanup !== false) {
      guardViolations.push(`script-to-pack cleanup readback ${candidate.script_ref} can_apply_cleanup must be false`);
    }
    if (!Array.isArray(candidate.missing_evidence) || candidate.missing_evidence.length === 0) {
      guardViolations.push(`script-to-pack cleanup readback ${candidate.script_ref} missing_evidence must be non-empty`);
    }
    if (!String(candidate.owner_delta_route ?? '').startsWith('route-to-owner:')) {
      guardViolations.push(`script-to-pack cleanup readback ${candidate.script_ref} owner_delta_route missing`);
    }
    if (!String(candidate.typed_blocker_ref_shape ?? '').startsWith('oma-typed-blocker:')) {
      guardViolations.push(`script-to-pack cleanup readback ${candidate.script_ref} typed_blocker_ref_shape missing`);
    }
  });
  assertSameStringSet(scannedScriptRefs, trackedScriptRefs, 'script-to-pack scanned_script_refs vs tracked scripts', guardViolations);
  assertSameStringSet(summaryScannedScriptRefs, scannedScriptRefs, 'script-to-pack summary scanned_script_refs', guardViolations);
  assertSameStringSet(summaryGatedScriptRefs, gatedScriptRefs, 'script-to-pack summary gated_script_refs', guardViolations);
  assertSameStringSet(selfGuardRefs, asStrings(currentSummary.active_caller_scan_self_guard_refs, 'current_scan_summary.active_caller_scan_self_guard_refs'), 'script-to-pack self guard refs', guardViolations);

  const forbiddenTrueClaims = [
    ['authority_boundary.can_authorize_script_retirement', receipt.authority_boundary?.can_authorize_script_retirement],
    ['authority_boundary.can_claim_OPL_primitive_parity', receipt.authority_boundary?.can_claim_OPL_primitive_parity],
    ['authority_boundary.can_promote_default_agent_without_gate', receipt.authority_boundary?.can_promote_default_agent_without_gate],
    ['authority_boundary.can_claim_target_domain_ready', receipt.authority_boundary?.can_claim_target_domain_ready],
    ['authority_boundary.can_claim_domain_ready', receipt.authority_boundary?.can_claim_domain_ready],
    ['authority_boundary.can_claim_production_ready', receipt.authority_boundary?.can_claim_production_ready],
  ];
  forbiddenTrueClaims.forEach(([label, value]) => {
    if (value !== false) {
      guardViolations.push(`script-to-pack receipt ${label} must be false`);
    }
  });

  return {
    guard_id: guard.guard_id,
    state: guard.state,
    command_ref: guard.command_ref,
    json_readback_command_ref: guard.json_readback_command_ref ?? null,
    cleanup_readback_command_ref: guard.cleanup_readback_command_ref ?? null,
    cleanup_readback_output_ref: guard.cleanup_readback_output_ref ?? null,
    receipt_ref: guard.receipt_ref,
    authority_functions_ref: guard.authority_functions_ref,
    scanned_script_count: scannedScriptRefs.length,
    gated_script_count: gatedScriptRefs.length,
    orphan_script_count: activeCallerScan.orphan_script_count ?? 0,
    source_purity_scan_status: sourceReceipt.status,
    active_script_caller_scan_status: activeCallerScan.status,
    active_caller_scan_policy_id: currentSummary.active_caller_scan_policy_id,
    source_ref_integrity_guard_id: currentSummary.source_ref_integrity_guard_id,
    source_ref_integrity_status: currentSummary.source_ref_integrity_status,
    receipt_status: receipt.receipt_status,
    closure_status: receipt.closure_status,
    hard_fail: guardViolations.length > 0,
    cleanup_readback: compactCleanupSummary,
    cleanup_readback_full: cleanupReadback,
    claims: {
      claims_script_retirement_authorized: false,
      claims_opl_primitive_parity: false,
      claims_no_active_caller: false,
      claims_app_or_registry_readiness: false,
      claims_generated_hosted_readiness: false,
      claims_target_agent_ready: false,
      claims_domain_ready: false,
      claims_production_ready: false,
    },
    authority_boundary: {
      guard_can_authorize_script_retirement: false,
      guard_can_claim_opl_primitive_parity: false,
      guard_can_claim_no_active_caller: false,
      guard_can_claim_app_or_registry_readiness: false,
      guard_can_claim_generated_hosted_readiness: false,
      guard_can_claim_target_agent_ready: false,
      guard_can_claim_domain_ready: false,
      guard_can_claim_production_ready: false,
    },
  };
}

function validateAggregateExemption(entry: JsonObject): string | undefined {
  const sourceRef = String(entry.source_contract_ref);
  const indexRef = String(entry.leaf_index_ref);
  const manifestRef = String(entry.bundle_manifest_ref);
  if (!fs.existsSync(path.join(repoRoot, sourceRef))) {
    return `${sourceRef} is missing`;
  }
  if (!fs.existsSync(path.join(repoRoot, indexRef))) {
    return `${indexRef} is missing`;
  }
  if (!fs.existsSync(path.join(repoRoot, manifestRef))) {
    return `${manifestRef} is missing`;
  }
  const source = readJson(sourceRef);
  const index = readJson(indexRef);
  const manifest = readJson(manifestRef);
  if (source.aggregate_ref !== entry.aggregate_ref) {
    return `${sourceRef} aggregate_ref does not match ${entry.aggregate_ref}`;
  }
  if (index.aggregate_ref !== entry.aggregate_ref) {
    return `${indexRef} aggregate_ref does not match ${entry.aggregate_ref}`;
  }
  if (manifest.aggregate_ref !== entry.aggregate_ref) {
    return `${manifestRef} aggregate_ref does not match ${entry.aggregate_ref}`;
  }
  if (source.leaf_index_ref !== indexRef) {
    return `${sourceRef} leaf_index_ref does not match ${indexRef}`;
  }
  if (source.bundle_manifest_ref !== manifestRef) {
    return `${sourceRef} bundle_manifest_ref does not match ${manifestRef}`;
  }
  if (index.bundle_manifest_ref !== manifestRef) {
    return `${indexRef} bundle_manifest_ref does not match ${manifestRef}`;
  }
  if (manifest.source_contract_ref !== sourceRef) {
    return `${manifestRef} source_contract_ref does not match ${sourceRef}`;
  }
  if (manifest.leaf_index_ref !== indexRef) {
    return `${manifestRef} leaf_index_ref does not match ${indexRef}`;
  }
  if (manifest.generator?.check_command !== entry.check_command) {
    return `${manifestRef} generator.check_command does not match ${entry.check_command}`;
  }
  if (
    entry.generated_consumer_surface_must_be_do_not_edit === true
    && manifest.generated_consumer_surface?.do_not_edit !== true
  ) {
    return `${manifestRef} generated_consumer_surface.do_not_edit must be true`;
  }
  const digestInputs = manifest.source_digest?.inputs;
  if (!Array.isArray(digestInputs)) {
    return `${manifestRef} source_digest.inputs must be an array`;
  }
  const digest = manifest.source_digest?.value;
  const expectedDigest = sha256ForFiles(digestInputs.map(String));
  if (digest !== expectedDigest) {
    return `${manifestRef} source_digest.value does not match source parts`;
  }
  return undefined;
}

const jsonOutput = process.argv.includes('--json');
const scriptToPackReadbackOutput = process.argv.includes('--script-to-pack-readback');
const strict = process.argv.includes('--strict') || process.argv.includes('strict');
const policy = readJson(policyPath);
const lane = (policy.lanes as JsonObject)[strict ? 'strict' : 'advisory'] as JsonObject;
const budget = Number(lane.budget_lines);
const failOnOverBudget = Boolean(lane.fail_on_over_budget);
const tracked = trackedFiles();
const scanned = tracked.filter((relativePath) => matchesScope(relativePath, policy.scan_scope as JsonObject));
const violations: string[] = [];
const guardViolations: string[] = [];
const acceptedAggregates: string[] = [];
const scriptToPackReceiptGuardSummary = validateScriptToPackReceiptGuard(policy, tracked, guardViolations);

scanned.forEach((relativePath) => {
  const lines = lineCount(relativePath);
  if (lines <= budget) {
    return;
  }
  const exemption = aggregateExemption(relativePath, policy);
  if (exemption) {
    const exemptionError = validateAggregateExemption(exemption);
    if (!exemptionError) {
      acceptedAggregates.push(`${relativePath} (${lines} lines, generated aggregate)`);
      return;
    }
    violations.push(`${relativePath}: ${lines} lines, invalid generated aggregate exemption: ${exemptionError}`);
    return;
  }
  violations.push(`${relativePath}: ${lines} lines > ${budget}`);
});

const exitCode = guardViolations.length > 0 || (violations.length > 0 && failOnOverBudget) ? 1 : 0;

if (scriptToPackReadbackOutput) {
  const cleanupReadback = scriptToPackReceiptGuardSummary?.cleanup_readback_full ?? {
    surface_kind: 'oma_script_to_pack_retirement_cleanup_readback',
    version: 'script-to-pack-retirement-cleanup-readback.v1',
    owner: 'opl-meta-agent',
    target_domain_id: 'opl-meta-agent',
    state: 'failed',
    ok: false,
    cleanup_candidate_count: 0,
    cleanup_apply_candidate_count: 0,
    cleanup_candidates: [],
    violations: guardViolations,
  };
  console.log(JSON.stringify({
    ...cleanupReadback,
    ok: exitCode === 0 && cleanupReadback.ok !== false,
    state: exitCode === 0
      ? cleanupReadback.state
      : 'failed',
    policy_ref: policyPath,
    compact_cleanup_summary: scriptToPackReceiptGuardSummary?.cleanup_readback ?? compactCleanupReadback(cleanupReadback),
    violation_count: guardViolations.length,
    violations: guardViolations,
  }, null, 2));
  process.exit(exitCode);
}

if (jsonOutput) {
  const scriptToPackReceiptGuardJson = scriptToPackReceiptGuardSummary
    ? Object.fromEntries(
      Object.entries(scriptToPackReceiptGuardSummary)
        .filter(([key]) => key !== 'cleanup_readback_full'),
    )
    : {};
  console.log(JSON.stringify({
    surface_kind: 'oma_source_structure_readback',
    version: 'source-structure-readback.v1',
    owner: 'opl-meta-agent',
    target_domain_id: 'opl-meta-agent',
    state: exitCode === 0 ? 'passed' : 'failed',
    ok: exitCode === 0,
    mode: strict ? 'strict' : 'advisory',
    policy_ref: policyPath,
    readback_role: 'source_structure_line_budget_and_script_to_pack_receipt_guard_readback',
    readback_is_authority: false,
    line_budget: {
      budget_lines: budget,
      fail_on_over_budget: failOnOverBudget,
      scanned_file_count: scanned.length,
      accepted_generated_aggregate_count: acceptedAggregates.length,
      accepted_generated_aggregates: acceptedAggregates,
      violation_count: violations.length,
      violations,
    },
    script_to_pack_receipt_guard: {
      ...scriptToPackReceiptGuardJson,
      violation_count: guardViolations.length,
      violations: guardViolations,
    },
    authority_boundary: {
      can_write_target_domain_truth: false,
      can_write_target_owner_receipt_body: false,
      can_authorize_script_retirement: false,
      can_claim_opl_primitive_parity: false,
      can_claim_no_active_caller: false,
      can_claim_app_or_registry_readiness: false,
      can_claim_generated_hosted_readiness: false,
      can_claim_target_agent_ready: false,
      can_claim_domain_ready: false,
      can_claim_production_ready: false,
    },
  }, null, 2));
} else {
  console.log(`source structure ${strict ? 'strict' : 'advisory'} lane scanned ${scanned.length} tracked files`);
  if (acceptedAggregates.length > 0) {
    console.log('accepted generated aggregates:');
    acceptedAggregates.forEach((entry) => console.log(`  ${entry}`));
  }
  if (scriptToPackReceiptGuardSummary) {
    console.log(
      `script-to-pack receipt guard checked ${scriptToPackReceiptGuardSummary.scanned_script_count} scripts, `
      + `${scriptToPackReceiptGuardSummary.gated_script_count} gated refs, `
      + `${scriptToPackReceiptGuardSummary.orphan_script_count} orphan scripts`,
    );
  }
  if (guardViolations.length > 0) {
    console.log('script-to-pack receipt guard findings:');
    guardViolations.forEach((entry) => console.log(`  ${entry}`));
  }
  if (violations.length > 0) {
    console.log('line budget findings:');
    violations.forEach((entry) => console.log(`  ${entry}`));
  }
}

process.exit(exitCode);

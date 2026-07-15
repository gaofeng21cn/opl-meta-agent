import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { validateJsonSchemaPayload } from 'opl-framework/json-schema-registry';

import {
  buildStandardAgentDeveloperProofRequest,
  readStandardAgentDeveloperProofReceipt,
  STANDARD_AGENT_DEVELOPER_PROOF_OPERATION_IDS,
  type StandardAgentDeveloperProofReceipt,
  type StandardAgentDeveloperProofRequest,
} from '../scripts/lib/standard-agent-developer-proof.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';
import {
  readJsonFile as readJson,
  repoRoot,
  withTempDir,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

const profileRef = 'opl-profile:evidence_grounded_decision_agent_profile.v1';

function validate(schemaRef: string, payload: unknown) {
  const schema = readJson(path.join(repoRoot, schemaRef));
  return validateJsonSchemaPayload({
    schemaId: String(schema.$id),
    schema,
    sourceRef: schemaRef,
  }, payload);
}

function buildRequest(dir: string): {
  request: StandardAgentDeveloperProofRequest;
  requestPath: string;
} {
  const requestPath = path.join(dir, 'standard-agent-developer-proof-request.json');
  const targetDir = path.join(dir, 'target-agent');
  const request = buildStandardAgentDeveloperProofRequest({
    requestRef: pathToFileURL(requestPath).href,
    targetAgent: {
      domain_id: 'developer-proof-agent',
      target_brief: 'Create an evidence-grounded owner-gated agent.',
      selected_opl_profile_refs: [profileRef],
      profile_selection_rationale: 'The declared target requires evidence-grounded decisions.',
    },
    targetRepoRef: pathToFileURL(targetDir).href,
    packageManifestRef: pathToFileURL(
      path.join(targetDir, 'contracts', 'opl_agent_package_manifest.json'),
    ).href,
    scaffoldMaterializationRequestRef: pathToFileURL(
      path.join(dir, 'scaffold-materialization-request.json'),
    ).href,
    stageDecompositionCloseoutRef: pathToFileURL(
      path.join(dir, 'stage-decomposition-closeout.json'),
    ).href,
    agentSkeletonBuildCloseoutRef: pathToFileURL(
      path.join(dir, 'agent-skeleton-build-closeout.json'),
    ).href,
  });
  writeJson(requestPath, request as unknown as JsonObject);
  return { request, requestPath };
}

function buildReceipt(
  request: StandardAgentDeveloperProofRequest,
  requestPath: string,
): StandardAgentDeveloperProofReceipt {
  const inputRefs = Object.fromEntries(
    request.operations.map((operation) => [operation.operation_id, operation.input_refs]),
  ) as Record<string, string[]>;
  return {
    surface_kind: 'opl_standard_agent_developer_proof_receipt',
    version: 'opl-standard-agent-developer-proof-receipt.v1',
    request_id: request.request_id,
    request_ref: request.request_ref,
    request_sha256: createHash('sha256').update(fs.readFileSync(requestPath)).digest('hex'),
    target_identity: { ...request.target_identity },
    status: 'passed',
    proofs: {
      profile_inspect_select: {
        operation_id: 'profile_inspect_select',
        status: 'passed',
        input_refs: inputRefs.profile_inspect_select,
        output: {
          profile_selection_receipt: {
            surface_kind: 'opl_profile_selection_receipt',
            selected_profile_refs: [profileRef],
            matched_trigger_signals: ['evidence-grounded'],
          },
          profile_inspection_readbacks: [{
            status: 'found',
            profile: { profile_ref: profileRef },
          }],
        },
      },
      scaffold_materialize_validate: {
        operation_id: 'scaffold_materialize_validate',
        status: 'passed',
        input_refs: inputRefs.scaffold_materialize_validate,
        output: {
          scaffold_materialization_receipt: {
            surface_kind: 'opl_agent_scaffold_materialization_receipt',
            status: 'materialized',
            build_receipt_ref: 'build-receipt-ref:developer-proof-agent',
            build_receipt: { receipt_ref: 'build-receipt-ref:developer-proof-agent' },
            materialized_file_digests: [{
              path: 'agent/stages/manifest.json',
              sha256: 'a'.repeat(64),
            }],
            validation_refs: ['validation-ref:developer-proof-agent/scaffold'],
          },
          standard_domain_agent_scaffold: {
            validation: { status: 'passed', blockers: [] },
          },
        },
      },
      generated_interfaces: {
        operation_id: 'generated_interfaces',
        status: 'passed',
        input_refs: inputRefs.generated_interfaces,
        output: { generated_agent_interfaces: { status: 'ready' } },
      },
      package_manifest_validate: {
        operation_id: 'package_manifest_validate',
        status: 'passed',
        input_refs: inputRefs.package_manifest_validate,
        output: { opl_agent_package_manifest: { status: 'valid' } },
      },
      profile_conformance: {
        operation_id: 'profile_conformance',
        status: 'passed',
        input_refs: inputRefs.profile_conformance,
        output: { profile_conformance: { status: 'passed' } },
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
}

test('developer proof request lists exactly five Framework-owned operations and exact input refs', () => {
  withTempDir('oma-developer-proof-request-', (dir) => {
    const { request } = buildRequest(dir);
    assert.deepEqual(
      request.operations.map((operation) => operation.operation_id),
      STANDARD_AGENT_DEVELOPER_PROOF_OPERATION_IDS,
    );
    assert.equal(request.operations.every((operation) =>
      operation.execution_owner === 'one-person-lab/OPL Framework'
      && operation.input_refs.length > 0
    ), true);
    assert.equal(request.authority_boundary.oma_executes_framework_operations, false);
    assert.equal(request.authority_boundary.request_is_execution_receipt, false);
    assert.equal(
      request.inputs.package_manifest_validate.trust_tier,
      'third_party_unverified',
    );
    assert.equal(request.inputs.package_manifest_validate.source_kind, 'local_file');
    assert.equal(validate(
      'contracts/schemas/standard-agent-developer-proof-request.producer.schema.json',
      request,
    ).ok, true);
  });
});

test('developer proof consumer accepts only a request-bound aggregate Framework receipt', () => {
  withTempDir('oma-developer-proof-receipt-', (dir) => {
    const { request, requestPath } = buildRequest(dir);
    const receipt = buildReceipt(request, requestPath);
    const receiptPath = path.join(dir, 'standard-agent-developer-proof-receipt.json');
    writeJson(receiptPath, receipt as unknown as JsonObject);
    assert.equal(validate(
      'contracts/schemas/standard-agent-developer-proof-receipt.consumer.schema.json',
      receipt,
    ).ok, true);
    const consumed = readStandardAgentDeveloperProofReceipt({
      receiptRef: receiptPath,
      requestPath,
      request,
    });
    assert.equal(consumed.outputs.generatedInterfaces.generated_agent_interfaces.status, 'ready');
    assert.equal(consumed.outputs.packageManifestValidation.opl_agent_package_manifest.status, 'valid');
  });
});

test('developer proof consumer fails closed on identity, authority, digest, input refs, or proof drift', () => {
  withTempDir('oma-developer-proof-fail-closed-', (dir) => {
    const { request, requestPath } = buildRequest(dir);
    const receiptPath = path.join(dir, 'receipt.json');
    const assertRejected = (
      mutate: (receipt: StandardAgentDeveloperProofReceipt) => void,
      pattern: RegExp,
    ) => {
      const receipt = buildReceipt(request, requestPath);
      mutate(receipt);
      writeJson(receiptPath, receipt as unknown as JsonObject);
      assert.throws(
        () => readStandardAgentDeveloperProofReceipt({ receiptRef: receiptPath, requestPath, request }),
        pattern,
      );
    };
    assertRejected(
      (receipt) => { receipt.surface_kind = 'forged_receipt' as typeof receipt.surface_kind; },
      /only opl_standard_agent_developer_proof_receipt/i,
    );
    assertRejected(
      (receipt) => { receipt.request_sha256 = '0'.repeat(64); },
      /request_sha256/i,
    );
    assertRejected(
      (receipt) => {
        (receipt.target_identity as unknown as JsonObject).unknown_identity = 'forbidden';
      },
      /target_identity contains unsupported fields/i,
    );
    assertRejected(
      (receipt) => {
        (receipt.authority_boundary as unknown as JsonObject).unknown_authority = false;
      },
      /authority_boundary contains unsupported fields/i,
    );
    assertRejected(
      (receipt) => { receipt.proofs.generated_interfaces.input_refs = ['drifted-input-ref']; },
      /input refs drifted/i,
    );
    assertRejected(
      (receipt) => {
        delete (receipt.proofs as Partial<typeof receipt.proofs>).profile_conformance;
      },
      /exactly the five declared proof operations/i,
    );
  });
});

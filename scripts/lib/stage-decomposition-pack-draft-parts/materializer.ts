import fs from 'node:fs';
import path from 'node:path';
import type { JsonObject } from '../domain-pack.ts';
import { writeJson } from '../meta-agent-loop-io.ts';
import type { StageDecompositionPackDraft } from './shared.ts';
import {
  asRecordArray,
  asString,
  validateBody,
  validateRelativeMarkdownPath,
} from './shared.ts';

function refTemplateRecord({
  contract,
  fileName,
  refKind,
  refValue,
}: {
  contract: JsonObject;
  fileName: string;
  refKind: string;
  refValue: string;
}): JsonObject {
  return {
    surface_kind: 'opl_stage_native_artifact_materialized_ref',
    version: 'stage-native-artifact-materialized-ref.v1',
    target_domain_id: contract.target_domain_id,
    stage_id: contract.stage_id,
    file_name: fileName,
    ref_kind: refKind,
    ref: refValue,
    materialized_by: 'opl-meta-agent',
    materialization_kind: 'compiler_ref_template_only_not_runtime_state',
    runtime_state_created: false,
    owner_promotion_created: false,
    target_worktree_lifecycle_managed: false,
    owner_receipt_body_created: false,
    contains_target_artifact_body: false,
    authority_boundary: contract.authority_boundary,
  };
}

function materializeStageNativeArtifactRefFiles(targetAgentDir: string, draft: StageDecompositionPackDraft): void {
  const contracts = asRecordArray(draft.stage_native_artifact_contract.contracts, 'stage_native_artifact_contract.contracts');
  for (const contract of contracts) {
    const stageId = asString(contract.stage_id, 'stage_native_artifact_contract.contracts[].stage_id');
    const outputDir = path.join(targetAgentDir, 'contracts', 'stage_native_artifacts', stageId);
    fs.mkdirSync(outputDir, { recursive: true });
    const fileRefs = [
      ['stage.json', 'stage_json_ref', String(contract.stage_json_ref)],
      ['attempt.json', 'stage_attempt_json_ref', String(contract.attempt_json_ref)],
      ['stage.manifest.json', 'stage_manifest_ref', String(contract.manifest_ref)],
      ['receipt.json', 'stage_attempt_receipt_ref', String(contract.receipt_ref)],
      ['current.json', 'stage_current_pointer_ref', String(contract.current_pointer_ref)],
      ['canonical.json', 'canonical_artifact_ref', String(contract.canonical_artifact_ref)],
      ['export.json', 'stage_export_ref', String(contract.export_ref)],
      ['lineage.json', 'stage_lineage_ref', String(contract.lineage_ref)],
      ['retention.json', 'stage_retention_ref', String(contract.retention_ref)],
      ['physical_kernel_locator.json', 'opl_physical_kernel_locator_ref', String(contract.physical_kernel_locator_ref)],
      ['conformance.json', 'stage_artifact_conformance_ref', String(contract.conformance_ref)],
      ['workbench_consumption.json', 'stage_artifact_workbench_consumption_ref', String(contract.workbench_consumption_ref)],
    ] as const;
    fileRefs.forEach(([fileName, refKind, refValue]) => {
      writeJson(path.join(outputDir, fileName), refTemplateRecord({
        contract,
        fileName,
        refKind,
        refValue,
      }));
    });
  }
}

export function materializeStageDecompositionPackDraft(
  targetAgentDir: string,
  draft: StageDecompositionPackDraft,
): void {
  for (const file of draft.files) {
    const relPath = validateRelativeMarkdownPath(file.path, 'files[].path');
    const body = validateBody(file.body, relPath);
    const filePath = path.join(targetAgentDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
  }
  writeJson(path.join(targetAgentDir, 'contracts', 'action_catalog.json'), draft.action_catalog);
  writeJson(path.join(targetAgentDir, 'contracts', 'artifact_morphology_contract.json'), draft.artifact_morphology_contract);
  writeJson(path.join(targetAgentDir, 'contracts', 'stage_control_plane.json'), draft.stage_control_plane);
  writeJson(
    path.join(targetAgentDir, 'contracts', 'stage_native_artifact_contract.json'),
    draft.stage_native_artifact_contract,
  );
  materializeStageNativeArtifactRefFiles(targetAgentDir, draft);
  writeJson(path.join(targetAgentDir, 'contracts', 'foundry_agent_series.json'), draft.foundry_agent_series);
}

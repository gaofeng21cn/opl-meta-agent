import fs from 'node:fs';
import {
  absolute,
  asObjects,
  checkJsonFile,
  type JsonObject,
  orderedObject,
  readJson,
  runSyncJsonBundleCli,
  sha256ForFiles,
  withoutKeys,
  writeJson,
} from './lib/sync-json-bundle.ts';

const refs = {
  aggregate: 'contracts/stage_control_plane.json',
  source: 'contracts/stage_control_plane.source.json',
  leafIndex: 'contracts/stage_control_plane.leaf-index.json',
  bundleManifest: 'contracts/stage_control_plane.bundle-manifest.json',
  root: 'contracts/stage_control_plane.parts/root.json',
  stageLeafDir: 'contracts/stage_control_plane.parts/stages',
  stageNativeRoot: 'contracts/stage_control_plane.parts/stage_native_artifact_contract/root.json',
  stageNativeLeafDir: 'contracts/stage_control_plane.parts/stage_native_artifact_contract/contracts',
};

function stageFileRef(stageId: string): string {
  return `${refs.stageLeafDir}/${stageId}.json`;
}

function stageNativeFileRef(stageId: string): string {
  return `${refs.stageNativeLeafDir}/${stageId}.json`;
}

function sourceDigestInputRefs(source: JsonObject, index: JsonObject): string[] {
  return [
    refs.source,
    refs.leafIndex,
    String(source.source_root_ref),
    String(source.stage_native_artifact_contract_root_ref),
    ...asObjects(index.stages, 'stage control leaf index stages').map((entry) => String(entry.ref)),
    ...asObjects(index.stage_native_artifact_contracts, 'stage control leaf index native contracts')
      .map((entry) => String(entry.ref)),
  ];
}

function resetGeneratedDir(relativePath: string): void {
  fs.rmSync(absolute(relativePath), { recursive: true, force: true });
  fs.mkdirSync(absolute(relativePath), { recursive: true });
}

function buildSourceContract(aggregate: JsonObject): JsonObject {
  const native = aggregate.stage_native_artifact_contract as JsonObject;
  return {
    surface_kind: 'family_stage_control_plane_source_contract',
    version: 'family-stage-control-plane-source.v1',
    owner: 'opl-meta-agent',
    target_domain_id: aggregate.target_domain_id,
    state: 'active_machine_source_contract',
    aggregate_ref: refs.aggregate,
    source_root_ref: refs.root,
    leaf_index_ref: refs.leafIndex,
    bundle_manifest_ref: refs.bundleManifest,
    stage_leaf_dir_ref: `${refs.stageLeafDir}/`,
    stage_native_artifact_contract_root_ref: refs.stageNativeRoot,
    stage_native_artifact_contract_leaf_dir_ref: `${refs.stageNativeLeafDir}/`,
    top_level_key_order: Object.keys(aggregate),
    stage_native_artifact_contract_key_order: Object.keys(native),
    maintenance_policy: {
      aggregate_is_generated_consumer_surface: true,
      edit_source_parts_first: true,
      split_command: 'npm run stage-control:split',
      write_command: 'npm run stage-control:write',
      check_command: 'npm run stage-control:check',
      bundle_manifest_ref: refs.bundleManifest,
      must_not_break_existing_aggregate_ref: true,
      aggregate_consumers_continue_to_read: refs.aggregate,
    },
    authority_boundary: {
      domain_truth_owner: 'opl-meta-agent',
      generated_interface_owner: 'one-person-lab',
      source_parts_owner: 'opl-meta-agent',
      aggregate_consumer_surface_owner: 'opl-meta-agent',
      opl_can_write_domain_truth: false,
      oma_can_write_target_truth: false,
      oma_can_write_target_owner_receipt_body: false,
    },
  };
}

function buildLeafIndex(aggregate: JsonObject): JsonObject {
  const stages = aggregate.stages as JsonObject[];
  const contracts = (aggregate.stage_native_artifact_contract as JsonObject).contracts as JsonObject[];
  return {
    surface_kind: 'family_stage_control_plane_leaf_index',
    version: 'family-stage-control-plane-leaf-index.v1',
    owner: 'opl-meta-agent',
    target_domain_id: aggregate.target_domain_id,
    source_contract_ref: refs.source,
    aggregate_ref: refs.aggregate,
    bundle_manifest_ref: refs.bundleManifest,
    stage_order: stages.map((stage) => stage.stage_id),
    stages: stages.map((stage) => ({
      stage_id: stage.stage_id,
      ref: stageFileRef(String(stage.stage_id)),
    })),
    stage_native_artifact_contracts: contracts.map((contract) => ({
      stage_id: contract.stage_id,
      ref: stageNativeFileRef(String(contract.stage_id)),
    })),
    maintenance_policy: {
      leaf_files_are_source: true,
      aggregate_reconstruction_command: 'npm run stage-control:write',
      aggregate_drift_check_command: 'npm run stage-control:check',
      generated_bundle_manifest_ref: refs.bundleManifest,
    },
  };
}

function buildBundleManifest(source: JsonObject, index: JsonObject): JsonObject {
  const digestInputs = sourceDigestInputRefs(source, index);
  return {
    surface_kind: 'opl_pack_source_generated_bundle_manifest',
    version: 'opl-pack-source-generated-bundle-manifest.v1',
    bundle_id: 'opl-meta-agent.stage_control_plane',
    owner: 'opl-meta-agent',
    target_domain_id: source.target_domain_id,
    state: 'active_generated_bundle_metadata',
    aggregate_ref: refs.aggregate,
    source_contract_ref: refs.source,
    leaf_index_ref: refs.leafIndex,
    source_roots: {
      source_contract_ref: refs.source,
      source_root_ref: source.source_root_ref,
      leaf_index_ref: refs.leafIndex,
      stage_native_artifact_contract_root_ref: source.stage_native_artifact_contract_root_ref,
    },
    source_leaf_dirs: {
      stage_leaf_dir_ref: source.stage_leaf_dir_ref,
      stage_native_artifact_contract_leaf_dir_ref: source.stage_native_artifact_contract_leaf_dir_ref,
    },
    source_leaves: {
      stages: index.stages,
      stage_native_artifact_contracts: index.stage_native_artifact_contracts,
    },
    generator: {
      script_ref: 'scripts/sync-stage-control-plane.ts',
      split_command: 'npm run stage-control:split',
      write_command: 'npm run stage-control:write',
      check_command: 'npm run stage-control:check',
      write_outputs: [
        refs.aggregate,
        refs.bundleManifest,
      ],
      check_rebuilds_from_source_parts: true,
    },
    source_digest: {
      algorithm: 'sha256',
      equivalent_scope: 'source_contract_leaf_index_roots_and_leaf_files',
      inputs: digestInputs,
      value: sha256ForFiles(digestInputs),
    },
    generated_consumer_surface: {
      ref: refs.aggregate,
      do_not_edit: true,
      role: 'generated_consumer_surface',
      generated_from: [
        refs.source,
        refs.leafIndex,
        'contracts/stage_control_plane.parts/**',
      ],
      consumers_continue_to_read_ref: refs.aggregate,
    },
    false_authority_flags: {
      aggregate_can_claim_domain_ready: false,
      aggregate_can_write_target_truth: false,
      aggregate_can_write_target_owner_receipt_body: false,
      manifest_can_claim_quality_or_export: false,
      bundle_manifest_can_override_source_parts: false,
    },
    maintenance_policy: {
      edit_source_parts_first: true,
      source_parts_are_authority: true,
      aggregate_is_generated: true,
      manifest_is_generated_metadata: true,
      drift_check_command: 'npm run stage-control:check',
    },
  };
}

function splitFromAggregate(): void {
  const aggregate = readJson(refs.aggregate);
  const stages = aggregate.stages as JsonObject[];
  const native = aggregate.stage_native_artifact_contract as JsonObject;
  const contracts = native.contracts as JsonObject[];

  resetGeneratedDir(refs.stageLeafDir);
  resetGeneratedDir(refs.stageNativeLeafDir);

  writeJson(refs.source, buildSourceContract(aggregate));
  writeJson(refs.leafIndex, buildLeafIndex(aggregate));
  writeJson(refs.root, withoutKeys(aggregate, ['stages', 'stage_native_artifact_contract']));
  writeJson(refs.stageNativeRoot, withoutKeys(native, ['contracts']));
  stages.forEach((stage) => writeJson(stageFileRef(String(stage.stage_id)), stage));
  contracts.forEach((contract) => writeJson(stageNativeFileRef(String(contract.stage_id)), contract));
  writeJson(refs.bundleManifest, buildBundleManifest(readJson(refs.source), readJson(refs.leafIndex)));
}

function validateSourceContract(source: JsonObject): void {
  const expectedRefs: Record<string, string> = {
    aggregate_ref: refs.aggregate,
    source_root_ref: refs.root,
    leaf_index_ref: refs.leafIndex,
    bundle_manifest_ref: refs.bundleManifest,
    stage_leaf_dir_ref: `${refs.stageLeafDir}/`,
    stage_native_artifact_contract_root_ref: refs.stageNativeRoot,
    stage_native_artifact_contract_leaf_dir_ref: `${refs.stageNativeLeafDir}/`,
  };
  Object.entries(expectedRefs).forEach(([field, expected]) => {
    if (source[field] !== expected) {
      throw new Error(`stage control source contract ${field} must be ${expected}.`);
    }
  });
}

function validateLeafIndex(source: JsonObject, index: JsonObject): void {
  const expectedRefs: Record<string, string> = {
    source_contract_ref: refs.source,
    aggregate_ref: refs.aggregate,
    bundle_manifest_ref: refs.bundleManifest,
  };
  Object.entries(expectedRefs).forEach(([field, expected]) => {
    if (index[field] !== expected) {
      throw new Error(`stage control leaf index ${field} must be ${expected}.`);
    }
  });

  const stageEntries = asObjects(index.stages, 'stage control leaf index stages');
  const nativeEntries = asObjects(index.stage_native_artifact_contracts, 'stage control leaf index native contracts');
  const stageOrder = index.stage_order as string[];
  if (!Array.isArray(stageOrder)) {
    throw new Error('stage control leaf index stage_order must be an array.');
  }
  if (stageOrder.length !== stageEntries.length || stageOrder.length !== nativeEntries.length) {
    throw new Error('stage control leaf index stage_order must match stage and native contract leaves.');
  }
  stageEntries.forEach((entry, indexPosition) => {
    const stageId = String(entry.stage_id);
    if (stageOrder[indexPosition] !== stageId) {
      throw new Error(`stage control leaf index stage_order mismatch at ${stageId}.`);
    }
    if (entry.ref !== stageFileRef(stageId)) {
      throw new Error(`stage control leaf index stage ref for ${stageId} must be ${stageFileRef(stageId)}.`);
    }
  });
  nativeEntries.forEach((entry, indexPosition) => {
    const stageId = String(entry.stage_id);
    if (stageOrder[indexPosition] !== stageId) {
      throw new Error(`stage control leaf index native contract order mismatch at ${stageId}.`);
    }
    if (entry.ref !== stageNativeFileRef(stageId)) {
      throw new Error(`stage control leaf index native ref for ${stageId} must be ${stageNativeFileRef(stageId)}.`);
    }
  });

  if (source.leaf_index_ref !== refs.leafIndex) {
    throw new Error(`stage control source contract leaf_index_ref must be ${refs.leafIndex}.`);
  }
}

function validateBundleManifest(source: JsonObject, index: JsonObject): void {
  checkJsonFile(refs.bundleManifest, buildBundleManifest(source, index), 'npm run stage-control:write');
}

function reconstructAggregate(): JsonObject {
  const source = readJson(refs.source);
  validateSourceContract(source);

  const index = readJson(refs.leafIndex);
  validateLeafIndex(source, index);
  const root = readJson(refs.root);
  const nativeRoot = readJson(refs.stageNativeRoot);
  const stages = asObjects(index.stages, 'stage control leaf index stages').map((entry) => readJson(String(entry.ref)));
  const contracts = asObjects(index.stage_native_artifact_contracts, 'stage control leaf index native contracts')
    .map((entry) => readJson(String(entry.ref)));

  const native = orderedObject(
    {
      ...nativeRoot,
      contracts,
    },
    source.stage_native_artifact_contract_key_order as string[],
  );

  return orderedObject(
    {
      ...root,
      stages,
      stage_native_artifact_contract: native,
    },
    source.top_level_key_order as string[],
  );
}

function checkAggregate(): void {
  const source = readJson(refs.source);
  validateSourceContract(source);
  const index = readJson(refs.leafIndex);
  validateLeafIndex(source, index);
  validateBundleManifest(source, index);

  checkJsonFile(refs.aggregate, reconstructAggregate(), 'npm run stage-control:write');
  console.log(`stage control plane aggregate matches ${refs.source}`);
}

function writeAggregate(): void {
  writeJson(refs.aggregate, reconstructAggregate());
  writeJson(refs.bundleManifest, buildBundleManifest(readJson(refs.source), readJson(refs.leafIndex)));
  console.log(`wrote ${refs.aggregate} and ${refs.bundleManifest} from ${refs.source}`);
}

runSyncJsonBundleCli({
  split: splitFromAggregate,
  check: checkAggregate,
  write: writeAggregate,
  usage: 'Usage: node scripts/sync-stage-control-plane.ts [--split|--check|--write]',
});

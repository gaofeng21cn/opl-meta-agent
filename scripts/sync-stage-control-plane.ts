import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, any>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const refs = {
  aggregate: 'contracts/stage_control_plane.json',
  source: 'contracts/stage_control_plane.source.json',
  leafIndex: 'contracts/stage_control_plane.leaf-index.json',
  root: 'contracts/stage_control_plane.parts/root.json',
  stageLeafDir: 'contracts/stage_control_plane.parts/stages',
  stageNativeRoot: 'contracts/stage_control_plane.parts/stage_native_artifact_contract/root.json',
  stageNativeLeafDir: 'contracts/stage_control_plane.parts/stage_native_artifact_contract/contracts',
};

function absolute(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8'));
}

function writeJson(relativePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
  fs.writeFileSync(absolute(relativePath), `${JSON.stringify(payload, null, 2)}\n`);
}

function orderedObject(source: JsonObject, keyOrder: string[]): JsonObject {
  const output: JsonObject = {};
  keyOrder.forEach((key) => {
    if (Object.hasOwn(source, key)) {
      output[key] = source[key];
    }
  });
  Object.keys(source).forEach((key) => {
    if (!Object.hasOwn(output, key)) {
      output[key] = source[key];
    }
  });
  return output;
}

function withoutKeys(source: JsonObject, omittedKeys: string[]): JsonObject {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !omittedKeys.includes(key)),
  );
}

function stageFileRef(stageId: string): string {
  return `${refs.stageLeafDir}/${stageId}.json`;
}

function stageNativeFileRef(stageId: string): string {
  return `${refs.stageNativeLeafDir}/${stageId}.json`;
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
}

function validateSourceContract(source: JsonObject): void {
  const expectedRefs: Record<string, string> = {
    aggregate_ref: refs.aggregate,
    source_root_ref: refs.root,
    leaf_index_ref: refs.leafIndex,
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

function reconstructAggregate(): JsonObject {
  const source = readJson(refs.source);
  validateSourceContract(source);

  const index = readJson(refs.leafIndex);
  const root = readJson(refs.root);
  const nativeRoot = readJson(refs.stageNativeRoot);
  const stages = (index.stages as JsonObject[]).map((entry) => readJson(String(entry.ref)));
  const contracts = (index.stage_native_artifact_contracts as JsonObject[])
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
  const expected = `${JSON.stringify(reconstructAggregate(), null, 2)}\n`;
  const actual = fs.readFileSync(absolute(refs.aggregate), 'utf8');
  if (actual !== expected) {
    console.error(`${refs.aggregate} is out of sync with ${refs.source}.`);
    console.error('Run npm run stage-control:write to regenerate the aggregate consumer surface.');
    process.exit(1);
  }
  console.log(`stage control plane aggregate matches ${refs.source}`);
}

function writeAggregate(): void {
  writeJson(refs.aggregate, reconstructAggregate());
  console.log(`wrote ${refs.aggregate} from ${refs.source}`);
}

const command = process.argv[2] ?? '--check';

if (command === '--split') {
  splitFromAggregate();
} else if (command === '--check') {
  checkAggregate();
} else if (command === '--write') {
  writeAggregate();
} else {
  console.error('Usage: node scripts/sync-stage-control-plane.ts [--split|--check|--write]');
  process.exit(2);
}

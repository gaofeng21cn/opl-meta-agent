import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, any>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const refs = {
  aggregate: 'runtime/authority_functions/meta-agent-authority-functions.json',
  source: 'runtime/authority_functions/meta-agent-authority-functions.source.json',
  leafIndex: 'runtime/authority_functions/meta-agent-authority-functions.leaf-index.json',
  bundleManifest: 'runtime/authority_functions/meta-agent-authority-functions.bundle-manifest.json',
  root: 'runtime/authority_functions/meta-agent-authority-functions.parts/root.json',
  scriptMorphologyRoot:
    'runtime/authority_functions/meta-agent-authority-functions.parts/script_morphology_policy/root.json',
  scriptClassifications:
    'runtime/authority_functions/meta-agent-authority-functions.parts/script_morphology_policy/script-classifications.json',
  scriptToPackRetirementGates:
    'runtime/authority_functions/meta-agent-authority-functions.parts/script_morphology_policy/script-to-pack-retirement-gates.json',
  purposeFirstOwnerDeltaGate:
    'runtime/authority_functions/meta-agent-authority-functions.parts/purpose_first_owner_delta_gate.json',
  sourcePurityScanReceipt:
    'runtime/authority_functions/meta-agent-authority-functions.parts/source_purity_scan_receipt.json',
  functions: 'runtime/authority_functions/meta-agent-authority-functions.parts/functions.json',
  forbiddenRoles: 'runtime/authority_functions/meta-agent-authority-functions.parts/forbidden_roles.json',
};

function absolute(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

function readJson(relativePath: string): any {
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

function asObjects(value: unknown, label: string): JsonObject[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value as JsonObject[];
}

function sourceDigestInputRefs(index: JsonObject): string[] {
  return [
    refs.source,
    refs.leafIndex,
    ...asObjects(index.parts, 'authority function leaf index parts').map((entry) => String(entry.ref)),
  ];
}

function sha256ForFiles(relativePaths: string[]): string {
  const hash = crypto.createHash('sha256');
  relativePaths.forEach((relativePath) => {
    const content = fs.readFileSync(absolute(relativePath), 'utf8');
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(Buffer.byteLength(content)));
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  });
  return `sha256:${hash.digest('hex')}`;
}

function buildSourceContract(aggregate: JsonObject): JsonObject {
  const scriptMorphology = aggregate.script_morphology_policy as JsonObject;
  return {
    surface_kind: 'meta_agent_authority_functions_source_contract',
    version: 'meta-agent-authority-functions-source.v1',
    owner: 'opl-meta-agent',
    target_domain_id: aggregate.domain_id,
    state: 'active_machine_source_contract',
    aggregate_ref: refs.aggregate,
    leaf_index_ref: refs.leafIndex,
    bundle_manifest_ref: refs.bundleManifest,
    source_root_ref: refs.root,
    top_level_key_order: Object.keys(aggregate),
    script_morphology_policy_key_order: Object.keys(scriptMorphology),
    maintenance_policy: {
      aggregate_is_generated_consumer_surface: true,
      edit_source_parts_first: true,
      split_command: 'npm run authority-functions:split',
      write_command: 'npm run authority-functions:write',
      check_command: 'npm run authority-functions:check',
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
  return {
    surface_kind: 'meta_agent_authority_functions_leaf_index',
    version: 'meta-agent-authority-functions-leaf-index.v1',
    owner: 'opl-meta-agent',
    target_domain_id: aggregate.domain_id,
    source_contract_ref: refs.source,
    aggregate_ref: refs.aggregate,
    bundle_manifest_ref: refs.bundleManifest,
    parts: [
      { part_id: 'root', ref: refs.root, aggregate_path: '$' },
      {
        part_id: 'script_morphology_policy_root',
        ref: refs.scriptMorphologyRoot,
        aggregate_path: '$.script_morphology_policy',
      },
      {
        part_id: 'script_classifications',
        ref: refs.scriptClassifications,
        aggregate_path: '$.script_morphology_policy.script_classifications',
      },
      {
        part_id: 'script_to_pack_retirement_gates',
        ref: refs.scriptToPackRetirementGates,
        aggregate_path: '$.script_morphology_policy.script_to_pack_retirement_gates',
      },
      {
        part_id: 'purpose_first_owner_delta_gate',
        ref: refs.purposeFirstOwnerDeltaGate,
        aggregate_path: '$.purpose_first_owner_delta_gate',
      },
      {
        part_id: 'source_purity_scan_receipt',
        ref: refs.sourcePurityScanReceipt,
        aggregate_path: '$.source_purity_scan_receipt',
      },
      { part_id: 'functions', ref: refs.functions, aggregate_path: '$.functions' },
      { part_id: 'forbidden_roles', ref: refs.forbiddenRoles, aggregate_path: '$.forbidden_roles' },
    ],
    maintenance_policy: {
      leaf_files_are_source: true,
      aggregate_reconstruction_command: 'npm run authority-functions:write',
      aggregate_drift_check_command: 'npm run authority-functions:check',
      generated_bundle_manifest_ref: refs.bundleManifest,
    },
  };
}

function buildBundleManifest(source: JsonObject, index: JsonObject): JsonObject {
  const digestInputs = sourceDigestInputRefs(index);
  return {
    surface_kind: 'meta_agent_authority_functions_generated_bundle_manifest',
    version: 'meta-agent-authority-functions-generated-bundle-manifest.v1',
    bundle_id: 'opl-meta-agent.authority_functions',
    owner: 'opl-meta-agent',
    target_domain_id: source.target_domain_id,
    state: 'active_generated_bundle_metadata',
    aggregate_ref: refs.aggregate,
    source_contract_ref: refs.source,
    leaf_index_ref: refs.leafIndex,
    source_root_ref: source.source_root_ref,
    source_parts: index.parts,
    generator: {
      script_ref: 'scripts/sync-authority-functions.ts',
      split_command: 'npm run authority-functions:split',
      write_command: 'npm run authority-functions:write',
      check_command: 'npm run authority-functions:check',
      write_outputs: [
        refs.aggregate,
        refs.bundleManifest,
      ],
      check_rebuilds_from_source_parts: true,
    },
    source_digest: {
      algorithm: 'sha256',
      equivalent_scope: 'source_contract_leaf_index_and_authority_manifest_parts',
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
        'runtime/authority_functions/meta-agent-authority-functions.parts/**',
      ],
      consumers_continue_to_read_ref: refs.aggregate,
    },
    false_authority_flags: {
      aggregate_can_claim_target_agent_ready: false,
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
      drift_check_command: 'npm run authority-functions:check',
    },
  };
}

function splitFromAggregate(): void {
  const aggregate = readJson(refs.aggregate) as JsonObject;
  const scriptMorphology = aggregate.script_morphology_policy as JsonObject;
  const index = buildLeafIndex(aggregate);

  writeJson(refs.source, buildSourceContract(aggregate));
  writeJson(refs.leafIndex, index);
  writeJson(refs.root, withoutKeys(aggregate, [
    'script_morphology_policy',
    'purpose_first_owner_delta_gate',
    'source_purity_scan_receipt',
    'functions',
    'forbidden_roles',
  ]));
  writeJson(refs.scriptMorphologyRoot, withoutKeys(scriptMorphology, [
    'script_classifications',
    'script_to_pack_retirement_gates',
  ]));
  writeJson(refs.scriptClassifications, scriptMorphology.script_classifications);
  writeJson(refs.scriptToPackRetirementGates, scriptMorphology.script_to_pack_retirement_gates);
  writeJson(refs.purposeFirstOwnerDeltaGate, aggregate.purpose_first_owner_delta_gate);
  writeJson(refs.sourcePurityScanReceipt, aggregate.source_purity_scan_receipt);
  writeJson(refs.functions, aggregate.functions);
  writeJson(refs.forbiddenRoles, aggregate.forbidden_roles);
  writeJson(refs.bundleManifest, buildBundleManifest(readJson(refs.source), readJson(refs.leafIndex)));
}

function validateSourceContract(source: JsonObject): void {
  const expectedRefs: Record<string, string> = {
    aggregate_ref: refs.aggregate,
    leaf_index_ref: refs.leafIndex,
    bundle_manifest_ref: refs.bundleManifest,
    source_root_ref: refs.root,
  };
  Object.entries(expectedRefs).forEach(([field, expected]) => {
    if (source[field] !== expected) {
      throw new Error(`authority functions source contract ${field} must be ${expected}.`);
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
      throw new Error(`authority functions leaf index ${field} must be ${expected}.`);
    }
  });
  const partRefs = asObjects(index.parts, 'authority function leaf index parts')
    .map((entry) => String(entry.ref));
  [
    refs.root,
    refs.scriptMorphologyRoot,
    refs.scriptClassifications,
    refs.scriptToPackRetirementGates,
    refs.purposeFirstOwnerDeltaGate,
    refs.sourcePurityScanReceipt,
    refs.functions,
    refs.forbiddenRoles,
  ].forEach((expectedRef) => {
    if (!partRefs.includes(expectedRef)) {
      throw new Error(`authority functions leaf index must include ${expectedRef}.`);
    }
  });
  if (source.leaf_index_ref !== refs.leafIndex) {
    throw new Error(`authority functions source contract leaf_index_ref must be ${refs.leafIndex}.`);
  }
}

function validateBundleManifest(source: JsonObject, index: JsonObject): void {
  const expected = `${JSON.stringify(buildBundleManifest(source, index), null, 2)}\n`;
  const actual = fs.readFileSync(absolute(refs.bundleManifest), 'utf8');
  if (actual !== expected) {
    console.error(`${refs.bundleManifest} is out of sync with ${refs.source} and ${refs.leafIndex}.`);
    console.error('Run npm run authority-functions:write to regenerate the generated bundle metadata.');
    process.exit(1);
  }
}

function reconstructAggregate(): JsonObject {
  const source = readJson(refs.source) as JsonObject;
  validateSourceContract(source);
  const index = readJson(refs.leafIndex) as JsonObject;
  validateLeafIndex(source, index);

  const root = readJson(refs.root) as JsonObject;
  const scriptMorphologyRoot = readJson(refs.scriptMorphologyRoot) as JsonObject;
  const scriptMorphology = orderedObject(
    {
      ...scriptMorphologyRoot,
      script_classifications: readJson(refs.scriptClassifications),
      script_to_pack_retirement_gates: readJson(refs.scriptToPackRetirementGates),
    },
    source.script_morphology_policy_key_order as string[],
  );

  return orderedObject(
    {
      ...root,
      script_morphology_policy: scriptMorphology,
      purpose_first_owner_delta_gate: readJson(refs.purposeFirstOwnerDeltaGate),
      source_purity_scan_receipt: readJson(refs.sourcePurityScanReceipt),
      functions: readJson(refs.functions),
      forbidden_roles: readJson(refs.forbiddenRoles),
    },
    source.top_level_key_order as string[],
  );
}

function checkAggregate(): void {
  const source = readJson(refs.source) as JsonObject;
  validateSourceContract(source);
  const index = readJson(refs.leafIndex) as JsonObject;
  validateLeafIndex(source, index);
  validateBundleManifest(source, index);

  const expected = `${JSON.stringify(reconstructAggregate(), null, 2)}\n`;
  const actual = fs.readFileSync(absolute(refs.aggregate), 'utf8');
  if (actual !== expected) {
    console.error(`${refs.aggregate} is out of sync with ${refs.source}.`);
    console.error('Run npm run authority-functions:write to regenerate the aggregate consumer surface.');
    process.exit(1);
  }
  console.log(`authority functions aggregate matches ${refs.source}`);
}

function writeAggregate(): void {
  writeJson(refs.aggregate, reconstructAggregate());
  writeJson(refs.bundleManifest, buildBundleManifest(readJson(refs.source), readJson(refs.leafIndex)));
  console.log(`wrote ${refs.aggregate} and ${refs.bundleManifest} from ${refs.source}`);
}

const command = process.argv[2] ?? '--check';

if (command === '--split') {
  splitFromAggregate();
} else if (command === '--check') {
  checkAggregate();
} else if (command === '--write') {
  writeAggregate();
} else {
  console.error('Usage: node scripts/sync-authority-functions.ts [--split|--check|--write]');
  process.exit(2);
}

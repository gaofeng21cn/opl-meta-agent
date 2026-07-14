import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { readJson, repoRoot } from './support/contracts.ts';

const ACTIVE_MATERIALIZER_REFS = [
  'scripts/build-agent-baseline.ts',
  'scripts/improve-from-agent-lab-suite.ts',
  'scripts/lib/agent-evidence-materializer.ts',
  'scripts/lib/external-suite-materializer.ts',
  'scripts/takeover-agent.ts',
];

const RETIRED_PRIVATE_MODULES = [
  'scripts/lib/foundry-lab-work-order.ts',
  'scripts/lib/meta-agent-loop-receipts.ts',
  'scripts/lib/work-order-builders.ts',
  'scripts/lib/work-order-validation.ts',
];

test('active OMA materializers emit only the canonical v2 semantic request', () => {
  for (const ref of ACTIVE_MATERIALIZER_REFS) {
    const source = fs.readFileSync(path.join(repoRoot, ref), 'utf8');
    assert.doesNotMatch(source, /\['agent-lab',\s*'run'/, `${ref} must not invoke Agent Lab`);
    assert.doesNotMatch(source, /agent-lab-run-result\.json/, `${ref} must not write Agent Lab results`);
    assert.doesNotMatch(source, /foundry-lab-work-order\.json/, `${ref} must not write work orders`);
    assert.doesNotMatch(source, /executor[_-]lease|worktree[_-]lifecycle/i, `${ref} must not own Framework mechanics`);
  }
  for (const ref of RETIRED_PRIVATE_MODULES) {
    assert.equal(fs.existsSync(path.join(repoRoot, ref)), false, `${ref} must stay retired`);
  }
});

test('OMA adoption schema pins the Framework-owned request ABI and authority boundary', () => {
  const schema = readJson('contracts/schemas/opl-work-order-materialization-request.v2.schema.json');
  assert.equal(
    schema.properties.canonical_schema_ref.const,
    'contracts/opl-framework/work-order-materialization-request.schema.json',
  );
  assert.deepEqual(schema.properties.request_kind.enum, ['developer_patch', 'foundry_evaluation']);
  assert.equal(schema.properties.request_owner.const, 'oma');
  assert.equal(schema.properties.producer_agent_id.const, 'oma');
  const boundary = schema.$defs.authorityBoundary.properties;
  assert.equal(boundary.work_order_materialization_owner.const, 'one-person-lab/OPL Foundry Lab');
  assert.equal(boundary.producer_writes_framework_request_bundle.const, false);
  assert.equal(boundary.producer_assigns_work_order_id.const, false);
  assert.equal(boundary.producer_manages_executor_lease.const, false);
  assert.equal(boundary.producer_manages_target_worktree.const, false);
  assert.equal(boundary.producer_executes_work_order.const, false);
  assert.equal(boundary.producer_writes_work_order_receipt.const, false);
  assert.equal(boundary.producer_writes_target_owner_closeout.const, false);
});

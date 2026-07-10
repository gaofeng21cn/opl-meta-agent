import assert from 'node:assert/strict';
import test from 'node:test';
import type { JsonObject } from './support/contracts.ts';
import { readJsonFile as readJson } from './support/contracts.ts';

test('workbench and scaleout contracts expose target patch-loop refs only', () => {
  const app = readJson('contracts/app_workbench_projection.json');
  const scaleout = readJson('contracts/real_target_agent_scaleout_evidence.json');
  const section = (app.workbench_sections as JsonObject[])
    .find((entry) => entry.section_id === 'developer_work_order');
  const evidenceClass = (scaleout.required_evidence_classes as JsonObject[])
    .find((entry) => entry.evidence_class === 'blocked_suite_to_developer_work_order');
  assert.ok(section);
  assert.ok(evidenceClass);

  const requiredRefs = evidenceClass.required_refs as string[];
  const projectionFields = section.projection_fields as string[];
  assert.deepEqual(app.drilldown_readiness_receipt.developer_work_order_machine_ref_fields, requiredRefs);
  assert.ok(requiredRefs.length > 0);
  for (const field of requiredRefs) {
    assert.ok(projectionFields.includes(field), `missing runtime-required projection field: ${field}`);
  }
  assert.doesNotMatch(JSON.stringify(projectionFields), /substantive_deliverable_delta_refs|platform_interface_repair_refs/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { JsonObject } from './support/contracts.ts';
import { readJsonFile as readJson } from './support/contracts.ts';
import { targetPatchLoopProjectionRequiredFields } from './support/external-suite-fixtures.ts';

test('workbench and scaleout contracts expose target patch-loop refs only', () => {
  const appProjection = readJson('contracts/app_workbench_projection.json');
  const scaleoutEvidence = readJson('contracts/real_target_agent_scaleout_evidence.json');
  const developerWorkOrderSection = (appProjection.workbench_sections as JsonObject[]).find((section) =>
    section.section_id === 'developer_work_order'
  );
  const blockedSuiteEvidenceClass = (scaleoutEvidence.required_evidence_classes as JsonObject[]).find((entry) =>
    entry.evidence_class === 'blocked_suite_to_developer_work_order'
  );

  assert.ok(developerWorkOrderSection);
  assert.ok(blockedSuiteEvidenceClass);
  assert.deepEqual(appProjection.drilldown_readiness_receipt.developer_work_order_machine_ref_fields, targetPatchLoopProjectionRequiredFields);
  assert.deepEqual(blockedSuiteEvidenceClass.required_refs, targetPatchLoopProjectionRequiredFields);
  targetPatchLoopProjectionRequiredFields.forEach((field) => {
    assert.ok((developerWorkOrderSection.projection_fields as string[]).includes(field));
  });
  assert.equal((developerWorkOrderSection.projection_fields as string[]).includes('substantive_deliverable_delta_refs'), false);
  assert.equal((developerWorkOrderSection.projection_fields as string[]).includes('platform_interface_repair_refs'), false);
});

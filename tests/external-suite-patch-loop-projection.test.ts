import test from 'node:test';
import {
  assert,
  path,
  repoRoot,
  targetPatchLoopMachineRefFields,
  readJson,
} from './support/external-suite-fixtures.ts';
import type { JsonObject } from './support/external-suite-fixtures.ts';

test('workbench and scaleout contracts expose target patch-loop machine refs only', () => {
  const appProjection = readJson(path.join(repoRoot, 'contracts/app_workbench_projection.json'));
  const scaleoutEvidence = readJson(path.join(repoRoot, 'contracts/real_target_agent_scaleout_evidence.json'));
  const developerWorkOrderSection = (appProjection.workbench_sections as JsonObject[]).find((section) =>
    section.section_id === 'developer_work_order'
  );
  const blockedSuiteEvidenceClass = (scaleoutEvidence.required_evidence_classes as JsonObject[]).find((entry) =>
    entry.evidence_class === 'blocked_suite_to_developer_work_order'
  );

  assert.ok(developerWorkOrderSection);
  assert.ok(blockedSuiteEvidenceClass);
  assert.deepEqual(
    appProjection.drilldown_readiness_receipt.developer_work_order_machine_ref_fields,
    targetPatchLoopMachineRefFields,
  );
  assert.deepEqual(blockedSuiteEvidenceClass.required_refs, targetPatchLoopMachineRefFields);
  targetPatchLoopMachineRefFields.forEach((field) => {
    assert.ok((developerWorkOrderSection.projection_fields as string[]).includes(field));
  });
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('substantive_deliverable_delta_refs'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('platform_interface_repair_refs'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('deliverable_progress_delta'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('platform_repair_delta'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('progress_delta_classification'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('target_progress_accounting_ref'));
  assert.deepEqual(appProjection.drilldown_readiness_receipt.target_progress_accounting_fields, [
    'deliverable_progress_delta',
    'platform_repair_delta',
    'progress_delta_classification',
    'substantive_deliverable_delta_refs',
    'platform_interface_repair_refs',
    'target_progress_accounting_ref',
  ]);
  assert.equal(appProjection.authority_boundary.refs_only, true);
  assert.equal(scaleoutEvidence.authority_boundary.can_write_target_domain_truth, false);
});

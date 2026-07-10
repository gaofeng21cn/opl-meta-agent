import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { readJsonFile as readJson, writeJsonFile as writeJson } from './support/contracts.ts';
import {
  buildExternalSuite,
  runImproveFromSuite,
  withOutputRoot,
  writeAiReviewerEvaluation,
  writeTargetDescriptor,
} from './support/external-suite-fixtures.ts';

const cases = [
  ['target-agent owner receipt suite becomes a no-patch coordination record', 'target-agent', 'owner_receipt_result_consumption'],
  ['owner-receipt wording in a standard suite stays target-agent generic', 'external-agent', 'owner_receipt_coordination'],
] as const;

for (const [name, domainId, taskFamily] of cases) {
  test(name, () => {
    withOutputRoot(`oma-${domainId}-owner-receipt-`, (outputRoot) => {
      const targetAgentDir = path.join(outputRoot, domainId);
      const suitePath = path.join(outputRoot, 'suite.json');
      const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
      const receiptRef = `owner-receipt:${domainId}/live-acceptance`;
      writeTargetDescriptor(targetAgentDir, domainId);
      writeJson(suitePath, buildExternalSuite({
        suiteId: `${domainId}-suite:owner-receipt-consumption`,
        domainId,
        taskFamily,
        passed: true,
        evidenceRefs: [receiptRef],
      }));
      writeAiReviewerEvaluation(reviewerEvaluationPath, {
        verdict: 'accepted_no_patch_required',
        source_refs: [receiptRef],
        direct_evidence_refs: [receiptRef],
      });

      const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
      const candidate = readJson(payload.artifacts.target_capability_improvement_candidate_path);
      assert.equal(payload.status, 'no_source_patch_required');
      assert.equal(payload.artifacts.developer_patch_work_order_path, undefined);
      assert.equal(candidate.status, 'evaluated_no_source_patch_required');
      if (domainId === 'target-agent') {
        assert.deepEqual(candidate.proposed_change_refs, []);
        assert.deepEqual(candidate.target_editable_surface_refs, []);
      } else {
        const serialized = JSON.stringify(candidate);
        assert.equal(candidate.target_agent.domain_id, 'external-agent');
        assert.match(serialized, /external-agent/);
        assert.doesNotMatch(serialized, /med-autogrant|:mag\//i);
      }
    });
  });
}

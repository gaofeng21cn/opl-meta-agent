import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('opl-meta-agent bootstraps a sample agent and validates it through OPL Agent Lab', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-loop-'));
  const oplBin = process.env.OPL_BIN
    ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/bootstrap-sample-agent.ts'),
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);

    assert.equal(payload.surface_kind, 'opl_meta_agent_self_learning_loop_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.product_id, 'opl-meta-agent');
    assert.equal(payload.meta_agent_kind, 'opl_compatible_meta_agent');
    assert.equal(payload.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(payload.target_agent.generated_interface_status, 'ready');
    assert.equal(payload.opl_generated_interfaces.surface_kind, 'opl_generated_agent_interface_bundle');
    assert.equal(payload.opl_generated_interfaces.owner, 'one-person-lab');
    assert.equal(payload.opl_generated_interfaces.domain_repo_can_own_generated_surface, false);
    assert.equal(payload.opl_generated_interfaces.cli.descriptors[0].action_id, 'draft-brief');
    assert.equal(payload.opl_generated_interfaces.mcp.descriptors[0].descriptor_only, true);
    assert.equal(payload.opl_generated_interfaces.skill.descriptors[0].command_contract_id, 'sample-brief-agent.draft-brief');
    assert.equal(payload.opl_generated_interfaces.product_entry.descriptors[0].action_key, 'draft-brief');
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');
    assert.equal(payload.opl_agent_lab.suite_result.suite_kind, 'agent_lab_external_suite');
    assert.equal(payload.learning_loop.online_learning_policy.can_promote_without_gate, false);
    assert.equal(payload.learning_loop.online_learning_policy.can_train_or_deploy_model_weights, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.status, 'proposal_recorded_requires_explicit_gate');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.observe.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.diagnose.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline');
    assert.equal(payload.learning_loop.mechanism_patch_proposal.edit.next_mechanism_candidate_ref, payload.learning_loop.online_learning_candidate.candidate_id);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(payload.learning_loop.mechanism_patch_proposal.authority_boundary.can_promote_default_agent_without_gate, false);

    const targetDir = path.join(outputRoot, 'sample-brief-agent');
    const suitePath = path.join(outputRoot, 'agent-lab-suite.json');
    const receiptPath = path.join(outputRoot, 'baseline-delivery-receipt.json');
    const learningPath = path.join(outputRoot, 'online-learning-candidate.json');
    const mechanismPath = path.join(outputRoot, 'mechanism-patch-proposal.json');
    const fixturePath = path.join(
      targetDir,
      'contracts',
      'production_acceptance',
      'morphology_conformance_fixture.json',
    );
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/domain_descriptor.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/action_catalog.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'contracts/stage_control_plane.json')), true);
    assert.equal(fs.existsSync(fixturePath), true);
    assert.equal(fs.existsSync(suitePath), true);
    assert.equal(fs.existsSync(receiptPath), true);
    assert.equal(fs.existsSync(learningPath), true);
    assert.equal(fs.existsSync(mechanismPath), true);

    const fixture = readJson(fixturePath);
    assert.equal(fixture.surface_kind, 'generated_agent_morphology_conformance_fixture');
    assert.equal(fixture.domain_id, 'sample-brief-agent');
    assert.equal(fixture.fixture_status, 'required_by_default_generated_agent');
    assert.equal(fixture.canonical_semantic_pack_root, 'agent/');
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/domain-pack-files-present'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/stage-action-contracts-present'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/OPL-generated-interface-owner'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/no-target-domain-truth-write'));
    assert.ok(fixture.required_check_refs.includes('check-ref:generated-agent/no-default-promotion-without-gate'));
    assert.equal(fixture.authority_boundary.refs_only, true);
    assert.equal(fixture.authority_boundary.generated_interface_owner, 'one-person-lab');
    assert.equal(fixture.authority_boundary.domain_repo_can_own_generated_surface, false);
    assert.equal(fixture.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(fixture.authority_boundary.can_write_target_domain_memory_body, false);
    assert.equal(fixture.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.equal(fixture.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(fixture.authority_boundary.can_promote_default_agent_without_gate, false);

    const suite = readJson(suitePath);
    assert.equal(suite.suite_id, 'opl-meta-agent-self-bootstrap-suite');
    assert.equal(suite.tasks[0].domain_id, 'opl-meta-agent');
    assert.equal(suite.tasks[0].trajectory.memory_body, undefined);

    const receipt = readJson(receiptPath);
    assert.equal(receipt.receipt_class, 'baseline_delivery_receipt');
    assert.equal(receipt.target_agent.domain_id, 'sample-brief-agent');
    assert.equal(receipt.agent_lab_result_ref, payload.opl_agent_lab.suite_result.result_id);

    const learning = readJson(learningPath);
    assert.equal(learning.candidate_kind, 'rubric_gap');
    assert.deepEqual(learning.source_refs, [
      payload.opl_agent_lab.suite_result.result_id,
      receipt.receipt_id,
    ]);

    const mechanism = readJson(mechanismPath);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.mechanism_ref, 'mechanism:opl-meta-agent/sample-brief-agent/self-learning-loop');
    assert.equal(mechanism.version, 'opl-meta-agent.mechanism-patch-proposal.v1');
    assert.ok(mechanism.editable_surfaces.includes('prompt_policy_ref'));
    assert.ok(mechanism.editable_surfaces.includes('quality_gate_policy_ref'));
    assert.equal(mechanism.segment_run_ref, payload.opl_agent_lab.suite_result.result_id);
    assert.equal(mechanism.evidence_delta_ref, 'evidence-delta:opl-meta-agent/sample-brief-agent/baseline');
    assert.equal(mechanism.next_mechanism_candidate_ref, learning.candidate_id);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

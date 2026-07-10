import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertTargetProfileConformance,
} from '../scripts/lib/stage-decomposition-pack-draft/materializer.ts';
import {
  buildProfileSelectionReceipt,
  type JsonObject,
} from '../scripts/lib/domain-pack.ts';
import {
  oplOwnerRepoRoot,
  readJsonFile as readJson,
  withTempDir,
  writeJsonFile as writeJson,
} from './support/contracts.ts';

const canonicalOplBin = path.join(oplOwnerRepoRoot, 'bin', 'opl');
const profileRef = 'opl-profile:evidence_grounded_decision_agent_profile.v1';
const targetAgent = {
  domain_id: 'reference-build-conformance-agent',
  target_brief: 'Create colorectal evidence-grounded decision support with an owner gate.',
  selected_opl_profile_refs: [profileRef],
  profile_selection_rationale: 'The target requires the evidence-grounded decision profile.',
};

function writeConformantProfileFixture(targetDir: string): void {
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const profileRequirements = profileSelectionReceipt.profile_requirements;
  writeJson(path.join(targetDir, 'contracts', 'capability_map.json'), {
    selected_profile_refs: [profileRef],
    profile_requirements: profileRequirements,
    profile_selection_receipt: profileSelectionReceipt,
    capabilities: [
      { capability_kind: 'stage_prompt', surface_role: 'stage_prompt' },
      { capability_kind: 'tool_connector', surface_role: 'tool_connector' },
      { capability_kind: 'reference_pack', surface_role: 'knowledge_pack' },
      { capability_kind: 'contract_module', surface_role: 'quality_gate' },
      { capability_kind: 'contract_module', surface_role: 'eval_suite' },
    ],
  });
  writeJson(path.join(targetDir, 'contracts', 'stage_control_plane.json'), {
    selected_profile_refs: [profileRef],
    profile_requirements: profileRequirements,
    stages: [{
      knowledge_refs: ['agent/knowledge/evidence.md'],
      tool_refs: ['agent/tools/evidence.md'],
      evaluation: ['agent/quality_gates/evidence.md'],
    }],
  });
}

test('post-write profile conformance uses the canonical OPL CLI and fails closed after file drift', () => {
  assert.equal(fs.existsSync(canonicalOplBin), true, canonicalOplBin);
  withTempDir('oma-reference-build-conformance-', (targetDir) => {
    writeConformantProfileFixture(targetDir);
    const passed = assertTargetProfileConformance(canonicalOplBin, targetDir, targetAgent);
    assert.equal(passed.status, 'passed');

    const capabilityMapPath = path.join(targetDir, 'contracts', 'capability_map.json');
    const capabilityMap = readJson(capabilityMapPath) as JsonObject;
    capabilityMap.selected_profile_refs = [];
    delete capabilityMap.profile_selection_receipt;
    writeJson(capabilityMapPath, capabilityMap);

    assert.throws(
      () => assertTargetProfileConformance(canonicalOplBin, targetDir, targetAgent),
      /profile conformance.*blocked.*capability_map_missing_selected_profile_ref/is,
    );
  });
});

test('research-driven design stays not applicable when OPL exposes no matching conformance route', () => {
  const result = assertTargetProfileConformance(canonicalOplBin, '/tmp/not-materialized', {
    domain_id: 'research-driven-agent',
    research_source_refs: ['research-source-ref:public/expert-workflow-review'],
    research_synthesis_refs: ['research-synthesis-ref:oma/research-driven-agent'],
  });
  assert.equal(result.status, 'not_applicable');
  assert.equal(result.reason, 'research_driven_design_route_not_exposed_by_opl_profiles_conformance');
  assert.equal(result.authority_boundary.conformance_skipped_as_success, false);
});

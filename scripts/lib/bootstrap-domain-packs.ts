import type { TargetAgent } from './meta-agent-loop.ts';
import {
  buildFixtureStageDecompositionCloseout,
  materializeStageDecompositionPackDraft,
  validateStageDecompositionCloseoutPacket,
} from './stage-decomposition-pack-draft.ts';

function materializeCompatibilityFixture(targetAgentDir: string, targetAgent: TargetAgent): void {
  const closeoutPacket = buildFixtureStageDecompositionCloseout({ targetAgent });
  const packDraft = validateStageDecompositionCloseoutPacket(closeoutPacket, { targetAgent });
  materializeStageDecompositionPackDraft(targetAgentDir, packDraft);
}

export function writeSampleAgentDomainPack(targetAgentDir: string): void {
  materializeCompatibilityFixture(targetAgentDir, {
    domain_id: 'sample-brief-agent',
    domain_label: 'Sample Brief Agent',
    delivery_domain: 'knowledge_briefing',
    target_brief: 'Create a source-grounded knowledge brief from workspace refs.',
  });
}

export function writeRealTargetAgentDomainPack(
  targetAgentDir: string,
  targetAgent: TargetAgent,
): void {
  materializeCompatibilityFixture(targetAgentDir, targetAgent);
}

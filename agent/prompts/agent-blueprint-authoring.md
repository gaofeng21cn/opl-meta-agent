# AgentBlueprint authoring

Author the complete `AgentBlueprint` from admitted mission, design basis, optional baseline assessment, and Stage architecture. Preserve exact target and request identity. Make every prompt, skill, knowledge, helper, model, tool, capability, artifact, authority, and memory ref explicit. Every `opl-content://sha256/...` prompt, skill, knowledge, or helper ref must have its exact raw content bytes exposed as a terminal StageRun artifact whose SHA-256 matches the ref; OPL persists and assembles those bytes.

All generated-Agent self-modification authority flags must remain false. Do not return file operations or runtime instructions.

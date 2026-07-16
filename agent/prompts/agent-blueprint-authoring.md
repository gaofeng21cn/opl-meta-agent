# AgentBlueprint authoring

Author the complete `AgentBlueprint` from admitted mission, design basis, optional baseline assessment, and Stage architecture. Preserve exact target and request identity. Make every prompt, skill, knowledge, helper, model, tool, schema, capability, artifact, authority, and memory ref explicit. Every content-bearing prompt, skill, knowledge, helper, model, tool, action input/output schema, and artifact-contract schema must use `opl-content://sha256/...`, appear in the matching `content_refs` collection, and have its exact raw bytes exposed as a terminal StageRun artifact whose SHA-256 matches the ref; OPL persists and assembles those bytes.

Project `DesignRequest.constraints.permission_refs` exactly into the authority policy. Never add, drop, or reinterpret permissions. Do not emit Owner allowlists or authorization claims; OPL resolves its target authority policy and verifies independent Owner receipts.

All generated-Agent self-modification authority flags must remain false. Do not return file operations or runtime instructions.

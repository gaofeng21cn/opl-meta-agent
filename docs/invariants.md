# opl-meta-agent 硬约束

- Do not store runtime artifacts in repo source.
- Do not implement generic OPL runtime primitives in this domain repo.
- Do not implement repo-owned generic CLI, MCP, Skill, product-entry, sidecar, status, or workbench wrappers; OPL Framework generates or hosts those surfaces from contracts.
- Do not let OPL write domain truth, memory body, or quality/export verdicts.
- Keep `agent/` as a real domain pack: required pack files and `stage_control_plane` stage prompt, skill, knowledge, and evaluation refs must resolve to repo files that are non-empty and free of placeholder markers.
- Generated interfaces may invoke declared actions and minimal authority functions, but they must remain projection/invocation surfaces owned by OPL Framework and must not escalate into domain truth, memory body, artifact body, quality/export verdict, or default-promotion authority.
- Do not train or deploy model weights from this repo.
- Do not promote a generated target agent as default without an explicit OPL gate.
- Do not write target-domain truth, memory body, artifact body, quality verdict, or export verdict.
- Mechanism patch proposals are proposal-only surfaces: they may reference editable mechanism surfaces, observed segment runs, evidence deltas, and next candidate refs, but they must not apply edits or promote defaults without an explicit gate.

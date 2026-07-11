# OMA Domain Tool Affordances

Owner: `opl-meta-agent`
Purpose: `domain_tool_affordance_catalog`
State: `advisory_current_contract`
Machine boundary: This file declares available domain tool affordances for OPL Meta Agent stage attempts. It is not a workflow script, executor sequence, target-domain truth source, promotion gate, owner receipt, or quality verdict.

## Boundary

OMA stage attempts may use tools to read target-agent context, research external experience, materialize agent pack refs, run baseline or external-suite checks, and collect refs-only takeover evidence. Tool use stays inside the permission, credential, write-scope, side-effect, and forbidden-authority boundaries declared by `contracts/pack_compiler_input.json`, `agent/stages/manifest.json`, and `contracts/cognitive_kernel_adoption.json`.

## Affordances

- `target_agent_intent_and_repo_context_reading`: Read target goals, repo contracts, existing pack files, and owner constraints before proposing a new agent.
- `external_experience_research_and_synthesis`: Gather and summarize public experience refs without importing another runtime as authority.
- `stage_decomposition_and_pack_materialization`: Materialize stage, prompt, skill, knowledge, quality-gate, and contract refs for a target agent.
- `baseline_eval_suite_and_takeover_evidence_runner`: Run or inspect baseline, external-suite, and takeover evidence under declared write scopes.
- `optimizer_iteration_and_trajectory_learning_review`: Propose optimizer and trajectory-learning updates as owner-reviewable refs, not silent policy changes.

## Forbidden Authority

- Tools do not write target domain truth, promote a default agent, train or deploy model weights, or declare target-agent ready by generated-surface existence.
- Tools do not close an independent quality gate from the same execution attempt.
- Tools do not prescribe executor order, candidate strategy, stage goal, or required parallelism.

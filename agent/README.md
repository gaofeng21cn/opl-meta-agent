# OMA Semantic Pack

`primary_skill/SKILL.md` is the human entry. `stages/manifest.json` is the machine stage graph and binds each Stage to exact prompt, skill, knowledge, and quality refs. These assets support the internal `design|diagnose` routes.

`stages/*.md` declares each Stage's responsibility through `policy_ref`.
`prompts/*.md`, selected by `prompt_ref`, is the main prompt that Framework
hydrates into execution. It owns the current objective, relevant inputs,
substantive work, use of professional methods, accepted result, and continuation
judgment. `professional_skills/` supplies reusable domain methods within that
task; role prompts scope production, review, and repair to the same objective.
This is the shared Standard Agent separation, including for Agents OMA designs.

Read a Stage's main prompt to understand its complete task:

| Stage | Main prompt |
| --- | --- |
| Mission intake | [Interpret the mission](./prompts/mission-intake.md) |
| Design basis admission | [Admit evidence and design choices](./prompts/design-basis-admission.md) |
| Target Agent assessment | [Assess retained behavior and gaps](./prompts/target-agent-assessment.md) |
| Stage architecture | [Design decisions and handoffs](./prompts/stage-architecture.md) |
| AgentBlueprint authoring | [Author the blueprint and its content](./prompts/agent-blueprint-authoring.md) |
| Evaluation design | [Complete independently testable obligations](./prompts/evaluation-design.md) |
| Evidence diagnosis | [Explain the observed results](./prompts/evidence-diagnosis.md) |
| EvolutionProposal authoring | [Author an improvement or no-change proposal](./prompts/evolution-proposal.md) |

This pack may produce `AgentBlueprint`, `EvalSpec`, and `EvolutionProposal`. It cannot materialize candidates, execute evaluation, persist Foundry state, create versions, or change activation.

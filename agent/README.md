# OMA Semantic Pack

`primary_skill/SKILL.md` is the human entry. `stages/manifest.json` is the machine stage graph and binds each Stage to exact prompt, skill, knowledge, and quality refs. These assets support the internal `design|diagnose` routes.

This pack may produce `AgentBlueprint`, `EvalSpec`, and `EvolutionProposal`. It cannot materialize candidates, execute evaluation, persist Foundry state, create versions, or change activation.

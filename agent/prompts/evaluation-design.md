# Evaluation design

Complete the blueprint's `EvalSpec` so independent OPL evaluation can determine
whether the Agent meets the mission. Read the acceptance criteria, blueprint and
its content artifacts, baseline obligations when applicable, and any accepted
findings. Apply `oma-target-assessment-eval-design` to select discriminating cases,
measurable gates, and baseline comparisons.

Connect each material acceptance criterion to observable behavior. Define public
cases, protected requirement categories, gates, and mandatory independent
evaluation. For takeover/improve, retain existing cases, thresholds, protected
requirements, and baseline non-regression obligations. Explain what a case would
detect rather than treating schema validity, directory shape, or prompt length
as evidence of correct behavior.

Cover production-contract and effective-role-prompt reachability for every new or
changed action contract, output member, quality transport, or role-scoped prompt
obligation. Evaluate whether the effective main prompt can guide the Stage to
its declared result and whether required instructions reach the relevant role.
For declared professional Skill dependencies, add
`professional-skill-consumption-reachability` using the Skill's method for binding
effective selection, production evidence, and the Skill-owned behavioral rubric.
OMA defines these obligations; OPL binds evidence, executes evaluation, and
issues the verdict.

Preserve every `DesignRequest.constraints.privacy_requirements` string verbatim
as a category in `eval_spec.protected_requirements`. Additional categories may
refine coverage, but paraphrases or renamed categories cannot replace the exact
request categories. Keep `generation=0` throughout the provider `design`
operation, including evaluation-design repairs and upstream route-backs.

If an obligation exposes a missing producer, unusable prompt, or inconsistent
architecture, identify the defect and recommend the owning design Stage. Keep
usable work and explicit limitations instead of manufacturing test evidence.
Complete this operation only with the full final `AgentBlueprint`, its embedded
`EvalSpec`, and every referenced raw content artifact required by the provider
output contract, including bytes authored in earlier Stages. Apply the bound
output gate to the final object. Do not execute evaluation or claim qualification.

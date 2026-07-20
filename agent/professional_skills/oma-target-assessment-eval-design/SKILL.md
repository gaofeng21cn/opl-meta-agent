---
name: oma-target-assessment-eval-design
description: Assess an existing Agent version and design a frozen, independent evaluation specification.
---

# OMA Target Assessment And Eval Design

For takeover or improve mode, bind findings to the exact baseline version and identify behavior that must be retained. Translate acceptance criteria into public cases, protected requirement categories, measurable gates, and baseline non-regression rules.

For every new or changed action contract, output member, quality transport, or
role-scoped prompt obligation, add evaluation coverage for semantic reachability:

- `production-contract-reachability`: a public action reaches the declared
  production producer/consumer and terminal output or artifact; helper existence,
  unit tests, and test-only call sites do not satisfy this requirement.
- `effective-role-prompt-reachability`: each required instruction is present in
  the exact role fragment assembled into the effective prompt; presence only in
  an unselected preface, sibling role, source file, or keyword test does not
  satisfy this requirement.

When a stage or action declares one or more professional Skill dependencies,
also require `professional-skill-consumption-reachability`. Passing evidence
must jointly prove that the exact effective-role prompt selects the Skill, the
production invocation evidence binds that same Skill identity, version, and
content ref to the stage or action execution, and the materialized output passes
the Skill-owned behavioral rubric. A declared `skill_ref`, a non-empty
invocation ledger, a metadata-only receipt, or output that merely appears
compliant without the same Skill binding does not pass independently.

Use public cases where the behavior is safe to expose and protected requirement
categories where implementation details or adversarial cases must stay hidden.
Require end-to-end materialized evidence from OPL evaluation, not OMA inspection
of repository call graphs or protected test bodies.

OMA defines this conditional EvalSpec obligation only. OPL owns production
invocation capture, evidence binding, independent evaluation, and the verdict.

OMA may propose new tests but cannot inspect protected test bodies, modify protected tests, delete existing cases, lower thresholds, execute evaluation, select the evaluator, or issue a verdict. Set `independent_evaluator_required=true`; OPL binds an independent evaluator identity and execution.

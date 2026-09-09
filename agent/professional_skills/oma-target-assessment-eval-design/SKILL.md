---
name: oma-target-assessment-eval-design
description: Assess an existing Agent version and design a frozen, independent evaluation specification.
---

# OMA Target Assessment And Eval Design

Use the assessment or evaluation method needed by the current Stage; its main
prompt determines the task and required result.

## Baseline Assessment

Bind findings to the exact supplied baseline. Compare declared behavior with
available public results and protected aggregates. Distinguish an observed
failure, an untested requirement, and an intentional owner constraint. Identify
what must be retained before proposing a repair, and connect each gap to its
affected action, Stage, artifact, or authority boundary. Schema validity and
file layout alone establish neither competence nor a defect.

## Evaluation Design

Translate acceptance criteria into observable outcomes and select cases that
distinguish a working design from a plausible failure. Use a normal case, a
boundary case, or a known regression where it tests a real obligation; do not
multiply cases solely for coverage counts. Choose measurable gates from the
mission and evidence, retaining existing thresholds and non-regression rules.

Include every `DesignRequest.constraints.privacy_requirements` string verbatim
as a category in `eval_spec.protected_requirements`. Treat these strings as exact
request-bound identifiers, not text to summarize. Add narrower categories when
useful, but retain every original category alongside them. This specifies
protected requirements without exposing or inspecting protected test bodies.

For every new or changed action contract, output member, quality transport, or
role-scoped prompt obligation, add evaluation coverage for semantic reachability:

- `production-contract-reachability`: a public action reaches the declared
  production producer/consumer and terminal output or artifact.
- `effective-role-prompt-reachability`: each required instruction is present in
  the exact role fragment assembled into the effective prompt.

When a stage or action declares one or more professional Skill dependencies,
add `professional-skill-consumption-reachability`: the exact effective-role
prompt selects the Skill, OPL production evidence binds the same identity,
version, and content ref to the execution, and the materialized output passes
the Skill-owned behavioral rubric.

Use public cases where the behavior is safe to expose and protected requirement
categories where implementation details or adversarial cases must stay hidden.
Require end-to-end materialized evidence from OPL evaluation, not OMA inspection
of repository call graphs or protected test bodies.

For a Stage-main-prompt change, assess whether the effective prompt and its bound
Skills can produce the declared artifact from the supplied context, including a
relevant uncertainty or return-route situation. Judge the work and output, not
the presence of particular headings, words, or a minimum prompt length.

OMA defines this conditional EvalSpec obligation only. OPL owns production
invocation capture, evidence binding, independent evaluation, and the verdict.

OMA may propose new tests and protected requirement categories. OPL owns the
protected test bodies, existing cases and thresholds, evaluator, execution, and
verdict; set `independent_evaluator_required=true`.

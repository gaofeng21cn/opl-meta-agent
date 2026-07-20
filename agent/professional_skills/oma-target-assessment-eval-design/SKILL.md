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

Use public cases where the behavior is safe to expose and protected requirement
categories where implementation details or adversarial cases must stay hidden.
Require end-to-end materialized evidence from OPL evaluation, not OMA inspection
of repository call graphs or protected test bodies.

OMA may propose new tests but cannot inspect protected test bodies, modify protected tests, delete existing cases, lower thresholds, execute evaluation, select the evaluator, or issue a verdict. Set `independent_evaluator_required=true`; OPL binds an independent evaluator identity and execution.

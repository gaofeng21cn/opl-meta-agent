---
name: oma-agent-lab-suite-designer
description: Use when OMA must design Agent Lab baseline, takeover, or external suites that test target-agent behavior, recovery, morphology, and authority boundaries without becoming a target quality verdict.
---

# OMA Agent Lab Suite Designer

## Purpose

Design Agent Lab suite specs for new or existing target agents. This skill defines test and scorecard method only; Agent Lab execution, receipts, promotion gates, and runtime remain OPL-owned.

## Inputs

- Candidate package refs or target external agent descriptor/contracts.
- Acceptance criteria, stage/action refs, quality gate refs, and owner boundary refs.
- Artifact morphology brief and realistic target task refs.
- Required normal, failure, recovery, and no-forbidden-write evidence.

## Execution Rules

- Map each task to a concrete acceptance criterion, stage contract, artifact morphology risk, or authority boundary.
- Use refs and locators as inputs; never copy target memory body, artifact body, or truth body into the suite.
- Include probes for silent scope downgrade, missing native source, missing shards, code-string artifact bodies, missing asset custody, and thin assembler violations.
- Treat suite pass/fail as evidence input, not target quality verdict, owner receipt, default promotion, or App-live readiness.
- Return blocked suites with repair targets rather than thin happy-path tests.

## Stage Prompt Boundary

Use with `agent/prompts/eval-suite-build.md`, and for takeover evidence with `agent/prompts/target-agent-takeover.md`. The stage prompts own output refs and blocker shape; this skill supplies suite design judgment only.

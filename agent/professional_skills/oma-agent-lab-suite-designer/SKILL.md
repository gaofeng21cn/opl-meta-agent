---
name: oma-agent-lab-suite-designer
description: Use when OMA must design Agent Lab baseline, takeover, or external suites that test target-agent behavior, recovery, morphology, and authority boundaries without becoming a target quality verdict.
---

# OMA Agent Lab Suite Designer

## Purpose

Design Agent Lab suite specs for new or existing target agents. This skill defines professional test and scorecard method only; Agent Lab execution, receipts, promotion gates, and runtime remain OPL-owned.

## Inputs

- Candidate package refs or target external agent descriptor/contracts.
- Acceptance criteria, stage/action refs, quality gate refs, and owner boundary refs.
- Artifact morphology brief and realistic target task refs.
- Required normal, failure, recovery, and no-forbidden-write evidence.

## Outputs

- `agent_lab_task_manifest_refs`
- `scorecard_refs`
- `promotion_gate_refs`
- `artifact_morphology_probe_refs`
- `agent_lab_external_suite_ref` when testing an external target.
- `suite_blocker_refs` with actionable failure taxonomy when the suite cannot run.

## Execution Rules

- Map each task to a concrete acceptance criterion, stage contract, artifact morphology risk, or authority boundary.
- Use refs and locators as inputs; never copy target memory body, artifact body, or truth body into the suite.
- Include probes for silent scope downgrade, missing native source, missing shards, code-string artifact bodies, missing asset custody, and thin assembler violations.
- Treat suite pass/fail as evidence input, not target quality verdict, owner receipt, default promotion, or App-live readiness.
- Return blocked suites with repair targets rather than thin happy-path tests.

## Stage Prompt Boundary

Use with `agent/prompts/eval-suite-build.md`, and for takeover evidence with `agent/prompts/target-agent-takeover.md`. The stage prompts own output shape; this skill supplies suite design judgment.

## Blockers And Repair Targets

- `blocker:missing_target_contract_refs` when stage/action/memory/artifact contracts are unavailable.
- `blocker:missing_morphology_refs` when artifact-shape probes cannot be grounded.
- `repair:suite_only_tests_scaffold` when coverage proves only runner, scaffold, or interface shape.
- `repair:promotion_gate_missing` when suite outputs could be misread as default adoption.

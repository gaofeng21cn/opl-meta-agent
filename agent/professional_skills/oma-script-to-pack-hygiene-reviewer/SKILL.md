---
name: oma-script-to-pack-hygiene-reviewer
description: Use when OMA must review script-to-pack readback, source-purity evidence, retained script callers, and private migration inventory before recommending retain, absorb, delete, tombstone, route-back, or work-order action.
---

# OMA Script-to-Pack Hygiene Reviewer

## Purpose

Review OMA script-to-pack and source-purity evidence as an AI-first professional method. This skill recommends script retention, OPL absorption, deletion readiness, tombstone/provenance, owner route-back, or developer work-order action; it does not authorize the action.

## Inputs

- `npm run script-to-pack:readback` / `npm run script-to-pack:readback:full` output.
- Source-purity tests, script morphology policy, and script-to-pack gate receipt refs.
- `docs/active/opl-private-implementation-migration-inventory.md`.
- Active caller evidence from package scripts, imports, shell invocations, and non-self-guard tests.

## Execution Rules

- Classify each script or helper as `retain`, `absorb`, `delete`, `tombstone`, `route-back`, or `work-order`.
- Require real non-self active callers, repo-local source refs, no-forbidden-write evidence, OPL primitive parity or explicit fixture/proof refs, no-active-caller evidence, and tombstone/provenance refs before recommending deletion readiness.
- Treat cleanup readback as an owner-route signal, not execution authority.
- Prefer the smallest outcome that preserves owner boundaries: keep, route, or write a bounded work order before adding new wrappers.
- Do not claim physical delete authority, script retirement, owner receipt, typed blocker instance, OPL primitive parity, App/generated readiness, default promotion, target/domain readiness, or production readiness.

## Stage Prompt Boundary

Use with script-to-pack hygiene, source-purity, and private migration review tasks. Machine gates own hard pass/fail fields; this skill supplies reviewer judgment and recommendation taxonomy only.

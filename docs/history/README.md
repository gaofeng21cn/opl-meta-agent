# OMA Historical Archive

This directory contains migration tombstones and provenance only. It is not a source of current contracts, runtime status, readiness, qualification, activation, or Owner acceptance.

Current OMA truth lives in:

- `contracts/action_catalog.json` for the single public action;
- `contracts/foundry_provider.json` for the two internal provider operations;
- `contracts/foundry_protocol_fixture_manifest.json` for the OPL-owned protocol fixture boundary;
- `agent/stages/manifest.json` for the eight semantic Stages;
- `agent/primary_skill/SKILL.md` for the human entry and authority boundary.

The destructive cutover provenance is recorded in [`process/retired-surface-provenance.md`](./process/retired-surface-provenance.md). Exact pre-cutover details remain available from Git history and must not be restored as compatibility behavior.

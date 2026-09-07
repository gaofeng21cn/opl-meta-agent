# Architectural Decisions

This page explains why the current boundaries exist. [Architecture](./architecture.md)
owns their implementation map; contracts and source establish current behavior.

## Separate Semantics From Execution

OMA is a pure Foundry semantic provider. A single `engineer-agent` public action
keeps create, takeover, and improve in one lineage, while internal `design` and
`diagnose` operations produce the OPL-owned protocol objects. This prevents the
designer from becoming its own evaluator, version store, or activation owner.
Platform failures stay with OPL; evidence with no admissible semantic change
produces an exact unchanged blueprint and empty diff.

The 2026-07-16 cutover intentionally retired the former repository-local
execution facade without an adapter. The [retirement record](./history/process/retired-surface-provenance.md)
preserves the identifiers needed to recognize obsolete integrations. New work
uses the current action and protocol, with no aliases or resumable legacy path.

## Compose By Identity And Callability

OMA's stable Package identity is independent of its publication, carrier, and
executor. Ordinary dependencies declare presence and callable capabilities;
exact refs bind frozen build evidence, release integrity, and Foundry inputs,
not a parallel Package lock or readiness engine.

The [Package manifest](../contracts/opl_agent_package_manifest.json) declares the
current carrier and publication locator. A locator is configuration, not evidence
that a publication or installation occurred. The former migration narrative and
compatibility-read instruction no longer define an OMA interface.

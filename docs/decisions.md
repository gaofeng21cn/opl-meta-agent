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
execution facade without an adapter or compatibility alias. New work uses only
the current `engineer-agent` action and Foundry protocol; pre-cutover
provenance remains auditable in Git history.

## Compose By Identity And Callability

OMA's stable Package identity is independent of its publication, carrier, and
executor. Ordinary dependencies declare presence and callable capabilities;
exact refs bind frozen build evidence, release integrity, and Foundry inputs,
not a parallel Package lock or readiness engine.

Root [opl-package.json](../opl-package.json) declares the `opl.package.v2`
`host_hints.codex` carrier hint and `distribution` locator. A locator is
configuration, not evidence that a publication or installation occurred.

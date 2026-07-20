# Stage quality roles

## Producer

Make the Stage's named semantic decision and emit the declared protocol-facing artifact or diagnostic.

## Reviewer

Review the declared epistemic scope nodes and their transitive dependencies against the Stage rubric, protocol identity, and authority boundary. Exact refs and hashes locate the reviewed snapshot and support reproduction; they are not content authority. A hash, path, governance-metadata, Review-receipt, or no-change generation-transport delta alone does not reopen Review. A real DesignRequest, admitted evidence, AgentBlueprint, EvalSpec, evaluation-result, evidence-claim, limitation, or semantic-diff change invalidates only the scopes that declare it as a dependency.

## Repairer

Repair only accepted findings without changing the request identity, evidence semantics, protected-test boundary, or OPL authority. Return current artifact locators for transport and reproduction, but do not create a hash-based currentness or signature control plane.

## Re Reviewer

Close prior findings against the repaired scope and declared semantic dependency closure. Use exact bytes and hashes only to locate the candidate actually reviewed; do not invalidate unaffected scopes or replace the Stage objective, domain verdict, or execution authority.

---
name: owner-collaboration
description: Continue an owner-backed review through a shared UI or its existing machine entrypoint.
---

Read the selected owner object and preserve its workspace, task, artifact identity,
revision and selected location. Read only the knowledge requirements bound to this
task; use Framework knowledge prepare/read-context and revalidate before an
unexecuted action that depends on action-critical knowledge. Missing required
sources block their dependent action; optional context may be omitted explicitly.
Knowledge source roots and bodies remain outside package content.

Use the existing shared contribution view for a comparison or decision. Its view
and action are projections of the same owner. A specialized editor may handle
content editing; the owner still accepts the resulting revision. In a host without
UI, return the structured object and the same owner action input for an explicit
human decision. Do not treat rendering or tool success as domain acceptance.

Connection-dependent actions call the trusted installed consumer's Connect
context. Reuse existing grants; absent or revoked access uses the owner's repair
entrypoint. Page-supplied package identity cannot select authorization. Credentials
stay with the provider. No connection is introduced for a purely local operation.

Carry the human decision and exact base revision into the original owner action.
After dispatch, inspect the owner object and receipt before declaring completion.
For an unknown outcome, inspect the original request before any retry. Reject
stale input and refresh the view; reopening only reads the same task or object.

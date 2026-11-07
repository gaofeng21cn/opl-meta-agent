# Transferable Agent Practices

Transfer source practices by semantic purpose, evidence, constraints, and failure
route. Source step counts are not target Stage counts. A distinct open judgment
or an independently accepted handoff can justify a Stage; different tools or
methods within the same decision do not by themselves justify a split. Preserve
the shared OPL Standard Agent structure when adapting a source design.

## Human-Agent Collaboration Surfaces

For work involving human review, comparison, selection, or approval, consider a
standard MCP App early. The Agent invokes tools and receives structured state;
the person inspects the same state and confirms an exact target when needed.
Choose a surface from the actual interaction and explain the choice:

| Need | Preferred surface |
| --- | --- |
| Conversational inputs and a short textual result | Tool or Skill without UI |
| Status, stage artifacts, proposal differences, approvals, or execution receipts | Existing shared OPL MCP App contribution |
| A visual interaction the shared view types cannot express | Dedicated standards-compliant MCP App, after documenting the concrete gap |
| Frequent manual authoring, spatial exploration, device control, or live telemetry | Standalone application with optional MCP review views |

Reuse the Framework's installed-descriptor discovery, `app_contributions`,
structured view types, contribution adapter, and confirmation flow. Inspect the
current owner contracts and suitable existing contributions before proposing a
new server, renderer, registry, polling loop, approval system, or state store.
A dedicated UI needs a mission-specific reason that the shared surface cannot
satisfy. MCP Apps do not require a particular web framework or cloud service.

The Package owner supplies data, actions, authorization, and execution receipts.
Framework projects and renders those declarations. Reusing the host must not
move domain truth or quality decisions into the UI. UI presence, tool visibility,
and a confirmation flag do not grant authority for an owner action. Bind review
and execution to the same workspace, item, proposal revision, and input; require
owner readback after execution and reconcile unknown results before retrying.

Carry the selected surface, user intent, owner boundary, reusable capabilities,
read/action contracts, confirmation needs, and acceptance obligations through
the existing design basis and architecture artifacts. Express them using valid
Blueprint capabilities, action/artifact contracts, and content artifacts;
do not invent a new Blueprint field or a physical implementation plan. OPL and
authorized developers own materialization and integration.

Acceptance distinguishes schema/protocol checks, installed descriptor discovery,
real host rendering and interaction, publication/activation, and domain outcomes.
For a UI design, cover Agent-visible structured results, focused navigation,
unavailable data, sandbox restrictions, cancellation without execution, exact
target confirmation, owner denial, and fresh owner readback after an action.
Plain MCP clients still need a useful structured or text result. Human review
judges surface fit and usefulness; deterministic checks validate contracts and
evidence identity. A render fixture is not business acceptance.

Current reuse authorities:

- [MCP Apps specification](https://apps.extensions.modelcontextprotocol.io/)
- [OPL MCP Apps contract and delivery boundary](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/mcp-apps/SPEC.md)
- [OPL contribution schema](https://github.com/gaofeng21cn/one-person-lab/blob/main/contracts/opl-framework/app-contributions.schema.json)

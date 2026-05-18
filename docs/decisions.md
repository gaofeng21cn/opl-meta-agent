# opl-meta-agent 决策

- Adopt OPL standard domain-agent scaffold v1.
- Keep this repo as a declarative domain pack plus minimal authority functions.
- Use `opl-meta-agent` as the repo/product wording; use `meta-agent` only as a capability type.
- Keep `opl-meta-agent` outside the OPL Framework repo; OPL provides Agent Lab, scaffold surfaces, and generated interface bundles.
- Do not implement repo-local generic CLI/MCP/Skill/product-entry wrappers. OPL Framework derives those descriptors from standard action / stage contracts.
- Prove the minimum self-learning loop with a generated fixture agent and OPL Agent Lab external suite before adding live domain delivery.
- Treat mechanism patch proposal as a proposal-only self-learning output beside gated candidates. It must carry observe/diagnose/edit refs and explicit authority flags, then wait for an OPL gate before any promoted mechanism change.
- Add an external-suite self-evolution path: when a domain owner projects a blocked Agent Lab suite, `opl-meta-agent` may consume the suite run, create a developer patch work order, and act as the developer that changes the target agent source repo. Source-level stage, skill, prompt, rubric, quality-contract, test, and documentation patches are allowed after the target-agent patch gate; target domain truth, memory body, artifacts, publication quality verdicts, and default agent promotion state remain forbidden.
- Developer patch work orders must include a gap-to-patch traceability matrix, target repo file hints, required test/receipt/prohibited-write evidence, and version-management controls. A work order that only lists broad editable refs is too weak for self-evolution because it leaves the source patch under-specified and shifts quality control back to the foreground developer.

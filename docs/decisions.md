# opl-meta-agent 决策

- Adopt OPL standard domain-agent scaffold v1.
- Keep this repo as a declarative domain pack plus minimal authority functions.
- Use `opl-meta-agent` as the repo/product wording; use `meta-agent` only as a capability type.
- Keep `opl-meta-agent` outside the OPL Framework repo; OPL provides Agent Lab, scaffold surfaces, and generated interface bundles.
- Do not implement repo-local generic CLI/MCP/Skill/product-entry wrappers. OPL Framework derives those descriptors from standard action / stage contracts.
- Prove the minimum self-learning loop with a generated fixture agent and OPL Agent Lab external suite before adding live domain delivery.
- Treat mechanism patch proposal as a proposal-only self-learning output beside gated candidates. It must carry observe/diagnose/edit refs and explicit authority flags, then wait for an OPL gate before any promoted mechanism change.

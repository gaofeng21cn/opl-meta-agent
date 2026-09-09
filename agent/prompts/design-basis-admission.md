# Design basis admission

Decide which evidence and reusable practices may support this Agent's design.
Start from the current mission, supplied source material, owner constraints, and
any existing design basis. Apply `oma-design-basis-architecture` to assess source
support, transferability, and Profile fit.

For each material design choice, explain what the source establishes, how it
applies to this mission, and what limitations remain. Separate source-derived
facts, target-owner requirements, reusable patterns, assumptions, and unsupported
claims. Preserve exact source refs. Research synthesis may inform design but
does not establish target-domain truth.

Resolve Profile recommendations semantically against the mission and admitted
evidence, including when Framework reports `semantic_profile_selection_required`.
Record why requirements or patterns are adopted, adapted, or rejected. A catalog
match or an existing reference Agent does not by itself justify copying its
architecture. Retain useful prior decisions whose support still holds.

Return a design basis that connects the proposed requirements to evidence and
records assumptions, excluded claims, and consequential open questions. The next
Stage must be able to use these judgments without repeating the source review;
a list of source refs alone is insufficient. Recommend baseline assessment when
takeover/improve needs it, or `stage-architecture` when the available context is
adequate. If the mission itself is inconsistent, identify the decision for
`mission-intake` to resolve. Ordinary evidence limitations remain explicit in the
design basis rather than becoming a new execution gate.

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

Identify the knowledge the target already owns before proposing storage. Separate
product methods, owner or team context, persistent topic knowledge, and project
knowledge from their content kind and validity. Admit an existing personal or
team library as a source when authorized; ordinary workspace Markdown supports
the same model. Mixed sources are valid. Record semantic owners, intended uses,
required versus optional inputs, freshness and derived-source dependencies, and
who may accept writeback. Do not turn a target user's knowledge into a second
Agent-owned personal library or infer access from a topic label.

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

Stop source discovery when each consequential design choice has either sufficient
support or an explicit evidence gap, and the next Stage can proceed. Deliver that
basis now; further reading needs a named unresolved judgment whose outcome could
change the design. Reuse already verified source refs instead of repeating their
validation. Do not inspect runtime internals or reconstruct content digests merely
to strengthen a semantic conclusion: Framework owns byte identity and execution
receipts. An unavailable source or uncertain detail belongs in the open questions
with its consequence, unless it prevents the current design decision itself.

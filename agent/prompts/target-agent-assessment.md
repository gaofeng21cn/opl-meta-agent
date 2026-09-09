# Target Agent assessment

Determine what an existing Agent already does, what the requested change must
preserve, and which gaps matter to the current mission. For takeover or improve,
use the exact baseline supplied by OPL, the admitted design basis, and available
public behavior and evaluation evidence. A create request has no baseline;
report assessment as inapplicable and recommend `stage-architecture`.

Apply the baseline-assessment method in `oma-target-assessment-eval-design`.
Compare the current actions, Stage responsibilities, artifacts, capabilities,
authority, and memory policy with the requested outcome. Separate observed
strengths and defects from declarations and untested expectations. Preserve the
existing evaluation obligations, including public cases, protected requirements,
thresholds, and baseline comparison; use protected aggregates without reading
or inferring protected test bodies.

For each consequential gap, identify the affected behavior, supporting evidence,
and the smallest semantic surface that owns it. Explain which working behavior
should be reused and which observations a later evaluation must retain or add.
Do not infer a defect merely from a different directory layout or a shorter
prompt.

Return a version-bound assessment containing retained behavior, evidenced gaps,
uncertainties, and non-regression obligations. It is usable when architecture can
choose a scoped change and evaluation design can judge that change against the
baseline. Recommend `stage-architecture`; route an unresolved mission or design
basis decision to its owning Stage. Missing or conflicting baseline identity
must be reported explicitly, never replaced with a guessed version.

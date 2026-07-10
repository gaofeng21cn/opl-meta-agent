export function buildExpectedTypedBlockerRef(
  domainId: string,
  candidateId: string,
  blockerKind: string,
): string {
  return `expected-typed-blocker-ref:${domainId}/${candidateId}/${blockerKind}`;
}

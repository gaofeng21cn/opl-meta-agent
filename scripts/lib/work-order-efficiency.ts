import type { JsonObject } from './domain-pack.ts';
import {
  refsFromRecord,
  stringList,
  uniqueRefs,
} from './work-order-refs.ts';

export type EfficiencyNonRegressionRefs = {
  quality_floor_refs: string[];
  latency_baseline_refs: string[];
  usage_cost_refs: string[];
  cache_reuse_refs: string[];
  target_verification_refs: string[];
};

export function emptyEfficiencyNonRegressionRefs(): EfficiencyNonRegressionRefs {
  return {
    quality_floor_refs: [],
    latency_baseline_refs: [],
    usage_cost_refs: [],
    cache_reuse_refs: [],
    target_verification_refs: [],
  };
}

function refsByTokens(values: string[], tokens: string[]): string[] {
  return uniqueRefs(values.filter((ref) => {
    const normalized = ref.toLowerCase();
    return tokens.some((token) => normalized.includes(token));
  }));
}

function recordValue(value: unknown, key: string): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const nested = (value as JsonObject)[key];
  return nested && typeof nested === 'object' && !Array.isArray(nested) ? nested as JsonObject : null;
}

function collectEfficiencyHandoffProjectionRefs(record: JsonObject, target: EfficiencyNonRegressionRefs): void {
  const projections = Object.entries(record)
    .filter(([key, value]) => (
      key === 'efficiency_handoff_projection' || key.endsWith('_efficiency_handoff_projection')
    ) && value && typeof value === 'object' && !Array.isArray(value))
    .map(([, value]) => value as JsonObject);

  for (const projection of projections) {
    const signals = recordValue(projection, 'efficiency_signal_refs');
    const qualityFloor = recordValue(projection, 'quality_floor_refs');
    if (qualityFloor) {
      target.quality_floor_refs.push(...refsFromRecord(qualityFloor));
    }
    if (signals) {
      target.latency_baseline_refs.push(...stringList(signals.duration_refs));
      target.usage_cost_refs.push(...stringList(signals.cost_refs));
      target.cache_reuse_refs.push(...stringList(signals.cache_refs));
      target.cache_reuse_refs.push(...stringList(signals.reuse_refs));
      target.target_verification_refs.push(...stringList(signals.export_result_refs));
    }
  }
}

export function collectEfficiencyNonRegressionRefs(...sources: unknown[]): EfficiencyNonRegressionRefs {
  const explicit = emptyEfficiencyNonRegressionRefs();
  const flatRefs: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      flatRefs.push(value);
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as JsonObject;
    collectEfficiencyHandoffProjectionRefs(record, explicit);
    for (const field of Object.keys(explicit) as Array<keyof EfficiencyNonRegressionRefs>) {
      explicit[field].push(...stringList(record[field]));
    }
    if (record.efficiency_evidence_refs) {
      visit(record.efficiency_evidence_refs);
    }
    if (record.efficiency_non_regression_refs) {
      visit(record.efficiency_non_regression_refs);
    }
    [
      record.evidence_refs,
      record.metric_refs,
      record.quality_gate_refs,
      record.review_refs,
      record.required_refs,
      record.regression_suite_refs,
      record.source_refs,
      record.direct_evidence_refs,
      record.artifact_refs,
      record.repair_refs,
      record.receipt_refs,
      record.next_verification_command_refs,
    ].forEach(visit);
  };
  sources.forEach(visit);
  return {
    quality_floor_refs: uniqueRefs([
      ...explicit.quality_floor_refs,
      ...refsByTokens(flatRefs, ['quality-floor', 'quality_floor']),
    ]),
    latency_baseline_refs: uniqueRefs([
      ...explicit.latency_baseline_refs,
      ...refsByTokens(flatRefs, ['latency-baseline', 'latency_baseline']),
    ]),
    usage_cost_refs: uniqueRefs([
      ...explicit.usage_cost_refs,
      ...refsByTokens(flatRefs, ['usage-cost', 'usage_cost', 'token-cost', 'token_cost', 'cost-baseline']),
    ]),
    cache_reuse_refs: uniqueRefs([
      ...explicit.cache_reuse_refs,
      ...refsByTokens(flatRefs, ['cache-reuse', 'cache_reuse', 'prefix-cache', 'prefix_cache']),
    ]),
    target_verification_refs: uniqueRefs([
      ...explicit.target_verification_refs,
      ...refsByTokens(flatRefs, ['target-verification', 'target_verification']),
    ]),
  };
}

export function hasEfficiencyNonRegressionEvidence(refs: EfficiencyNonRegressionRefs): boolean {
  return [
    refs.quality_floor_refs,
    refs.latency_baseline_refs,
    refs.usage_cost_refs,
    refs.cache_reuse_refs,
    refs.target_verification_refs,
  ].some((values) => values.length > 0);
}

export function missingEfficiencyNonRegressionFields(refs: EfficiencyNonRegressionRefs): string[] {
  const missing: string[] = [];
  if (hasEfficiencyNonRegressionEvidence(refs) && refs.quality_floor_refs.length === 0) {
    missing.push('efficiency_non_regression_refs.quality_floor_refs');
  }
  return missing;
}

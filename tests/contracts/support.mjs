import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
export const epistemicDimensions = ['design_basis', 'agent_blueprint', 'evaluation_design', 'evolution'];

export function walk(value, visitor, pointer = '') {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, visitor, `${pointer}/${index}`));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => walk(entry, visitor, `${pointer}/${key}`));
  }
}
export function affectedDimensions(contract, changedDimensions) {
  const outgoing = new Map();
  for (const edge of contract.dependency_edges) {
    outgoing.set(edge.source_dimension, [
      ...(outgoing.get(edge.source_dimension) ?? []),
      edge.dependent_dimension,
    ]);
  }
  const affected = new Set(changedDimensions);
  const pending = [...changedDimensions];
  while (pending.length > 0) {
    const source = pending.shift();
    for (const dependent of outgoing.get(source) ?? []) {
      if (affected.has(dependent)) continue;
      affected.add(dependent);
      pending.push(dependent);
    }
  }
  return epistemicDimensions.filter((dimension) => affected.has(dimension));
}

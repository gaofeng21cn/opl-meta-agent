import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type JsonObject = Record<string, any>;

const repoRoot = path.resolve(import.meta.dirname, '../..');

export function absolute(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

export function readText(relativePath: string): string {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

export function readJson<T = JsonObject>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

export function jsonText(payload: unknown): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function writeJson(relativePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
  fs.writeFileSync(absolute(relativePath), jsonText(payload));
}

export function checkJsonFile(relativePath: string, payload: unknown, fixCommand: string): void {
  if (readText(relativePath) !== jsonText(payload)) {
    console.error(`${relativePath} is out of sync.`);
    console.error(`Run ${fixCommand} to regenerate it.`);
    process.exit(1);
  }
}

export function orderedObject(source: JsonObject, keyOrder: string[]): JsonObject {
  const output: JsonObject = {};
  keyOrder.forEach((key) => {
    if (Object.hasOwn(source, key)) {
      output[key] = source[key];
    }
  });
  Object.keys(source).forEach((key) => {
    if (!Object.hasOwn(output, key)) {
      output[key] = source[key];
    }
  });
  return output;
}

export function withoutKeys(source: JsonObject, omittedKeys: string[]): JsonObject {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !omittedKeys.includes(key)),
  );
}

export function asObjects(value: unknown, label: string): JsonObject[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value as JsonObject[];
}

export function sha256ForFiles(relativePaths: string[]): string {
  const hash = crypto.createHash('sha256');
  relativePaths.forEach((relativePath) => {
    const content = readText(relativePath);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(Buffer.byteLength(content)));
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  });
  return `sha256:${hash.digest('hex')}`;
}

export function runSyncJsonBundleCli(actions: {
  split: () => void;
  check: () => void;
  write: () => void;
  usage: string;
}): void {
  const command = process.argv[2] ?? '--check';

  if (command === '--split') {
    actions.split();
  } else if (command === '--check') {
    actions.check();
  } else if (command === '--write') {
    actions.write();
  } else {
    console.error(actions.usage);
    process.exit(2);
  }
}

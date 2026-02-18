import fs from "fs";
import path from "path";
import crypto from "crypto";
import { RULES } from "../sdk/ruleRegistry";

function resolveCircuitsRoot(): string {
  const candidates: string[] = [];

  if (typeof __dirname === "string") {
    candidates.push(path.join(__dirname, "..", "circuits"));
  }

  candidates.push(
    path.join(process.cwd(), "node_modules", "zk-eligibility-sdk", "dist", "circuits")
  );

  for (const candidate of candidates) {
    const manifestPath = path.join(candidate, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      return candidate;
    }
  }

  throw new Error(`Circuit manifest not found in known locations: ${candidates.join(", ")}`);
}

let circuitsRootCache: string | null = null;
function getCircuitsRoot(): string {
  if (!circuitsRootCache) {
    circuitsRootCache = resolveCircuitsRoot();
  }
  return circuitsRootCache;
}

type Manifest = Record<string, unknown>;
let manifestCache: Manifest | null = null;

function getManifest(): Manifest {
  if (manifestCache) return manifestCache;

  const manifestPath = path.join(getCircuitsRoot(), "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Circuit manifest missing at ${manifestPath}`);
  }

  manifestCache = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Manifest;
  return manifestCache;
}

export interface CircuitArtifacts {
  wasm: string;
  zkey: string;
  verificationKey: string;
}

export function getCircuitArtifacts(ruleId: string): CircuitArtifacts {
  const manifest = getManifest();

  if (!manifest[ruleId]) {
    throw new Error(`UNKNOWN_RULE: ${ruleId}`);
  }

  const rule = RULES[ruleId as keyof typeof RULES];
  if (!rule) {
    throw new Error(`UNKNOWN_RULE: ${ruleId}`);
  }

  const circuitName = rule.circuitDir.toLowerCase();
  const base = path.join(getCircuitsRoot(), rule.circuitDir);

  const wasmPath = path.join(base, `${circuitName}_js`, `${circuitName}.wasm`);
  const zkeyPath = path.join(base, `${circuitName}_final.zkey`);
  const vkeyPath = path.join(base, "verification_key.json");

  // If manifest contains checksums, verify file integrity
  try {
    const meta = manifest[ruleId] as any;
    if (meta) {
      if (meta.wasmHash && fs.existsSync(wasmPath)) {
        const ok = verifyFileHash(wasmPath, meta.wasmHash as string);
        if (!ok) throw new Error(`WASM checksum mismatch for ${ruleId}`);
      }
      if (meta.zkeyHash && fs.existsSync(zkeyPath)) {
        const ok = verifyFileHash(zkeyPath, meta.zkeyHash as string);
        if (!ok) throw new Error(`ZKey checksum mismatch for ${ruleId}`);
      }
      if (meta.verificationKeyHash && fs.existsSync(vkeyPath)) {
        const ok = verifyFileHash(vkeyPath, meta.verificationKeyHash as string);
        if (!ok) throw new Error(`Verification key checksum mismatch for ${ruleId}`);
      }
    }
  } catch (err) {
    throw new Error(`Circuit artifact verification failed: ${String(err)}`);
  }

  return {
    wasm: wasmPath,
    zkey: zkeyPath,
    verificationKey: vkeyPath,
  };
}

function verifyFileHash(filePath: string, expected: string): boolean {
  try {
    const buf = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    const normalized = expected.trim().toLowerCase();
    if (normalized.startsWith("sha256:")) {
      return `sha256:${hash}` === normalized;
    }
    return hash === normalized;
  } catch {
    return false;
  }
}

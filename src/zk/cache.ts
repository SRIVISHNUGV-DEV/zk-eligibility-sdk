import path from "path";
import fs from "fs";
import { RULES } from "../sdk/ruleRegistry";

// Import manifest at the top
const manifestPath = path.join(
  __dirname,
  "..",
  "circuits",
  "manifest.json"
);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

export interface CircuitArtifacts {
  wasm: string;
  zkey: string;
  verificationKey: string;
}

/**
 * Resolves circuit artifact paths for a rule using the manifest
 */
export function getCircuitArtifacts(ruleId: string): CircuitArtifacts {
  // Validate that rule exists in manifest
  if (!manifest[ruleId]) {
    throw new Error(`UNKNOWN_RULE: ${ruleId}`);
  }

  const rule = RULES[ruleId as keyof typeof RULES];
  if (!rule) {
    throw new Error(`UNKNOWN_RULE: ${ruleId}`);
  }

  const circuitName = rule.circuitDir.toLowerCase();

  // 🔧 FIX: resolve relative to SDK, NOT user project
  const base = path.join(
    __dirname,
    "..",
    "circuits",
    rule.circuitDir
  );

  return {
    wasm: path.join(
      base,
      `${circuitName}_js`,
      `${circuitName}.wasm`
    ),
    zkey: path.join(
      base,
      `${circuitName}_final.zkey`
    ),
    verificationKey: path.join(
      base,
      "verification_key.json"
    )
  };
}
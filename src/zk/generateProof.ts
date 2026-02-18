import fs from "fs";
import path from "path";
import * as snarkjs from "snarkjs";
import { getCircuitArtifacts } from "./cache";
import { runCmd } from "./runCmd";
import { resolveWorkDir } from "./workdir";
import { ErrorCode } from "../types/ErrorCode";

// Limit concurrent heavy proof generation to avoid resource exhaustion
class Semaphore {
  private max: number;
  private current = 0;
  private queue: Array<() => void> = [];

  constructor(max: number) {
    this.max = max;
  }

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.current++;
  }

  release(): void {
    this.current = Math.max(0, this.current - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}

const proofSemaphore = new Semaphore(2);

interface GenerateZKProofParams {
  ruleId: string;
  input: Record<string, any>;
}

export async function generateZKProof({
  ruleId,
  input
}: GenerateZKProofParams): Promise<{ proof: any; publicSignals: any }> {
  try {
    const { wasm, zkey } = getCircuitArtifacts(ruleId);
    if (!fs.existsSync(wasm)) {
      throw new Error(`Circuit wasm not found: ${wasm}`);
    }
    if (!fs.existsSync(zkey)) {
      throw new Error(`Circuit zkey not found: ${zkey}`);
    }

    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasm,
        zkey
      );

      return {
        proof,
        publicSignals
      };
    } catch {
      const workDir = resolveWorkDir(ruleId);
      const inputPath = path.join(workDir, "input.json");
      const witnessPath = path.join(workDir, "witness.wtns");
      const proofPath = path.join(workDir, "proof.json");
      const publicPath = path.join(workDir, "public.json");

      try {
        fs.writeFileSync(inputPath, JSON.stringify(input), { mode: 0o600 });

        await proofSemaphore.acquire();
        try {
          await runCmd("snarkjs", ["wtns", "calculate", wasm, inputPath, witnessPath], workDir, 120000);
          await runCmd("snarkjs", ["groth16", "prove", zkey, witnessPath, proofPath, publicPath], workDir, 120000);

          const proof = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
          const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf-8"));
          return { proof, publicSignals };
        } finally {
          proofSemaphore.release();
        }
      } finally {
        // Best-effort cleanup of working directory
        try {
          if (fs.existsSync(workDir)) {
            fs.rmSync(workDir, { recursive: true, force: true });
          }
        } catch (e) {
          console.error("Failed to cleanup workdir:", e);
        }
      }
    }
  } catch (err: any) {
    console.error("Proof generation error:", err.message || err);
    throw {
      code: ErrorCode.PROOF_GENERATION_FAILED,
      error: err
    };
  }
}

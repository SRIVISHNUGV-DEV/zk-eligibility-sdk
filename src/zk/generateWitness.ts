import { runCmd } from "./runCmd";

interface GenerateWitnessArgs {
  wasmPath: string;
  inputPath: string;
  outputPath: string;
}

/**
 * Generates a witness (.wtns) file from a compiled circuit.
 */
export async function generateWitness({
  wasmPath,
  inputPath,
  outputPath
}: GenerateWitnessArgs): Promise<void> {

  await runCmd(
    "snarkjs",
    [
      "wtns",
      "calculate",
      wasmPath,
      inputPath,
      outputPath
    ]
  );
}

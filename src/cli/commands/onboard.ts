import fs from "fs";
import path from "path";
import { ZKEligibilitySDK } from "../../sdk/ZKEligibiltySDK";

function parseJsonOrFile(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    const resolvedPath = path.resolve(process.cwd(), input);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error("Params must be valid JSON or a path to a JSON file");
    }
    try {
      const fileContents = fs.readFileSync(resolvedPath, "utf-8");
      return JSON.parse(fileContents);
    } catch {
      throw new Error("Failed to parse JSON from params file");
    }
  }
}

export async function onboardCommand(args: string[]) {
  const [wallet, paramsJson] = args;
  if (!wallet || !paramsJson) {
    throw new Error("Usage: onboard <WALLET> <params.json | inline JSON>");
  }

  const params = parseJsonOrFile(paramsJson);
  const result = await ZKEligibilitySDK.onboard(wallet, params);
  console.log(JSON.stringify(result, null, 2));
}

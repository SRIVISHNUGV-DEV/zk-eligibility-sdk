import fs from "fs";
import path from "path";
import { executeRule } from "../../sdk/executeRule";
import { RULES } from "../../sdk/ruleRegistry";

export async function proveCommand(args: string[]) {
  const [ruleId, wallet, paramsJson] = args;

  if (!ruleId || !wallet || !paramsJson) {
    throw new Error(
      "Usage: prove <RULE_ID> <wallet> <params.json | inline JSON>"
    );
  }

  if (!(ruleId in RULES)) {
    throw new Error(`Unknown rule: ${ruleId}`);
  }

  let params: any;

  try {
    // Inline JSON
    params = JSON.parse(paramsJson);
  } catch {
    // File-based JSON
    const resolvedPath = path.resolve(process.cwd(), paramsJson);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        "Params must be valid JSON or a path to a JSON file"
      );
    }

    try {
      const fileContents = fs.readFileSync(resolvedPath, "utf-8");
      params = JSON.parse(fileContents);
    } catch {
      throw new Error("Failed to parse JSON from params file");
    }
  }

  const result = await executeRule(
    ruleId as any,
    wallet,
    params
  );

  console.log(JSON.stringify(result, null, 2));
}
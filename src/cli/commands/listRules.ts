import { RULES } from "../../sdk/ruleRegistry";
import { RuleMeta } from "../../sdk/ruleRegistry";

export function listRulesCommand() {
  console.log("Available rules:\n");

  Object.values(RULES).forEach((rule) => {
    console.log(`- ${rule.id}: ${rule.description}`);
  });
}

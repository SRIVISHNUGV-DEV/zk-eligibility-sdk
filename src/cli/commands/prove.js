"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proveCommand = proveCommand;
const sdk_1 = require("../../src/sdk");
const sdk_2 = require("../../src/sdk");
async function proveCommand(args) {
    const [ruleId, wallet, paramsJson] = args;
    if (!ruleId || !wallet || !paramsJson) {
        throw new Error("Usage: prove <RULE_ID> <wallet> '<params as JSON>'");
    }
    if (!(ruleId in sdk_2.RULES)) {
        throw new Error(`Unknown rule: ${ruleId}`);
    }
    let params;
    try {
        params = JSON.parse(paramsJson);
    }
    catch {
        throw new Error("Params must be valid JSON");
    }
    const result = await (0, sdk_1.executeRule)(ruleId, wallet, params);
    console.log(JSON.stringify(result, null, 2));
}
//# sourceMappingURL=prove.js.map
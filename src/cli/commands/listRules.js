"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRulesCommand = listRulesCommand;
const sdk_1 = require("../../src/sdk");
function listRulesCommand() {
    console.log("Available rules:\n");
    Object.values(sdk_1.RULES).forEach((rule) => {
        console.log(`- ${rule.id}: ${rule.description}`);
    });
}
//# sourceMappingURL=listRules.js.map
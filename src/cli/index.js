#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prove_1 = require("./commands/prove");
const verify_1 = require("./commands/verify");
const listRules_1 = require("./commands/listRules");
const command = process.argv[2];
async function main() {
    switch (command) {
        case "prove":
            await (0, prove_1.proveCommand)(process.argv.slice(3));
            break;
        case "verify":
            await (0, verify_1.verifyCommand)(process.argv.slice(3));
            break;
        case "list-rules":
            (0, listRules_1.listRulesCommand)();
            break;
        default:
            console.log(`
Usage:
  zk-eligibility prove
  zk-eligibility verify
  zk-eligibility list-rules
`);
    }
}
main().catch((err) => {
    console.error("CLI error:", err.message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
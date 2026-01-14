"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCommand = verifyCommand;
const fs_1 = __importDefault(require("fs"));
const sdk_1 = require("../../src/sdk");
const ruleRegistry_1 = require("../../src/sdk/ruleRegistry");
async function verifyCommand(args) {
    try {
        const [ruleId, proofPath, publicPath] = args;
        if (!ruleId || !proofPath || !publicPath) {
            throw new Error("Usage: verify <RULE_ID> <proof.json> <public.json>");
        }
        if (!ruleRegistry_1.RULES[ruleId]) {
            throw new Error(`Unknown rule: ${ruleId}`);
        }
        if (!fs_1.default.existsSync(proofPath)) {
            throw new Error(`Proof file not found: ${proofPath}`);
        }
        if (!fs_1.default.existsSync(publicPath)) {
            throw new Error(`Public signals file not found: ${publicPath}`);
        }
        const proof = JSON.parse(fs_1.default.readFileSync(proofPath, "utf-8"));
        const publicSignals = JSON.parse(fs_1.default.readFileSync(publicPath, "utf-8"));
        const isValid = await (0, sdk_1.verifyProof)(ruleId, proof, publicSignals);
        console.log(isValid
            ? `✅ Proof is valid for rule ${ruleId}`
            : `❌ Proof is INVALID for rule ${ruleId}`);
        process.exit(isValid ? 0 : 1);
    }
    catch (err) {
        console.error(`❌ Verification failed: ${err.message}`);
        process.exit(1);
    }
}
//# sourceMappingURL=verify.js.map
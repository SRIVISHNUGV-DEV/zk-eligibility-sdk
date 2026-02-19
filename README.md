# ZK Eligibility SDK

**Cryptographically Proven Eligibility. Zero Data Leakage.**

A zero-knowledge eligibility framework for Web3. Prove wallet properties—age, activity, holdings, cooldowns—without revealing transaction history, balances, or user identities.

For airdrop designers, DAO treasuries, and DeFi protocols that demand both security and privacy.

---

## The Problem

Today, Web3 teams face an impossible choice:

| Option | Problem |
|--------|----------|
| **Public allowlists** | Leaks entire wallet histories. Privacy nightmare. |
| **Centralized gatekeeping** | Requires trusting a third party. Single point of failure. |
| **Simple heuristics** | Easy to game. Sybil attacks succeed. |
| **This SDK** | ✅ Cryptographically proven. ✅ Privacy-preserving. ✅ Sybil-resistant. |

**With ZK Eligibility SDK, you get all three.**

---

## What You Get

✅ **Cryptographic Guarantees**
- If a proof verifies, the statement is mathematically true
- Forging eligibility is computationally infeasible under standard cryptographic assumptions 
- Industry-standard Groth16 zk-SNARK implementation

✅ **Zero Data Leakage**
- Users prove eligibility without revealing wallet history
- No transaction hashes exposed
- No balance information leaked
- No timing patterns revealed

✅ **Production-Ready**
- 5 battle-tested eligibility rules
- CLI + SDK + on-chain verifier ready
- 11/11 edge cases passing
- Comprehensive edge-case test coverage
- Comprehensive security documentation

✅ **Easy Integration**
- TypeScript SDK (REST-style)
- Verifiable proofs for on-chain or off-chain use
- Drop-in replacement for centralized allowlists

---

## 5 Eligibility Rules (Composable)

### 1️⃣ Wallet Age
**Prove:** First transaction before block N  
**Use case:** Sybil resistance, legacy user access, loyalty tiers  
**Privacy:** Exact age hidden, only proves eligibility  

### 2️⃣ Minimum Activity
**Prove:** At least N outbound transactions  
**Use case:** Active user filtering, engagement gates, bot detection  
**Privacy:** Exact count hidden, only proves threshold  

### 3️⃣ Cooldown Period
**Prove:** Inactive for N+ blocks  
**Use case:** Rate limiting, anti-spam, sequential access control  
**Privacy:** Last activity block hidden  

### 4️⃣ Token Hold Duration
**Prove:** Held token X for N+ blocks  
**Use case:** Holder privileges, loyalty programs, time-weighted access  
**Privacy:** Balances and transfer history hidden  

### 5️⃣ Activity Classification
**Prove:** Wallet falls into activity band (0–3)  
**Use case:** Fair distribution, tier-based rewards, heuristic filtering  
**Privacy:** Exact metrics hidden, only rough band revealed  

---

## Real-World Examples

**Airdrop Designer**
```
Requirement: "Only wallets active for 6+ months"
With ZK SDK: Users prove eligibility → receive airdrop
Result: No data breach. Sybil-resistant. Privacy-preserved.
```

**DAO Treasury Manager**
```
Requirement: "Community governance token for users with 10+ tx"
With ZK SDK: Prove activity tier → vote with privacy
Result: Only qualified members participate. No doxxing.
```

**DeFi Protocol**
```
Requirement: "Risk-based access for established users"
With ZK SDK: Prove wallet age + activity → access premium features
Result: Fair, sybil-resistant gate. User privacy maintained.
```

---

## Why This Matters

|  Traditional Approach  |  ZK Eligibility SDK  |

| 📋 Off-chain allowlist | 🔐 Cryptographic proof |
| 🔓 Public wallet history | 🤖 Minimal Data Disclosure |
| 🙏 Trust required | ✅ Trust-minimized |
| ❌ Sybil-vulnerable | ✅ Sybil-resistant |
| 💸 Manual curation cost | 🤖 Automated verification |
| 🌍 Privacy nightmare | 🛡️ Privacy-first |

---

## How It Works


┌──────────────────────────────┐
│ User's Wallet (public)       │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────────────┐
│ Blockchain Data (on-chain, public)   │ ← RPC Provider
│ fetched via Alchemy/Infura           │
└──────────────┬───────────────────────┘
               │ (private processing)
               v
┌──────────────────────────────────────┐
│ TypeScript SDK                       │ ← Validates inputs
│ (verify constraints, policy)         │   Prevents abuse
└──────────────┬───────────────────────┘
               │ (private witness)
               v
┌──────────────────────────────────────┐
│ ZK Circuit (Circom)                  │ ← Groth16 proof
│ Cryptographic proof generation       │   generation
└──────────────┬───────────────────────┘
               │ (public proof)
               v
┌──────────────────────────────────────┐
│ Proof + Public Signals               │ ← Verifiable by anyone
│ (cryptographically proven)           │   Off-chain or on-chain
└──────────────────────────────────────┘


**Key insight:** Only the proof is shared. Private data never leaves the user's machine.

---

## Security Guarantees

✅ **Cryptographically Sound**
- Groth16 zk-SNARK (industry standard)
- Formal constraint verification
- No silent overflows or edge case failures

✅ **Conservative Design**
- Fail fast (TypeScript) on invalid parameters
- Fail loudly (ZK) on false statements
- Never default to true
- Explicit assumptions documented

✅ **Fail-Safe Behavior**
- All failures are deterministic
- No silent successes
- Clear error codes and reasons
- No ambiguous states

⚠️ **Important Notice**
- All circuits are **deterministic** (same input always produces same output)
- Circuits are **not audited** — use at your own risk in production environments
- The SDK minimizes data disclosure to only what is strictly required to verify eligibility

**See [SECURITY.md](./SECURITY.md) for detailed threat model and assumptions.**

---

## Quick Start

### Installation
```bash
npm install zk-eligibility-sdk@1.0.0-beta.9
```

### Basic Usage
```typescript
import "dotenv/config";
import { ZKEligibilitySDK } from "zk-eligibility-sdk";

// Prove wallet has at least 10 transactions
const proof = await ZKEligibilitySDK.prove(
  "MIN_ACTIVITY",
  "0xWalletAddress",
  { minTx: 10, chainId: 1 }
);

if (proof.isValid) {
  console.log("User is eligible ✅");
  // Grant access / send airdrop / etc
}
```

### SDK API Reference

The SDK exposes a small set of high-level helpers for common workflows. These are the primary programmatic entry points (TypeScript):

- `ZKEligibilitySDK.listRules()` : Returns an array of rule metadata (id, description, requiresParams, outputType).
- `ZKEligibilitySDK.getRule(ruleId)` : Returns the `RuleMeta` for a rule or throws if unknown.
- `ZKEligibilitySDK.prove(ruleId, walletAddress, params?)` : Runs witness generation + proof for a single rule and returns an `SDKResult` (either `{ isValid: true, proof, publicSignals }` or `{ isValid: false, reason }`).
- `ZKEligibilitySDK.onboard(walletAddress, params)` : Convenience helper that runs prove+verify for all rules and returns an `OnboardResult` with per-rule `prove`/`verify` status, `failedRules`, and any `proof`/`publicSignals` produced.

Lower-level utilities (advanced use):

- `generateProof({ ruleId, input })` : Direct wrapper over the internal ZK proof generator (returns `{ proof, publicSignals }`).
- `verifyProof(ruleId, proof, publicSignals)` : Verifies a proof against the verification key (returns `{ isValid: true }` or `{ isValid: false, reason }`).
- `executeRule(ruleId, wallet, params)` : Internal dispatcher used by the CLI and SDK; prefer using `ZKEligibilitySDK.prove` in application code.

If you're interacting with on-chain gates, the SDK provides Ethereum helpers in `src/sdk/eth.ts`:

- `submitProofOnChain(providerOrSigner, gateAddress, ruleId, proof, publicSignals, nonce, expiryBlock, overrides?)` : Submits a proof transaction to an `EligibilityGate` contract and returns `{ txHash, wait }`.
- `makeRuleId(name)` : Computes `keccak256` of the rule name (useful to build `bytes32` rule identifiers that match on-chain expectations).

Use these APIs when you need programmatic access beyond the CLI examples below.

### CLI
```bash
# List all rules
npx zkesdk list-rules

# Generate a proof
npx zkesdk prove MIN_ACTIVITY 0xWallet '{"minTx":10}'

# Run full onboarding flow (prove + verify across all rules)
npx zkesdk onboard 0xWallet ./onboard-params.json

# Verify a proof
npx zkesdk verify MIN_ACTIVITY proof.json public.json

# Submit proof on-chain (EligibilityGate)
npx zkesdk submit WALLET_AGE proof.json public.json 0xGateAddress 1 20000000
```

### Supported Chains

Current supported `chainId` values:

- `1` : Ethereum Mainnet
- `137` : Polygon Mainnet
- `42161` : Arbitrum Mainnet

Pass `chainId` inside rule params:

```typescript
await ZKEligibilitySDK.prove("WALLET_AGE", wallet, {
  thresholdBlock: 20_000_000,
  chainId: 137
});
```

### On-Chain Verification
Proofs can be verified in a Solidity contract:
```solidity
groth16Verifier.verifyProof(
  proof.pi_a,
  proof.pi_b,
  proof.pi_c,
  publicSignals
);
 
```
We have also added a helper contract (EligibilityGate.sol) which will guarentee proper verification of calls based on the RuleId's 

RuleID's are the keccak256 hashes of the rule names and are enforced consistently across the SDK,CLI and on-chain contracts

1) keccak256(WALLET_AGE)
2) keccak256(COOLDOWN)
3) keccak256(MIN_ACTIVITY)
4) keccak256(TOKEN_HOLD)
5) keccak256(ACTIVITY_CLASS)

For Additional Information refer (contracts\README.md)
---

## Deployment Options

### Option 1: Off-Chain (Fastest)
- User generates proof locally
- SDK verifies proof
- Instant access/allowlisting
- **Best for:** Airdrops, quick distributions

### Option 2: On-Chain (Most Trustless)
- User generates proof
- Smart contract verifies proof
- Transparent, auditable, trustless
- **Best for:** DAOs, protocols, public systems

### Option 3: Hybrid (Flexible)
- Backend verifies proof
- Backend gates access
- Best of both worlds
- **Best for:** Enterprise integrations

---

## What This Does NOT Do

❌ Prove wallet ownership (no sig checks)  
❌ Prove identity or KYC status  
❌ Guarantee real-time state under reorgs  
❌ Prevent smart contract wallets  

**These are features, not bugs.** This SDK does one thing and does it extremely well:

> Prove wallet properties without leaking wallet history.

Everything else is your application's responsibility.

---

## Specs

| Aspect | Spec |
|--------|------|
| **Proof System** | Groth16 (BN128 curve) |
| **Circuit Language** | Circom 2.0.0 |
| **Verification** | Off-chain + on-chain |
| **Supported Chains** | Ethereum, Polygon, Arbitrum |
| **Languages** | TypeScript/JavaScript |
| **Test Coverage** | 11/11 edge cases passing |
| **Status** | Production-ready (v1.0) |

---

## Governance & Support

**Version Guarantees**
- v1.x: All cryptographic guarantees locked
- Breaking changes → v2.0 only
- Backward-compatible minor versions

**Security Policy**
- Responsible disclosure for vulnerabilities
- Private contact for security issues
- See [SECURITY.md](./SECURITY.md) for details

---

## Required: RPC Provider

This SDK does NOT ship with an RPC key.

You must set one of the following environment variables to provide an RPC provider key:

- `ALCHEMY_API_KEY`
- `INFURA_API_KEY`

Example:

export ALCHEMY_API_KEY=your_key_here

## FAQ

**Q: Can I fake a proof?**
A: No. Cryptographically impossible. Groth16 soundness guarantees ensure only valid proofs verify.

**Q: What if the RPC provider lies?**
A: Proofs reflect the RPC provider's data. Use a trusted provider (Alchemy, Infura, Quicknode, or your own node).

**Q: Can I combine multiple rules?**
A: Yes. Generate multiple proofs and combine them at the application layer. Each proof is independent and verifiable.

**Q: What about wallet privacy?**
A: The proof proves eligibility. Transaction history, balances, and transfers are never revealed or computed by the SDK.

**Q: How much gas does on-chain verification cost?**
A: Typically ~250k-400k gas per verification. depending on the network and the calldata size.

**Q: Can this run on-chain natively?**
A: Proof generation happens off-chain. Verification happens on-chain. This is by design (privacy + efficiency).

---

## License

This project uses a **dual licensing model**:

### 📄 Apache 2.0 License
The following components are licensed under **Apache License 2.0**:
- SDK source code (`src/` directory)
- ZK circuits (`circuits/` directory)
- Circom library (`circomlib/` directory)
- CLI tooling (`cli/` directory)
- Test infrastructure (`tests/` directory)
- Documentation (README.md, IMPLEMENTATION_GUIDE.md, RULES.md, SECURITY.md)

**Use case:** Open-source usage, commercial integration, derivative works  
**Requirement:** Include Apache 2.0 license and provide attribution

### 📝 MIT License
The following components are licensed under **MIT License**:
- Smart contracts (`contracts/` directory)

**Use case:** Contract deployment, integration with verifiers, modification and distribution  
**Requirement:** Include MIT license and provide attribution

### How to Use

- **Using the SDK for eligibility checking?** → Apache 2.0 applies. Include `LICENSE-APACHE2.0`.
- **Deploying smart contracts?** → MIT applies. Include `LICENSE-MIT`.
- **Using both?** → Both licenses apply to their respective components.

See [LICENSE](./LICENSE), [LICENSE-APACHE2.0](./LICENSE-APACHE2.0), and [LICENSE-MIT](./LICENSE-MIT) for full license texts.

---

## Next Steps

🚀 **Start now:**
1. Clone the repo
2. `npm install`
3. Run `npm run test:all` (11 edge cases pass)
4. Integrate the SDK into your app

📖 **Learn more:**
- [RULES.md](./RULES.md) — Detailed rule specifications
- [SECURITY.md](./SECURITY.md) — Threat model & guarantees
- CLI: `npm run cli`

🤝 **Questions?**
- File an issue 
- Check docs
- Security issues → private disclosure

---

**Made with intent. Shipped with integrity.**

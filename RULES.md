# Eligibility Rules Specification

**This document defines all eligibility rules supported by the ZK Eligibility SDK.**

Each rule is independently verifiable, privacy-preserving, and composable with other rules.

All rules are deterministic:
the same inputs always produce the same proof and public signals.

---

## General Rule Model

All rules follow the same cryptographic pattern:

1. **Public blockchain data** is fetched from chain (via RPC)
2. **Private witness** is generated (never shared)
3. **ZK proof** is computed using witness + constraints
4. **Minimal public signals** are revealed (minimal public signals -> 1-4 values per rule)

**Key insight:** Transaction history, exact metrics, and identifiers are never revealed—only eligibility status.

### Rule Identifiers (Rule IDs)

Each rule has a canonical `RuleId` (string) used throughout the SDK and by on-chain gates. On-chain contracts expect a `bytes32` identifier computed as `keccak256(utf8(ruleName))`. The SDK exposes a helper `makeRuleId(name)` in `src/sdk/eth.ts` that computes the same value. Example canonical names:

- `WALLET_AGE`
- `MIN_ACTIVITY`
- `COOLDOWN`
- `TOKEN_HOLD`
- `ACTIVITY_CLASS`

When constructing on-chain calls, prefer using the SDK's `makeRuleId` to avoid mismatches.

---

## Rule 1: WALLET_AGE

### Purpose
Cryptographically prove that a wallet's first outbound transaction occurred before a specified block number.

### Inputs
| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `string` | Ethereum address |
| `thresholdBlock` | `number` | Block number threshold |

### Statement Proven
```
The wallet's first outbound transaction block < thresholdBlock
```

### Public Signals
| Signal | Value | Meaning |
|--------|-------|---------|
| `isValid` | 0 or 1 | 1 if statement is true, 0 otherwise |

### EXAMPLE API USAGE

import { ZKEligibilitySDK } from "zk-eligibility-sdk";

const wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const result = await ZKEligibilitySDK.prove(
  "WALLET_AGE",
  wallet,
  {
    thresholdBlock: 15_000_000
  }
);

if (result.isValid) {
  console.log("Wallet is old enough ✅");
} else {
  console.log("Not eligible:", result.reason);
}

### EXAMPLE CLI USAGE

npx zkesdk prove WALLET_AGE 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 "{\"thresholdBlock\": 1000000}"

### What Is Hidden
- ✅ Exact wallet creation time
- ✅ Exact first transaction block
- ✅ Transaction hash or amounts
- ✅ Sender/receiver identities

### Edge Cases Handled
- Wallets with no outbound transactions → `isValid = 0`
- Negative thresholds → rejected at SDK level
- Block reorgs → proof reflects RPC provider's canonical view at generation time

### Use Cases

✅ Sybil resistance (new wallets spam)  
✅ Legacy user eligibility (early Ethereum participants)  
✅ Loyalty tiers (long-term community members)  
✅ Governance access (established accounts only)  

### When NOT to Use

❌ Identity verification (doesn't prove ownership)  
❌ Real-time guarantees (depends on chain state)  
❌ Contract wallets (no outbound tx requirement)  

---

## Rule 2: MIN_ACTIVITY

### Purpose
Cryptographically prove that a wallet has executed at least N outbound transactions.

### Inputs
| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `string` | Ethereum address |
| `minTx` | `number` | Minimum transaction count |

### Statement Proven
```
Wallet's outbound transaction count >= minTx
```

### Public Signals
| Signal | Value | Meaning |
|--------|-------|---------|
| `isValid` | 0 or 1 | 1 if statement is true, 0 otherwise |

### What Is Hidden
- ✅ Exact transaction count
- ✅ Transaction hashes or amounts
- ✅ Timing of activity
- ✅ Recipient addresses

### Edge Cases Handled
- `minTx > chain's total transactions` → rejected
- `minTx = 0` → always true (rejected as pointless)
- Contract wallets with high tx counts → processed normally

### EXAMPLE API USAGE

import { ZKEligibilitySDK } from "zk-eligibility-sdk";

const wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const result = await ZKEligibilitySDK.prove(
  "MIN_ACTIVITY",
  wallet,
  {
    minTx: 10
  }
);

if (result.isValid) {
  console.log("Wallet is active ✅");
}

### EXAMPLE CLI USAGE

npx zkesdk prove MIN_ACTIVITY 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 '{"minTx":10}'

### Use Cases

✅ Sybil resistance (filter one-time accounts)  
✅ Activity-based gating (active users only)  
✅ Airdrop eligibility (engaged community)  
✅ Bot detection (humans have patterns)  

### When NOT to Use

❌ Identity verification (activity ≠ identity)  
❌ Fine-grained reputation scoring  
❌ Balance-based distribution (different rule needed)  

---

## Rule 3: COOLDOWN

### Purpose
Cryptographically prove that a wallet has been inactive for a minimum number of blocks.

### Inputs
| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `string` | Ethereum address |
| `cooldownBlocks` | `number` | Minimum blocks of inactivity |

### Statement Proven
```
Current block - Last outbound tx block >= cooldownBlocks
```

### Public Signals
| Signal | Value | Meaning |
|--------|-------|---------|
| `isValid` | 0 or 1 | 1 if statement is true, 0 otherwise |

### What Is Hidden
- ✅ Exact last activity block
- ✅ Transaction amounts or hashes
- ✅ Recent activity patterns
- ✅ Time between transactions

### Edge Cases Handled
- Wallets with no Outbound transactions -> rule fails by default
- `cooldownBlocks > chain age` → `isValid = 0`
- Block reorgs → latest canonical state

### EXAMPLE API USAGE

import { ZKEligibilitySDK } from "zk-eligibility-sdk";

const wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const result = await ZKEligibilitySDK.prove(
  "COOLDOWN",
  wallet,
  {
    cooldownBlocks: 50_000
  }
);

if (result.isValid) {
  console.log("Cooldown satisfied ✅");
}

### EXAMPLE CLI USAGE

npx zkesdk prove COOLDOWN 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 '{"cooldownBlocks":50000}'

### Use Cases

✅ Rate limiting (prevent rapid repeat access)  
✅ Cooldown-based mints (NFTs with waiting periods)  
✅ Anti-bot measures (human-like behavior)  
✅ Temporal access control (time-gated rewards)  

### When NOT to Use

❌ Time-critical enforcement (chain reorgs unpredictable)  
❌ High-frequency trading (not designed for it)  

---

## Rule 4: TOKEN_HOLD

### Purpose
Cryptographically prove that a wallet has held a specific token for at least N blocks.

### Inputs
| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `string` | Ethereum address |
| `tokenAddress` | `string` | ERC-20/721/1155 contract |
| `minHoldBlocks` | `number` | Minimum holding duration |

### Statement Proven
```
First token receipt block + minHoldBlocks <= current block
```

### Public Signals
| Signal | Value | Meaning |
|--------|-------|---------|
| `isValid` | 0 or 1 | 1 if statement is true, 0 otherwise |

### What Is Hidden
- ✅ Token balance (current or historical)
- ✅ Exact acquisition time
- ✅ Transfer history
- ✅ Amount held
- ✅ Recipient addresses in transfers

### Edge Cases Handled
- Wallet never received token → `isValid = 0`
- Token transfers out are **not** tracked (holding duration only)
- Token burning/loss doesn't affect proof

### EXAMPLE API USAGE

import { ZKEligibilitySDK } from "zk-eligibility-sdk";

const wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const result = await ZKEligibilitySDK.prove(
  "TOKEN_HOLD",
  wallet,
  {
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    minHoldBlocks: 100_000
  }
);

if (result.isValid) {
  console.log("Token held long enough ✅");
}

### EXAMPLE CLI USAGE

npx zkesdk prove TOKEN_HOLD 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 '{"tokenAddress":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","minHoldBlocks":100000}'

### Use Cases

✅ Holder privileges (rewards for loyal holders)  
✅ Loyalty programs (time-weighted access)  
✅ Fair distribution (prevent pump-and-dump gaming)  
✅ Community governance (long-term stakeholders)  

### When NOT to Use

❌ Balance-based gating (this proves duration, not amount)  
❌ Real-time balance checks (state can change)  

⚠️ This rule proves holding duration based on first receipt only.
It does NOT prove current ownership or balance.

---

## Rule 5: ACTIVITY_CLASS

### Purpose
Classify a wallet into a coarse activity band without revealing exact metrics.

### Inputs
| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `string` | Ethereum address |

### Classification Output
| Class | Activity Level | Transaction Range |
|-------|-----------------|-------------------|
| `0` | Very low | <5 tx |
| `1` | Low | 5-49 tx |
| `2` | Medium | 51-500 tx |
| `3` | High | 500+ tx |

### Public Signals
| Signal | Value | Meaning |
|--------|-------|---------|
| `classId` | 0, 1, 2, or 3 | Activity band |

### What Is Hidden
- ✅ Exact transaction count
- ✅ Transaction history
- ✅ Time distribution of activity
- ✅ Amounts transferred

### Edge Cases Handled
- No outbound tx → `classId = 0`
- Classification thresholds are hardcoded in v1.0
- Classes are coarse by design (privacy + usability)

### EXAMPLE API USAGE

import { ZKEligibilitySDK } from "zk-eligibility-sdk";

const wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const result = await ZKEligibilitySDK.prove(
  "ACTIVITY_CLASS",
  wallet,
  {}
);

if (result.classId !== undefined) {
  console.log("Activity class:", result.classId);
}

### EXAMPLE CLI USAGE 

npx zkesdk prove ACTIVITY_CLASS 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 '{}'

### Use Cases

✅ Reputation tiers (tier-based rewards)  
✅ Fair distribution (prevent whales from dominating)  
✅ Anti-sybil heuristics (filter inactive accounts)  
✅ Matchmaking (pair users of similar activity)  

### When NOT to Use

❌ Detailed scoring systems  
❌ Fine-grained ranking  
❌ Identity inference (not designed for it)  

---

## Composability

### Combining Rules

Rules are **fully independent**. Combine them at the application layer:

```typescript
// Proof 1: Wallet is old enough
const ageProof = await ZKEligibilitySDK.prove("WALLET_AGE", wallet, {
  thresholdBlock: 15_000_000
});

// Proof 2: Wallet is active enough
const activityProof = await ZKEligibilitySDK.prove("MIN_ACTIVITY", wallet, {
  minTx: 10
});

// Proof 3: Wallet held token long enough
const holdProof = await ZKEligibilitySDK.prove("TOKEN_HOLD", wallet, {
  tokenAddress: "0x...",
  minHoldBlocks: 100_000
});

// Application logic: all three must be true
if (ageProof.isValid && activityProof.isValid && holdProof.isValid) {
  grantAccess();
}
```

### Important Notes

⚠️ ZK guarantees apply **per rule**, not across rules  
⚠️ Misuse of rules may produce misleading results  
⚠️ Always combine at application layer (not ZK layer)  

---

## Rule Semantics & Limitations

### What All Rules Assume

✅ RPC provider returns correct data  
✅ Chain state is finalized  
✅ No catastrophic reorgs  

### What All Rules Ignore

❌ Smart contract interactions (DEX swaps, etc.)  
❌ Unsupported chains (e.g., Bitcoin and non-supported EVM networks)  
❌ Contract-to-contract calls  
❌ Intent or motivation  

### When Rules Disagree With Reality

If a rule proof doesn't match your expectations, check:

1. **RPC provider data** — Is it returning correct values?
2. **Rule semantics** — Are you using the right rule?
3. **Parameter boundaries** — Are thresholds sensible?
4. **Edge case handling** — See rule-specific edge cases above

---

## Verification & Proof Format

All proofs use **standard Groth16 format**:

```json
{
  "pi_a": [x, y, 1],
  "pi_b": [[x1, x2], [y1, y2], [1, 0]],
  "pi_c": [x, y, 1],
  "protocol": "groth16",
  "curve": "bn128"
}
```

Public signals are simple arrays:

```json
["0"]  // isValid = 0 (not eligible)
["1"]  // isValid = 1 (eligible)
["2"]  // classId = 2 (medium activity)
```

---

## Version Guarantees

### v1.x Locked

🔒 These will **never change** in v1.x:
- Rule definitions
- Constraint systems
- Proof format
- Public signal layout

### Breaking Changes → v2.0

Any change to rules or constraints triggers a major version bump.

---

## Final Design Principle

> **Each rule proves exactly one statement and nothing more.**

**Rules are:**
- ✅ Independent (don't depend on other rules)
- ✅ Minimal (reveal only what's necessary)
- ✅ Composable (combine at app layer)
- ✅ Conservative (fail safely, never default-true)

**For security assumptions, see [SECURITY.md](./SECURITY.md).  
For SDK usage, see [README.md](./README.md).**

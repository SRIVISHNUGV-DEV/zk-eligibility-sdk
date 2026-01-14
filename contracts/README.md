# ZK Eligibility — Smart Contracts

This directory contains the **on-chain verification layer** for the ZK Eligibility SDK.

The contracts allow protocols to verify zero-knowledge eligibility proofs
generated off-chain, without accessing raw wallet data.

---

## Architecture Overview

The on-chain system consists of:

- **Groth16 Verifier Contracts**  
  Auto-generated verifier contracts for each eligibility rule.

- **EligibilityGate.sol**  
  A lightweight orchestration contract that:
  - routes proofs to the correct verifier
  - enforces rule selection
  - emits verification results

All heavy computation is performed **off-chain**.
On-chain contracts only perform cryptographic verification.

---

## Contracts

### `EligibilityGate.sol`

Responsibilities:
- Accept a rule ID and ZK proof
- Dispatch verification to the correct verifier
- Return a boolean verification result
- Emit verification events

It does **not**:
- fetch blockchain data
- store user history
- compute eligibility logic

---

### `Verifier*.sol`

Each rule has its own Groth16 verifier contract.

Properties:
- Deterministic
- Stateless
- Generated from circuit-specific verification keys
- Safe to reuse across applications

---

## Verification Flow

1. User generates a proof off-chain using the SDK
2. Proof + public signals are submitted on-chain
3. `EligibilityGate` calls the corresponding verifier
4. Verifier validates the proof
5. Result is returned and emitted as an event

---

## L2 Deployment (Recommended)

Groth16 verification is gas-expensive on L1.

Recommended networks:
- Optimism
- Arbitrum
- Base
- Scroll
- zkSync Era

Typical verification cost:
- **L1 Ethereum:** ~400k–600k gas
- **L2:** ~10–50x cheaper

---

## Security Model

- Contracts assume:
  - Correct circuit compilation
  - Correct trusted setup
  - Correct verification keys

- Contracts guarantee:
  - Soundness of verification
  - No access to private wallet data
  - Deterministic results

---

## Integration Example

```solidity
bool eligible = eligibilityGate.verifyEligibility(
    RULE_WALLET_AGE,
    proof,
    publicSignals
);
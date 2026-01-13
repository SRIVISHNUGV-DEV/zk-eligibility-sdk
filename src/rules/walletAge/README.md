# WALLET_AGE

## Description

Proves that a wallet’s **first outbound transaction** occurred before a given block.

---

## What is Proven

- The wallet is older than a specified threshold
- The wallet existed and was active before a given time

---

## What is NOT Revealed

- Exact transaction hash
- Counterparties
- Transaction count
- Wallet balance

---

## Inputs

| Name | Type | Description |
|----|----|----|
| first_tx_block | number | Block of first outbound tx |
| threshold_block | number | Required minimum age |

---

## Output

| Signal | Meaning |
|-----|--------|
| isValid | `1` if wallet age ≥ threshold |

---

## Edge Cases

- Wallets with no outbound transactions fail
- Threshold must fit circuit bit-width

---

## Use Cases

- Airdrops
- DAO governance
- Anti-sybil checks

---

## Notes

Outbound transactions are used to prevent passive wallets.
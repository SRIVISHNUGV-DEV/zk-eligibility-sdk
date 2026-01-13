# MIN_ACTIVITY

## Description

Proves that a wallet has executed at least N outbound transactions.

---

## What is Proven

- The wallet has a minimum level of activity
- The wallet is not dormant or freshly created

---

## What is NOT Revealed

- Exact transaction count
- Transaction timestamps
- Counterparties
- Transaction values

---

## Inputs

| Name | Type | Description |
|----|----|----|
| tx_count | number | Total outbound tx count |
| min_tx | number | Required minimum |

---

## Output

| Signal | Meaning |
|-----|--------|
| isValid | `1` if tx_count ≥ min_tx |

---

## Edge Cases

- Upper bounds enforced to prevent overflow
- Wallets with zero tx fail

---

## Use Cases

- Sybil resistance
- Eligibility gating
- Reputation systems

---

## Notes

Designed for human-scale activity ranges.
# ACTIVITY_CLASS

## Description

Classifies a wallet into an activity band using transaction count.

---

## What is Proven

- Wallet belongs to exactly one activity class
- Classification is mutually exclusive

---

## What is NOT Revealed

- Exact transaction count
- Transaction history
- Time distribution

---

## Inputs

| Name | Type | Description |
|----|----|----|
| tx_count | number | Outbound tx count |

---

## Output

| Signal | Meaning |
|-----|--------|
| is_class0 | Very low activity |
| is_class1 | Low activity |
| is_class2 | Medium activity |
| is_class3 | High activity |

---

## Edge Cases

- Exactly one class is always true
- Bit-width enforced

---

## Use Cases

- Tiered access
- Reputation scoring
- Anti-whale / anti-bot systems

---

## Notes

Classes are configurable off-chain.
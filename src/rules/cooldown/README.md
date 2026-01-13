# COOLDOWN

## Description

Proves that a wallet has been inactive for a minimum number of blocks.

---

## What is Proven

- No outbound activity occurred during the cooldown window

---

## What is NOT Revealed

- Exact last transaction block
- Wallet activity history
- Transaction count

---

## Inputs

| Name | Type | Description |
|----|----|----|
| last_tx_block | number | Last outbound tx |
| current_block | number | Current block |
| cooldown_blocks | number | Required inactivity |

---

## Output

| Signal | Meaning |
|-----|--------|
| isValid | `1` if cooldown satisfied |

---

## Edge Cases

- Wallets with no activity fail
- Cooldown must be non-negative

---

## Use Cases

- Anti-bot gating
- Spam prevention
- Fair participation rules

---

## Notes

Uses block distance, not timestamps.
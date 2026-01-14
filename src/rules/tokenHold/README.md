# TOKEN_HOLD

## Description

Proves that a wallet has held a token for a minimum duration.

---

## What is Proven

- Token was received before a threshold
- Wallet has held the token long enough

---

## What is NOT Revealed

- Token balance
- Transfer history
- Transaction hashes

---

## Inputs

| Name | Type | Description |
|----|----|----|
| first_token_tx_block | number | First receipt |
| min_hold_blocks | number | Required duration |
| current_block | number | Current block |

---

## Output

| Signal | Meaning |
|-----|--------|
| isValid | `1` if hold duration satisfied |

---

## Edge Cases

- Wallets that never received token fail
- Burned/sold tokens are not checked

---

## Use Cases

- Loyalty rewards
- Token-gated access
- Long-term holder incentives

---

## Notes

This proves *duration*, not current balance.
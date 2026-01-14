pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template TokenHold() {

    signal input first_token_tx_block;

    signal input min_hold_blocks;

    signal input current_block;

    signal output isValid;

    signal min-valid_block;

    min_valid_block <== first_token_tx_block + min_hold_blocks;

    component leq = LessEqThan(32);

    leq.in[0] <== min_valid_block;

    leq.in[1] <== current_block;

    isValid <== leq.out;

    isValid * (isValid - 1) === 0;

}

component main = TokenHold();

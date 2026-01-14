pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template CoolDown(){

    signal input current_block;

    signal input last_tx_block;

    signal input cooldown_blocks;

    signal output isValid;

    signal cooldown_end_block;

    cooldown_end_block <== cooldown_blocks + last_tx_block;

    component leq = LessEqThan(32);

    leq.in[0] <== cooldown_end_block;

    leq.in[1] <== current_block;

    isValid <== leq.out;

    isValid * (isValid - 1) === 0;

}

component main = CoolDown();

}
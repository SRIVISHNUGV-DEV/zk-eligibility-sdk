pragma circom 2.0.0;

include "circuits/circomlib/circuits/comparators.circom";

template MinActivity() {

    signal input tx_count;

    signal input min_tx;

    signal output isValid;

    component geq = GreaterEqThan(64);

    geq.in[0] <== tx_count;

    geq.in[1] <== min_tx;

    isValid <== geq.out;

    isValid * (isValid - 1) === 0;

}


component main = MinActivity();






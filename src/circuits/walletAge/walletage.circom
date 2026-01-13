pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template WalletAge() {

    // Block number of the wallet's first outbound transaction
    signal input first_tx_block;

    // Minimum required block number (wallet must be older than this)
    signal input threshold_block;

    // 1 if wallet is old enough, 0 otherwise
    signal output isValid;

    // Ethereum block numbers safely fit in 32 bits
    component leq = LessEqThan(32);

    leq.in[0] <== first_tx_block;
    leq.in[1] <== threshold_block;

    isValid <== leq.out;

    // Enforce boolean output
    isValid * (isValid - 1) === 0;
}

component main = WalletAge();

pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template ActivityClass() {

    signal input tx_count;

    signal output is_class0;
    signal output is_class1;
    signal output is_class2;
    signal output is_class3;

    // tx_count < 5
    component lt5 = LessThan(16);
    lt5.in[0] <== tx_count;
    lt5.in[1] <== 5;
    is_class0 <== lt5.out;

    // 5 <= tx_count < 50
    component ge5 = GreaterEqThan(16);
    ge5.in[0] <== tx_count;
    ge5.in[1] <== 5;

    component lt50 = LessThan(16);
    lt50.in[0] <== tx_count;
    lt50.in[1] <== 50;

    is_class1 <== ge5.out * lt50.out;

    // 50 <= tx_count < 500
    component ge50 = GreaterEqThan(16);
    ge50.in[0] <== tx_count;
    ge50.in[1] <== 50;

    component lt500 = LessThan(16);
    lt500.in[0] <== tx_count;
    lt500.in[1] <== 500;

    is_class2 <== ge50.out * lt500.out;

    // tx_count >= 500
    component ge500 = GreaterEqThan(16);
    ge500.in[0] <== tx_count;
    ge500.in[1] <== 500;

    is_class3 <== ge500.out;

    // Boolean enforcement
    is_class0 * (is_class0 - 1) === 0;
    is_class1 * (is_class1 - 1) === 0;
    is_class2 * (is_class2 - 1) === 0;
    is_class3 * (is_class3 - 1) === 0;

    // Exactly one class
    is_class0 + is_class1 + is_class2 + is_class3 === 1;
}

component main = ActivityClass();

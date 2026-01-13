// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

/**
 * @title IZKverifier
 * @notice Standard interface for Groth16
 verifier contracts
 */

interface IZKverifier {
    function verifyProof(
        uint256 [2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata publicSignals
    ) external view returns (bool);
}
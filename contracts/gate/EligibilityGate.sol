// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

/**
 * @title IZKVerifier
 * @notice Standard interface implemented by all Groth16 verifier contracts
 */
interface IZKVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata publicSignals
    ) external view returns (bool);
}

/**
 * @title EligibilityGate
 * @notice Routes ZK proofs to rule-specific verifiers
 * @dev This contract contains NO business logic.
 *      It is a pure verification router.
 */
contract EligibilityGate {
    /// -----------------------------------------------------------------------
    /// Errors
    /// -----------------------------------------------------------------------

    error VerifierNotSet(bytes32 ruleId);
    error ZeroAddress();
    error ProofExpired();
    error ExpiryTooFar();
    error NonceAlreadyUsed();
    error ProofAlreadyUsed();

    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------

    event VerifierSet(bytes32 indexed ruleId, address verifier);
    event ProofVerified(
        bytes32 indexed ruleId,
        address indexed verifier,
        address indexed sender,
        uint256 nonce,
        bool isValid,
        uint256 blockNumber
    );

    /// -----------------------------------------------------------------------
    /// Storage
    /// -----------------------------------------------------------------------

    address public owner;

    // ruleId => verifier contract
    mapping(bytes32 => address) public verifiers;

    // ruleId => sender => last used nonce
    mapping(bytes32 => mapping(address => uint256)) public usedNonces;
    mapping(bytes32 => bool) public usedProofDigests;

    uint256 public constant MAX_PROOF_LIFETIME = 100; // blocks

    /// -----------------------------------------------------------------------
    /// Structs
    /// -----------------------------------------------------------------------

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    /// -----------------------------------------------------------------------
    /// Modifiers
    /// -----------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    /// -----------------------------------------------------------------------
    /// Constructor
    /// -----------------------------------------------------------------------

    constructor(address _owner) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;
    }

    /// -----------------------------------------------------------------------
    /// Admin
    /// -----------------------------------------------------------------------

    /**
     * @notice Set or update verifier contract for a rule
     * @param ruleId keccak256 hash of rule name
     * @param verifier Address of Groth16 verifier
     */
    function setVerifier(bytes32 ruleId, address verifier) external onlyOwner {
        if (verifier == address(0)) revert ZeroAddress();

        verifiers[ruleId] = verifier;
        emit VerifierSet(ruleId, verifier);
    }

    /// -----------------------------------------------------------------------
    /// Verification
    /// -----------------------------------------------------------------------

    /**
     * @notice Verify an eligibility proof
     * @param ruleId keccak256 hash identifying the rule
     * @param proof Groth16 proof (a, b, c)
     * @param publicSignals Public signals emitted by the circuit
     * @return isValid True if proof is valid
     */
    function verifyEligibility(
        bytes32 ruleId,
        Proof calldata proof,
        uint256[] calldata publicSignals,
        uint256 nonce,
        uint256 expiryBlock
    ) external returns (bool isValid) {
        // Check expiry
        if (block.number > expiryBlock) revert ProofExpired();
        if (expiryBlock > block.number + MAX_PROOF_LIFETIME) revert ExpiryTooFar();

        address verifier = verifiers[ruleId];
        if (verifier == address(0)) revert VerifierNotSet(ruleId);

        bool ok = IZKVerifier(verifier).verifyProof(
            proof.a,
            proof.b,
            proof.c,
            publicSignals
        );

        // Replay protections are enforced for valid proofs only.
        if (ok) {
            bytes32 digest = keccak256(
                abi.encode(ruleId, proof.a, proof.b, proof.c, publicSignals)
            );
            if (usedProofDigests[digest]) revert ProofAlreadyUsed();
            if (usedNonces[ruleId][msg.sender] >= nonce) revert NonceAlreadyUsed();

            usedProofDigests[digest] = true;
            usedNonces[ruleId][msg.sender] = nonce;
        }

        emit ProofVerified(ruleId, verifier, msg.sender, nonce, ok, block.number);

        return ok;
    }
}

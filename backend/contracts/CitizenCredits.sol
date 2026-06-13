// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CitizenCredits — Track-My-Tax Escrow Smart Contract
 * Deployed to Ganache (http://127.0.0.1:7545)
 *
 * Functions:
 *   mintCredits(address, uint256)     → Admin mints credits
 *   allocateCredits(string, uint256)  → Allocate credits to a project
 *   lockEscrow(string)                → Lock project funds pending verification
 *   releaseEscrow(string)             → Release funds after verified milestone
 *   freezeEscrow(string)              → Freeze funds on suspicious activity
 *   getProject(string)                → Read project escrow state
 */
contract CitizenCredits {

    address public owner;

    struct ProjectEscrow {
        uint256 balance;
        uint256 lockedAmount;
        EscrowStatus status;
    }

    enum EscrowStatus { ACTIVE, LOCKED, RELEASED, FROZEN }

    mapping(address => uint256) public credits;
    mapping(string  => ProjectEscrow) public projects;

    event CreditsMinted    (address indexed to, uint256 amount);
    event CreditsAllocated (string indexed projectId, uint256 amount, address indexed from);
    event EscrowLocked     (string indexed projectId, uint256 amount);
    event EscrowReleased   (string indexed projectId, uint256 amount);
    event EscrowFrozen     (string indexed projectId, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function mintCredits(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        credits[to] += amount;
        emit CreditsMinted(to, amount);
    }

    function allocateCredits(string calldata projectId, uint256 amount) external {
        require(credits[msg.sender] >= amount, "Insufficient credits");
        credits[msg.sender] -= amount;
        projects[projectId].balance += amount;
        emit CreditsAllocated(projectId, amount, msg.sender);
    }

    function lockEscrow(string calldata projectId) external onlyOwner {
        ProjectEscrow storage p = projects[projectId];
        require(p.status == EscrowStatus.ACTIVE, "Not active");
        p.lockedAmount = p.balance;
        p.status = EscrowStatus.LOCKED;
        emit EscrowLocked(projectId, p.lockedAmount);
    }

    function releaseEscrow(string calldata projectId) external onlyOwner {
        ProjectEscrow storage p = projects[projectId];
        require(p.status == EscrowStatus.LOCKED, "Not locked");
        uint256 amt = p.lockedAmount;
        p.balance -= amt;
        p.lockedAmount = 0;
        p.status = EscrowStatus.RELEASED;
        emit EscrowReleased(projectId, amt);
    }

    function freezeEscrow(string calldata projectId, string calldata reason) external onlyOwner {
        projects[projectId].status = EscrowStatus.FROZEN;
        emit EscrowFrozen(projectId, reason);
    }

    function getProject(string calldata projectId)
        external view
        returns (uint256 balance, uint256 lockedAmount, EscrowStatus status)
    {
        ProjectEscrow storage p = projects[projectId];
        return (p.balance, p.lockedAmount, p.status);
    }

    function getCredits(address addr) external view returns (uint256) {
        return credits[addr];
    }
}

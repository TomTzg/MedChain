# MedChain

A blockchain drug traceability demo.

## Project overview

This project demonstrates how a drug batch can be tracked on-chain from production to delivery:

- Manufacturer registers a batch.
- Distributor updates circulation status in order (`Produced -> Shipped -> Received`, represented by `1 -> 2 -> 3` ).
- Verifier checks authenticity by `drugId` or `batchNo`.
- If no on-chain record exists, the batch is treated as potential counterfeit.

## Tech stack

- Solidity (`contracts/MedChainTrace.sol`)
- Remix IDE (compile, deploy, function testing)
- MetaMask (wallet signing)
- Any EVM-compatible network (local chain or public testnet)

## Demo flow

- Compile and deploy the smart contract in Remix.
- Use MetaMask to sign transactions.
- Call contract functions directly in Remix for registration, status updates, and verification.

## Prerequisites

1. Prepare one test account in MetaMask.
2. Choose an EVM-compatible network for testing (local chain or public testnet).
3. In MetaMask, switch to that network.
4. Open Remix and load `contracts/MedChainTrace.sol`.
5. Compile `MedChainTrace.sol` (Compiler: 0.8.20).
6. Then Select MetaMask in `Deploy & run transactions`, connect MetaMask account to Remix and deploy
7. Confirm transaction in MetaMask and wait for comtract to deploy
8. After contract deployed successfully, the functions can be tested under `Deployed Contracts`

## Quick test example

1. Call `registerDrug("Aspirin", "BATCH-001", "2026-04-14", "2028-04-14", "Shanghai Plant A")`.
2. Call `getDrugIdByBatchNo("BATCH-001")` and get `drugId` (e.g. `1`).
3. Call `updateStatus(1, 2, "Beijing Warehouse", "Shipped to distributor")`.
4. Call `updateStatus(1, 3, "Hospital Storage", "Received by pharmacy")`.
5. Call `getDrugById(1)` and `getTraceRecords(1)` to show full authenticity trace.
6. Call `getDrugIdByBatchNo("FAKE-999")` to show unknown batch result (`0`).


## Function introduction

### `nextDrugId() -> uint256` (view)
- Returns the next available drug ID.
- Useful to check contract state growth after registration.

### `registerDrug(name, batchNo, productionDate, expiryDate, location) -> uint256` (transact)
- Registers a new drug batch on-chain.
- Creates the first trace record with status `Produced`.
- Reverts if `batchNo` already exists.

### `updateStatus(drugId, newStatus, location, note)` (transact)
- Appends a new trace record for an existing drug.
- Allowed status codes: `2` (`Shipped`) and `3` (`Received`).
- Enforces strict order (`Produced -> Shipped -> Received`).

### `getDrugIdByBatchNo(batchNo) -> uint256` (view)
- Returns the mapped `drugId` by batch number.
- Returns `0` when batch is not found.

### `getDrugById(drugId) -> Drug` (view)
- Returns base drug metadata (name, batch, dates, manufacturer, etc.).
- Reverts if the drug ID does not exist.

### `getTraceRecords(drugId) -> TraceRecord[]` (view)
- Returns full trace history for the given drug ID.
- Each record includes `status`, `timestamp`, `actor`, `location`, and `note`.
- Reverts if the drug ID does not exist.
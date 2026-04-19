# MedChain

This is the final project code repository for FTE4312.
- A blockchain drug traceability demo.

## Student Nunber

- 120010055
- 122090824

## Project overview

This project demonstrates how a drug batch can be tracked on-chain from production to delivery:

- Manufacturer registers a batch.
- Distributors update status in a valid sequence: first leg is `Produced -> Shipped -> Received` (enum `1 -> 2 -> 3`). After a **Received**, the batch may **ship again** to the next hub, so you can repeat `Received -> Shipped -> Received` for multiple transport legs.
- Verifier checks authenticity by `drugId` or `batchNo`.
- If no on-chain record exists, the batch is treated as potential counterfeit.

## Tech stack

- Solidity (`contracts/MedChainTrace.sol`)
- Remix IDE (compile, deploy, function testing)
- MetaMask (wallet signing)
- Optional: Ganache or another local EVM chain; or any public testnet
- UI: Vue3, Web3.js

## Demo flow

1. Compile and deploy `MedChainTrace` in Remix IDE (https://remix.ethereum.org, compiler version `0.8.20`). 
2. Connect MetaMask to your network and deploy via **MetaMask** (or **Remix VM**). The contract address will appear under **Deployed Contracts**.
3. Under **Deployed Contracts**, call `registerDrug` to create a new batch.
4. Call `updateStatus` to update the status of that batch (multiple times). The first leg is `Produced -> Shipped -> Received`. After a **Received**, you can ship again.
5. Call `getTraceRecords` to see all status updates for that batch.

## Prerequisites

1. In Remix, open `contracts/MedChainTrace.sol`.
2. Have at a funded test account in MetaMask on your chosen network.
3. Switch MetaMask to that network before deploying. For a local chain, use **Remix VM**.
4. Compile with Solidity **0.8.20**.
5. In **Deploy & run transactions**, select **MetaMask**, connect the account, then **Deploy**.
6. Approve the deployment transaction in MetaMask and wait until the contract appears under **Deployed Contracts**.

## Quick test example in **Remix**

1. Call `registerDrug("Aspirin", "BATCH-001", "2026-04-14", "2028-04-14", "Shanghai Plant A")` and note the returned `drugId` (starts at `1` on a fresh deploy).
2. Call `getDrugIdByBatchNo("BATCH-001")` — should return `1`.
3. Call `updateStatus(1, 2, "Beijing Warehouse", "Shipped to distributor")` — enum **Shipped** (`2`).
4. Call `updateStatus(1, 3, "Hospital Storage", "Received at hub")` — enum **Received** (`3`).
5. Optional second leg: `updateStatus(1, 2, "Guangzhou Depot", "Shipped to next hub")` then `updateStatus(1, 3, "Hospital Storage", "Received by pharmacy")`.
6. Call `getDrugById(1)` — returns a `Drug` struct.
7. Call `getTraceRecords(1)` — returns an array of `TraceRecord` structs.
8. Call `getDrugIdByBatchNo("FAKE-999")` — returns `0` when the batch is unknown.

## Demo screenshots

- Select test network/account: `testImages/Select_test.png`
- Deploy contract: `testImages/Deploy_contract.png`
- Register drug: `testImages/register.png`
- Update status: `testImages/update1.png`, `testImages/update2.png`, `testImages/update3.png`, `testImages/update4.png`
- Query trace records: `testImages/getTraceRecords.png`
- Fake Drug test: `testImages/fakeDrug.png`


## Data structures (on-chain)

**`Drug`:** `id`, `name`, `batchNo`, `productionDate`, `expiryDate`, `manufacturer`, `exists`

**`TraceRecord`:** `status` (`None` / `Produced` / `Shipped` / `Received`), `timestamp`, `actor`, `location`, `note`

## Function reference

### `nextDrugId()` → `uint256` (view)

Auto-generated getter for the public state variable. Returns the next ID that will be assigned to a newly registered drug (after the first registration it is typically `lastId + 1`).

### `registerDrug(name, batchNo, productionDate, expiryDate, location)` → `uint256` (transact)

Registers a new drug batch. Creates the first trace record with status **Produced**. Reverts if `batchNo` already exists. Returns the new `drugId`.

### `updateStatus(drugId, newStatus, location, note)` (transact)

Appends a trace record. Only **Shipped** (`2`) and **Received** (`3`) are allowed. Valid transitions from the **latest** record: **Produced → Shipped**, **Shipped → Received**, **Received → Shipped** (next leg). This supports multiple hops; invalid examples: two **Shipped** in a row, two **Received** in a row, or **Received** immediately after **Produced**.

### `getDrugIdByBatchNo(batchNo)` → `uint256` (view)

Returns the `drugId` for the given batch number, or **`0`** if no batch is registered (not a revert).

### `getDrugById(drugId)` → `Drug` (view)

Returns drug metadata. Reverts with `"Drug not found"` if the ID does not exist.

### `getTraceRecords(drugId)` → `TraceRecord[]` (view)

Returns the full trace history for that drug. Reverts if the drug ID does not exist.

## Web UI

The project includes a simple frontend at `web/`.

1. Deploy `MedChainTrace` in Remix and copy the deployed contract address.
2. Run frontend:
   - `cd web`
   - `npm install`
   - `npm run dev`
3. Open the local URL from Vite, click **Connect MetaMask**, and paste contract address.
4. Use the page sections to call:
   - `registerDrug`
   - `updateStatus`
   - `getDrugIdByBatchNo`
   - `getDrugById`
   - `getTraceRecords`

- UI overview: `testImages/UI.png`
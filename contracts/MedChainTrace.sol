// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedChainTrace {
    enum Status {
        None,
        Produced,
        Shipped,
        Received
    }

    struct Drug {
        uint256 id;
        string name;
        string batchNo;
        string productionDate;
        string expiryDate;
        address manufacturer;
        bool exists;
    }

    struct TraceRecord {
        Status status;
        uint256 timestamp;
        address actor;
        string location;
        string note;
    }

    uint256 public nextDrugId = 1;

    mapping(uint256 => Drug) private drugsById;
    mapping(bytes32 => uint256) private idByBatchHash;
    mapping(uint256 => TraceRecord[]) private recordsByDrugId;

    event DrugRegistered(uint256 indexed drugId, string batchNo, address indexed manufacturer);
    event StatusUpdated(uint256 indexed drugId, Status status, address indexed actor, string location);

    function registerDrug(
        string calldata name,
        string calldata batchNo,
        string calldata productionDate,
        string calldata expiryDate,
        string calldata location
    ) external returns (uint256) {
        bytes32 batchHash = keccak256(abi.encodePacked(batchNo));
        require(idByBatchHash[batchHash] == 0, "Batch already exists");

        uint256 drugId = nextDrugId;
        nextDrugId += 1;

        drugsById[drugId] = Drug({
            id: drugId,
            name: name,
            batchNo: batchNo,
            productionDate: productionDate,
            expiryDate: expiryDate,
            manufacturer: msg.sender,
            exists: true
        });

        idByBatchHash[batchHash] = drugId;
        recordsByDrugId[drugId].push(
            TraceRecord({
                status: Status.Produced,
                timestamp: block.timestamp,
                actor: msg.sender,
                location: location,
                note: "Manufactured"
            })
        );

        emit DrugRegistered(drugId, batchNo, msg.sender);
        emit StatusUpdated(drugId, Status.Produced, msg.sender, location);
        return drugId;
    }

    function updateStatus(
        uint256 drugId,
        Status newStatus,
        string calldata location,
        string calldata note
    ) external {
        require(drugsById[drugId].exists, "Drug not found");
        require(newStatus == Status.Shipped || newStatus == Status.Received, "Invalid status");

        uint256 len = recordsByDrugId[drugId].length;
        Status current = recordsByDrugId[drugId][len - 1].status;

        // Multi-leg logistics: Produced -> Shipped -> Received -> Shipped -> Received -> ...
        if (newStatus == Status.Shipped) {
            require(current == Status.Produced || current == Status.Received, "Invalid status order");
        } else {
            require(current == Status.Shipped, "Invalid status order");
        }

        recordsByDrugId[drugId].push(
            TraceRecord({
                status: newStatus,
                timestamp: block.timestamp,
                actor: msg.sender,
                location: location,
                note: note
            })
        );

        emit StatusUpdated(drugId, newStatus, msg.sender, location);
    }

    function getDrugById(uint256 drugId) external view returns (Drug memory) {
        require(drugsById[drugId].exists, "Drug not found");
        return drugsById[drugId];
    }

    function getDrugIdByBatchNo(string calldata batchNo) external view returns (uint256) {
        return idByBatchHash[keccak256(abi.encodePacked(batchNo))];
    }

    function getTraceRecords(uint256 drugId) external view returns (TraceRecord[] memory) {
        require(drugsById[drugId].exists, "Drug not found");
        return recordsByDrugId[drugId];
    }
}

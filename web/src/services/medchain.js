import Web3 from 'web3'

const ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'batchNo', type: 'string' },
      { internalType: 'string', name: 'productionDate', type: 'string' },
      { internalType: 'string', name: 'expiryDate', type: 'string' },
      { internalType: 'string', name: 'location', type: 'string' },
    ],
    name: 'registerDrug',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'drugId', type: 'uint256' },
      { internalType: 'uint8', name: 'newStatus', type: 'uint8' },
      { internalType: 'string', name: 'location', type: 'string' },
      { internalType: 'string', name: 'note', type: 'string' },
    ],
    name: 'updateStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'batchNo', type: 'string' }],
    name: 'getDrugIdByBatchNo',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'drugId', type: 'uint256' }],
    name: 'getDrugById',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'batchNo', type: 'string' },
          { internalType: 'string', name: 'productionDate', type: 'string' },
          { internalType: 'string', name: 'expiryDate', type: 'string' },
          { internalType: 'address', name: 'manufacturer', type: 'address' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct MedChainTrace.Drug',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'drugId', type: 'uint256' }],
    name: 'getTraceRecords',
    outputs: [
      {
        components: [
          { internalType: 'enum MedChainTrace.Status', name: 'status', type: 'uint8' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'address', name: 'actor', type: 'address' },
          { internalType: 'string', name: 'location', type: 'string' },
          { internalType: 'string', name: 'note', type: 'string' },
        ],
        internalType: 'struct MedChainTrace.TraceRecord[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

function statusLabel(status) {
  const num = Number(status)
  if (num === 1) return 'Produced'
  if (num === 2) return 'Shipped'
  if (num === 3) return 'Received'
  return 'None'
}

export function createMedChainClient(provider) {
  const web3 = new Web3(provider)

  function contract(contractAddress) {
    return new web3.eth.Contract(ABI, contractAddress)
  }

  return {
    async registerDrug(contractAddress, from, name, batchNo, productionDate, expiryDate, location) {
      return contract(contractAddress).methods
        .registerDrug(name, batchNo, productionDate, expiryDate, location)
        .send({ from })
    },

    async updateStatus(contractAddress, from, drugId, status, location, note) {
      return contract(contractAddress).methods
        .updateStatus(drugId, status, location, note)
        .send({ from })
    },

    async getDrugIdByBatchNo(contractAddress, batchNo) {
      const id = await contract(contractAddress).methods.getDrugIdByBatchNo(batchNo).call()
      return id.toString()
    },

    async getDrugById(contractAddress, drugId) {
      const item = await contract(contractAddress).methods.getDrugById(drugId).call()
      return {
        id: item.id?.toString?.() ?? item[0]?.toString?.() ?? '',
        name: item.name ?? item[1] ?? '',
        batchNo: item.batchNo ?? item[2] ?? '',
        productionDate: item.productionDate ?? item[3] ?? '',
        expiryDate: item.expiryDate ?? item[4] ?? '',
        manufacturer: item.manufacturer ?? item[5] ?? '',
        exists: item.exists ?? item[6] ?? false,
      }
    },

    async getTraceRecords(contractAddress, drugId) {
      const list = await contract(contractAddress).methods.getTraceRecords(drugId).call()
      return list.map((row) => ({
        status: Number(row.status ?? row[0]),
        statusLabel: statusLabel(row.status ?? row[0]),
        timestamp: (row.timestamp ?? row[1])?.toString?.() ?? '',
        actor: row.actor ?? row[2] ?? '',
        location: row.location ?? row[3] ?? '',
        note: row.note ?? row[4] ?? '',
      }))
    },
  }
}

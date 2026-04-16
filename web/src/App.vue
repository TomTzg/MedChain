<script setup>
import { computed, reactive, ref } from 'vue'
import { createMedChainClient } from './services/medchain'

const wallet = reactive({
  account: '',
  chainId: '',
  connected: false,
})

const contractAddress = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const client = ref(null)

const registerForm = reactive({
  name: '',
  batchNo: '',
  productionDate: '',
  expiryDate: '',
  location: '',
})

const updateForm = reactive({
  drugId: '',
  status: '2',
  location: '',
  note: '',
})

const queryByBatchNo = ref('')
const queryByDrugId = ref('')
const queryTraceByDrugId = ref('')

const lastTxHash = ref('')
const batchQueryResult = ref('')
const drugResult = ref(null)
const traceRecords = ref([])

const isReady = computed(() => wallet.connected && !!contractAddress.value)

function resetNotice() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function connectWallet() {
  resetNotice()
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask first.')
    }
    loading.value = true
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
    wallet.account = accounts[0] || ''
    wallet.chainId = parseInt(chainIdHex, 16).toString()
    wallet.connected = !!wallet.account
    client.value = createMedChainClient(window.ethereum)
    successMessage.value = `Wallet connected: ${wallet.account}`
  } catch (error) {
    errorMessage.value = error.message || 'Failed to connect wallet.'
  } finally {
    loading.value = false
  }
}

async function registerDrug() {
  resetNotice()
  if (!isReady.value) return
  try {
    loading.value = true
    const tx = await client.value.registerDrug(
      contractAddress.value.trim(),
      wallet.account,
      registerForm.name,
      registerForm.batchNo,
      registerForm.productionDate,
      registerForm.expiryDate,
      registerForm.location,
    )
    lastTxHash.value = tx.transactionHash
    successMessage.value = 'Drug registered successfully.'
  } catch (error) {
    errorMessage.value = error.message || 'Failed to register drug.'
  } finally {
    loading.value = false
  }
}

async function updateStatus() {
  resetNotice()
  if (!isReady.value) return
  try {
    loading.value = true
    const tx = await client.value.updateStatus(
      contractAddress.value.trim(),
      wallet.account,
      updateForm.drugId,
      Number(updateForm.status),
      updateForm.location,
      updateForm.note,
    )
    lastTxHash.value = tx.transactionHash
    successMessage.value = 'Status updated successfully.'
  } catch (error) {
    errorMessage.value = error.message || 'Failed to update status.'
  } finally {
    loading.value = false
  }
}

async function lookupDrugIdByBatch() {
  resetNotice()
  if (!isReady.value) return
  try {
    loading.value = true
    const id = await client.value.getDrugIdByBatchNo(contractAddress.value.trim(), queryByBatchNo.value)
    batchQueryResult.value = id === '0' ? 'Not found (0)' : `Drug ID: ${id}`
    successMessage.value = 'Batch query completed.'
  } catch (error) {
    errorMessage.value = error.message || 'Failed to query batch.'
  } finally {
    loading.value = false
  }
}

async function lookupDrugById() {
  resetNotice()
  if (!isReady.value) return
  try {
    loading.value = true
    const drug = await client.value.getDrugById(contractAddress.value.trim(), queryByDrugId.value)
    drugResult.value = drug
    successMessage.value = 'Drug details loaded.'
  } catch (error) {
    errorMessage.value = error.message || 'Failed to query drug.'
  } finally {
    loading.value = false
  }
}

async function lookupTraceRecords() {
  resetNotice()
  if (!isReady.value) return
  try {
    loading.value = true
    traceRecords.value = await client.value.getTraceRecords(contractAddress.value.trim(), queryTraceByDrugId.value)
    successMessage.value = 'Trace records loaded.'
  } catch (error) {
    errorMessage.value = error.message || 'Failed to query trace records.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page">
    <h1>MedChain Demo UI</h1>

    <section class="card">
      <h2>1) Connect Wallet</h2>
      <button :disabled="loading" @click="connectWallet">Connect MetaMask</button>
      <p><strong>Account:</strong> {{ wallet.account || '-' }}</p>
      <p><strong>Chain ID:</strong> {{ wallet.chainId || '-' }}</p>
    </section>

    <section class="card">
      <h2>2) Contract Setup</h2>
      <label>Contract Address</label>
      <input v-model="contractAddress" placeholder="0x..." />
      <p class="hint">Deploy contract in Remix first, then paste address here.</p>
    </section>

    <section class="card">
      <h2>3) Register Drug</h2>
      <div class="grid">
        <input v-model="registerForm.name" placeholder="Name" />
        <input v-model="registerForm.batchNo" placeholder="Batch No" />
        <input v-model="registerForm.productionDate" placeholder="Production Date" />
        <input v-model="registerForm.expiryDate" placeholder="Expiry Date" />
        <input v-model="registerForm.location" placeholder="Manufactured Location" />
      </div>
      <button :disabled="loading || !isReady" @click="registerDrug">registerDrug</button>
    </section>

    <section class="card">
      <h2>4) Update Status</h2>
      <div class="grid">
        <input v-model="updateForm.drugId" placeholder="Drug ID" />
        <select v-model="updateForm.status">
          <option value="2">Shipped (2)</option>
          <option value="3">Received (3)</option>
        </select>
        <input v-model="updateForm.location" placeholder="Location" />
        <input v-model="updateForm.note" placeholder="Note" />
      </div>
      <button :disabled="loading || !isReady" @click="updateStatus">updateStatus</button>
    </section>

    <section class="card">
      <h2>5) Query by Batch No</h2>
      <input v-model="queryByBatchNo" placeholder="BATCH-001" />
      <button :disabled="loading || !isReady" @click="lookupDrugIdByBatch">getDrugIdByBatchNo</button>
      <p><strong>Result:</strong> {{ batchQueryResult || '-' }}</p>
    </section>

    <section class="card">
      <h2>6) Query Drug By ID</h2>
      <input v-model="queryByDrugId" placeholder="1" />
      <button :disabled="loading || !isReady" @click="lookupDrugById">getDrugById</button>
      <pre v-if="drugResult">{{ JSON.stringify(drugResult, null, 2) }}</pre>
    </section>

    <section class="card">
      <h2>7) Query Trace Records</h2>
      <input v-model="queryTraceByDrugId" placeholder="1" />
      <button :disabled="loading || !isReady" @click="lookupTraceRecords">getTraceRecords</button>
      <pre v-if="traceRecords.length">{{ JSON.stringify(traceRecords, null, 2) }}</pre>
    </section>

    <section class="card" v-if="lastTxHash || successMessage || errorMessage">
      <h2>Status</h2>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="lastTxHash"><strong>Tx Hash:</strong> {{ lastTxHash }}</p>
    </section>
  </main>
</template>

#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const crypto = require('crypto');
const { ethers } = require('ethers');

const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const DEFAULT_RPC_URL = 'https://ethereum-rpc.publicnode.com';
const DEFAULT_WEBHOOK_URL = 'http://localhost:3000/api/ranks/donations/webhook';
const DEFAULT_POLL_INTERVAL_MS = 15000;

function parseArgs() {
  const args = {
    id: process.env.DONATION_REQUEST_ID || null,
    transactionId: process.env.DONATION_TRANSACTION_ID || null,
  };
  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === '--id' && process.argv[index + 1]) {
      args.id = process.argv[index + 1];
      index += 1;
    }
    if (arg.startsWith('--id=')) {
      args.id = arg.slice('--id='.length);
    }
    if (arg === '--tx' && process.argv[index + 1]) {
      args.transactionId = process.argv[index + 1];
      index += 1;
    }
    if (arg.startsWith('--tx=')) {
      args.transactionId = arg.slice('--tx='.length);
    }
  }
  return args;
}

function toUnsignedHex(value) {
  return `0x${Number(value).toString(16)}`;
}

async function main() {
  const { id, transactionId } = parseArgs();
  const rpcUrl = process.env.DONATION_WATCH_RPC_URL || DEFAULT_RPC_URL;
  const webhookUrl = process.env.DONATION_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  const secret = process.env.DONATION_WEBHOOK_SECRET;
  const destinationAddress = process.env.DONATION_USDT_ETH_ADDRESS;
  const minimumConfirmations = Number(process.env.DONATION_MIN_CONFIRMATIONS || 1);

  if (!destinationAddress) {
    throw new Error('Set DONATION_USDT_ETH_ADDRESS in .env before starting the watcher.');
  }
  if (!secret) {
    throw new Error('Set DONATION_WEBHOOK_SECRET in .env before starting the watcher.');
  }
  if (!id) {
    throw new Error('Provide a donation request ID with --id or DONATION_REQUEST_ID before starting the watcher.');
  }
  if (!transactionId || !/^0x[a-fA-F0-9]{64}$/.test(transactionId)) {
    throw new Error('Provide the Ethereum transaction hash with --tx or DONATION_TRANSACTION_ID before starting the watcher.');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const receiverTopic = ethers.zeroPadValue(ethers.getAddress(destinationAddress), 32);
  const transferSignature = ethers.id('Transfer(address,address,uint256)');
  const processedTxs = new Set();
  let lastScannedBlock = 0;

  async function signPayload(body) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${timestamp}.${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return { timestamp, signature, payload };
  }

  async function postDonationWebhook(body) {
    const { timestamp, signature } = await signPayload(body);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-donation-timestamp': String(timestamp),
        'x-donation-signature': signature,
      },
      body: JSON.stringify(body),
    });

    const result = await response.text();
    if (!response.ok) {
      throw new Error(`Webhook rejected (${response.status}): ${result}`);
    }
    console.log(`Webhook accepted for ${body.transactionId}: ${result}`);
  }

  async function pollTransfers() {
    const toBlock = await provider.getBlockNumber();
    const transaction = await provider.getTransaction(transactionId);
    if (!transaction || transaction.blockNumber === null) {
      console.log(`Waiting for transaction ${transactionId} to be mined...`);
      return;
    }
    const logs = await provider.getLogs({
      blockHash: transaction.blockHash,
      address: USDT_CONTRACT_ADDRESS,
      topics: [transferSignature, null, receiverTopic],
    });

    for (const log of logs) {
      if (log.transactionHash.toLowerCase() !== transactionId.toLowerCase()
        || processedTxs.has(log.transactionHash)) {
        continue;
      }

      const receipt = await provider.getTransactionReceipt(log.transactionHash);
      if (!receipt) {
        continue;
      }

      const confirmations = toBlock - receipt.blockNumber + 1;
      if (confirmations < minimumConfirmations) {
        continue;
      }

      const parsed = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ]).parseLog(log);
      const rawAmount = parsed.args[2];
      const amountUsd = Number(ethers.formatUnits(rawAmount, 6));

      if (!Number.isFinite(amountUsd) || amountUsd < 1) {
        console.log(`Skipping transfer ${log.transactionHash}: amount under $1 USD.`);
        processedTxs.add(log.transactionHash);
        continue;
      }

      const payload = {
        id,
        currency: 'USDT',
        destinationAddress: destinationAddress,
        amountUsd: Number(amountUsd.toFixed(2)),
        transactionId: log.transactionHash,
        confirmations,
      };

      console.log(`Sending webhook for ${log.transactionHash} (${amountUsd} USDT referenced to donation ${id})`);
      await postDonationWebhook(payload);
      processedTxs.add(log.transactionHash);
    }

    lastScannedBlock = toBlock;
  }

  console.log(`Watching USDT transfers to ${destinationAddress} via ${rpcUrl}`);
  console.log(`Posting verified events to ${webhookUrl} for donation request ${id}`);
  console.log(`Watching transaction ${transactionId}`);
  console.log(`Required confirmations: ${minimumConfirmations}`);

  await pollTransfers();

  setInterval(async () => {
    try {
      await pollTransfers();
    } catch (error) {
      console.error('Wallet polling failed:', error.message || error);
    }
  }, DEFAULT_POLL_INTERVAL_MS);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

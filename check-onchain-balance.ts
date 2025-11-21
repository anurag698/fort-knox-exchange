import dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('Loading .env.local from:', envLocalPath);
dotenv.config({ path: envLocalPath, override: true });

const RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const HOT_WALLET_ADDRESS = process.env.HOT_WALLET_ADDRESS;

// WBTC token address on Polygon
const WBTC_ADDRESS = '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6';
const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
];

async function checkOnChainBalance() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log('\n=== Checking On-Chain Balances ===\n');

    if (SAFE_ADDRESS) {
        console.log(`Safe Address: ${SAFE_ADDRESS}`);

        // Check WBTC balance
        const wbtc = new ethers.Contract(WBTC_ADDRESS, ERC20_ABI, provider);
        const wbtcBalance = await wbtc.balanceOf(SAFE_ADDRESS);
        const wbtcDecimals = await wbtc.decimals();
        const wbtcFormatted = ethers.formatUnits(wbtcBalance, wbtcDecimals);
        console.log(`  WBTC Balance: ${wbtcFormatted} WBTC`);

        // Check USDT balance
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
        const usdtBalance = await usdt.balanceOf(SAFE_ADDRESS);
        const usdtDecimals = await usdt.decimals();
        const usdtFormatted = ethers.formatUnits(usdtBalance, usdtDecimals);
        console.log(`  USDT Balance: ${usdtFormatted} USDT`);

        // Check POL (native) balance
        const polBalance = await provider.getBalance(SAFE_ADDRESS);
        const polFormatted = ethers.formatEther(polBalance);
        console.log(`  POL Balance: ${polFormatted} POL`);
    }

    if (HOT_WALLET_ADDRESS) {
        console.log(`\nHot Wallet Address: ${HOT_WALLET_ADDRESS}`);

        // Check WBTC balance
        const wbtc = new ethers.Contract(WBTC_ADDRESS, ERC20_ABI, provider);
        const wbtcBalance = await wbtc.balanceOf(HOT_WALLET_ADDRESS);
        const wbtcDecimals = await wbtc.decimals();
        const wbtcFormatted = ethers.formatUnits(wbtcBalance, wbtcDecimals);
        console.log(`  WBTC Balance: ${wbtcFormatted} WBTC`);

        // Check USDT balance
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
        const usdtBalance = await usdt.balanceOf(HOT_WALLET_ADDRESS);
        const usdtDecimals = await usdt.decimals();
        const usdtFormatted = ethers.formatUnits(usdtBalance, usdtDecimals);
        console.log(`  USDT Balance: ${usdtFormatted} USDT`);

        // Check POL (native) balance
        const polBalance = await provider.getBalance(HOT_WALLET_ADDRESS);
        const polFormatted = ethers.formatEther(polBalance);
        console.log(`  POL Balance: ${polFormatted} POL`);
    }

    if (!SAFE_ADDRESS && !HOT_WALLET_ADDRESS) {
        console.log('❌ No SAFE_ADDRESS or HOT_WALLET_ADDRESS found in environment variables');
    }
}

checkOnChainBalance().catch(console.error);

#!/usr/bin/env node
/**
 * Smoke test: bot IPC handlers required by tf2autobot-gui-panel v3.6.2.
 * Run: node scripts/verify-panel-ipc.js
 */
const fs = require('fs');
const path = require('path');

const ipcPath = path.join(__dirname, '../src/classes/IPC.ts');
const source = fs.readFileSync(ipcPath, 'utf8');

function assert(condition, message) {
    if (!condition) {
        console.error('FAIL:', message);
        process.exit(1);
    }
}

const requiredHandlers = [
    'getInfo',
    'getPricelist',
    'getTrades',
    'getInventory',
    'getOptions',
    'addItem',
    'updateItem',
    'removeItem',
    'sendChat',
    'updateOptions',
    'deleteUntradableJunk'
];

for (const handler of requiredHandlers) {
    assert(source.includes(`'${handler}'`), `IPC.ts missing handler: ${handler}`);
}

assert(source.includes('ipcErrorMessage'), 'IPC.ts must emit string errors via ipcErrorMessage');
assert(source.includes("emit('inventory', {"), 'IPC.ts must emit inventory snapshot for panel Unlisted Stock');
assert(source.includes('tradable:'), 'IPC inventory payload must include tradable bucket');
assert(source.includes('nonTradable:'), 'IPC inventory payload must include nonTradable bucket');
assert(source.includes('updatedAt:'), 'IPC inventory payload must include updatedAt');

console.log('OK: panel IPC compatibility verified');

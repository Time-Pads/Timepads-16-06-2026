const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');
const chunk = fs.readFileSync('kp-app-chunk.js', 'utf8');

console.log('=== Merchant script URLs ===');
const mUrls = merchant.match(/https?:\/\/[^\s"'`<>]+/g) || [];
console.log(Array.from(new Set(mUrls)));

console.log('=== Chunk script URLs / dynamic imports ===');
const cImports = chunk.match(/import\(['"][^'"]+['"]\)/g) || [];
console.log(Array.from(new Set(cImports)));

const cUrls = chunk.match(/https?:\/\/[^\s"'`<>]+/g) || [];
console.log(Array.from(new Set(cUrls)).filter(u => u.includes('gokwik') || u.includes('kwikpass')));

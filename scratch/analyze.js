const fs = require('fs');
const core = fs.readFileSync('kp-core.js', 'utf8');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

console.log('=== Endpoints in merchant ===');
console.log(Array.from(new Set(merchant.match(/\/v\d\/[a-zA-Z0-9_\-\/]+/g) || [])));

console.log('=== LocalStorage in merchant ===');
console.log(Array.from(new Set(merchant.match(/localStorage\.[a-zA-Z]+\([^)]+\)/g) || [])));

console.log('=== SessionStorage in merchant ===');
console.log(Array.from(new Set(merchant.match(/sessionStorage\.[a-zA-Z]+\([^)]+\)/g) || [])));

console.log('=== Cookies in merchant ===');
console.log(Array.from(new Set(merchant.match(/(?:get|set)Cookie\([^)]+\)/g) || [])));

console.log('=== Window objects assigned ===');
console.log(Array.from(new Set(merchant.match(/window\.[a-zA-Z0-9_$]+\s*=/g) || [])));

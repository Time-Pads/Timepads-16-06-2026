const fs = require('fs');
const sso = fs.readFileSync('kp-sso.js', 'utf8');

console.log('=== Endpoints in kp-sso.js ===');
console.log(Array.from(new Set(sso.match(/\/v\d\/[a-zA-Z0-9_\-\/]+/g) || [])));

console.log('=== Storage keys in kp-sso.js ===');
console.log(Array.from(new Set(sso.match(/(?:localStorage|sessionStorage)\.[a-zA-Z]+\([^)]+\)/g) || [])));

console.log('=== Cookies in kp-sso.js ===');
console.log(Array.from(new Set(sso.match(/(?:get|set)Cookie\([^)]+\)/g) || [])));

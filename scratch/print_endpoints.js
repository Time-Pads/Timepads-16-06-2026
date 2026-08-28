const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

let idx = merchant.indexOf('tn={');
if (idx !== -1) {
  console.log(merchant.substring(idx, idx + 2000));
} else {
  let idx2 = merchant.indexOf('requestApi:');
  console.log(merchant.substring(idx2 - 100, idx2 + 1500));
}

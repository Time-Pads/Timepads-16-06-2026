const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

function inspectAround(name) {
  let idx = merchant.indexOf(name);
  console.log(`\n================= ${name} =================`);
  while (idx !== -1) {
    console.log(merchant.substring(Math.max(0, idx - 200), Math.min(merchant.length, idx + 400)));
    idx = merchant.indexOf(name, idx + name.length);
  }
}

inspectAround('function Ou');
inspectAround('function ku');
inspectAround('isCustomAccountPageEnabled');

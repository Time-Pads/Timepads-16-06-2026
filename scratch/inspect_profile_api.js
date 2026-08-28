const fs = require('fs');
const mount = fs.readFileSync('kp-mountApp.js', 'utf8');

let idx = 0;
while ((idx = mount.indexOf('/kp/api/v1/customer/profile', idx)) !== -1) {
  console.log(mount.substring(Math.max(0, idx - 200), Math.min(mount.length, idx + 500)));
  console.log('====================================');
  idx += 25;
}

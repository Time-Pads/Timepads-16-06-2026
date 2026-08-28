const fs = require('fs');
const mount = fs.readFileSync('kp-mountApp.js', 'utf8');

// Let's inspect the exact makeRequest / tt.get implementation in kp-mountApp.js
let idx = mount.indexOf('makeRequest');
while (idx !== -1) {
  console.log(mount.substring(Math.max(0, idx - 100), Math.min(mount.length, idx + 400)));
  console.log('====================================');
  idx = mount.indexOf('makeRequest', idx + 12);
}

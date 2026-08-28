const fs = require('fs');
const files = ['kp-core.js', 'kp-merchant.js', 'kp-sso.js', 'kp-app-chunk.js'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  ['kp-nav-row', 'kp-logout-btn', 'kp-tile-product', 'Total Orders', 'My Orders', 'Saved Addresses'].forEach(term => {
    let idx = 0;
    while ((idx = content.indexOf(term, idx)) !== -1) {
      console.log(`[${file}] Match for "${term}" at ${idx}:`);
      console.log(content.substring(Math.max(0, idx - 150), Math.min(content.length, idx + 300)));
      console.log('----------------------------------------------------');
      idx += term.length;
    }
  });
}

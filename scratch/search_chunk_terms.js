const fs = require('fs');
const chunk = fs.readFileSync('kp-app-chunk.js', 'utf8');

['Hey', 'Logged with', 'Total Orders', 'Overview', 'My Orders', 'Saved Addresses'].forEach(term => {
  let idx = 0;
  let count = 0;
  while ((idx = chunk.indexOf(term, idx)) !== -1 && count < 5) {
    console.log(`\nMatch for "${term}" at ${idx}:`);
    console.log(chunk.substring(Math.max(0, idx - 100), Math.min(chunk.length, idx + 300)));
    console.log('-------------------------');
    idx += term.length;
    count++;
  }
});

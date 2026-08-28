const fs = require('fs');
const chunk = fs.readFileSync('kp-app-chunk.js', 'utf8');

// Find all occurrences of "profile", "first_name", "firstName", "name", "customer", "/v1/", "/v3/", "getbyphone"
console.log('=== Search in kp-app-chunk.js ===');

function findSnippets(term) {
  let idx = 0;
  let count = 0;
  while ((idx = chunk.indexOf(term, idx)) !== -1 && count < 10) {
    console.log(`\nMatch for "${term}" at ${idx}:`);
    console.log(chunk.substring(Math.max(0, idx - 100), Math.min(chunk.length, idx + 300)));
    console.log('-------------------------');
    idx += term.length;
    count++;
  }
}

findSnippets('firstName');
findSnippets('/pages/kp-account');
findSnippets('customer/data');
findSnippets('/v1/customer');
findSnippets('address/getbyphone');

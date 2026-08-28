const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

function findSnippets(str, term) {
  let idx = 0;
  while ((idx = str.indexOf(term, idx)) !== -1) {
    console.log(`\nMatch for "${term}" at ${idx}:`);
    console.log(str.substring(Math.max(0, idx - 150), Math.min(str.length, idx + 350)));
    console.log('-------------------------');
    idx += term.length;
  }
}

findSnippets(merchant, 'account.json');
findSnippets(merchant, 'shopify-login-data');
findSnippets(merchant, 'shopify-session');
findSnippets(merchant, 'shopifyCustomerId');

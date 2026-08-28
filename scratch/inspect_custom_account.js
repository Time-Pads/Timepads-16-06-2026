const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

function findSnippets(term) {
  let idx = 0;
  while ((idx = merchant.indexOf(term, idx)) !== -1) {
    console.log(`\nMatch for "${term}" at ${idx}:`);
    console.log(merchant.substring(Math.max(0, idx - 100), Math.min(merchant.length, idx + 400)));
    console.log('-------------------------');
    idx += term.length;
  }
}

findSnippets('shopifyLoginDataForCustomAccount');
findSnippets('accountPageConfig');
findSnippets('customAccountPage');

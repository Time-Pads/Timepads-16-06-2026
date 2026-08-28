const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

function inspectTerms(terms) {
  for (const term of terms) {
    console.log(`\n================= SEARCH: ${term} =================`);
    let idx = 0;
    let count = 0;
    while ((idx = merchant.indexOf(term, idx)) !== -1 && count < 5) {
      console.log(`\n--- Match ${count + 1} at ${idx} ---`);
      console.log(merchant.substring(Math.max(0, idx - 100), Math.min(merchant.length, idx + 300)));
      idx += term.length;
      count++;
    }
  }
}

inspectTerms([
  'getCustomerIntelligenceData',
  'getWebPersonalizationData',
  '__kwikpass',
  '__KP_LOGIN_SDK_INSTANCE__',
  '/v1/customer/data',
  'Hey,'
]);

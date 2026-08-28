const fs = require('fs');
const chunk = fs.readFileSync('kp-app-chunk.js', 'utf8');

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

findSnippets('function Fl');
findSnippets('kp-merchant-v2');
findSnippets('customAccountPage');

const fs = require('fs');
const mount = fs.readFileSync('kp-mountApp.js', 'utf8');

function findSnippets(term) {
  let idx = 0;
  while ((idx = mount.indexOf(term, idx)) !== -1) {
    console.log(`\nMatch for "${term}" at ${idx}:`);
    console.log(mount.substring(Math.max(0, idx - 100), Math.min(mount.length, idx + 400)));
    console.log('-------------------------');
    idx += term.length;
  }
}

findSnippets('Hey');
findSnippets('Logged with');
findSnippets('first_name');
findSnippets('firstName');
findSnippets('customer');
findSnippets('/v1/');
findSnippets('/v3/');
findSnippets('https://');

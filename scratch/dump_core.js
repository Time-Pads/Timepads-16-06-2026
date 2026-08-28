const fs = require('fs');
const core = fs.readFileSync('kp-core.js', 'utf8');

// Find all function declarations / exports / globals in kp-core.js
const funcMatches = core.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/g) || [];
console.log('=== Functions in kp-core.js ===');
console.log(funcMatches.map(f => f.replace('function ', '').replace('(', '')));

// Let's print the entire kp-core.js with formatting or sections
console.log('\n=== Entire content of kp-core.js ===');
console.log(core);

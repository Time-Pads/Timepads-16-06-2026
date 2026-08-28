const fs = require('fs');
const mount = fs.readFileSync('kp-mountApp.js', 'utf8');

function findFunc(name) {
  let idx = 0;
  while ((idx = mount.indexOf(name, idx)) !== -1) {
    console.log(`\nMatch for "${name}" at ${idx}:`);
    console.log(mount.substring(Math.max(0, idx - 50), Math.min(mount.length, idx + 250)));
    console.log('-------------------------');
    idx += name.length;
  }
}

findFunc('yd=');
findFunc('Cs=');
findFunc('wd=');
findFunc('fn=');
findFunc('ln=');

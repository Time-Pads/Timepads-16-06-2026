const fs = require('fs');
const mount = fs.readFileSync('kp-mountApp.js', 'utf8');

function findVar(name) {
  let idx = 0;
  while ((idx = mount.indexOf(name, idx)) !== -1) {
    console.log(`\nMatch for "${name}" at ${idx}:`);
    console.log(mount.substring(Math.max(0, idx - 100), Math.min(mount.length, idx + 300)));
    console.log('-------------------------');
    idx += name.length;
  }
}

findVar('md=');
findVar('Ss=');
findVar('bd=');
findVar('fr=');
findVar('function $f');

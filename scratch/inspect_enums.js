const fs = require('fs');
const merchant = fs.readFileSync('kp-merchant.js', 'utf8');

function findEnum(name) {
  let idx = merchant.indexOf(name + '={');
  if (idx !== -1) {
    console.log(`\nEnum ${name}:`);
    console.log(merchant.substring(idx, idx + 800));
  }
}

findEnum('Ne');
findEnum('ie');
findEnum('oe');
findEnum('re');
findEnum('se');
findEnum('de');
findEnum('_e');
findEnum('pe');
findEnum('me');

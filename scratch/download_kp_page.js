const fs = require('fs');

async function main() {
  const res = await fetch('https://timepads.in/pages/kp-account');
  const html = await res.text();
  fs.writeFileSync('kp-account-page.html', html);
  console.log('Saved kp-account-page.html, size: ' + html.length);
  
  const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log(`Found ${scriptTags.length} script tags`);
  scriptTags.forEach(s => {
    if (s.includes('kp') || s.includes('kwik') || s.includes('gokwik') || s.includes('account') || s.includes('customer')) {
      console.log('\n--- Script match ---');
      console.log(s.substring(0, 300));
    }
  });
}

main();

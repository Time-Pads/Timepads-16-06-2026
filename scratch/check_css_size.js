const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:9392', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const result = await page.evaluate(async () => {
    const link = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]'))
      .find(l => l.href && l.href.includes('custom.'));
    if (!link) return { error: 'No custom. css link found' };
    
    try {
      const res = await fetch(link.href);
      const text = await res.text();
      return {
        url: link.href,
        sizeBytes: text.length
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Served custom CSS details:', result);
  await browser.close();
})();

const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to live site...');
  await page.goto('https://timepads.in', { waitUntil: 'load' });
  
  // Find any text containing trackingmore or class names
  const results = await page.evaluate(() => {
    // 1. Inspect the header link elements
    const trackingLinks = Array.from(document.querySelectorAll('a[href*="trackingmore"]'));
    const linkDetails = trackingLinks.map(a => ({
      html: a.outerHTML,
      text: a.innerText,
      parent: a.parentElement.outerHTML
    }));

    // 2. Search for any text nodes containing visible CSS syntax (e.g. "display: none" or ".st0") in the body/header
    const allText = document.body.innerText;
    const cssLooks = [];
    if (allText.includes('{') && allText.includes('}')) {
      // Find where CSS is rendering as text
      cssLooks.push('Found CSS brackets in body text!');
    }
    
    // Check header specifically
    const header = document.querySelector('header');
    const headerText = header ? header.innerText : '';
    
    return {
      linkDetails,
      headerText,
      cssVisible: cssLooks,
      bodyTextLength: allText.length,
      snippetHtml: document.querySelector('.tacking-id') ? document.querySelector('.tacking-id').outerHTML : null
    };
  });

  console.log('Audit Results:', JSON.stringify(results, null, 2));
  await browser.close();
})();

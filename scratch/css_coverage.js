const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('Launching Headful Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Enable CSS coverage
  console.log('Starting CSS Coverage...');
  await page.coverage.startCSSCoverage();

  const baseUrl = 'https://timepads.in';

  // 1. Visit Homepage
  console.log('Visiting Homepage...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));

  console.log('Current URL:', page.url());
  console.log('Current Title:', await page.title());

  // Extract collection and product links
  const links = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a')).map(a => a.href);
    const collections = allLinks.filter(href => href.includes('/collections/') && !href.includes('/all') && !href.includes('?'));
    const products = allLinks.filter(href => href.includes('/products/') && !href.includes('?'));
    return {
      collection: collections[0] || null,
      product: products[0] || null
    };
  });

  console.log('Found Links:', links);

  // 2. Visit Collection Page
  if (links.collection) {
    console.log(`Visiting Collection Page: ${links.collection}`);
    await page.goto(links.collection, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
  }

  // 3. Visit Product Page
  if (links.product) {
    console.log(`Visiting Product Page: ${links.product}`);
    await page.goto(links.product, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    // Try opening cart drawer on product page by clicking add-to-cart button
    console.log('Attempting to trigger Cart Drawer (clicking Add to Cart)...');
    try {
      const atcSelector = '[name="add"], .add-to-cart, #AddToCart, .add-to-cart-button-for-product-card, button[type="submit"]';
      await page.waitForSelector(atcSelector, { timeout: 3000 });
      await page.click(atcSelector);
      await new Promise(r => setTimeout(r, 3000)); // Wait for cart drawer open animation
    } catch (e) {
      console.log('Could not click Add to Cart or open drawer:', e.message);
    }
  }

  // Stop CSS coverage
  console.log('Stopping CSS Coverage and analyzing data...');
  const coverage = await page.coverage.stopCSSCoverage();

  let report = '# CSS Coverage Audit Report\n\n';
  report += `Timestamp: ${new Date().toISOString()}\n\n`;

  const filesToAudit = ['theme.aio.min.css', 'custom.aio.min.css'];

  for (const entry of coverage) {
    const filename = path.basename(entry.url.split('?')[0]);
    if (filesToAudit.includes(filename)) {
      const totalBytes = entry.text.length;
      let usedBytes = 0;

      for (const range of entry.ranges) {
        usedBytes += range.end - range.start;
      }

      const unusedBytes = totalBytes - usedBytes;
      const unusedPercentage = ((unusedBytes / totalBytes) * 100).toFixed(2);
      const reducibleKB = (unusedBytes / 1024).toFixed(2);
      const totalKB = (totalBytes / 1024).toFixed(2);

      console.log(`\n--- ${filename} ---`);
      console.log(`Total Size: ${totalKB} KB`);
      console.log(`Unused Size: ${reducibleKB} KB (${unusedPercentage}%)`);

      report += `## ${filename}\n`;
      report += `- **Total Size**: ${totalKB} KB\n`;
      report += `- **Unused Size (Reducible)**: ${reducibleKB} KB\n`;
      report += `- **Unused Percentage**: ${unusedPercentage}%\n\n`;

      // Extract some unused selector snippets/examples
      report += `### Sample Unused Selectors / Rules (First few found):\n\`\`\`css\n`;
      
      let lastIndex = 0;
      let sampleCount = 0;
      
      // Sort ranges by start index
      const ranges = entry.ranges.sort((a, b) => a.start - b.start);
      
      for (const range of ranges) {
        if (range.start > lastIndex) {
          const unusedChunk = entry.text.substring(lastIndex, range.start).trim();
          if (unusedChunk.length > 5 && sampleCount < 15) {
            const cleaned = unusedChunk
              .replace(/\s+/g, ' ')
              .substring(0, 150); // limit output length
            
            if (cleaned.includes('{') || cleaned.includes(',') || cleaned.startsWith('.') || cleaned.startsWith('#') || cleaned.startsWith('@media')) {
              report += `${cleaned}...\n\n`;
              sampleCount++;
            }
          }
        }
        lastIndex = range.end;
      }
      
      if (lastIndex < entry.text.length && sampleCount < 15) {
        const unusedChunk = entry.text.substring(lastIndex).trim();
        if (unusedChunk.length > 5) {
          report += `${unusedChunk.replace(/\s+/g, ' ').substring(0, 150)}...\n`;
        }
      }
      
      report += `\`\`\`\n\n`;
    }
  }

  const outputPath = path.join(__dirname, 'css_coverage_report.md');
  fs.writeFileSync(outputPath, report);
  console.log(`Report successfully written to ${outputPath}`);

  await browser.close();
})();

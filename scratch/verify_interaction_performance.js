const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://127.0.0.1:9392';

(async () => {
  console.log('Launching Headful Chrome for Post-Interaction Performance Tracing...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log(`Navigating to: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'load' });
  
  console.log('Waiting 15 seconds to bypass Turnstile challenge...');
  await new Promise(r => setTimeout(r, 15000));
  
  // Wait 4s before starting the trace to let the initial load settle
  await new Promise(r => setTimeout(r, 4000));

  console.log('Starting Trace (trace_interaction.json)...');
  const tracePath = path.join(__dirname, 'trace_interaction.json');
  await page.tracing.start({ path: tracePath, categories: ['devtools.timeline'] });

  console.log('Simulating user interaction (scroll and click)...');
  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 500));
  // Scroll down more
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 500));
  // Click on background
  try {
    await page.click('body');
  } catch (e) {
    console.log('Body click failed:', e.message);
  }

  // Wait 10 seconds for deferred scripts to boot up and run
  console.log('Waiting 10 seconds for lazy scripts to execute...');
  await new Promise(r => setTimeout(r, 10000));

  await page.tracing.stop();
  console.log('Trace stopped.');

  // Parse trace
  if (fs.existsSync(tracePath)) {
    const traceData = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
    const events = traceData.traceEvents || [];
    
    // Filter for events with duration > 50ms (50,000 microseconds)
    const longEvents = events.filter(e => e.dur && e.dur > 50000);
    longEvents.sort((a, b) => b.dur - a.dur);
    
    console.log(`\nFound ${longEvents.length} long tasks (> 50ms) during post-interaction:`);
    
    for (let i = 0; i < Math.min(15, longEvents.length); i++) {
      const e = longEvents[i];
      const durMs = (e.dur / 1000).toFixed(1);
      console.log(`\n[${i+1}] Event: ${e.name} | Cat: ${e.cat} | Dur: ${durMs}ms`);
      
      const startTime = e.ts;
      const endTime = e.ts + e.dur;
      
      const subJSEvents = events.filter(sub => {
        return sub.ts >= startTime && 
               (sub.ts + (sub.dur || 0)) <= endTime && 
               (sub.name === 'EvaluateScript' || sub.name === 'FunctionCall' || sub.name === 'v8.compile');
      });

      if (subJSEvents.length > 0) {
        console.log(`    JS files in this task:`);
        const urls = new Set();
        subJSEvents.forEach(sub => {
          if (sub.args && sub.args.data) {
            if (sub.args.data.url) urls.add(sub.args.data.url);
            if (sub.args.data.scriptName) urls.add(sub.args.data.scriptName);
          }
        });
        urls.forEach(url => console.log(`      - ${url}`));
      }
    }
  }

  await browser.close();
})();

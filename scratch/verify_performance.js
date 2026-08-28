const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = 'http://127.0.0.1:9392';

async function runAudit(viewport) {
  console.log(`\n======================================`);
  console.log(`Running Audit for Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
  console.log(`======================================`);
  
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${viewport.width},${viewport.height}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height });

  // 1. Visit Homepage & Allow Turnstile Bypass
  console.log(`Navigating to: ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting 15 seconds for automated Turnstile verification...');
  await new Promise(r => setTimeout(r, 15000));

  // 2. Reload and Record Tracing
  console.log('Starting Performance Tracing & Reloading Page...');
  const tracePath = path.join(__dirname, `trace_${viewport.name}.json`);
  
  // Clear old trace if exists
  if (fs.existsSync(tracePath)) fs.unlinkSync(tracePath);
  
  await page.tracing.start({ path: tracePath, categories: ['devtools.timeline'] });
  
  const navigationStart = Date.now();
  await page.goto(baseUrl, { waitUntil: 'load' });
  
  // Extract timings using page context performance API immediately
  const timing = await page.evaluate(() => {
    const t = performance.timing;
    return {
      navigationStart: t.navigationStart,
      responseStart: t.responseStart, // TTFB
      domContentLoaded: t.domContentLoadedEventStart
    };
  });
  
  await new Promise(r => setTimeout(r, 5000)); // Let the page fully load
  await page.tracing.stop();
  console.log(`Trace saved to ${tracePath}`);

  // 3. Extract LCP timings
  console.log('Extracting LCP and Image timing metrics...');
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcp = entries[entries.length - 1];
        
        if (lcp && lcp.url) {
          const resource = performance.getEntriesByType('resource').find(r => r.name === lcp.url);
          resolve({
            lcpUrl: lcp.url,
            lcpRenderTime: lcp.renderTime || lcp.loadTime,
            resourceStart: resource ? resource.startTime : null,
            resourceDuration: resource ? resource.duration : null
          });
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Fallback
      setTimeout(() => {
        const entries = performance.getEntriesByType('largest-contentful-paint');
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1];
          const resource = performance.getEntriesByType('resource').find(r => r.name === lcp.url);
          resolve({
            lcpUrl: lcp.url,
            lcpRenderTime: lcp.renderTime || lcp.loadTime,
            resourceStart: resource ? resource.startTime : null,
            resourceDuration: resource ? resource.duration : null
          });
        } else {
          resolve(null);
        }
      }, 3000);
    });
  });

  const customCssServed = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]'))
      .find(l => l.href && l.href.includes('custom.'));
    return link ? link.href : null;
  });

  // Calculate TTFB relative to navigation start
  const ttfb = timing.responseStart - timing.navigationStart;
  
  let result = {
    viewport: viewport.name,
    ttfb: ttfb,
    customCssServed: customCssServed,
    lcpUrl: 'N/A',
    resourceStartRelative: 0,
    resourceLoadDelay: 0,
    resourceDuration: 0,
    lcpRenderTime: 0,
    totalLayouts: 0,
    forcedLayouts: 0
  };

  if (metrics) {
    result.lcpUrl = metrics.lcpUrl;
    result.resourceStartRelative = metrics.resourceStart; // relative to navigation start
    result.resourceLoadDelay = Math.max(0, metrics.resourceStart - ttfb); // relative to TTFB
    result.resourceDuration = metrics.resourceDuration || 0;
    result.lcpRenderTime = metrics.lcpRenderTime;
  }

  // Parse trace events
  if (fs.existsSync(tracePath)) {
    const traceData = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
    const events = traceData.traceEvents || [];
    const layouts = events.filter(e => e.name === 'Layout' && e.args && e.args.beginData && e.args.beginData.dirtyObjects > 0);
    const forced = events.filter(e => e.name === 'Layout' && e.args && e.args.beginData && e.args.beginData.layoutRole === 'Forced');
    result.totalLayouts = layouts.length;
    result.forcedLayouts = forced.length;
  }

  await browser.close();
  return result;
}

(async () => {
  const viewports = [
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  const results = [];
  for (const vp of viewports) {
    try {
      const res = await runAudit(vp);
      results.push(res);
    } catch (e) {
      console.error(`Failed to audit viewport ${vp.name}:`, e.message);
    }
  }

  console.log('\n\n======================================');
  console.log('FINAL AUDIT RESULTS METRICS');
  console.log('======================================');
  console.log(JSON.stringify(results, null, 2));

  // Write to a validation report file
  let mdReport = '# Performance Verification Metrics Report\n\n';
  mdReport += `Audit Date: ${new Date().toISOString()}\n\n`;
  
  for (const res of results) {
    mdReport += `## Viewport: ${res.viewport}\n`;
    mdReport += `- **Document TTFB (Response Start)**: ${res.ttfb.toFixed(1)}ms\n`;
    mdReport += `- **LCP Element / Image**: \`${res.lcpUrl}\`\n`;
    mdReport += `- **LCP Resource Request Start (Relative to Nav Start)**: ${res.resourceStartRelative.toFixed(1)}ms\n`;
    mdReport += `- **Resource Load Delay (Relative to TTFB)**: **${res.resourceLoadDelay.toFixed(1)}ms** (Target: near 0ms)\n`;
    mdReport += `- **LCP Resource Load Duration**: ${res.resourceDuration.toFixed(1)}ms\n`;
    mdReport += `- **LCP Render Time (Paint)**: ${res.lcpRenderTime.toFixed(1)}ms\n`;
    mdReport += `- **Custom CSS Served**: \`${res.customCssServed}\`\n`;
    mdReport += `- **Forced Reflow (Forced Layout) Events**: **${res.forcedLayouts}** (Target: 0)\n`;
    mdReport += `- **Total Layout Actions**: ${res.totalLayouts}\n\n`;
  }
  
  const reportPath = path.join(__dirname, 'performance_verification_report.md');
  fs.writeFileSync(reportPath, mdReport);
  console.log(`\nVerification report successfully written to ${reportPath}`);
})();

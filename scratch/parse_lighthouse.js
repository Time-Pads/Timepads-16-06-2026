const fs = require('fs');

const reportPath = 'scratch/lh_report.json';
if (fs.existsSync(reportPath)) {
  const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  // Audits
  const audits = data.audits || {};
  
  // FCP
  const fcp = audits['first-contentful-paint'] || {};
  // LCP
  const lcp = audits['largest-contentful-paint'] || {};
  // TTFB
  const ttfb = audits['server-response-time'] || {};
  // TBT (proxy for main thread block/INP issues)
  const tbt = audits['total-blocking-time'] || {};
  // Speed Index
  const speedIndex = audits['speed-index'] || {};

  console.log('=== LIGHTHOUSE METRICS (MOBILE LAB ENVIRONMENT) ===');
  console.log(`FCP: ${fcp.displayValue} (${fcp.numericValue} ms)`);
  console.log(`LCP: ${lcp.displayValue} (${lcp.numericValue} ms)`);
  console.log(`TTFB: ${ttfb.displayValue} (${ttfb.numericValue} ms)`);
  console.log(`TBT (Total Blocking Time): ${tbt.displayValue} (${tbt.numericValue} ms)`);
  console.log(`Speed Index: ${speedIndex.displayValue} (${speedIndex.numericValue} ms)`);

  // Let's get LCP breakdown details if available
  // In Lighthouse v10+, LCP breakdown is inside metric-savings or LCP diagnostics
  console.log('\n=== LCP BREAKDOWN (ESTIMATED FROM AUDIT LIFETIME) ===');
  // LCP breakdown parts:
  // - TTFB: Server Response Time
  // - Resource load delay
  // - Resource load time
  // - Element render delay
  const lcpElement = audits['largest-contentful-paint-element'] || {};
  if (lcpElement.details && lcpElement.details.items && lcpElement.details.items[0]) {
    const item = lcpElement.details.items[0];
    console.log('LCP Element Selector:', item.node ? item.node.selector : 'N/A');
    console.log('LCP Element Tag:', item.node ? item.node.nodeLabel : 'N/A');
  }

  // Let's scan for specific long tasks
  const longTasks = audits['long-tasks'] || {};
  if (longTasks.details && longTasks.details.items) {
    console.log('\n=== TOP LONG TASKS (>50ms) ===');
    longTasks.details.items.slice(0, 5).forEach((item, i) => {
      console.log(`${i+1}: Start Time: ${item.startTime} ms, Duration: ${item.duration} ms`);
    });
  } else {
    console.log('\nNo long tasks audit data found.');
  }

  // Check render blocking resources
  const rb = audits['render-blocking-resources'] || {};
  if (rb.details && rb.details.items) {
    console.log('\n=== RENDER BLOCKING RESOURCES ===');
    rb.details.items.forEach(item => {
      console.log(`- Url: ${item.url.split('/').pop().split('?')[0]} (${item.wastedMs} ms saving)`);
    });
  }

} else {
  console.log('Lighthouse report file not found.');
}

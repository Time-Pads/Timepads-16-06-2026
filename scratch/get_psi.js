const https = require('https');

const url = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://timepads.in/&strategy=mobile';

console.log('Fetching PageSpeed Insights data for https://timepads.in/ (mobile)...');

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('Error from PageSpeed API:', json.error.message);
        return;
      }

      // Check for Field Data (loadingExperience)
      const loadingExperience = json.loadingExperience;
      console.log('\n=== FIELD DATA (CRUX) ===');
      if (loadingExperience && loadingExperience.metrics) {
        const ttfb = loadingExperience.metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE;
        const inp = loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT;
        const lcp = loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT;

        console.log(`TTFB: ${ttfb ? ttfb.percentile + ' ms' : 'N/A'}`);
        console.log(`INP: ${inp ? inp.percentile + ' ms' : 'N/A'}`);
        console.log(`LCP: ${lcp ? lcp.percentile + ' ms' : 'N/A'}`);
      } else {
        console.log('No Field Data available.');
      }

      // Check for Lab Data (lighthouseResult)
      console.log('\n=== LAB DATA (LIGHTHOUSE) ===');
      const lh = json.lighthouseResult;
      if (lh && lh.audits) {
        const ttfbVal = lh.audits['server-response-time'];
        const lcpVal = lh.audits['largest-contentful-paint'];
        const tbtVal = lh.audits['total-blocking-time'];

        console.log(`LCP (Lab): ${lcpVal ? lcpVal.displayValue : 'N/A'}`);
        console.log(`TTFB (Lab): ${ttfbVal ? ttfbVal.displayValue : 'N/A'} (raw: ${ttfbVal ? ttfbVal.numericValue : 'N/A'} ms)`);
        console.log(`TBT (Lab - proxy for INP issues): ${tbtVal ? tbtVal.displayValue : 'N/A'}`);
        
        // Let's print out long tasks or render blocking resources if any
        console.log('\n=== DIAGNOSTICS ===');
        const renderBlocking = lh.audits['render-blocking-resources'];
        if (renderBlocking && renderBlocking.details && renderBlocking.details.items) {
          console.log('Render blocking resources:');
          renderBlocking.details.items.forEach(item => {
            console.log(` - ${item.url} (wastedMs: ${item.wastedMs} ms)`);
          });
        }

        const longTasks = lh.audits['long-tasks'];
        if (longTasks && longTasks.details && longTasks.details.items) {
          console.log('Long tasks (>50ms):');
          longTasks.details.items.slice(0, 10).forEach(item => {
            console.log(` - Start: ${item.startTime} ms, Duration: ${item.duration} ms`);
          });
        } else {
          // Check bootup-time or mainthread-work-breakdown
          const mainThread = lh.audits['mainthread-work-breakdown'];
          if (mainThread && mainThread.displayValue) {
            console.log(`Main thread work breakdown: ${mainThread.displayValue}`);
          }
        }
      } else {
        console.log('No Lab Data available.');
      }
    } catch (e) {
      console.error('Failed to parse API response:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('HTTPS request failed:', err.message);
});

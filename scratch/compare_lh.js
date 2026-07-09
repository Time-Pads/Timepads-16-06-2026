const fs = require('fs');

const pathBefore = 'scratch/lh_report.json';
const pathAfter = 'scratch/lh_report_final.json';

if (fs.existsSync(pathBefore) && fs.existsSync(pathAfter)) {
  const before = JSON.parse(fs.readFileSync(pathBefore, 'utf8'));
  const after = JSON.parse(fs.readFileSync(pathAfter, 'utf8'));

  const tbtBefore = before.audits['total-blocking-time'] || {};
  const tbtAfter = after.audits['total-blocking-time'] || {};

  const lcpBefore = before.audits['largest-contentful-paint'] || {};
  const lcpAfter = after.audits['largest-contentful-paint'] || {};

  const clsBefore = before.audits['cumulative-layout-shift'] || {};
  const clsAfter = after.audits['cumulative-layout-shift'] || {};

  const jsRequestsBefore = (before.audits['network-requests']?.details?.items || []).filter(r => r.resourceType === 'Script').length;
  const jsRequestsAfter = (after.audits['network-requests']?.details?.items || []).filter(r => r.resourceType === 'Script').length;

  console.log('=== PERFORMANCE COMPARISON (MOBILE LAB) ===');
  console.log(`Total Blocking Time: ${tbtBefore.displayValue} -> ${tbtAfter.displayValue}`);
  console.log(`LCP (Largest Contentful Paint): ${lcpBefore.displayValue} -> ${lcpAfter.displayValue}`);
  console.log(`CLS (Cumulative Layout Shift): ${clsBefore.displayValue} -> ${clsAfter.displayValue}`);
  console.log(`JS Request Count: ${jsRequestsBefore} -> ${jsRequestsAfter}`);
} else {
  console.log('One or both Lighthouse reports are missing.');
}

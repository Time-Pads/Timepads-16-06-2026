const fs = require('fs');
const path = require('path');

const filename = process.argv[2] || 'trace_Desktop.json';
const tracePath = path.join(__dirname, filename);

if (!fs.existsSync(tracePath)) {
  console.error(`Trace file not found at ${tracePath}`);
  process.exit(1);
}

console.log(`Analyzing file: ${filename}`);
const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
const events = trace.traceEvents || [];


console.log(`Analyzing ${events.length} trace events for long tasks (> 50ms)...`);

// Standard definition of a long task is duration > 50ms (50,000 microseconds)
const LONG_TASK_THRESHOLD = 50000;

// Filter for top-level long tasks
// In Chrome timeline, long tasks are typically 'RunTask' (or major JS execution events like EvaluateScript, FunctionCall)
const longEvents = events.filter(e => e.dur && e.dur > LONG_TASK_THRESHOLD);

// Sort by duration descending
longEvents.sort((a, b) => b.dur - a.dur);

console.log(`\nFound ${longEvents.length} events matching the long-task threshold (> 50ms):`);

// We want to map each long event to its script source or function call if available
for (let i = 0; i < Math.min(20, longEvents.length); i++) {
  const e = longEvents[i];
  const durMs = (e.dur / 1000).toFixed(1);
  console.log(`\n[${i+1}] Event: ${e.name} | Category: ${e.cat} | Duration: ${durMs}ms`);
  
  if (e.args) {
    console.log(`    Args:`, JSON.stringify(e.args));
  }

  // Find sub-events (like FunctionCall or EvaluateScript) that occurred inside this event's timestamp range
  const startTime = e.ts;
  const endTime = e.ts + e.dur;
  
  const subJSEvents = events.filter(sub => {
    return sub.ts >= startTime && 
           (sub.ts + (sub.dur || 0)) <= endTime && 
           (sub.name === 'EvaluateScript' || sub.name === 'FunctionCall' || sub.name === 'v8.compile');
  });

  if (subJSEvents.length > 0) {
    console.log(`    Associated JS scripts/functions inside this task:`);
    // Print unique script URLs
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

const fs = require('fs');

const logPath = 'C:\\Users\\abala\\.gemini\\antigravity-ide\\brain\\496c9920-993d-4aee-a7df-5e8bc1db87ab\\.system_generated\\tasks\\task-293.log';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const ourFiles = ['deal-of-the-day.liquid'];
  
  console.log('Searching theme check log for deal-of-the-day...');
  let currentFile = '';
  let linesToPrint = [];
  let found = false;

  lines.forEach((line) => {
    if (line.includes('timepads-25-06-2026-optimization')) {
      currentFile = line.trim();
    }
    
    const isOurFile = ourFiles.some(f => currentFile.includes(f));
    if (isOurFile) {
      linesToPrint.push(line);
      found = true;
    } else if (linesToPrint.length > 0) {
      console.log('=== FILE:', currentFile, '===');
      console.log(linesToPrint.join('\n'));
      linesToPrint = [];
    }
  });

  if (!found) {
    console.log('No warnings or errors found in deal-of-the-day.liquid! Everything is clean.');
  }
} else {
  console.log('Log file not found');
}

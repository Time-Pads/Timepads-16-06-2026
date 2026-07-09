const fs = require('fs');

const logPath = 'C:\\Users\\abala\\.gemini\\antigravity-ide\\brain\\496c9920-993d-4aee-a7df-5e8bc1db87ab\\.system_generated\\tasks\\task-187.log';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const ourFiles = ['theme.liquid', 'gokwik.liquid', 'load-app-scripts-on-interaction.liquid'];
  
  console.log('Searching theme check log for edited files...');
  let currentFile = '';
  let linesToPrint = [];
  let found = false;

  lines.forEach((line) => {
    // Check if the line indicates a file path
    if (line.includes('timepads-25-06-2026-optimization')) {
      currentFile = line.trim();
    }
    
    const isOurFile = ourFiles.some(f => currentFile.includes(f));
    if (isOurFile) {
      linesToPrint.push(line);
      found = true;
    } else if (linesToPrint.length > 0) {
      // Print stored lines for our file
      console.log('=== FILE:', currentFile, '===');
      console.log(linesToPrint.join('\n'));
      linesToPrint = [];
    }
  });

  if (!found) {
    console.log('No warnings or errors found in our edited files! Everything is clean.');
  }
} else {
  console.log('Log file not found');
}

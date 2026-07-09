const fs = require('fs');
const path = require('path');

const id = '90c877bd-d19b-40ce-a1eb-70ff64af557e';
const file = `C:\\Users\\abala\\.gemini\\antigravity-ide\\brain\\${id}\\.system_generated\\logs\\transcript.jsonl`;

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  console.log(`Total lines: ${lines.length}`);
  
  // Print the last 15 lines of transcript
  lines.slice(-15).forEach((line, idx) => {
    try {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index} (${obj.type} - ${obj.source}):`);
      console.log(obj.content ? obj.content.slice(0, 1000) : 'No content');
      console.log('===');
    } catch(e) {}
  });
} else {
  console.log('File not found');
}

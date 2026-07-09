const fs = require('fs');

const id = '90c877bd-d19b-40ce-a1eb-70ff64af557e';
const file = `C:\\Users\\abala\\.gemini\\antigravity-ide\\brain\\${id}\\.system_generated\\logs\\transcript.jsonl`;

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  lines.forEach((line, idx) => {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index >= 678 && obj.step_index <= 720) {
        const text = obj.content || '';
        if (text.includes('ms') || text.includes('seconds') || text.includes('%')) {
          console.log(`Step ${obj.step_index}:`);
          console.log(text.slice(0, 1500));
          console.log('===');
        }
      }
    } catch(e) {}
  });
}

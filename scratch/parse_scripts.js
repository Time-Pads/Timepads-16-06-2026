const fs = require('fs');
const buffer = fs.readFileSync('scratch/homepage_audit.html');
const content = buffer.toString('utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const scriptTags = [];
let match;
while ((match = scriptRegex.exec(content)) !== null) {
  scriptTags.push({ tag: match[0].match(/<script\b[^>]*>/i)[0], content: match[1] });
}

[139, 140, 141].forEach(index => {
  if (scriptTags[index]) {
    console.log(`\n--- SCRIPT ${index} (${scriptTags[index].tag}) ---`);
    console.log(scriptTags[index].content.slice(0, 1000));
  }
});

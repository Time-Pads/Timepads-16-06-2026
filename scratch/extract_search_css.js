const fs = require('fs');
const path = require('path');

const customCssPath = path.join(__dirname, '../assets/custom.css');
const extractedCssPath = path.join(__dirname, 'extracted_search.css');

const content = fs.readFileSync(customCssPath, 'utf8');

// Rules to extract (search rules)
const searchRules = [];
// Cleaned content of custom.css
let cleanedContent = '';

// We will split the file by CSS blocks (curly braces)
let depth = 0;
let currentBlock = '';
let currentSelector = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  currentBlock += char;

  if (char === '{') {
    depth++;
  } else if (char === '}') {
    depth--;
    if (depth === 0) {
      // We finished a top-level block
      const blockTrimmed = currentBlock.trim();
      
      // Check if it matches Turnstile / search rules
      if (blockTrimmed.includes('.template-search')) {
        searchRules.push(blockTrimmed);
      } else {
        // Check if it matches other dead rules we want to delete
        const isDeadRule = 
          blockTrimmed.startsWith('.rf-pricelazy-section') ||
          blockTrimmed.startsWith('.limited-stock') ||
          blockTrimmed.startsWith('.mobikqik-img') ||
          blockTrimmed.startsWith('.gfbProductPageWrapperV2') ||
          blockTrimmed.startsWith('.product-discount-badge.\\39 878205595963') ||
          blockTrimmed.startsWith('.product-discount-badge--best-sanitary-pads-for-women') ||
          blockTrimmed.startsWith('.empty_block_condition') ||
          blockTrimmed.startsWith('.empty_image_not_mentioned');

        if (!isDeadRule) {
          cleanedContent += currentBlock;
        } else {
          console.log('Removed dead rule:', blockTrimmed.substring(0, 100) + '...');
        }
      }
      currentBlock = '';
    }
  }
}

// Append any trailing content that wasn't in a block
if (currentBlock.length > 0) {
  cleanedContent += currentBlock;
}

// Write the search rules to a file
fs.writeFileSync(extractedCssPath, searchRules.join('\n\n'));
console.log(`Extracted ${searchRules.length} search rules to ${extractedCssPath}`);

// Write the cleaned custom.css back
fs.writeFileSync(customCssPath, cleanedContent);
console.log(`Cleaned custom.css written successfully.`);

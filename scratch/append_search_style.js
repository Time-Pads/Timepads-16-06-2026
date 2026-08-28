const fs = require('fs');
const path = require('path');

const searchLiquidPath = path.join(__dirname, '../sections/search.liquid');
const extractedCssPath = path.join(__dirname, 'extracted_search.css');

const searchLiquid = fs.readFileSync(searchLiquidPath, 'utf8');
const searchCss = fs.readFileSync(extractedCssPath, 'utf8');

// Wrap CSS in {% style %} {% endstyle %}
const wrappedCss = `\n\n{% style %}\n${searchCss}\n{% endstyle %}\n\n`;

// Insert right before {% schema %}
const target = '{% schema %}';
const position = searchLiquid.indexOf(target);

if (position !== -1) {
  const updatedSearchLiquid = searchLiquid.slice(0, position) + wrappedCss + searchLiquid.slice(position);
  fs.writeFileSync(searchLiquidPath, updatedSearchLiquid);
  console.log('Successfully appended styles to sections/search.liquid');
} else {
  console.error('Could not find {% schema %} tag in sections/search.liquid');
}

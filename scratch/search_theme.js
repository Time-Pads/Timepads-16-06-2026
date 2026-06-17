const fs = require('fs');
const file = fs.readFileSync('c:/Users/abala/OneDrive/Desktop/Timepads-Optimization/Timepads-16-06-2026/sections/header.liquid', 'utf8');

function findAndPrint(term, length = 1000) {
    const idx = file.indexOf(term);
    if (idx !== -1) {
        console.log(`=== Found "${term}" ===`);
        console.log(file.substring(idx - 100, idx + length));
    } else {
        console.log(`=== "${term}" not found ===`);
    }
}

findAndPrint('<img');
findAndPrint('image_url');
findAndPrint('img_url');
findAndPrint('logo');

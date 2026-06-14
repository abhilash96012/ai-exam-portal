const fs = require('fs');
const path = require('path');

const files = [
    './backend/controllers/exam.controller.js',
    './backend/controllers/teacher.controller.js',
];

files.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
        console.log(`✗ File not found: ${filePath}`);
        return;
    }

    // Read file
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix corrupted operators
    // Replace "? ?" with "??"
    content = content.replace(/\?\s\?/g, '??');

    // Replace "? ." with "?."
    content = content.replace(/\?\s\./g, '?.');

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`✓ Fixed ${path.basename(filePath)}`);
});
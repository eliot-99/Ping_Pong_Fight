#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create public/src directory
const srcDir = path.join(__dirname, 'public', 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
    console.log('✓ Created public/src directory');
}

// Copy game.js
const gameJsSrc = path.join(__dirname, 'src', 'game.js');
const gameJsDest = path.join(srcDir, 'game.js');
fs.copyFileSync(gameJsSrc, gameJsDest);
console.log('✓ Copied src/game.js to public/src/game.js');

// Copy styles.css
const stylesCssSrc = path.join(__dirname, 'src', 'styles.css');
const stylesCssDest = path.join(srcDir, 'styles.css');
fs.copyFileSync(stylesCssSrc, stylesCssDest);
console.log('✓ Copied src/styles.css to public/src/styles.css');

console.log('\n✓ Build complete - all files ready for deployment');

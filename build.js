#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

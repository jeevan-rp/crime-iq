const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

// Clean or create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('Copying build artifacts to dist folder...');

// 1. Copy standalone output to dist
const standaloneDir = path.join(rootDir, '.next', 'standalone');
if (fs.existsSync(standaloneDir)) {
  fs.cpSync(standaloneDir, distDir, { recursive: true, force: true });
  console.log('✓ Copied .next/standalone to dist');
} else {
  console.error('❌ .next/standalone does not exist. Did Next.js build fail?');
  process.exit(1);
}

// 2. Copy static files to dist/.next/static
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(distDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(path.join(distDir, '.next'), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('✓ Copied .next/static to dist/.next/static');
}

// 3. Copy public files to dist/public
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(distDir, 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
  console.log('✓ Copied public to dist/public');
}

// 4. Copy start.js to dist/start.js
const startSrc = path.join(rootDir, 'start.js');
const startDest = path.join(distDir, 'start.js');
if (fs.existsSync(startSrc)) {
  fs.copyFileSync(startSrc, startDest);
  console.log('✓ Copied start.js to dist/start.js');
}

console.log('✅ Build copy completed successfully!');

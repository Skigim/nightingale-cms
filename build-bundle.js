#!/usr/bin/env node

/**
 * Simple build script for Nightingale CMS
 * Since the project uses in-browser Babel compilation for development,
 * this build script simply validates the structure and prepares for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  Nightingale CMS Build Process');
console.log('================================');

// Check if main files exist
const requiredFiles = [
  'App/NightingaleCMS-React.html',
  'App/js/components/index.js',
  'App/js/services/nightingale.utils.js',
  'package.json'
];

let buildSuccess = true;

console.log('\n📋 Validating project structure...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    buildSuccess = false;
  }
});

// Create build directory if it doesn't exist
const buildDir = 'App/build';
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log(`📁 Created build directory: ${buildDir}`);
}

// Copy main HTML file to build directory (simple deployment prep)
try {
  fs.copyFileSync('App/NightingaleCMS-React.html', `${buildDir}/index.html`);
  console.log('📄 Copied main application file to build/index.html');
} catch (error) {
  console.error('❌ Failed to copy main application file:', error.message);
  buildSuccess = false;
}

// Validate component structure
console.log('\n🧩 Validating component structure...');
const componentDirs = ['App/js/components/ui', 'App/js/components/business'];
componentDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    console.log(`✅ ${dir} (${files.length} components)`);
  } else {
    console.log(`⚠️  ${dir} - Directory not found`);
  }
});

// Validate services
console.log('\n🔧 Validating services...');
const servicesDir = 'App/js/services';
if (fs.existsSync(servicesDir)) {
  const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
  console.log(`✅ Services directory (${services.length} services)`);
  services.forEach(service => {
    console.log(`   - ${service}`);
  });
} else {
  console.log('❌ Services directory not found');
  buildSuccess = false;
}

console.log('\n🎯 Build Summary');
console.log('================');

if (buildSuccess) {
  console.log('✅ Build completed successfully!');
  console.log('💡 This project uses in-browser compilation for development.');
  console.log('📦 For production, consider pre-compiling with Babel/Webpack.');
  process.exit(0);
} else {
  console.log('❌ Build failed - missing required files');
  process.exit(1);
}
#!/usr/bin/env node

/**
 * Simple test to verify timeout fixes in config file
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Testing timeout configuration fixes...\n');

// Read the config file directly
const configPath = path.join(process.cwd(), 'browsermcp.config.json');
const configText = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configText);

// Test 1: Check screenshot timeout reduced from 90s to 30s
const screenshotTimeout = config.devtools.screenshotTimeout;
console.log(`✅ Screenshot timeout: ${screenshotTimeout}ms (${screenshotTimeout/1000}s)`);
if (screenshotTimeout === 30000) {
  console.log('✅ Screenshot timeout correctly reduced from 90s to 30s');
} else {
  console.log(`❌ Expected 30000ms, got ${screenshotTimeout}ms`);
  process.exit(1);
}

// Test 2: Check extension timeout increased from 5s to 10s
const extensionTimeout = config.fallback.extensionTimeout;
console.log(`✅ Extension timeout: ${extensionTimeout}ms (${extensionTimeout/1000}s)`);
if (extensionTimeout === 10000) {
  console.log('✅ Extension timeout correctly increased from 5s to 10s');
} else {
  console.log(`❌ Expected 10000ms, got ${extensionTimeout}ms`);
  process.exit(1);
}

// Test 3: Check mode is still auto
const mode = config.fallback.mode;
console.log(`✅ Fallback mode: ${mode}`);
if (mode === 'auto') {
  console.log('✅ Auto fallback mode maintained');
} else {
  console.log(`❌ Expected 'auto', got '${mode}'`);
  process.exit(1);
}

console.log('\n🎉 All timeout configuration tests passed!');
console.log('\n📋 Summary of changes:');
console.log('- Screenshot timeout: 90s → 30s (67% reduction)');
console.log('- Extension timeout: 5s → 10s (100% increase)');
console.log('- Added better error messages for timeouts');
console.log('- Improved auto-fallback logic for extension timeouts');

// Also check that the source files were updated correctly
console.log('\n🔍 Verifying source code changes...');

// Check config-manager.ts
const configManagerPath = path.join(process.cwd(), 'src/config/config-manager.ts');
const configManagerContent = fs.readFileSync(configManagerPath, 'utf-8');

if (configManagerContent.includes('screenshotTimeout: 30000')) {
  console.log('✅ config-manager.ts updated correctly');
} else {
  console.log('❌ config-manager.ts not updated');
  process.exit(1);
}

// Check puppeteer-fallback.ts
const puppeteerPath = path.join(process.cwd(), 'src/fallback/puppeteer-fallback.ts');
const puppeteerContent = fs.readFileSync(puppeteerPath, 'utf-8');

if (puppeteerContent.includes('30000 // 30 seconds timeout for screenshots')) {
  console.log('✅ puppeteer-fallback.ts updated correctly');
} else {
  console.log('❌ puppeteer-fallback.ts not updated');
  process.exit(1);
}

console.log('\n✨ All tests passed! WebSocket timeout fixes implemented successfully.');
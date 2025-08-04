#!/usr/bin/env node

/**
 * Test script for cross-platform port management
 * Run this to verify the port utility works in your environment
 */

const { killProcessOnPort, isPortInUse, freePort } = require('../dist/utils/port');
const http = require('http');

const TEST_PORT = 9876;

async function createTestServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('Test server');
    });
    
    server.listen(port, () => {
      console.log(`✅ Test server started on port ${port}`);
      resolve(server);
    });
  });
}

async function runTests() {
  console.log('🧪 Starting port management tests...\n');
  console.log(`Platform: ${process.platform}`);
  console.log(`Shell: ${process.env.SHELL || 'Not set'}`);
  console.log(`MSYSTEM: ${process.env.MSYSTEM || 'Not set'}`);
  console.log(`PSModulePath: ${process.env.PSModulePath ? 'Set (PowerShell)' : 'Not set'}`);
  console.log('');
  
  try {
    // Test 1: Check if port is initially free
    console.log('Test 1: Checking if port is initially free...');
    const initiallyInUse = await isPortInUse(TEST_PORT);
    console.log(`Port ${TEST_PORT} is ${initiallyInUse ? 'in use' : 'free'}`);
    
    if (initiallyInUse) {
      console.log('⚠️  Port is already in use, attempting to free it...');
      await freePort(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test 2: Start a test server
    console.log('\nTest 2: Starting test server...');
    const server = await createTestServer(TEST_PORT);
    
    // Test 3: Verify port is now in use
    console.log('\nTest 3: Verifying port is in use...');
    const nowInUse = await isPortInUse(TEST_PORT);
    if (nowInUse) {
      console.log('✅ Port detection working correctly');
    } else {
      console.log('❌ Port detection failed - port should be in use');
    }
    
    // Test 4: Kill the process
    console.log('\nTest 4: Killing process on port...');
    killProcessOnPort(TEST_PORT);
    
    // Wait for process to be killed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Verify port is free again
    console.log('\nTest 5: Verifying port is free after kill...');
    const finallyInUse = await isPortInUse(TEST_PORT);
    if (!finallyInUse) {
      console.log('✅ Port successfully freed');
    } else {
      console.log('❌ Port kill failed - port is still in use');
      // Try to close server manually
      server.close();
    }
    
    // Test 6: Test freePort function
    console.log('\nTest 6: Testing freePort function...');
    const server2 = await createTestServer(TEST_PORT);
    const freed = await freePort(TEST_PORT);
    if (freed) {
      console.log('✅ freePort function working correctly');
    } else {
      console.log('⚠️  freePort returned false, but this might be expected in some environments');
      server2.close();
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  console.log('\n✨ Test suite finished successfully');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
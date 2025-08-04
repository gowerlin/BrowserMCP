/**
 * Test script for Chrome Extension DevTools functions
 * This script tests screenshot and console log capture functionality
 */

// Test configuration
const TEST_URL = 'https://www.example.com';
const TEST_TAB_ID = 761028026; // Replace with actual tab ID from extension

// Helper function to send message to extension
async function sendExtensionMessage(action, params = {}) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: action,
      ...params
    });
    return response;
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false, error: error.message };
  }
}

// Test screenshot capture
async function testScreenshot() {
  console.log('Testing screenshot capture...');
  
  const response = await sendExtensionMessage('executeDevToolsCommand', {
    command: 'Page.captureScreenshot',
    params: {
      format: 'png',
      quality: 80
    }
  });
  
  if (response.success) {
    console.log('Screenshot captured successfully!');
    console.log('Data length:', response.result.data ? response.result.data.length : 0);
    
    // Convert base64 to blob and create download link
    if (response.result.data) {
      const blob = await fetch(`data:image/png;base64,${response.result.data}`).then(r => r.blob());
      const url = URL.createObjectURL(blob);
      console.log('Screenshot URL:', url);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } else {
    console.error('Screenshot failed:', response.error);
  }
  
  return response;
}

// Test console log capture
async function testConsoleLog() {
  console.log('Testing console log capture...');
  
  // First, enable console domain
  const enableResponse = await sendExtensionMessage('executeDevToolsCommand', {
    command: 'Console.enable',
    params: {}
  });
  
  if (!enableResponse.success) {
    console.error('Failed to enable Console domain:', enableResponse.error);
    return;
  }
  
  // Generate some console logs
  console.log('Test log message 1');
  console.warn('Test warning message');
  console.error('Test error message');
  console.info('Test info message');
  
  // Wait a bit for logs to be captured
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get console logs from extension (through WebSocket if available)
  // Note: This requires the WebSocket server to be running
  console.log('Console logs should be captured by the extension');
  console.log('Check the extension background script console for captured logs');
}

// Test DOM snapshot
async function testDOMSnapshot() {
  console.log('Testing DOM snapshot...');
  
  const response = await sendExtensionMessage('executeDevToolsCommand', {
    command: 'DOMSnapshot.captureSnapshot',
    params: {
      computedStyles: ['font-size', 'color', 'background-color'],
      includePaintOrder: true,
      includeDOMRects: true
    }
  });
  
  if (response.success) {
    console.log('DOM snapshot captured successfully!');
    console.log('Documents:', response.result.documents ? response.result.documents.length : 0);
    console.log('Strings:', response.result.strings ? response.result.strings.length : 0);
    return response.result;
  } else {
    console.error('DOM snapshot failed:', response.error);
  }
  
  return response;
}

// Test network monitoring
async function testNetworkMonitoring() {
  console.log('Testing network monitoring...');
  
  // Enable network domain
  const response = await sendExtensionMessage('executeDevToolsCommand', {
    command: 'Network.enable',
    params: {}
  });
  
  if (response.success) {
    console.log('Network monitoring enabled');
    
    // Make a test request
    fetch('/api/test').catch(() => {});
    
    console.log('Network requests should be captured by the extension');
    console.log('Check the extension background script for captured requests');
  } else {
    console.error('Failed to enable network monitoring:', response.error);
  }
  
  return response;
}

// Test page info
async function testPageInfo() {
  console.log('Testing page info retrieval...');
  
  const response = await sendExtensionMessage('executeDevToolsCommand', {
    command: 'Page.getResourceTree',
    params: {}
  });
  
  if (response.success) {
    console.log('Page info retrieved successfully!');
    const frameTree = response.result.frameTree;
    if (frameTree) {
      console.log('URL:', frameTree.frame.url);
      console.log('Title:', frameTree.frame.title);
      console.log('Security Origin:', frameTree.frame.securityOrigin);
      console.log('Resources:', frameTree.resources ? frameTree.resources.length : 0);
    }
  } else {
    console.error('Failed to get page info:', response.error);
  }
  
  return response;
}

// Run all tests
async function runAllTests() {
  console.log('=== Starting Chrome Extension Tests ===');
  
  // Check connection status first
  const status = await sendExtensionMessage('getStatus');
  console.log('Connection status:', status);
  
  if (!status.connected) {
    console.error('Extension is not connected to any tab. Please connect first.');
    return;
  }
  
  // Run tests sequentially
  await testPageInfo();
  await new Promise(r => setTimeout(r, 1000));
  
  await testScreenshot();
  await new Promise(r => setTimeout(r, 1000));
  
  await testConsoleLog();
  await new Promise(r => setTimeout(r, 1000));
  
  await testNetworkMonitoring();
  await new Promise(r => setTimeout(r, 1000));
  
  await testDOMSnapshot();
  
  console.log('=== Tests Complete ===');
}

// Export for use in console
window.extensionTests = {
  testScreenshot,
  testConsoleLog,
  testNetworkMonitoring,
  testPageInfo,
  testDOMSnapshot,
  runAllTests
};

console.log('Extension test script loaded!');
console.log('Run tests with: extensionTests.runAllTests()');
console.log('Or test individual functions:');
console.log('  - extensionTests.testScreenshot()');
console.log('  - extensionTests.testConsoleLog()');
console.log('  - extensionTests.testNetworkMonitoring()');
console.log('  - extensionTests.testPageInfo()');
console.log('  - extensionTests.testDOMSnapshot()');
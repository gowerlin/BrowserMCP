# BrowserMCP DevTools API Examples

Complete usage examples for all DevTools integration features with real-world scenarios.

## 🌐 Network Monitoring Examples

### Basic Network Request Monitoring

```javascript
// Get all network requests
const allRequests = await browser_get_network_requests({
  filter: "all"
});

// Get only XHR/Fetch requests (AJAX calls)
const ajaxRequests = await browser_get_network_requests({
  filter: "xhr",
  includeResponseBody: true
});

// Get specific resource types
const imageRequests = await browser_get_network_requests({
  filter: "image"
});

const scriptRequests = await browser_get_network_requests({
  filter: "script"
});
```

### Real-World Scenario: API Debugging

```javascript
// Debug API calls by monitoring XHR requests
async function debugApiCalls() {
  // Clear previous logs
  await browser_clear_network_log();
  
  // Trigger the action that makes API calls
  await browser_evaluate_javascript({
    code: `
      fetch('/api/users')
        .then(response => response.json())
        .then(data => console.log('Users loaded:', data));
    `
  });
  
  // Wait a moment for requests to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get all API requests
  const apiRequests = await browser_get_network_requests({
    filter: "xhr",
    includeResponseBody: true
  });
  
  // Analyze results
  apiRequests.forEach(request => {
    if (request.url.includes('/api/')) {
      console.log(`API Call: ${request.method} ${request.url}`);
      console.log(`Status: ${request.status} ${request.statusText}`);
      console.log(`Response Time: ${request.responseTime}ms`);
      if (request.status >= 400) {
        console.log(`Error Response:`, request.responseBody);
      }
    }
  });
}
```

### Performance Analysis

```javascript
// Monitor slow network requests
async function findSlowRequests() {
  const requests = await browser_get_network_requests({
    filter: "all"
  });
  
  const slowRequests = requests
    .filter(req => req.responseTime > 2000) // Slower than 2 seconds
    .sort((a, b) => b.responseTime - a.responseTime);
  
  console.log('Slow requests detected:');
  slowRequests.forEach(req => {
    console.log(`${req.url}: ${req.responseTime}ms`);
  });
}
```

## ⚡ Performance Monitoring Examples

### Core Web Vitals Monitoring

```javascript
// Get comprehensive performance metrics
async function checkPerformance() {
  const metrics = await browser_get_performance_metrics();
  
  const { coreWebVitals } = metrics;
  
  // Check Core Web Vitals thresholds
  const vitalsCheck = {
    LCP: {
      value: coreWebVitals.LCP,
      status: coreWebVitals.LCP <= 2500 ? 'Good' : 
              coreWebVitals.LCP <= 4000 ? 'Needs Improvement' : 'Poor',
      threshold: '≤ 2.5s'
    },
    FID: {
      value: coreWebVitals.FID,
      status: coreWebVitals.FID <= 100 ? 'Good' : 
              coreWebVitals.FID <= 300 ? 'Needs Improvement' : 'Poor',
      threshold: '≤ 100ms'
    },
    CLS: {
      value: coreWebVitals.CLS,
      status: coreWebVitals.CLS <= 0.1 ? 'Good' : 
              coreWebVitals.CLS <= 0.25 ? 'Needs Improvement' : 'Poor',
      threshold: '≤ 0.1'
    }
  };
  
  console.log('Core Web Vitals Assessment:', vitalsCheck);
  return vitalsCheck;
}
```

### Performance Profiling Workflow

```javascript
// Complete performance profiling session
async function profilePerformance() {
  console.log('Starting performance profiling...');
  
  // Start profiling
  await browser_start_performance_profiling({
    categories: ['js', 'rendering']
  });
  
  // Simulate user interaction or trigger performance-heavy operations
  await browser_evaluate_javascript({
    code: `
      // Simulate heavy computation
      function heavyTask() {
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.random();
        }
        return result;
      }
      
      // Simulate DOM manipulation
      function domManipulation() {
        for (let i = 0; i < 1000; i++) {
          const div = document.createElement('div');
          div.textContent = 'Test ' + i;
          document.body.appendChild(div);
        }
      }
      
      heavyTask();
      domManipulation();
    `
  });
  
  // Wait for operations to complete
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Stop profiling and get results
  const profileResult = await browser_stop_performance_profiling();
  console.log('Profiling complete:', profileResult);
  
  return profileResult;
}
```

## 🔍 DOM Inspection Examples

### Element Analysis

```javascript
// Inspect a specific element thoroughly
async function inspectButton() {
  const buttonInfo = await browser_inspect_element({
    selector: 'button.submit-btn',
    includeStyles: true,
    includeEventListeners: true,
    includeAccessibility: true
  });
  
  if (buttonInfo.error) {
    console.log('Button not found:', buttonInfo.error);
    return;
  }
  
  console.log('Button Analysis:');
  console.log('- Attributes:', buttonInfo.attributes);
  console.log('- Event Listeners:', buttonInfo.eventListeners);
  console.log('- Accessibility:', buttonInfo.accessibility);
  
  // Check for common issues
  const issues = [];
  
  // Check for accessibility
  if (!buttonInfo.attributes.includes('aria-label') && 
      !buttonInfo.attributes.includes('aria-labelledby')) {
    issues.push('Missing ARIA label');
  }
  
  // Check for event listeners
  if (!buttonInfo.eventListeners.some(listener => listener.type === 'click')) {
    issues.push('Missing click event listener');
  }
  
  if (issues.length > 0) {
    console.log('Issues found:', issues);
  }
  
  return buttonInfo;
}
```

### Form Validation Analysis

```javascript
// Analyze form structure and validation
async function analyzeForm() {
  const formInfo = await browser_inspect_element({
    selector: 'form',
    includeStyles: true,
    includeEventListeners: true
  });
  
  // Get all form inputs
  const inputs = await browser_evaluate_javascript({
    code: `
      Array.from(document.querySelectorAll('form input, form select, form textarea'))
        .map(input => ({
          type: input.type,
          name: input.name,
          required: input.required,
          value: input.value,
          valid: input.validity.valid,
          validationMessage: input.validationMessage
        }))
    `
  });
  
  console.log('Form Analysis:');
  console.log('- Form info:', formInfo);
  console.log('- Inputs:', inputs.value);
  
  // Check validation status
  const invalidInputs = inputs.value.filter(input => !input.valid);
  if (invalidInputs.length > 0) {
    console.log('Invalid inputs:', invalidInputs);
  }
}
```

## 💻 JavaScript Execution Examples

### Code Testing and Debugging

```javascript
// Test JavaScript functions in page context
async function testPageFunction() {
  // Test a function that might exist on the page
  const result = await browser_evaluate_javascript({
    code: `
      if (typeof myPageFunction === 'function') {
        try {
          const result = myPageFunction('test input');
          return { success: true, result: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: 'Function not found' };
      }
    `,
    awaitPromise: false
  });
  
  console.log('Function test result:', result);
  return result;
}
```

### Async Operation Testing

```javascript
// Test asynchronous operations
async function testAsyncOperation() {
  const result = await browser_evaluate_javascript({
    code: `
      fetch('/api/test')
        .then(response => response.json())
        .then(data => {
          console.log('API response:', data);
          return data;
        })
        .catch(error => {
          console.error('API error:', error);
          throw error;
        })
    `,
    awaitPromise: true
  });
  
  if (result.error) {
    console.log('Async operation failed:', result.message);
  } else {
    console.log('Async operation succeeded:', result.value);
  }
  
  return result;
}
```

### Code Coverage Analysis

```javascript
// Analyze code coverage for testing
async function analyzeCoverage() {
  // Start coverage collection
  const coverageStart = await browser_get_javascript_coverage({
    startCoverage: true
  });
  
  // Execute code that you want to measure
  await browser_evaluate_javascript({
    code: `
      // Simulate user interactions
      document.querySelector('button#test')?.click();
      document.querySelector('input#name')?.focus();
      
      // Call some functions
      if (typeof appInit === 'function') appInit();
      if (typeof validateForm === 'function') validateForm();
    `
  });
  
  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get coverage results
  const coverage = await browser_get_javascript_coverage({
    startCoverage: false
  });
  
  // Analyze coverage
  coverage.coverage.forEach(script => {
    const totalFunctions = script.functions.length;
    const executedFunctions = script.functions.filter(fn => 
      fn.ranges.some(range => range.count > 0)
    ).length;
    
    const coveragePercent = (executedFunctions / totalFunctions * 100).toFixed(1);
    
    console.log(`${script.url}: ${coveragePercent}% coverage (${executedFunctions}/${totalFunctions} functions)`);
  });
  
  return coverage;
}
```

## 💾 Memory Analysis Examples

### Memory Leak Detection

```javascript
// Monitor memory usage over time
async function detectMemoryLeaks() {
  const measurements = [];
  
  // Take initial measurement
  let memoryUsage = await browser_get_memory_usage();
  measurements.push({
    timestamp: Date.now(),
    jsHeap: memoryUsage.jsHeap.usedJSHeapSize,
    domNodes: memoryUsage.dom.nodes
  });
  
  console.log('Initial memory usage:', memoryUsage);
  
  // Simulate operations that might cause memory leaks
  for (let i = 0; i < 5; i++) {
    await browser_evaluate_javascript({
      code: `
        // Simulate memory-intensive operations
        let largeArray = new Array(100000).fill('test data');
        let elements = [];
        
        for (let j = 0; j < 1000; j++) {
          let div = document.createElement('div');
          div.innerHTML = 'Memory test ' + j;
          elements.push(div);
        }
        
        // Intentionally don't clean up to test memory monitoring
      `
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    memoryUsage = await browser_get_memory_usage();
    measurements.push({
      timestamp: Date.now(),
      jsHeap: memoryUsage.jsHeap.usedJSHeapSize,
      domNodes: memoryUsage.dom.nodes
    });
    
    console.log(`Measurement ${i + 2}:`, memoryUsage);
  }
  
  // Analyze trend
  const heapGrowth = measurements[measurements.length - 1].jsHeap - measurements[0].jsHeap;
  const nodeGrowth = measurements[measurements.length - 1].domNodes - measurements[0].domNodes;
  
  console.log(`Memory analysis complete:`);
  console.log(`- Heap growth: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- DOM node growth: ${nodeGrowth} nodes`);
  
  if (heapGrowth > 10 * 1024 * 1024) { // 10MB
    console.warn('Potential memory leak detected: significant heap growth');
  }
  
  return measurements;
}
```

### Heap Snapshot Analysis

```javascript
// Take and analyze heap snapshots
async function analyzeHeapSnapshot() {
  // Take snapshot
  const snapshot = await browser_take_heap_snapshot({
    format: 'summary'
  });
  
  console.log('Heap Snapshot Summary:');
  console.log(`- Total nodes: ${snapshot.nodeCount.toLocaleString()}`);
  console.log(`- Total edges: ${snapshot.edgeCount.toLocaleString()}`);
  console.log(`- Total size: ${(snapshot.totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Compare with previous snapshot if available
  const previousSnapshot = localStorage.getItem('previousHeapSnapshot');
  if (previousSnapshot) {
    const prev = JSON.parse(previousSnapshot);
    const nodeGrowth = snapshot.nodeCount - prev.nodeCount;
    const sizeGrowth = (snapshot.totalSize - prev.totalSize) / 1024 / 1024;
    
    console.log('Comparison with previous snapshot:');
    console.log(`- Node growth: ${nodeGrowth > 0 ? '+' : ''}${nodeGrowth}`);
    console.log(`- Size growth: ${sizeGrowth > 0 ? '+' : ''}${sizeGrowth.toFixed(2)} MB`);
  }
  
  // Store for next comparison
  localStorage.setItem('previousHeapSnapshot', JSON.stringify(snapshot));
  
  return snapshot;
}
```

## 🔐 Security Analysis Examples

### Security Audit

```javascript
// Comprehensive security check
async function performSecurityAudit() {
  // Get security state
  const securityState = await browser_get_security_state();
  
  console.log('Security State:', securityState);
  
  // Check for common security issues
  const securityIssues = [];
  
  // Check HTTPS usage
  const currentUrl = await browser_evaluate_javascript({
    code: 'window.location.href'
  });
  
  if (!currentUrl.value.startsWith('https://')) {
    securityIssues.push('Not using HTTPS');
  }
  
  // Check for mixed content
  const mixedContent = await browser_evaluate_javascript({
    code: `
      const insecureResources = [];
      
      // Check images
      Array.from(document.images).forEach(img => {
        if (img.src.startsWith('http://')) {
          insecureResources.push({ type: 'image', url: img.src });
        }
      });
      
      // Check scripts
      Array.from(document.scripts).forEach(script => {
        if (script.src.startsWith('http://')) {
          insecureResources.push({ type: 'script', url: script.src });
        }
      });
      
      return insecureResources;
    `
  });
  
  if (mixedContent.value.length > 0) {
    securityIssues.push(`Mixed content detected: ${mixedContent.value.length} insecure resources`);
  }
  
  // Check for security headers (via network requests)
  const requests = await browser_get_network_requests({
    filter: "document"
  });
  
  const mainRequest = requests.find(req => req.type === 'document');
  if (mainRequest && mainRequest.responseHeaders) {
    const headers = mainRequest.responseHeaders;
    
    if (!headers['content-security-policy']) {
      securityIssues.push('Missing Content Security Policy');
    }
    
    if (!headers['x-frame-options'] && !headers['frame-ancestors']) {
      securityIssues.push('Missing X-Frame-Options or CSP frame-ancestors');
    }
    
    if (!headers['x-content-type-options']) {
      securityIssues.push('Missing X-Content-Type-Options');
    }
  }
  
  console.log('Security Audit Results:');
  if (securityIssues.length === 0) {
    console.log('✅ No major security issues detected');
  } else {
    console.log('⚠️ Security issues found:');
    securityIssues.forEach(issue => console.log(`- ${issue}`));
  }
  
  return {
    securityState,
    issues: securityIssues,
    mixedContent: mixedContent.value
  };
}
```

## 🗄️ Storage Analysis Examples

### Storage Usage Analysis

```javascript
// Analyze all storage usage
async function analyzeStorage() {
  const storageData = await browser_get_storage_data({
    storageType: 'all'
  });
  
  console.log('Storage Analysis:');
  
  // Analyze localStorage
  if (storageData.localStorage) {
    const localStorageSize = JSON.stringify(storageData.localStorage).length;
    console.log(`localStorage: ${storageData.localStorage.length} items, ${(localStorageSize / 1024).toFixed(2)} KB`);
  }
  
  // Analyze sessionStorage
  if (storageData.sessionStorage) {
    const sessionStorageSize = JSON.stringify(storageData.sessionStorage).length;
    console.log(`sessionStorage: ${storageData.sessionStorage.length} items, ${(sessionStorageSize / 1024).toFixed(2)} KB`);
  }
  
  // Analyze cookies
  if (storageData.cookies) {
    const totalCookieSize = storageData.cookies.reduce((sum, cookie) => sum + cookie.size, 0);
    console.log(`Cookies: ${storageData.cookies.length} cookies, ${(totalCookieSize / 1024).toFixed(2)} KB`);
    
    // Check for security issues in cookies
    const insecureCookies = storageData.cookies.filter(cookie => 
      !cookie.secure && window.location.protocol === 'https:'
    );
    
    if (insecureCookies.length > 0) {
      console.warn(`⚠️ ${insecureCookies.length} cookies are not marked as secure on HTTPS site`);
    }
  }
  
  // Analyze IndexedDB
  if (storageData.indexedDB) {
    console.log(`IndexedDB: ${storageData.indexedDB.length} databases`);
    storageData.indexedDB.forEach(dbName => {
      console.log(`- Database: ${dbName}`);
    });
  }
  
  return storageData;
}
```

## 📝 Console Monitoring Examples

### Error Tracking

```javascript
// Monitor and analyze console errors
async function monitorConsoleErrors() {
  // Clear existing logs
  await browser_evaluate_javascript({
    code: 'console.clear()'
  });
  
  // Trigger some operations that might generate console messages
  await browser_evaluate_javascript({
    code: `
      console.log('Starting error monitoring test');
      console.warn('This is a warning message');
      console.error('This is an error message');
      
      try {
        nonExistentFunction();
      } catch (error) {
        console.error('Caught error:', error);
      }
    `
  });
  
  // Wait for messages to be logged
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get console logs
  const consoleLogs = await browser_get_console_logs();
  
  // Analyze logs
  const errorMessages = consoleLogs.filter(log => log.level === 'error');
  const warningMessages = consoleLogs.filter(log => log.level === 'warn');
  
  console.log('Console Analysis:');
  console.log(`- Total messages: ${consoleLogs.length}`);
  console.log(`- Errors: ${errorMessages.length}`);
  console.log(`- Warnings: ${warningMessages.length}`);
  
  if (errorMessages.length > 0) {
    console.log('Error Messages:');
    errorMessages.forEach(error => {
      console.log(`- ${error.text}`);
      if (error.stackTrace) {
        console.log(`  Stack: ${error.stackTrace[0]?.functionName || 'Unknown'}`);
      }
    });
  }
  
  return {
    total: consoleLogs.length,
    errors: errorMessages,
    warnings: warningMessages,
    allLogs: consoleLogs
  };
}
```

## 🔄 Complete Workflow Examples

### E2E Performance Testing

```javascript
// Complete end-to-end performance testing workflow
async function performanceTestWorkflow() {
  console.log('🚀 Starting comprehensive performance test...');
  
  // 1. Clear all logs and caches
  await browser_clear_network_log();
  
  // 2. Start performance monitoring
  const initialMetrics = await browser_get_performance_metrics();
  const initialMemory = await browser_get_memory_usage();
  
  console.log('📊 Initial state recorded');
  
  // 3. Start profiling
  await browser_start_performance_profiling({
    categories: ['js', 'rendering', 'loading']
  });
  
  // 4. Simulate user journey
  await browser_evaluate_javascript({
    code: `
      // Simulate complex user interaction
      function simulateUserJourney() {
        // Navigate through different sections
        const sections = ['home', 'products', 'cart', 'checkout'];
        
        sections.forEach((section, index) => {
          setTimeout(() => {
            console.log('Navigating to:', section);
            
            // Simulate data loading
            fetch('/api/' + section)
              .then(response => response.json())
              .then(data => console.log(section + ' data loaded'))
              .catch(error => console.error(section + ' error:', error));
            
            // Simulate DOM manipulation
            for (let i = 0; i < 100; i++) {
              const element = document.createElement('div');
              element.innerHTML = section + ' content ' + i;
              document.body.appendChild(element);
            }
          }, index * 2000);
        });
      }
      
      simulateUserJourney();
    `
  });
  
  // 5. Wait for journey to complete
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 6. Stop profiling and collect data
  const profileData = await browser_stop_performance_profiling();
  const finalMetrics = await browser_get_performance_metrics();
  const finalMemory = await browser_get_memory_usage();
  const networkRequests = await browser_get_network_requests({ filter: 'all' });
  
  // 7. Analyze results
  const analysis = {
    coreWebVitals: finalMetrics.coreWebVitals,
    memoryGrowth: {
      jsHeap: finalMemory.jsHeap.usedJSHeapSize - initialMemory.jsHeap.usedJSHeapSize,
      domNodes: finalMemory.dom.nodes - initialMemory.dom.nodes
    },
    networkSummary: {
      totalRequests: networkRequests.length,
      slowRequests: networkRequests.filter(req => req.responseTime > 1000).length,
      failedRequests: networkRequests.filter(req => req.status >= 400).length
    },
    profileData: profileData
  };
  
  console.log('📈 Performance Test Results:', analysis);
  
  // 8. Generate recommendations
  const recommendations = [];
  
  if (analysis.coreWebVitals.LCP > 2500) {
    recommendations.push('Optimize Largest Contentful Paint (LCP)');
  }
  
  if (analysis.memoryGrowth.jsHeap > 10 * 1024 * 1024) {
    recommendations.push('Investigate potential memory leaks');
  }
  
  if (analysis.networkSummary.slowRequests > 0) {
    recommendations.push(`Optimize ${analysis.networkSummary.slowRequests} slow network requests`);
  }
  
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:', recommendations);
  } else {
    console.log('✅ Performance looks good!');
  }
  
  return analysis;
}
```

This comprehensive API examples document provides real-world usage scenarios for all DevTools features, helping developers understand how to effectively use the BrowserMCP integration in their projects.
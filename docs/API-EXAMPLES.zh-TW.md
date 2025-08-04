# BrowserMCP DevTools API 使用範例

所有 DevTools 整合功能的完整使用範例，涵蓋實際應用情境。

## 🌐 網路監控範例

### 基本網路請求監控

```javascript
// 取得所有網路請求
const allRequests = await browser_get_network_requests({
  filter: "all"
});

// 只取得 XHR/Fetch 請求 (AJAX 呼叫)
const ajaxRequests = await browser_get_network_requests({
  filter: "xhr",
  includeResponseBody: true
});

// 取得特定資源類型
const imageRequests = await browser_get_network_requests({
  filter: "image"
});

const scriptRequests = await browser_get_network_requests({
  filter: "script"
});
```

### 實際應用情境：API 除錯

```javascript
// 透過監控 XHR 請求來除錯 API 呼叫
async function debugApiCalls() {
  // 清除先前的記錄
  await browser_clear_network_log();
  
  // 觸發會產生 API 呼叫的動作
  await browser_evaluate_javascript({
    code: `
      fetch('/api/users')
        .then(response => response.json())
        .then(data => console.log('使用者資料已載入:', data));
    `
  });
  
  // 等待請求完成
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 取得所有 API 請求
  const apiRequests = await browser_get_network_requests({
    filter: "xhr",
    includeResponseBody: true
  });
  
  // 分析結果
  apiRequests.forEach(request => {
    if (request.url.includes('/api/')) {
      console.log(`API 呼叫: ${request.method} ${request.url}`);
      console.log(`狀態: ${request.status} ${request.statusText}`);
      console.log(`回應時間: ${request.responseTime}ms`);
      if (request.status >= 400) {
        console.log(`錯誤回應:`, request.responseBody);
      }
    }
  });
}
```

### 效能分析

```javascript
// 監控緩慢的網路請求
async function findSlowRequests() {
  const requests = await browser_get_network_requests({
    filter: "all"
  });
  
  const slowRequests = requests
    .filter(req => req.responseTime > 2000) // 超過 2 秒的請求
    .sort((a, b) => b.responseTime - a.responseTime);
  
  console.log('偵測到緩慢請求:');
  slowRequests.forEach(req => {
    console.log(`${req.url}: ${req.responseTime}ms`);
  });
}
```

## ⚡ 效能監控範例

### Core Web Vitals 監控

```javascript
// 取得完整效能指標
async function checkPerformance() {
  const metrics = await browser_get_performance_metrics();
  
  const { coreWebVitals } = metrics;
  
  // 檢查 Core Web Vitals 閾值
  const vitalsCheck = {
    LCP: {
      value: coreWebVitals.LCP,
      status: coreWebVitals.LCP <= 2500 ? '良好' : 
              coreWebVitals.LCP <= 4000 ? '需要改善' : '差',
      threshold: '≤ 2.5s'
    },
    FID: {
      value: coreWebVitals.FID,
      status: coreWebVitals.FID <= 100 ? '良好' : 
              coreWebVitals.FID <= 300 ? '需要改善' : '差',
      threshold: '≤ 100ms'
    },
    CLS: {
      value: coreWebVitals.CLS,
      status: coreWebVitals.CLS <= 0.1 ? '良好' : 
              coreWebVitals.CLS <= 0.25 ? '需要改善' : '差',
      threshold: '≤ 0.1'
    }
  };
  
  console.log('Core Web Vitals 評估:', vitalsCheck);
  return vitalsCheck;
}
```

### 效能分析工作流程

```javascript
// 完整的效能分析流程
async function profilePerformance() {
  console.log('開始效能分析...');
  
  // 開始分析
  await browser_start_performance_profiling({
    categories: ['js', 'rendering']
  });
  
  // 模擬使用者互動或觸發高效能需求的操作
  await browser_evaluate_javascript({
    code: `
      // 模擬大量運算
      function heavyTask() {
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.random();
        }
        return result;
      }
      
      // 模擬 DOM 操作
      function domManipulation() {
        for (let i = 0; i < 1000; i++) {
          const div = document.createElement('div');
          div.textContent = '測試 ' + i;
          document.body.appendChild(div);
        }
      }
      
      heavyTask();
      domManipulation();
    `
  });
  
  // 等待操作完成
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 停止分析並取得結果
  const profileResult = await browser_stop_performance_profiling();
  console.log('分析完成:', profileResult);
  
  return profileResult;
}
```

## 🔍 DOM 檢查範例

### 元素分析

```javascript
// 徹底檢查特定元素
async function inspectButton() {
  const buttonInfo = await browser_inspect_element({
    selector: 'button.submit-btn',
    includeStyles: true,
    includeEventListeners: true,
    includeAccessibility: true
  });
  
  if (buttonInfo.error) {
    console.log('找不到按鈕:', buttonInfo.error);
    return;
  }
  
  console.log('按鈕分析:');
  console.log('- 屬性:', buttonInfo.attributes);
  console.log('- 事件監聽器:', buttonInfo.eventListeners);
  console.log('- 無障礙屬性:', buttonInfo.accessibility);
  
  // 檢查常見問題
  const issues = [];
  
  // 檢查無障礙性
  if (!buttonInfo.attributes.includes('aria-label') && 
      !buttonInfo.attributes.includes('aria-labelledby')) {
    issues.push('缺少 ARIA 標籤');
  }
  
  // 檢查事件監聽器
  if (!buttonInfo.eventListeners.some(listener => listener.type === 'click')) {
    issues.push('缺少點擊事件監聽器');
  }
  
  if (issues.length > 0) {
    console.log('發現問題:', issues);
  }
  
  return buttonInfo;
}
```

### 表單驗證分析

```javascript
// 分析表單結構和驗證
async function analyzeForm() {
  const formInfo = await browser_inspect_element({
    selector: 'form',
    includeStyles: true,
    includeEventListeners: true
  });
  
  // 取得所有表單輸入
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
  
  console.log('表單分析:');
  console.log('- 表單資訊:', formInfo);
  console.log('- 輸入欄位:', inputs.value);
  
  // 檢查驗證狀態
  const invalidInputs = inputs.value.filter(input => !input.valid);
  if (invalidInputs.length > 0) {
    console.log('無效輸入:', invalidInputs);
  }
}
```

## 💻 JavaScript 執行範例

### 程式碼測試和除錯

```javascript
// 在頁面環境中測試 JavaScript 函數
async function testPageFunction() {
  // 測試頁面上可能存在的函數
  const result = await browser_evaluate_javascript({
    code: `
      if (typeof myPageFunction === 'function') {
        try {
          const result = myPageFunction('測試輸入');
          return { success: true, result: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: '找不到函數' };
      }
    `,
    awaitPromise: false
  });
  
  console.log('函數測試結果:', result);
  return result;
}
```

### 非同步操作測試

```javascript
// 測試非同步操作
async function testAsyncOperation() {
  const result = await browser_evaluate_javascript({
    code: `
      fetch('/api/test')
        .then(response => response.json())
        .then(data => {
          console.log('API 回應:', data);
          return data;
        })
        .catch(error => {
          console.error('API 錯誤:', error);
          throw error;
        })
    `,
    awaitPromise: true
  });
  
  if (result.error) {
    console.log('非同步操作失敗:', result.message);
  } else {
    console.log('非同步操作成功:', result.value);
  }
  
  return result;
}
```

### 程式碼覆蓋率分析

```javascript
// 分析測試的程式碼覆蓋率
async function analyzeCoverage() {
  // 開始收集覆蓋率
  const coverageStart = await browser_get_javascript_coverage({
    startCoverage: true
  });
  
  // 執行要測量的程式碼
  await browser_evaluate_javascript({
    code: `
      // 模擬使用者互動
      document.querySelector('button#test')?.click();
      document.querySelector('input#name')?.focus();
      
      // 呼叫一些函數
      if (typeof appInit === 'function') appInit();
      if (typeof validateForm === 'function') validateForm();
    `
  });
  
  // 等待執行完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 取得覆蓋率結果
  const coverage = await browser_get_javascript_coverage({
    startCoverage: false
  });
  
  // 分析覆蓋率
  coverage.coverage.forEach(script => {
    const totalFunctions = script.functions.length;
    const executedFunctions = script.functions.filter(fn => 
      fn.ranges.some(range => range.count > 0)
    ).length;
    
    const coveragePercent = (executedFunctions / totalFunctions * 100).toFixed(1);
    
    console.log(`${script.url}: ${coveragePercent}% 覆蓋率 (${executedFunctions}/${totalFunctions} 函數)`);
  });
  
  return coverage;
}
```

## 💾 記憶體分析範例

### 記憶體洩漏偵測

```javascript
// 監控一段時間內的記憶體使用
async function detectMemoryLeaks() {
  const measurements = [];
  
  // 取得初始測量值
  let memoryUsage = await browser_get_memory_usage();
  measurements.push({
    timestamp: Date.now(),
    jsHeap: memoryUsage.jsHeap.usedJSHeapSize,
    domNodes: memoryUsage.dom.nodes
  });
  
  console.log('初始記憶體使用:', memoryUsage);
  
  // 模擬可能導致記憶體洩漏的操作
  for (let i = 0; i < 5; i++) {
    await browser_evaluate_javascript({
      code: `
        // 模擬記憶體密集型操作
        let largeArray = new Array(100000).fill('測試資料');
        let elements = [];
        
        for (let j = 0; j < 1000; j++) {
          let div = document.createElement('div');
          div.innerHTML = '記憶體測試 ' + j;
          elements.push(div);
        }
        
        // 故意不清理來測試記憶體監控
      `
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    memoryUsage = await browser_get_memory_usage();
    measurements.push({
      timestamp: Date.now(),
      jsHeap: memoryUsage.jsHeap.usedJSHeapSize,
      domNodes: memoryUsage.dom.nodes
    });
    
    console.log(`測量 ${i + 2}:`, memoryUsage);
  }
  
  // 分析趨勢
  const heapGrowth = measurements[measurements.length - 1].jsHeap - measurements[0].jsHeap;
  const nodeGrowth = measurements[measurements.length - 1].domNodes - measurements[0].domNodes;
  
  console.log(`記憶體分析完成:`);
  console.log(`- Heap 成長: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- DOM 節點成長: ${nodeGrowth} 個節點`);
  
  if (heapGrowth > 10 * 1024 * 1024) { // 10MB
    console.warn('偵測到潛在記憶體洩漏：顯著的 heap 成長');
  }
  
  return measurements;
}
```

### Heap 快照分析

```javascript
// 取得並分析 heap 快照
async function analyzeHeapSnapshot() {
  // 取得快照
  const snapshot = await browser_take_heap_snapshot({
    format: 'summary'
  });
  
  console.log('Heap 快照摘要:');
  console.log(`- 總節點數: ${snapshot.nodeCount.toLocaleString()}`);
  console.log(`- 總邊數: ${snapshot.edgeCount.toLocaleString()}`);
  console.log(`- 總大小: ${(snapshot.totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // 與前一個快照比較（如果有的話）
  const previousSnapshot = localStorage.getItem('previousHeapSnapshot');
  if (previousSnapshot) {
    const prev = JSON.parse(previousSnapshot);
    const nodeGrowth = snapshot.nodeCount - prev.nodeCount;
    const sizeGrowth = (snapshot.totalSize - prev.totalSize) / 1024 / 1024;
    
    console.log('與前一個快照的比較:');
    console.log(`- 節點成長: ${nodeGrowth > 0 ? '+' : ''}${nodeGrowth}`);
    console.log(`- 大小成長: ${sizeGrowth > 0 ? '+' : ''}${sizeGrowth.toFixed(2)} MB`);
  }
  
  // 儲存供下次比較
  localStorage.setItem('previousHeapSnapshot', JSON.stringify(snapshot));
  
  return snapshot;
}
```

## 🔐 安全分析範例

### 安全稽核

```javascript
// 全面安全檢查
async function performSecurityAudit() {
  // 取得安全狀態
  const securityState = await browser_get_security_state();
  
  console.log('安全狀態:', securityState);
  
  // 檢查常見安全問題
  const securityIssues = [];
  
  // 檢查 HTTPS 使用
  const currentUrl = await browser_evaluate_javascript({
    code: 'window.location.href'
  });
  
  if (!currentUrl.value.startsWith('https://')) {
    securityIssues.push('未使用 HTTPS');
  }
  
  // 檢查混合內容
  const mixedContent = await browser_evaluate_javascript({
    code: `
      const insecureResources = [];
      
      // 檢查圖片
      Array.from(document.images).forEach(img => {
        if (img.src.startsWith('http://')) {
          insecureResources.push({ type: 'image', url: img.src });
        }
      });
      
      // 檢查腳本
      Array.from(document.scripts).forEach(script => {
        if (script.src.startsWith('http://')) {
          insecureResources.push({ type: 'script', url: script.src });
        }
      });
      
      return insecureResources;
    `
  });
  
  if (mixedContent.value.length > 0) {
    securityIssues.push(`偵測到混合內容: ${mixedContent.value.length} 個不安全資源`);
  }
  
  // 檢查安全標頭（透過網路請求）
  const requests = await browser_get_network_requests({
    filter: "document"
  });
  
  const mainRequest = requests.find(req => req.type === 'document');
  if (mainRequest && mainRequest.responseHeaders) {
    const headers = mainRequest.responseHeaders;
    
    if (!headers['content-security-policy']) {
      securityIssues.push('缺少內容安全政策 (CSP)');
    }
    
    if (!headers['x-frame-options'] && !headers['frame-ancestors']) {
      securityIssues.push('缺少 X-Frame-Options 或 CSP frame-ancestors');
    }
    
    if (!headers['x-content-type-options']) {
      securityIssues.push('缺少 X-Content-Type-Options');
    }
  }
  
  console.log('安全稽核結果:');
  if (securityIssues.length === 0) {
    console.log('✅ 未偵測到主要安全問題');
  } else {
    console.log('⚠️ 發現安全問題:');
    securityIssues.forEach(issue => console.log(`- ${issue}`));
  }
  
  return {
    securityState,
    issues: securityIssues,
    mixedContent: mixedContent.value
  };
}
```

## 🗄️ 儲存分析範例

### 儲存使用分析

```javascript
// 分析所有儲存使用情況
async function analyzeStorage() {
  const storageData = await browser_get_storage_data({
    storageType: 'all'
  });
  
  console.log('儲存分析:');
  
  // 分析 localStorage
  if (storageData.localStorage) {
    const localStorageSize = JSON.stringify(storageData.localStorage).length;
    console.log(`localStorage: ${storageData.localStorage.length} 個項目，${(localStorageSize / 1024).toFixed(2)} KB`);
  }
  
  // 分析 sessionStorage
  if (storageData.sessionStorage) {
    const sessionStorageSize = JSON.stringify(storageData.sessionStorage).length;
    console.log(`sessionStorage: ${storageData.sessionStorage.length} 個項目，${(sessionStorageSize / 1024).toFixed(2)} KB`);
  }
  
  // 分析 cookies
  if (storageData.cookies) {
    const totalCookieSize = storageData.cookies.reduce((sum, cookie) => sum + cookie.size, 0);
    console.log(`Cookies: ${storageData.cookies.length} 個 cookies，${(totalCookieSize / 1024).toFixed(2)} KB`);
    
    // 檢查 cookies 的安全問題
    const insecureCookies = storageData.cookies.filter(cookie => 
      !cookie.secure && window.location.protocol === 'https:'
    );
    
    if (insecureCookies.length > 0) {
      console.warn(`⚠️ ${insecureCookies.length} 個 cookies 在 HTTPS 網站上未標記為安全`);
    }
  }
  
  // 分析 IndexedDB
  if (storageData.indexedDB) {
    console.log(`IndexedDB: ${storageData.indexedDB.length} 個資料庫`);
    storageData.indexedDB.forEach(dbName => {
      console.log(`- 資料庫: ${dbName}`);
    });
  }
  
  return storageData;
}
```

## 📝 控制台監控範例

### 錯誤追蹤

```javascript
// 監控和分析控制台錯誤
async function monitorConsoleErrors() {
  // 清除現有記錄
  await browser_evaluate_javascript({
    code: 'console.clear()'
  });
  
  // 觸發一些可能產生控制台訊息的操作
  await browser_evaluate_javascript({
    code: `
      console.log('開始錯誤監控測試');
      console.warn('這是一個警告訊息');
      console.error('這是一個錯誤訊息');
      
      try {
        nonExistentFunction();
      } catch (error) {
        console.error('捕獲錯誤:', error);
      }
    `
  });
  
  // 等待訊息記錄
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 取得控制台記錄
  const consoleLogs = await browser_get_console_logs();
  
  // 分析記錄
  const errorMessages = consoleLogs.filter(log => log.level === 'error');
  const warningMessages = consoleLogs.filter(log => log.level === 'warn');
  
  console.log('控制台分析:');
  console.log(`- 總訊息數: ${consoleLogs.length}`);
  console.log(`- 錯誤: ${errorMessages.length}`);
  console.log(`- 警告: ${warningMessages.length}`);
  
  if (errorMessages.length > 0) {
    console.log('錯誤訊息:');
    errorMessages.forEach(error => {
      console.log(`- ${error.text}`);
      if (error.stackTrace) {
        console.log(`  堆疊: ${error.stackTrace[0]?.functionName || '未知'}`);
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

## 🔄 完整工作流程範例

### 端對端效能測試

```javascript
// 完整的端對端效能測試工作流程
async function performanceTestWorkflow() {
  console.log('🚀 開始全面效能測試...');
  
  // 1. 清除所有記錄和快取
  await browser_clear_network_log();
  
  // 2. 開始效能監控
  const initialMetrics = await browser_get_performance_metrics();
  const initialMemory = await browser_get_memory_usage();
  
  console.log('📊 初始狀態已記錄');
  
  // 3. 開始分析
  await browser_start_performance_profiling({
    categories: ['js', 'rendering', 'loading']
  });
  
  // 4. 模擬使用者旅程
  await browser_evaluate_javascript({
    code: `
      // 模擬複雜的使用者互動
      function simulateUserJourney() {
        // 導覽不同區塊
        const sections = ['home', 'products', 'cart', 'checkout'];
        
        sections.forEach((section, index) => {
          setTimeout(() => {
            console.log('導覽至:', section);
            
            // 模擬資料載入
            fetch('/api/' + section)
              .then(response => response.json())
              .then(data => console.log(section + ' 資料已載入'))
              .catch(error => console.error(section + ' 錯誤:', error));
            
            // 模擬 DOM 操作
            for (let i = 0; i < 100; i++) {
              const element = document.createElement('div');
              element.innerHTML = section + ' 內容 ' + i;
              document.body.appendChild(element);
            }
          }, index * 2000);
        });
      }
      
      simulateUserJourney();
    `
  });
  
  // 5. 等待旅程完成
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 6. 停止分析並收集資料
  const profileData = await browser_stop_performance_profiling();
  const finalMetrics = await browser_get_performance_metrics();
  const finalMemory = await browser_get_memory_usage();
  const networkRequests = await browser_get_network_requests({ filter: 'all' });
  
  // 7. 分析結果
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
  
  console.log('📈 效能測試結果:', analysis);
  
  // 8. 產生建議
  const recommendations = [];
  
  if (analysis.coreWebVitals.LCP > 2500) {
    recommendations.push('優化最大內容繪製 (LCP)');
  }
  
  if (analysis.memoryGrowth.jsHeap > 10 * 1024 * 1024) {
    recommendations.push('調查潛在的記憶體洩漏');
  }
  
  if (analysis.networkSummary.slowRequests > 0) {
    recommendations.push(`優化 ${analysis.networkSummary.slowRequests} 個緩慢的網路請求`);
  }
  
  if (recommendations.length > 0) {
    console.log('💡 建議:', recommendations);
  } else {
    console.log('✅ 效能看起來不錯！');
  }
  
  return analysis;
}
```

這份全面的 API 範例文件提供了所有 DevTools 功能的實際應用情境，幫助開發者了解如何在專案中有效使用 BrowserMCP 整合。
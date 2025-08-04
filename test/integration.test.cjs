/**
 * 整合測試 - 測試 DevTools 功能的完整工作流程
 */

const assert = require('assert');
const { WebSocket } = require('ws');
const { spawn } = require('child_process');

// 測試配置
const WS_URL = process.env.WS_URL || 'ws://localhost:9002';
const TEST_TIMEOUT = 60000; // 增加到 60 秒以適應整合測試

// 測試助手函數
async function sendMessage(ws, type, payload) {
  return new Promise((resolve, reject) => {
    const message = {
      id: Date.now() + Math.random(),
      type,
      payload
    };

    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout for ${type}`));
    }, TEST_TIMEOUT);

    const handler = (data) => {
      try {
        const response = JSON.parse(data);
        if (response.id === message.id) {
          clearTimeout(timeout);
          ws.removeListener('message', handler);
          
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.payload);
          }
        }
      } catch (error) {
        reject(new Error('Invalid JSON response'));
      }
    };

    ws.on('message', handler);
    ws.send(JSON.stringify(message));
  });
}

// 等待函數
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 模擬網頁內容
async function setupTestPage(ws) {
  // 導航到測試頁面或建立基本的 HTML 結構
  await sendMessage(ws, 'browser_evaluate_javascript', {
    code: `
      // 建立測試用的 DOM 結構
      document.body.innerHTML = \`
        <div id="test-container">
          <h1 id="test-title">測試頁面</h1>
          <button id="test-button" onclick="console.log('按鈕被點擊')">測試按鈕</button>
          <form id="test-form">
            <input type="text" id="test-input" name="testInput" required>
            <input type="email" id="test-email" name="testEmail" required>
            <button type="submit">提交</button>
          </form>
          <div id="dynamic-content"></div>
        </div>
      \`;
      
      // 添加一些 CSS
      const style = document.createElement('style');
      style.textContent = \`
        #test-container { padding: 20px; background: #f0f0f0; }
        #test-button { background: blue; color: white; padding: 10px; }
        .dynamic-item { margin: 5px; padding: 10px; border: 1px solid #ccc; }
      \`;
      document.head.appendChild(style);
      
      // 記錄初始化完成
      console.log('測試頁面初始化完成');
    `
  });
}

// 完整工作流程測試套件
describe('DevTools Integration Workflows', function() {
  this.timeout(TEST_TIMEOUT);
  
  let ws;
  let mcpServer;

  before(async function() {
    // 啟動 MCP 伺服器（如果需要）
    // mcpServer = spawn('npm', ['run', 'watch'], { stdio: 'pipe' });
    
    // 等待伺服器啟動
    await sleep(2000);
    
    // 建立 WebSocket 連接
    ws = new WebSocket(WS_URL);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // 設定測試頁面
    await setupTestPage(ws);
  });

  after(function() {
    if (ws) {
      ws.close();
    }
    
    if (mcpServer) {
      mcpServer.kill();
    }
  });

  describe('端對端效能分析工作流程', function() {
    it('應該執行完整的效能分析流程', async function() {
      // 1. 清除網路記錄
      await sendMessage(ws, 'browser_clear_network_log', {});
      
      // 2. 取得初始效能指標
      const initialMetrics = await sendMessage(ws, 'browser_get_performance_metrics', {});
      assert(initialMetrics.coreWebVitals, '應該有 Core Web Vitals 資料');
      
      // 3. 開始效能分析
      const profilingStart = await sendMessage(ws, 'browser_start_performance_profiling', {
        categories: ['js', 'rendering']
      });
      assert(profilingStart.success === true, '效能分析應該成功開始');
      
      // 4. 執行一些操作來產生效能資料
      await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          // 模擬計算密集的操作
          function heavyComputation() {
            let result = 0;
            for (let i = 0; i < 100000; i++) {
              result += Math.sqrt(i) * Math.random();
            }
            return result;
          }
          
          // 模擬 DOM 操作
          function domOperations() {
            const container = document.getElementById('dynamic-content');
            for (let i = 0; i < 50; i++) {
              const div = document.createElement('div');
              div.className = 'dynamic-item';
              div.textContent = '動態項目 ' + i;
              container.appendChild(div);
            }
          }
          
          // 模擬網路請求
          async function networkRequests() {
            const promises = [];
            for (let i = 0; i < 3; i++) {
              promises.push(
                fetch('https://jsonplaceholder.typicode.com/posts/' + (i + 1))
                  .then(r => r.json())
                  .catch(() => ({ error: 'Request failed' }))
              );
            }
            return Promise.all(promises);
          }
          
          // 執行所有操作
          const computation = heavyComputation();
          domOperations();
          networkRequests().then(results => {
            console.log('網路請求完成:', results.length);
          });
          
          return computation;
        `,
        awaitPromise: false
      });
      
      // 5. 等待操作完成
      await sleep(3000);
      
      // 6. 停止效能分析
      const profilingResult = await sendMessage(ws, 'browser_stop_performance_profiling', {});
      assert(profilingResult.success === true, '效能分析應該成功停止');
      assert(profilingResult.profile, '應該回傳分析設定檔資料');
      
      // 7. 取得最終效能指標
      const finalMetrics = await sendMessage(ws, 'browser_get_performance_metrics', {});
      assert(finalMetrics.coreWebVitals, '應該有最終的 Core Web Vitals 資料');
      
      // 8. 取得網路請求
      const networkRequests = await sendMessage(ws, 'browser_get_network_requests', {
        filter: 'all'
      });
      assert(Array.isArray(networkRequests), '應該回傳網路請求陣列');
      
      // 9. 驗證結果
      console.log('效能分析完成:');
      console.log('- 分析設定檔有效:', !!profilingResult.profile);
      console.log('- 網路請求數量:', networkRequests.length);
      console.log('- Core Web Vitals:', finalMetrics.coreWebVitals);
    });
  });

  describe('使用者互動監控工作流程', function() {
    it('應該監控使用者互動和 DOM 變化', async function() {
      // 1. 檢查初始 DOM 狀態
      const initialDom = await sendMessage(ws, 'browser_inspect_element', {
        selector: '#test-container',
        includeStyles: true,
        includeEventListeners: true
      });
      assert(!initialDom.error, '應該能夠檢查初始 DOM');
      
      // 2. 清除控制台記錄
      await sendMessage(ws, 'browser_evaluate_javascript', {
        code: 'console.clear()'
      });
      
      // 3. 模擬使用者互動
      await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          // 模擬表單填寫
          const textInput = document.getElementById('test-input');
          const emailInput = document.getElementById('test-email');
          
          textInput.value = '測試使用者';
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          emailInput.value = 'test@example.com';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // 模擬按鈕點擊
          const button = document.getElementById('test-button');
          button.click();
          
          // 記錄互動
          console.log('使用者互動完成');
          
          // 回傳表單狀態
          return {
            textValue: textInput.value,
            emailValue: emailInput.value,
            formValid: document.getElementById('test-form').checkValidity()
          };
        `
      });
      
      // 4. 檢查 DOM 變化
      const updatedDom = await sendMessage(ws, 'browser_inspect_element', {
        selector: '#test-input',
        includeStyles: false,
        includeEventListeners: false
      });
      assert(!updatedDom.error, '應該能夠檢查更新後的 DOM');
      
      // 5. 檢查控制台記錄
      const consoleLogs = await sendMessage(ws, 'browser_get_console_logs', {});
      assert(Array.isArray(consoleLogs), '應該回傳控制台記錄陣列');
      
      const interactionLogs = consoleLogs.filter(log => 
        log.text.includes('使用者互動') || log.text.includes('按鈕被點擊')
      );
      assert(interactionLogs.length > 0, '應該有使用者互動記錄');
      
      console.log('使用者互動監控完成:');
      console.log('- 控制台記錄數量:', consoleLogs.length);
      console.log('- 互動記錄數量:', interactionLogs.length);
    });
  });

  describe('記憶體洩漏偵測工作流程', function() {
    it('應該偵測潛在的記憶體洩漏', async function() {
      // 1. 取得初始記憶體狀態
      const initialMemory = await sendMessage(ws, 'browser_get_memory_usage', {});
      assert(initialMemory.jsHeap, '應該有 JavaScript heap 資訊');
      
      console.log('初始記憶體使用:', {
        used: Math.round(initialMemory.jsHeap.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(initialMemory.jsHeap.totalJSHeapSize / 1024 / 1024) + 'MB'
      });
      
      // 2. 執行可能導致記憶體洩漏的操作
      for (let i = 0; i < 3; i++) {
        await sendMessage(ws, 'browser_evaluate_javascript', {
          code: `
            // 建立大量 DOM 元素
            const container = document.getElementById('dynamic-content');
            const elements = [];
            
            for (let j = 0; j < 1000; j++) {
              const div = document.createElement('div');
              div.innerHTML = '記憶體測試項目 ' + j + ' (循環 ${i})';
              div.dataset.testId = 'memory-test-' + j;
              container.appendChild(div);
              elements.push(div);
            }
            
            // 建立一些閉包來測試記憶體保留
            window.testClosures = window.testClosures || [];
            for (let k = 0; k < 100; k++) {
              window.testClosures.push(function() {
                return 'closure-' + k + '-cycle-' + ${i};
              });
            }
            
            console.log('記憶體測試循環 ${i} 完成');
            return elements.length;
          `
        });
        
        // 等待一些時間讓記憶體分配穩定
        await sleep(1000);
        
        // 測量記憶體使用
        const currentMemory = await sendMessage(ws, 'browser_get_memory_usage', {});
        console.log(`循環 ${i} 記憶體使用:`, {
          used: Math.round(currentMemory.jsHeap.usedJSHeapSize / 1024 / 1024) + 'MB',
          nodes: currentMemory.dom.nodes
        });
      }
      
      // 3. 取得最終記憶體狀態
      const finalMemory = await sendMessage(ws, 'browser_get_memory_usage', {});
      
      // 4. 計算記憶體增長
      const heapGrowth = finalMemory.jsHeap.usedJSHeapSize - initialMemory.jsHeap.usedJSHeapSize;
      const nodeGrowth = finalMemory.dom.nodes - initialMemory.dom.nodes;
      
      console.log('記憶體分析結果:');
      console.log('- Heap 增長:', Math.round(heapGrowth / 1024 / 1024) + 'MB');
      console.log('- DOM 節點增長:', nodeGrowth);
      
      // 5. 取得 heap 快照
      const heapSnapshot = await sendMessage(ws, 'browser_take_heap_snapshot', {
        format: 'summary'
      });
      
      if (!heapSnapshot.error) {
        console.log('Heap 快照:');
        console.log('- 節點數量:', heapSnapshot.nodeCount?.toLocaleString() || 'N/A');
        console.log('- 總大小:', heapSnapshot.totalSize ? 
          Math.round(heapSnapshot.totalSize / 1024 / 1024) + 'MB' : 'N/A');
      }
      
      // 驗證記憶體監控功能
      assert(typeof heapGrowth === 'number', '應該能夠計算 heap 增長');
      assert(typeof nodeGrowth === 'number', '應該能夠計算 DOM 節點增長');
      
      // 如果記憶體增長過多，發出警告（但不讓測試失敗）
      if (heapGrowth > 50 * 1024 * 1024) { // 50MB
        console.warn('⚠️ 偵測到顯著的記憶體增長，可能有記憶體洩漏');
      }
    });
  });

  describe('安全分析工作流程', function() {
    it('應該執行完整的安全檢查', async function() {
      // 1. 取得安全狀態
      const securityState = await sendMessage(ws, 'browser_get_security_state', {});
      console.log('安全狀態:', securityState);
      
      // 2. 檢查頁面 URL 和協議
      const urlInfo = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          return {
            url: window.location.href,
            protocol: window.location.protocol,
            origin: window.location.origin,
            isSecure: window.location.protocol === 'https:',
            hasServiceWorker: 'serviceWorker' in navigator
          };
        `
      });
      
      console.log('頁面資訊:', urlInfo.value);
      
      // 3. 檢查混合內容
      const mixedContentCheck = await sendMessage(ws, 'browser_evaluate_javascript', {
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
            if (script.src && script.src.startsWith('http://')) {
              insecureResources.push({ type: 'script', url: script.src });
            }
          });
          
          // 檢查樣式表
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              if (sheet.href && sheet.href.startsWith('http://')) {
                insecureResources.push({ type: 'stylesheet', url: sheet.href });
              }
            } catch (e) {
              // 跨域樣式表可能會拋出錯誤
            }
          });
          
          return {
            insecureResources,
            totalResources: document.images.length + document.scripts.length + document.styleSheets.length
          };
        `
      });
      
      console.log('混合內容檢查:', mixedContentCheck.value);
      
      // 4. 檢查儲存資料
      const storageData = await sendMessage(ws, 'browser_get_storage_data', {
        storageType: 'all'
      });
      
      // 分析儲存安全性
      let storageIssues = [];
      
      if (storageData.cookies) {
        const insecureCookies = storageData.cookies.filter(cookie => 
          !cookie.secure && urlInfo.value.protocol === 'https:'
        );
        if (insecureCookies.length > 0) {
          storageIssues.push(`${insecureCookies.length} 個 cookies 在 HTTPS 網站上未標記為安全`);
        }
      }
      
      console.log('儲存分析:');
      if (storageData.localStorage) console.log('- localStorage 項目:', storageData.localStorage.length);
      if (storageData.sessionStorage) console.log('- sessionStorage 項目:', storageData.sessionStorage.length);
      if (storageData.cookies) console.log('- Cookies:', storageData.cookies.length);
      if (storageIssues.length > 0) {
        console.log('- 儲存安全問題:', storageIssues);
      }
      
      // 驗證安全檢查功能
      assert(urlInfo.value.url, '應該能夠取得頁面 URL');
      assert(typeof mixedContentCheck.value.totalResources === 'number', '應該能夠檢查混合內容');
      assert(storageData, '應該能夠取得儲存資料');
    });
  });

  describe('錯誤處理和復原測試', function() {
    it('應該優雅地處理錯誤情況', async function() {
      // 1. 測試不存在的元素
      const nonExistentElement = await sendMessage(ws, 'browser_inspect_element', {
        selector: '#non-existent-element-12345'
      });
      assert(nonExistentElement.error, '應該回傳找不到元素的錯誤');
      
      // 2. 測試無效的 JavaScript
      const invalidJS = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: 'invalid javascript syntax {'
      });
      assert(invalidJS.error === true, '應該捕獲 JavaScript 語法錯誤');
      
      // 3. 測試異常處理
      const jsError = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: 'throw new Error("測試錯誤");'
      });
      assert(jsError.error === true, '應該捕獲 JavaScript 異常');
      assert(jsError.message.includes('測試錯誤'), '應該包含錯誤訊息');
      
      // 4. 測試逾時處理（模擬）
      const slowOperation = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          // 模擬緩慢操作
          const start = Date.now();
          while (Date.now() - start < 100) {
            // 短暫延遲
          }
          return 'completed';
        `
      });
      assert(slowOperation.value === 'completed', '應該能夠處理緩慢操作');
      
      console.log('錯誤處理測試完成:');
      console.log('- 元素未找到錯誤:', !!nonExistentElement.error);
      console.log('- JavaScript 語法錯誤:', !!invalidJS.error);
      console.log('- JavaScript 異常錯誤:', !!jsError.error);
      console.log('- 緩慢操作處理:', slowOperation.value === 'completed');
    });
  });

  describe('並發操作測試', function() {
    it('應該能夠處理並發請求', async function() {
      // 建立多個並發操作
      const operations = [
        sendMessage(ws, 'browser_get_performance_metrics', {}),
        sendMessage(ws, 'browser_get_memory_usage', {}),
        sendMessage(ws, 'browser_get_console_logs', {}),
        sendMessage(ws, 'browser_evaluate_javascript', {
          code: 'return "concurrent-test-1";'
        }),
        sendMessage(ws, 'browser_evaluate_javascript', {
          code: 'return "concurrent-test-2";'
        })
      ];
      
      // 等待所有操作完成
      const results = await Promise.all(operations);
      
      // 驗證結果
      assert(results.length === 5, '應該完成所有並發操作');
      assert(results[0].coreWebVitals, '效能指標請求應該成功');
      assert(results[1].jsHeap, '記憶體使用請求應該成功');
      assert(Array.isArray(results[2]), '控制台記錄請求應該成功');
      assert(results[3].value === 'concurrent-test-1', '第一個 JavaScript 執行應該成功');
      assert(results[4].value === 'concurrent-test-2', '第二個 JavaScript 執行應該成功');
      
      console.log('並發操作測試完成:');
      console.log('- 並發請求數量:', operations.length);
      console.log('- 成功完成數量:', results.filter(r => !r.error).length);
    });
  });
});

// 邊界條件測試
describe('邊界條件和壓力測試', function() {
  this.timeout(TEST_TIMEOUT);
  
  let ws;

  before(async function() {
    ws = new WebSocket(WS_URL);
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });
  });

  after(function() {
    if (ws) {
      ws.close();
    }
  });

  describe('大量資料處理', function() {
    it('應該能夠處理大量 DOM 元素', async function() {
      // 建立大量 DOM 元素
      const result = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          const container = document.createElement('div');
          container.id = 'large-container';
          document.body.appendChild(container);
          
          const elementCount = 1000;
          for (let i = 0; i < elementCount; i++) {
            const div = document.createElement('div');
            div.className = 'large-test-item';
            div.textContent = '大量測試項目 ' + i;
            div.dataset.index = i;
            container.appendChild(div);
          }
          
          return {
            created: elementCount,
            totalElements: document.querySelectorAll('.large-test-item').length
          };
        `
      });
      
      assert(result.value.created === 1000, '應該建立 1000 個元素');
      assert(result.value.totalElements === 1000, '應該能夠查詢到所有元素');
      
      // 檢查 DOM 樹
      const domTree = await sendMessage(ws, 'browser_get_dom_tree', {
        rootSelector: '#large-container',
        maxDepth: 2
      });
      
      assert(!domTree.error, '應該能夠取得大型 DOM 樹');
      console.log('大量 DOM 處理測試完成: DOM 元素數量:', result.value.totalElements);
    });

    it('應該能夠處理大量控制台訊息', async function() {
      // 產生大量控制台訊息
      await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          console.clear();
          
          const messageCount = 100;
          for (let i = 0; i < messageCount; i++) {
            if (i % 4 === 0) {
              console.log('記錄訊息 ' + i);
            } else if (i % 4 === 1) {
              console.warn('警告訊息 ' + i);
            } else if (i % 4 === 2) {
              console.error('錯誤訊息 ' + i);
            } else {
              console.info('資訊訊息 ' + i);
            }
          }
          
          return messageCount;
        `
      });
      
      // 等待訊息記錄
      await sleep(1000);
      
      // 取得控制台記錄
      const consoleLogs = await sendMessage(ws, 'browser_get_console_logs', {});
      
      assert(Array.isArray(consoleLogs), '應該回傳控制台記錄陣列');
      assert(consoleLogs.length >= 50, '應該捕獲大部分控制台訊息');
      
      // 驗證不同類型的訊息都被捕獲
      const logTypes = [...new Set(consoleLogs.map(log => log.level))];
      console.log('大量控制台訊息測試完成:');
      console.log('- 捕獲訊息數量:', consoleLogs.length);
      console.log('- 訊息類型:', logTypes);
    });
  });

  describe('極值測試', function() {
    it('應該處理非常長的字串', async function() {
      const longString = 'A'.repeat(10000); // 10K 字元
      
      const result = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          const longText = "${longString}";
          document.body.dataset.longValue = longText;
          return {
            length: longText.length,
            stored: document.body.dataset.longValue.length
          };
        `
      });
      
      assert(result.value.length === 10000, '應該處理 10K 字元字串');
      assert(result.value.stored === 10000, '應該正確儲存長字串');
      
      console.log('長字串處理測試完成: 字串長度', result.value.length);
    });

    it('應該處理深層巢狀物件', async function() {
      const result = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          // 建立深層巢狀物件
          function createNestedObject(depth) {
            if (depth === 0) {
              return { value: '深度達到', level: 0 };
            }
            return {
              level: depth,
              nested: createNestedObject(depth - 1),
              data: 'level-' + depth
            };
          }
          
          const deepObject = createNestedObject(50);
          
          // 序列化測試
          const serialized = JSON.stringify(deepObject);
          
          return {
            maxDepth: 50,
            serializedLength: serialized.length,
            success: true
          };
        `
      });
      
      assert(result.value.success === true, '應該成功建立深層物件');
      assert(result.value.maxDepth === 50, '應該達到指定深度');
      
      console.log('深層物件處理測試完成: 深度', result.value.maxDepth);
    });
  });

  describe('效能邊界測試', function() {
    it('應該在高 CPU 使用率下仍能響應', async function() {
      // 啟動高 CPU 使用率的背景任務
      const backgroundTask = sendMessage(ws, 'browser_evaluate_javascript', {
        code: `
          // 高 CPU 使用率的背景計算
          function highCpuTask() {
            return new Promise(resolve => {
              const start = Date.now();
              let result = 0;
              
              function compute() {
                const end = Date.now() + 100; // 計算 100ms
                while (Date.now() < end) {
                  result += Math.sqrt(Math.random()) * Math.sin(Math.random());
                }
                
                if (Date.now() - start < 2000) { // 總共 2 秒
                  setTimeout(compute, 10); // 短暫休息
                } else {
                  resolve(result);
                }
              }
              
              compute();
            });
          }
          
          return highCpuTask();
        `,
        awaitPromise: true
      });
      
      // 在高 CPU 使用率期間執行其他操作
      const concurrentOperations = Promise.all([
        sendMessage(ws, 'browser_get_memory_usage', {}),
        sendMessage(ws, 'browser_evaluate_javascript', {
          code: 'return "concurrent-during-high-cpu";'
        })
      ]);
      
      // 等待所有操作完成
      const [backgroundResult, concurrentResults] = await Promise.all([
        backgroundTask,
        concurrentOperations
      ]);
      
      assert(typeof backgroundResult.value === 'number', '高 CPU 任務應該完成');
      assert(concurrentResults[0].jsHeap, '記憶體監控應該在高 CPU 下仍能工作');
      assert(concurrentResults[1].value === 'concurrent-during-high-cpu', '並發操作應該成功');
      
      console.log('高 CPU 使用率測試完成');
    });
  });
});
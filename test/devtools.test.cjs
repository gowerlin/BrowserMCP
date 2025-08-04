/**
 * DevTools 功能測試
 */

const assert = require('assert');
const { WebSocket } = require('ws');

// 測試配置
const WS_URL = process.env.WS_URL || 'ws://localhost:9002';
const TEST_TIMEOUT = 30000;

// 測試助手函數
async function sendMessage(ws, type, payload) {
  return new Promise((resolve, reject) => {
    const message = {
      id: Date.now(),
      type,
      payload
    };

    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, TEST_TIMEOUT);

    const handler = (data) => {
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
    };

    ws.on('message', handler);
    ws.send(JSON.stringify(message));
  });
}

// 測試套件
describe('DevTools Integration Tests', function() {
  this.timeout(TEST_TIMEOUT);
  
  let ws;

  before(async function() {
    // 建立 WebSocket 連接
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

  describe('Network Monitoring', function() {
    it('should get network requests', async function() {
      const result = await sendMessage(ws, 'browser_get_network_requests', {
        filter: 'all',
        includeResponseBody: false
      });
      
      assert(Array.isArray(result), 'Result should be an array');
    });

    it('should clear network log', async function() {
      const result = await sendMessage(ws, 'browser_clear_network_log', {});
      assert(result.success === true, 'Should clear network log successfully');
    });

    it('should filter network requests by type', async function() {
      const result = await sendMessage(ws, 'browser_get_network_requests', {
        filter: 'xhr'
      });
      
      assert(Array.isArray(result), 'Result should be an array');
      result.forEach(request => {
        assert(request.type === 'xhr', 'All requests should be XHR type');
      });
    });
  });

  describe('Performance Monitoring', function() {
    it('should get performance metrics', async function() {
      const result = await sendMessage(ws, 'browser_get_performance_metrics', {});
      
      assert(result.metrics, 'Should have metrics property');
      assert(result.coreWebVitals, 'Should have Core Web Vitals');
      assert(result.timestamp, 'Should have timestamp');
    });

    it('should start performance profiling', async function() {
      const result = await sendMessage(ws, 'browser_start_performance_profiling', {
        categories: ['js', 'rendering']
      });
      
      assert(result.success === true, 'Should start profiling successfully');
    });

    it('should stop performance profiling', async function() {
      // 先開始分析
      await sendMessage(ws, 'browser_start_performance_profiling', {});
      
      // 等待一些數據收集
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 停止分析
      const result = await sendMessage(ws, 'browser_stop_performance_profiling', {});
      
      assert(result.success === true, 'Should stop profiling successfully');
      assert(result.profile, 'Should return profile data');
    });
  });

  describe('DOM Inspection', function() {
    it('should inspect element', async function() {
      const result = await sendMessage(ws, 'browser_inspect_element', {
        selector: 'body',
        includeStyles: true,
        includeEventListeners: true
      });
      
      assert(result.nodeId, 'Should have nodeId');
      assert(result.attributes, 'Should have attributes');
      assert(result.computedStyles, 'Should have computed styles');
    });

    it('should get DOM tree', async function() {
      const result = await sendMessage(ws, 'browser_get_dom_tree', {
        maxDepth: 2,
        includeAttributes: true
      });
      
      assert(result.tree || result.html, 'Should return DOM tree or HTML');
    });

    it('should handle non-existent element', async function() {
      const result = await sendMessage(ws, 'browser_inspect_element', {
        selector: '#non-existent-element-12345'
      });
      
      assert(result.error, 'Should return error for non-existent element');
    });
  });

  describe('JavaScript Execution', function() {
    it('should evaluate JavaScript', async function() {
      const result = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: '2 + 2',
        awaitPromise: false
      });
      
      assert(result.success === true, 'Should execute successfully');
      assert(result.value === 4, 'Should return correct result');
    });

    it('should handle async JavaScript', async function() {
      const result = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: 'Promise.resolve("test")',
        awaitPromise: true
      });
      
      assert(result.success === true, 'Should execute successfully');
      assert(result.value === 'test', 'Should resolve promise');
    });

    it('should handle JavaScript errors', async function() {
      const result = await sendMessage(ws, 'browser_evaluate_javascript', {
        code: 'throw new Error("Test error")',
        awaitPromise: false
      });
      
      assert(result.error === true, 'Should indicate error');
      assert(result.message, 'Should have error message');
    });

    it('should get JavaScript coverage', async function() {
      const result = await sendMessage(ws, 'browser_get_javascript_coverage', {
        startCoverage: true
      });
      
      assert(result.coverage, 'Should return coverage data');
      assert(result.timestamp, 'Should have timestamp');
    });
  });

  describe('Memory Analysis', function() {
    it('should get memory usage', async function() {
      const result = await sendMessage(ws, 'browser_get_memory_usage', {});
      
      assert(result.jsHeap, 'Should have JS heap information');
      assert(result.dom, 'Should have DOM information');
      assert(result.timestamp, 'Should have timestamp');
    });

    it('should take heap snapshot', async function() {
      const result = await sendMessage(ws, 'browser_take_heap_snapshot', {
        format: 'summary'
      });
      
      assert(typeof result.nodeCount === 'number', 'Should have node count');
      assert(typeof result.edgeCount === 'number', 'Should have edge count');
      assert(typeof result.totalSize === 'number', 'Should have total size');
    });
  });

  describe('Security Analysis', function() {
    it('should get security state', async function() {
      const result = await sendMessage(ws, 'browser_get_security_state', {});
      
      assert(result.securityState || result.error, 'Should return security state or error');
    });
  });

  describe('Storage Inspection', function() {
    it('should get storage data', async function() {
      const result = await sendMessage(ws, 'browser_get_storage_data', {
        storageType: 'all'
      });
      
      assert(typeof result === 'object', 'Should return storage data object');
    });

    it('should get specific storage type', async function() {
      const result = await sendMessage(ws, 'browser_get_storage_data', {
        storageType: 'localStorage'
      });
      
      assert(result.localStorage !== undefined, 'Should have localStorage data');
    });
  });

  describe('Console Monitoring', function() {
    it('should get console logs', async function() {
      const result = await sendMessage(ws, 'browser_get_console_logs', {});
      
      assert(Array.isArray(result), 'Should return array of console messages');
    });
  });
});

// 執行測試
if (require.main === module) {
  // 檢查 WebSocket 伺服器是否運行
  const testConnection = new WebSocket(WS_URL);
  
  testConnection.on('open', () => {
    testConnection.close();
    
    // 伺服器運行中，執行測試
    const Mocha = require('mocha');
    const mocha = new Mocha();
    
    mocha.addFile(__filename);
    mocha.run(failures => {
      process.exitCode = failures ? 1 : 0;
    });
  });
  
  testConnection.on('error', (error) => {
    console.error(`
╔════════════════════════════════════════════════════════════╗
║  WebSocket 伺服器未運行！                                    ║
║                                                             ║
║  請先啟動 MCP 伺服器：                                       ║
║  $ npm run watch                                           ║
║                                                             ║
║  或設定環境變數：                                             ║
║  $ WS_URL=ws://your-server:port npm test                   ║
╚════════════════════════════════════════════════════════════╝
    `);
    process.exitCode = 1;
  });
}
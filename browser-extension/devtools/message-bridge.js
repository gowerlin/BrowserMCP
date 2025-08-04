/**
 * Message Bridge
 * 連接 MCP WebSocket 和 Chrome DevTools 的訊息橋接器
 */

class MessageBridge {
  constructor(devToolsHandler) {
    this.devToolsHandler = devToolsHandler;
    this.ws = null;
    this.messageHandlers = this.initializeHandlers();
  }

  /**
   * 初始化訊息處理器映射
   */
  initializeHandlers() {
    return {
      // Network 功能
      'browser_get_network_requests': async (payload) => {
        return await this.devToolsHandler.getNetworkRequests(
          payload.filter,
          payload.includeResponseBody
        );
      },
      
      'browser_clear_network_log': async () => {
        return this.devToolsHandler.clearNetworkLog();
      },

      // Performance 功能
      'browser_get_performance_metrics': async () => {
        return await this.devToolsHandler.getPerformanceMetrics();
      },

      'browser_start_performance_profiling': async (payload) => {
        return await this.devToolsHandler.startPerformanceProfiling(
          payload.categories
        );
      },

      'browser_stop_performance_profiling': async () => {
        return await this.devToolsHandler.stopPerformanceProfiling();
      },

      // DOM 檢查功能
      'browser_inspect_element': async (payload) => {
        return await this.devToolsHandler.inspectElement(
          payload.selector,
          {
            includeStyles: payload.includeStyles,
            includeEventListeners: payload.includeEventListeners,
            includeAccessibility: payload.includeAccessibility
          }
        );
      },

      'browser_get_dom_tree': async (payload) => {
        return await this.devToolsHandler.getDOMTree(
          payload.rootSelector,
          payload.maxDepth,
          payload.includeAttributes
        );
      },

      // JavaScript 執行功能
      'browser_evaluate_javascript': async (payload) => {
        return await this.devToolsHandler.evaluateJavaScript(
          payload.code,
          payload.awaitPromise
        );
      },

      'browser_get_javascript_coverage': async (payload) => {
        return await this.devToolsHandler.getJavaScriptCoverage(
          payload.startCoverage
        );
      },

      // Memory 分析功能
      'browser_get_memory_usage': async () => {
        return await this.devToolsHandler.getMemoryUsage();
      },

      'browser_take_heap_snapshot': async (payload) => {
        return await this.devToolsHandler.takeHeapSnapshot(
          payload.format
        );
      },

      // Security 分析功能
      'browser_get_security_state': async () => {
        return await this.devToolsHandler.getSecurityState();
      },

      // Storage 檢查功能
      'browser_get_storage_data': async (payload) => {
        return await this.devToolsHandler.getStorageData(
          payload.storageType,
          payload.domain
        );
      },

      // Console 功能
      'browser_get_console_logs': async () => {
        return this.devToolsHandler.getConsoleLogs();
      }
    };
  }

  /**
   * 連接到 WebSocket 服務
   */
  connect(wsUrl) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to MCP WebSocket server');
          resolve();
        };

        this.ws.onmessage = async (event) => {
          await this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from MCP WebSocket server');
          this.reconnect(wsUrl);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 處理來自 MCP 的訊息
   */
  async handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const { type, payload, id } = message;

      // 檢查是否有對應的處理器
      if (this.messageHandlers[type]) {
        try {
          const result = await this.messageHandlers[type](payload);
          this.sendResponse(id, type, result);
        } catch (error) {
          this.sendError(id, type, error.message);
        }
      } else {
        console.warn(`Unknown message type: ${type}`);
        this.sendError(id, type, `Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  /**
   * 發送回應到 MCP
   */
  sendResponse(id, originalType, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const response = {
        id,
        type: `${originalType}_response`,
        payload: data,
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(response));
    }
  }

  /**
   * 發送錯誤回應
   */
  sendError(id, originalType, error) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const response = {
        id,
        type: `${originalType}_error`,
        error: error,
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(response));
    }
  }

  /**
   * 自動重連
   */
  async reconnect(wsUrl) {
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(() => {
      this.connect(wsUrl);
    }, 5000);
  }

  /**
   * 斷開連接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageBridge;
}
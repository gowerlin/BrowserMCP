/**
 * Chrome DevTools Protocol Handler
 * 處理 DevTools 相關功能的核心模組
 */

class DevToolsHandler {
  constructor() {
    this.debuggeeId = null;
    this.networkRequests = new Map();
    this.performanceObserver = null;
    this.isProfileRecording = false;
    this.profileData = [];
    this.consoleMessages = [];
  }

  /**
   * 初始化 DevTools 連接
   */
  async initialize(tabId) {
    this.debuggeeId = { tabId };
    
    try {
      // 連接到 Chrome DevTools Protocol
      await chrome.debugger.attach(this.debuggeeId, "1.3");
      
      // 啟用必要的域
      await this.enableDomains();
      
      // 設置事件監聽器
      this.setupEventListeners();
      
      return { success: true };
    } catch (error) {
      console.error("Failed to initialize DevTools:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 啟用 CDP 域
   */
  async enableDomains() {
    const domains = [
      "Network",
      "Page",
      "DOM",
      "CSS",
      "Runtime",
      "Performance",
      "Security",
      "Storage",
      "Console",
      "Profiler",
      "HeapProfiler",
      "Accessibility",
      "DOMStorage",
      "IndexedDB",
      "DOMDebugger"
    ];

    for (const domain of domains) {
      try {
        await chrome.debugger.sendCommand(this.debuggeeId, `${domain}.enable`, {});
      } catch (error) {
        console.warn(`Failed to enable ${domain} domain:`, error);
      }
    }
  }

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (source.tabId !== this.debuggeeId.tabId) return;

      switch (method) {
        case "Network.requestWillBeSent":
          this.handleNetworkRequest(params);
          break;
        case "Network.responseReceived":
          this.handleNetworkResponse(params);
          break;
        case "Console.messageAdded":
          this.handleConsoleMessage(params);
          break;
        case "Performance.metrics":
          this.handlePerformanceMetrics(params);
          break;
      }
    });
  }

  /**
   * Network 監控功能
   */
  async getNetworkRequests(filter, includeResponseBody = false) {
    const requests = Array.from(this.networkRequests.values());
    
    // 應用過濾器
    let filteredRequests = requests;
    if (filter && filter !== "all") {
      filteredRequests = requests.filter(req => req.type === filter);
    }

    // 如果需要包含回應內容
    if (includeResponseBody) {
      for (const request of filteredRequests) {
        if (request.requestId) {
          try {
            const response = await chrome.debugger.sendCommand(
              this.debuggeeId,
              "Network.getResponseBody",
              { requestId: request.requestId }
            );
            request.responseBody = response.body;
          } catch (error) {
            request.responseBody = null;
          }
        }
      }
    }

    return filteredRequests;
  }

  handleNetworkRequest(params) {
    const request = {
      requestId: params.requestId,
      url: params.request.url,
      method: params.request.method,
      headers: params.request.headers,
      timestamp: params.timestamp,
      type: params.type,
      initiator: params.initiator
    };
    
    this.networkRequests.set(params.requestId, request);
  }

  handleNetworkResponse(params) {
    const request = this.networkRequests.get(params.requestId);
    if (request) {
      request.status = params.response.status;
      request.statusText = params.response.statusText;
      request.responseHeaders = params.response.headers;
      request.mimeType = params.response.mimeType;
      request.responseTime = params.timestamp - request.timestamp;
    }
  }

  clearNetworkLog() {
    this.networkRequests.clear();
    return { success: true };
  }

  /**
   * Performance 監控功能
   */
  async getPerformanceMetrics() {
    try {
      const metrics = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Performance.getMetrics"
      );

      // 獲取 Core Web Vitals
      const vitals = await this.getCoreWebVitals();

      return {
        metrics: metrics.metrics,
        coreWebVitals: vitals,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("Failed to get performance metrics:", error);
      return null;
    }
  }

  async getCoreWebVitals() {
    const result = await chrome.debugger.sendCommand(
      this.debuggeeId,
      "Runtime.evaluate",
      {
        expression: `
          (() => {
            const observer = new PerformanceObserver(() => {});
            const entries = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            return {
              LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || null,
              FID: performance.getEntriesByType('first-input')[0]?.processingStart || null,
              CLS: 0, // 需要更複雜的計算
              FCP: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || null,
              TTFB: entries?.responseStart || null,
              domContentLoaded: entries?.domContentLoadedEventEnd || null,
              load: entries?.loadEventEnd || null
            };
          })()
        `,
        returnByValue: true
      }
    );

    return result.result.value;
  }

  async startPerformanceProfiling(categories = []) {
    if (this.isProfileRecording) {
      return { success: false, error: "Profiling already in progress" };
    }

    try {
      await chrome.debugger.sendCommand(this.debuggeeId, "Profiler.start");
      this.isProfileRecording = true;
      this.profileData = [];
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async stopPerformanceProfiling() {
    if (!this.isProfileRecording) {
      return { success: false, error: "No profiling in progress" };
    }

    try {
      const profile = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Profiler.stop"
      );
      
      this.isProfileRecording = false;
      
      return {
        success: true,
        profile: profile.profile
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * DOM 檢查功能
   */
  async inspectElement(selector, options = {}) {
    try {
      // 獲取 DOM 根節點
      const root = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "DOM.getDocument"
      );

      // 查詢元素
      const node = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "DOM.querySelector",
        {
          nodeId: root.root.nodeId,
          selector: selector
        }
      );

      if (!node.nodeId) {
        return { error: "Element not found" };
      }

      const elementInfo = {
        nodeId: node.nodeId
      };

      // 獲取元素屬性
      const attributes = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "DOM.getAttributes",
        { nodeId: node.nodeId }
      );
      elementInfo.attributes = attributes.attributes;

      // 獲取計算樣式
      if (options.includeStyles !== false) {
        const styles = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "CSS.getComputedStyleForNode",
          { nodeId: node.nodeId }
        );
        elementInfo.computedStyles = styles.computedStyle;
      }

      // 獲取事件監聽器
      if (options.includeEventListeners !== false) {
        try {
          // First, resolve the node to a runtime object ID
          const resolvedNode = await chrome.debugger.sendCommand(
            this.debuggeeId,
            "DOM.resolveNode",
            { nodeId: node.nodeId }
          );
          if (resolvedNode && resolvedNode.object && resolvedNode.object.objectId) {
            const listeners = await chrome.debugger.sendCommand(
              this.debuggeeId,
              "DOMDebugger.getEventListeners",
              { objectId: resolvedNode.object.objectId }
            );
            elementInfo.eventListeners = listeners.listeners;
          } else {
            elementInfo.eventListeners = [];
          }
        } catch (error) {
          console.warn("Failed to get event listeners:", error);
          elementInfo.eventListeners = [];
        }
      }

      // 獲取無障礙屬性
      if (options.includeAccessibility) {
        const accessibility = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "Accessibility.getPartialAXTree",
          { nodeId: node.nodeId }
        );
        elementInfo.accessibility = accessibility.nodes;
      }

      return elementInfo;
    } catch (error) {
      console.error("Failed to inspect element:", error);
      return { error: error.message };
    }
  }

  async getDOMTree(rootSelector, maxDepth = 3, includeAttributes = true) {
    try {
      const root = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "DOM.getDocument",
        { depth: maxDepth }
      );

      if (rootSelector) {
        const node = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "DOM.querySelector",
          {
            nodeId: root.root.nodeId,
            selector: rootSelector
          }
        );

        if (node.nodeId) {
          const subtree = await chrome.debugger.sendCommand(
            this.debuggeeId,
            "DOM.getOuterHTML",
            { nodeId: node.nodeId }
          );
          return { html: subtree.outerHTML };
        }
      }

      return { tree: root.root };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * JavaScript 執行功能
   */
  async evaluateJavaScript(code, awaitPromise = false) {
    try {
      const result = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Runtime.evaluate",
        {
          expression: code,
          returnByValue: true,
          awaitPromise: awaitPromise,
          userGesture: true
        }
      );

      if (result.exceptionDetails) {
        return {
          error: true,
          message: result.exceptionDetails.text,
          exception: result.exceptionDetails
        };
      }

      return {
        success: true,
        value: result.result.value,
        type: result.result.type
      };
    } catch (error) {
      return {
        error: true,
        message: error.message
      };
    }
  }

  async getJavaScriptCoverage(startCoverage = false) {
    try {
      if (startCoverage) {
        await chrome.debugger.sendCommand(
          this.debuggeeId,
          "Profiler.startPreciseCoverage",
          { callCount: true, detailed: true }
        );
      }

      const coverage = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Profiler.takePreciseCoverage"
      );

      return {
        coverage: coverage.result,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Memory 分析功能
   */
  async getMemoryUsage() {
    try {
      const jsHeap = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Runtime.evaluate",
        {
          expression: "performance.memory",
          returnByValue: true
        }
      );

      const domInfo = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Memory.getDOMCounters"
      );

      return {
        jsHeap: jsHeap.result.value,
        dom: domInfo,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async takeHeapSnapshot(format = "summary") {
    try {
      const chunks = [];
      
      // 設置事件監聽器來收集快照數據
      const listener = (source, method, params) => {
        if (method === "HeapProfiler.addHeapSnapshotChunk") {
          chunks.push(params.chunk);
        }
      };
      
      chrome.debugger.onEvent.addListener(listener);
      
      // 擷取快照
      await chrome.debugger.sendCommand(
        this.debuggeeId,
        "HeapProfiler.takeHeapSnapshot"
      );
      
      // 移除監聽器
      chrome.debugger.onEvent.removeListener(listener);
      
      const snapshot = chunks.join("");
      
      if (format === "summary") {
        // 解析並返回摘要
        const parsed = JSON.parse(snapshot);
        return {
          nodeCount: parsed.nodes?.length || 0,
          edgeCount: parsed.edges?.length || 0,
          totalSize: parsed.totalSize || 0
        };
      }
      
      return { snapshot };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Security 分析功能
   */
  async getSecurityState() {
    try {
      const securityState = await chrome.debugger.sendCommand(
        this.debuggeeId,
        "Security.getSecurityState"
      );

      return securityState;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Storage 檢查功能
   */
  async getStorageData(storageType, domain) {
    try {
      const data = {};

      if (storageType === "all" || storageType === "localStorage") {
        const localStorage = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "DOMStorage.getDOMStorageItems",
          {
            storageId: {
              securityOrigin: domain || "*",
              isLocalStorage: true
            }
          }
        );
        data.localStorage = localStorage.entries;
      }

      if (storageType === "all" || storageType === "sessionStorage") {
        const sessionStorage = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "DOMStorage.getDOMStorageItems",
          {
            storageId: {
              securityOrigin: domain || "*",
              isLocalStorage: false
            }
          }
        );
        data.sessionStorage = sessionStorage.entries;
      }

      if (storageType === "all" || storageType === "cookies") {
        const cookies = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "Network.getAllCookies"
        );
        data.cookies = cookies.cookies;
      }

      if (storageType === "all" || storageType === "indexedDB") {
        const indexedDB = await chrome.debugger.sendCommand(
          this.debuggeeId,
          "IndexedDB.requestDatabaseNames",
          { securityOrigin: domain || "*" }
        );
        data.indexedDB = indexedDB.databaseNames;
      }

      return data;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Console 訊息處理
   */
  handleConsoleMessage(params) {
    this.consoleMessages.push({
      level: params.message.level,
      text: params.message.text,
      source: params.message.source,
      timestamp: params.message.timestamp,
      stackTrace: params.message.stackTrace
    });
  }

  getConsoleLogs() {
    return this.consoleMessages;
  }

  /**
   * 清理和斷開連接
   */
  async disconnect() {
    if (this.debuggeeId) {
      try {
        await chrome.debugger.detach(this.debuggeeId);
        this.debuggeeId = null;
        this.networkRequests.clear();
        this.consoleMessages = [];
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Not connected" };
  }
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DevToolsHandler;
}
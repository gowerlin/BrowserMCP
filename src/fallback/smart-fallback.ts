/**
 * 智能故障轉移管理器
 * 優先使用 Chrome Extension，失敗時自動切換到 Puppeteer
 */

import WebSocket from 'ws';
import { PuppeteerFallback } from './puppeteer-fallback.js';
import { configManager } from '../config/config-manager.js';
import { 
  ApiResponse, 
  NetworkRequest, 
  PerformanceMetrics, 
  ElementInfo,
  JavaScriptResult,
  MemoryUsage,
  ConsoleMessage,
  StorageData
} from '../types/devtools-types.js';
import { 
  errorHandler, 
  ErrorCode, 
  createSuccessResponse, 
  createErrorResponse 
} from '../utils/error-handler.js';

export type FallbackMode = 'extension' | 'puppeteer' | 'auto';

export interface FallbackOptions {
  extensionTimeout?: number; // Extension 連接超時時間（毫秒）
  puppeteerOptions?: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    args?: string[];
  };
  retryAttempts?: number; // 重試次數
  enableLogging?: boolean; // 是否啟用詳細記錄
}

/**
 * 智能故障轉移系統
 */
export class SmartFallbackManager {
  private currentMode: FallbackMode = 'auto';
  private puppeteerFallback: PuppeteerFallback;
  private extensionConnected = false;
  private lastExtensionCheck = 0;
  private extensionCheckInterval = 5000; // 5 秒檢查一次
  private options: Required<FallbackOptions>;
  
  // WebSocket 相關
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, (response: any) => void>();
  private messageTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(wsUrl?: string, options: FallbackOptions = {}) {
    const config = configManager.getConfig();
    
    this.wsUrl = wsUrl || config.websocket.url;
    this.currentMode = config.fallback.mode;
    this.options = {
      extensionTimeout: options.extensionTimeout ?? config.fallback.extensionTimeout,
      puppeteerOptions: {
        ...config.puppeteer,
        ...options.puppeteerOptions
      },
      retryAttempts: options.retryAttempts ?? config.fallback.retryAttempts,
      enableLogging: options.enableLogging ?? config.fallback.enableLogging
    };

    this.puppeteerFallback = new PuppeteerFallback();
  }

  /**
   * 記錄訊息
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.options.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = `[SmartFallback:${level.toUpperCase()}] ${timestamp}`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 檢查 Extension 連接狀態
   */
  private async checkExtensionConnection(): Promise<boolean> {
    const now = Date.now();
    
    // 避免頻繁檢查
    if (now - this.lastExtensionCheck < this.extensionCheckInterval) {
      return this.extensionConnected;
    }

    this.lastExtensionCheck = now;

    try {
      // 嘗試建立 WebSocket 連接
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.connectWebSocket();
      }

      // 發送測試訊息
      const testResponse = await this.sendExtensionMessage('ping', {});
      this.extensionConnected = testResponse.success;
      
      if (this.extensionConnected) {
        this.log('Extension connection verified');
      } else {
        this.log('Extension connection test failed', 'warn');
      }

      return this.extensionConnected;
    } catch (error: any) {
      this.extensionConnected = false;
      this.log(`Extension connection check failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 建立 WebSocket 連接
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, this.options.extensionTimeout);

      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.log('WebSocket connected');
        resolve();
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeout);
        this.log(`WebSocket error: ${error.message}`, 'error');
        reject(error);
      });

      this.ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          const handler = this.messageHandlers.get(response.id);
          
          if (handler) {
            const timeout = this.messageTimeouts.get(response.id);
            if (timeout) {
              clearTimeout(timeout);
              this.messageTimeouts.delete(response.id);
            }
            
            this.messageHandlers.delete(response.id);
            handler(response);
          }
        } catch (error: any) {
          this.log(`Failed to parse WebSocket message: ${error.message}`, 'error');
        }
      });

      this.ws.on('close', () => {
        this.log('WebSocket connection closed', 'warn');
        this.extensionConnected = false;
      });
    });
  }

  /**
   * 發送訊息到 Extension
   */
  private async sendExtensionMessage(type: string, payload: any): Promise<ApiResponse<any>> {
    return new Promise((resolve) => {
      const messageId = `${type}_${Date.now()}_${Math.random()}`;
      const message = {
        id: messageId,
        type,
        payload
      };

      // 設置超時
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        this.messageTimeouts.delete(messageId);
        resolve(createErrorResponse(errorHandler.handleError(
          ErrorCode.TIMEOUT,
          `Extension message timeout: ${type}`,
          null,
          'SmartFallback'
        )));
      }, this.options.extensionTimeout);

      // 設置回應處理器
      this.messageHandlers.set(messageId, (response) => {
        if (response.error) {
          resolve(createErrorResponse(errorHandler.handleError(
            ErrorCode.EXTENSION_ERROR,
            response.error,
            response,
            'SmartFallback'
          )));
        } else {
          resolve(createSuccessResponse(response.payload));
        }
      });

      this.messageTimeouts.set(messageId, timeout);

      // 發送訊息
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        clearTimeout(timeout);
        this.messageHandlers.delete(messageId);
        this.messageTimeouts.delete(messageId);
        resolve(createErrorResponse(errorHandler.handleError(
          ErrorCode.CONNECTION_FAILED,
          'WebSocket not connected',
          null,
          'SmartFallback'
        )));
      }
    });
  }

  /**
   * 執行操作（智能路由）
   */
  private async executeOperation<T>(
    operationName: string,
    extensionOperation: () => Promise<ApiResponse<T>>,
    puppeteerOperation: () => Promise<ApiResponse<T>>,
    fallbackOnError = true
  ): Promise<ApiResponse<T>> {
    let lastError: any = null;

    // 如果明確指定使用 Puppeteer
    if (this.currentMode === 'puppeteer') {
      this.log(`Executing ${operationName} in Puppeteer mode`);
      return await puppeteerOperation();
    }

    // 嘗試 Extension 模式
    if (this.currentMode === 'extension' || this.currentMode === 'auto') {
      const extensionAvailable = await this.checkExtensionConnection();
      
      if (extensionAvailable) {
        this.log(`Executing ${operationName} in Extension mode`);
        
        try {
          const result = await extensionOperation();
          if (result.success) {
            return result;
          } else {
            lastError = result.error;
            this.log(`Extension operation failed: ${result.error?.message}`, 'warn');
          }
        } catch (error: any) {
          lastError = error;
          this.log(`Extension operation error: ${error.message}`, 'warn');
        }
      } else {
        this.log('Extension not available, will try Puppeteer', 'warn');
      }
    }

    // 回退到 Puppeteer
    if (fallbackOnError && this.currentMode === 'auto') {
      this.log(`Falling back to Puppeteer for ${operationName}`);
      
      try {
        // 確保 Puppeteer 已初始化
        if (!this.puppeteerFallback.isReady()) {
          const initResult = await this.puppeteerFallback.initialize(this.options.puppeteerOptions);
          if (!initResult.success) {
            return initResult as any;
          }
        }

        const result = await puppeteerOperation();
        if (result.success) {
          // 成功使用 Puppeteer，可以考慮切換模式
          if (this.currentMode === 'auto') {
            this.log('Puppeteer fallback successful, continuing with Puppeteer mode');
          }
        }
        return result;
      } catch (error: any) {
        this.log(`Puppeteer operation also failed: ${error.message}`, 'error');
        lastError = error;
      }
    }

    // 兩種方式都失敗
    return createErrorResponse(errorHandler.handleError(
      ErrorCode.EXTENSION_ERROR,
      `Both Extension and Puppeteer modes failed for ${operationName}`,
      lastError,
      'SmartFallback'
    ));
  }

  /**
   * 設置運行模式
   */
  setMode(mode: FallbackMode): void {
    this.currentMode = mode;
    this.log(`Mode changed to: ${mode}`);
  }

  /**
   * 取得當前模式
   */
  getCurrentMode(): FallbackMode {
    return this.currentMode;
  }

  /**
   * 清理資源
   */
  async cleanup(): Promise<void> {
    // 清理 WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 清理超時
    this.messageTimeouts.forEach(timeout => clearTimeout(timeout));
    this.messageTimeouts.clear();
    this.messageHandlers.clear();

    // 清理 Puppeteer
    await this.puppeteerFallback.cleanup();

    this.log('Smart fallback manager cleaned up');
  }

  // === DevTools API 實作 ===

  /**
   * 取得網路請求
   */
  async getNetworkRequests(filter?: string, includeResponseBody?: boolean): Promise<ApiResponse<NetworkRequest[]>> {
    return this.executeOperation(
      'getNetworkRequests',
      () => this.sendExtensionMessage('browser_get_network_requests', { filter, includeResponseBody }),
      () => this.puppeteerFallback.getNetworkRequests(filter, includeResponseBody)
    );
  }

  /**
   * 清除網路記錄
   */
  async clearNetworkLog(): Promise<ApiResponse<{ success: boolean; timestamp: number }>> {
    return this.executeOperation(
      'clearNetworkLog',
      () => this.sendExtensionMessage('browser_clear_network_log', {}),
      () => this.puppeteerFallback.clearNetworkLog()
    );
  }

  /**
   * 取得效能指標
   */
  async getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>> {
    return this.executeOperation(
      'getPerformanceMetrics',
      () => this.sendExtensionMessage('browser_get_performance_metrics', {}),
      () => this.puppeteerFallback.getPerformanceMetrics()
    );
  }

  /**
   * 檢查元素
   */
  async inspectElement(selector: string, options: {
    includeStyles?: boolean;
    includeEventListeners?: boolean;
    includeAccessibility?: boolean;
  } = {}): Promise<ApiResponse<ElementInfo>> {
    return this.executeOperation(
      'inspectElement',
      () => this.sendExtensionMessage('browser_inspect_element', { selector, ...options }),
      () => this.puppeteerFallback.inspectElement(selector, options)
    );
  }

  /**
   * 執行 JavaScript
   */
  async evaluateJavaScript(code: string, awaitPromise = false): Promise<ApiResponse<JavaScriptResult>> {
    return this.executeOperation(
      'evaluateJavaScript',
      () => this.sendExtensionMessage('browser_evaluate_javascript', { code, awaitPromise }),
      () => this.puppeteerFallback.evaluateJavaScript(code, awaitPromise)
    );
  }

  /**
   * 取得記憶體使用情況
   */
  async getMemoryUsage(): Promise<ApiResponse<MemoryUsage>> {
    return this.executeOperation(
      'getMemoryUsage',
      () => this.sendExtensionMessage('browser_get_memory_usage', {}),
      () => this.puppeteerFallback.getMemoryUsage()
    );
  }

  /**
   * 取得儲存資料
   */
  async getStorageData(storageType: string, domain?: string): Promise<ApiResponse<StorageData>> {
    return this.executeOperation(
      'getStorageData',
      () => this.sendExtensionMessage('browser_get_storage_data', { storageType, domain }),
      () => this.puppeteerFallback.getStorageData(storageType, domain)
    );
  }

  /**
   * 取得控制台記錄
   */
  async getConsoleLogs(): Promise<ApiResponse<ConsoleMessage[]>> {
    return this.executeOperation(
      'getConsoleLogs',
      () => this.sendExtensionMessage('browser_get_console_logs', {}),
      () => this.puppeteerFallback.getConsoleLogs()
    );
  }

  /**
   * 導航到 URL
   */
  async navigate(url: string): Promise<ApiResponse<{ title: string; url: string }>> {
    return this.executeOperation(
      'navigate',
      () => this.sendExtensionMessage('navigate', { url }),
      () => this.puppeteerFallback.navigate(url)
    );
  }

  /**
   * 取得頁面資訊
   */
  async getPageInfo(): Promise<ApiResponse<{ title: string; url: string; viewport: any }>> {
    return this.executeOperation(
      'getPageInfo',
      () => this.sendExtensionMessage('get_page_info', {}),
      () => this.puppeteerFallback.getPageInfo()
    );
  }

  /**
   * 取得頁面截圖
   */
  async takeScreenshot(options: {
    format?: 'png' | 'jpeg';
    quality?: number;
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  } = {}): Promise<ApiResponse<string>> {
    return this.executeOperation(
      'takeScreenshot',
      () => this.sendExtensionMessage('browser_screenshot', {}),
      () => this.puppeteerFallback.takeScreenshot(options)
    );
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<{
    extension: { available: boolean; lastCheck: number };
    puppeteer: { available: boolean; initialized: boolean };
    currentMode: FallbackMode;
  }> {
    const extensionAvailable = await this.checkExtensionConnection();
    
    return {
      extension: {
        available: extensionAvailable,
        lastCheck: this.lastExtensionCheck
      },
      puppeteer: {
        available: true, // Puppeteer 總是可用（如果安裝了）
        initialized: this.puppeteerFallback.isReady()
      },
      currentMode: this.currentMode
    };
  }
}
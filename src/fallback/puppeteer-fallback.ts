/**
 * Puppeteer 備援系統
 * 當 Chrome Extension 不可用時，自動切換到 Puppeteer 模式
 */

import puppeteer, { Browser, Page } from 'puppeteer';
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

/**
 * Puppeteer 備援管理器
 */
export class PuppeteerFallback {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleLogs: ConsoleMessage[] = [];
  private networkRequests: Map<string, NetworkRequest> = new Map();
  private isInitialized = false;
  private maxConsoleLog = 1000;
  private maxNetworkRequests = 1000;

  /**
   * 初始化 Puppeteer 瀏覽器
   */
  async initialize(options?: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    args?: string[];
  }): Promise<ApiResponse<boolean>> {
    if (this.isInitialized) {
      return createSuccessResponse(true);
    }

    return await errorHandler.wrapAsync(
      async () => {
        const defaultOptions = {
          headless: options?.headless ?? false,
          defaultViewport: options?.viewport ?? { width: 1280, height: 720 },
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            ...(options?.args || [])
          ]
        };

        this.browser = await puppeteer.launch(defaultOptions);
        this.page = await this.browser.newPage();

        // 設置 User Agent
        await this.page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BrowserMCP/0.2.0'
        );

        // 設置監聽器
        this.setupEventListeners();

        this.isInitialized = true;
        return true;
      },
      ErrorCode.EXTENSION_ERROR,
      'Failed to initialize Puppeteer fallback',
      'PuppeteerFallback',
      30000 // 30 秒初始化超時
    );
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    if (!this.page) return;

    // Console 訊息監聽
    this.page.on('console', (msg) => {
      const logEntry: ConsoleMessage = {
        level: msg.type() as any,
        text: msg.text(),
        timestamp: Date.now(),
        source: 'PuppeteerFallback',
        stackTrace: msg.stackTrace() ? msg.stackTrace().map(frame => ({
          functionName: (frame as any).function || 'anonymous',
          scriptId: frame.url || 'unknown',
          url: frame.url || 'unknown',
          lineNumber: frame.lineNumber || 0,
          columnNumber: frame.columnNumber || 0
        })) : undefined
      };

      this.consoleLogs.push(logEntry);

      // 限制記錄大小
      if (this.consoleLogs.length > this.maxConsoleLog) {
        this.consoleLogs = this.consoleLogs.slice(-Math.floor(this.maxConsoleLog * 0.8));
      }
    });

    // 網路請求監聽
    this.page.on('request', (request) => {
      const requestData: NetworkRequest = {
        requestId: request.url() + '_' + Date.now(),
        url: request.url(),
        method: request.method() as any,
        headers: request.headers(),
        timestamp: Date.now(),
        type: request.resourceType() as any,
        initiator: {
          type: 'script',
          url: request.frame()?.url() || 'unknown'
        }
      };

      this.networkRequests.set(requestData.requestId, requestData);
    });

    this.page.on('response', (response) => {
      const request = Array.from(this.networkRequests.values())
        .find(req => req.url === response.url() && !req.status);

      if (request) {
        request.status = response.status();
        request.statusText = response.statusText();
        request.responseHeaders = response.headers();
        request.mimeType = response.headers()['content-type'];
        request.responseTime = Date.now() - request.timestamp;
      }

      // 限制網路請求記錄大小
      if (this.networkRequests.size > this.maxNetworkRequests) {
        const oldEntries = Array.from(this.networkRequests.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .slice(0, Math.floor(this.maxNetworkRequests * 0.2));
        
        oldEntries.forEach(([key]) => this.networkRequests.delete(key));
      }
    });

    // 錯誤監聽
    this.page.on('error', (error) => {
      errorHandler.handleError(
        ErrorCode.JAVASCRIPT_ERROR,
        'Page error in Puppeteer fallback',
        error,
        'PuppeteerFallback'
      );
    });

    this.page.on('pageerror', (error) => {
      const logEntry: ConsoleMessage = {
        level: 'error',
        text: error.message,
        timestamp: Date.now(),
        source: 'PuppeteerFallback:PageError',
        stackTrace: error.stack ? [{
          functionName: 'unknown',
          scriptId: 'unknown',
          url: 'unknown',
          lineNumber: 0,
          columnNumber: 0
        }] : undefined
      };

      this.consoleLogs.push(logEntry);
    });
  }

  /**
   * 清理資源
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      this.consoleLogs = [];
      this.networkRequests.clear();
    }
  }

  /**
   * 檢查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized && this.browser !== null && this.page !== null;
  }

  /**
   * 導航到 URL
   */
  async navigate(url: string): Promise<ApiResponse<{ title: string; url: string }>> {
    if (!this.isReady()) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult as any;
      }
    }

    return await errorHandler.wrapAsync(
      async () => {
        const response = await this.page!.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        const title = await this.page!.title();

        return {
          title,
          url: this.page!.url(),
          status: response?.status(),
          mode: 'puppeteer'
        };
      },
      ErrorCode.NETWORK_REQUEST_FAILED,
      `Failed to navigate to ${url}`,
      'PuppeteerFallback',
      30000
    );
  }

  /**
   * 取得網路請求
   */
  async getNetworkRequests(filter?: string, includeResponseBody?: boolean): Promise<ApiResponse<NetworkRequest[]>> {
    return await errorHandler.wrapAsync(
      async () => {
        let requests = Array.from(this.networkRequests.values());

        if (filter && filter !== 'all') {
          requests = requests.filter(req => req.type === filter);
        }

        // 如果需要回應內容，使用 Puppeteer 的方法獲取
        if (includeResponseBody && this.page) {
          for (const request of requests) {
            // 注意：Puppeteer 獲取回應內容較複雜，這裡簡化處理
            request.responseBody = 'Response body capture requires additional implementation';
          }
        }

        return requests;
      },
      ErrorCode.NETWORK_REQUEST_FAILED,
      'Failed to get network requests',
      'PuppeteerFallback'
    );
  }

  /**
   * 清除網路記錄
   */
  async clearNetworkLog(): Promise<ApiResponse<{ success: boolean; timestamp: number }>> {
    return await errorHandler.wrapAsync(
      async () => {
        this.networkRequests.clear();
        return {
          success: true,
          timestamp: Date.now(),
          mode: 'puppeteer'
        };
      },
      ErrorCode.NETWORK_REQUEST_FAILED,
      'Failed to clear network log',
      'PuppeteerFallback'
    );
  }

  /**
   * 取得效能指標
   */
  async getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>> {
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        // 獲取基本效能指標
        const metrics = await this.page!.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');
          
          return {
            navigation: {
              domContentLoaded: navigation?.domContentLoadedEventEnd || null,
              load: navigation?.loadEventEnd || null,
              responseStart: navigation?.responseStart || null
            },
            paint: {
              FCP: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || null,
              LCP: null // 需要 PerformanceObserver
            },
            memory: (performance as any).memory ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
            } : null
          };
        });

        const result: PerformanceMetrics = {
          metrics: [
            { name: 'DOMContentLoaded', value: metrics.navigation.domContentLoaded || 0 },
            { name: 'Load', value: metrics.navigation.load || 0 },
            { name: 'ResponseStart', value: metrics.navigation.responseStart || 0 }
          ],
          coreWebVitals: {
            LCP: metrics.paint.LCP,
            FID: null, // 需要特殊實作
            CLS: null, // 需要特殊實作
            FCP: metrics.paint.FCP,
            TTFB: metrics.navigation.responseStart,
            domContentLoaded: metrics.navigation.domContentLoaded,
            load: metrics.navigation.load
          },
          timestamp: Date.now()
        };

        return result;
      },
      ErrorCode.PROFILING_FAILED,
      'Failed to get performance metrics',
      'PuppeteerFallback'
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
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        const element = await this.page!.$(selector);
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }

        // 獲取基本屬性
        const attributes = await this.page!.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return [];
          
          const attrs: string[] = [];
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            attrs.push(attr.name, attr.value);
          }
          return attrs;
        }, selector);

        const result: ElementInfo = {
          nodeId: 0, // Puppeteer 不使用 nodeId
          attributes
        };

        // 獲取計算樣式
        if (options.includeStyles !== false) {
          const styles = await this.page!.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return [];
            
            const computed = window.getComputedStyle(el);
            const styles: Array<{ name: string; value: string }> = [];
            
            for (let i = 0; i < computed.length; i++) {
              const property = computed[i];
              styles.push({
                name: property,
                value: computed.getPropertyValue(property)
              });
            }
            
            return styles;
          }, selector);

          result.computedStyles = styles;
        }

        // 事件監聽器（Puppeteer 中較難獲取，簡化處理）
        if (options.includeEventListeners !== false) {
          result.eventListeners = [];
        }

        // 無障礙屬性（簡化實作）
        if (options.includeAccessibility) {
          result.accessibility = [];
        }

        return result;
      },
      ErrorCode.ELEMENT_NOT_FOUND,
      `Failed to inspect element: ${selector}`,
      'PuppeteerFallback'
    );
  }

  /**
   * 執行 JavaScript
   */
  async evaluateJavaScript(code: string, awaitPromise = false): Promise<ApiResponse<JavaScriptResult>> {
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        try {
          const result = await this.page!.evaluate((code, awaitPromise) => {
            if (awaitPromise) {
              return Promise.resolve(eval(code));
            } else {
              return eval(code);
            }
          }, code, awaitPromise);

          return {
            success: true,
            value: result,
            type: typeof result
          };
        } catch (error: any) {
          return {
            success: false,
            error: true,
            message: error.message,
            exception: {
              text: error.message,
              lineNumber: 0,
              columnNumber: 0,
              scriptId: 'eval'
            }
          };
        }
      },
      ErrorCode.JAVASCRIPT_ERROR,
      'Failed to evaluate JavaScript',
      'PuppeteerFallback'
    );
  }

  /**
   * 取得記憶體使用情況
   */
  async getMemoryUsage(): Promise<ApiResponse<MemoryUsage>> {
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        const memoryInfo = await this.page!.evaluate(() => {
          const memory = (performance as any).memory;
          const domInfo = {
            documents: document.querySelectorAll('*').length > 0 ? 1 : 0,
            nodes: document.querySelectorAll('*').length,
            jsEventListeners: 0 // 難以準確獲取
          };

          return {
            jsHeap: memory ? {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit
            } : {
              usedJSHeapSize: 0,
              totalJSHeapSize: 0,
              jsHeapSizeLimit: 0
            },
            dom: domInfo
          };
        });

        return {
          ...memoryInfo,
          timestamp: Date.now()
        };
      },
      ErrorCode.MEMORY_ANALYSIS_FAILED,
      'Failed to get memory usage',
      'PuppeteerFallback'
    );
  }

  /**
   * 取得儲存資料
   */
  async getStorageData(storageType: string, domain?: string): Promise<ApiResponse<StorageData>> {
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        const data: StorageData = {};

        if (storageType === 'all' || storageType === 'localStorage') {
          const localStorage = await this.page!.evaluate(() => {
            const items: Array<[string, string]> = [];
            for (let i = 0; i < window.localStorage.length; i++) {
              const key = window.localStorage.key(i);
              if (key) {
                items.push([key, window.localStorage.getItem(key) || '']);
              }
            }
            return items;
          });
          data.localStorage = localStorage;
        }

        if (storageType === 'all' || storageType === 'sessionStorage') {
          const sessionStorage = await this.page!.evaluate(() => {
            const items: Array<[string, string]> = [];
            for (let i = 0; i < window.sessionStorage.length; i++) {
              const key = window.sessionStorage.key(i);
              if (key) {
                items.push([key, window.sessionStorage.getItem(key) || '']);
              }
            }
            return items;
          });
          data.sessionStorage = sessionStorage;
        }

        if (storageType === 'all' || storageType === 'cookies') {
          const cookies = await this.page!.cookies();
          data.cookies = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expires || 0,
            size: cookie.name.length + cookie.value.length,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            session: !cookie.expires,
            sameSite: cookie.sameSite as any
          }));
        }

        return data;
      },
      ErrorCode.STORAGE_ACCESS_DENIED,
      'Failed to get storage data',
      'PuppeteerFallback'
    );
  }

  /**
   * 取得控制台記錄
   */
  async getConsoleLogs(): Promise<ApiResponse<ConsoleMessage[]>> {
    return createSuccessResponse([...this.consoleLogs]);
  }

  /**
   * 取得頁面資訊
   */
  async getPageInfo(): Promise<ApiResponse<{ title: string; url: string; viewport: any }>> {
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        const title = await this.page!.title();
        const url = this.page!.url();
        const viewport = this.page!.viewport();

        return {
          title,
          url,
          viewport,
          mode: 'puppeteer'
        };
      },
      ErrorCode.EXTENSION_ERROR,
      'Failed to get page info',
      'PuppeteerFallback'
    );
  }

  /**
   * 等待頁面準備就緒 - 優化的策略
   */
  private async waitForPageReady(): Promise<void> {
    try {
      // 等待 DOM 準備就緒
      await this.page!.waitForSelector('body', { timeout: 5000 });
      
      // 等待網路活動平靜（Puppeteer 方式）
      await this.page!.waitForTimeout(2000); // 簡化實作，等待基本載入時間
      
      // 等待圖片載入完成
      await this.page!.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = img.onerror = resolve;
              setTimeout(resolve, 3000); // 3秒超時
            }))
        );
      });
      
    } catch (error) {
      // 降級策略：基本等待時間
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  /**
   * 優化截圖選項 - 智慧壓縮
   */
  private async optimizeScreenshotOptions(options: any): Promise<any> {
    const pageInfo = await this.analyzePageContent();
    
    let format = options.format;
    let quality = options.quality;

    // 智慧格式選擇
    if (format === 'auto' || options.smartCompression !== false) {
      if (pageInfo.hasPhotos || pageInfo.hasGradients) {
        format = 'jpeg';
        quality = quality || 85; // 高品質 JPEG
      } else if (pageInfo.hasTransparency || pageInfo.isSimple) {
        format = 'png';
      } else {
        format = 'jpeg';
        quality = quality || 80; // 標準品質
      }
    }

    // 分段截圖判斷
    const enableSegmentation = options.enableSegmentation || 
      (options.fullPage && pageInfo.height > (options.maxHeight || 8000));

    const screenshotOptions: any = {
      type: format || 'png',
      encoding: 'base64',
      fullPage: options.fullPage || false
    };

    if (format === 'jpeg' && quality) {
      screenshotOptions.quality = quality;
    }

    if (options.clip) {
      screenshotOptions.clip = options.clip;
    }

    return {
      ...options,
      format,
      quality,
      enableSegmentation,
      screenshotOptions,
      pageInfo
    };
  }

  /**
   * 分析頁面內容特徵
   */
  private async analyzePageContent(): Promise<{
    width: number;
    height: number;
    hasPhotos: boolean;
    hasGradients: boolean;
    hasTransparency: boolean;
    isSimple: boolean;
    complexity: number;
  }> {
    return await this.page!.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      
      const width = Math.max(body.scrollWidth, html.scrollWidth, html.clientWidth);
      const height = Math.max(body.scrollHeight, html.scrollHeight, html.clientHeight);
      
      // 檢測圖片
      const images = document.querySelectorAll('img');
      const hasPhotos = images.length > 0 && 
        Array.from(images).some(img => 
          img.src && !img.src.includes('svg') && !img.src.startsWith('data:image/svg')
        );
      
      // 檢測漸層和複雜背景
      const elements = document.querySelectorAll('*');
      let hasGradients = false;
      let complexElementCount = 0;
      
      Array.from(elements).forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.background && 
            (style.background.includes('gradient') || 
             style.backgroundImage.includes('gradient'))) {
          hasGradients = true;
        }
        
        // 計算複雜度
        if (style.boxShadow !== 'none' || 
            style.borderRadius !== '0px' ||
            style.transform !== 'none') {
          complexElementCount++;
        }
      });
      
      const totalElements = elements.length;
      const complexity = totalElements > 0 ? complexElementCount / totalElements : 0;
      
      return {
        width,
        height,
        hasPhotos,
        hasGradients,
        hasTransparency: false, // 簡化實作，實際可以更精確檢測
        isSimple: totalElements < 50 && !hasPhotos && !hasGradients,
        complexity
      };
    });
  }

  /**
   * 分段截圖實作
   */
  private async takeSegmentedScreenshot(options: any): Promise<string[]> {
    const { pageInfo, maxHeight = 8000 } = options;
    const segments: string[] = [];
    
    const viewport = this.page!.viewport();
    const viewportHeight = viewport?.height || 720;
    const totalHeight = pageInfo.height;
    
    // 計算分段數量
    const segmentCount = Math.ceil(totalHeight / maxHeight);
    const overlap = 50; // 重疊像素，避免內容截斷
    
    console.log(`🔄 執行分段截圖：${segmentCount} 段，總高度 ${totalHeight}px`);
    
    for (let i = 0; i < segmentCount; i++) {
      const scrollY = i * (maxHeight - overlap);
      const remainingHeight = totalHeight - scrollY;
      const segmentHeight = Math.min(maxHeight, remainingHeight);
      
      // 滾動到指定位置
      await this.page!.evaluate((y) => {
        window.scrollTo(0, y);
      }, scrollY);
      
      // 等待渲染
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 截圖指定區域
      const segmentOptions = {
        ...options.screenshotOptions,
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: viewport?.width || 1280,
          height: Math.min(segmentHeight, viewportHeight)
        }
      };
      
      const segment = await this.page!.screenshot(segmentOptions);
      segments.push(segment as string);
      
      console.log(`✅ 分段 ${i + 1}/${segmentCount} 完成`);
    }
    
    // 重置滾動位置
    await this.page!.evaluate(() => window.scrollTo(0, 0));
    
    return segments;
  }

  /**
   * 後處理截圖結果
   */
  private postProcessScreenshot(screenshot: string, options: any): string {
    // 記錄優化統計
    const originalSize = screenshot.length;
    const estimatedKB = Math.round(originalSize * 0.75 / 1024);
    
    console.log(`📊 截圖優化統計:`);
    console.log(`   格式: ${options.format}`);
    console.log(`   品質: ${options.quality || 'default'}`);
    console.log(`   資料大小: ${originalSize} 字元`);
    console.log(`   估計檔案大小: ${estimatedKB} KB`);
    
    if (options.pageInfo) {
      console.log(`   頁面複雜度: ${(options.pageInfo.complexity * 100).toFixed(1)}%`);
      console.log(`   頁面尺寸: ${options.pageInfo.width}x${options.pageInfo.height}`);
    }
    
    return screenshot;
  }

  /**
   * 取得頁面截圖 - 支援智慧壓縮和分段截圖
   */
  async takeScreenshot(options: {
    format?: 'png' | 'jpeg' | 'auto';
    quality?: number;
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
    maxHeight?: number;
    enableSegmentation?: boolean;
    smartCompression?: boolean;
  } = {}): Promise<ApiResponse<string | string[]>> {
    if (!this.isReady()) {
      return createErrorResponse(errorHandler.handleError(
        ErrorCode.EXTENSION_ERROR,
        'Puppeteer not initialized',
        null,
        'PuppeteerFallback'
      ));
    }

    return await errorHandler.wrapAsync(
      async () => {
        // 等待頁面完全載入 - 優化的等待策略
        await this.waitForPageReady();

        // 智慧壓縮：根據頁面內容自動選擇最佳格式
        const optimizedOptions = await this.optimizeScreenshotOptions(options);

        // 檢查是否需要分段截圖
        if (optimizedOptions.enableSegmentation && optimizedOptions.fullPage) {
          return await this.takeSegmentedScreenshot(optimizedOptions);
        }

        // 標準截圖
        const screenshot = await this.page!.screenshot(optimizedOptions.screenshotOptions);
        const result = screenshot as string;

        // 後處理優化
        return this.postProcessScreenshot(result, optimizedOptions);
      },
      ErrorCode.EXTENSION_ERROR,
      'Failed to take screenshot',
      'PuppeteerFallback',
      30000 // 30 seconds timeout for screenshots (optimized)
    );
  }
}
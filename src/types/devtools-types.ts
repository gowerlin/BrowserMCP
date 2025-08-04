/**
 * DevTools 專用型別定義
 * 提供更嚴格和精確的型別定義，提升程式碼品質和開發體驗
 */

// HTTP 方法列舉
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

// 網路請求類型
export type NetworkRequestType = 'xhr' | 'fetch' | 'document' | 'stylesheet' | 'script' | 'image' | 'font' | 'media' | 'websocket' | 'other';

// Console 訊息等級
export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'dir' | 'dirxml' | 'table' | 'clear' | 'startGroup' | 'startGroupCollapsed' | 'endGroup' | 'assert' | 'profile' | 'profileEnd' | 'count' | 'timeEnd';

// 儲存類型
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB' | 'all';

// 安全狀態
export type SecurityState = 'unknown' | 'neutral' | 'insecure' | 'secure' | 'info' | 'insecure-broken';

// 效能指標類型
export type PerformanceMetricName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'TTI' | 'SI';

/**
 * 標準化的 API 錯誤介面
 */
export interface ApiError {
  /** 錯誤代碼 */
  code: string;
  /** 錯誤訊息 */
  message: string;
  /** 額外的錯誤詳情 */
  details?: unknown;
  /** 錯誤發生的時間戳 */
  timestamp?: number;
  /** 錯誤來源 */
  source?: string;
}

/**
 * 標準化的 API 回應介面
 */
export interface ApiResponse<T = unknown> {
  /** 操作是否成功 */
  success: boolean;
  /** 回應資料 */
  data?: T;
  /** 錯誤資訊 (當 success 為 false 時) */
  error?: ApiError;
  /** 回應時間戳 */
  timestamp: number;
  /** 請求 ID (用於追蹤) */
  requestId?: string;
}

/**
 * 網路請求詳細資訊
 */
export interface NetworkRequest {
  /** 請求 ID */
  requestId: string;
  /** 請求 URL */
  url: string;
  /** HTTP 方法 */
  method: HttpMethod;
  /** 請求標頭 */
  headers: Record<string, string>;
  /** 請求時間戳 */
  timestamp: number;
  /** 請求類型 */
  type: NetworkRequestType;
  /** 請求發起者資訊 */
  initiator?: {
    type: string;
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
  /** HTTP 狀態碼 */
  status?: number;
  /** 狀態文字 */
  statusText?: string;
  /** 回應標頭 */
  responseHeaders?: Record<string, string>;
  /** MIME 類型 */
  mimeType?: string;
  /** 回應時間 (毫秒) */
  responseTime?: number;
  /** 回應內容 (可選) */
  responseBody?: string;
  /** 回應大小 (位元組) */
  responseSize?: number;
}

/**
 * 效能指標資料
 */
export interface PerformanceMetrics {
  /** 基本效能指標 */
  metrics: Array<{
    name: string;
    value: number;
  }>;
  /** Core Web Vitals */
  coreWebVitals: {
    /** Largest Contentful Paint */
    LCP: number | null;
    /** First Input Delay */
    FID: number | null;
    /** Cumulative Layout Shift */
    CLS: number | null;
    /** First Contentful Paint */
    FCP: number | null;
    /** Time to First Byte */
    TTFB: number | null;
    /** DOM Content Loaded */
    domContentLoaded: number | null;
    /** Load Event End */
    load: number | null;
  };
  /** 收集時間戳 */
  timestamp: number;
}

/**
 * DOM 元素詳細資訊
 */
export interface ElementInfo {
  /** 節點 ID */
  nodeId: number;
  /** 元素標籤名稱 */
  tagName?: string;
  /** 元素屬性 */
  attributes: string[];
  /** 計算樣式 */
  computedStyles?: Array<{
    name: string;
    value: string;
  }>;
  /** 事件監聽器 */
  eventListeners?: Array<{
    type: string;
    useCapture: boolean;
    passive: boolean;
    once: boolean;
    scriptId: string;
    lineNumber: number;
    columnNumber: number;
  }>;
  /** 無障礙屬性 */
  accessibility?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * JavaScript 執行結果
 */
export interface JavaScriptResult {
  /** 執行是否成功 */
  success: boolean;
  /** 回傳值 */
  value?: unknown;
  /** 值的類型 */
  type?: string;
  /** 錯誤資訊 */
  error?: boolean;
  /** 錯誤訊息 */
  message?: string;
  /** 例外詳情 */
  exception?: {
    text: string;
    lineNumber: number;
    columnNumber: number;
    scriptId: string;
  };
}

/**
 * 記憶體使用資訊
 */
export interface MemoryUsage {
  /** JavaScript Heap 資訊 */
  jsHeap: {
    /** 已使用的 heap 大小 (位元組) */
    usedJSHeapSize: number;
    /** 總 heap 大小 (位元組) */
    totalJSHeapSize: number;
    /** heap 大小限制 (位元組) */
    jsHeapSizeLimit: number;
  };
  /** DOM 資訊 */
  dom: {
    /** 文件節點數量 */
    documents: number;
    /** DOM 節點數量 */
    nodes: number;
    /** JavaScript 事件監聽器數量 */
    jsEventListeners: number;
  };
  /** 收集時間戳 */
  timestamp: number;
}

/**
 * Heap 快照摘要
 */
export interface HeapSnapshotSummary {
  /** 節點數量 */
  nodeCount: number;
  /** 邊緣數量 */
  edgeCount: number;
  /** 總大小 (位元組) */
  totalSize: number;
  /** 快照時間戳 */
  timestamp?: number;
}

/**
 * 安全狀態資訊
 */
export interface SecurityInfo {
  /** 安全狀態 */
  securityState: SecurityState;
  /** 安全詳情 */
  securityStateIssueIds?: string[];
  /** 證書資訊 */
  certificate?: Array<{
    name: string;
    value: string;
  }>;
  /** 混合內容狀態 */
  mixedContentType?: 'none' | 'blockable' | 'optionally-blockable';
  /** 混合內容描述 */
  mixedContentDescription?: string;
}

/**
 * 儲存資料結構
 */
export interface StorageData {
  /** localStorage 資料 */
  localStorage?: Array<[string, string]>;
  /** sessionStorage 資料 */
  sessionStorage?: Array<[string, string]>;
  /** Cookies 資料 */
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    size: number;
    httpOnly: boolean;
    secure: boolean;
    session: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  /** IndexedDB 資料庫名稱列表 */
  indexedDB?: string[];
}

/**
 * Console 訊息
 */
export interface ConsoleMessage {
  /** 訊息等級 */
  level: ConsoleLevel;
  /** 訊息文字 */
  text: string;
  /** 訊息來源 */
  source?: string;
  /** 時間戳 */
  timestamp: number;
  /** 堆疊追蹤 */
  stackTrace?: Array<{
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  }>;
  /** 相關參數 */
  args?: unknown[];
}

/**
 * JavaScript 程式碼覆蓋率資料
 */
export interface CoverageData {
  /** 覆蓋率資料 */
  coverage: Array<{
    /** Script ID */
    scriptId: string;
    /** URL */
    url: string;
    /** 函數覆蓋率 */
    functions: Array<{
      /** 函數名稱 */
      functionName: string;
      /** 範圍 */
      ranges: Array<{
        /** 開始偏移 */
        startOffset: number;
        /** 結束偏移 */
        endOffset: number;
        /** 執行次數 */
        count: number;
      }>;
      /** 是否為區塊覆蓋率 */
      isBlockCoverage: boolean;
    }>;
  }>;
  /** 收集時間戳 */
  timestamp: number;
}

/**
 * 效能分析資料
 */
export interface ProfileData {
  /** 分析成功 */
  success: boolean;
  /** 分析設定檔 */
  profile?: {
    /** 節點資料 */
    nodes: Array<{
      /** 函數資訊 */
      callFrame: {
        functionName: string;
        scriptId: string;
        url: string;
        lineNumber: number;
        columnNumber: number;
      };
      /** 命中次數 */
      hitCount: number;
      /** 子節點 ID */
      children?: number[];
    }>;
    /** 開始時間 */
    startTime: number;
    /** 結束時間 */
    endTime: number;
    /** 樣本 */
    samples?: number[];
    /** 時間間隔 */
    timeDeltas?: number[];
  };
}

/**
 * DevTools 工具參數的基礎介面
 */
export interface DevToolsParams {
  /** 請求 ID (用於追蹤) */
  requestId?: string;
  /** 超時時間 (毫秒) */
  timeout?: number;
}

/**
 * 網路請求過濾參數
 */
export interface NetworkRequestsParams extends DevToolsParams {
  /** 過濾類型 */
  filter?: NetworkRequestType | 'all';
  /** 是否包含回應內容 */
  includeResponseBody?: boolean;
  /** 最大結果數量 */
  limit?: number;
}

/**
 * DOM 檢查參數
 */
export interface InspectElementParams extends DevToolsParams {
  /** CSS 選擇器 */
  selector: string;
  /** 是否包含樣式 */
  includeStyles?: boolean;
  /** 是否包含事件監聽器 */
  includeEventListeners?: boolean;
  /** 是否包含無障礙屬性 */
  includeAccessibility?: boolean;
}

/**
 * JavaScript 執行參數
 */
export interface JavaScriptEvaluationParams extends DevToolsParams {
  /** 要執行的程式碼 */
  code: string;
  /** 是否等待 Promise */
  awaitPromise?: boolean;
  /** 是否模擬用戶手勢 */
  userGesture?: boolean;
  /** 執行上下文 ID */
  contextId?: number;
}

/**
 * 儲存查詢參數
 */
export interface StorageDataParams extends DevToolsParams {
  /** 儲存類型 */
  storageType: StorageType;
  /** 域名 (可選) */
  domain?: string;
}
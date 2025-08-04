/**
 * 統一錯誤處理工具
 * 提供標準化的錯誤處理機制，提升程式碼一致性和錯誤追蹤能力
 */

import { ApiError, ApiResponse } from '../types/devtools-types.js';

/**
 * 錯誤代碼列舉
 */
export enum ErrorCode {
  // 一般錯誤
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_PARAMS = 'INVALID_PARAMS',
  TIMEOUT = 'TIMEOUT',
  
  // 連接錯誤
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  DEBUGGER_ERROR = 'DEBUGGER_ERROR',
  
  // DevTools 錯誤
  CDP_COMMAND_FAILED = 'CDP_COMMAND_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  JAVASCRIPT_ERROR = 'JAVASCRIPT_ERROR',
  
  // 瀏覽器錯誤
  TAB_NOT_FOUND = 'TAB_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EXTENSION_ERROR = 'EXTENSION_ERROR',
  
  // 網路錯誤
  NETWORK_REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  
  // 儲存錯誤
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  
  // 效能分析錯誤
  PROFILING_FAILED = 'PROFILING_FAILED',
  MEMORY_ANALYSIS_FAILED = 'MEMORY_ANALYSIS_FAILED'
}

/**
 * 錯誤嚴重程度
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 建立標準化的 API 錯誤
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  details?: unknown,
  source?: string
): ApiError {
  return {
    code,
    message,
    details,
    timestamp: Date.now(),
    source: source || 'BrowserMCP'
  };
}

/**
 * 建立成功的 API 回應
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
    requestId
  };
}

/**
 * 建立失敗的 API 回應
 */
export function createErrorResponse(
  error: ApiError,
  requestId?: string
): ApiResponse<never> {
  return {
    success: false,
    error,
    timestamp: Date.now(),
    requestId
  };
}

/**
 * 錯誤處理類別
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ApiError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 處理並記錄錯誤
   */
  public handleError(
    code: ErrorCode,
    message: string,
    details?: unknown,
    source?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): ApiError {
    const error = createApiError(code, message, details, source);
    
    // 記錄錯誤
    this.logError(error, severity);
    
    // 根據嚴重程度決定是否立即輸出
    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      console.error(`[BrowserMCP:${severity.toUpperCase()}]`, {
        code: error.code,
        message: error.message,
        details: error.details,
        source: error.source,
        timestamp: new Date(error.timestamp!).toISOString()
      });
    } else if (severity === ErrorSeverity.MEDIUM) {
      console.warn(`[BrowserMCP:WARN]`, error.message);
    } else {
      console.debug(`[BrowserMCP:DEBUG]`, error.message);
    }

    return error;
  }

  /**
   * 包裝非同步操作，自動處理錯誤
   */
  public async wrapAsync<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode,
    errorMessage: string,
    source?: string,
    timeout?: number
  ): Promise<ApiResponse<T>> {
    try {
      let result: T;
      
      if (timeout) {
        result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);
      } else {
        result = await operation();
      }
      
      return createSuccessResponse(result);
    } catch (error) {
      const apiError = this.handleError(
        errorCode,
        errorMessage,
        error,
        source,
        this.getErrorSeverity(errorCode)
      );
      
      return createErrorResponse(apiError);
    }
  }

  /**
   * 包裝同步操作，自動處理錯誤
   */
  public wrapSync<T>(
    operation: () => T,
    errorCode: ErrorCode,
    errorMessage: string,
    source?: string
  ): ApiResponse<T> {
    try {
      const result = operation();
      return createSuccessResponse(result);
    } catch (error) {
      const apiError = this.handleError(
        errorCode,
        errorMessage,
        error,
        source,
        this.getErrorSeverity(errorCode)
      );
      
      return createErrorResponse(apiError);
    }
  }

  /**
   * 取得錯誤歷史記錄
   */
  public getErrorHistory(limit?: number): ApiError[] {
    return limit ? this.errorLog.slice(-limit) : [...this.errorLog];
  }

  /**
   * 清除錯誤記錄
   */
  public clearErrorHistory(): void {
    this.errorLog = [];
  }

  /**
   * 取得錯誤統計
   */
  public getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: number; // 最近一小時的錯誤數
  } {
    const oneHourAgo = Date.now() - 3600000;
    const stats = {
      total: this.errorLog.length,
      byCode: {} as Record<string, number>,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      recent: 0
    };

    this.errorLog.forEach(error => {
      // 統計錯誤代碼
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      
      // 統計最近錯誤
      if (error.timestamp && error.timestamp > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  /**
   * 記錄錯誤到內部記錄
   */
  private logError(error: ApiError, severity: ErrorSeverity): void {
    this.errorLog.push({
      ...error,
      details: {
        ...(error.details || {}),
        severity
      }
    });

    // 限制記錄大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize * 0.8);
    }
  }

  /**
   * 根據錯誤代碼判斷嚴重程度
   */
  private getErrorSeverity(code: ErrorCode): ErrorSeverity {
    switch (code) {
      case ErrorCode.CONNECTION_FAILED:
      case ErrorCode.DEBUGGER_ERROR:
      case ErrorCode.EXTENSION_ERROR:
        return ErrorSeverity.CRITICAL;
        
      case ErrorCode.CDP_COMMAND_FAILED:
      case ErrorCode.JAVASCRIPT_ERROR:
      case ErrorCode.PROFILING_FAILED:
        return ErrorSeverity.HIGH;
        
      case ErrorCode.ELEMENT_NOT_FOUND:
      case ErrorCode.NETWORK_REQUEST_FAILED:
      case ErrorCode.STORAGE_ACCESS_DENIED:
        return ErrorSeverity.MEDIUM;
        
      default:
        return ErrorSeverity.LOW;
    }
  }
}

/**
 * 方便的錯誤處理函數
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * 裝飾器：自動錯誤處理
 */
export function handleErrors(
  errorCode: ErrorCode,
  errorMessage: string,
  source?: string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await method.apply(this, args);
        return createSuccessResponse(result);
      } catch (error) {
        const apiError = errorHandler.handleError(
          errorCode,
          errorMessage,
          error,
          source || target.constructor.name
        );
        return createErrorResponse(apiError);
      }
    };

    return descriptor;
  };
}

/**
 * Chrome 擴充功能特定錯誤處理
 */
export class ChromeExtensionErrorHandler {
  /**
   * 處理 Chrome Debugger API 錯誤
   */
  static handleDebuggerError(error: any): ApiError {
    const chromeAPI = (globalThis as any).chrome;
    if (chromeAPI?.runtime?.lastError) {
      return createApiError(
        ErrorCode.DEBUGGER_ERROR,
        chromeAPI.runtime.lastError.message || 'Debugger API error',
        error,
        'ChromeDebugger'
      );
    }
    
    return createApiError(
      ErrorCode.CDP_COMMAND_FAILED,
      'Chrome DevTools Protocol command failed',
      error,
      'CDP'
    );
  }

  /**
   * 處理 Tab API 錯誤
   */
  static handleTabError(error: any): ApiError {
    const chromeAPI = (globalThis as any).chrome;
    if (chromeAPI?.runtime?.lastError) {
      const message = chromeAPI.runtime.lastError.message || '';
      
      if (message.includes('No tab with id')) {
        return createApiError(
          ErrorCode.TAB_NOT_FOUND,
          'Tab not found or no longer exists',
          error,
          'ChromeTabs'
        );
      }
      
      if (message.includes('access')) {
        return createApiError(
          ErrorCode.PERMISSION_DENIED,
          'Permission denied to access tab',
          error,
          'ChromeTabs'
        );
      }
    }
    
    return createApiError(
      ErrorCode.EXTENSION_ERROR,
      'Chrome extension error',
      error,
      'ChromeExtension'
    );
  }

  /**
   * 處理 WebSocket 錯誤
   */
  static handleWebSocketError(error: any): ApiError {
    return createApiError(
      ErrorCode.WEBSOCKET_ERROR,
      'WebSocket connection error',
      error,
      'WebSocket'
    );
  }
}
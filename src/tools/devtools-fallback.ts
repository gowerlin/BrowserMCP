/**
 * DevTools 工具 - 智能故障轉移版本
 * 整合 Chrome Extension 和 Puppeteer 的智能故障轉移機制
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import type { Tool } from "./tool";
import { SmartFallbackManager } from '../fallback/smart-fallback.js';
import { configManager } from '../config/config-manager.js';
import { 
  NetworkRequestsParams, 
  InspectElementParams, 
  JavaScriptEvaluationParams, 
  StorageDataParams
} from '../types/devtools-types.js';

// 全域故障轉移管理器
let fallbackManager: SmartFallbackManager | null = null;

/**
 * 初始化故障轉移管理器
 */
function initializeFallbackManager(wsUrl?: string): SmartFallbackManager {
  if (!fallbackManager) {
    // 使用配置管理器的設定
    fallbackManager = new SmartFallbackManager(wsUrl);
  }
  return fallbackManager;
}

/**
 * 格式化回應內容
 */
function formatResponse(response: any, toolName: string) {
  if (!response.success) {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          error: true,
          message: response.error?.message || 'Operation failed',
          code: response.error?.code || 'UNKNOWN_ERROR',
          tool: toolName,
          timestamp: new Date().toISOString()
        }, null, 2),
      }],
    };
  }

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        success: true,
        data: response.data,
        tool: toolName,
        timestamp: new Date().toISOString()
      }, null, 2),
    }],
  };
}

// Schema 定義
const GetNetworkRequestsTool = z.object({
  name: z.literal("browser_get_network_requests_fallback"),
  description: z.literal("Get all network requests with intelligent fallback (Extension → Puppeteer)"),
  arguments: z.object({
    filter: z.enum(["all", "xhr", "fetch", "document", "stylesheet", "script", "image", "media", "font", "websocket", "other"]).optional().describe("Filter requests by type"),
    includeResponseBody: z.boolean().optional().default(false).describe("Include response body in the results"),
  }),
});

const ClearNetworkLogTool = z.object({
  name: z.literal("browser_clear_network_log_fallback"),
  description: z.literal("Clear all recorded network requests with intelligent fallback"),
  arguments: z.object({}),
});

const GetPerformanceMetricsTool = z.object({
  name: z.literal("browser_get_performance_metrics_fallback"),
  description: z.literal("Get performance metrics including Core Web Vitals with intelligent fallback"),
  arguments: z.object({}),
});

const InspectElementTool = z.object({
  name: z.literal("browser_inspect_element_fallback"),
  description: z.literal("Inspect a DOM element with intelligent fallback (Extension → Puppeteer)"),
  arguments: z.object({
    selector: z.string().describe("CSS selector or XPath to find the element"),
    includeStyles: z.boolean().optional().default(true).describe("Include computed styles"),
    includeEventListeners: z.boolean().optional().default(true).describe("Include event listeners"),
    includeAccessibility: z.boolean().optional().default(false).describe("Include accessibility properties"),
  }),
});

const EvaluateJavaScriptTool = z.object({
  name: z.literal("browser_evaluate_javascript_fallback"),
  description: z.literal("Execute JavaScript code in the page context with intelligent fallback"),
  arguments: z.object({
    code: z.string().describe("JavaScript code to execute"),
    awaitPromise: z.boolean().optional().default(false).describe("Whether to await promise results"),
  }),
});

const GetMemoryUsageTool = z.object({
  name: z.literal("browser_get_memory_usage_fallback"),
  description: z.literal("Get memory usage statistics with intelligent fallback"),
  arguments: z.object({}),
});

const GetStorageDataTool = z.object({
  name: z.literal("browser_get_storage_data_fallback"),
  description: z.literal("Get browser storage data with intelligent fallback"),
  arguments: z.object({
    storageType: z.enum(["localStorage", "sessionStorage", "cookies", "indexedDB", "all"]).describe("Type of storage to retrieve"),
    domain: z.string().optional().describe("Domain filter (optional)"),
  }),
});

const GetConsoleLogsTool = z.object({
  name: z.literal("browser_get_console_logs_fallback"),
  description: z.literal("Get console logs with intelligent fallback"),
  arguments: z.object({}),
});

const NavigateTool = z.object({
  name: z.literal("browser_navigate_fallback"),
  description: z.literal("Navigate to a URL with intelligent fallback (Extension → Puppeteer)"),
  arguments: z.object({
    url: z.string().describe("URL to navigate to"),
  }),
});

const GetPageInfoTool = z.object({
  name: z.literal("browser_get_page_info_fallback"),
  description: z.literal("Get page information with intelligent fallback"),
  arguments: z.object({}),
});

const HealthCheckTool = z.object({
  name: z.literal("browser_health_check"),
  description: z.literal("Check the health status of both Extension and Puppeteer modes"),
  arguments: z.object({}),
});

const SetModeTool = z.object({
  name: z.literal("browser_set_mode"),
  description: z.literal("Set the preferred mode (extension, puppeteer, or auto)"),
  arguments: z.object({
    mode: z.enum(["extension", "puppeteer", "auto"]).describe("Mode to use"),
  }),
});

// 工具實作
export const getNetworkRequestsFallback: Tool = {
  schema: {
    name: GetNetworkRequestsTool.shape.name.value,
    description: GetNetworkRequestsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetNetworkRequestsTool.shape.arguments),
  },
  handle: async (context, params) => {
    const manager = initializeFallbackManager();
    const validatedParams = GetNetworkRequestsTool.shape.arguments.parse(params);
    
    const response = await manager.getNetworkRequests(
      validatedParams.filter,
      validatedParams.includeResponseBody
    );
    
    return formatResponse(response, 'getNetworkRequests');
  },
};

export const clearNetworkLogFallback: Tool = {
  schema: {
    name: ClearNetworkLogTool.shape.name.value,
    description: ClearNetworkLogTool.shape.description.value,
    inputSchema: zodToJsonSchema(ClearNetworkLogTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const manager = initializeFallbackManager();
    const response = await manager.clearNetworkLog();
    return formatResponse(response, 'clearNetworkLog');
  },
};

export const getPerformanceMetricsFallback: Tool = {
  schema: {
    name: GetPerformanceMetricsTool.shape.name.value,
    description: GetPerformanceMetricsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetPerformanceMetricsTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const manager = initializeFallbackManager();
    const response = await manager.getPerformanceMetrics();
    return formatResponse(response, 'getPerformanceMetrics');
  },
};

export const inspectElementFallback: Tool = {
  schema: {
    name: InspectElementTool.shape.name.value,
    description: InspectElementTool.shape.description.value,
    inputSchema: zodToJsonSchema(InspectElementTool.shape.arguments),
  },
  handle: async (context, params) => {
    const manager = initializeFallbackManager();
    const validatedParams = InspectElementTool.shape.arguments.parse(params);
    
    const response = await manager.inspectElement(validatedParams.selector, {
      includeStyles: validatedParams.includeStyles,
      includeEventListeners: validatedParams.includeEventListeners,
      includeAccessibility: validatedParams.includeAccessibility,
    });
    
    return formatResponse(response, 'inspectElement');
  },
};

export const evaluateJavaScriptFallback: Tool = {
  schema: {
    name: EvaluateJavaScriptTool.shape.name.value,
    description: EvaluateJavaScriptTool.shape.description.value,
    inputSchema: zodToJsonSchema(EvaluateJavaScriptTool.shape.arguments),
  },
  handle: async (context, params) => {
    const manager = initializeFallbackManager();
    const validatedParams = EvaluateJavaScriptTool.shape.arguments.parse(params);
    
    const response = await manager.evaluateJavaScript(
      validatedParams.code,
      validatedParams.awaitPromise
    );
    
    return formatResponse(response, 'evaluateJavaScript');
  },
};

export const getMemoryUsageFallback: Tool = {
  schema: {
    name: GetMemoryUsageTool.shape.name.value,
    description: GetMemoryUsageTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetMemoryUsageTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const manager = initializeFallbackManager();
    const response = await manager.getMemoryUsage();
    return formatResponse(response, 'getMemoryUsage');
  },
};

export const getStorageDataFallback: Tool = {
  schema: {
    name: GetStorageDataTool.shape.name.value,
    description: GetStorageDataTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetStorageDataTool.shape.arguments),
  },
  handle: async (context, params) => {
    const manager = initializeFallbackManager();
    const validatedParams = GetStorageDataTool.shape.arguments.parse(params);
    
    const response = await manager.getStorageData(
      validatedParams.storageType,
      validatedParams.domain
    );
    
    return formatResponse(response, 'getStorageData');
  },
};

export const getConsoleLogsFallback: Tool = {
  schema: {
    name: GetConsoleLogsTool.shape.name.value,
    description: GetConsoleLogsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetConsoleLogsTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const manager = initializeFallbackManager();
    const response = await manager.getConsoleLogs();
    return formatResponse(response, 'getConsoleLogs');
  },
};

export const navigateFallback: Tool = {
  schema: {
    name: NavigateTool.shape.name.value,
    description: NavigateTool.shape.description.value,
    inputSchema: zodToJsonSchema(NavigateTool.shape.arguments),
  },
  handle: async (context, params) => {
    const manager = initializeFallbackManager();
    const validatedParams = NavigateTool.shape.arguments.parse(params);
    
    const response = await manager.navigate(validatedParams.url);
    return formatResponse(response, 'navigate');
  },
};

export const getPageInfoFallback: Tool = {
  schema: {
    name: GetPageInfoTool.shape.name.value,
    description: GetPageInfoTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetPageInfoTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const manager = initializeFallbackManager();
    const response = await manager.getPageInfo();
    return formatResponse(response, 'getPageInfo');
  },
};

export const healthCheck: Tool = {
  schema: {
    name: HealthCheckTool.shape.name.value,
    description: HealthCheckTool.shape.description.value,
    inputSchema: zodToJsonSchema(HealthCheckTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const manager = initializeFallbackManager();
    const health = await manager.healthCheck();
    
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          health,
          recommendations: [
            !health.extension.available && 'Consider installing the Chrome extension for better performance',
            !health.puppeteer.initialized && health.currentMode === 'puppeteer' && 'Puppeteer mode selected but not initialized',
            health.currentMode === 'auto' && 'Auto mode enabled - will use best available option'
          ].filter(Boolean),
          timestamp: new Date().toISOString()
        }, null, 2),
      }],
    };
  },
};

export const setMode: Tool = {
  schema: {
    name: SetModeTool.shape.name.value,
    description: SetModeTool.shape.description.value,
    inputSchema: zodToJsonSchema(SetModeTool.shape.arguments),
  },
  handle: async (context, params) => {
    const manager = initializeFallbackManager();
    const validatedParams = SetModeTool.shape.arguments.parse(params);
    
    manager.setMode(validatedParams.mode);
    
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          mode: validatedParams.mode,
          message: `Mode set to: ${validatedParams.mode}`,
          timestamp: new Date().toISOString()
        }, null, 2),
      }],
    };
  },
};

// 清理函數（在程序退出時呼叫）
export async function cleanupFallback(): Promise<void> {
  if (fallbackManager) {
    await fallbackManager.cleanup();
    fallbackManager = null;
  }
}
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import type { Tool } from "./tool";

// Network 監控相關 Schema
const GetNetworkRequestsTool = z.object({
  name: z.literal("browser_get_network_requests"),
  description: z.literal("Get all network requests made by the page including headers, status, timing, and response data"),
  arguments: z.object({
    filter: z.enum(["all", "xhr", "fetch", "document", "stylesheet", "script", "image", "media", "font", "websocket", "other"]).optional().describe("Filter requests by type"),
    includeResponseBody: z.boolean().optional().default(false).describe("Include response body in the results (may be large)"),
  }),
});

const ClearNetworkLogTool = z.object({
  name: z.literal("browser_clear_network_log"),
  description: z.literal("Clear all recorded network requests"),
  arguments: z.object({}),
});

// Performance 監控相關 Schema
const GetPerformanceMetricsTool = z.object({
  name: z.literal("browser_get_performance_metrics"),
  description: z.literal("Get performance metrics including Core Web Vitals, memory usage, and timing data"),
  arguments: z.object({}),
});

const StartPerformanceProfilingTool = z.object({
  name: z.literal("browser_start_performance_profiling"),
  description: z.literal("Start recording performance profiling data"),
  arguments: z.object({
    categories: z.array(z.enum(["js", "rendering", "painting", "loading", "idle"])).optional().describe("Categories to profile"),
  }),
});

const StopPerformanceProfilingTool = z.object({
  name: z.literal("browser_stop_performance_profiling"),
  description: z.literal("Stop recording performance profiling and return the data"),
  arguments: z.object({}),
});

// DOM 檢查相關 Schema
const InspectElementTool = z.object({
  name: z.literal("browser_inspect_element"),
  description: z.literal("Inspect a DOM element and get its properties, styles, and event listeners"),
  arguments: z.object({
    selector: z.string().describe("CSS selector or XPath to find the element"),
    includeStyles: z.boolean().optional().default(true).describe("Include computed styles"),
    includeEventListeners: z.boolean().optional().default(true).describe("Include event listeners"),
    includeAccessibility: z.boolean().optional().default(false).describe("Include accessibility properties"),
  }),
});

const GetDOMTreeTool = z.object({
  name: z.literal("browser_get_dom_tree"),
  description: z.literal("Get the DOM tree structure of the page or a specific element"),
  arguments: z.object({
    rootSelector: z.string().optional().describe("Root element selector (defaults to document)"),
    maxDepth: z.number().optional().default(3).describe("Maximum depth to traverse"),
    includeAttributes: z.boolean().optional().default(true).describe("Include element attributes"),
  }),
});

// JavaScript 執行環境相關 Schema
const EvaluateJavaScriptTool = z.object({
  name: z.literal("browser_evaluate_javascript"),
  description: z.literal("Execute JavaScript code in the page context and return the result"),
  arguments: z.object({
    code: z.string().describe("JavaScript code to execute"),
    awaitPromise: z.boolean().optional().default(false).describe("Wait for promise resolution if the result is a promise"),
  }),
});

const GetJavaScriptCoverageTool = z.object({
  name: z.literal("browser_get_javascript_coverage"),
  description: z.literal("Get JavaScript code coverage information"),
  arguments: z.object({
    startCoverage: z.boolean().optional().describe("Start coverage collection if not already started"),
  }),
});

// Memory 分析相關 Schema
const GetMemoryUsageTool = z.object({
  name: z.literal("browser_get_memory_usage"),
  description: z.literal("Get memory usage statistics including heap size and object counts"),
  arguments: z.object({}),
});

const TakeHeapSnapshotTool = z.object({
  name: z.literal("browser_take_heap_snapshot"),
  description: z.literal("Take a heap snapshot for memory analysis"),
  arguments: z.object({
    format: z.enum(["summary", "detailed"]).optional().default("summary").describe("Snapshot format"),
  }),
});

// Security 分析相關 Schema
const GetSecurityStateTool = z.object({
  name: z.literal("browser_get_security_state"),
  description: z.literal("Get the security state of the page including certificate details and mixed content"),
  arguments: z.object({}),
});

// Storage 檢查相關 Schema
const GetStorageDataTool = z.object({
  name: z.literal("browser_get_storage_data"),
  description: z.literal("Get data from browser storage (localStorage, sessionStorage, cookies, IndexedDB)"),
  arguments: z.object({
    storageType: z.enum(["localStorage", "sessionStorage", "cookies", "indexedDB", "all"]).describe("Type of storage to retrieve"),
    domain: z.string().optional().describe("Domain to get storage for (defaults to current)"),
  }),
});

// 實作 Network 工具
export const getNetworkRequests: Tool = {
  schema: {
    name: GetNetworkRequestsTool.shape.name.value,
    description: GetNetworkRequestsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetNetworkRequestsTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = GetNetworkRequestsTool.shape.arguments.parse(params);
    const requests = await context.sendSocketMessage("browser_get_network_requests", validatedParams);
    
    const formattedRequests = requests.map((req: any) => ({
      url: req.url,
      method: req.method,
      status: req.status,
      type: req.type,
      size: req.size,
      time: req.time,
      headers: req.headers,
      response: validatedParams.includeResponseBody ? req.response : undefined,
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify(formattedRequests, null, 2),
      }],
    };
  },
};

export const clearNetworkLog: Tool = {
  schema: {
    name: ClearNetworkLogTool.shape.name.value,
    description: ClearNetworkLogTool.shape.description.value,
    inputSchema: zodToJsonSchema(ClearNetworkLogTool.shape.arguments),
  },
  handle: async (context, _params) => {
    await context.sendSocketMessage("browser_clear_network_log", {});
    return {
      content: [{
        type: "text",
        text: "Network log cleared",
      }],
    };
  },
};

// 實作 Performance 工具
export const getPerformanceMetrics: Tool = {
  schema: {
    name: GetPerformanceMetricsTool.shape.name.value,
    description: GetPerformanceMetricsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetPerformanceMetricsTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const metrics = await context.sendSocketMessage("browser_get_performance_metrics", {});
    return {
      content: [{
        type: "text",
        text: JSON.stringify(metrics, null, 2),
      }],
    };
  },
};

export const startPerformanceProfiling: Tool = {
  schema: {
    name: StartPerformanceProfilingTool.shape.name.value,
    description: StartPerformanceProfilingTool.shape.description.value,
    inputSchema: zodToJsonSchema(StartPerformanceProfilingTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = StartPerformanceProfilingTool.shape.arguments.parse(params);
    await context.sendSocketMessage("browser_start_performance_profiling", validatedParams);
    return {
      content: [{
        type: "text",
        text: "Performance profiling started",
      }],
    };
  },
};

export const stopPerformanceProfiling: Tool = {
  schema: {
    name: StopPerformanceProfilingTool.shape.name.value,
    description: StopPerformanceProfilingTool.shape.description.value,
    inputSchema: zodToJsonSchema(StopPerformanceProfilingTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const profile = await context.sendSocketMessage("browser_stop_performance_profiling", {});
    return {
      content: [{
        type: "text",
        text: JSON.stringify(profile, null, 2),
      }],
    };
  },
};

// 實作 DOM 檢查工具
export const inspectElement: Tool = {
  schema: {
    name: InspectElementTool.shape.name.value,
    description: InspectElementTool.shape.description.value,
    inputSchema: zodToJsonSchema(InspectElementTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = InspectElementTool.shape.arguments.parse(params);
    const elementInfo = await context.sendSocketMessage("browser_inspect_element", validatedParams);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(elementInfo, null, 2),
      }],
    };
  },
};

export const getDOMTree: Tool = {
  schema: {
    name: GetDOMTreeTool.shape.name.value,
    description: GetDOMTreeTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetDOMTreeTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = GetDOMTreeTool.shape.arguments.parse(params);
    const domTree = await context.sendSocketMessage("browser_get_dom_tree", validatedParams);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(domTree, null, 2),
      }],
    };
  },
};

// 實作 JavaScript 執行工具
export const evaluateJavaScript: Tool = {
  schema: {
    name: EvaluateJavaScriptTool.shape.name.value,
    description: EvaluateJavaScriptTool.shape.description.value,
    inputSchema: zodToJsonSchema(EvaluateJavaScriptTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = EvaluateJavaScriptTool.shape.arguments.parse(params);
    try {
      const result = await context.sendSocketMessage("browser_evaluate_javascript", validatedParams);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `JavaScript evaluation error: ${error}`,
        }],
        isError: true,
      };
    }
  },
};

export const getJavaScriptCoverage: Tool = {
  schema: {
    name: GetJavaScriptCoverageTool.shape.name.value,
    description: GetJavaScriptCoverageTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetJavaScriptCoverageTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = GetJavaScriptCoverageTool.shape.arguments.parse(params);
    const coverage = await context.sendSocketMessage("browser_get_javascript_coverage", validatedParams);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(coverage, null, 2),
      }],
    };
  },
};

// 實作 Memory 分析工具
export const getMemoryUsage: Tool = {
  schema: {
    name: GetMemoryUsageTool.shape.name.value,
    description: GetMemoryUsageTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetMemoryUsageTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const memoryUsage = await context.sendSocketMessage("browser_get_memory_usage", {});
    return {
      content: [{
        type: "text",
        text: JSON.stringify(memoryUsage, null, 2),
      }],
    };
  },
};

export const takeHeapSnapshot: Tool = {
  schema: {
    name: TakeHeapSnapshotTool.shape.name.value,
    description: TakeHeapSnapshotTool.shape.description.value,
    inputSchema: zodToJsonSchema(TakeHeapSnapshotTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = TakeHeapSnapshotTool.shape.arguments.parse(params);
    const snapshot = await context.sendSocketMessage("browser_take_heap_snapshot", validatedParams);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(snapshot, null, 2),
      }],
    };
  },
};

// 實作 Security 分析工具
export const getSecurityState: Tool = {
  schema: {
    name: GetSecurityStateTool.shape.name.value,
    description: GetSecurityStateTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetSecurityStateTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const securityState = await context.sendSocketMessage("browser_get_security_state", {});
    return {
      content: [{
        type: "text",
        text: JSON.stringify(securityState, null, 2),
      }],
    };
  },
};

// 實作 Storage 檢查工具
export const getStorageData: Tool = {
  schema: {
    name: GetStorageDataTool.shape.name.value,
    description: GetStorageDataTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetStorageDataTool.shape.arguments),
  },
  handle: async (context, params) => {
    const validatedParams = GetStorageDataTool.shape.arguments.parse(params);
    const storageData = await context.sendSocketMessage("browser_get_storage_data", validatedParams);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(storageData, null, 2),
      }],
    };
  },
};
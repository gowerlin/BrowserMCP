// 內部類型定義檔案 - 暫時替代 @repo 套件依賴

import { z } from "zod";

// App 配置
export const appConfig = {
  name: "BrowserMCP",
  version: "0.1.3",
};

// MCP 配置
export const mcpConfig = {
  defaultWsPort: 9002,
  errors: {
    noConnectedTab: "No connected tab",
  },
};

// WebSocket 訊息類型
export interface SocketMessageMap {
  // 基本瀏覽器操作
  browser_navigate: { url: string };
  browser_go_back: {};
  browser_go_forward: {};
  browser_wait: { time: number };
  browser_press_key: { key: string };
  browser_snapshot: {};
  browser_screenshot: {};
  browser_get_console_logs: {};
  
  // 頁面資訊
  getUrl: undefined;
  getTitle: undefined;
  
  // 元素互動
  browser_click: { selector: string; button?: string };
  browser_drag: { from: string; to: string };
  browser_hover: { selector: string };
  browser_type: { selector: string; text: string };
  browser_select_option: { selector: string; value: string };
  
  // DevTools 功能
  browser_get_network_requests: { 
    filter?: string; 
    includeResponseBody?: boolean;
  };
  browser_clear_network_log: {};
  browser_get_performance_metrics: {};
  browser_start_performance_profiling: { 
    categories?: string[];
  };
  browser_stop_performance_profiling: {};
  browser_inspect_element: {
    selector: string;
    includeStyles?: boolean;
    includeEventListeners?: boolean;
    includeAccessibility?: boolean;
  };
  browser_get_dom_tree: {
    rootSelector?: string;
    maxDepth?: number;
    includeAttributes?: boolean;
  };
  browser_evaluate_javascript: {
    code: string;
    awaitPromise?: boolean;
  };
  browser_get_javascript_coverage: {
    startCoverage?: boolean;
  };
  browser_get_memory_usage: {};
  browser_take_heap_snapshot: {
    format?: "summary" | "detailed";
  };
  browser_get_security_state: {};
  browser_get_storage_data: {
    storageType: string;
    domain?: string;
  };
}

// 訊息類型
export type MessageType<T> = keyof T;
export type MessagePayload<T, K extends keyof T> = T[K];

// 工具定義
export const NavigateTool = z.object({
  name: z.literal("browser_navigate"),
  description: z.literal("Navigate to a URL"),
  arguments: z.object({
    url: z.string().describe("URL to navigate to"),
  }),
});

export const GoBackTool = z.object({
  name: z.literal("browser_go_back"),
  description: z.literal("Navigate back in browser history"),
  arguments: z.object({}),
});

export const GoForwardTool = z.object({
  name: z.literal("browser_go_forward"),
  description: z.literal("Navigate forward in browser history"),
  arguments: z.object({}),
});

export const WaitTool = z.object({
  name: z.literal("browser_wait"),
  description: z.literal("Wait for specified time"),
  arguments: z.object({
    time: z.number().describe("Time to wait in seconds"),
  }),
});

export const PressKeyTool = z.object({
  name: z.literal("browser_press_key"),
  description: z.literal("Press a keyboard key"),
  arguments: z.object({
    key: z.string().describe("Key to press"),
  }),
});

export const GetConsoleLogsTool = z.object({
  name: z.literal("browser_get_console_logs"),
  description: z.literal("Get console logs from the browser"),
  arguments: z.object({}),
});

export const ScreenshotTool = z.object({
  name: z.literal("browser_screenshot"),
  description: z.literal("Take a screenshot of the current page"),
  arguments: z.object({}),
});

export const SnapshotTool = z.object({
  name: z.literal("browser_snapshot"),
  description: z.literal("Get ARIA snapshot of the current page"),
  arguments: z.object({}),
});

export const ClickTool = z.object({
  name: z.literal("browser_click"),
  description: z.literal("Click on an element"),
  arguments: z.object({
    selector: z.string().describe("CSS selector or XPath of the element to click"),
    button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button to use"),
  }),
});

export const HoverTool = z.object({
  name: z.literal("browser_hover"),
  description: z.literal("Hover over an element"),
  arguments: z.object({
    selector: z.string().describe("CSS selector or XPath of the element to hover"),
  }),
});

export const TypeTool = z.object({
  name: z.literal("browser_type"),
  description: z.literal("Type text into an element"),
  arguments: z.object({
    selector: z.string().describe("CSS selector or XPath of the element"),
    text: z.string().describe("Text to type"),
  }),
});

export const SelectOptionTool = z.object({
  name: z.literal("browser_select_option"),
  description: z.literal("Select an option from a dropdown"),
  arguments: z.object({
    selector: z.string().describe("CSS selector or XPath of the select element"),
    value: z.string().describe("Value of the option to select"),
  }),
});

export const DragTool = z.object({
  name: z.literal("browser_drag"),
  description: z.literal("Drag an element to another element"),
  arguments: z.object({
    from: z.string().describe("CSS selector or XPath of the element to drag"),
    to: z.string().describe("CSS selector or XPath of the target element"),
  }),
});

// 輔助函數
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// WebSocket 訊息發送器
export function createSocketMessageSender<T>(ws: any) {
  return {
    sendSocketMessage: async (type: keyof T, payload: any, options?: any) => {
      // 模擬發送訊息到 WebSocket
      return new Promise((resolve, reject) => {
        const message = JSON.stringify({ type, payload });
        
        if (ws.readyState === ws.OPEN) {
          ws.send(message);
          
          // 模擬接收回應
          const timeout = options?.timeoutMs || 30000;
          const timer = setTimeout(() => {
            reject(new Error('Request timeout'));
          }, timeout);
          
          const handler = (event: any) => {
            const data = JSON.parse(event.data);
            if (data.type === `${String(type)}_response`) {
              clearTimeout(timer);
              ws.removeEventListener('message', handler);
              resolve(data.payload);
            }
          };
          
          ws.addEventListener('message', handler);
        } else {
          reject(new Error('WebSocket is not connected'));
        }
      });
    }
  };
}
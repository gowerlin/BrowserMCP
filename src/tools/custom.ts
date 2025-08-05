import { zodToJsonSchema } from "zod-to-json-schema";

import { GetConsoleLogsTool, ScreenshotTool } from "../types/internal-types";

import { Tool } from "./tool";

export const getConsoleLogs: Tool = {
  schema: {
    name: GetConsoleLogsTool.shape.name.value,
    description: GetConsoleLogsTool.shape.description.value,
    inputSchema: zodToJsonSchema(GetConsoleLogsTool.shape.arguments),
  },
  handle: async (context, _params) => {
    const consoleLogs = await context.sendSocketMessage(
      "browser_get_console_logs",
      {},
    );
    const text: string = (consoleLogs as any[])
      .map((log: any) => JSON.stringify(log))
      .join("\n");
    return {
      content: [{ type: "text", text }],
    };
  },
};

export const screenshot: Tool = {
  schema: {
    name: ScreenshotTool.shape.name.value,
    description: "Take an optimized screenshot with smart compression and segmentation support",
    inputSchema: zodToJsonSchema(ScreenshotTool.shape.arguments),
  },
  handle: async (context, params: any = {}) => {
    const screenshot = await context.sendSocketMessage(
      "browser_screenshot",
      {
        format: params.format || 'auto',
        quality: params.quality,
        fullPage: params.fullPage,
        smartCompression: params.smartCompression !== false,
        enableSegmentation: params.enableSegmentation,
        maxHeight: params.maxHeight
      },
    );
    
    // 處理分段截圖結果
    if (Array.isArray(screenshot)) {
      return {
        content: screenshot.map((segment: string, index: number) => ({
          type: "image",
          data: segment,
          mimeType: `image/${params.format || 'png'}`,
          filename: `screenshot_segment_${index + 1}.${params.format || 'png'}`
        })),
      };
    }
    
    return {
      content: [
        {
          type: "image",
          data: screenshot as string,
          mimeType: `image/${params.format || 'png'}`,
        },
      ],
    };
  },
};

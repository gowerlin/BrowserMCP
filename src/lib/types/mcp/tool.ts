import { z } from 'zod';

/**
 * MCP tool type definitions using Zod schemas
 */

// Navigation tools
export const NavigateTool = z.object({
  name: z.literal("navigate"),
  description: z.literal("Navigate to a URL"),
  arguments: z.object({
    url: z.string().url().describe("The URL to navigate to"),
  }),
});

export const GoBackTool = z.object({
  name: z.literal("go_back"),
  description: z.literal("Go back in browser history"),
  arguments: z.object({}),
});

export const GoForwardTool = z.object({
  name: z.literal("go_forward"),
  description: z.literal("Go forward in browser history"),
  arguments: z.object({}),
});

// Input tools
export const WaitTool = z.object({
  name: z.literal("wait"),
  description: z.literal("Wait for a specified time"),
  arguments: z.object({
    time: z.number()
      .positive()
      .describe("Time to wait in milliseconds"),
  }),
});

export const PressKeyTool = z.object({
  name: z.literal("press_key"),
  description: z.literal("Press a keyboard key"),
  arguments: z.object({
    key: z.string()
      .describe("The key to press (e.g., 'Enter', 'Escape', 'Tab')"),
  }),
});

export const TypeTool = z.object({
  name: z.literal("type"),
  description: z.literal("Type text into an element"),
  arguments: z.object({
    element: z.string()
      .describe("The element to type into"),
    text: z.string()
      .describe("The text to type"),
  }),
});

// Interaction tools
export const ClickTool = z.object({
  name: z.literal("click"),
  description: z.literal("Click on an element"),
  arguments: z.object({
    element: z.string()
      .describe("The element to click"),
  }),
});

export const DragTool = z.object({
  name: z.literal("drag"),
  description: z.literal("Drag from one element to another"),
  arguments: z.object({
    startElement: z.string()
      .describe("The element to start dragging from"),
    endElement: z.string()
      .describe("The element to drop onto"),
  }),
});

export const HoverTool = z.object({
  name: z.literal("hover"),
  description: z.literal("Hover over an element"),
  arguments: z.object({
    element: z.string()
      .describe("The element to hover over"),
  }),
});

export const SelectOptionTool = z.object({
  name: z.literal("select_option"),
  description: z.literal("Select an option from a select element"),
  arguments: z.object({
    element: z.string()
      .describe("The select element"),
    option: z.string()
      .optional()
      .describe("The option to select"),
  }),
});

// Information retrieval tools
export const GetConsoleLogsTool = z.object({
  name: z.literal("get_console_logs"),
  description: z.literal("Get browser console logs"),
  arguments: z.object({}),
});

export const ScreenshotTool = z.object({
  name: z.literal("screenshot"),
  description: z.literal("Take a screenshot of the current page"),
  arguments: z.object({}),
});

export const SnapshotTool = z.object({
  name: z.literal("snapshot"),
  description: z.literal("Capture an ARIA snapshot of the current page"),
  arguments: z.object({}),
});

// Type exports for compatibility
export type NavigateToolInput = z.infer<typeof NavigateTool>;
export type GoBackToolInput = z.infer<typeof GoBackTool>;
export type GoForwardToolInput = z.infer<typeof GoForwardTool>;
export type WaitToolInput = z.infer<typeof WaitTool>;
export type PressKeyToolInput = z.infer<typeof PressKeyTool>;
export type TypeToolInput = z.infer<typeof TypeTool>;
export type ClickToolInput = z.infer<typeof ClickTool>;
export type DragToolInput = z.infer<typeof DragTool>;
export type HoverToolInput = z.infer<typeof HoverTool>;
export type SelectOptionToolInput = z.infer<typeof SelectOptionTool>;
export type GetConsoleLogsToolInput = z.infer<typeof GetConsoleLogsTool>;
export type ScreenshotToolInput = z.infer<typeof ScreenshotTool>;
export type SnapshotToolInput = z.infer<typeof SnapshotTool>;
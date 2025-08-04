#!/usr/bin/env node
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { program } from "commander";

import { appConfig } from "./types/internal-types";

import type { Resource } from "@/resources/resource";
import { createServerWithTools } from "@/server";
import * as common from "@/tools/common";
import * as custom from "@/tools/custom";
import * as devtools from "@/tools/devtools";
import * as snapshot from "@/tools/snapshot";
import type { Tool } from "@/tools/tool";

import packageJSON from "../package.json";

function setupExitWatchdog(server: Server) {
  process.stdin.on("close", async () => {
    setTimeout(() => process.exit(0), 15000);
    await server.close();
    process.exit(0);
  });
}

const commonTools: Tool[] = [common.pressKey, common.wait];

const customTools: Tool[] = [custom.getConsoleLogs, custom.screenshot];

const devToolsTools: Tool[] = [
  // Network 監控
  devtools.getNetworkRequests,
  devtools.clearNetworkLog,
  // Performance 監控
  devtools.getPerformanceMetrics,
  devtools.startPerformanceProfiling,
  devtools.stopPerformanceProfiling,
  // DOM 檢查
  devtools.inspectElement,
  devtools.getDOMTree,
  // JavaScript 執行
  devtools.evaluateJavaScript,
  devtools.getJavaScriptCoverage,
  // Memory 分析
  devtools.getMemoryUsage,
  devtools.takeHeapSnapshot,
  // Security 分析
  devtools.getSecurityState,
  // Storage 檢查
  devtools.getStorageData,
];

const snapshotTools: Tool[] = [
  common.navigate(true),
  common.goBack(true),
  common.goForward(true),
  snapshot.snapshot,
  snapshot.click,
  snapshot.hover,
  snapshot.type,
  snapshot.selectOption,
  ...commonTools,
  ...customTools,
  ...devToolsTools,
];

const resources: Resource[] = [];

async function createServer(): Promise<Server> {
  return createServerWithTools({
    name: appConfig.name,
    version: packageJSON.version,
    tools: snapshotTools,
    resources,
  });
}

/**
 * Note: Tools must be defined *before* calling `createServer` because only declarations are hoisted, not the initializations
 */
program
  .version("Version " + packageJSON.version)
  .name(packageJSON.name)
  .action(async () => {
    const server = await createServer();
    setupExitWatchdog(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
  });
program.parse(process.argv);

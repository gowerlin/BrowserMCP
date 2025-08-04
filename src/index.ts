#!/usr/bin/env node
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { program } from "commander";

import { appConfig } from "./types/internal-types";
import { configManager } from "./config/config-manager.js";

import type { Resource } from "@/resources/resource";
import { createServerWithTools } from "@/server";
import * as common from "@/tools/common";
import * as custom from "@/tools/custom";
import * as devtools from "@/tools/devtools";
import * as devtoolsFallback from "@/tools/devtools-fallback";
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

// 根據配置選擇工具集
function getDevToolsTools(): Tool[] {
  const config = configManager.getConfig();
  const fallbackMode = config.fallback.mode;

  if (fallbackMode === 'extension') {
    // 僅使用 Extension 工具
    return [
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
  } else {
    // 使用備援工具 (puppeteer 或 auto 模式)
    return [
      // 備援版本工具
      devtoolsFallback.getNetworkRequestsFallback,
      devtoolsFallback.clearNetworkLogFallback,
      devtoolsFallback.getPerformanceMetricsFallback,
      devtoolsFallback.inspectElementFallback,
      devtoolsFallback.evaluateJavaScriptFallback,
      devtoolsFallback.getMemoryUsageFallback,
      devtoolsFallback.getStorageDataFallback,
      devtoolsFallback.getConsoleLogsFallback,
      devtoolsFallback.navigateFallback,
      devtoolsFallback.getPageInfoFallback,
      // 工具管理
      devtoolsFallback.healthCheck,
      devtoolsFallback.setMode,
      // 原始工具（作為備用）
      devtools.startPerformanceProfiling,
      devtools.stopPerformanceProfiling,
      devtools.getDOMTree,
      devtools.getJavaScriptCoverage,
      devtools.takeHeapSnapshot,
      devtools.getSecurityState,
    ];
  }
}

function getSnapshotTools(): Tool[] {
  return [
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
    ...getDevToolsTools(),
  ];
}

const resources: Resource[] = [];

async function createServer(): Promise<Server> {
  return createServerWithTools({
    name: appConfig.name,
    version: packageJSON.version,
    tools: getSnapshotTools(),
    resources,
  });
}

/**
 * Note: Tools must be defined *before* calling `createServer` because only declarations are hoisted, not the initializations
 */
program
  .version("Version " + packageJSON.version)
  .name(packageJSON.name)
  .description('BrowserMCP - Browser automation with intelligent fallback system')
  // 備援模式選項
  .option('--mode <mode>', '備援模式: extension | puppeteer | auto', 'auto')
  .option('--extension-only', '僅使用 Chrome Extension')
  .option('--puppeteer-only', '僅使用 Puppeteer')
  .option('--auto-fallback', '智能備援模式 (預設)')
  // Puppeteer 選項
  .option('--headless', 'Puppeteer 無頭模式')
  .option('--no-headless', 'Puppeteer 有頭模式')
  // 其他選項
  .option('--verbose', '啟用詳細記錄')
  .option('--quiet', '關閉詳細記錄')
  .option('--ws-url <url>', 'WebSocket 伺服器 URL')
  .option('--config <path>', '指定配置檔案路徑')
  .option('--show-config', '顯示當前配置')
  .option('--generate-config', '產生配置範例檔案')
  .action(async (options) => {
    // 處理特殊命令
    if (options.generateConfig) {
      const exampleConfig = configManager.generateExampleConfig();
      console.log('🔧 配置範例檔案內容：\n');
      console.log(exampleConfig);
      console.log('\n💡 使用方法：');
      console.log('1. 複製上述內容到 browsermcp.config.json');
      console.log('2. 根據需要修改配置');
      console.log('3. 重新啟動 BrowserMCP');
      process.exit(0);
    }

    if (options.showConfig) {
      configManager.printConfigSummary();
      process.exit(0);
    }

    // 啟動時顯示配置摘要
    if (configManager.getConfig().fallback.enableLogging) {
      configManager.printConfigSummary();
    }

    // 驗證配置
    const validation = configManager.validateConfig();
    if (!validation.valid) {
      console.error('❌ 配置錯誤:');
      validation.errors.forEach(error => console.error(`  • ${error}`));
      process.exit(1);
    }

    const server = await createServer();
    setupExitWatchdog(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    // 輸出啟動資訊
    const config = configManager.getConfig();
    if (config.fallback.enableLogging) {
      console.log(`🚀 BrowserMCP v${packageJSON.version} 啟動中...`);
      console.log(`   模式: ${config.fallback.mode}`);
      console.log(`   WebSocket: ${config.websocket.url}`);
      if (config.fallback.mode !== 'extension') {
        console.log(`   Puppeteer: ${config.puppeteer.headless ? '無頭' : '有頭'} 模式`);
      }
    }
  });

// 添加子命令
program
  .command('config')
  .description('配置管理')
  .option('--show', '顯示當前配置')
  .option('--generate', '產生配置範例')
  .option('--validate', '驗證配置')
  .action((options) => {
    if (options.show) {
      configManager.printConfigSummary();
    } else if (options.generate) {
      const exampleConfig = configManager.generateExampleConfig();
      console.log(exampleConfig);
    } else if (options.validate) {
      const validation = configManager.validateConfig();
      if (validation.valid) {
        console.log('✅ 配置驗證通過');
      } else {
        console.error('❌ 配置錯誤:');
        validation.errors.forEach(error => console.error(`  • ${error}`));
        process.exit(1);
      }
    } else {
      console.log('請使用 --show, --generate, 或 --validate');
    }
  });

program.parse(process.argv);

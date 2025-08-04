/**
 * 配置管理器
 * 支援多層級配置：命令行參數 > 環境變數 > 配置檔案 > 預設值
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 備援模式類型
 */
export type FallbackMode = 'extension' | 'puppeteer' | 'auto';

/**
 * 配置介面
 */
export interface BrowserMCPConfig {
  // 核心設定
  fallback: {
    mode: FallbackMode;
    extensionTimeout: number;
    retryAttempts: number;
    enableLogging: boolean;
  };
  
  // WebSocket 設定
  websocket: {
    url: string;
    port: number;
    reconnectAttempts: number;
    reconnectDelay: number;
  };
  
  // Puppeteer 設定
  puppeteer: {
    headless: boolean;
    viewport: {
      width: number;
      height: number;
    };
    args: string[];
    timeout: number;
  };
  
  // DevTools 設定
  devtools: {
    enableNetworkMonitoring: boolean;
    enablePerformanceMonitoring: boolean;
    maxConsoleLogEntries: number;
    maxNetworkRequestEntries: number;
  };
}

/**
 * 預設配置
 */
export const DEFAULT_CONFIG: BrowserMCPConfig = {
  fallback: {
    mode: 'auto',
    extensionTimeout: 5000,
    retryAttempts: 2,
    enableLogging: true
  },
  websocket: {
    url: 'ws://localhost:9002',
    port: 9002,
    reconnectAttempts: 3,
    reconnectDelay: 2000
  },
  puppeteer: {
    headless: false,
    viewport: {
      width: 1280,
      height: 720
    },
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
      '--safebrowsing-disable-auto-update'
    ],
    timeout: 30000
  },
  devtools: {
    enableNetworkMonitoring: true,
    enablePerformanceMonitoring: true,
    maxConsoleLogEntries: 1000,
    maxNetworkRequestEntries: 1000
  }
};

/**
 * 配置管理器類
 */
export class ConfigManager {
  private config: BrowserMCPConfig;
  private configPath?: string;

  constructor(configPath?: string) {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  /**
   * 載入配置（優先級：CLI > 環境變數 > 配置檔案 > 預設值）
   */
  private loadConfig(): BrowserMCPConfig {
    // 1. 從預設配置開始
    let config = { ...DEFAULT_CONFIG };

    // 2. 載入配置檔案
    config = this.mergeFileConfig(config);

    // 3. 載入環境變數
    config = this.mergeEnvironmentConfig(config);

    // 4. 載入命令行參數
    config = this.mergeCommandLineConfig(config);

    return config;
  }

  /**
   * 合併配置檔案
   */
  private mergeFileConfig(config: BrowserMCPConfig): BrowserMCPConfig {
    const configPaths = [
      this.configPath,
      path.join(process.cwd(), 'browsermcp.config.json'),
      path.join(process.cwd(), '.browsermcp.json'),
      path.join(__dirname, '../../browsermcp.config.json')
    ].filter(Boolean);

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath!)) {
        try {
          const fileContent = fs.readFileSync(configPath!, 'utf-8');
          const fileConfig = JSON.parse(fileContent);
          config = this.deepMerge(config, fileConfig);
          console.log(`📄 已載入配置檔案: ${configPath}`);
          break;
        } catch (error: any) {
          console.warn(`⚠️  配置檔案載入失敗: ${configPath} - ${error.message}`);
        }
      }
    }

    return config;
  }

  /**
   * 合併環境變數
   */
  private mergeEnvironmentConfig(config: BrowserMCPConfig): BrowserMCPConfig {
    const envConfig: Partial<BrowserMCPConfig> = {};

    // 備援設定
    if (process.env.BROWSERMCP_FALLBACK_MODE) {
      const mode = process.env.BROWSERMCP_FALLBACK_MODE as FallbackMode;
      if (['extension', 'puppeteer', 'auto'].includes(mode)) {
        envConfig.fallback = { ...config.fallback, mode };
      }
    }

    if (process.env.BROWSERMCP_EXTENSION_TIMEOUT) {
      const timeout = parseInt(process.env.BROWSERMCP_EXTENSION_TIMEOUT);
      if (!isNaN(timeout)) {
        envConfig.fallback = { ...config.fallback, extensionTimeout: timeout };
      }
    }

    if (process.env.BROWSERMCP_ENABLE_LOGGING !== undefined) {
      const enableLogging = process.env.BROWSERMCP_ENABLE_LOGGING === 'true';
      envConfig.fallback = { ...config.fallback, enableLogging };
    }

    // WebSocket 設定
    if (process.env.WS_URL || process.env.BROWSERMCP_WS_URL) {
      const wsUrl = process.env.WS_URL || process.env.BROWSERMCP_WS_URL!;
      envConfig.websocket = { ...config.websocket, url: wsUrl };
    }

    if (process.env.WS_PORT || process.env.BROWSERMCP_WS_PORT) {
      const port = parseInt(process.env.WS_PORT || process.env.BROWSERMCP_WS_PORT!);
      if (!isNaN(port)) {
        envConfig.websocket = { ...config.websocket, port };
      }
    }

    // Puppeteer 設定
    if (process.env.BROWSERMCP_PUPPETEER_HEADLESS !== undefined) {
      const headless = process.env.BROWSERMCP_PUPPETEER_HEADLESS === 'true';
      envConfig.puppeteer = { ...config.puppeteer, headless };
    }

    if (process.env.NODE_ENV === 'production') {
      envConfig.fallback = { ...config.fallback, enableLogging: false };
      envConfig.puppeteer = { ...config.puppeteer, headless: true };
    }

    return this.deepMerge(config, envConfig);
  }

  /**
   * 合併命令行參數
   */
  private mergeCommandLineConfig(config: BrowserMCPConfig): BrowserMCPConfig {
    const cliConfig: Partial<BrowserMCPConfig> = {};

    // 解析命令行參數
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--mode':
        case '--fallback-mode':
          const mode = args[i + 1] as FallbackMode;
          if (['extension', 'puppeteer', 'auto'].includes(mode)) {
            cliConfig.fallback = { ...config.fallback, mode };
            i++; // 跳過下一個參數
          }
          break;
          
        case '--extension-only':
          cliConfig.fallback = { ...config.fallback, mode: 'extension' };
          break;
          
        case '--puppeteer-only':
          cliConfig.fallback = { ...config.fallback, mode: 'puppeteer' };
          break;
          
        case '--auto-fallback':
          cliConfig.fallback = { ...config.fallback, mode: 'auto' };
          break;
          
        case '--headless':
          cliConfig.puppeteer = { ...config.puppeteer, headless: true };
          break;
          
        case '--no-headless':
          cliConfig.puppeteer = { ...config.puppeteer, headless: false };
          break;
          
        case '--verbose':
          cliConfig.fallback = { ...config.fallback, enableLogging: true };
          break;
          
        case '--quiet':
          cliConfig.fallback = { ...config.fallback, enableLogging: false };
          break;
          
        case '--ws-url':
          const wsUrl = args[i + 1];
          if (wsUrl && wsUrl.startsWith('ws://')) {
            cliConfig.websocket = { ...config.websocket, url: wsUrl };
            i++; // 跳過下一個參數
          }
          break;
      }
    }

    return this.deepMerge(config, cliConfig);
  }

  /**
   * 深度合併對象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 取得配置
   */
  getConfig(): BrowserMCPConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<BrowserMCPConfig>): void {
    this.config = this.deepMerge(this.config, updates);
  }

  /**
   * 取得備援模式
   */
  getFallbackMode(): FallbackMode {
    return this.config.fallback.mode;
  }

  /**
   * 設定備援模式
   */
  setFallbackMode(mode: FallbackMode): void {
    this.config.fallback.mode = mode;
  }

  /**
   * 取得 WebSocket URL
   */
  getWebSocketUrl(): string {
    return this.config.websocket.url;
  }

  /**
   * 取得 Puppeteer 配置
   */
  getPuppeteerConfig() {
    return { ...this.config.puppeteer };
  }

  /**
   * 驗證配置
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 驗證備援模式
    if (!['extension', 'puppeteer', 'auto'].includes(this.config.fallback.mode)) {
      errors.push(`無效的備援模式: ${this.config.fallback.mode}`);
    }

    // 驗證超時設定
    if (this.config.fallback.extensionTimeout < 1000 || this.config.fallback.extensionTimeout > 60000) {
      errors.push(`Extension 超時時間必須在 1000-60000ms 之間: ${this.config.fallback.extensionTimeout}`);
    }

    // 驗證 WebSocket URL
    if (!this.config.websocket.url.startsWith('ws://')) {
      errors.push(`無效的 WebSocket URL: ${this.config.websocket.url}`);
    }

    // 驗證埠號
    if (this.config.websocket.port < 1 || this.config.websocket.port > 65535) {
      errors.push(`無效的埠號: ${this.config.websocket.port}`);
    }

    // 驗證 Puppeteer 視窗大小
    if (this.config.puppeteer.viewport.width < 100 || this.config.puppeteer.viewport.height < 100) {
      errors.push(`Puppeteer 視窗大小太小`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 產生配置範例檔案
   */
  generateExampleConfig(): string {
    const exampleConfig = {
      ...DEFAULT_CONFIG,
      $schema: './browsermcp.schema.json',
      // 添加說明註解
      '//': {
        fallback: {
          mode: 'extension = 僅使用 Chrome Extension, puppeteer = 僅使用 Puppeteer, auto = 智能切換 (預設)',
          extensionTimeout: 'Extension 連接超時時間 (毫秒)',
          retryAttempts: '失敗時的重試次數',
          enableLogging: '是否啟用詳細記錄'
        },
        websocket: {
          url: 'WebSocket 伺服器 URL',
          port: 'WebSocket 伺服器埠號'
        },
        puppeteer: {
          headless: '是否以無頭模式執行 Puppeteer',
          viewport: 'Puppeteer 視窗大小設定'
        }
      }
    };

    return JSON.stringify(exampleConfig, null, 2);
  }

  /**
   * 輸出當前配置摘要
   */
  printConfigSummary(): void {
    console.log('\n🔧 BrowserMCP 配置摘要:');
    console.log(`  備援模式: ${this.config.fallback.mode}`);
    console.log(`  WebSocket: ${this.config.websocket.url}`);
    console.log(`  Extension 超時: ${this.config.fallback.extensionTimeout}ms`);
    console.log(`  Puppeteer 模式: ${this.config.puppeteer.headless ? '無頭' : '有頭'}`);
    console.log(`  詳細記錄: ${this.config.fallback.enableLogging ? '開啟' : '關閉'}`);
    
    const validation = this.validateConfig();
    if (!validation.valid) {
      console.log('\n❌ 配置錯誤:');
      validation.errors.forEach(error => console.log(`  • ${error}`));
    } else {
      console.log('✅ 配置驗證通過\n');
    }
  }
}

// 全域配置實例
export const configManager = new ConfigManager();
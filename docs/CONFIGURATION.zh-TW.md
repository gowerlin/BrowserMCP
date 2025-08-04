# BrowserMCP 配置指南

本指南說明如何配置 BrowserMCP 的備援系統，以控制是否僅使用 Chrome Extension、僅使用 Puppeteer，或智能自動切換。

## 配置優先級

配置按以下優先級順序載入（由高到低）：

1. **命令行參數** - 覆蓋所有其他設定
2. **環境變數** - 覆蓋配置檔案和預設值
3. **配置檔案** - 覆蓋預設值
4. **預設值** - 內建預設值

## 配置方法

### 1. 命令行參數

#### 備援模式控制
```bash
# 僅使用 Chrome Extension（Extension 不可用時失敗）
mcp-server-browsermcp --extension-only

# 僅使用 Puppeteer
mcp-server-browsermcp --puppeteer-only

# 智能自動切換（預設）
mcp-server-browsermcp --auto-fallback

# 直接指定模式
mcp-server-browsermcp --mode extension
mcp-server-browsermcp --mode puppeteer
mcp-server-browsermcp --mode auto
```

#### Puppeteer 選項
```bash
# 以無頭模式執行 Puppeteer
mcp-server-browsermcp --headless

# 以有頭模式執行 Puppeteer（預設）
mcp-server-browsermcp --no-headless
```

#### 其他選項
```bash
# 啟用詳細記錄
mcp-server-browsermcp --verbose

# 關閉記錄
mcp-server-browsermcp --quiet

# 自訂 WebSocket URL
mcp-server-browsermcp --ws-url ws://localhost:9003

# 使用自訂配置檔案
mcp-server-browsermcp --config /path/to/config.json
```

#### 配置管理
```bash
# 顯示當前配置
mcp-server-browsermcp --show-config

# 產生範例配置檔案
mcp-server-browsermcp --generate-config

# 使用 config 子命令
mcp-server-browsermcp config --show
mcp-server-browsermcp config --generate
mcp-server-browsermcp config --validate
```

### 2. 環境變數

```bash
# 備援模式
export BROWSERMCP_FALLBACK_MODE=extension    # 或 puppeteer, auto
export BROWSERMCP_EXTENSION_TIMEOUT=10000    # 毫秒
export BROWSERMCP_ENABLE_LOGGING=true        # 或 false

# WebSocket 配置
export WS_URL=ws://localhost:9002            # 舊版變數
export BROWSERMCP_WS_URL=ws://localhost:9002 # 新版變數
export BROWSERMCP_WS_PORT=9002

# Puppeteer 配置
export BROWSERMCP_PUPPETEER_HEADLESS=true    # 或 false

# 生產模式（啟用無頭模式，關閉記錄）
export NODE_ENV=production
```

### 3. 配置檔案

BrowserMCP 按以下順序查找配置檔案：

1. `--config` 參數指定的路徑
2. 當前目錄中的 `browsermcp.config.json`
3. 當前目錄中的 `.browsermcp.json`
4. BrowserMCP 目錄中的 `browsermcp.config.json`

#### 基本配置範例

建立 `browsermcp.config.json`：

```json
{
  "$schema": "./browsermcp.schema.json",
  "fallback": {
    "mode": "auto",
    "extensionTimeout": 5000,
    "retryAttempts": 2,
    "enableLogging": true
  },
  "websocket": {
    "url": "ws://localhost:9002",
    "port": 9002
  },
  "puppeteer": {
    "headless": false,
    "viewport": {
      "width": 1280,
      "height": 720
    }
  }
}
```

## 配置情境

### 情境 1：僅使用 Chrome Extension

適用於當您確定 Chrome Extension 總是可用時，以獲得最大速度：

**命令行：**
```bash
mcp-server-browsermcp --extension-only --verbose
```

**環境變數：**
```bash
export BROWSERMCP_FALLBACK_MODE=extension
```

**配置檔案：**
```json
{
  "fallback": {
    "mode": "extension",
    "extensionTimeout": 10000,
    "retryAttempts": 3
  }
}
```

### 情境 2：僅使用 Puppeteer

適用於無頭自動化或 Chrome Extension 不可用時：

**命令行：**
```bash
mcp-server-browsermcp --puppeteer-only --headless
```

**環境變數：**
```bash
export BROWSERMCP_FALLBACK_MODE=puppeteer
export BROWSERMCP_PUPPETEER_HEADLESS=true
```

**配置檔案：**
```json
{
  "fallback": {
    "mode": "puppeteer"
  },
  "puppeteer": {
    "headless": true,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### 情境 3：智能自動切換（推薦）

自動使用 Chrome Extension（如果可用），否則切換到 Puppeteer：

**命令行：**
```bash
mcp-server-browsermcp --auto-fallback
# 或簡單地
mcp-server-browsermcp
```

**配置檔案：**
```json
{
  "fallback": {
    "mode": "auto",
    "extensionTimeout": 3000,
    "retryAttempts": 2
  },
  "puppeteer": {
    "headless": false
  }
}
```

## 配置架構

配置遵循 JSON 架構以進行驗證。主要配置部分：

### 備援設定
- `mode`: `"extension"` | `"puppeteer"` | `"auto"`
- `extensionTimeout`: 連接超時時間（毫秒，1000-60000）
- `retryAttempts`: 重試次數（0-10）
- `enableLogging`: 啟用詳細記錄

### WebSocket 設定
- `url`: WebSocket 伺服器 URL（必須以 `ws://` 開頭）
- `port`: 埠號（1-65535）
- `reconnectAttempts`: 重連次數（0-10）
- `reconnectDelay`: 重連間隔時間（毫秒）

### Puppeteer 設定
- `headless`: 以無頭模式執行
- `viewport`: 瀏覽器視窗大小（`width`, `height`）
- `args`: Chrome 啟動參數陣列
- `timeout`: 操作超時時間（毫秒）

### DevTools 設定
- `enableNetworkMonitoring`: 啟用網路請求監控
- `enablePerformanceMonitoring`: 啟用效能指標
- `maxConsoleLogEntries`: 保留的最大控制台記錄條目數
- `maxNetworkRequestEntries`: 保留的最大網路請求條目數

## 依模式可用的工具

### Extension 模式 (`mode: "extension"`)
使用需要 Chrome Extension 的原始 DevTools 工具：
- `browser_get_network_requests`
- `browser_get_performance_metrics`
- `browser_inspect_element`
- 等等

### Puppeteer/Auto 模式 (`mode: "puppeteer"` 或 `mode: "auto"`)
使用具有智能切換的備援工具：
- `browser_get_network_requests_fallback`
- `browser_get_performance_metrics_fallback`
- `browser_inspect_element_fallback`
- `browser_health_check` - 監控系統健康狀態
- `browser_set_mode` - 執行期模式切換
- 等等

## 執行期模式切換

使用 auto 或 puppeteer 模式時，可以在執行期切換模式：

```javascript
// 切換到僅 extension 模式
await mcp.callTool("browser_set_mode", { mode: "extension" });

// 切換到僅 puppeteer 模式
await mcp.callTool("browser_set_mode", { mode: "puppeteer" });

// 切換回 auto 模式
await mcp.callTool("browser_set_mode", { mode: "auto" });

// 檢查系統健康狀態
const health = await mcp.callTool("browser_health_check", {});
```

## 故障排除

### 檢查當前配置
```bash
mcp-server-browsermcp --show-config
```

### 驗證配置
```bash
mcp-server-browsermcp config --validate
```

### 產生範例配置
```bash
mcp-server-browsermcp --generate-config > browsermcp.config.json
```

### 常見問題

1. **Extension 無法連接**：使用 `--puppeteer-only` 或檢查 Chrome Extension 安裝
2. **Puppeteer 啟動失敗**：檢查瀏覽器安裝和權限
3. **配置未載入**：驗證 JSON 語法和檔案位置
4. **效能問題**：嘗試 `--headless` 模式或減少超時值

## 最佳實務

1. **開發環境**：使用 `auto` 模式以獲得最大靈活性
2. **生產環境**：使用 `puppeteer` 模式配合 `headless: true` 以獲得可靠性
3. **CI/CD**：使用環境變數進行配置
4. **本地測試**：使用配置檔案以保持一致的設定
5. **除錯**：使用 `--verbose` 或 `enableLogging: true` 啟用詳細記錄
# Browser MCP v0.2.0 安裝指南

## 🚀 快速開始

Browser MCP v0.2.0 引入了完整的 DevTools 整合，並具備 Chrome Extension 與 Puppeteer 模式之間的智能備援系統。

### 系統需求

- Node.js 18+（建議）或 16+（最低需求）
- Chrome/Chromium 瀏覽器（建議使用最新版本）
- npm 或 yarn 套件管理器
- Windows、macOS 或 Linux 作業系統

## 📦 安裝步驟

### 1. 安裝 MCP 伺服器

#### 選項 A：從原始碼安裝（目前方法）

```bash
# 複製儲存庫
git clone https://github.com/gowerlin/BrowserMCP.git
cd BrowserMCP

# 安裝相依套件
npm install

# 建置專案
npm run build

# 驗證安裝
npm run typecheck
npm test

# 可選：建立全域符號連結以便存取
npm link
# 現在可以全域使用 'browsermcp' 指令
```

#### 選項 B：本地開發建置

```bash
# 如果您已經有原始碼
cd D:\ForgejoGit\BrowserMCP

# 清理並重新建置
rm -rf dist/
npm install
npm run build

# 驗證建置輸出
ls -la dist/
# 應該包含 index.js 和其他編譯檔案
```

### 2. 安裝 Chrome 擴充功能

#### 開發者模式安裝

1. **開啟 Chrome 擴充功能頁面**
   - 前往：`chrome://extensions/`
   - 或：選單 → 更多工具 → 擴充功能

2. **啟用開發者模式**
   - 切換右上角的「開發者模式」開關

3. **載入擴充功能**
   - 點擊「載入未封裝項目」
   - 導航並選擇 `browser-extension` 資料夾
   - 驗證擴充功能成功載入

4. **釘選擴充功能**
   - 點擊工具列中的拼圖圖示
   - 找到「Browser MCP DevTools Integration」
   - 點擊釘選圖示以保持可見

### 3. 設定連接模式

#### 🆕 v0.2.0 智能備援配置

在專案根目錄建立 `browsermcp.config.json`：

```json
{
  "fallback": {
    "mode": "auto",              // "extension" | "puppeteer" | "auto"
    "extensionTimeout": 5000,
    "retryAttempts": 2,
    "enableLogging": true
  },
  "websocket": {
    "url": "ws://localhost:9002",
    "port": 9002,
    "reconnectAttempts": 3,
    "reconnectDelay": 2000
  },
  "puppeteer": {
    "headless": false,
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "timeout": 30000
  },
  "devtools": {
    "enableNetworkMonitoring": true,
    "enablePerformanceMonitoring": true,
    "maxConsoleLogEntries": 1000,
    "maxNetworkRequestEntries": 1000
  }
}
```

### 4. AI 工具整合

⚠️ **重要**：請僅選擇一種整合方法以避免端口衝突！

#### 選項 A：VS Code AI 工具（建議）

```json
// C:\Users\YourName\AppData\Roaming\Code\User\settings.json
{
  "ai.tools.browserMCP.enabled": true,
  "ai.tools.browserMCP.description": "BrowserMCP 提供瀏覽器自動化功能，包括網頁導航、截圖、內容提取、JavaScript 執行等",
  "ai.tools.browserMCP.path": "D:\\ForgejoGit\\BrowserMCP\\dist\\index.js",
  "ai.tools.browserMCP.args": ["--auto-fallback", "--verbose"],
  "ai.prompt.globalHints": [
    "當需要瀏覽器自動化、網頁截圖、內容提取或 JavaScript 執行時，請使用 BrowserMCP 工具",
    "BrowserMCP 支援智能備援模式，優先使用 Chrome Extension，必要時自動切換到 Puppeteer"
  ]
}
```

#### 選項 B：舊版 MCP 格式（VS Code 搭配 Continue/Codeium）

```json
// .vscode/settings.json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["${workspaceFolder}/BrowserMCP/dist/index.js", "--auto-fallback"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  }
}
```

#### 選項 C：Claude Desktop（⚠️ 端口衝突風險）

**⚠️ 警告**：如果使用 VS Code AI 工具，請保持 Claude Desktop 配置為空以避免端口 9002 衝突！

```json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
// Linux: ~/.config/Claude/claude_desktop_config.json

// 選項 1：空配置（如果使用 VS Code 則建議）
{
  "globalShortcut": "",
  "mcpServers": {}
}

// 選項 2：僅 Claude Desktop（先停用 VS Code AI 工具）
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["D:\\ForgejoGit\\BrowserMCP\\dist\\index.js", "--auto-fallback"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  }
}
```

#### 選項 D：Cursor IDE

```json
// .cursor/mcp.json
{
  "servers": {
    "browsermcp": {
      "command": "node",
      "args": ["D:\\ForgejoGit\\BrowserMCP\\dist\\index.js", "--auto-fallback"],
      "description": "搭配 DevTools 的瀏覽器自動化",
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto"
      }
    }
  }
}
```

#### 選項 E：Claude Code CLI（WSL/Linux）

```json
// ~/.claude/settings.json 或 project/.claude-code/config.json
{
  "mcp": {
    "servers": {
      "browsermcp": {
        "command": "node",
        "args": ["/mnt/d/ForgejoGit/BrowserMCP/dist/index.js", "--auto-fallback"],
        "cwd": ".",
        "env": {
          "BROWSERMCP_FALLBACK_MODE": "auto",
          "BROWSERMCP_ENABLE_LOGGING": "true"
        }
      }
    }
  }
}
```

## 🎯 v0.2.0 功能設定

### 智能備援系統

智能備援系統會自動在 Chrome Extension 和 Puppeteer 之間切換：

```bash
# 僅 Extension 模式（最快，需要擴充功能）
mcp-server-browsermcp --extension-only

# 僅 Puppeteer 模式（不需要擴充功能）
mcp-server-browsermcp --puppeteer-only --headless

# 智能自動模式（預設，兩全其美）
mcp-server-browsermcp --auto-fallback

# 顯示當前配置
mcp-server-browsermcp --show-config
```

### 環境變數

```bash
# 設定備援模式
export BROWSERMCP_FALLBACK_MODE=auto  # extension | puppeteer | auto

# Puppeteer 選項
export BROWSERMCP_PUPPETEER_HEADLESS=false

# WebSocket 配置
export BROWSERMCP_WS_URL=ws://localhost:9002

# 啟用詳細記錄
export BROWSERMCP_ENABLE_LOGGING=true
```

## 🧪 測試安裝

### 1. 檢查配置衝突

```bash
# 檢查端口 9002 是否已被佔用
netstat -an | findstr 9002
# 應該只顯示一個監聽進程

# 檢查運行中的 Node.js 進程
tasklist | findstr node
# 應該顯示預期數量的進程
```

### 2. 基本連接測試

```bash
# 啟動伺服器並記錄
node dist/index.js --auto-fallback --verbose

# 或使用 npm 腳本
npm start

# 檢查配置
node dist/index.js --show-config
```

### 3. 在另一個終端機中，檢查健康狀態
mcp-server-browsermcp --show-config
```

### 2. 測試 DevTools 功能

#### 使用 Extension 模式
1. 開啟 Chrome 並導航到任何網站
2. 點擊 Browser MCP 擴充功能圖示
3. 點擊「連接當前標籤頁」
4. 狀態應顯示「已連接」

#### 使用 Puppeteer 模式
```bash
# 以僅 Puppeteer 模式啟動
mcp-server-browsermcp --puppeteer-only

# 瀏覽器將自動啟動
```

### 3. 執行測試套件

```bash
# 執行所有測試
npm test

# 執行特定測試套件
npm run test:unit          # 單元測試
npm run test:integration   # 整合測試
npm run test:verbose       # 詳細輸出
npm run test:bail          # 第一個失敗時停止
```

### 4. 測試備援工具

在您的 AI 工具中測試新的 v0.2.0 備援工具：

```javascript
// 具備援的網路監控
await browser_get_network_requests_fallback({ 
  filter: "xhr" 
});

// 具備援的效能指標
await browser_get_performance_metrics_fallback();

// 具備援的 DOM 檢查
await browser_inspect_element_fallback({ 
  selector: "body",
  includeStyles: true,
  includeEventListeners: true
});

// 具備援的 JavaScript 執行
await browser_evaluate_javascript_fallback({ 
  code: "window.location.href",
  awaitPromise: false
});

// 具備援的儲存檢查
await browser_get_storage_data_fallback({ 
  storageType: "localStorage"
});

// 具備援的控制台日誌
await browser_get_console_logs_fallback();

// 健康檢查兩個系統
await browser_health_check();

// 動態切換模式
await browser_set_mode({ mode: "puppeteer" });
```

## 🔍 故障排除

### 常見問題

#### 端口衝突問題（最常見）
```bash
# 檢查是否有多個 MCP 伺服器在運行
netstat -an | findstr 9002
# 應該只顯示一個監聽進程

# Windows：終止端口 9002 上的衝突進程
for /f "tokens=5" %a in ('netstat -aon ^| findstr :9002') do taskkill /F /PID %a

# Linux/macOS：終止端口 9002 上的進程
lsof -i :9002
kill -9 <PID>

# 解決方案：只選擇一種整合方法：
# - VS Code AI 工具 或 Claude Desktop（不要同時使用！）
```

#### Extension 連接問題
```bash
# 驗證擴充功能已安裝並連接
# 1. 前往 chrome://extensions/
# 2. 找到「Browser MCP DevTools Integration」
# 3. 確保已啟用
# 4. 點擊擴充功能圖示並連接到當前分頁
```

#### Puppeteer 啟動問題
```bash
# 安裝必要的依賴項（Linux）
sudo apt-get install -y \
  libnss3 libatk-bridge2.0-0 libdrm2 \
  libxkbcommon0 libgbm1 libasound2

# 檢查 Puppeteer 安裝
node -e "require('puppeteer').launch().then(b => { console.log('OK'); b.close(); })"
```

#### TypeScript 編譯問題
```bash
# 清理並重新建置
rm -rf dist/
npm run build

# 檢查型別錯誤
npm run typecheck
```

### 除錯模式

#### 啟用詳細記錄
```bash
# 透過環境變數
export BROWSERMCP_ENABLE_LOGGING=true
npm start

# 透過命令列
mcp-server-browsermcp --verbose
```

#### 檢視擴充功能日誌
1. 前往 `chrome://extensions/`
2. 找到 Browser MCP
3. 點擊「檢視視圖：背景頁面」
4. 檢查 Console 中的日誌

#### 檢視伺服器日誌
```bash
# 啟用除錯輸出
DEBUG=* npm start

# 過濾特定模組
DEBUG=browsermcp:* npm start
```

## 📊 效能優化

### 不同使用案例的建議設定

#### 開發與測試
```json
{
  "fallback": {
    "mode": "auto",
    "enableLogging": true
  },
  "puppeteer": {
    "headless": false
  }
}
```

#### 生產環境與 CI/CD
```json
{
  "fallback": {
    "mode": "puppeteer",
    "enableLogging": false
  },
  "puppeteer": {
    "headless": true,
    "args": ["--no-sandbox", "--disable-setuid-sandbox"]
  }
}
```

#### 高效能爬蟲
```json
{
  "fallback": {
    "mode": "extension",
    "extensionTimeout": 2000
  },
  "devtools": {
    "maxNetworkRequestEntries": 100,
    "maxConsoleLogEntries": 50
  }
}
```

## 🔗 其他資源

### 文件
- [配置指南](./docs/CONFIGURATION.zh-TW.md)
- [DevTools API 參考](./docs/DEVTOOLS.zh-TW.md)
- [API 範例](./docs/API-EXAMPLES.zh-TW.md)
- [故障排除指南](./docs/TROUBLESHOOTING.zh-TW.md)

### 外部連結
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [MCP 協定規範](https://modelcontextprotocol.io/specification)
- [Puppeteer 文件](https://pptr.dev/)

### 支援
- [GitHub Issues](https://github.com/gowerlin/BrowserMCP/issues)
- [Discord 社群](https://discord.gg/browsermcp)
- [Stack Overflow 標籤](https://stackoverflow.com/questions/tagged/browsermcp)

## 📝 版本歷史

### v0.2.0（當前版本）
- ✅ 完整的 DevTools Protocol 整合
- ✅ 智能備援系統（Extension ↔ Puppeteer）
- ✅ 13 個新的 DevTools 功能與備援
- ✅ 增強的配置管理
- ✅ 改進的錯誤處理和記錄

### v0.1.3
- 初始版本，具備基本瀏覽器自動化
- Chrome Extension 用於瀏覽器控制
- 基本 MCP 伺服器實作

---

## 🔧 配置衝突預防

### 快速衝突檢查

執行此指令檢查配置衝突：

```bash
# 檢查端口使用
netstat -an | findstr 9002

# 檢查 VS Code 配置
type "%APPDATA%\Code\User\settings.json" | findstr browserMCP

# 檢查 Claude Desktop 配置  
type "%APPDATA%\Claude\claude_desktop_config.json" | findstr browsermcp
```

### 解決指南

如果發現多個配置：

1. **選擇主要主機**：決定是否使用 VS Code 或 Claude Desktop
2. **清除次要配置**：清空未使用的配置
3. **驗證單一實例**：確保只有一個 BrowserMCP 伺服器運行
4. **測試連接**：驗證擴充功能可以正常連接

詳細衝突解決方案，請參閱：[CONFIG-CONFLICT-RESOLUTION.md](./CONFIG-CONFLICT-RESOLUTION.md)

---

*最後更新：2025-08-05，適用於 Browser MCP v0.2.0 含配置衝突預防功能*
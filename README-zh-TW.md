<a href="https://browsermcp.io">
  <img src="./.github/images/banner.png" alt="Browser MCP banner">
</a>

<h3 align="center">Browser MCP</h3>

<p align="center">
  使用 AI 自動化您的瀏覽器。
  <br />
  <a href="https://browsermcp.io"><strong>官方網站</strong></a> 
  •
  <a href="https://docs.browsermcp.io"><strong>文件</strong></a>
</p>

## 關於

Browser MCP 是一個 MCP 伺服器 + Chrome 擴充功能，讓您可以使用 VS Code、Claude、Cursor 和 Windsurf 等 AI 應用程式來自動化瀏覽器。

## 功能特色

### 核心功能
- ⚡ 快速：自動化在本地機器執行，無網路延遲，效能更佳。
- 🔒 隱私：由於自動化在本地執行，您的瀏覽器活動保留在您的設備上，不會發送到遠端伺服器。
- 👤 保持登入：使用您現有的瀏覽器設定檔，保持所有服務的登入狀態。
- 🥷🏼 隱蔽：使用您真實的瀏覽器指紋，避免基本的機器人偵測和 CAPTCHA。

### 🆕 完整 DevTools 整合（v0.2.0 新功能！）
此版本引入完整的 Chrome DevTools Protocol 整合，搭配**智能備援系統**：

**主要功能：**
- 🌐 **網路監控** - 追蹤和分析所有網路請求、回應和效能指標
- ⚡ **效能分析** - Core Web Vitals、效能分析和指標收集
- 🔍 **DOM 檢查** - 檢查元素、樣式、事件監聽器和無障礙屬性
- 💻 **JavaScript 執行** - 在頁面上下文中執行程式碼並進行覆蓋率分析
- 💾 **記憶體分析** - 記憶體使用統計和堆積快照功能
- 🔐 **安全分析** - 安全狀態檢查和憑證驗證
- 🗄️ **儲存檢查** - 存取 localStorage、sessionStorage、cookies 和 IndexedDB
- 📝 **控制台監控** - 捕獲和分析控制台日誌和錯誤

**🚀 智能備援系統（v0.2.0 新功能！）：**
- 🔄 **自動模式切換** - Chrome Extension 與 Puppeteer 模式之間無縫切換
- ⚡ **Extension 優先** - 優先使用快速的 Chrome Extension
- 🛡️ **Puppeteer 備援** - Extension 不可用時自動切換到 Puppeteer
- ⚙️ **可配置模式** - 手動控制：`extension`、`puppeteer` 或 `auto` 模式
- 📊 **健康監控** - Extension 和 Puppeteer 系統的即時狀態
- 🔧 **零配置** - 使用智能預設即可開箱即用
- 🎛️ **多層配置** - 命令列、環境變數和配置檔案
- 📋 **執行時模式切換** - 執行期間無需重啟即可變更模式

### 📚 文件

**核心文件：**
- 📖 [DevTools 文件](./docs/DEVTOOLS.md) | [DevTools Documentation](./docs/DEVTOOLS.zh-TW.md)
- ⚙️ [配置指南](./docs/CONFIGURATION.zh-TW.md) | [Configuration Guide](./docs/CONFIGURATION.md)
- 🔧 [整合指南](./docs/INTEGRATIONS.zh-TW.md) | [Integration Guide](./docs/INTEGRATIONS.md)
- 🔄 [相容性指南](./docs/COMPATIBILITY.zh-TW.md) | [Compatibility Guide](./docs/COMPATIBILITY.md)

**參考指南：**
- 💡 [API 範例](./docs/API-EXAMPLES.zh-TW.md) | [API Examples](./docs/API-EXAMPLES.md)
- 🔧 [故障排除指南](./docs/TROUBLESHOOTING.zh-TW.md) | [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

### 🔧 智能備援工具 (v0.2.0)
所有 DevTools 功能現在都包含自動備援功能：

**標準工具（Extension + Puppeteer）：**
- `browser_get_network_requests_fallback` - 網路監控備援
- `browser_get_performance_metrics_fallback` - 效能分析備援
- `browser_inspect_element_fallback` - DOM 檢查備援
- `browser_evaluate_javascript_fallback` - JavaScript 執行備援
- `browser_get_memory_usage_fallback` - 記憶體分析備援
- `browser_get_storage_data_fallback` - 儲存檢查備援
- `browser_get_console_logs_fallback` - 控制台監控備援
- `browser_navigate_fallback` - 導航備援
- `browser_get_page_info_fallback` - 頁面資訊備援

**實用工具：**
- `browser_health_check` - 系統健康監控
- `browser_set_mode` - 模式控制（`extension` | `puppeteer` | `auto`）

## 跨平台相容性修復

此分支包含修復原始 BrowserMCP（`@browsermcp/mcp@0.1.3`）中 Windows Git Bash 相容性問題的關鍵修正。

### 解決的問題
- **原始問題**：伺服器在 Git Bash 中無法初始化，錯誤訊息為「Server exited before responding to initialize request」
- **根本原因**：硬編碼的 Windows CMD 指令與 Git Bash 環境不相容
- **解決方案**：智慧環境偵測與自適應指令執行

### 主要改進
- ✅ 支援 Git Bash (MINGW64)
- ✅ 支援 WSL
- ✅ 保持與 CMD 和 PowerShell 的相容性
- ✅ 跨平台支援（Windows、macOS、Linux）

技術細節請參閱：
- 📖 [English Documentation](./docs/COMPATIBILITY.md)
- 🇹🇼 [繁體中文文檔](./docs/COMPATIBILITY.zh-TW.md)

## 🎛️ 配置選項

### 命令列使用
```bash
# 僅使用 Chrome Extension
mcp-server-browsermcp --extension-only

# 僅使用 Puppeteer（無頭模式）
mcp-server-browsermcp --puppeteer-only --headless

# 智能自動切換（預設）
mcp-server-browsermcp --auto-fallback

# 顯示當前配置
mcp-server-browsermcp --show-config

# 產生配置檔案範本
mcp-server-browsermcp --generate-config > browsermcp.config.json
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

### 配置檔案
在專案根目錄建立 `browsermcp.config.json`：
```json
{
  "fallback": {
    "mode": "auto",
    "extensionTimeout": 5000,
    "enableLogging": true
  },
  "puppeteer": {
    "headless": false,
    "viewport": { "width": 1280, "height": 720 }
  }
}
```

## 安裝與配置

### 安裝指南
- 📖 [English Installation Guide](./INSTALLATION.md)
- 🇹🇼 [繁體中文安裝指南](./INSTALLATION.zh-TW.md)

### 整合指南
- 🔧 [開發環境整合](./docs/INTEGRATIONS.zh-TW.md) - VS Code、Claude Code CLI、Git Bash、WSL
- 📖 [Development Environment Integration](./docs/INTEGRATIONS.md) - English Version

### 配置範例
請參閱 `examples/` 目錄中的完整工作範例：

**配置檔案：**
- [`browsermcp.config.json`](./examples/browsermcp.config.json) - 完整配置範例
- [`auto-fallback.config.json`](./examples/auto-fallback.config.json) - 自動備援模式配置
- [`extension-only.config.json`](./examples/extension-only.config.json) - 僅 Chrome Extension 模式
- [`puppeteer-only.config.json`](./examples/puppeteer-only.config.json) - 僅 Puppeteer 模式

**開發環境：**
- [`vscode-settings.json`](./examples/vscode-settings.json) - VS Code MCP 伺服器設定
- [`vscode-tasks.json`](./examples/vscode-tasks.json) - VS Code 任務定義
- [`vscode-launch.json`](./examples/vscode-launch.json) - VS Code 除錯配置
- [`claude-code-config.json`](./examples/claude-code-config.json) - Claude Code CLI 配置
- [`git-bash-setup.sh`](./examples/git-bash-setup.sh) - 自動化 Git Bash 環境設定

## 安裝方式

### 從原始碼安裝

```bash
# 複製此分支
git clone https://github.com/gowerlin/BrowserMCP.git
cd BrowserMCP

# 安裝相依套件
npm install

# 建置專案
npm run build

# 執行伺服器
npm start
```

### 環境需求

- Node.js 18 或更高版本
- Chrome 瀏覽器
- npm 或 yarn

### Chrome 擴充功能安裝

1. 開啟 Chrome 並前往 `chrome://extensions/`
2. 啟用「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇 `browser-extension/` 目錄

## 使用方式

### 基本用法

1. 啟動 MCP 伺服器：
```bash
npm start
```

2. 在您的 AI 應用程式（如 VS Code）中設定 MCP：
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["/path/to/BrowserMCP/dist/index.js"]
    }
  }
}
```

3. 確保 Chrome 擴充功能已安裝並啟用

### 可用工具

- `browser_navigate` - 導航到指定 URL
- `browser_screenshot` - 截取當前頁面的螢幕截圖
- `browser_console` - 讀取控制台日誌
- `browser_click` - 點擊頁面元素
- `browser_type` - 在輸入欄位中輸入文字
- 以及更多 DevTools 整合功能...

## 品質保證 (v0.2.0 增強)

### 增強測試套件
- 🧪 **全面測試**：單元測試、整合測試、備援系統測試和邊緣案例覆蓋
- 🔄 **自動化測試**：執行 `npm test` 進行完整測試套件
- 📊 **測試腳本**：
  - `npm run test:unit` - 僅單元測試
  - `npm run test:integration` - 僅整合測試  
  - `npm run test:verbose` - 詳細測試輸出
  - `npm run test:bail` - 在第一個失敗時停止
- 🎯 **備援測試**：智能備援系統驗證和 Puppeteer 環境檢查

### 程式碼品質功能
- 🛡️ **型別安全**：全面的 TypeScript 介面和錯誤處理
- 🔍 **錯誤管理**：標準化錯誤處理與詳細除錯
- 📝 **文件**：廣泛的 API 範例和故障排除指南
- 🔧 **開發者工具**：增強的除錯和效能監控

## 貢獻

此儲存庫包含 Browser MCP 的所有核心 MCP 程式碼，但由於依賴於開發它的 monorepo 中的 utils 和 types，目前還不能單獨建置。

### 對於此分支
歡迎專注於跨平台相容性和程式碼品質的貢獻。請：
1. 在不同的 shell 環境中測試您的更改
2. 執行測試套件：`npm test`
3. 為新功能更新文件
4. 遵循既定的 TypeScript 模式

### 測試

```bash
# 執行測試
npm test

# 執行特定測試
npm test -- --grep "DevTools"
```

## 致謝

Browser MCP 改編自 [Playwright MCP server](https://github.com/microsoft/playwright-mcp)，用於自動化使用者的瀏覽器而不是建立新的瀏覽器實例。這允許使用使用者現有的瀏覽器設定檔，使用已登入的會話並避免通常阻止自動化瀏覽器使用的機器人偵測機制。

## 授權

MIT License - 詳見 [LICENSE](./LICENSE) 檔案

## 支援

- 🐛 [回報問題](https://github.com/gowerlin/BrowserMCP/issues)
- 💬 [討論區](https://github.com/gowerlin/BrowserMCP/discussions)
- 📧 聯絡：gowerlin@gmail.com
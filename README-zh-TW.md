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

### 🆕 DevTools 整合 (v0.2.0)
完整的 Chrome DevTools Protocol 整合，提供進階偵錯和分析功能：

- 🌐 **網路監控** - 追蹤和分析所有網路請求、回應和效能指標
- ⚡ **效能分析** - Core Web Vitals、效能分析和指標收集
- 🔍 **DOM 檢查** - 檢查元素、樣式、事件監聽器和無障礙屬性
- 💻 **JavaScript 執行** - 在頁面上下文中執行程式碼並進行覆蓋率分析
- 💾 **記憶體分析** - 記憶體使用統計和堆積快照功能
- 🔐 **安全分析** - 安全狀態檢查和憑證驗證
- 🗄️ **儲存檢查** - 存取 localStorage、sessionStorage、cookies 和 IndexedDB
- 📝 **控制台監控** - 捕獲和分析控制台日誌和錯誤

詳細的 DevTools 文件：
- 📖 [English Documentation](./docs/DEVTOOLS.md)
- 🇹🇼 [繁體中文文檔](./docs/DEVTOOLS.zh-TW.md)

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

## 設定範例

### 快速開始
```json
// 專案中的 .mcp/config.json
{
  "servers": {
    "browsermcp": {
      "command": "node",
      "args": ["./path/to/BrowserMCP/dist/index.js"],
      "description": "包含 Git Bash 修復的瀏覽器自動化"
    }
  }
}
```

### 安裝指南
- 📖 [English Installation Guide](./INSTALLATION.md)
- 🇹🇼 [繁體中文安裝指南](./INSTALLATION.zh-TW.md)

### 進階設定
請參閱 `examples/` 目錄：
- [`mcp-config.json`](./examples/mcp-config.json) - 基本 MCP 設定
- [`vscode-mcp-settings.json`](./examples/vscode-mcp-settings.json) - VS Code 全域設定
- [`project-mcp-config.json`](./examples/project-mcp-config.json) - 包含選項的專案特定設定

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

## 貢獻

此儲存庫包含 Browser MCP 的所有核心 MCP 程式碼，但由於依賴於開發它的 monorepo 中的 utils 和 types，目前還不能單獨建置。

### 對於此分支
特別歡迎專注於跨平台相容性的貢獻。在提交 PR 之前，請在不同的 shell 環境中測試您的更改。

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
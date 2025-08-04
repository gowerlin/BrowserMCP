# Browser MCP DevTools 安裝與測試指南

## 📦 安裝步驟

### 1. 安裝 MCP 服務

```bash
# 克隆專案
git clone https://github.com/gowerlin/BrowserMCP.git
cd BrowserMCP

# 安裝依賴
npm install

# 編譯專案
npm run build

# 測試服務
npm test
```

### 2. 安裝瀏覽器擴充功能

#### 開發者模式安裝

1. **開啟 Chrome 擴充功能頁面**
   - 在網址列輸入：`chrome://extensions/`
   - 或從選單：選單 → 更多工具 → 擴充功能

2. **啟用開發者模式**
   - 點擊右上角的「開發者模式」開關

3. **載入未封裝擴充功能**
   - 點擊「載入未封裝項目」
   - 選擇 `browser-extension` 資料夾
   - 確認擴充功能已成功載入

4. **釘選擴充功能**
   - 點擊瀏覽器工具列的擴充功能圖示
   - 找到「Browser MCP DevTools Integration」
   - 點擊釘選圖示固定到工具列

### 3. 設定 MCP 連接

#### VS Code / Cursor 設定

```json
// .mcp/config.json
{
  "servers": {
    "browsermcp": {
      "path": "node",
      "arguments": ["path/to/BrowserMCP/dist/index.js"]
    }
  }
}
```

#### Claude Desktop 設定

```json
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["C:/path/to/BrowserMCP/dist/index.js"]
    }
  }
}
```

## 🧪 測試步驟

### 1. 基本連接測試

1. **啟動 MCP 服務**
   ```bash
   npm run watch
   ```

2. **連接瀏覽器**
   - 開啟任意網頁
   - 點擊擴充功能圖示
   - 點擊「連接當前標籤頁」
   - 確認狀態顯示「已連接」

### 2. DevTools 功能測試

#### Network 監控測試
```javascript
// 在 AI 工具中執行
await browser_get_network_requests({ filter: "all" });
```

#### Performance 測試
```javascript
await browser_get_performance_metrics();
```

#### DOM 檢查測試
```javascript
await browser_inspect_element({ 
  selector: "body",
  includeStyles: true 
});
```

#### JavaScript 執行測試
```javascript
await browser_evaluate_javascript({ 
  code: "document.title" 
});
```

### 3. 自動化測試

執行完整測試套件：
```bash
# 執行 DevTools 測試
node test/devtools.test.js

# 執行所有測試
npm test
```

## 🔍 問題排查

### 常見問題

#### 1. 擴充功能無法連接
- **檢查 WebSocket 埠**：確保 9002 埠未被佔用
- **檢查防火牆**：允許 localhost:9002 連接
- **重新載入擴充功能**：在擴充功能頁面點擊重新載入

#### 2. DevTools 功能無法使用
- **檢查權限**：確保擴充功能有 debugger 權限
- **關閉其他偵錯工具**：一次只能有一個偵錯器連接
- **重新連接標籤頁**：斷開並重新連接

#### 3. MCP 服務無法啟動
- **檢查 Node.js 版本**：需要 Node.js 16+
- **重新編譯**：`npm run build`
- **檢查路徑**：確保路徑正確且使用正斜線

### 偵錯模式

#### 查看擴充功能日誌
1. 在擴充功能頁面找到 Browser MCP
2. 點擊「檢視視圖」→「背景頁面」
3. 開啟 Console 查看日誌

#### 查看 MCP 服務日誌
```bash
# 啟用詳細日誌
DEBUG=* npm run watch
```

## 📊 效能建議

### 最佳實踐

1. **限制網路請求收集**
   - 使用 filter 參數減少資料量
   - 定期清除網路日誌

2. **優化 DOM 查詢**
   - 使用具體的選擇器
   - 限制 maxDepth 參數

3. **記憶體管理**
   - 定期斷開不使用的連接
   - 避免長時間的 profiling

## 🔗 相關資源

- [Chrome DevTools Protocol 文件](https://chromedevtools.github.io/devtools-protocol/)
- [MCP 協定規範](https://modelcontextprotocol.io/specification)
- [專案 GitHub](https://github.com/gowerlin/BrowserMCP)
- [問題回報](https://github.com/gowerlin/BrowserMCP/issues)
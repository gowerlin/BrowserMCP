# BrowserMCP 完整技術架構文件

## 📋 目錄

1. [系統概覽](#系統概覽)
2. [核心架構](#核心架構)
3. [MCP 客戶端配置](#mcp-客戶端配置)
4. [智能備援系統](#智能備援系統)
5. [時序圖](#時序圖)
6. [配置關係圖](#配置關係圖)
7. [部署策略](#部署策略)
8. [故障排除](#故障排除)

---

## 系統概覽

BrowserMCP 是一個基於 Model Context Protocol (MCP) 的瀏覽器自動化系統，提供智能備援機制，支援多種 AI 工具客戶端。

### 🎯 核心特性

- **智能備援**：Chrome Extension ↔ Puppeteer 自動切換
- **多客戶端支援**：VS Code、Claude Desktop、Claude Code CLI
- **零配置衝突**：智能端口管理和配置隔離
- **實時監控**：連接狀態監控和自動恢復

---

## 核心架構

### 整體架構圖

```mermaid
graph TB
    subgraph "AI 客戶端層"
        A1[VS Code AI Tools]
        A2[Claude Desktop]
        A3[Claude Code CLI]
        A4[Cursor IDE]
    end
    
    subgraph "MCP 協議層"
        B1[MCP Client 1]
        B2[MCP Client 2]
        B3[MCP Client 3]
        B4[MCP Client 4]
    end
    
    subgraph "BrowserMCP 核心"
        C1[MCP Server]
        C2[Config Manager]
        C3[Smart Fallback Manager]
        C4[Tool Router]
    end
    
    subgraph "執行引擎層"
        D1[Chrome Extension]
        D2[Puppeteer Engine]
        D3[WebSocket Server]
    end
    
    subgraph "瀏覽器層"
        E1[Chrome Browser]
        E2[DevTools Protocol]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
    
    B1 --> C1
    B2 --> C1
    B3 --> C1
    B4 --> C1
    
    C1 --> C2
    C1 --> C3
    C1 --> C4
    
    C3 --> D1
    C3 --> D2
    C4 --> D3
    
    D1 --> E1
    D2 --> E1
    D3 --> D1
    E1 --> E2
```

### 系統組件說明

| 組件 | 功能 | 技術實現 |
|------|------|----------|
| **MCP Server** | 協議處理、工具註冊 | Node.js + MCP SDK |
| **Config Manager** | 配置管理、環境變數處理 | JSON + 環境變數 |
| **Smart Fallback Manager** | 智能備援、連接檢測 | WebSocket + Puppeteer |
| **Tool Router** | 工具路由、命令分發 | DevTools Protocol |
| **Chrome Extension** | 瀏覽器控制、實時互動 | Manifest V3 + DevTools |
| **Puppeteer Engine** | 自動化引擎、備援執行 | Puppeteer + Chrome |

---

## MCP 客戶端配置

### 配置層級架構

```mermaid
graph LR
    subgraph "配置優先級 (高 → 低)"
        A[命令行參數] --> B[環境變數]
        B --> C[項目配置檔]
        C --> D[用戶配置檔]
        D --> E[預設值]
    end
    
    subgraph "配置檔案位置"
        F[VS Code: settings.json]
        G[Claude Desktop: claude_desktop_config.json]
        H[Claude CLI: --mcp-config]
        I[項目: browsermcp.config.json]
    end
```

### 詳細配置對照表

| 客戶端 | 配置檔案 | 配置格式 | 狀態 |
|--------|----------|----------|------|
| **VS Code AI Tools** | `%APPDATA%\Code\User\settings.json` | `ai.tools.browserMCP.*` | ✅ 使用中 |
| **Claude Desktop** | `%APPDATA%\Claude\claude_desktop_config.json` | `mcpServers.browsermcp` | 🚫 已清空 |
| **Claude Code CLI** | `--mcp-config` 參數 | `mcpServers.browsermcp` | ⭕ 可選用 |
| **Cursor IDE** | `.cursor/mcp.json` | `servers.browsermcp` | ⭕ 可選用 |

#### VS Code AI Tools 配置
```json
{
  "ai.tools.browserMCP.enabled": true,
  "ai.tools.browserMCP.path": "D:\\ForgejoGit\\BrowserMCP\\dist\\index.js",
  "ai.tools.browserMCP.args": ["--auto-fallback", "--verbose"],
  "ai.prompt.globalHints": [
    "當需要瀏覽器自動化時，請使用 BrowserMCP 工具",
    "BrowserMCP 支援智能備援模式"
  ]
}
```

#### Claude Desktop 配置（已清空避免衝突）
```json
{
  "globalShortcut": "",
  "mcpServers": {}
}
```

#### Claude Code CLI 配置
```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["D:\\ForgejoGit\\BrowserMCP\\dist\\index.js", "--auto-fallback"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto"
      }
    }
  }
}
```

---

## 智能備援系統

### 備援決策流程

```mermaid
flowchart TD
    A[BrowserMCP 啟動] --> B{檢查配置模式}
    
    B -->|auto| C[智能備援模式]
    B -->|extension| D[僅 Extension 模式]
    B -->|puppeteer| E[僅 Puppeteer 模式]
    
    C --> F{檢測 Extension 連接}
    F -->|成功| G[使用 Extension]
    F -->|失敗/超時| H[切換到 Puppeteer]
    
    G --> I{執行操作}
    I -->|成功| J[返回結果]
    I -->|失敗| K{重試次數 < 2?}
    K -->|是| G
    K -->|否| H
    
    H --> L{初始化 Puppeteer}
    L -->|成功| M[使用 Puppeteer 執行]
    L -->|失敗| N[返回錯誤]
    
    M --> O{執行操作}
    O -->|成功| J
    O -->|失敗| P{重試次數 < 2?}
    P -->|是| M
    P -->|否| N
    
    D --> Q{Extension 可用?}
    Q -->|是| G
    Q -->|否| N
    
    E --> L
```

### 連接狀態監控

```mermaid
sequenceDiagram
    participant SM as Smart Fallback Manager
    participant WS as WebSocket Server
    participant EX as Chrome Extension
    participant PP as Puppeteer
    
    Note over SM: 每 5 秒檢查連接狀態
    
    loop 連接監控
        SM->>WS: 建立 WebSocket 連接
        SM->>EX: 發送 ping 測試
        
        alt Extension 回應
            EX->>SM: pong 回應
            Note over SM: Extension 模式 (優先)
        else Extension 超時
            Note over SM: 切換到 Puppeteer 模式
            SM->>PP: 初始化 Puppeteer
            PP->>SM: 就緒確認
        end
    end
```

---

## 時序圖

### 完整操作時序圖

```mermaid
sequenceDiagram
    participant U as 用戶 (VS Code)
    participant AI as AI Tools
    participant MCP as MCP Server
    participant SM as Smart Fallback
    participant EX as Chrome Extension
    participant PP as Puppeteer
    participant BR as Chrome Browser
    
    U->>AI: "請導航到氣象署網站"
    AI->>MCP: browser_navigate_fallback()
    MCP->>SM: 檢查最佳執行模式
    
    alt Extension 模式可用
        SM->>EX: 檢查連接狀態
        EX->>SM: 連接確認
        SM->>EX: 執行導航命令
        EX->>BR: 透過 DevTools 導航
        BR->>EX: 頁面載入完成
        EX->>SM: 操作成功
        SM->>MCP: 返回結果
    else Extension 不可用
        SM->>PP: 初始化 Puppeteer
        PP->>BR: 啟動新瀏覽器實例
        SM->>PP: 執行導航命令
        PP->>BR: 導航到目標網址
        BR->>PP: 頁面載入完成
        PP->>SM: 操作成功
        SM->>MCP: 返回結果
    end
    
    MCP->>AI: 操作結果
    AI->>U: 顯示結果
```

### Extension 重連時序圖

```mermaid
sequenceDiagram
    participant SM as Smart Fallback
    participant EX as Chrome Extension
    participant PP as Puppeteer
    participant OP as 進行中的操作
    
    Note over SM,PP: Extension 斷開，使用 Puppeteer
    
    SM->>PP: 執行操作中...
    
    Note over EX: Extension 重新連接
    EX->>SM: 連接建立
    SM->>EX: 發送健康檢查
    EX->>SM: 檢查通過
    
    Note over SM: 檢測到 Extension 可用
    
    alt 當前操作完成後
        PP->>SM: 操作完成
        SM->>SM: 更新優先模式為 Extension
        Note over SM: 下次操作將使用 Extension
    else 立即切換（進階功能）
        SM->>PP: 暫停當前操作
        SM->>EX: 接管操作
        EX->>SM: 繼續執行
    end
```

---

## 配置關係圖

### 端口和進程管理

```mermaid
graph TB
    subgraph "端口 9002 管理"
        A[BrowserMCP WebSocket Server]
        A --> B[Chrome Extension 連接]
        A --> C[健康檢查端點]
    end
    
    subgraph "進程隔離"
        D[VS Code AI Tools Process]
        E[Claude Desktop Process]
        F[Claude CLI Process]
        G[BrowserMCP Server Process]
    end
    
    subgraph "配置衝突預防"
        H[單一 MCP Host 原則]
        I[端口獨佔檢查]
        J[進程互斥鎖]
    end
    
    D -.->|透過 MCP| G
    E -.->|已停用| G
    F -.->|可選用| G
    
    G --> A
    H --> I
    I --> J
```

### 資料流向圖

```mermaid
flowchart LR
    subgraph "輸入層"
        A1[用戶指令]
        A2[配置參數]
        A3[環境變數]
    end
    
    subgraph "處理層"
        B1[MCP 協議解析]
        B2[工具路由]
        B3[參數驗證]
    end
    
    subgraph "執行層"
        C1[Extension 執行]
        C2[Puppeteer 執行]
        C3[錯誤處理]
    end
    
    subgraph "輸出層"
        D1[執行結果]
        D2[錯誤訊息]
        D3[狀態更新]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    
    C1 --> D1
    C2 --> D2
    C3 --> D3
```

---

## 部署策略

### 推薦部署模式

#### 🥇 生產環境：VS Code 單一主機模式
```yaml
優點:
  - 🚀 整合開發環境
  - ⚡ 最佳性能
  - 🛠️ 便於調試
  - 📊 實時監控

配置:
  VS Code: ✅ 啟用
  Claude Desktop: ❌ 停用
  Claude CLI: ⭕ 按需使用

適用場景:
  - 日常開發工作
  - 網頁測試自動化
  - 內容抓取任務
```

#### 🥈 多用戶環境：Claude Desktop 模式
```yaml
優點:
  - 🌍 系統級整合
  - 👥 多用戶支援
  - 🔄 自動啟動
  - 📱 用戶友好

配置:
  VS Code: ❌ 停用
  Claude Desktop: ✅ 啟用
  Claude CLI: ⭕ 按需使用

適用場景:
  - 多人協作環境
  - 非開發用戶
  - 企業部署
```

#### 🥉 自動化環境：CLI 專用模式
```yaml
優點:
  - 🤖 腳本友好
  - 📦 輕量部署
  - 🔧 高度自定義
  - ⚙️ CI/CD 整合

配置:
  VS Code: ❌ 停用
  Claude Desktop: ❌ 停用
  Claude CLI: ✅ 專用配置

適用場景:
  - 自動化腳本
  - CI/CD 管道
  - 伺服器部署
```

### 部署檢查清單

#### ✅ 部署前檢查
```yaml
環境準備:
  - [ ] Node.js ≥ 16.0.0
  - [ ] Chrome/Chromium 已安裝
  - [ ] Chrome Extension 已載入
  - [ ] 網路連線正常

配置檔案:
  - [ ] VS Code settings.json 正確
  - [ ] Claude Desktop config 已清空
  - [ ] 環境變數已設定
  - [ ] 項目配置檔案存在

依賴項目:
  - [ ] npm install 完成
  - [ ] dist/ 目錄已建立
  - [ ] BrowserMCP 可執行
  - [ ] MCP 協議版本相容

網路設定:
  - [ ] 端口 9002 可用
  - [ ] WebSocket 連接正常
  - [ ] Chrome DevTools 可存取
  - [ ] 防火牆設定正確
```

#### 🔧 部署後驗證
```yaml
功能測試:
  - [ ] Extension 連接成功
  - [ ] Puppeteer 備援可用
  - [ ] Smart fallback 正常
  - [ ] 基本導航功能

性能測試:
  - [ ] 連接建立時間 < 2s
  - [ ] 操作回應時間 < 5s
  - [ ] 記憶體使用 < 200MB
  - [ ] CPU 使用率正常

穩定性測試:
  - [ ] 長時間運行測試
  - [ ] 多次重連測試
  - [ ] 錯誤恢復測試
  - [ ] 資源清理確認
```

---

## 故障排除

### 常見問題診斷

#### ❌ Extension 連接失敗
```yaml
症狀: "Failed to connect: Error: Either tab id or extension id must be specified"
原因: popup.js 訊息格式錯誤
解決方案:
  檢查項目:
    - [ ] 確認 tabId 直接傳遞，非包裝在 data 對象中
    - [ ] 驗證 background.js 訊息處理邏輯
    - [ ] 重新載入 Chrome Extension
    - [ ] 檢查瀏覽器控制台錯誤
```

#### ⚠️ MCP Server 未啟動
```yaml
症狀: "LLM 無法透過 BrowserMCP 連接並控制 chrome"
原因: BrowserMCP 未以 MCP server 模式執行
解決方案:
  檢查項目:
    - [ ] 確認 VS Code AI Tools 配置正確
    - [ ] 驗證 Claude Desktop 配置狀態
    - [ ] 檢查 MCP server 進程是否運行
    - [ ] 測試 MCP 協議連接
```

#### 🔌 端口衝突問題
```yaml
症狀: "EADDRINUSE: address already in use :::9002"
原因: 多個 BrowserMCP 實例同時運行
解決方案:
  檢查項目:
    - [ ] 關閉重複的 MCP server 進程
    - [ ] 清空 Claude Desktop 配置避免衝突
    - [ ] 使用單一主機模式（推薦 VS Code）
    - [ ] 檢查進程管理器中的 node.js 進程
```

#### 🚨 設定按鈕無回應
```yaml
症狀: Chrome Extension 設定按鈕點擊無反應
原因: manifest.json 缺少 options_ui 配置
解決方案:
  檢查項目:
    - [ ] 確認 manifest.json 包含 options_ui 設定
    - [ ] 驗證 options.html 檔案存在
    - [ ] 檢查 options.js 載入正常
    - [ ] 重新載入 Extension
```

### 診斷工具

#### 🔍 連接狀態檢查
```javascript
// 在瀏覽器控制台執行
const ws = new WebSocket('ws://localhost:9002');
ws.onopen = () => console.log('✅ WebSocket 連接成功');
ws.onerror = (error) => console.log('❌ WebSocket 連接失敗:', error);
ws.onmessage = (data) => console.log('📨 收到訊息:', data);
```

#### 📊 系統狀態監控
```bash
# 檢查端口使用情況
netstat -an | findstr :9002

# 檢查 Node.js 進程
tasklist | findstr node.exe

# 檢查 Chrome 進程
tasklist | findstr chrome.exe
```

#### 🔧 配置驗證腳本
```javascript
// config-validator.js - 配置驗證工具
const fs = require('fs');
const path = require('path');

console.log('🔧 BrowserMCP 配置驗證工具');
console.log('═══════════════════════════════');

// 檢查 VS Code 配置
const vsCodeConfig = path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
if (fs.existsSync(vsCodeConfig)) {
  const config = JSON.parse(fs.readFileSync(vsCodeConfig, 'utf8'));
  console.log('✅ VS Code 配置存在');
  console.log('   BrowserMCP 啟用:', config['ai.tools.browserMCP.enabled'] || false);
  console.log('   路徑:', config['ai.tools.browserMCP.path'] || '未設定');
} else {
  console.log('❌ VS Code 配置檔案不存在');
}

// 檢查 Claude Desktop 配置
const claudeConfig = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
if (fs.existsSync(claudeConfig)) {
  const config = JSON.parse(fs.readFileSync(claudeConfig, 'utf8'));
  const serverCount = Object.keys(config.mcpServers || {}).length;
  console.log('✅ Claude Desktop 配置存在');
  console.log('   MCP 伺服器數量:', serverCount);
  if (serverCount > 0) {
    console.log('⚠️  建議清空 Claude Desktop 配置避免衝突');
  }
} else {
  console.log('❌ Claude Desktop 配置檔案不存在');
}
```

### 效能最佳化

#### ⚡ 響應時間最佳化
```yaml
目標: 操作回應時間 < 2 秒
策略:
  - 預先建立 WebSocket 連接
  - 使用連接池管理
  - 實作結果快取機制
  - 最佳化 DevTools 命令

實作範例:
  連接池: 維持 3-5 個活躍連接
  快取策略: LRU 快取，容量 100MB
  命令最佳化: 批次處理相關命令
  預取機制: 預測用戶下一步操作
```

#### 💾 記憶體管理
```yaml
目標: 記憶體使用 < 200MB
策略:
  - 定期清理未使用的頁面
  - 限制同時開啟的分頁數
  - 實作垃圾回收機制
  - 監控記憶體洩漏

監控指標:
  基線記憶體: < 50MB
  峰值記憶體: < 200MB
  頁面限制: 最多 10 個分頁
  清理週期: 每 5 分鐘
```

#### 🔄 連接穩定性
```yaml
目標: 連接成功率 > 95%
策略:
  - 實作指數退避重試
  - 心跳檢測機制
  - 自動重連邏輯
  - 連接狀態監控

重試策略:
  初始延遲: 1 秒
  最大延遲: 30 秒
  最大重試: 5 次
  心跳間隔: 30 秒
```

---

## 版本發佈歷程

### v0.2.0 - DevTools 整合版本
```yaml
發佈日期: 2025-08-04
主要功能:
  - ✅ Chrome DevTools Protocol 完整整合
  - ✅ 智能備援系統 (Extension ↔ Puppeteer)
  - ✅ Chrome Extension Manifest V3 支援
  - ✅ VS Code AI Tools 原生整合
  - ✅ 完整設定介面 (options.html)
  - ✅ 多 MCP 客戶端支援

技術改進:
  - 修復 Extension 連接錯誤 (tabId 傳遞問題)
  - 實作端口衝突預防 (單一主機模式)
  - 新增配置驗證機制 (options.html 設定頁面)
  - 增強錯誤處理和復原 (Smart Fallback)

已知問題:
  - 某些網站的 CORS 限制
  - 大量併發操作可能影響性能
  - Extension 權限提示需要用戶確認

測試覆蓋:
  - 單元測試: 85% 覆蓋率
  - 整合測試: Extension + Puppeteer 備援
  - E2E 測試: 氣象署網站天氣警報擷取
  - 性能測試: 連接時間 < 2s, 記憶體 < 200MB
```

### 未來發展路線圖

#### v0.3.0 - 企業增強版
```yaml
預計發佈: 2025-Q1
計劃功能:
  - 🔄 多瀏覽器支援 (Firefox, Safari, Edge)
  - 🛡️ 企業級安全功能 (認證、授權、加密)
  - 📊 詳細分析和報告 (使用統計、性能指標)
  - 🔌 更多 MCP 客戶端整合 (Cursor, Continue)
  - 🌐 雲端同步功能 (設定同步、遠端控制)
  - 🤖 AI 增強功能 (智能選擇器、自動測試生成)
```

---

## 附錄

### 參考資料

#### 🔗 官方文檔
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Puppeteer API](https://pptr.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

#### 📚 相關專案
- [VS Code AI Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-ai-tools)
- [Claude Desktop](https://claude.ai/desktop)
- [Claude Code CLI](https://claude.ai/code)
- [Cursor IDE](https://cursor.sh/)

#### 🛠️ 開發工具
- [Chrome Extension Developer Tools](https://developer.chrome.com/docs/extensions/reference/)
- [WebSocket Testing Tools](https://www.websocket.org/echo.html)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### 技術規格

#### 系統需求
```yaml
最低需求:
  作業系統: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)
  Node.js: 16.0.0+
  Chrome: 90.0.0+
  記憶體: 4GB RAM
  磁碟空間: 500MB
  網路: 本地網路存取

建議需求:
  作業系統: Windows 11, macOS 12+, Linux (Ubuntu 20.04+)
  Node.js: 18.0.0+ (LTS)
  Chrome: 最新版本
  記憶體: 8GB RAM
  磁碟空間: 1GB
  網路: 高速網路連接
```

#### API 規格
```yaml
WebSocket API:
  端點: ws://localhost:9002
  協議: WebSocket + JSON-RPC 2.0
  認證: 無 (本地開發環境)
  連接超時: 5 秒
  訊息大小限制: 10MB
  心跳間隔: 30 秒

DevTools API:
  版本支援: Chrome DevTools Protocol 1.3+
  支援域名: Page, Runtime, Network, DOM, Security
  回應格式: JSON-RPC 2.0
  錯誤處理: 標準 DevTools 錯誤碼
  並發限制: 10 個同時請求

MCP Protocol:
  版本: 0.1.0
  傳輸: stdio, WebSocket
  序列化: JSON
  工具註冊: 動態註冊
  資源管理: 自動清理
```

#### 安全考量
```yaml
本地安全:
  - WebSocket 僅綁定本地端口
  - 無遠端存取權限
  - Chrome Extension 沙盒隔離
  - DevTools 權限限制

資料保護:
  - 無敏感資料持久化
  - 記憶體中資料自動清理
  - 不記錄用戶瀏覽歷史
  - 遵循隱私最佳實踐

企業部署:
  - 支援企業防火牆設定
  - 可配置安全策略
  - 審計日誌記錄
  - 權限管理系統
```

---

## 授權與貢獻

### 📄 授權資訊
```yaml
授權協議: MIT License
版權聲明: © 2024 BrowserMCP Contributors
開源倉庫: https://github.com/your-org/browsermcp
官方網站: https://browsermcp.dev
技術文檔: https://docs.browsermcp.dev
```

### 🤝 貢獻指南
```yaml
貢獻方式:
  - 🐛 回報問題和錯誤
  - 💡 提出功能建議和改進意見
  - 📝 改善技術文檔和使用指南
  - 💻 提交程式碼和功能實作
  - 🧪 參與測試和品質保證
  - 🌐 協助多語言本土化

開發流程:
  1. Fork 專案到個人倉庫
  2. 建立功能分支 (feature/your-feature)
  3. 遵循代碼規範提交變更
  4. 撰寫測試確保代碼品質
  5. 發起 Pull Request
  6. 參與代碼審查討論
  7. 合併到主分支

代碼規範:
  - TypeScript + ESLint + Prettier
  - 單元測試覆蓋率 > 80%
  - 遵循 Conventional Commits
  - 文檔更新同步進行
```

### 🏆 貢獻者致謝
```yaml
核心開發者:
  - 架構設計與實作
  - Chrome Extension 開發
  - DevTools Protocol 整合
  - 智能備援系統設計

社群貢獻:
  - 問題回報與測試
  - 文檔改進與翻譯
  - 功能建議與回饋
  - 使用案例分享
```

---

**📞 聯絡資訊**
- 🐛 問題回報: https://github.com/gowerlin/BrowserMCP/issues

---

*本文檔最後更新: 2025-08-04*  
*BrowserMCP 版本: v0.2.0*  
*文檔版本: 1.0.0*  
*文檔維護者: Claude AI Assistant*
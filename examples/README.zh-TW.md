# 📁 BrowserMCP 配置範例

本資料夾包含各種 BrowserMCP 配置範例，協助您快速設定不同的開發環境。

## 📋 檔案說明

### 核心配置檔案

- **`browsermcp.config.json`** - BrowserMCP 主要配置範例
  - 包含完整的配置選項
  - 使用 JSON Schema 驗證
  - 複製到專案根目錄使用

- **`auto-fallback.config.json`** - 自動備援模式配置
  - Extension 優先，自動切換到 Puppeteer
  - 適合大多數使用情境

- **`extension-only.config.json`** - 僅使用 Chrome Extension
  - 需要先安裝 Chrome Extension
  - 提供最佳效能

- **`puppeteer-only.config.json`** - 僅使用 Puppeteer
  - 無需安裝 Extension
  - 適合自動化測試環境

### VS Code 整合

- **`vscode-settings.json`** - VS Code 設定範例
  - AI Tools 整合設定
  - MCP 伺服器配置
  - 複製需要的部分到 VS Code 設定中
  - 使用 `${workspaceFolder}` 變數自動偵測路徑

- **`vscode-launch.json`** - VS Code 除錯配置
  - 多種啟動模式的除錯設定
  - 支援自動模式、Extension 模式、Puppeteer 模式
  - 複製到 `.vscode/launch.json`

- **`vscode-tasks.json`** - VS Code 任務配置
  - 快速啟動 BrowserMCP 的任務
  - 配置管理和健康檢查任務
  - 複製到 `.vscode/tasks.json`

### Claude Code CLI

- **`claude-code-config.json`** - Claude Code CLI 配置範例
  - 包含工具別名和分類
  - 提示詞範例
  - 複製到 `~/.claude-code/mcp-servers.json`

### Git Bash 整合

- **`git-bash-setup.sh`** - Git Bash 自動設定腳本
  - 自動配置環境變數
  - 建立便利的指令別名
  - 修復 Windows 路徑問題

## 🚀 快速開始

### 1. 基本設定

```bash
# 複製預設配置到專案根目錄
cp examples/browsermcp.config.json ./

# 編輯配置檔案以符合您的需求
nano browsermcp.config.json
```

### 2. VS Code 設定

```bash
# 建立 VS Code 配置目錄
mkdir -p .vscode

# 複製配置檔案
cp examples/vscode-launch.json .vscode/launch.json
cp examples/vscode-tasks.json .vscode/tasks.json

# 手動將 vscode-settings.json 的內容加入到您的 VS Code 設定中
```

### 3. Git Bash 設定 (Windows)

```bash
# 執行自動設定腳本
bash examples/git-bash-setup.sh

# 重新啟動終端機或執行
source ~/.bashrc
```

## 📝 注意事項

1. **路徑處理**
   - 所有範例使用通用路徑表示法
   - VS Code 使用 `${workspaceFolder}` 變數
   - 避免硬編碼絕對路徑

2. **環境變數**
   - 可透過環境變數覆蓋配置
   - 使用 `BROWSERMCP_` 前綴
   - 例如：`BROWSERMCP_FALLBACK_MODE=puppeteer`

3. **JSON Schema**
   - 配置檔案支援 JSON Schema 驗證
   - VS Code 會自動提供程式碼補全
   - 確保 `browsermcp.schema.json` 在正確位置

## 🔧 自訂配置

您可以根據需求修改這些範例：

1. 調整超時時間和重試次數
2. 變更 WebSocket 端口
3. 自訂 Puppeteer 啟動參數
4. 設定不同的瀏覽器視窗大小
5. 啟用或停用特定功能

## 💡 最佳實踐

- 使用版本控制追蹤配置變更
- 為不同環境建立專屬配置檔案
- 定期備份重要配置
- 使用環境變數管理敏感資訊
- 遵循團隊的配置規範

---

更多資訊請參考 [主要文檔](../docs/CONFIGURATION.md)
# BrowserMCP - 跨平台相容性修復版本

這是 BrowserMCP 的分支版本，修復了 Windows Git Bash 環境下的相容性問題。

## 問題說明

原始的 BrowserMCP 套件（`@browsermcp/mcp@0.1.3`）在 Windows Git Bash 環境下無法正常初始化，主要原因是連接埠管理工具中硬編碼了 Windows CMD 指令。

### 原始問題
- **錯誤訊息**：`Server exited before responding to initialize request`
- **根本原因**：`killProcessOnPort` 函數使用了 Git Bash 無法解析的 Windows 特定 `FOR /F` 語法
- **受影響檔案**：`src/utils/port.ts`

## 解決方案

此分支實作了強健的跨平台解決方案：

1. **環境偵測**：自動偵測 shell 環境（CMD、PowerShell、Git Bash、WSL、Unix）
2. **自適應指令執行**：針對每個環境使用適當的指令
3. **備援機制**：多重備援策略確保連接埠管理在各平台都能運作
4. **改進錯誤處理**：非致命錯誤搭配詳細的日誌記錄

## 主要變更

### 增強的 `port.ts` 工具
- 新增 `detectShellEnvironment()` 函數來識別當前 shell
- 實作環境特定的連接埠終止策略：
  - **Git Bash/WSL**：使用 `netstat` 搭配 `grep` 和 `awk`
  - **PowerShell**：使用 `Get-NetTCPConnection` cmdlet
  - **CMD**：使用原始的 `FOR /F` 語法並明確呼叫 `cmd.exe`
  - **Unix/Linux/macOS**：使用 `lsof` 或 `fuser`
- 新增 `freePort()` 輔助函數以提供更安全的連接埠管理

## 相容性

已測試並可在以下環境正常運作：
- ✅ Windows CMD
- ✅ Windows PowerShell
- ✅ Git Bash (MINGW64)
- ✅ WSL (Windows Subsystem for Linux)
- ✅ macOS
- ✅ Linux

## 安裝方式

```bash
# 複製此分支
git clone https://github.com/gowerlin/BrowserMCP.git
cd BrowserMCP

# 安裝相依套件
npm install

# 建置專案
npm run build
```

## 使用方式

### 快速開始

將此分支作為原始 BrowserMCP 的直接替代品：

```json
// .mcp/config.json
{
  "servers": {
    "browsermcp": {
      "command": "node",
      "args": ["./path/to/BrowserMCP/dist/index.js"],
      "description": "跨平台相容的瀏覽器自動化"
    }
  }
}
```

### 進階設定

請參考 `examples/` 目錄中的範例：
- [`mcp-config.json`](../examples/mcp-config.json) - 基本 MCP 設定
- [`vscode-mcp-settings.json`](../examples/vscode-mcp-settings.json) - VS Code 全域設定
- [`project-mcp-config.json`](../examples/project-mcp-config.json) - 專案特定設定與選項

### VS Code 設定位置

Windows 使用者的設定檔位置：
- **VS Code**: `C:\Users\[您的使用者名稱]\AppData\Roaming\Code\User\mcp.json`
- **VS Code Insiders**: `C:\Users\[您的使用者名稱]\AppData\Roaming\Code - Insiders\User\mcp.json`

## 測試

測試連接埠管理功能：

```bash
# 執行測試腳本
npm test

# 或手動測試連接埠偵測
node -e "const { detectShellEnvironment } = require('./dist/utils/port'); console.log(detectShellEnvironment())"
```

## 技術細節

### 問題分析

原始程式碼的問題在於：

```javascript
// 原始有問題的程式碼
if (process.platform === "win32") {
  execSync(
    `FOR /F "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`,
  );
}
```

這段程式碼假設 Windows 環境總是使用 CMD，但在以下環境會失敗：
- Git Bash (MINGW64)
- WSL (Windows Subsystem for Linux)
- Cygwin
- Windows 上的其他 Unix-like shells

### 修復策略

1. **智慧環境偵測**：根據環境變數和系統指標判斷實際的 shell 環境
2. **多層次錯誤處理**：每個指令執行都包含錯誤處理和備援方案
3. **非阻塞式錯誤**：連接埠管理失敗不會導致整個伺服器崩潰
4. **詳細日誌記錄**：清楚顯示執行過程和任何問題

## 貢獻指南

歡迎貢獻！請：
1. Fork 此儲存庫
2. 建立功能分支（`git checkout -b feature/improvement`）
3. 提交您的變更（`git commit -am 'Add improvement'`）
4. 推送到分支（`git push origin feature/improvement`）
5. 建立 Pull Request

在提交 PR 之前，請確保在不同的 shell 環境中測試您的變更。

## 授權

MIT License - 與原始 BrowserMCP 相同

## 致謝

- 原始 BrowserMCP 開發者提供的基礎實作
- 社群成員回報 Git Bash 相容性問題
- 協助在不同平台測試的貢獻者
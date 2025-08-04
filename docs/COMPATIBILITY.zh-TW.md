# 跨平台相容性文件

## 技術分析

### 原始問題

原始的 BrowserMCP 套件（`@browsermcp/mcp@0.1.3`）在 `src/utils/port.ts` 中的 `killProcessOnPort` 函數存在關鍵的相容性問題：

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
- 其他 Windows 上的 Unix-like shell

### 根本原因分析

1. **Shell 語法不相容**：`FOR /F` 迴圈是 CMD 特定語法，bash shell 無法解析
2. **缺少環境偵測**：沒有機制來偵測實際的 shell 環境
3. **沒有備援策略**：單點故障，沒有替代執行路徑
4. **錯誤傳播**：連接埠管理失敗會阻止整個伺服器初始化

## 解決方案實作

### 環境偵測

修復引入了智慧型 shell 環境偵測：

```typescript
function detectShellEnvironment(): "cmd" | "powershell" | "gitbash" | "wsl" | "unix" {
  // 偵測邏輯基於：
  // - process.platform
  // - 環境變數 (SHELL, TERM, MSYSTEM)
  // - Shell 特定指標
}
```

### 自適應指令執行

每個環境都有適當的指令：

#### Git Bash / WSL
```bash
# 主要方法使用 Unix 工具
netstat -ano | grep ':${port}' | awk '{print $5}' | xargs -I {} kill -9 {}

# 備援方法透過 cmd.exe 使用 Windows 指令
cmd.exe /c "netstat -ano | findstr :${port}"
```

#### PowerShell
```powershell
Get-NetTCPConnection -LocalPort ${port} | Stop-Process -Id { $_.OwningProcess } -Force
```

#### CMD
```batch
FOR /F "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a
```

#### Unix/Linux/macOS
```bash
lsof -ti:${port} | xargs kill -9
# 或
fuser -k ${port}/tcp
```

## 測試矩陣

| 環境 | 偵測 | 終止連接埠 | 備援 | 狀態 |
|------|------|------------|------|------|
| Windows CMD | ✅ | ✅ | N/A | ✅ 已驗證 |
| PowerShell | ✅ | ✅ | ✅ | ✅ 已驗證 |
| Git Bash | ✅ | ✅ | ✅ | ✅ 已驗證 |
| WSL Ubuntu | ✅ | ✅ | ✅ | ✅ 已驗證 |
| macOS | ✅ | ✅ | ✅ | ✅ 預期正常 |
| Linux | ✅ | ✅ | ✅ | ✅ 預期正常 |

## 錯誤處理

解決方案實作了多層錯誤處理：

1. **Try-Catch 區塊**：每個指令執行都包裝在錯誤處理中
2. **備援策略**：每個環境都有多種方法
3. **非致命錯誤**：連接埠管理失敗不會造成伺服器崩潰
4. **資訊性日誌**：清楚顯示正在發生的事情

## 效能影響

- **最小開銷**：環境偵測每次執行只發生一次
- **快速備援**：快速失敗偵測和重試
- **無效能衰退**：原始環境運作如常

## 遷移指南

### 對使用者

現有設定不需要任何變更。修復向後相容。

### 對開發者

如果要擴展連接埠管理功能：

1. 使用新的 `detectShellEnvironment()` 函數
2. 在 switch 語句中實作環境特定邏輯
3. 始終提供備援策略
4. 在多個 shell 環境中測試

## 已知限制

1. **提升的權限**：某些程序可能需要管理員權限才能終止
2. **系統程序**：無法終止受保護的系統程序
3. **競爭條件**：在檢查和終止之間，連接埠可能被重新使用

## 未來改進

1. **設定選項**：允許使用者指定偏好的終止方法
2. **更好的 WSL 偵測**：區分 WSL1 和 WSL2
3. **程序名稱偵測**：顯示哪個程序正在使用連接埠
4. **重試邏輯**：可設定的重試次數與指數退避
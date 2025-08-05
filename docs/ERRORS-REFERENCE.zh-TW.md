# BrowserMCP 錯誤參考指南

## 可以安全忽略的錯誤

### 1. DevTools Domain 找不到錯誤

這些錯誤是**正常且預期的**：

```
DevTools command error: {"code":-32601,"message":"'Security.enable' wasn't found"}
DevTools command error: {"code":-32601,"message":"'ServiceWorker.enable' wasn't found"}
DevTools command error: {"code":-32601,"message":"'Storage.enable' wasn't found"}
```

**發生原因**：這些 DevTools domains 在某些環境或 Chrome 版本中不可用。

**影響**：無。擴充功能在沒有這些選擇性 domains 的情況下也能完美運作。

### 2. 選擇性 Domain 錯誤

任何包含以下內容的錯誤訊息：
- `Optional domain [name] not available`
- `Could not enable [domain] domain`

這些僅供參考，不會影響功能。

## 需要注意的錯誤

### 1. 擴充功能上下文無效

```
Extension context is invalid. The extension may need to be reloaded.
擴充功能上下文無效。擴充功能可能需要重新載入。
```

**影響**：擴充功能停止運作，直到重新載入。

**解決方案**：
1. 前往 `chrome://extensions/`
2. 找到 BrowserMCP 並點擊重新整理按鈕
3. 重新整理網頁

### 2. 偵錯器已附加

```
Another debugger is already attached to this tab
另一個偵錯器已連接到此標籤頁
```

**影響**：無法連接到該分頁。

**解決方案**：連接前先關閉 Chrome 開發者工具（F12）。

### 3. 無法存取 Chrome 頁面

```
Cannot access chrome:// URLs
無法存取 chrome:// 網址
```

**影響**：擴充功能無法偵錯 Chrome 系統頁面。

**解決方案**：只在一般網頁上使用擴充功能。

## 核心功能狀態

即使有選擇性 domain 錯誤，這些功能仍完美運作：

✅ **網路監控** - 追蹤所有網路請求  
✅ **DOM 操作** - 查詢和修改頁面元素  
✅ **JavaScript 執行** - 在頁面環境中執行程式碼  
✅ **控制台記錄** - 擷取控制台輸出  
✅ **效能分析** - 監控頁面效能  
✅ **CSS 操作** - 動態修改樣式  
✅ **頁面導航** - 控制頁面導航  
✅ **螢幕擷取** - 擷取頁面螢幕截圖  

## 何時需要擔心

只有在看到以下情況時才需要關注：
- 連接到一般網頁失敗
- 重複出現「擴充功能上下文無效」錯誤
- WebSocket 連接失敗（如果使用 MCP 伺服器）
- 核心 domains 的錯誤（Network、Page、Runtime、DOM）

## 快速診斷

驗證擴充功能是否正常運作：

1. 開啟彈出視窗並檢查連接狀態
2. 嘗試連接到一般網頁（非 chrome://）
3. 檢查擴充功能圖示上是否出現「ON」徽章
4. 在控制台中尋找「Extension connected successfully to tab」

如果以上都正常運作，您可以安全地忽略選擇性 domain 錯誤。
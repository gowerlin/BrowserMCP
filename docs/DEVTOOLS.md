# Browser MCP DevTools Integration

完整的瀏覽器 DevTools 功能整合，提供進階的網頁偵錯與分析能力。

## 功能概覽

### 🌐 Network 監控
監控和分析所有網路請求，包括 XHR、Fetch API、WebSocket 等。

#### 可用工具
- `browser_get_network_requests` - 獲取所有網路請求詳細資訊
- `browser_clear_network_log` - 清除網路請求記錄

#### 使用範例
```javascript
// 獲取所有網路請求
await browser_get_network_requests({
  filter: "xhr",  // 只顯示 XHR 請求
  includeResponseBody: true  // 包含回應內容
});

// 清除網路記錄
await browser_clear_network_log();
```

### ⚡ Performance 監控
追蹤和分析網頁效能，包括 Core Web Vitals、記憶體使用等。

#### 可用工具
- `browser_get_performance_metrics` - 獲取效能指標
- `browser_start_performance_profiling` - 開始效能分析
- `browser_stop_performance_profiling` - 停止效能分析並獲取數據

#### 效能指標包含
- **Core Web Vitals**: LCP, FID, CLS
- **載入時間**: DOM 載入、頁面載入完成時間
- **記憶體使用**: JS Heap 大小、DOM 節點數量
- **渲染效能**: FPS、重繪次數

### 🔍 DOM 檢查
深入檢查和分析 DOM 結構、樣式和事件監聽器。

#### 可用工具
- `browser_inspect_element` - 檢查特定元素的詳細資訊
- `browser_get_dom_tree` - 獲取 DOM 樹結構

#### 檢查內容
- 元素屬性和內容
- 計算後的樣式
- 事件監聽器
- 無障礙屬性
- DOM 樹結構

### 💻 JavaScript 執行環境
在頁面上下文中執行 JavaScript 程式碼並分析覆蓋率。

#### 可用工具
- `browser_evaluate_javascript` - 執行 JavaScript 程式碼
- `browser_get_javascript_coverage` - 獲取程式碼覆蓋率

#### 功能特點
- 支援 async/await
- 自動序列化返回值
- 錯誤捕獲和報告
- 程式碼覆蓋率分析

### 💾 Memory 分析
分析記憶體使用情況，檢測記憶體洩漏。

#### 可用工具
- `browser_get_memory_usage` - 獲取記憶體使用統計
- `browser_take_heap_snapshot` - 擷取堆積快照

#### 分析內容
- JS Heap 大小和限制
- DOM 節點數量
- 事件監聽器數量
- 物件分配統計
- 記憶體洩漏檢測

### 🔐 Security 分析
檢查頁面的安全狀態和潛在風險。

#### 可用工具
- `browser_get_security_state` - 獲取安全狀態資訊

#### 檢查項目
- HTTPS 憑證狀態
- 混合內容警告
- CSP 政策
- 安全標頭
- Cookie 安全設定

### 🗄️ Storage 檢查
檢查和管理瀏覽器儲存資料。

#### 可用工具
- `browser_get_storage_data` - 獲取儲存資料

#### 支援的儲存類型
- localStorage
- sessionStorage
- Cookies
- IndexedDB
- Cache Storage

## 整合需求

### 瀏覽器擴充功能端實作
這些功能需要在瀏覽器擴充功能端實作對應的處理邏輯：

1. **Chrome DevTools Protocol (CDP) 整合**
   - 使用 `chrome.debugger` API 連接到 DevTools
   - 監聽和處理 CDP 事件

2. **WebExtensions API 使用**
   - `chrome.webRequest` - 網路請求監控
   - `chrome.performance` - 效能數據
   - `chrome.storage` - 儲存管理

3. **WebSocket 訊息處理**
   - 擴充訊息類型定義
   - 實作對應的訊息處理器

## 安全考量

1. **權限管理**
   - 需要適當的擴充功能權限
   - 使用者授權確認

2. **資料隱私**
   - 敏感資料過濾
   - 回應內容大小限制

3. **執行安全**
   - JavaScript 執行沙箱
   - 防止惡意程式碼執行

## 效能最佳化

1. **資料傳輸**
   - 大型回應分頁傳輸
   - 資料壓縮

2. **記憶體管理**
   - 定期清理快取
   - 限制資料保留時間

3. **非同步處理**
   - 避免阻塞主執行緒
   - 使用 Worker 處理大量資料

## 未來發展

- [ ] WebSocket 訊息追蹤
- [ ] Service Worker 偵錯
- [ ] PWA 功能檢測
- [ ] 無障礙稽核
- [ ] SEO 分析
- [ ] 資源最佳化建議
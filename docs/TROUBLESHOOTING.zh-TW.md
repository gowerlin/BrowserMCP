# BrowserMCP 故障排除指南

全面的故障排除指南，涵蓋常見問題及其解決方案。

## 🔧 安裝問題

### 問題：伺服器在 Git Bash 中無法啟動

**症狀：**
- 錯誤：「Server exited before responding to initialize request」
- 程序啟動後立即退出
- 在 CMD/PowerShell 中正常運作，但在 Git Bash 中失敗

**根本原因：**
跨平台相容性問題，shell 環境偵測有誤。

**解決方案：**
此 fork 專門解決這個問題。如果您仍遇到問題：

1. **更新到最新版本：**
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

2. **驗證環境偵測：**
   ```bash
   node -e "console.log(process.env.SHELL, process.env.TERM, process.env.MSYSTEM)"
   ```

3. **必要時強制指定環境：**
   ```bash
   SHELL=/bin/bash npm run watch
   ```

### 問題：npm install 失敗

**症狀：**
- 套件安裝錯誤
- 權限被拒絕錯誤
- Node 版本相容性問題

**解決方案：**

1. **檢查 Node.js 版本：**
   ```bash
   node --version  # 應該 >= 18.0.0
   npm --version   # 應該 >= 8.0.0
   ```

2. **清除 npm 快取：**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **使用 yarn 作為替代方案：**
   ```bash
   yarn install
   yarn build
   ```

### 問題：TypeScript 編譯錯誤

**症狀：**
- 建置因類型錯誤而失敗
- 缺少類型定義
- 匯入解析失敗

**解決方案：**

1. **安裝所有依賴：**
   ```bash
   npm install --save-dev @types/node typescript
   ```

2. **檢查 tsconfig.json：**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "node",
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true
     }
   }
   ```

3. **重新建置專案：**
   ```bash
   npm run clean
   npm run build
   ```

## 🌐 WebSocket 連接問題

### 問題：WebSocket 連接被拒絕

**症狀：**
- 「Connection refused」錯誤
- WebSocket 伺服器無回應
- 瀏覽器擴充功能無法連接到 MCP 伺服器

**解決方案：**

1. **檢查伺服器是否運行：**
   ```bash
   netstat -ano | findstr :9002  # Windows
   lsof -i :9002                 # macOS/Linux
   ```

2. **驗證埠號配置：**
   ```javascript
   // 檢查 WS_URL 環境變數
   const wsUrl = process.env.WS_URL || 'ws://localhost:9002';
   console.log('WebSocket URL:', wsUrl);
   ```

3. **手動測試連接：**
   ```bash
   # 安裝 wscat 進行測試
   npm install -g wscat
   wscat -c ws://localhost:9002
   ```

4. **檢查防火牆設定：**
   - Windows：允許 node.exe 通過 Windows 防火牆
   - macOS：系統偏好設定 > 安全性與隱私權 > 防火牆
   - Linux：檢查 iptables 規則

### 問題：埠號已被使用

**症狀：**
- 「EADDRINUSE」錯誤
- 伺服器無法綁定到埠號
- 多個實例同時運行

**解決方案：**

1. **終止使用埠號的程序：**
   ```bash
   # Windows
   netstat -ano | findstr :9002
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:9002 | xargs kill -9
   ```

2. **使用不同埠號：**
   ```bash
   WS_PORT=9003 npm run watch
   ```

3. **自動埠號清理：**
   ```bash
   npm run clean-ports
   ```

## 🔍 瀏覽器擴充功能問題

### 問題：擴充功能無法載入

**症狀：**
- 擴充功能不出現在 Chrome 中
- 控制台出現 Manifest 錯誤
- 擴充功能自動被停用

**解決方案：**

1. **檢查 manifest.json 有效性：**
   ```bash
   # 驗證 JSON 語法
   node -e "console.log(JSON.parse(require('fs').readFileSync('./browser-extension/manifest.json')))"
   ```

2. **啟用開發者模式：**
   - Chrome：`chrome://extensions/` → 啟用「開發者模式」
   - 從 `browser-extension` 資料夾載入未封裝的擴充功能

3. **檢查擴充功能錯誤：**
   - Chrome DevTools → Extensions 分頁
   - 查看背景腳本錯誤

4. **驗證權限：**
   ```json
   {
     "permissions": [
       "debugger",
       "tabs",
       "storage",
       "webNavigation",
       "scripting",
       "activeTab"
     ]
   }
   ```

### 問題：Chrome debugger API 錯誤

**症狀：**
- 「Cannot access a chrome-extension:// URL」錯誤
- debugger 權限被拒絕
- Debugger 附加失敗

**解決方案：**

1. **檢查分頁權限：**
   ```javascript
   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
     if (chrome.runtime.lastError) {
       console.error('分頁查詢錯誤:', chrome.runtime.lastError);
     }
   });
   ```

2. **驗證 debugger 權限：**
   ```javascript
   chrome.debugger.attach({tabId: tabId}, "1.3", () => {
     if (chrome.runtime.lastError) {
       console.error('Debugger 附加錯誤:', chrome.runtime.lastError);
     }
   });
   ```

3. **處理受保護的頁面：**
   - chrome:// URL 無法被偵錯
   - 擴充功能頁面需要特殊權限
   - 某些網站會阻擋 debugger 存取

## 🛠️ DevTools 整合問題

### 問題：CDP 命令失敗

**症狀：**
- 「Protocol error」訊息
- 命令逾時
- 回應不完整

**解決方案：**

1. **檢查域啟用：**
   ```javascript
   const domains = ['Network', 'Page', 'DOM', 'Runtime', 'Performance'];
   for (const domain of domains) {
     await chrome.debugger.sendCommand(debuggeeId, `${domain}.enable`);
   }
   ```

2. **添加逾時處理：**
   ```javascript
   const sendCommandWithTimeout = (debuggeeId, method, params, timeout = 5000) => {
     return Promise.race([
       chrome.debugger.sendCommand(debuggeeId, method, params),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('命令逾時')), timeout)
       )
     ]);
   };
   ```

3. **優雅地處理命令失敗：**
   ```javascript
   try {
     const result = await chrome.debugger.sendCommand(debuggeeId, method, params);
     return result;
   } catch (error) {
     console.warn(`命令 ${method} 失敗:`, error);
     return { error: error.message };
   }
   ```

### 問題：網路請求未被捕獲

**症狀：**
- 網路請求列表為空
- 缺少請求/回應資料
- 時間資訊不完整

**解決方案：**

1. **提早啟用 Network 域：**
   ```javascript
   await chrome.debugger.sendCommand(debuggeeId, 'Network.enable');
   await chrome.debugger.sendCommand(debuggeeId, 'Page.enable');
   ```

2. **必要時清除快取：**
   ```javascript
   await chrome.debugger.sendCommand(debuggeeId, 'Network.clearBrowserCache');
   await chrome.debugger.sendCommand(debuggeeId, 'Network.clearBrowserCookies');
   ```

3. **檢查事件監聽器：**
   ```javascript
   chrome.debugger.onEvent.addListener((source, method, params) => {
     if (method === 'Network.requestWillBeSent') {
       console.log('請求:', params);
     }
   });
   ```

## 📊 效能問題

### 問題：記憶體使用量過高

**症狀：**
- 瀏覽器變慢
- 記憶體使用量持續增加
- 記憶體不足錯誤

**解決方案：**

1. **實作清理例程：**
   ```javascript
   // 清除舊的網路請求
   setInterval(() => {
     const cutoff = Date.now() - 300000; // 5 分鐘
     this.networkRequests = new Map(
       [...this.networkRequests].filter(([_, req]) => req.timestamp > cutoff)
     );
   }, 60000);
   ```

2. **限制資料保留：**
   ```javascript
   const MAX_CONSOLE_MESSAGES = 1000;
   if (this.consoleMessages.length > MAX_CONSOLE_MESSAGES) {
     this.consoleMessages = this.consoleMessages.slice(-MAX_CONSOLE_MESSAGES);
   }
   ```

3. **監控記憶體使用：**
   ```javascript
   setInterval(async () => {
     const usage = await browser_get_memory_usage();
     if (usage.jsHeap.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
       console.warn('偵測到高記憶體使用量');
     }
   }, 30000);
   ```

### 問題：回應時間緩慢

**症狀：**
- 命令執行時間過長
- 瀏覽器變得無回應
- 逾時錯誤頻繁

**解決方案：**

1. **實作請求佇列：**
   ```javascript
   class RequestQueue {
     constructor(maxConcurrent = 3) {
       this.queue = [];
       this.running = 0;
       this.maxConcurrent = maxConcurrent;
     }
     
     async add(requestFunc) {
       return new Promise((resolve, reject) => {
         this.queue.push({ requestFunc, resolve, reject });
         this.process();
       });
     }
     
     async process() {
       if (this.running >= this.maxConcurrent || this.queue.length === 0) {
         return;
       }
       
       this.running++;
       const { requestFunc, resolve, reject } = this.queue.shift();
       
       try {
         const result = await requestFunc();
         resolve(result);
       } catch (error) {
         reject(error);
       } finally {
         this.running--;
         this.process();
       }
     }
   }
   ```

2. **添加回應快取：**
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 30000; // 30 秒
   
   function getCachedResponse(key) {
     const cached = cache.get(key);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }
     return null;
   }
   ```

## 🔒 安全問題

### 問題：CORS 錯誤

**症狀：**
- 跨來源請求被阻擋
- 存取被拒絕錯誤
- 來自不同來源的 WebSocket 連接被拒絕

**解決方案：**

1. **配置主機權限：**
   ```json
   {
     "host_permissions": [
       "http://*/*",
       "https://*/*"
     ]
   }
   ```

2. **在伺服器中處理 CORS：**
   ```javascript
   // 如果運行網頁伺服器，添加 CORS 標頭
   response.setHeader('Access-Control-Allow-Origin', '*');
   response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
   ```

3. **使用內容腳本進行跨來源：**
   ```javascript
   // 不要直接 fetch，使用內容腳本
   chrome.tabs.executeScript(tabId, {
     code: `fetch('${url}').then(r => r.json())`
   });
   ```

### 問題：權限被拒絕錯誤

**症狀：**
- 無法存取分頁內容
- Debugger 附加失敗
- 儲存存取被拒絕

**解決方案：**

1. **請求額外權限：**
   ```json
   {
     "permissions": [
       "activeTab",
       "tabs",
       "storage",
       "debugger"
     ],
     "optional_permissions": [
       "cookies",
       "webRequest"
     ]
   }
   ```

2. **檢查分頁 URL 限制：**
   ```javascript
   const restrictedUrls = [
     'chrome://',
     'chrome-extension://',
     'moz-extension://',
     'file://'
   ];
   
   function canAccessTab(url) {
     return !restrictedUrls.some(restricted => url.startsWith(restricted));
   }
   ```

## 🧪 測試問題

### 問題：測試失敗

**症狀：**
- 測試中 WebSocket 連接逾時
- 斷言失敗
- 測試環境設定問題

**解決方案：**

1. **模擬 WebSocket 進行測試：**
   ```javascript
   // test/setup.js
   const WebSocket = require('ws');
   global.WebSocket = WebSocket;
   
   // 測試用模擬伺服器
   const mockServer = new WebSocket.Server({ port: 9002 });
   mockServer.on('connection', (ws) => {
     ws.on('message', (data) => {
       const message = JSON.parse(data);
       ws.send(JSON.stringify({ id: message.id, payload: {} }));
     });
   });
   ```

2. **添加測試逾時：**
   ```javascript
   describe('DevTools Integration', function() {
     this.timeout(30000); // 30 秒
     
     beforeEach(async function() {
       await new Promise(resolve => setTimeout(resolve, 1000));
     });
   });
   ```

3. **環境變數配置：**
   ```bash
   # .env.test
   WS_URL=ws://localhost:9003
   NODE_ENV=test
   DEBUG=false
   ```

## 📝 除錯提示

### 啟用除錯記錄

```bash
# 啟用詳細記錄
DEBUG=* npm run watch

# 啟用特定模組記錄
DEBUG=browsermcp:* npm run watch

# 記錄到檔案
DEBUG=* npm run watch 2>&1 | tee debug.log
```

### Chrome DevTools 除錯

1. **除錯背景腳本：**
   - 前往 `chrome://extensions/`
   - 點擊「檢查檢視：背景頁面」

2. **除錯內容腳本：**
   - 開啟頁面 DevTools
   - Sources 分頁 → Content scripts

3. **除錯 WebSocket 訊息：**
   ```javascript
   // 添加到背景腳本
   chrome.debugger.onEvent.addListener((source, method, params) => {
     console.log('CDP 事件:', method, params);
   });
   ```

### 網路除錯

```bash
# 測試 WebSocket 連接
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:9002/

# 檢查埠號綁定
netstat -tlnp | grep 9002
```

## 📞 獲得協助

### 建立問題回報前

1. **檢查現有問題：** 搜索 [GitHub Issues](https://github.com/BrowserMCP/mcp/issues)
2. **檢視記錄：** 包含相關錯誤訊息和堆疊追蹤
3. **環境資訊：** 提供作業系統、Node.js 版本、瀏覽器版本
4. **最小重現：** 建立能重現問題的簡單測試案例

### 問題回報模板

```markdown
**環境：**
- 作業系統：[Windows 10/11, macOS, Linux 發行版]
- Node.js 版本：[18.x.x]
- npm 版本：[8.x.x]
- 瀏覽器：[Chrome 120.x]
- Shell：[Git Bash, CMD, PowerShell, 等]

**問題描述：**
[清楚描述問題]

**重現步驟：**
1. [第一步]
2. [第二步]
3. [第三步]

**預期行為：**
[您期望發生的事情]

**實際行為：**
[實際發生的事情]

**錯誤訊息：**
```
[包含完整錯誤訊息和堆疊追蹤]
```

**額外資訊：**
[任何其他相關資訊]
```

### 社群資源

- **文件：** [GitHub Wiki](https://github.com/BrowserMCP/mcp/wiki)
- **討論：** [GitHub Discussions](https://github.com/BrowserMCP/mcp/discussions)
- **範例：** [範例儲存庫](https://github.com/BrowserMCP/examples)

### 快速修復檢查清單

- [ ] 已更新到最新版本
- [ ] 已清除 npm 快取並重新安裝依賴
- [ ] 已重新啟動瀏覽器和擴充功能
- [ ] 已檢查防火牆和防毒軟體設定
- [ ] 已驗證 Node.js 和 npm 版本
- [ ] 已在不同 shell 環境中測試
- [ ] 已檢視瀏覽器控制台錯誤
- [ ] 已檢查擴充功能權限

此故障排除指南涵蓋了使用 BrowserMCP 時遇到的最常見問題。如果您遇到此處未涵蓋的問題，請檢查 GitHub 儲存庫以獲取更新，或建立包含問題詳細資訊的新問題回報。
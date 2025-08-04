# BrowserMCP Troubleshooting Guide

Comprehensive troubleshooting guide for common issues and their solutions.

## 🔧 Installation Issues

### Issue: Server fails to start in Git Bash

**Symptoms:**
- Error: "Server exited before responding to initialize request"
- Process exits immediately after starting
- Works in CMD/PowerShell but not Git Bash

**Root Cause:**
Cross-platform compatibility issues with shell environment detection.

**Solution:**
This fork specifically addresses this issue. If you're still experiencing problems:

1. **Update to latest version:**
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

2. **Verify environment detection:**
   ```bash
   node -e "console.log(process.env.SHELL, process.env.TERM, process.env.MSYSTEM)"
   ```

3. **Force environment if needed:**
   ```bash
   SHELL=/bin/bash npm run watch
   ```

### Issue: npm install fails

**Symptoms:**
- Package installation errors
- Permission denied errors
- Node version compatibility issues

**Solutions:**

1. **Check Node.js version:**
   ```bash
   node --version  # Should be >= 18.0.0
   npm --version   # Should be >= 8.0.0
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use yarn as alternative:**
   ```bash
   yarn install
   yarn build
   ```

### Issue: TypeScript compilation errors

**Symptoms:**
- Build fails with type errors
- Missing type definitions
- Import resolution failures

**Solutions:**

1. **Install all dependencies:**
   ```bash
   npm install --save-dev @types/node typescript
   ```

2. **Check tsconfig.json:**
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

3. **Rebuild project:**
   ```bash
   npm run clean
   npm run build
   ```

## 🌐 WebSocket Connection Issues

### Issue: WebSocket connection refused

**Symptoms:**
- "Connection refused" errors
- WebSocket server not responding
- Browser extension can't connect to MCP server

**Solutions:**

1. **Check if server is running:**
   ```bash
   netstat -ano | findstr :9002  # Windows
   lsof -i :9002                 # macOS/Linux
   ```

2. **Verify port configuration:**
   ```javascript
   // Check WS_URL environment variable
   const wsUrl = process.env.WS_URL || 'ws://localhost:9002';
   console.log('WebSocket URL:', wsUrl);
   ```

3. **Test connection manually:**
   ```bash
   # Install wscat for testing
   npm install -g wscat
   wscat -c ws://localhost:9002
   ```

4. **Check firewall settings:**
   - Windows: Allow node.exe through Windows Firewall
   - macOS: System Preferences > Security & Privacy > Firewall
   - Linux: Check iptables rules

### Issue: Port already in use

**Symptoms:**
- "EADDRINUSE" error
- Server fails to bind to port
- Multiple instances running

**Solutions:**

1. **Kill process using port:**
   ```bash
   # Windows
   netstat -ano | findstr :9002
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:9002 | xargs kill -9
   ```

2. **Use different port:**
   ```bash
   WS_PORT=9003 npm run watch
   ```

3. **Automated port cleanup:**
   ```bash
   npm run clean-ports
   ```

## 🔍 Browser Extension Issues

### Issue: Extension not loading

**Symptoms:**
- Extension doesn't appear in Chrome
- Manifest errors in console
- Extension disabled automatically

**Solutions:**

1. **Check manifest.json validity:**
   ```bash
   # Validate JSON syntax
   node -e "console.log(JSON.parse(require('fs').readFileSync('./browser-extension/manifest.json')))"
   ```

2. **Enable Developer mode:**
   - Chrome: `chrome://extensions/` → Enable "Developer mode"
   - Load unpacked extension from `browser-extension` folder

3. **Check extension errors:**
   - Chrome DevTools → Extensions tab
   - Look for background script errors

4. **Verify permissions:**
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

### Issue: Chrome debugger API errors

**Symptoms:**
- "Cannot access a chrome-extension:// URL" errors
- Permission denied for debugger
- Debugger attach failures

**Solutions:**

1. **Check tab permissions:**
   ```javascript
   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
     if (chrome.runtime.lastError) {
       console.error('Tab query error:', chrome.runtime.lastError);
     }
   });
   ```

2. **Verify debugger permissions:**
   ```javascript
   chrome.debugger.attach({tabId: tabId}, "1.3", () => {
     if (chrome.runtime.lastError) {
       console.error('Debugger attach error:', chrome.runtime.lastError);
     }
   });
   ```

3. **Handle protected pages:**
   - chrome:// URLs cannot be debugged
   - Extension pages require special permissions
   - Some sites block debugger access

## 🛠️ DevTools Integration Issues

### Issue: CDP commands failing

**Symptoms:**
- "Protocol error" messages
- Commands timeout
- Incomplete responses

**Solutions:**

1. **Check domain enablement:**
   ```javascript
   const domains = ['Network', 'Page', 'DOM', 'Runtime', 'Performance'];
   for (const domain of domains) {
     await chrome.debugger.sendCommand(debuggeeId, `${domain}.enable`);
   }
   ```

2. **Add timeout handling:**
   ```javascript
   const sendCommandWithTimeout = (debuggeeId, method, params, timeout = 5000) => {
     return Promise.race([
       chrome.debugger.sendCommand(debuggeeId, method, params),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('Command timeout')), timeout)
       )
     ]);
   };
   ```

3. **Handle command failures gracefully:**
   ```javascript
   try {
     const result = await chrome.debugger.sendCommand(debuggeeId, method, params);
     return result;
   } catch (error) {
     console.warn(`Command ${method} failed:`, error);
     return { error: error.message };
   }
   ```

### Issue: Network requests not captured

**Symptoms:**
- Empty network request list
- Missing request/response data
- Incomplete timing information

**Solutions:**

1. **Enable Network domain early:**
   ```javascript
   await chrome.debugger.sendCommand(debuggeeId, 'Network.enable');
   await chrome.debugger.sendCommand(debuggeeId, 'Page.enable');
   ```

2. **Clear cache if needed:**
   ```javascript
   await chrome.debugger.sendCommand(debuggeeId, 'Network.clearBrowserCache');
   await chrome.debugger.sendCommand(debuggeeId, 'Network.clearBrowserCookies');
   ```

3. **Check event listeners:**
   ```javascript
   chrome.debugger.onEvent.addListener((source, method, params) => {
     if (method === 'Network.requestWillBeSent') {
       console.log('Request:', params);
     }
   });
   ```

## 📊 Performance Issues

### Issue: High memory usage

**Symptoms:**
- Browser becomes slow
- Memory usage constantly increasing
- Out of memory errors

**Solutions:**

1. **Implement cleanup routines:**
   ```javascript
   // Clear old network requests
   setInterval(() => {
     const cutoff = Date.now() - 300000; // 5 minutes
     this.networkRequests = new Map(
       [...this.networkRequests].filter(([_, req]) => req.timestamp > cutoff)
     );
   }, 60000);
   ```

2. **Limit data retention:**
   ```javascript
   const MAX_CONSOLE_MESSAGES = 1000;
   if (this.consoleMessages.length > MAX_CONSOLE_MESSAGES) {
     this.consoleMessages = this.consoleMessages.slice(-MAX_CONSOLE_MESSAGES);
   }
   ```

3. **Monitor memory usage:**
   ```javascript
   setInterval(async () => {
     const usage = await browser_get_memory_usage();
     if (usage.jsHeap.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
       console.warn('High memory usage detected');
     }
   }, 30000);
   ```

### Issue: Slow response times

**Symptoms:**
- Commands take long time to execute
- Browser becomes unresponsive
- Timeout errors frequent

**Solutions:**

1. **Implement request queuing:**
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

2. **Add response caching:**
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 30000; // 30 seconds
   
   function getCachedResponse(key) {
     const cached = cache.get(key);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }
     return null;
   }
   ```

## 🔒 Security Issues

### Issue: CORS errors

**Symptoms:**
- Cross-origin request blocked
- Access denied errors
- WebSocket connection refused from different origins

**Solutions:**

1. **Configure host permissions:**
   ```json
   {
     "host_permissions": [
       "http://*/*",
       "https://*/*"
     ]
   }
   ```

2. **Handle CORS in server:**
   ```javascript
   // Add CORS headers if running web server
   response.setHeader('Access-Control-Allow-Origin', '*');
   response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
   ```

3. **Use content scripts for cross-origin:**
   ```javascript
   // Instead of direct fetch, use content script
   chrome.tabs.executeScript(tabId, {
     code: `fetch('${url}').then(r => r.json())`
   });
   ```

### Issue: Permission denied errors

**Symptoms:**
- Cannot access tab content
- Debugger attach fails
- Storage access denied

**Solutions:**

1. **Request additional permissions:**
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

2. **Check tab URL restrictions:**
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

## 🧪 Testing Issues

### Issue: Tests failing

**Symptoms:**
- WebSocket connection timeouts in tests
- Assertion failures
- Test environment setup issues

**Solutions:**

1. **Mock WebSocket for testing:**
   ```javascript
   // test/setup.js
   const WebSocket = require('ws');
   global.WebSocket = WebSocket;
   
   // Mock server for tests
   const mockServer = new WebSocket.Server({ port: 9002 });
   mockServer.on('connection', (ws) => {
     ws.on('message', (data) => {
       const message = JSON.parse(data);
       ws.send(JSON.stringify({ id: message.id, payload: {} }));
     });
   });
   ```

2. **Add test timeouts:**
   ```javascript
   describe('DevTools Integration', function() {
     this.timeout(30000); // 30 seconds
     
     beforeEach(async function() {
       await new Promise(resolve => setTimeout(resolve, 1000));
     });
   });
   ```

3. **Environment variable configuration:**
   ```bash
   # .env.test
   WS_URL=ws://localhost:9003
   NODE_ENV=test
   DEBUG=false
   ```

## 📝 Debugging Tips

### Enable Debug Logging

```bash
# Enable verbose logging
DEBUG=* npm run watch

# Enable specific module logging
DEBUG=browsermcp:* npm run watch

# Log to file
DEBUG=* npm run watch 2>&1 | tee debug.log
```

### Chrome DevTools Debugging

1. **Debug background script:**
   - Go to `chrome://extensions/`
   - Click "Inspect views: background page"

2. **Debug content script:**
   - Open page DevTools
   - Sources tab → Content scripts

3. **Debug WebSocket messages:**
   ```javascript
   // Add to background script
   chrome.debugger.onEvent.addListener((source, method, params) => {
     console.log('CDP Event:', method, params);
   });
   ```

### Network Debugging

```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:9002/

# Check port binding
netstat -tlnp | grep 9002
```

## 📞 Getting Help

### Before Creating an Issue

1. **Check existing issues:** Search [GitHub Issues](https://github.com/BrowserMCP/mcp/issues)
2. **Review logs:** Include relevant error messages and stack traces
3. **Environment info:** Provide OS, Node.js version, browser version
4. **Minimal reproduction:** Create a simple test case that reproduces the issue

### Issue Template

```markdown
**Environment:**
- OS: [Windows 10/11, macOS, Linux distribution]
- Node.js version: [18.x.x]
- npm version: [8.x.x]
- Browser: [Chrome 120.x]
- Shell: [Git Bash, CMD, PowerShell, etc.]

**Problem Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What you expected to happen]

**Actual Behavior:**
[What actually happened]

**Error Messages:**
```
[Include full error messages and stack traces]
```

**Additional Context:**
[Any other relevant information]
```

### Community Resources

- **Documentation:** [GitHub Wiki](https://github.com/BrowserMCP/mcp/wiki)
- **Discussions:** [GitHub Discussions](https://github.com/BrowserMCP/mcp/discussions)
- **Examples:** [Examples Repository](https://github.com/BrowserMCP/examples)

### Quick Fixes Checklist

- [ ] Updated to latest version
- [ ] Cleared npm cache and reinstalled dependencies
- [ ] Restarted browser and extension
- [ ] Checked firewall and antivirus settings
- [ ] Verified Node.js and npm versions
- [ ] Tested in different shell environment
- [ ] Reviewed browser console for errors
- [ ] Checked extension permissions

This troubleshooting guide covers the most common issues encountered when using BrowserMCP. If you encounter an issue not covered here, please check the GitHub repository for updates or create a new issue with detailed information about your problem.
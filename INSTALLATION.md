# Browser MCP v0.2.0 Installation Guide

## 🚀 Quick Start

Browser MCP v0.2.0 introduces complete DevTools integration with intelligent fallback system between Chrome Extension and Puppeteer modes.

### System Requirements

- Node.js 18+ (recommended) or 16+ (minimum)
- Chrome/Chromium browser (latest version recommended)
- npm or yarn package manager
- Windows, macOS, or Linux operating system

## 📦 Installation Steps

### 1. Install MCP Server

#### Option A: From Source (Current Method)

```bash
# Clone the repository
git clone https://github.com/gowerlin/BrowserMCP.git
cd BrowserMCP

# Install dependencies
npm install

# Build the project
npm run build

# Verify installation
npm run typecheck
npm test

# Optional: Create global symlink for easier access
npm link
# Now you can use 'browsermcp' command globally
```

#### Option B: Local Development Build

```bash
# If you already have the source code
cd D:\ForgejoGit\BrowserMCP

# Clean and rebuild
rm -rf dist/
npm install
npm run build

# Verify build output
ls -la dist/
# Should contain index.js and other compiled files
```

### 2. Install Chrome Extension

#### Developer Mode Installation

1. **Open Chrome Extensions Page**
   - Navigate to: `chrome://extensions/`
   - Or: Menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top right

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to and select the `browser-extension` folder
   - Verify the extension loads successfully

4. **Pin the Extension**
   - Click the puzzle piece icon in the toolbar
   - Find "Browser MCP DevTools Integration"
   - Click the pin icon to keep it visible

### 3. Configure Connection Modes

#### 🆕 v0.2.0 Smart Fallback Configuration

Create `browsermcp.config.json` in your project root:

```json
{
  "fallback": {
    "mode": "auto",              // "extension" | "puppeteer" | "auto"
    "extensionTimeout": 5000,
    "retryAttempts": 2,
    "enableLogging": true
  },
  "websocket": {
    "url": "ws://localhost:9002",
    "port": 9002,
    "reconnectAttempts": 3,
    "reconnectDelay": 2000
  },
  "puppeteer": {
    "headless": false,
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "timeout": 30000
  },
  "devtools": {
    "enableNetworkMonitoring": true,
    "enablePerformanceMonitoring": true,
    "maxConsoleLogEntries": 1000,
    "maxNetworkRequestEntries": 1000
  }
}
```

### 4. AI Tool Integration

⚠️ **Important**: Choose only ONE integration method to avoid port conflicts!

#### Option A: VS Code AI Tools (Recommended)

```json
// C:\Users\YourName\AppData\Roaming\Code\User\settings.json
{
  "ai.tools.browserMCP.enabled": true,
  "ai.tools.browserMCP.description": "BrowserMCP 提供瀏覽器自動化功能，包括網頁導航、截圖、內容提取、JavaScript 執行等",
  "ai.tools.browserMCP.path": "D:\\ForgejoGit\\BrowserMCP\\dist\\index.js",
  "ai.tools.browserMCP.args": ["--auto-fallback", "--verbose"],
  "ai.prompt.globalHints": [
    "當需要瀏覽器自動化、網頁截圖、內容提取或 JavaScript 執行時，請使用 BrowserMCP 工具",
    "BrowserMCP 支援智能備援模式，優先使用 Chrome Extension，必要時自動切換到 Puppeteer"
  ]
}
```

#### Option B: Legacy MCP Format (VS Code with Continue/Codeium)

```json
// .vscode/settings.json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["${workspaceFolder}/BrowserMCP/dist/index.js", "--auto-fallback"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  }
}
```

#### Option C: Claude Desktop (⚠️ Port Conflict Risk)

**⚠️ Warning**: If using VS Code AI Tools, keep Claude Desktop config empty to avoid port 9002 conflicts!

```json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
// Linux: ~/.config/Claude/claude_desktop_config.json

// Option 1: Empty config (recommended if using VS Code)
{
  "globalShortcut": "",
  "mcpServers": {}
}

// Option 2: Claude Desktop only (disable VS Code AI Tools first)
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["D:\\ForgejoGit\\BrowserMCP\\dist\\index.js", "--auto-fallback"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  }
}
```

#### Option D: Cursor IDE

```json
// .cursor/mcp.json
{
  "servers": {
    "browsermcp": {
      "command": "node",
      "args": ["D:\\ForgejoGit\\BrowserMCP\\dist\\index.js", "--auto-fallback"],
      "description": "Browser automation with DevTools",
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto"
      }
    }
  }
}
```

#### Option E: Claude Code CLI (WSL/Linux)

```json
// ~/.claude/settings.json or project/.claude-code/config.json
{
  "mcp": {
    "servers": {
      "browsermcp": {
        "command": "node",
        "args": ["/mnt/d/ForgejoGit/BrowserMCP/dist/index.js", "--auto-fallback"],
        "cwd": ".",
        "env": {
          "BROWSERMCP_FALLBACK_MODE": "auto",
          "BROWSERMCP_ENABLE_LOGGING": "true"
        }
      }
    }
  }
}
```

## 🎯 v0.2.0 Features Setup

### Smart Fallback System

The intelligent fallback system automatically switches between Chrome Extension and Puppeteer:

```bash
# Extension-only mode (fastest, requires extension)
mcp-server-browsermcp --extension-only

# Puppeteer-only mode (no extension needed)
mcp-server-browsermcp --puppeteer-only --headless

# Smart auto mode (default, best of both worlds)
mcp-server-browsermcp --auto-fallback

# Show current configuration
mcp-server-browsermcp --show-config
```

### Environment Variables

```bash
# Set fallback mode
export BROWSERMCP_FALLBACK_MODE=auto  # extension | puppeteer | auto

# Puppeteer options
export BROWSERMCP_PUPPETEER_HEADLESS=false

# WebSocket configuration
export BROWSERMCP_WS_URL=ws://localhost:9002

# Enable detailed logging
export BROWSERMCP_ENABLE_LOGGING=true
```

## 🧪 Testing Installation

### 1. Check Configuration Conflicts

```bash
# Check if port 9002 is already in use
netstat -an | findstr 9002
# Should show only ONE listening process

# Check running Node.js processes
tasklist | findstr node
# Should show expected number of processes
```

### 2. Basic Connection Test

```bash
# Start the server with logging
node dist/index.js --auto-fallback --verbose

# Or use npm script
npm start

# Check configuration
node dist/index.js --show-config
```

### 2. Test DevTools Features

#### Using Extension Mode
1. Open Chrome and navigate to any website
2. Click the Browser MCP extension icon
3. Click "Connect Current Tab"
4. Status should show "Connected"

#### Using Puppeteer Mode
```bash
# Start in Puppeteer-only mode
mcp-server-browsermcp --puppeteer-only

# The browser will launch automatically
```

### 3. Run Test Suite

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:verbose       # Detailed output
npm run test:bail          # Stop on first failure
```

### 4. Test Fallback Tools

Test the new v0.2.0 fallback tools in your AI tool:

```javascript
// Network monitoring with fallback
await browser_get_network_requests_fallback({ 
  filter: "xhr" 
});

// Performance metrics with fallback
await browser_get_performance_metrics_fallback();

// DOM inspection with fallback
await browser_inspect_element_fallback({ 
  selector: "body",
  includeStyles: true,
  includeEventListeners: true
});

// JavaScript execution with fallback
await browser_evaluate_javascript_fallback({ 
  code: "window.location.href",
  awaitPromise: false
});

// Storage inspection with fallback
await browser_get_storage_data_fallback({ 
  storageType: "localStorage"
});

// Console logs with fallback
await browser_get_console_logs_fallback();

// Health check both systems
await browser_health_check();

// Switch modes dynamically
await browser_set_mode({ mode: "puppeteer" });
```

## 🔍 Troubleshooting

### Common Issues

#### Port Conflict Issues (Most Common)
```bash
# Check if multiple MCP servers are running
netstat -an | findstr 9002
# Should show only ONE listening process

# Windows: Kill conflicting processes on port 9002
for /f "tokens=5" %a in ('netstat -aon ^| findstr :9002') do taskkill /F /PID %a

# Linux/macOS: Kill processes on port 9002
lsof -i :9002
kill -9 <PID>

# Solution: Choose only ONE integration method:
# - VS Code AI Tools OR Claude Desktop (not both!)
```

#### Extension Connection Issues
```bash
# Verify extension is installed and connected
# 1. Go to chrome://extensions/
# 2. Find "Browser MCP DevTools Integration"
# 3. Ensure it's enabled
# 4. Click extension icon and connect to current tab
```

#### Puppeteer Launch Issues
```bash
# Install required dependencies (Linux)
sudo apt-get install -y \
  libnss3 libatk-bridge2.0-0 libdrm2 \
  libxkbcommon0 libgbm1 libasound2

# Check Puppeteer installation
node -e "require('puppeteer').launch().then(b => { console.log('OK'); b.close(); })"
```

#### TypeScript Compilation Issues
```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Check for type errors
npm run typecheck
```

### Debug Mode

#### Enable Verbose Logging
```bash
# Via environment variable
export BROWSERMCP_ENABLE_LOGGING=true
npm start

# Via command line
mcp-server-browsermcp --verbose
```

#### View Extension Logs
1. Go to `chrome://extensions/`
2. Find Browser MCP
3. Click "Inspect views: background page"
4. Check Console for logs

#### View Server Logs
```bash
# Enable debug output
DEBUG=* npm start

# Filter specific modules
DEBUG=browsermcp:* npm start
```

## 📊 Performance Optimization

### Port Management & Conflict Prevention

#### Single Host Configuration (Recommended)

```bash
# Option 1: VS Code Only
# Keep VS Code AI Tools enabled
# Clear Claude Desktop config: {"mcpServers": {}}

# Option 2: Claude Desktop Only  
# Disable VS Code AI Tools: "ai.tools.browserMCP.enabled": false
# Configure Claude Desktop with BrowserMCP

# Option 3: Different Ports (Advanced)
# VS Code: ws://localhost:9002
# Claude Desktop: ws://localhost:9003 (requires custom config)
```

### Recommended Settings for Different Use Cases

#### Development & Testing
```json
{
  "fallback": {
    "mode": "auto",
    "enableLogging": true
  },
  "puppeteer": {
    "headless": false
  }
}
```

#### Production & CI/CD
```json
{
  "fallback": {
    "mode": "puppeteer",
    "enableLogging": false
  },
  "puppeteer": {
    "headless": true,
    "args": ["--no-sandbox", "--disable-setuid-sandbox"]
  }
}
```

#### High-Performance Scraping
```json
{
  "fallback": {
    "mode": "extension",
    "extensionTimeout": 2000
  },
  "devtools": {
    "maxNetworkRequestEntries": 100,
    "maxConsoleLogEntries": 50
  }
}
```

## 🔗 Additional Resources

### Documentation
- [Configuration Guide](./docs/CONFIGURATION.md)
- [DevTools API Reference](./docs/DEVTOOLS.md)
- [API Examples](./docs/API-EXAMPLES.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

### External Links
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/specification)
- [Puppeteer Documentation](https://pptr.dev/)

### Support
- [GitHub Issues](https://github.com/gowerlin/BrowserMCP/issues)
- [Discord Community](https://discord.gg/browsermcp)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/browsermcp)

## 📝 Version History

### v0.2.0 (Current)
- ✅ Complete DevTools Protocol integration
- ✅ Smart fallback system (Extension ↔ Puppeteer)
- ✅ 13 new DevTools functions with fallback
- ✅ Enhanced configuration management
- ✅ Improved error handling and logging

### v0.1.3
- Initial release with basic browser automation
- Chrome Extension for browser control
- Basic MCP server implementation

---

---

## 🔧 Configuration Conflict Prevention

### Quick Conflict Check

Run this command to check for configuration conflicts:

```bash
# Check port usage
netstat -an | findstr 9002

# Check VS Code config
type "%APPDATA%\Code\User\settings.json" | findstr browserMCP

# Check Claude Desktop config  
type "%APPDATA%\Claude\claude_desktop_config.json" | findstr browsermcp
```

### Resolution Guide

If you find multiple configurations:

1. **Choose Primary Host**: Decide whether to use VS Code or Claude Desktop
2. **Clear Secondary**: Empty the unused configuration
3. **Verify Single Instance**: Ensure only one BrowserMCP server runs
4. **Test Connection**: Verify the extension can connect properly

For detailed conflict resolution, see: [CONFIG-CONFLICT-RESOLUTION.md](./CONFIG-CONFLICT-RESOLUTION.md)

---

*Last updated: 2025-08-05 for Browser MCP v0.2.0 with configuration conflict prevention*
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

#### Option A: From Source (Recommended)

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
```

#### Option B: Using npm (Coming Soon)

```bash
# Will be available after official release
npm install -g @browsermcp/mcp
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

#### VS Code with Continue/Codeium

```json
// .vscode/settings.json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["${workspaceFolder}/BrowserMCP/dist/index.js"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto"
      }
    }
  }
}
```

#### Claude Desktop

```json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
// Linux: ~/.config/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["C:/path/to/BrowserMCP/dist/index.js"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  }
}
```

#### Cursor IDE

```json
// .cursor/mcp.json
{
  "servers": {
    "browsermcp": {
      "command": "mcp-server-browsermcp",
      "args": ["--auto-fallback"],
      "description": "Browser automation with DevTools"
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

### 1. Basic Connection Test

```bash
# Start the server with logging
npm start

# In another terminal, check health
mcp-server-browsermcp --show-config
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

#### Extension Connection Issues
```bash
# Check if port is in use
netstat -an | grep 9002

# Kill process on port (if needed)
# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :9002
kill -9 <PID>
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

*Last updated: 2025-08-05 for Browser MCP v0.2.0*
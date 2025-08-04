# Browser MCP DevTools Installation & Testing Guide

## 📦 Installation Steps

### 1. Install MCP Service

```bash
# Clone the project
git clone https://github.com/gowerlin/BrowserMCP.git
cd BrowserMCP

# Install dependencies
npm install

# Build the project
npm run build

# Test the service
npm test
```

### 2. Install Browser Extension

#### Developer Mode Installation

1. **Open Chrome Extensions Page**
   - Type in address bar: `chrome://extensions/`
   - Or from menu: Menu → More tools → Extensions

2. **Enable Developer Mode**
   - Click the "Developer mode" toggle in the top right

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - Confirm the extension is successfully loaded

4. **Pin the Extension**
   - Click the extensions icon in the browser toolbar
   - Find "Browser MCP DevTools Integration"
   - Click the pin icon to pin it to the toolbar

### 3. Configure MCP Connection

#### VS Code / Cursor Configuration

```json
// .mcp/config.json
{
  "servers": {
    "browsermcp": {
      "path": "node",
      "arguments": ["path/to/BrowserMCP/dist/index.js"]
    }
  }
}
```

#### Claude Desktop Configuration

```json
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
{
  "mcpServers": {
    "browsermcp": {
      "command": "node",
      "args": ["C:/path/to/BrowserMCP/dist/index.js"]
    }
  }
}
```

## 🧪 Testing Steps

### 1. Basic Connection Test

1. **Start MCP Service**
   ```bash
   npm run watch
   ```

2. **Connect Browser**
   - Open any webpage
   - Click the extension icon
   - Click "Connect Current Tab"
   - Confirm status shows "Connected"

### 2. DevTools Feature Testing

#### Network Monitoring Test
```javascript
// Execute in AI tool
await browser_get_network_requests({ filter: "all" });
```

#### Performance Test
```javascript
await browser_get_performance_metrics();
```

#### DOM Inspection Test
```javascript
await browser_inspect_element({ 
  selector: "body",
  includeStyles: true 
});
```

#### JavaScript Execution Test
```javascript
await browser_evaluate_javascript({ 
  code: "document.title" 
});
```

### 3. Automated Testing

Run the complete test suite:
```bash
# Run DevTools tests
node test/devtools.test.js

# Run all tests
npm test
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Extension Cannot Connect
- **Check WebSocket Port**: Ensure port 9002 is not in use
- **Check Firewall**: Allow localhost:9002 connections
- **Reload Extension**: Click reload on the extensions page

#### 2. DevTools Features Not Working
- **Check Permissions**: Ensure extension has debugger permissions
- **Close Other Debuggers**: Only one debugger can connect at a time
- **Reconnect Tab**: Disconnect and reconnect

#### 3. MCP Service Cannot Start
- **Check Node.js Version**: Requires Node.js 16+
- **Rebuild**: `npm run build`
- **Check Paths**: Ensure paths are correct and use forward slashes

### Debug Mode

#### View Extension Logs
1. Find Browser MCP on extensions page
2. Click "Inspect views" → "background page"
3. Open Console to view logs

#### View MCP Service Logs
```bash
# Enable verbose logging
DEBUG=* npm run watch
```

## 📊 Performance Recommendations

### Best Practices

1. **Limit Network Request Collection**
   - Use filter parameter to reduce data volume
   - Clear network logs regularly

2. **Optimize DOM Queries**
   - Use specific selectors
   - Limit maxDepth parameter

3. **Memory Management**
   - Disconnect unused connections regularly
   - Avoid long-running profiling

## 🔗 Related Resources

- [Chrome DevTools Protocol Documentation](https://chromedevtools.github.io/devtools-protocol/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification)
- [Project GitHub](https://github.com/gowerlin/BrowserMCP)
- [Issue Reporting](https://github.com/gowerlin/BrowserMCP/issues)
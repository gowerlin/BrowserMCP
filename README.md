<a href="https://browsermcp.io">
  <img src="./.github/images/banner.png" alt="Browser MCP banner">
</a>

<h3 align="center">Browser MCP</h3>

<p align="center">
  Automate your browser with AI.
  <br />
  <a href="https://browsermcp.io"><strong>Website</strong></a> 
  •
  <a href="https://docs.browsermcp.io"><strong>Docs</strong></a>
  •
  <a href="./README-zh-TW.md"><strong>繁體中文</strong></a>
</p>

## About

Browser MCP is an MCP server + Chrome extension that allows you to automate your browser using AI applications like VS Code, Claude, Cursor, and Windsurf.

## Features

### Core Features
- ⚡ Fast: Automation happens locally on your machine, resulting in better performance without network latency.
- 🔒 Private: Since automation happens locally, your browser activity stays on your device and isn't sent to remote servers.
- 👤 Logged In: Uses your existing browser profile, keeping you logged into all your services.
- 🥷🏼 Stealth: Avoids basic bot detection and CAPTCHAs by using your real browser fingerprint.

### 🆕 DevTools Integration (v0.2.0)
Complete Chrome DevTools Protocol integration for advanced debugging and analysis:

- 🌐 **Network Monitoring** - Track and analyze all network requests, responses, and performance metrics
- ⚡ **Performance Analysis** - Core Web Vitals, profiling, and performance metrics collection
- 🔍 **DOM Inspection** - Examine elements, styles, event listeners, and accessibility properties
- 💻 **JavaScript Execution** - Execute code in page context with coverage analysis
- 💾 **Memory Analysis** - Memory usage statistics and heap snapshot capabilities
- 🔐 **Security Analysis** - Security state inspection and certificate validation
- 🗄️ **Storage Inspection** - Access localStorage, sessionStorage, cookies, and IndexedDB
- 📝 **Console Monitoring** - Capture and analyze console logs and errors

For detailed DevTools documentation:
- 📖 [English Documentation](./docs/DEVTOOLS.md)
- 🇹🇼 [繁體中文文檔](./docs/DEVTOOLS.zh-TW.md)

## Cross-Platform Compatibility Fix

This fork includes critical fixes for Windows Git Bash compatibility issues present in the original BrowserMCP (`@browsermcp/mcp@0.1.3`).

### Problem Solved
- **Original Issue**: Server fails to initialize in Git Bash with error "Server exited before responding to initialize request"
- **Root Cause**: Hardcoded Windows CMD commands incompatible with Git Bash environment
- **Solution**: Intelligent environment detection with adaptive command execution

### Key Improvements
- ✅ Works in Git Bash (MINGW64)
- ✅ Works in WSL
- ✅ Maintains compatibility with CMD and PowerShell
- ✅ Cross-platform support (Windows, macOS, Linux)

For technical details:
- 📖 [English Documentation](./docs/COMPATIBILITY.md)
- 🇹🇼 [繁體中文文檔](./docs/COMPATIBILITY.zh-TW.md)

## Configuration Examples

### Quick Start
```json
// .mcp/config.json in your project
{
  "servers": {
    "browsermcp": {
      "command": "node",
      "args": ["./path/to/BrowserMCP/dist/index.js"],
      "description": "Browser automation with Git Bash fixes"
    }
  }
}
```

### Advanced Configuration
See the `examples/` directory for:
- [`mcp-config.json`](./examples/mcp-config.json) - Basic MCP configuration
- [`vscode-mcp-settings.json`](./examples/vscode-mcp-settings.json) - VS Code global settings
- [`project-mcp-config.json`](./examples/project-mcp-config.json) - Project-specific configuration with options

## Contributing

This repo contains all the core MCP code for Browser MCP, but currently cannot yet be built on its own due to dependencies on utils and types from the monorepo where it's developed.

### For This Fork
Contributions focusing on cross-platform compatibility are especially welcome. Please test your changes across different shell environments before submitting PRs.

## Credits

Browser MCP was adapted from the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) in order to automate the user's browser rather than creating new browser instances. This allows using the user's existing browser profile to use logged-in sessions and avoid bot detection mechanisms that commonly block automated browser use.

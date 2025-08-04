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

### 🆕 Complete DevTools Integration (New in v0.2.0!)
This release introduces complete Chrome DevTools Protocol integration with **intelligent fallback system**:

**Primary Features:**
- 🌐 **Network Monitoring** - Track and analyze all network requests, responses, and performance metrics
- ⚡ **Performance Analysis** - Core Web Vitals, profiling, and performance metrics collection
- 🔍 **DOM Inspection** - Examine elements, styles, event listeners, and accessibility properties
- 💻 **JavaScript Execution** - Execute code in page context with coverage analysis
- 💾 **Memory Analysis** - Memory usage statistics and heap snapshot capabilities
- 🔐 **Security Analysis** - Security state inspection and certificate validation
- 🗄️ **Storage Inspection** - Access localStorage, sessionStorage, cookies, and IndexedDB
- 📝 **Console Monitoring** - Capture and analyze console logs and errors

**🚀 Smart Fallback System (New in v0.2.0!):**
- 🔄 **Automatic Mode Switching** - Seamlessly switch between Chrome Extension and Puppeteer modes
- ⚡ **Extension-First Approach** - Prioritizes fast Chrome Extension when available
- 🛡️ **Puppeteer Backup** - Automatically falls back to Puppeteer when extension is unavailable
- ⚙️ **Configurable Modes** - Manual control: `extension`, `puppeteer`, or `auto` mode
- 📊 **Health Monitoring** - Real-time status of both Extension and Puppeteer systems
- 🔧 **Zero Configuration** - Works out-of-the-box with intelligent defaults
- 🎛️ **Multi-Layer Configuration** - Command line, environment variables, and config files
- 📋 **Runtime Mode Switching** - Change modes during execution without restart

### Documentation

**Core Documentation:**
- 📖 [DevTools Documentation](./docs/DEVTOOLS.md) | [DevTools 文檔](./docs/DEVTOOLS.zh-TW.md)
- ⚙️ [Configuration Guide](./docs/CONFIGURATION.md) | [配置指南](./docs/CONFIGURATION.zh-TW.md)
- 🔧 [Integration Guide](./docs/INTEGRATIONS.md) | [整合指南](./docs/INTEGRATIONS.zh-TW.md)
- 🔄 [Compatibility Guide](./docs/COMPATIBILITY.md) | [相容性指南](./docs/COMPATIBILITY.zh-TW.md)

**Reference Guides:**
- 💡 [API Examples](./docs/API-EXAMPLES.md) | [API 範例](./docs/API-EXAMPLES.zh-TW.md)
- 🔧 [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) | [故障排除指南](./docs/TROUBLESHOOTING.zh-TW.md)

### 🔧 Smart Fallback Tools (v0.2.0)
All DevTools functions now include automatic fallback capabilities:

**Standard Tools (Extension + Puppeteer):**
- `browser_get_network_requests_fallback` - Network monitoring with fallback
- `browser_get_performance_metrics_fallback` - Performance analysis with fallback  
- `browser_inspect_element_fallback` - DOM inspection with fallback
- `browser_evaluate_javascript_fallback` - JavaScript execution with fallback
- `browser_get_memory_usage_fallback` - Memory analysis with fallback
- `browser_get_storage_data_fallback` - Storage inspection with fallback
- `browser_get_console_logs_fallback` - Console monitoring with fallback
- `browser_navigate_fallback` - Navigation with fallback
- `browser_get_page_info_fallback` - Page information with fallback

**Utility Tools:**
- `browser_health_check` - System health monitoring
- `browser_set_mode` - Mode control (`extension` | `puppeteer` | `auto`)

## 🎛️ Configuration Options

### Command Line Usage
```bash
# Use Chrome Extension only
mcp-server-browsermcp --extension-only

# Use Puppeteer only (headless mode)
mcp-server-browsermcp --puppeteer-only --headless

# Smart auto-switching (default)
mcp-server-browsermcp --auto-fallback

# Show current configuration
mcp-server-browsermcp --show-config

# Generate config file template
mcp-server-browsermcp --generate-config > browsermcp.config.json
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

### Configuration File
Create `browsermcp.config.json` in your project root:
```json
{
  "fallback": {
    "mode": "auto",
    "extensionTimeout": 5000,
    "enableLogging": true
  },
  "puppeteer": {
    "headless": false,
    "viewport": { "width": 1280, "height": 720 }
  }
}
```

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

## Installation & Configuration

### Installation Guide
- 📖 [English Installation Guide](./INSTALLATION.md)
- 🇹🇼 [繁體中文安裝指南](./INSTALLATION.zh-TW.md)

### Integration Guides
- 🔧 [Development Environment Integration](./docs/INTEGRATIONS.md) - VS Code, Claude Code CLI, Git Bash, WSL
- 🇹🇼 [開發環境整合指南](./docs/INTEGRATIONS.zh-TW.md) - 繁體中文版本

### Configuration Examples
See the `examples/` directory for complete working examples:

**Configuration Files:**
- [`browsermcp.config.json`](./examples/browsermcp.config.json) - Complete configuration example
- [`auto-fallback.config.json`](./examples/auto-fallback.config.json) - Auto-fallback mode configuration
- [`extension-only.config.json`](./examples/extension-only.config.json) - Chrome Extension only mode
- [`puppeteer-only.config.json`](./examples/puppeteer-only.config.json) - Puppeteer only mode

**Development Environment:**
- [`vscode-settings.json`](./examples/vscode-settings.json) - VS Code MCP server settings
- [`vscode-tasks.json`](./examples/vscode-tasks.json) - VS Code task definitions
- [`vscode-launch.json`](./examples/vscode-launch.json) - VS Code debug configurations
- [`claude-code-config.json`](./examples/claude-code-config.json) - Claude Code CLI configuration
- [`git-bash-setup.sh`](./examples/git-bash-setup.sh) - Automated Git Bash environment setup

## Quality Assurance

### Enhanced Testing Suite
- 🧪 **Comprehensive Tests**: Unit tests, integration tests, fallback system tests, and edge case coverage
- 🔄 **Automated Testing**: Run `npm test` for full test suite
- 📊 **Test Scripts**:
  - `npm run test:unit` - Unit tests only
  - `npm run test:integration` - Integration tests only
  - `npm run test:verbose` - Detailed test output
  - `npm run test:bail` - Stop on first failure
- 🎯 **Fallback Testing**: Smart fallback system validation and Puppeteer environment checks

### Code Quality Features
- 🛡️ **Type Safety**: Comprehensive TypeScript interfaces and error handling
- 🔍 **Error Management**: Standardized error handling with detailed debugging
- 📝 **Documentation**: Extensive API examples and troubleshooting guides
- 🔧 **Developer Tools**: Enhanced debugging and performance monitoring

## Contributing

This repo contains all the core MCP code for Browser MCP, but currently cannot yet be built on its own due to dependencies on utils and types from the monorepo where it's developed.

### For This Fork
Contributions focusing on cross-platform compatibility and code quality are especially welcome. Please:
1. Test your changes across different shell environments
2. Run the test suite: `npm test`
3. Update documentation for new features
4. Follow the established TypeScript patterns

## Credits

Browser MCP was adapted from the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) in order to automate the user's browser rather than creating new browser instances. This allows using the user's existing browser profile to use logged-in sessions and avoid bot detection mechanisms that commonly block automated browser use.

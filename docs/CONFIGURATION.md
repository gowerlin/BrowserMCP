# BrowserMCP Configuration Guide

This guide explains how to configure BrowserMCP's fallback system to control whether to use Chrome Extension only, Puppeteer only, or intelligent auto-switching.

## Configuration Priority

Configuration is loaded in the following priority order (highest to lowest):

1. **Command Line Arguments** - Override everything
2. **Environment Variables** - Override config files and defaults
3. **Configuration Files** - Override defaults
4. **Default Values** - Built-in defaults

## Configuration Methods

### 1. Command Line Arguments

#### Fallback Mode Control
```bash
# Use Chrome Extension only (fail if extension unavailable)
mcp-server-browsermcp --extension-only

# Use Puppeteer only
mcp-server-browsermcp --puppeteer-only

# Intelligent auto-switching (default)
mcp-server-browsermcp --auto-fallback

# Specify mode directly
mcp-server-browsermcp --mode extension
mcp-server-browsermcp --mode puppeteer
mcp-server-browsermcp --mode auto
```

#### Puppeteer Options
```bash
# Run Puppeteer in headless mode
mcp-server-browsermcp --headless

# Run Puppeteer with visible browser (default)
mcp-server-browsermcp --no-headless
```

#### Other Options
```bash
# Enable verbose logging
mcp-server-browsermcp --verbose

# Disable logging
mcp-server-browsermcp --quiet

# Custom WebSocket URL
mcp-server-browsermcp --ws-url ws://localhost:9003

# Use custom config file
mcp-server-browsermcp --config /path/to/config.json
```

#### Configuration Management
```bash
# Show current configuration
mcp-server-browsermcp --show-config

# Generate example config file
mcp-server-browsermcp --generate-config

# Using config subcommand
mcp-server-browsermcp config --show
mcp-server-browsermcp config --generate
mcp-server-browsermcp config --validate
```

### 2. Environment Variables

```bash
# Fallback mode
export BROWSERMCP_FALLBACK_MODE=extension    # or puppeteer, auto
export BROWSERMCP_EXTENSION_TIMEOUT=10000    # milliseconds
export BROWSERMCP_ENABLE_LOGGING=true        # or false

# WebSocket configuration
export WS_URL=ws://localhost:9002            # Legacy variable
export BROWSERMCP_WS_URL=ws://localhost:9002 # New variable
export BROWSERMCP_WS_PORT=9002

# Puppeteer configuration
export BROWSERMCP_PUPPETEER_HEADLESS=true    # or false

# Production mode (enables headless, disables logging)
export NODE_ENV=production
```

### 3. Configuration Files

BrowserMCP looks for configuration files in this order:

1. Path specified with `--config` argument
2. `browsermcp.config.json` in current directory
3. `.browsermcp.json` in current directory
4. `browsermcp.config.json` in BrowserMCP directory

#### Basic Configuration Example

Create `browsermcp.config.json`:

```json
{
  "$schema": "./browsermcp.schema.json",
  "fallback": {
    "mode": "auto",
    "extensionTimeout": 5000,
    "retryAttempts": 2,
    "enableLogging": true
  },
  "websocket": {
    "url": "ws://localhost:9002",
    "port": 9002
  },
  "puppeteer": {
    "headless": false,
    "viewport": {
      "width": 1280,
      "height": 720
    }
  }
}
```

## Configuration Scenarios

### Scenario 1: Chrome Extension Only

For maximum speed when you know the Chrome Extension is always available:

**Command Line:**
```bash
mcp-server-browsermcp --extension-only --verbose
```

**Environment Variable:**
```bash
export BROWSERMCP_FALLBACK_MODE=extension
```

**Config File:**
```json
{
  "fallback": {
    "mode": "extension",
    "extensionTimeout": 10000,
    "retryAttempts": 3
  }
}
```

### Scenario 2: Puppeteer Only

For headless automation or when Chrome Extension is not available:

**Command Line:**
```bash
mcp-server-browsermcp --puppeteer-only --headless
```

**Environment Variable:**
```bash
export BROWSERMCP_FALLBACK_MODE=puppeteer
export BROWSERMCP_PUPPETEER_HEADLESS=true
```

**Config File:**
```json
{
  "fallback": {
    "mode": "puppeteer"
  },
  "puppeteer": {
    "headless": true,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### Scenario 3: Intelligent Auto-Switching (Recommended)

Automatically use Chrome Extension when available, fallback to Puppeteer:

**Command Line:**
```bash
mcp-server-browsermcp --auto-fallback
# or simply
mcp-server-browsermcp
```

**Config File:**
```json
{
  "fallback": {
    "mode": "auto",
    "extensionTimeout": 3000,
    "retryAttempts": 2
  },
  "puppeteer": {
    "headless": false
  }
}
```

## Configuration Schema

The configuration follows a JSON schema for validation. Key configuration sections:

### Fallback Settings
- `mode`: `"extension"` | `"puppeteer"` | `"auto"`
- `extensionTimeout`: Connection timeout in milliseconds (1000-60000)
- `retryAttempts`: Number of retry attempts (0-10)
- `enableLogging`: Enable verbose logging

### WebSocket Settings
- `url`: WebSocket server URL (must start with `ws://`)
- `port`: Port number (1-65535)
- `reconnectAttempts`: Reconnection attempts (0-10)
- `reconnectDelay`: Delay between reconnections in milliseconds

### Puppeteer Settings
- `headless`: Run in headless mode
- `viewport`: Browser viewport size (`width`, `height`)
- `args`: Array of Chrome launch arguments
- `timeout`: Operation timeout in milliseconds

### DevTools Settings
- `enableNetworkMonitoring`: Enable network request monitoring
- `enablePerformanceMonitoring`: Enable performance metrics
- `maxConsoleLogEntries`: Maximum console log entries to keep
- `maxNetworkRequestEntries`: Maximum network request entries to keep

## Tools Available by Mode

### Extension Mode (`mode: "extension"`)
Uses original DevTools tools that require Chrome Extension:
- `browser_get_network_requests`
- `browser_get_performance_metrics`
- `browser_inspect_element`
- etc.

### Puppeteer/Auto Mode (`mode: "puppeteer"` or `mode: "auto"`)
Uses fallback tools with intelligent switching:
- `browser_get_network_requests_fallback`
- `browser_get_performance_metrics_fallback`
- `browser_inspect_element_fallback`
- `browser_health_check` - Monitor system health
- `browser_set_mode` - Runtime mode switching
- etc.

## Runtime Mode Switching

When using auto or puppeteer mode, you can switch modes at runtime:

```javascript
// Switch to extension-only mode
await mcp.callTool("browser_set_mode", { mode: "extension" });

// Switch to puppeteer-only mode
await mcp.callTool("browser_set_mode", { mode: "puppeteer" });

// Switch back to auto mode
await mcp.callTool("browser_set_mode", { mode: "auto" });

// Check system health
const health = await mcp.callTool("browser_health_check", {});
```

## Troubleshooting

### Check Current Configuration
```bash
mcp-server-browsermcp --show-config
```

### Validate Configuration
```bash
mcp-server-browsermcp config --validate
```

### Generate Example Configuration
```bash
mcp-server-browsermcp --generate-config > browsermcp.config.json
```

### Common Issues

1. **Extension not connecting**: Use `--puppeteer-only` or check Chrome Extension installation
2. **Puppeteer fails to launch**: Check browser installation and permissions
3. **Configuration not loading**: Verify JSON syntax and file location
4. **Performance issues**: Try `--headless` mode or reduce timeout values

## Best Practices

1. **Development**: Use `auto` mode for maximum flexibility
2. **Production**: Use `puppeteer` mode with `headless: true` for reliability
3. **CI/CD**: Use environment variables for configuration
4. **Local Testing**: Use config files for consistent settings
5. **Debugging**: Enable verbose logging with `--verbose` or `enableLogging: true`
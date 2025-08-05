# 📁 BrowserMCP Configuration Examples

This folder contains various BrowserMCP configuration examples to help you quickly set up different development environments.

## 📋 File Descriptions

### Core Configuration Files

- **`browsermcp.config.json`** - Main BrowserMCP configuration example
  - Contains complete configuration options
  - Uses JSON Schema validation
  - Copy to project root for use

- **`auto-fallback.config.json`** - Automatic fallback mode configuration
  - Extension first, automatically switches to Puppeteer
  - Suitable for most use cases

- **`extension-only.config.json`** - Chrome Extension only
  - Requires Chrome Extension to be installed first
  - Provides best performance

- **`puppeteer-only.config.json`** - Puppeteer only
  - No Extension required
  - Suitable for automated testing environments

### VS Code Integration

- **`vscode-settings.json`** - VS Code settings example
  - AI Tools integration settings
  - MCP server configuration
  - Copy needed parts to your VS Code settings
  - Uses `${workspaceFolder}` variable for automatic path detection

- **`vscode-launch.json`** - VS Code debug configuration
  - Debug settings for multiple launch modes
  - Supports auto mode, Extension mode, Puppeteer mode
  - Copy to `.vscode/launch.json`

- **`vscode-tasks.json`** - VS Code tasks configuration
  - Tasks for quickly launching BrowserMCP
  - Configuration management and health check tasks
  - Copy to `.vscode/tasks.json`

### Claude Code CLI

- **`claude-code-config.json`** - Claude Code CLI configuration example
  - Includes tool aliases and categories
  - Example prompts
  - Copy to `~/.claude-code/mcp-servers.json`

### Git Bash Integration

- **`git-bash-setup.sh`** - Git Bash automatic setup script
  - Automatically configures environment variables
  - Creates convenient command aliases
  - Fixes Windows path issues

## 🚀 Quick Start

### 1. Basic Setup

```bash
# Copy default configuration to project root
cp examples/browsermcp.config.json ./

# Edit configuration file to suit your needs
nano browsermcp.config.json
```

### 2. VS Code Setup

```bash
# Create VS Code configuration directory
mkdir -p .vscode

# Copy configuration files
cp examples/vscode-launch.json .vscode/launch.json
cp examples/vscode-tasks.json .vscode/tasks.json

# Manually add vscode-settings.json content to your VS Code settings
```

### 3. Git Bash Setup (Windows)

```bash
# Run automatic setup script
bash examples/git-bash-setup.sh

# Restart terminal or run
source ~/.bashrc
```

## 📝 Notes

1. **Path Handling**
   - All examples use generic path notation
   - VS Code uses `${workspaceFolder}` variable
   - Avoid hardcoded absolute paths

2. **Environment Variables**
   - Configuration can be overridden via environment variables
   - Use `BROWSERMCP_` prefix
   - Example: `BROWSERMCP_FALLBACK_MODE=puppeteer`

3. **JSON Schema**
   - Configuration files support JSON Schema validation
   - VS Code will automatically provide code completion
   - Ensure `browsermcp.schema.json` is in the correct location

## 🔧 Custom Configuration

You can modify these examples according to your needs:

1. Adjust timeout and retry counts
2. Change WebSocket port
3. Customize Puppeteer launch parameters
4. Set different browser window sizes
5. Enable or disable specific features

## 💡 Best Practices

- Use version control to track configuration changes
- Create environment-specific configuration files
- Regularly backup important configurations
- Use environment variables for sensitive information
- Follow team configuration standards

---

For more information, see [main documentation](../docs/CONFIGURATION.md)
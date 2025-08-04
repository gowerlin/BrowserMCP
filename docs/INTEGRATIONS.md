# BrowserMCP Integration Guide

Complete setup guide for integrating BrowserMCP with popular development environments including VS Code, GitHub Copilot, Claude Code CLI, Git Bash, and WSL.

## Table of Contents

1. [VS Code Integration](#vs-code-integration)
2. [GitHub Copilot Integration](#github-copilot-integration) 
3. [Claude Code CLI Integration](#claude-code-cli-integration)
4. [Git Bash Setup](#git-bash-setup)
5. [WSL Setup](#wsl-setup)
6. [Troubleshooting](#troubleshooting)

## VS Code Integration

### Prerequisites

- VS Code 1.85.0 or later
- Node.js 18+ installed
- BrowserMCP installed globally or locally

### Step 1: Install MCP Extension

Install the official MCP extension for VS Code:

```bash
code --install-extension modelcontextprotocol.mcp
```

Or install from VS Code Marketplace: [Model Context Protocol](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol.mcp)

### Step 2: Configure MCP Settings

#### Global Settings (User Level)

Create or edit `~/.vscode/settings.json` (Windows: `%APPDATA%\Code\User\settings.json`):

```json
{
  "mcp.servers": {
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  },
  "mcp.clientOptions": {
    "capabilities": {
      "experimental": {
        "supportsMultipleServers": true
      }
    }
  }
}
```

#### Project-Specific Settings

Create `.vscode/settings.json` in your project root:

```json
{
  "mcp.servers": {
    "browsermcp": {
      "command": "node",
      "args": ["./node_modules/@browsermcp/mcp/dist/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_WS_URL": "ws://localhost:9002",
        "BROWSERMCP_PUPPETEER_HEADLESS": "false",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Step 3: Advanced Configuration

#### Extension-Only Mode for Maximum Speed

```json
{
  "mcp.servers": {
    "browsermcp-fast": {
      "command": "npx",
      "args": ["@browsermcp/mcp", "--extension-only", "--verbose"],
      "env": {
        "BROWSERMCP_EXTENSION_TIMEOUT": "10000"
      }
    }
  }
}
```

#### Puppeteer-Only Mode for Headless Automation

```json
{
  "mcp.servers": {
    "browsermcp-headless": {
      "command": "npx",
      "args": ["@browsermcp/mcp", "--puppeteer-only", "--headless"],
      "env": {
        "BROWSERMCP_PUPPETEER_HEADLESS": "true"
      }
    }
  }
}
```

### Step 4: Workspace Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug BrowserMCP",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@browsermcp/mcp/dist/index.js",
      "args": ["--verbose", "--show-config"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Step 5: Tasks Configuration

Create `.vscode/tasks.json` for common operations:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start BrowserMCP",
      "type": "shell",
      "command": "npx",
      "args": ["@browsermcp/mcp", "--auto-fallback", "--verbose"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "BrowserMCP Health Check",
      "type": "shell",
      "command": "npx",
      "args": ["@browsermcp/mcp", "--show-config"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    },
    {
      "label": "Generate BrowserMCP Config",
      "type": "shell",
      "command": "npx",
      "args": ["@browsermcp/mcp", "--generate-config"],
      "group": "build",
      "options": {
        "shell": {
          "executable": "bash",
          "args": ["-c"]
        }
      },
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    }
  ]
}
```

## GitHub Copilot Integration

### Overview

BrowserMCP enhances GitHub Copilot by providing real-time browser automation capabilities during development.

### Step 1: Enable Copilot Extensions

Ensure you have GitHub Copilot Chat enabled in VS Code:

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true
  },
  "github.copilot.chat.enabled": true
}
```

### Step 2: Configure Copilot with BrowserMCP

Add BrowserMCP context to your VS Code settings:

```json
{
  "github.copilot.chat.context": {
    "browsermcp": {
      "description": "Browser automation context",
      "command": "npx @browsermcp/mcp --show-config"
    }
  }
}
```

### Step 3: Copilot Workspace Integration

Create `.github/copilot-workspace.yml`:

```yaml
name: BrowserMCP Development
description: Workspace configured for browser automation development

tools:
  - name: browsermcp
    description: Browser automation with Chrome Extension and Puppeteer fallback
    command: npx @browsermcp/mcp
    env:
      BROWSERMCP_FALLBACK_MODE: auto
      BROWSERMCP_ENABLE_LOGGING: true

tasks:
  - name: setup-browsermcp
    description: Initialize BrowserMCP configuration
    run: |
      npx @browsermcp/mcp --generate-config > browsermcp.config.json
      echo "BrowserMCP configuration generated"

  - name: test-browser-automation
    description: Test browser automation functionality
    run: |
      npx @browsermcp/mcp --show-config
      echo "Testing browser automation..."

workflows:
  - name: browser-testing
    description: Automated browser testing workflow
    steps:
      - setup-browsermcp
      - test-browser-automation
```

### Step 4: Copilot Chat Commands

Use these commands in Copilot Chat for BrowserMCP assistance:

```
@copilot /help browsermcp
@copilot /explain BrowserMCP configuration
@copilot /fix BrowserMCP connection issues
@copilot /generate browser automation test
```

## Claude Code CLI Integration

### Prerequisites

- Claude Code CLI installed
- BrowserMCP configured as MCP server

### Step 1: Install Claude Code CLI

```bash
# Install Claude Code CLI
npm install -g @anthropic/claude-code

# Or using pip
pip install claude-code
```

### Step 2: Configure MCP Server

Create or edit `~/.claude-code/mcp-servers.json`:

```json
{
  "servers": {
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp"],
      "env": {
        "BROWSERMCP_FALLBACK_MODE": "auto",
        "BROWSERMCP_ENABLE_LOGGING": "true"
      }
    }
  }
}
```

### Step 3: Project-Specific Configuration

Create `.claude-code/config.json` in your project:

```json
{
  "mcp": {
    "servers": {
      "browsermcp": {
        "command": "node",
        "args": ["./node_modules/@browsermcp/mcp/dist/index.js", "--auto-fallback"],
        "cwd": ".",
        "env": {
          "BROWSERMCP_FALLBACK_MODE": "auto",
          "BROWSERMCP_WS_URL": "ws://localhost:9002"
        }
      }
    }
  },
  "tools": {
    "preferred": [
      "browser_get_network_requests_fallback",
      "browser_get_performance_metrics_fallback",
      "browser_inspect_element_fallback",
      "browser_health_check"
    ]
  }
}
```

### Step 4: Claude Code with BrowserMCP

Start Claude Code with BrowserMCP:

```bash
# Start with specific configuration
claude-code --mcp-config .claude-code/config.json

# Start with environment variables
BROWSERMCP_FALLBACK_MODE=auto claude-code

# Start with specific mode
claude-code --tool browser_health_check
```

### Step 5: Usage Examples

```bash
# Check browser automation health
claude-code "Check the health of browser automation tools"

# Analyze website performance
claude-code "Navigate to https://example.com and analyze performance metrics"

# Debug network issues
claude-code "Get network requests for the current page and identify any failures"

# Test responsive design
claude-code "Take screenshots at different viewport sizes"
```

## Git Bash Setup

### Prerequisites

- Git for Windows with Git Bash
- Node.js installed in Git Bash environment

### Step 1: Environment Configuration

Add to `~/.bashrc` or `~/.bash_profile`:

```bash
# BrowserMCP Git Bash Configuration
export BROWSERMCP_FALLBACK_MODE=auto
export BROWSERMCP_ENABLE_LOGGING=true
export BROWSERMCP_WS_URL=ws://localhost:9002

# Node.js PATH for Git Bash
export PATH="/c/Program Files/nodejs:$PATH"

# Helper functions
browsermcp_start() {
    echo "Starting BrowserMCP in $1 mode..."
    npx @browsermcp/mcp --mode "$1" --verbose
}

browsermcp_config() {
    npx @browsermcp/mcp --show-config
}

browsermcp_health() {
    npx @browsermcp/mcp config --show
}

# Aliases
alias bmcp='npx @browsermcp/mcp'
alias bmcp-config='npx @browsermcp/mcp --show-config'
alias bmcp-ext='npx @browsermcp/mcp --extension-only'
alias bmcp-pup='npx @browsermcp/mcp --puppeteer-only'
alias bmcp-auto='npx @browsermcp/mcp --auto-fallback'
```

### Step 2: Windows Path Issues

Create `~/.npmrc` to handle Windows paths:

```ini
# Fix Windows path issues in Git Bash
cache=C:\\Users\\%USERNAME%\\AppData\\Roaming\\npm-cache
prefix=C:\\Users\\%USERNAME%\\AppData\\Roaming\\npm
```

### Step 3: Script Wrapper

Create `~/bin/browsermcp.sh`:

```bash
#!/bin/bash
# BrowserMCP Git Bash Wrapper

set -e

# Detect Windows environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows Git Bash environment
    export BROWSERMCP_WINDOWS_MODE=true
    
    # Fix path separators
    if [[ -n "$BROWSERMCP_CONFIG_PATH" ]]; then
        BROWSERMCP_CONFIG_PATH=$(cygpath -w "$BROWSERMCP_CONFIG_PATH")
    fi
fi

# Default configuration
BROWSERMCP_MODE=${BROWSERMCP_FALLBACK_MODE:-auto}
BROWSERMCP_VERBOSE=${BROWSERMCP_ENABLE_LOGGING:-true}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            BROWSERMCP_MODE="$2"
            shift 2
            ;;
        --config-path)
            BROWSERMCP_CONFIG_PATH="$2"
            shift 2
            ;;
        --verbose)
            BROWSERMCP_VERBOSE=true
            shift
            ;;
        --quiet)
            BROWSERMCP_VERBOSE=false
            shift
            ;;
        *)
            OTHER_ARGS="$OTHER_ARGS $1"
            shift
            ;;
    esac
done

# Export environment variables
export BROWSERMCP_FALLBACK_MODE="$BROWSERMCP_MODE"
export BROWSERMCP_ENABLE_LOGGING="$BROWSERMCP_VERBOSE"

# Run BrowserMCP
echo "🚀 Starting BrowserMCP in Git Bash..."
echo "   Mode: $BROWSERMCP_MODE"
echo "   Logging: $BROWSERMCP_VERBOSE"
echo "   Config: ${BROWSERMCP_CONFIG_PATH:-default}"

npx @browsermcp/mcp $OTHER_ARGS
```

Make it executable:

```bash
chmod +x ~/bin/browsermcp.sh
```

### Step 4: PowerShell Integration

Create `browsermcp.ps1` for PowerShell users:

```powershell
# BrowserMCP PowerShell Integration
param(
    [string]$Mode = "auto",
    [string]$ConfigPath = "",
    [switch]$Verbose,
    [switch]$Quiet,
    [switch]$ShowConfig,
    [switch]$GenerateConfig
)

# Set environment variables
$env:BROWSERMCP_FALLBACK_MODE = $Mode
$env:BROWSERMCP_ENABLE_LOGGING = if ($Quiet) { "false" } else { "true" }

if ($ConfigPath -ne "") {
    $env:BROWSERMCP_CONFIG_PATH = $ConfigPath
}

# Handle special commands
if ($ShowConfig) {
    & npx @browsermcp/mcp --show-config
    return
}

if ($GenerateConfig) {
    & npx @browsermcp/mcp --generate-config
    return
}

# Start BrowserMCP
Write-Host "🚀 Starting BrowserMCP in PowerShell..." -ForegroundColor Green
Write-Host "   Mode: $Mode" -ForegroundColor Cyan
Write-Host "   Logging: $($env:BROWSERMCP_ENABLE_LOGGING)" -ForegroundColor Cyan

& npx @browsermcp/mcp --mode $Mode $(if ($Verbose) { "--verbose" })
```

## WSL Setup

### Prerequisites

- WSL2 with Ubuntu/Debian
- Node.js installed in WSL
- Windows host with BrowserMCP

### Step 1: WSL Environment Setup

Install Node.js in WSL:

```bash
# Update package manager
sudo apt update

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Configure WSL Networking

Add to `~/.bashrc`:

```bash
# WSL BrowserMCP Configuration
export BROWSERMCP_FALLBACK_MODE=auto
export BROWSERMCP_ENABLE_LOGGING=true

# WSL networking - use Windows host
export BROWSERMCP_WS_URL=ws://$(ip route show default | awk '/default/ {print $3}'):9002

# Helper to get Windows host IP
get_windows_host() {
    ip route show default | awk '/default/ {print $3}'
}

# WSL-specific aliases
alias bmcp='npx @browsermcp/mcp'
alias bmcp-wsl='BROWSERMCP_WS_URL=ws://$(get_windows_host):9002 npx @browsermcp/mcp'
```

### Step 3: Cross-Platform Configuration

Create `~/.browsermcp/wsl-config.json`:

```json
{
  "fallback": {
    "mode": "puppeteer",
    "enableLogging": true,
    "retryAttempts": 3
  },
  "websocket": {
    "url": "ws://host.docker.internal:9002",
    "reconnectAttempts": 5,
    "reconnectDelay": 3000
  },
  "puppeteer": {
    "headless": true,
    "args": [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding"
    ]
  }
}
```

### Step 4: WSL Service Setup

Create a systemd service for BrowserMCP (WSL2 with systemd):

```bash
# Create service file
sudo tee /etc/systemd/user/browsermcp.service > /dev/null <<EOF
[Unit]
Description=BrowserMCP Service
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=%h
Environment=BROWSERMCP_FALLBACK_MODE=puppeteer
Environment=BROWSERMCP_PUPPETEER_HEADLESS=true
Environment=BROWSERMCP_WS_URL=ws://host.docker.internal:9002
ExecStart=/usr/bin/npx @browsermcp/mcp --config %h/.browsermcp/wsl-config.json
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF

# Enable and start service
systemctl --user daemon-reload
systemctl --user enable browsermcp.service
systemctl --user start browsermcp.service
```

### Step 5: Docker Integration

Create `docker-compose.yml` for containerized setup:

```yaml
version: '3.8'

services:
  browsermcp:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - .:/app
      - ~/.browsermcp:/root/.browsermcp
    environment:
      - BROWSERMCP_FALLBACK_MODE=puppeteer
      - BROWSERMCP_PUPPETEER_HEADLESS=true
      - BROWSERMCP_ENABLE_LOGGING=true
    ports:
      - "9002:9002"
    command: >
      sh -c "
        npm install -g @browsermcp/mcp &&
        npx @browsermcp/mcp --config /root/.browsermcp/wsl-config.json
      "
    networks:
      - browsermcp-network

networks:
  browsermcp-network:
    driver: bridge
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts

```bash
# Check what's using port 9002
netstat -tulpn | grep 9002

# Kill process using port
kill -9 $(lsof -t -i:9002)

# Use different port
export BROWSERMCP_WS_PORT=9003
```

#### 2. Node.js Path Issues

```bash
# Check Node.js installation
which node
which npm

# Fix PATH in Git Bash
echo 'export PATH="/c/Program Files/nodejs:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 3. Permission Issues (WSL)

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### 4. Chrome/Chromium Issues in WSL

```bash
# Install Chrome dependencies in WSL
sudo apt-get install -y \
  chromium-browser \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils

# Set Chrome path for Puppeteer
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Diagnostic Commands

```bash
# Check BrowserMCP configuration
npx @browsermcp/mcp --show-config

# Validate configuration
npx @browsermcp/mcp config --validate

# Test network connectivity
curl -v ws://localhost:9002

# Check system health
npx @browsermcp/mcp config --show
```

### Performance Optimization

#### For Development
```json
{
  "fallback": {
    "mode": "extension",
    "extensionTimeout": 3000
  }
}
```

#### For CI/CD
```json
{
  "fallback": {
    "mode": "puppeteer"
  },
  "puppeteer": {
    "headless": true,
    "args": ["--no-sandbox", "--disable-dev-shm-usage"]
  }
}
```

#### For Production
```json
{
  "fallback": {
    "mode": "puppeteer",
    "enableLogging": false
  },
  "puppeteer": {
    "headless": true,
    "timeout": 60000
  }
}
```
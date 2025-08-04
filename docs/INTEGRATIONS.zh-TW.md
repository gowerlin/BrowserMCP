# BrowserMCP 整合指南

完整的設定指南，用於將 BrowserMCP 與熱門開發環境整合，包括 VS Code、GitHub Copilot、Claude Code CLI、Git Bash 和 WSL。

## 目錄

1. [VS Code 整合](#vs-code-整合)
2. [GitHub Copilot 整合](#github-copilot-整合) 
3. [Claude Code CLI 整合](#claude-code-cli-整合)
4. [Git Bash 設定](#git-bash-設定)
5. [WSL 設定](#wsl-設定)
6. [故障排除](#故障排除)

## VS Code 整合

### 前置需求

- VS Code 1.85.0 或更新版本
- 已安裝 Node.js 18+
- 已安裝 BrowserMCP（全域或本地）

### 步驟 1：安裝 MCP 擴充功能

安裝 VS Code 官方 MCP 擴充功能：

```bash
code --install-extension modelcontextprotocol.mcp
```

或從 VS Code 市場安裝：[Model Context Protocol](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol.mcp)

### 步驟 2：配置 MCP 設定

#### 全域設定（使用者層級）

建立或編輯 `~/.vscode/settings.json`（Windows：`%APPDATA%\Code\User\settings.json`）：

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

#### 專案特定設定

在專案根目錄建立 `.vscode/settings.json`：

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

### 步驟 3：進階配置

#### 僅 Extension 模式以獲得最大速度

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

#### 僅 Puppeteer 模式用於無頭自動化

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

### 步驟 4：工作區配置

建立 `.vscode/launch.json` 用於除錯：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "除錯 BrowserMCP",
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

### 步驟 5：任務配置

建立 `.vscode/tasks.json` 用於常見操作：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "啟動 BrowserMCP",
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
      "label": "BrowserMCP 健康檢查",
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
      "label": "產生 BrowserMCP 配置",
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

## GitHub Copilot 整合

### 概述

BrowserMCP 透過在開發過程中提供即時瀏覽器自動化功能來增強 GitHub Copilot。

### 步驟 1：啟用 Copilot 擴充功能

確保在 VS Code 中啟用了 GitHub Copilot Chat：

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

### 步驟 2：配置 Copilot 與 BrowserMCP

將 BrowserMCP 上下文添加到 VS Code 設定：

```json
{
  "github.copilot.chat.context": {
    "browsermcp": {
      "description": "瀏覽器自動化上下文",
      "command": "npx @browsermcp/mcp --show-config"
    }
  }
}
```

### 步驟 3：Copilot 工作區整合

建立 `.github/copilot-workspace.yml`：

```yaml
name: BrowserMCP 開發
description: 為瀏覽器自動化開發配置的工作區

tools:
  - name: browsermcp
    description: 瀏覽器自動化，具備 Chrome Extension 和 Puppeteer 備援
    command: npx @browsermcp/mcp
    env:
      BROWSERMCP_FALLBACK_MODE: auto
      BROWSERMCP_ENABLE_LOGGING: true

tasks:
  - name: setup-browsermcp
    description: 初始化 BrowserMCP 配置
    run: |
      npx @browsermcp/mcp --generate-config > browsermcp.config.json
      echo "BrowserMCP 配置已產生"

  - name: test-browser-automation
    description: 測試瀏覽器自動化功能
    run: |
      npx @browsermcp/mcp --show-config
      echo "測試瀏覽器自動化..."

workflows:
  - name: browser-testing
    description: 自動化瀏覽器測試工作流程
    steps:
      - setup-browsermcp
      - test-browser-automation
```

### 步驟 4：Copilot Chat 命令

在 Copilot Chat 中使用這些命令來獲取 BrowserMCP 協助：

```
@copilot /help browsermcp
@copilot /explain BrowserMCP 配置
@copilot /fix BrowserMCP 連接問題
@copilot /generate 瀏覽器自動化測試
```

## Claude Code CLI 整合

### 前置需求

- 已安裝 Claude Code CLI
- BrowserMCP 配置為 MCP 伺服器

### 步驟 1：安裝 Claude Code CLI

```bash
# 安裝 Claude Code CLI
npm install -g @anthropic/claude-code

# 或使用 pip
pip install claude-code
```

### 步驟 2：配置 MCP 伺服器

建立或編輯 `~/.claude-code/mcp-servers.json`：

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

### 步驟 3：專案特定配置

在專案中建立 `.claude-code/config.json`：

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

### 步驟 4：使用 Claude Code 與 BrowserMCP

使用 BrowserMCP 啟動 Claude Code：

```bash
# 使用特定配置啟動
claude-code --mcp-config .claude-code/config.json

# 使用環境變數啟動
BROWSERMCP_FALLBACK_MODE=auto claude-code

# 使用特定工具啟動
claude-code --tool browser_health_check
```

### 步驟 5：使用範例

```bash
# 檢查瀏覽器自動化健康狀態
claude-code "檢查瀏覽器自動化工具的健康狀態"

# 分析網站效能
claude-code "導航到 https://example.com 並分析效能指標"

# 除錯網路問題
claude-code "取得當前頁面的網路請求並識別任何失敗"

# 測試響應式設計
claude-code "在不同視窗大小下截圖"
```

## Git Bash 設定

### 前置需求

- Git for Windows 含 Git Bash
- 在 Git Bash 環境中安裝 Node.js

### 步驟 1：環境配置

將以下內容添加到 `~/.bashrc` 或 `~/.bash_profile`：

```bash
# BrowserMCP Git Bash 配置
export BROWSERMCP_FALLBACK_MODE=auto
export BROWSERMCP_ENABLE_LOGGING=true
export BROWSERMCP_WS_URL=ws://localhost:9002

# Git Bash 的 Node.js PATH
export PATH="/c/Program Files/nodejs:$PATH"

# 輔助函數
browsermcp_start() {
    echo "在 $1 模式下啟動 BrowserMCP..."
    npx @browsermcp/mcp --mode "$1" --verbose
}

browsermcp_config() {
    npx @browsermcp/mcp --show-config
}

browsermcp_health() {
    npx @browsermcp/mcp config --show
}

# 別名
alias bmcp='npx @browsermcp/mcp'
alias bmcp-config='npx @browsermcp/mcp --show-config'
alias bmcp-ext='npx @browsermcp/mcp --extension-only'
alias bmcp-pup='npx @browsermcp/mcp --puppeteer-only'
alias bmcp-auto='npx @browsermcp/mcp --auto-fallback'
```

### 步驟 2：Windows 路徑問題

建立 `~/.npmrc` 來處理 Windows 路徑：

```ini
# 修復 Git Bash 中的 Windows 路徑問題
cache=C:\\Users\\%USERNAME%\\AppData\\Roaming\\npm-cache
prefix=C:\\Users\\%USERNAME%\\AppData\\Roaming\\npm
```

### 步驟 3：腳本包裝器

建立 `~/bin/browsermcp.sh`：

```bash
#!/bin/bash
# BrowserMCP Git Bash 包裝器

set -e

# 偵測 Windows 環境
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows Git Bash 環境
    export BROWSERMCP_WINDOWS_MODE=true
    
    # 修復路徑分隔符
    if [[ -n "$BROWSERMCP_CONFIG_PATH" ]]; then
        BROWSERMCP_CONFIG_PATH=$(cygpath -w "$BROWSERMCP_CONFIG_PATH")
    fi
fi

# 預設配置
BROWSERMCP_MODE=${BROWSERMCP_FALLBACK_MODE:-auto}
BROWSERMCP_VERBOSE=${BROWSERMCP_ENABLE_LOGGING:-true}

# 解析參數
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

# 匯出環境變數
export BROWSERMCP_FALLBACK_MODE="$BROWSERMCP_MODE"
export BROWSERMCP_ENABLE_LOGGING="$BROWSERMCP_VERBOSE"

# 執行 BrowserMCP
echo "🚀 在 Git Bash 中啟動 BrowserMCP..."
echo "   模式: $BROWSERMCP_MODE"
echo "   記錄: $BROWSERMCP_VERBOSE"
echo "   配置: ${BROWSERMCP_CONFIG_PATH:-預設}"

npx @browsermcp/mcp $OTHER_ARGS
```

設定為可執行：

```bash
chmod +x ~/bin/browsermcp.sh
```

### 步驟 4：PowerShell 整合

為 PowerShell 使用者建立 `browsermcp.ps1`：

```powershell
# BrowserMCP PowerShell 整合
param(
    [string]$Mode = "auto",
    [string]$ConfigPath = "",
    [switch]$Verbose,
    [switch]$Quiet,
    [switch]$ShowConfig,
    [switch]$GenerateConfig
)

# 設定環境變數
$env:BROWSERMCP_FALLBACK_MODE = $Mode
$env:BROWSERMCP_ENABLE_LOGGING = if ($Quiet) { "false" } else { "true" }

if ($ConfigPath -ne "") {
    $env:BROWSERMCP_CONFIG_PATH = $ConfigPath
}

# 處理特殊命令
if ($ShowConfig) {
    & npx @browsermcp/mcp --show-config
    return
}

if ($GenerateConfig) {
    & npx @browsermcp/mcp --generate-config
    return
}

# 啟動 BrowserMCP
Write-Host "🚀 在 PowerShell 中啟動 BrowserMCP..." -ForegroundColor Green
Write-Host "   模式: $Mode" -ForegroundColor Cyan
Write-Host "   記錄: $($env:BROWSERMCP_ENABLE_LOGGING)" -ForegroundColor Cyan

& npx @browsermcp/mcp --mode $Mode $(if ($Verbose) { "--verbose" })
```

## WSL 設定

### 前置需求

- WSL2 含 Ubuntu/Debian
- 在 WSL 中安裝 Node.js
- 具有 BrowserMCP 的 Windows 主機

### 步驟 1：WSL 環境設定

在 WSL 中安裝 Node.js：

```bash
# 更新套件管理器
sudo apt update

# 透過 NodeSource 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 驗證安裝
node --version
npm --version
```

### 步驟 2：配置 WSL 網路

將以下內容添加到 `~/.bashrc`：

```bash
# WSL BrowserMCP 配置
export BROWSERMCP_FALLBACK_MODE=auto
export BROWSERMCP_ENABLE_LOGGING=true

# WSL 網路 - 使用 Windows 主機
export BROWSERMCP_WS_URL=ws://$(ip route show default | awk '/default/ {print $3}'):9002

# 取得 Windows 主機 IP 的輔助函數
get_windows_host() {
    ip route show default | awk '/default/ {print $3}'
}

# WSL 特定別名
alias bmcp='npx @browsermcp/mcp'
alias bmcp-wsl='BROWSERMCP_WS_URL=ws://$(get_windows_host):9002 npx @browsermcp/mcp'
```

### 步驟 3：跨平台配置

建立 `~/.browsermcp/wsl-config.json`：

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

### 步驟 4：WSL 服務設定

為 BrowserMCP 建立 systemd 服務（WSL2 含 systemd）：

```bash
# 建立服務檔案
sudo tee /etc/systemd/user/browsermcp.service > /dev/null <<EOF
[Unit]
Description=BrowserMCP 服務
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

# 啟用並啟動服務
systemctl --user daemon-reload
systemctl --user enable browsermcp.service
systemctl --user start browsermcp.service
```

### 步驟 5：Docker 整合

建立 `docker-compose.yml` 用於容器化設定：

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

## 故障排除

### 常見問題

#### 1. 埠號衝突

```bash
# 檢查什麼正在使用埠號 9002
netstat -tulpn | grep 9002

# 終止使用埠號的程序
kill -9 $(lsof -t -i:9002)

# 使用不同埠號
export BROWSERMCP_WS_PORT=9003
```

#### 2. Node.js 路徑問題

```bash
# 檢查 Node.js 安裝
which node
which npm

# 在 Git Bash 中修復 PATH
echo 'export PATH="/c/Program Files/nodejs:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 3. 權限問題（WSL）

```bash
# 修復 npm 權限
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### 4. WSL 中的 Chrome/Chromium 問題

```bash
# 在 WSL 中安裝 Chrome 相依性
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

# 為 Puppeteer 設定 Chrome 路徑
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 診斷命令

```bash
# 檢查 BrowserMCP 配置
npx @browsermcp/mcp --show-config

# 驗證配置
npx @browsermcp/mcp config --validate

# 測試網路連接
curl -v ws://localhost:9002

# 檢查系統健康狀態
npx @browsermcp/mcp config --show
```

### 效能優化

#### 用於開發
```json
{
  "fallback": {
    "mode": "extension",
    "extensionTimeout": 3000
  }
}
```

#### 用於 CI/CD
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

#### 用於生產
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
#!/bin/bash
# BrowserMCP Git Bash 設定腳本
# 執行這個腳本來自動設定 Git Bash 環境

echo "🚀 BrowserMCP Git Bash 設定腳本"
echo "================================="

# 檢查 Node.js 是否已安裝
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝。請先安裝 Node.js。"
    echo "   下載連結: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 建立 .bashrc 配置
BASHRC_CONFIG="
# ===============================
# BrowserMCP Git Bash 配置
# ===============================

# 環境變數
export BROWSERMCP_FALLBACK_MODE=auto
export BROWSERMCP_ENABLE_LOGGING=true
export BROWSERMCP_WS_URL=ws://localhost:9002

# 確保 Node.js 在 PATH 中
export PATH=\"/c/Program Files/nodejs:\$PATH\"

# BrowserMCP 輔助函數
browsermcp_start() {
    local mode=\${1:-auto}
    echo \"🚀 在 \$mode 模式下啟動 BrowserMCP...\"
    npx @browsermcp/mcp --mode \"\$mode\" --verbose
}

browsermcp_config() {
    echo \"📋 顯示 BrowserMCP 配置:\"
    npx @browsermcp/mcp --show-config
}

browsermcp_health() {
    echo \"🔍 檢查 BrowserMCP 健康狀態:\"
    npx @browsermcp/mcp config --show
}

browsermcp_generate_config() {
    echo \"📝 產生 BrowserMCP 配置檔案:\"
    npx @browsermcp/mcp --generate-config > browsermcp.config.json
    echo \"✅ 配置檔案已建立: browsermcp.config.json\"
}

# BrowserMCP 別名
alias bmcp='npx @browsermcp/mcp'
alias bmcp-config='browsermcp_config'
alias bmcp-health='browsermcp_health'
alias bmcp-ext='npx @browsermcp/mcp --extension-only --verbose'
alias bmcp-pup='npx @browsermcp/mcp --puppeteer-only --verbose'
alias bmcp-auto='npx @browsermcp/mcp --auto-fallback --verbose'
alias bmcp-gen='browsermcp_generate_config'

# 顯示 BrowserMCP 幫助
browsermcp_help() {
    echo \"🔧 BrowserMCP Git Bash 指令:\"
    echo \"  bmcp                  - 啟動 BrowserMCP\"
    echo \"  bmcp-config          - 顯示配置\"
    echo \"  bmcp-health          - 健康檢查\"
    echo \"  bmcp-ext             - 僅 Extension 模式\"
    echo \"  bmcp-pup             - 僅 Puppeteer 模式\"
    echo \"  bmcp-auto            - 自動備援模式\"
    echo \"  bmcp-gen             - 產生配置檔案\"
    echo \"  browsermcp_start <mode> - 指定模式啟動\"
    echo \"\"
    echo \"💡 範例:\"
    echo \"  bmcp-config          # 顯示當前配置\"
    echo \"  bmcp-ext             # 使用 Extension 模式\"
    echo \"  browsermcp_start puppeteer  # 使用 Puppeteer 模式\"
}

alias bmcp-help='browsermcp_help'

echo \"🎉 BrowserMCP 已配置完成！使用 'bmcp-help' 查看可用指令。\"
"

# 檢查是否已經有 BrowserMCP 配置
if grep -q "BrowserMCP Git Bash 配置" ~/.bashrc 2>/dev/null; then
    echo "⚠️  發現現有的 BrowserMCP 配置"
    read -p "是否要覆蓋現有配置? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 取消設定"
        exit 1
    fi
    
    # 移除舊配置
    sed -i '/# BrowserMCP Git Bash 配置/,/echo.*BrowserMCP.*已配置完成/d' ~/.bashrc
fi

# 添加配置到 .bashrc
echo "$BASHRC_CONFIG" >> ~/.bashrc

echo "✅ 配置已添加到 ~/.bashrc"

# 建立 bin 目錄和包裝腳本
mkdir -p ~/bin

cat > ~/bin/browsermcp.sh << 'EOF'
#!/bin/bash
# BrowserMCP Git Bash 包裝器

set -e

# 偵測 Windows 環境
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    export BROWSERMCP_WINDOWS_MODE=true
    
    # 修復路徑分隔符
    if [[ -n "$BROWSERMCP_CONFIG_PATH" ]]; then
        BROWSERMCP_CONFIG_PATH=$(cygpath -w "$BROWSERMCP_CONFIG_PATH")
    fi
fi

# 預設配置
BROWSERMCP_MODE=${BROWSERMCP_FALLBACK_MODE:-auto}
BROWSERMCP_VERBOSE=${BROWSERMCP_ENABLE_LOGGING:-true}
OTHER_ARGS=""

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
EOF

chmod +x ~/bin/browsermcp.sh

echo "✅ 包裝腳本已建立: ~/bin/browsermcp.sh"

# 建立 .npmrc 修復 Windows 路徑問題
cat > ~/.npmrc << EOF
# 修復 Git Bash 中的 Windows 路徑問題
cache=C:\\\\Users\\\\%USERNAME%\\\\AppData\\\\Roaming\\\\npm-cache
prefix=C:\\\\Users\\\\%USERNAME%\\\\AppData\\\\Roaming\\\\npm
EOF

echo "✅ npm 配置已建立: ~/.npmrc"

# 檢查 BrowserMCP 是否已安裝
if npm list -g @browsermcp/mcp &> /dev/null; then
    echo "✅ BrowserMCP 已全域安裝"
else
    echo "⚠️  BrowserMCP 未全域安裝"
    read -p "是否要現在安裝 BrowserMCP? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "📦 安裝 BrowserMCP..."
        npm install -g @browsermcp/mcp
        echo "✅ BrowserMCP 安裝完成"
    fi
fi

echo ""
echo "🎉 BrowserMCP Git Bash 設定完成！"
echo ""
echo "📋 接下來的步驟:"
echo "1. 重新啟動 Git Bash 或執行: source ~/.bashrc"
echo "2. 執行 'bmcp-help' 查看可用指令"
echo "3. 執行 'bmcp-config' 檢查配置"
echo "4. 執行 'bmcp-health' 檢查系統狀態"
echo ""
echo "💡 快速開始:"
echo "   bmcp-auto    # 啟動自動備援模式"
echo "   bmcp-config  # 檢查配置"
echo ""
# BrowserMCP Test Server Launcher
Write-Host "Starting test server for BrowserMCP Chrome Extension..." -ForegroundColor Green
Write-Host ""
Write-Host "Test pages will be available at:" -ForegroundColor Yellow
Write-Host "  - http://localhost:8080/test-simple.html (簡易測試)" -ForegroundColor Cyan
Write-Host "  - http://localhost:8080/test-extension.html (完整測試)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current directory: $PSScriptRoot" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Try Python first
try {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        Write-Host "Starting server with Python..." -ForegroundColor Green
        python -m http.server 8080
    } else {
        throw "Python not found"
    }
} catch {
    # Try Python3
    try {
        $python3Cmd = Get-Command python3 -ErrorAction SilentlyContinue
        if ($python3Cmd) {
            Write-Host "Starting server with Python3..." -ForegroundColor Green
            python3 -m http.server 8080
        } else {
            throw "Python3 not found"
        }
    } catch {
        # Try Node.js
        try {
            $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
            if ($nodeCmd) {
                Write-Host "Starting server with Node.js..." -ForegroundColor Green
                npx http-server -p 8080
            } else {
                throw "Node.js not found"
            }
        } catch {
            Write-Host "Neither Python nor Node.js is installed." -ForegroundColor Red
            Write-Host ""
            Write-Host "Please install one of the following:" -ForegroundColor Yellow
            Write-Host "  - Python from https://www.python.org/" -ForegroundColor Cyan
            Write-Host "  - Node.js from https://nodejs.org/" -ForegroundColor Cyan
            Read-Host "Press Enter to exit"
        }
    }
}
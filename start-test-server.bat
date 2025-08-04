@echo off
echo Starting test server for BrowserMCP Chrome Extension...
echo.
echo Test pages will be available at:
echo   - http://localhost:8080/test-simple.html (簡易測試)
echo   - http://localhost:8080/test-extension.html (完整測試)
echo.
echo Current directory: %CD%
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 8080 2>nul || python3 -m http.server 8080 2>nul || (
    echo Python is not installed or not in PATH.
    echo Trying Node.js...
    npx http-server -p 8080 2>nul || (
        echo Neither Python nor Node.js http-server is available.
        echo.
        echo Please install Python from https://www.python.org/
        echo Or install Node.js from https://nodejs.org/
        pause
    )
)
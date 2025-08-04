@echo off
echo Starting test server for BrowserMCP Chrome Extension...
echo.
echo Test page will be available at: http://localhost:8080/test-extension.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8080 2>nul || python3 -m http.server 8080 2>nul || (
    echo Python is not installed or not in PATH.
    echo Please install Python or use Node.js:
    echo   npx http-server -p 8080
    pause
)
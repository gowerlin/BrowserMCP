#!/bin/bash

echo "Starting test server for BrowserMCP Chrome Extension..."
echo ""
echo "Test page will be available at: http://localhost:8080/test-extension.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then Node.js
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080 2>/dev/null || python -m SimpleHTTPServer 8080
elif command -v node &> /dev/null; then
    npx http-server -p 8080
else
    echo "Neither Python nor Node.js is installed."
    echo "Please install one of them to run the test server."
    exit 1
fi
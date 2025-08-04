@echo off
echo Creating GitHub Release v0.2.0...
"C:\Program Files\GitHub CLI\gh.exe" release create v0.2.0 --title "🚀 Browser MCP v0.2.0 - Complete DevTools Integration" --notes-file release-notes.md --latest --target release
echo Release created successfully!
pause
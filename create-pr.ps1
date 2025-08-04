# PowerShell script to create Pull Request
Write-Host "Creating Pull Request for DevTools Integration..." -ForegroundColor Green

$prBody = @"
## 📋 概述

實作完整的 Chrome DevTools Protocol 整合，提供進階的網頁偵錯與分析能力。

## ✨ 新功能

### MCP 服務端
- 🔧 13 個新的 DevTools 工具函數
- 📝 完整的類型定義和 schema 驗證
- 🔌 WebSocket 訊息處理整合

### 瀏覽器擴充功能
- 🎯 Chrome DevTools Protocol (CDP) 處理器
- 🌉 WebSocket 訊息橋接器
- 🎨 使用者友善的 popup 介面
- ⚙️ 背景服務 worker

### 支援的功能
- 🌐 **Network 監控** - 請求/回應追蹤、過濾、分析
- ⚡ **Performance 分析** - Core Web Vitals、效能指標、profiling
- 🔍 **DOM 檢查** - 元素屬性、樣式、事件監聽器
- 💻 **JavaScript 執行** - 程式碼執行、覆蓋率分析
- 💾 **Memory 分析** - 記憶體使用、heap 快照
- 🔐 **Security 檢查** - 安全狀態、憑證資訊
- 🗄️ **Storage 檢查** - localStorage、cookies、IndexedDB
- 📝 **Console 監控** - 日誌收集與分析

## 📁 變更摘要

- 新增 DevTools 工具實作 (src/tools/devtools.ts)
- 建立瀏覽器擴充功能 (browser-extension/)
- 撰寫完整測試套件 (test/devtools.test.js)
- 更新文件 (docs/DEVTOOLS.md, INSTALLATION.md)
- 版本升級至 v0.2.0

## 🧪 測試狀態

- [x] 單元測試已撰寫
- [x] 編譯成功無錯誤
- [ ] 瀏覽器擴充功能測試
- [ ] 整合測試完成
"@

& "C:\Program Files\GitHub CLI\gh.exe" pr create `
  --title "feat: 完整 DevTools 功能支援" `
  --body $prBody `
  --base main `
  --head feature/devtools-integration

Write-Host "`nPull Request created successfully!" -ForegroundColor Green
Write-Host "You can view it at: https://github.com/gowerlin/BrowserMCP/pulls" -ForegroundColor Cyan
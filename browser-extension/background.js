/**
 * Background Service Worker
 * 管理擴充功能的主要邏輯和 DevTools 整合
 */

import('./devtools/devtools-handler.js').then(module => {
  const DevToolsHandler = module.default || module;
  
  import('./devtools/message-bridge.js').then(bridgeModule => {
    const MessageBridge = bridgeModule.default || bridgeModule;
    
    // 全域變數
    let devToolsHandler = null;
    let messageBridge = null;
    let currentTabId = null;
    
    // WebSocket 設定
    const WS_URL = 'ws://localhost:9002';
    
    /**
     * 初始化擴充功能
     */
    async function initialize() {
      console.log('Initializing Browser MCP DevTools Extension...');
      
      // 監聽來自 popup 的連接請求
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
      
      // 監聽標籤頁更新
      chrome.tabs.onUpdated.addListener(handleTabUpdate);
      
      // 監聽標籤頁關閉
      chrome.tabs.onRemoved.addListener(handleTabRemoved);
    }
    
    /**
     * 處理運行時訊息
     */
    async function handleRuntimeMessage(request, sender, sendResponse) {
      const { action, data } = request;
      
      switch (action) {
        case 'connect':
          await connectToTab(data.tabId);
          sendResponse({ success: true });
          break;
          
        case 'disconnect':
          await disconnectFromTab();
          sendResponse({ success: true });
          break;
          
        case 'getStatus':
          sendResponse({
            connected: !!currentTabId,
            tabId: currentTabId
          });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
      
      return true; // 保持訊息通道開啟
    }
    
    /**
     * 連接到指定標籤頁
     */
    async function connectToTab(tabId) {
      try {
        // 如果已連接，先斷開
        if (currentTabId) {
          await disconnectFromTab();
        }
        
        // 建立 DevTools 處理器
        devToolsHandler = new DevToolsHandler();
        const initResult = await devToolsHandler.initialize(tabId);
        
        if (!initResult.success) {
          throw new Error(initResult.error);
        }
        
        // 建立訊息橋接器
        messageBridge = new MessageBridge(devToolsHandler);
        await messageBridge.connect(WS_URL);
        
        currentTabId = tabId;
        
        // 更新擴充功能圖標
        updateExtensionIcon(true);
        
        console.log(`Connected to tab ${tabId}`);
      } catch (error) {
        console.error('Failed to connect to tab:', error);
        throw error;
      }
    }
    
    /**
     * 斷開連接
     */
    async function disconnectFromTab() {
      if (devToolsHandler) {
        await devToolsHandler.disconnect();
        devToolsHandler = null;
      }
      
      if (messageBridge) {
        messageBridge.disconnect();
        messageBridge = null;
      }
      
      currentTabId = null;
      updateExtensionIcon(false);
      
      console.log('Disconnected from tab');
    }
    
    /**
     * 處理標籤頁更新
     */
    function handleTabUpdate(tabId, changeInfo, tab) {
      // 如果當前連接的標籤頁導航到新頁面，重新初始化
      if (tabId === currentTabId && changeInfo.status === 'loading') {
        console.log('Tab navigated, reinitializing DevTools...');
        connectToTab(tabId);
      }
    }
    
    /**
     * 處理標籤頁關閉
     */
    function handleTabRemoved(tabId) {
      if (tabId === currentTabId) {
        console.log('Connected tab closed, disconnecting...');
        disconnectFromTab();
      }
    }
    
    /**
     * 更新擴充功能圖標
     */
    function updateExtensionIcon(connected) {
      const iconPath = connected ? 'icons/icon-active' : 'icons/icon';
      
      chrome.action.setIcon({
        path: {
          16: `${iconPath}-16.png`,
          32: `${iconPath}-32.png`,
          48: `${iconPath}-48.png`,
          128: `${iconPath}-128.png`
        }
      });
      
      chrome.action.setBadgeText({
        text: connected ? 'ON' : ''
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50'
      });
    }
    
    /**
     * 處理擴充功能安裝或更新
     */
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Extension installed/updated:', details);
      
      // 設置初始狀態
      chrome.storage.local.set({
        devToolsEnabled: true,
        autoConnect: false
      });
    });
    
    /**
     * 處理擴充功能啟動
     */
    chrome.runtime.onStartup.addListener(() => {
      console.log('Extension started');
      initialize();
    });
    
    // 初始化擴充功能
    initialize();
  });
});
/**
 * Popup Script
 * 處理擴充功能 popup 的使用者介面邏輯
 */

// i18n 初始化
function initializeI18n() {
  // 取得所有有 data-i18n 屬性的元素
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.textContent = message;
    }
  });
  
  // 設定 HTML title
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const messageKey = titleElement.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      document.title = message;
    }
  }
}

// DOM 元素
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const tabInfo = document.getElementById('tabInfo');
const tabTitle = document.getElementById('tabTitle');
const tabUrl = document.getElementById('tabUrl');
const connectBtn = document.getElementById('connectBtn');
const loading = document.getElementById('loading');
const settingsLink = document.getElementById('settingsLink');

// 功能指示器
const features = {
  network: document.getElementById('feature-network'),
  performance: document.getElementById('feature-performance'),
  dom: document.getElementById('feature-dom'),
  javascript: document.getElementById('feature-javascript'),
  memory: document.getElementById('feature-memory'),
  security: document.getElementById('feature-security'),
  storage: document.getElementById('feature-storage'),
  console: document.getElementById('feature-console')
};

// 狀態
let isConnected = false;
let currentTab = null;

/**
 * 初始化 popup
 */
async function initialize() {
  // 初始化 i18n
  initializeI18n();
  // 獲取當前標籤頁
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // 獲取連接狀態
  const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
  
  if (response.connected && response.tabId === tab.id) {
    setConnectedState(tab);
  } else {
    setDisconnectedState();
  }

  // 設置事件監聽器
  connectBtn.addEventListener('click', handleConnectClick);
  settingsLink.addEventListener('click', handleSettingsClick);
}

/**
 * 處理連接按鈕點擊
 */
async function handleConnectClick() {
  if (isConnected) {
    await disconnect();
  } else {
    await connect();
  }
}

/**
 * 連接到當前標籤頁
 */
async function connect() {
  if (!currentTab) return;

  // 顯示載入狀態
  showLoading(true);
  connectBtn.disabled = true;

  try {
    // 發送連接請求到 background script
    const response = await chrome.runtime.sendMessage({
      action: 'connect',
      tabId: currentTab.id
    });

    if (response.success) {
      setConnectedState(currentTab);
    } else {
      throw new Error(response.error || 'Connection failed');
    }
  } catch (error) {
    console.error('Failed to connect:', error);
    showError(chrome.i18n.getMessage('errorConnectionFailed', [error.message]));
  } finally {
    showLoading(false);
    connectBtn.disabled = false;
  }
}

/**
 * 斷開連接
 */
async function disconnect() {
  showLoading(true);
  connectBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'disconnect'
    });

    if (response.success) {
      setDisconnectedState();
    }
  } catch (error) {
    console.error('Failed to disconnect:', error);
    showError('斷開連接失敗：' + error.message);
  } finally {
    showLoading(false);
    connectBtn.disabled = false;
  }
}

/**
 * 設置已連接狀態
 */
function setConnectedState(tab) {
  isConnected = true;
  
  // 更新狀態指示器
  statusDot.classList.remove('disconnected');
  statusDot.classList.add('connected');
  statusText.textContent = chrome.i18n.getMessage('statusConnected');
  
  // 顯示標籤頁資訊
  tabInfo.style.display = 'block';
  tabTitle.textContent = tab.title || 'Untitled';
  document.getElementById('tabIdValue').textContent = tab.id;
  
  // 更新連接按鈕
  connectBtn.textContent = chrome.i18n.getMessage('buttonDisconnect');
  connectBtn.classList.add('disconnect');
  
  // 啟用所有功能指示器
  Object.values(features).forEach(feature => {
    feature.classList.add('active');
  });
}

/**
 * 設置未連接狀態
 */
function setDisconnectedState() {
  isConnected = false;
  
  // 更新狀態指示器
  statusDot.classList.remove('connected');
  statusDot.classList.add('disconnected');
  statusText.textContent = chrome.i18n.getMessage('statusDisconnected');
  
  // 隱藏標籤頁資訊
  tabInfo.style.display = 'none';
  
  // 更新連接按鈕
  connectBtn.textContent = chrome.i18n.getMessage('buttonConnect');
  connectBtn.classList.remove('disconnect');
  
  // 停用所有功能指示器
  Object.values(features).forEach(feature => {
    feature.classList.remove('active');
  });
}

/**
 * 顯示/隱藏載入狀態
 */
function showLoading(show) {
  if (show) {
    loading.classList.add('show');
  } else {
    loading.classList.remove('show');
  }
}

/**
 * 顯示錯誤訊息
 */
function showError(message) {
  // 暫時將狀態文字改為錯誤訊息
  const originalText = statusText.textContent;
  
  // 處理較長的錯誤訊息
  if (message.length > 50) {
    // 顯示簡短版本在狀態文字
    const shortMessage = message.substring(0, 47) + '...';
    statusText.textContent = shortMessage;
    statusText.title = message; // 完整訊息顯示在提示中
  } else {
    statusText.textContent = message;
  }
  
  statusText.style.color = '#f44336';
  
  // 根據訊息長度調整顯示時間
  const displayTime = Math.min(3000 + (message.length * 20), 6000);
  
  setTimeout(() => {
    statusText.textContent = originalText;
    statusText.style.color = '';
    statusText.title = '';
  }, displayTime);
}

/**
 * 處理設定連結點擊
 */
function handleSettingsClick(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
}

// 初始化
document.addEventListener('DOMContentLoaded', initialize);
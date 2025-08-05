/**
 * Browser MCP Extension - 選項頁面腳本
 * 處理設定的載入、儲存和重置
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

// 預設設定
const DEFAULT_SETTINGS = {
  wsUrl: 'ws://localhost:9002',
  connectionTimeout: 5000,
  autoReconnect: true,
  reconnectInterval: 5,
  debugMode: false
};

// DOM 元素
let form, statusMessage;
let wsUrlInput, connectionTimeoutInput, autoReconnectInput;
let reconnectIntervalInput, debugModeInput, resetLink;

/**
 * 初始化選項頁面
 */
function initialize() {
  // 初始化 i18n
  initializeI18n();
  
  // 獲取 DOM 元素
  form = document.getElementById('settingsForm');
  statusMessage = document.getElementById('statusMessage');
  wsUrlInput = document.getElementById('wsUrl');
  connectionTimeoutInput = document.getElementById('connectionTimeout');
  autoReconnectInput = document.getElementById('autoReconnect');
  reconnectIntervalInput = document.getElementById('reconnectInterval');
  debugModeInput = document.getElementById('debugMode');
  resetLink = document.getElementById('resetSettings');

  // 綁定事件
  form.addEventListener('submit', handleSave);
  resetLink.addEventListener('click', handleReset);
  
  // 監聽自動重連選項變化
  autoReconnectInput.addEventListener('change', updateReconnectIntervalState);

  // 載入已儲存的設定
  loadSettings();
}

/**
 * 載入已儲存的設定
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    wsUrlInput.value = result.wsUrl;
    connectionTimeoutInput.value = result.connectionTimeout;
    autoReconnectInput.checked = result.autoReconnect;
    reconnectIntervalInput.value = result.reconnectInterval;
    debugModeInput.checked = result.debugMode;
    
    updateReconnectIntervalState();
    
    console.log('Settings loaded:', result);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus(chrome.i18n.getMessage('errorLoadSettings', [error.message]), 'error');
  }
}

/**
 * 儲存設定
 */
async function handleSave(e) {
  e.preventDefault();
  
  try {
    // 驗證輸入
    const wsUrl = wsUrlInput.value.trim();
    const connectionTimeout = parseInt(connectionTimeoutInput.value);
    const reconnectInterval = parseInt(reconnectIntervalInput.value);
    
    if (!wsUrl) {
      throw new Error(chrome.i18n.getMessage('errorWebSocketUrlEmpty'));
    }
    
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      throw new Error(chrome.i18n.getMessage('errorWebSocketUrlInvalid'));
    }
    
    if (connectionTimeout < 1000 || connectionTimeout > 30000) {
      throw new Error(chrome.i18n.getMessage('errorConnectionTimeoutRange'));
    }
    
    if (reconnectInterval < 1 || reconnectInterval > 60) {
      throw new Error(chrome.i18n.getMessage('errorReconnectIntervalRange'));
    }
    
    // 準備設定物件
    const settings = {
      wsUrl,
      connectionTimeout,
      autoReconnect: autoReconnectInput.checked,
      reconnectInterval,
      debugMode: debugModeInput.checked
    };
    
    // 儲存到 Chrome storage
    await chrome.storage.sync.set(settings);
    
    console.log('Settings saved:', settings);
    showStatus(chrome.i18n.getMessage('successSettingsSaved'), 'success');
    
    // 通知背景腳本設定已更新
    try {
      await chrome.runtime.sendMessage({
        action: 'settingsUpdated',
        settings
      });
    } catch (error) {
      console.warn('Failed to notify background script:', error);
    }
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus(chrome.i18n.getMessage('errorSaveSettings', [error.message]), 'error');
  }
}

/**
 * 重置設定為預設值
 */
async function handleReset(e) {
  e.preventDefault();
  
  if (!confirm(chrome.i18n.getMessage('confirmReset'))) {
    return;
  }
  
  try {
    // 重置表單
    wsUrlInput.value = DEFAULT_SETTINGS.wsUrl;
    connectionTimeoutInput.value = DEFAULT_SETTINGS.connectionTimeout;
    autoReconnectInput.checked = DEFAULT_SETTINGS.autoReconnect;
    reconnectIntervalInput.value = DEFAULT_SETTINGS.reconnectInterval;
    debugModeInput.checked = DEFAULT_SETTINGS.debugMode;
    
    updateReconnectIntervalState();
    
    // 儲存預設設定
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    
    console.log('Settings reset to defaults');
    showStatus(chrome.i18n.getMessage('successSettingsReset'), 'success');
    
    // 通知背景腳本
    try {
      await chrome.runtime.sendMessage({
        action: 'settingsUpdated',
        settings: DEFAULT_SETTINGS
      });
    } catch (error) {
      console.warn('Failed to notify background script:', error);
    }
    
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus(chrome.i18n.getMessage('errorResetSettings', [error.message]), 'error');
  }
}

/**
 * 更新重連間隔輸入框狀態
 */
function updateReconnectIntervalState() {
  const isAutoReconnectEnabled = autoReconnectInput.checked;
  reconnectIntervalInput.disabled = !isAutoReconnectEnabled;
  reconnectIntervalInput.style.opacity = isAutoReconnectEnabled ? '1' : '0.5';
}

/**
 * 顯示狀態訊息
 */
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-${type}`;
  statusMessage.style.display = 'block';
  
  // 3 秒後自動隱藏
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

/**
 * 匯出設定（用於備份）
 */
async function exportSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // 創建下載連結
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `browsermcp-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showStatus(chrome.i18n.getMessage('successSettingsExported'), 'success');
  } catch (error) {
    console.error('Failed to export settings:', error);
    showStatus(chrome.i18n.getMessage('errorExportSettings', [error.message]), 'error');
  }
}

/**
 * 匯入設定（從備份檔案）
 */
function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // 驗證設定結構
      const requiredKeys = Object.keys(DEFAULT_SETTINGS);
      const importedKeys = Object.keys(settings);
      
      if (!requiredKeys.every(key => importedKeys.includes(key))) {
        throw new Error(chrome.i18n.getMessage('errorImportFileFormat'));
      }
      
      // 應用設定
      await chrome.storage.sync.set(settings);
      await loadSettings();
      
      showStatus(chrome.i18n.getMessage('successSettingsImported'), 'success');
    } catch (error) {
      console.error('Failed to import settings:', error);
      showStatus(chrome.i18n.getMessage('errorImportSettings', [error.message]), 'error');
    }
  };
  
  input.click();
}

// 當頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', initialize);

// 匯出函數以供其他腳本使用
window.exportSettings = exportSettings;
window.importSettings = importSettings;
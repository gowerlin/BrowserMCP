/**
 * Background Service Worker for Browser MCP
 * Handles WebSocket connections and DevTools integration
 */

// Global state
let ws = null;
let isConnected = false;
let currentTabId = null;
let debuggeeAttached = false;
const WS_URL = 'ws://localhost:9002';

// Network requests storage
const networkRequests = new Map();
const consoleLogs = [];

/**
 * Initialize the extension
 */
function initialize() {
  console.log('Browser MCP Extension initialized');
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Listen for tab updates
  chrome.tabs.onUpdated.addListener(handleTabUpdate);
  
  // Listen for tab removal
  chrome.tabs.onRemoved.addListener(handleTabRemoved);
}

/**
 * Handle messages from popup and content scripts
 */
function handleMessage(request, sender, sendResponse) {
  console.log('Received message:', request);
  
  switch (request.action) {
    case 'connect':
      connectToTab(request.tabId).then(sendResponse);
      return true; // Will respond asynchronously
      
    case 'disconnect':
      disconnect().then(sendResponse);
      return true;
      
    case 'getStatus':
      sendResponse({
        connected: isConnected,
        tabId: currentTabId,
        wsConnected: ws && ws.readyState === WebSocket.OPEN
      });
      break;
      
    case 'executeDevToolsCommand':
      // Ensure we have valid command and params
      const command = request.command || request.method;
      const params = request.params || {};
      
      if (!command) {
        sendResponse({ success: false, error: 'No command specified' });
        break;
      }
      
      executeDevToolsCommand(command, params)
        .then(result => {
          console.log('Command successful:', command);
          sendResponse({ success: true, result: result });
        })
        .catch(error => {
          console.error('Command failed:', command, error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
}

/**
 * Connect to a tab and setup WebSocket
 */
async function connectToTab(tabId) {
  try {
    currentTabId = tabId;
    
    // Attach debugger
    await attachDebugger(tabId);
    console.log('Debugger attached successfully');
    
    // Setup WebSocket connection (optional, may fail if server not running)
    try {
      await setupWebSocket();
      console.log('WebSocket connected successfully');
    } catch (wsError) {
      console.warn('WebSocket connection failed (server may not be running):', wsError.message);
      // Continue without WebSocket - extension can still work for local operations
    }
    
    // Enable DevTools domains
    await enableDevToolsDomains();
    console.log('DevTools domains enabled');
    
    isConnected = true;
    
    // Update icon to show connected state
    chrome.action.setIcon({
      path: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png"
      }
    });
    
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    
    console.log('Extension connected successfully to tab:', tabId);
    return { success: true };
  } catch (error) {
    console.error('Failed to connect:', error);
    
    // Clean up on failure
    if (debuggeeAttached) {
      try {
        await chrome.debugger.detach({ tabId: tabId });
        debuggeeAttached = false;
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    currentTabId = null;
    isConnected = false;
    
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect from current tab
 */
async function disconnect() {
  try {
    // Remove debugger event listener first
    chrome.debugger.onEvent.removeListener(handleDebuggerEvent);
    
    if (debuggeeAttached && currentTabId) {
      await chrome.debugger.detach({ tabId: currentTabId });
      debuggeeAttached = false;
    }
    
    if (ws) {
      ws.close();
      ws = null;
    }
    
    isConnected = false;
    currentTabId = null;
    networkRequests.clear();
    consoleLogs.length = 0;
    
    // Update icon to show disconnected state
    chrome.action.setBadgeText({ text: "" });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Attach debugger to tab
 */
async function attachDebugger(tabId) {
  return new Promise((resolve, reject) => {
    // Validate tabId
    if (!tabId || typeof tabId !== 'number') {
      reject(new Error('Invalid tab ID'));
      return;
    }
    
    // First, try to detach any existing debugger
    chrome.debugger.detach({ tabId: tabId }, () => {
      // Clear any error from detach attempt (it's ok if nothing was attached)
      chrome.runtime.lastError;
      
      // Now attach the debugger
      setTimeout(() => {
        chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            
            // Provide helpful error messages
            if (error.includes('Another debugger')) {
              reject(new Error('另一個調試器已連接到此標籤頁。請關閉開發者工具(F12)後再試。'));
            } else if (error.includes('Cannot access')) {
              reject(new Error('無法連接到此標籤頁。Chrome 擴充功能無法調試 Chrome 商店或系統頁面。'));
            } else {
              reject(new Error(error));
            }
          } else {
            debuggeeAttached = true;
            
            // Listen for debugger events
            chrome.debugger.onEvent.addListener(handleDebuggerEvent);
            
            resolve();
          }
        });
      }, 100); // Small delay to ensure detach completes
    });
  });
}

/**
 * Setup WebSocket connection
 */
async function setupWebSocket() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (ws) {
        ws.close();
        ws = null;
      }
      reject(new Error('WebSocket connection timeout (server may not be running)'));
    }, 3000); // 3 second timeout
    
    try {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('WebSocket connected');
        resolve();
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        ws = null;
        reject(new Error('WebSocket connection failed'));
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        ws = null;
      };
      
      ws.onmessage = (event) => {
        handleWebSocketMessage(event.data);
      };
    } catch (error) {
      clearTimeout(timeout);
      ws = null;
      reject(error);
    }
  });
}

/**
 * Enable DevTools domains
 */
async function enableDevToolsDomains() {
  const domains = [
    'Network',
    'Page',
    'Runtime',
    'DOM',
    'CSS',
    'Console',
    'Performance'
    // Note: Security domain is not always available, removed to prevent errors
  ];
  
  for (const domain of domains) {
    try {
      await executeDevToolsCommand(`${domain}.enable`, {});
      console.log(`Enabled ${domain} domain`);
    } catch (error) {
      // Some domains might not be available in all contexts
      console.warn(`Could not enable ${domain} domain:`, error.message);
      // Continue with other domains
    }
  }
  
  // Try to enable optional domains that might not be available
  const optionalDomains = ['Security', 'ServiceWorker', 'Storage'];
  for (const domain of optionalDomains) {
    try {
      await executeDevToolsCommand(`${domain}.enable`, {});
      console.log(`Enabled optional ${domain} domain`);
    } catch (error) {
      // These are optional, so we just log and continue
      console.log(`Optional domain ${domain} not available`);
    }
  }
}

/**
 * Execute DevTools command
 */
function executeDevToolsCommand(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!currentTabId || !debuggeeAttached) {
      reject(new Error('No tab connected'));
      return;
    }
    
    // Ensure params is an object (not null or undefined)
    const commandParams = params || {};
    
    // Debug log
    console.log('Executing DevTools command:', method, 'with params:', commandParams);
    
    chrome.debugger.sendCommand(
      { tabId: currentTabId },
      method,
      commandParams,
      (result) => {
        if (chrome.runtime.lastError) {
          console.error('DevTools command error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('DevTools command result:', result);
          resolve(result || {});
        }
      }
    );
  });
}

/**
 * Handle debugger events
 */
function handleDebuggerEvent(debuggeeId, method, params) {
  // Store network requests
  if (method === 'Network.requestWillBeSent') {
    networkRequests.set(params.requestId, {
      requestId: params.requestId,
      url: params.request.url,
      method: params.request.method,
      timestamp: params.timestamp,
      type: params.type,
      request: params.request
    });
  } else if (method === 'Network.responseReceived') {
    const request = networkRequests.get(params.requestId);
    if (request) {
      request.response = params.response;
      request.responseTimestamp = params.timestamp;
    }
  }
  
  // Store console logs
  if (method === 'Console.messageAdded') {
    consoleLogs.push({
      level: params.message.level,
      text: params.message.text,
      timestamp: Date.now(),
      source: params.message.source
    });
    
    // Limit console logs
    if (consoleLogs.length > 1000) {
      consoleLogs.shift();
    }
  }
  
  // Send event to WebSocket if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'devtools-event',
      method,
      params
    }));
  }
}

/**
 * Handle WebSocket messages
 */
async function handleWebSocketMessage(data) {
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'execute-command':
        const result = await executeDevToolsCommand(message.method, message.params);
        ws.send(JSON.stringify({
          type: 'command-result',
          id: message.id,
          result
        }));
        break;
        
      case 'get-network-requests':
        ws.send(JSON.stringify({
          type: 'network-requests',
          id: message.id,
          requests: Array.from(networkRequests.values())
        }));
        break;
        
      case 'get-console-logs':
        ws.send(JSON.stringify({
          type: 'console-logs',
          id: message.id,
          logs: consoleLogs
        }));
        break;
        
      case 'clear-network-log':
        networkRequests.clear();
        ws.send(JSON.stringify({
          type: 'command-result',
          id: message.id,
          result: { success: true }
        }));
        break;
        
      case 'clear-console-log':
        consoleLogs.length = 0;
        ws.send(JSON.stringify({
          type: 'command-result',
          id: message.id,
          result: { success: true }
        }));
        break;
    }
  } catch (error) {
    console.error('Failed to handle WebSocket message:', error);
  }
}

/**
 * Handle tab updates
 */
function handleTabUpdate(tabId, changeInfo, tab) {
  if (tabId === currentTabId && changeInfo.status === 'loading') {
    // Clear logs on navigation
    networkRequests.clear();
    consoleLogs.length = 0;
  }
}

/**
 * Handle tab removal
 */
function handleTabRemoved(tabId) {
  if (tabId === currentTabId) {
    disconnect();
  }
}

// Initialize extension
initialize();
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
      executeDevToolsCommand(request.command, request.params)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
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
    
    // Setup WebSocket connection
    await setupWebSocket();
    
    // Enable DevTools domains
    await enableDevToolsDomains();
    
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
    
    return { success: true };
  } catch (error) {
    console.error('Failed to connect:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect from current tab
 */
async function disconnect() {
  try {
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
    chrome.debugger.attach({ tabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        debuggeeAttached = true;
        
        // Listen for debugger events
        chrome.debugger.onEvent.addListener(handleDebuggerEvent);
        
        resolve();
      }
    });
  });
}

/**
 * Setup WebSocket connection
 */
async function setupWebSocket() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      resolve();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      ws = null;
    };
    
    ws.onmessage = (event) => {
      handleWebSocketMessage(event.data);
    };
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
    'Performance',
    'Security'
  ];
  
  for (const domain of domains) {
    await executeDevToolsCommand(`${domain}.enable`, {});
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
    
    chrome.debugger.sendCommand(
      { tabId: currentTabId },
      method,
      params,
      (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
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
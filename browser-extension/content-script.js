/**
 * Browser MCP Content Script
 * Injected into web pages to provide DOM access and interaction capabilities
 */

// Establish connection with background script
let port = null;
let isExtensionValid = true;

function connectToBackground() {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    console.warn('Extension context is invalid. The extension may need to be reloaded.');
    isExtensionValid = false;
    return;
  }
  
  try {
    port = chrome.runtime.connect({ name: 'content-script' });
    
    port.onMessage.addListener((message) => {
      handleBackgroundMessage(message);
    });
    
    port.onDisconnect.addListener(() => {
      console.log('Disconnected from background script');
      port = null;
      
      // Only attempt reconnect if extension context is still valid
      if (chrome.runtime?.id) {
        console.log('Attempting to reconnect...');
        setTimeout(connectToBackground, 1000);
      } else {
        console.warn('Extension context invalidated. Please reload the extension.');
        isExtensionValid = false;
      }
    });
    
    console.log('Connected to Browser MCP background script');
    isExtensionValid = true;
  } catch (error) {
    if (error.message?.includes('Extension context invalidated')) {
      console.warn('Extension context is invalid. Please reload the extension and refresh this page.');
      isExtensionValid = false;
    } else {
      console.error('Failed to connect to background script:', error);
      // Only retry if the extension context is still valid
      if (chrome.runtime?.id) {
        setTimeout(connectToBackground, 1000);
      }
    }
  }
}

// Handle messages from background script
function handleBackgroundMessage(message) {
  switch (message.type) {
    case 'EVALUATE':
      handleEvaluate(message);
      break;
    case 'GET_ELEMENT':
      handleGetElement(message);
      break;
    case 'CLICK_ELEMENT':
      handleClickElement(message);
      break;
    case 'TYPE_TEXT':
      handleTypeText(message);
      break;
    case 'GET_PAGE_INFO':
      handleGetPageInfo(message);
      break;
    case 'SCREENSHOT_PREPARE':
      handleScreenshotPrepare(message);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}

// Evaluate JavaScript in page context
function handleEvaluate(message) {
  try {
    const result = eval(message.code);
    sendResponse(message.id, { success: true, result });
  } catch (error) {
    sendResponse(message.id, { 
      success: false, 
      error: error.message 
    });
  }
}

// Get element information
function handleGetElement(message) {
  try {
    const element = document.querySelector(message.selector);
    if (!element) {
      sendResponse(message.id, { 
        success: false, 
        error: 'Element not found' 
      });
      return;
    }
    
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    const elementInfo = {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      innerText: element.innerText?.substring(0, 200),
      innerHTML: element.innerHTML?.substring(0, 200),
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      boundingRect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      computedStyles: message.includeStyles ? {
        display: styles.display,
        position: styles.position,
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        visibility: styles.visibility,
        opacity: styles.opacity
      } : undefined
    };
    
    sendResponse(message.id, { 
      success: true, 
      element: elementInfo 
    });
  } catch (error) {
    sendResponse(message.id, { 
      success: false, 
      error: error.message 
    });
  }
}

// Click an element
function handleClickElement(message) {
  try {
    const element = document.querySelector(message.selector);
    if (!element) {
      sendResponse(message.id, { 
        success: false, 
        error: 'Element not found' 
      });
      return;
    }
    
    element.click();
    sendResponse(message.id, { success: true });
  } catch (error) {
    sendResponse(message.id, { 
      success: false, 
      error: error.message 
    });
  }
}

// Type text into an element
function handleTypeText(message) {
  try {
    const element = document.querySelector(message.selector);
    if (!element) {
      sendResponse(message.id, { 
        success: false, 
        error: 'Element not found' 
      });
      return;
    }
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = message.text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element.contentEditable === 'true') {
      element.innerText = message.text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      sendResponse(message.id, { 
        success: false, 
        error: 'Element is not editable' 
      });
      return;
    }
    
    sendResponse(message.id, { success: true });
  } catch (error) {
    sendResponse(message.id, { 
      success: false, 
      error: error.message 
    });
  }
}

// Get page information
function handleGetPageInfo(message) {
  try {
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      protocol: window.location.protocol,
      pathname: window.location.pathname,
      documentElement: {
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: document.documentElement.clientHeight,
        clientWidth: document.documentElement.clientWidth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      meta: Array.from(document.querySelectorAll('meta')).map(meta => ({
        name: meta.name || meta.property,
        content: meta.content
      })).filter(m => m.name)
    };
    
    sendResponse(message.id, { 
      success: true, 
      pageInfo 
    });
  } catch (error) {
    sendResponse(message.id, { 
      success: false, 
      error: error.message 
    });
  }
}

// Prepare page for screenshot (highlight element if needed)
function handleScreenshotPrepare(message) {
  try {
    if (message.selector) {
      const element = document.querySelector(message.selector);
      if (element) {
        // Add highlight
        element.style.outline = '3px solid #4A90E2';
        element.style.outlineOffset = '2px';
        
        // Remove highlight after screenshot
        setTimeout(() => {
          element.style.outline = '';
          element.style.outlineOffset = '';
        }, 1000);
      }
    }
    
    sendResponse(message.id, { success: true });
  } catch (error) {
    sendResponse(message.id, { 
      success: false, 
      error: error.message 
    });
  }
}

// Send response back to background script
function sendResponse(messageId, response) {
  if (port) {
    port.postMessage({
      id: messageId,
      ...response
    });
  }
}

// Initialize connection
connectToBackground();

// Listen for page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !port) {
    connectToBackground();
  }
});

// Listen for messages from the web page (for testing)
window.addEventListener('message', async (event) => {
  // Only accept messages from the same origin
  if (event.source !== window) return;
  
  // Check if this is a BrowserMCP request
  if (event.data && event.data.type === 'browserMCP-request') {
    const { messageId, action, params } = event.data;
    
    // Check if extension context is valid
    if (!isExtensionValid || !chrome.runtime?.id) {
      window.postMessage({
        type: 'browserMCP-response',
        messageId: messageId,
        response: {
          success: false,
          error: '擴充功能需要重新載入。請到 chrome://extensions/ 重新載入 BrowserMCP 擴充功能，然後重新整理此頁面。'
        }
      }, '*');
      return;
    }
    
    try {
      // Forward the request to the background script
      const response = await chrome.runtime.sendMessage({
        action: action,
        ...params
      });
      
      // Send the response back to the web page
      window.postMessage({
        type: 'browserMCP-response',
        messageId: messageId,
        response: response
      }, '*');
    } catch (error) {
      let errorMessage = error.message;
      
      // Provide more helpful error messages
      if (error.message?.includes('Extension context invalidated')) {
        errorMessage = '擴充功能需要重新載入。請到 chrome://extensions/ 重新載入 BrowserMCP 擴充功能。';
        isExtensionValid = false;
      } else if (error.message?.includes('Could not establish connection')) {
        errorMessage = '無法連接到擴充功能背景腳本。請確認擴充功能已啟用並重新載入。';
      }
      
      // Send error response back to the web page
      window.postMessage({
        type: 'browserMCP-response',
        messageId: messageId,
        response: {
          success: false,
          error: errorMessage
        }
      }, '*');
    }
  }
});

// Inject test helper for easier debugging
if (window.location.href.includes('test-extension.html')) {
  const script = document.createElement('script');
  script.textContent = `
    console.log('BrowserMCP Test Helper Injected');
    window.browserMCP = {
      async sendCommand(method, params = {}) {
        return new Promise((resolve) => {
          const messageId = Math.random().toString(36).substring(7);
          
          const handleResponse = (event) => {
            if (event.data && event.data.type === 'browserMCP-response' && event.data.messageId === messageId) {
              window.removeEventListener('message', handleResponse);
              resolve(event.data.response);
            }
          };
          
          window.addEventListener('message', handleResponse);
          
          window.postMessage({
            type: 'browserMCP-request',
            messageId: messageId,
            action: 'executeDevToolsCommand',
            command: method,
            params: params
          }, '*');
          
          setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve({ success: false, error: 'Request timeout' });
          }, 5000);
        });
      }
    };
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

console.log('Browser MCP content script loaded');
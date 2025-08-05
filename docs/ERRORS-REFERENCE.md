# BrowserMCP Error Reference Guide

## Errors You Can Safely Ignore

### 1. DevTools Domain Not Found Errors

These errors are **normal and expected**:

```
DevTools command error: {"code":-32601,"message":"'Security.enable' wasn't found"}
DevTools command error: {"code":-32601,"message":"'ServiceWorker.enable' wasn't found"}
DevTools command error: {"code":-32601,"message":"'Storage.enable' wasn't found"}
```

**Why they occur**: These DevTools domains are not available in all contexts or Chrome versions.

**Impact**: None. The extension will work perfectly without these optional domains.

### 2. Optional Domain Errors

Any error message containing:
- `Optional domain [name] not available`
- `Could not enable [domain] domain`

These are informational only and do not affect functionality.

## Errors That Need Attention

### 1. Extension Context Invalid

```
Extension context is invalid. The extension may need to be reloaded.
```

**Impact**: Extension stops working until reloaded.

**Solution**:
1. Go to `chrome://extensions/`
2. Find BrowserMCP and click the refresh button
3. Refresh the web page

### 2. Debugger Already Attached

```
Another debugger is already attached to this tab
```

**Impact**: Cannot connect to the tab.

**Solution**: Close Chrome DevTools (F12) before connecting.

### 3. Cannot Access Chrome Pages

```
Cannot access chrome:// URLs
```

**Impact**: Extension cannot debug Chrome system pages.

**Solution**: Use the extension only on regular web pages.

## Core Functionality Status

Even with the optional domain errors, these features work perfectly:

✅ **Network Monitoring** - Track all network requests  
✅ **DOM Manipulation** - Query and modify page elements  
✅ **JavaScript Execution** - Run code in page context  
✅ **Console Logging** - Capture console output  
✅ **Performance Analysis** - Monitor page performance  
✅ **CSS Operations** - Modify styles dynamically  
✅ **Page Navigation** - Control page navigation  
✅ **Screenshot Capture** - Take page screenshots  

## When to Worry

Only be concerned if you see:
- Connection failures to regular web pages
- Repeated "Extension context invalid" errors
- WebSocket connection failures (if using MCP server)
- Errors from core domains (Network, Page, Runtime, DOM)

## Quick Diagnostic

To verify the extension is working properly:

1. Open popup and check connection status
2. Try connecting to a regular web page (not chrome://)
3. Check if the "ON" badge appears on the extension icon
4. Look for "Extension connected successfully to tab" in console

If all these work, you can safely ignore the optional domain errors.
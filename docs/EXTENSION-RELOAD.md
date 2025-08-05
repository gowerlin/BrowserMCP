# BrowserMCP Extension Reload Guide

## When to Reload the Extension

You need to reload the BrowserMCP extension in the following situations:

1. **After updating the extension code**
2. **When you see "Extension context is invalid" error**
3. **When the extension stops responding**
4. **After Chrome browser updates**

## How to Reload the Extension

### Method 1: Using Chrome Extensions Page

1. Open Chrome and navigate to `chrome://extensions/`
2. Find "BrowserMCP DevTools Bridge" in the list
3. Click the refresh icon (🔄) on the extension card
4. Refresh any pages that were using the extension

### Method 2: Using Developer Mode

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Update" button at the top
4. This will reload all extensions in developer mode

### Method 3: Disable and Re-enable

1. Open `chrome://extensions/`
2. Toggle the extension off and then on again
3. This forces a complete reload

## After Reloading

After reloading the extension, you must:

1. **Refresh all pages** where you were using the extension
2. **Reconnect** to any tabs that were previously connected
3. **Re-apply any settings** if they were not persisted

## Common Issues and Solutions

### "Extension context invalidated" Error

This happens when:
- The extension was updated while a page was still open
- Chrome updated the extension automatically
- The extension crashed and was restarted

**Solution**: Reload the extension and refresh the page.

### "Cannot establish connection" Error

This happens when:
- The content script is trying to connect to an old version
- The background script is not running

**Solution**: 
1. Reload the extension
2. Close and reopen the tab
3. Try connecting again

### Extension Not Appearing in Toolbar

If the extension icon disappears:
1. Click the puzzle piece icon in Chrome toolbar
2. Find "BrowserMCP DevTools Bridge"
3. Click the pin icon to keep it visible

## Preventing Issues

To minimize the need for reloads:

1. **Close DevTools** before connecting the extension
2. **Disconnect properly** before closing tabs
3. **Keep Chrome updated** to the latest version
4. **Monitor the console** for early warning signs

## Automated Recovery

The extension includes some automated recovery features:

- **Auto-reconnect**: Attempts to reconnect when connection is lost
- **Context validation**: Checks if the extension context is still valid
- **Error recovery**: Provides clear error messages with instructions

However, manual reload is still required in some cases.
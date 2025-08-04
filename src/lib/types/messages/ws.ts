/**
 * WebSocket message type mappings for browser automation
 */

export interface SocketMessageMap {
  // Navigation messages
  browser_navigate: { 
    payload: { url: string } 
  };
  browser_go_back: { 
    payload: {} 
  };
  browser_go_forward: { 
    payload: {} 
  };
  
  // Input messages
  browser_wait: { 
    payload: { time: number } 
  };
  browser_press_key: { 
    payload: { key: string } 
  };
  browser_type: { 
    payload: { 
      element: string; 
      text: string 
    } 
  };
  
  // Interaction messages
  browser_click: { 
    payload: { element: string } 
  };
  browser_drag: { 
    payload: { 
      startElement: string; 
      endElement: string 
    } 
  };
  browser_hover: { 
    payload: { element: string } 
  };
  browser_select_option: { 
    payload: { 
      element: string; 
      option?: string 
    } 
  };
  
  // Information retrieval messages
  browser_get_console_logs: { 
    payload: {} 
  };
  browser_screenshot: { 
    payload: {} 
  };
  browser_snapshot: { 
    payload: {} 
  };
  
  // Page information
  getUrl: { 
    payload: undefined 
  };
  getTitle: { 
    payload: undefined 
  };
}
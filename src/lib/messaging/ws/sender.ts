import { WebSocket } from 'ws';

/**
 * WebSocket message sender interface
 */
export interface SocketMessageSender<TMap> {
  sendSocketMessage: <T extends keyof TMap>(
    type: T,
    payload: TMap[T] extends { payload: infer P } ? P : never,
    options?: { timeoutMs?: number }
  ) => Promise<any>;
}

/**
 * Create a WebSocket message sender
 */
export function createSocketMessageSender<TMap>(
  ws: WebSocket
): SocketMessageSender<TMap> {
  return {
    sendSocketMessage: async (type, payload, options = {}) => {
      const { timeoutMs = 30000 } = options;
      
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(7);
        const message = {
          type: type as string,
          payload,
          id,
          timestamp: Date.now(),
        };
        
        const timeout = setTimeout(() => {
          const timeoutType = type === 'browser_navigate' ? 'navigation' : 
                            type === 'browser_screenshot' ? 'screenshot' : 'operation';
          reject(new Error(`訊息超時 ${timeoutMs/1000}s: ${timeoutType} (${type})`));
        }, timeoutMs);
        
        const handleMessage = (data: any) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.id === id) {
              clearTimeout(timeout);
              ws.off('message', handleMessage);
              
              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response.result);
              }
            }
          } catch (e) {
            // Ignore parse errors for messages not meant for us
          }
        };
        
        ws.on('message', handleMessage);
        
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          clearTimeout(timeout);
          ws.off('message', handleMessage);
          reject(error);
        }
      });
    },
  };
}
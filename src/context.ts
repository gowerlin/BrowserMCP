import { WebSocket } from "ws";
import { 
  createSocketMessageSender,
  mcpConfig,
  MessagePayload,
  MessageType,
  SocketMessageMap
} from "./types/internal-types";
import { configManager } from "./config/config-manager";

const noConnectionMessage = `No connection to browser extension. In order to proceed, you must first connect a tab by clicking the Browser MCP extension icon in the browser toolbar and clicking the 'Connect' button.`;

export class Context {
  private _ws: WebSocket | undefined;

  get ws(): WebSocket {
    if (!this._ws) {
      throw new Error(noConnectionMessage);
    }
    return this._ws;
  }

  set ws(ws: WebSocket) {
    this._ws = ws;
  }

  hasWs(): boolean {
    return !!this._ws;
  }

  async sendSocketMessage<T extends MessageType<SocketMessageMap>>(
    type: T,
    payload: MessagePayload<SocketMessageMap, T>,
    options: { timeoutMs?: number } = {},
  ) {
    // Use screenshot-specific timeout for screenshot operations
    let timeoutMs = options.timeoutMs;
    if (!timeoutMs) {
      if (type === 'browser_screenshot') {
        timeoutMs = configManager.getConfig().devtools.screenshotTimeout;
      } else {
        timeoutMs = 30000; // Default 30 seconds for other operations
      }
    }

    const { sendSocketMessage } = createSocketMessageSender<SocketMessageMap>(
      this.ws,
    );
    try {
      return await sendSocketMessage(type, payload, { timeoutMs });
    } catch (e) {
      if (e instanceof Error && e.message === mcpConfig.errors.noConnectedTab) {
        throw new Error(noConnectionMessage);
      }
      throw e;
    }
  }

  async close() {
    if (!this._ws) {
      return;
    }
    await this._ws.close();
  }
}

/**
 * MCP server configuration
 */
export const mcpConfig = {
  defaultWsPort: 3001,
  errors: {
    noConnectedTab: "No tab connected to the browser extension",
  },
  timeouts: {
    default: 30000,
    connection: 10000,
  },
} as const;
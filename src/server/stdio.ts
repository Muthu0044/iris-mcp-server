import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { AppConfig } from "../config/env.js";
import type { Logger } from "../utils/logger.js";
import { createMcpServer } from "./mcp.js";

export async function startStdioServer(config: AppConfig, logger: Logger): Promise<void> {
  const server = createMcpServer(config, logger);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("IRIS MCP stdio server connected");
}

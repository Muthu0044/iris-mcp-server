import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppConfig } from "../config/env.js";
import type { Logger } from "../utils/logger.js";
import { createMcpServer } from "./mcp.js";

export async function startHttpServer(config: AppConfig, logger: Logger): Promise<void> {
  const app = express();
  app.use(express.json({ limit: config.MAX_SOURCE_PAYLOAD_BYTES }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/version", (_req, res) => {
    res.json({
      name: config.MCP_SERVER_NAME,
      version: config.MCP_SERVER_VERSION
    });
  });

  app.get("/metrics", (_req, res) => {
    res.type("text/plain").send("# iris_mcp_server_up 1\niris_mcp_server_up 1\n");
  });

  app.post("/mcp", async (req, res) => {
    const started = Date.now();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    const server = createMcpServer(config, logger);

    res.on("close", () => {
      logger.debug({ durationMs: Date.now() - started }, "MCP HTTP request closed");
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error({ err: error }, "MCP HTTP request failed");
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
    } finally {
      await server.close();
    }
  });

  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "IRIS MCP HTTP server listening");
  });
}

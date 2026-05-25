import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/env.js";
import { AtelierClient } from "../iris/atelierClient.js";
import type { Logger } from "../utils/logger.js";
import { createClassToolHandlers } from "../tools/classes.js";
import { createMetadataToolHandlers } from "../tools/metadata.js";
import { createRoutineToolHandlers } from "../tools/routines.js";
import { createSearchToolHandlers } from "../tools/search.js";
import { pingTool } from "../tools/ping.js";
import {
  compileClassSchema,
  getClassSchema,
  getDocumentIndexSchema,
  getRoutineSchema,
  listClassesSchema,
  saveClassSchema,
  saveRoutineSchema,
  searchTextSchema
} from "../schemas/documents.js";

export function createMcpServer(config: AppConfig, logger: Logger): McpServer {
  const server = new McpServer({
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION
  });

  const client = new AtelierClient(config, logger);
  const classHandlers = createClassToolHandlers(client, config);
  const routineHandlers = createRoutineToolHandlers(client, config);
  const searchHandlers = createSearchToolHandlers(client);
  const metadataHandlers = createMetadataToolHandlers(client);

  server.tool("ping", "Basic MCP server connectivity validation.", {}, pingTool);

  server.tool("list_classes", "List IRIS class documents in the configured namespace.", listClassesSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "list_classes" }, "MCP tool started");
    const result = await classHandlers.listClasses(input);
    logger.info({ tool: "list_classes", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_class", "Retrieve full IRIS class source.", getClassSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_class" }, "MCP tool started");
    const result = await classHandlers.getClass(input);
    logger.info({ tool: "get_class", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("save_class", "Save or update IRIS class source.", saveClassSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "save_class" }, "MCP tool started");
    const result = await classHandlers.saveClass(input);
    logger.info({ tool: "save_class", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("compile_class", "Compile an IRIS class.", compileClassSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "compile_class" }, "MCP tool started");
    const result = await classHandlers.compileClass(input);
    logger.info({ tool: "compile_class", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_routine", "Retrieve full IRIS routine source.", getRoutineSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_routine" }, "MCP tool started");
    const result = await routineHandlers.getRoutine(input);
    logger.info({ tool: "get_routine", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("save_routine", "Save or update IRIS routine source.", saveRoutineSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "save_routine" }, "MCP tool started");
    const result = await routineHandlers.saveRoutine(input);
    logger.info({ tool: "save_routine", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("search_text", "Search IRIS source code using Atelier search.", searchTextSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "search_text" }, "MCP tool started");
    const result = await searchHandlers.searchText(input);
    logger.info({ tool: "search_text", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_namespace_metadata", "Retrieve metadata for the configured IRIS namespace.", {}, async () => {
    const started = Date.now();
    logger.info({ tool: "get_namespace_metadata" }, "MCP tool started");
    const result = await metadataHandlers.getNamespaceMetadata();
    logger.info({ tool: "get_namespace_metadata", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_document_index", "Retrieve Atelier index metadata for an IRIS source document.", getDocumentIndexSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_document_index" }, "MCP tool started");
    const result = await metadataHandlers.getDocumentIndex(input);
    logger.info({ tool: "get_document_index", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  return server;
}

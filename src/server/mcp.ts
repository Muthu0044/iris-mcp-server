import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/env.js";
import { AtelierClient } from "../iris/atelierClient.js";
import type { Logger } from "../utils/logger.js";
import { createClassToolHandlers } from "../tools/classes.js";
import { createMetadataToolHandlers } from "../tools/metadata.js";
import { createRoutineToolHandlers } from "../tools/routines.js";
import { createSearchToolHandlers } from "../tools/search.js";
import { createSqlToolHandlers } from "../tools/sql.js";
import { createSystemToolHandlers } from "../tools/system.js";
import { createEnsembleToolHandlers } from "../tools/ensemble.js";
import { createSyncToolHandlers } from "../tools/sync.js";
import { pingTool } from "../tools/ping.js";
import {
  compileClassSchema,
  deleteClassSchema,
  getClassSchema,
  getDocumentIndexSchema,
  getEnsAdapterSchema,
  getEnsClassesSchema,
  getCspAppsSchema,
  getRoutineSchema,
  listClassesSchema,
  runSqlQuerySchema,
  saveClassSchema,
  saveRoutineSchema,
  deleteRoutineSchema,
  searchTextSchema,
  searchMessagesSchema,
  getMessageTraceSchema,
  syncFromIrisSchema,
  syncToIrisSchema,
  compareIrisFileSchema
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
  const sqlHandlers = createSqlToolHandlers(client, config);
  const systemHandlers = createSystemToolHandlers(client, config);
  const ensHandlers = createEnsembleToolHandlers(client, config);
  const syncHandlers = createSyncToolHandlers(client, config);

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

  server.tool("delete_class", "Delete an IRIS class.", deleteClassSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "delete_class" }, "MCP tool started");
    const result = await classHandlers.deleteClass(input);
    logger.info({ tool: "delete_class", durationMs: Date.now() - started }, "MCP tool completed");
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

  server.tool("delete_routine", "Delete an IRIS routine.", deleteRoutineSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "delete_routine" }, "MCP tool started");
    const result = await routineHandlers.deleteRoutine(input);
    logger.info({ tool: "delete_routine", durationMs: Date.now() - started }, "MCP tool completed");
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

  server.tool("run_sql_query", "Run an SQL query on the IRIS database. MUST be a SELECT query.", runSqlQuerySchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "run_sql_query" }, "MCP tool started");
    const result = await sqlHandlers.runSqlQuery(input);
    logger.info({ tool: "run_sql_query", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_system_jobs", "Retrieve a list of currently active jobs in IRIS.", {}, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_system_jobs" }, "MCP tool started");
    const result = await systemHandlers.getSystemJobs(input);
    logger.info({ tool: "get_system_jobs", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_csp_apps", "Retrieve CSP applications for a namespace or all namespaces.", getCspAppsSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_csp_apps" }, "MCP tool started");
    const result = await systemHandlers.getCSPApps(input);
    logger.info({ tool: "get_csp_apps", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_ens_classes", "Retrieve Interoperability (Ensemble) classes by type (service, process, operation).", getEnsClassesSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_ens_classes" }, "MCP tool started");
    const result = await ensHandlers.getEnsClasses(input);
    logger.info({ tool: "get_ens_classes", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_ens_adapter", "Retrieve configuration schema for a given adapter class.", getEnsAdapterSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_ens_adapter" }, "MCP tool started");
    const result = await ensHandlers.getEnsAdapter(input);
    logger.info({ tool: "get_ens_adapter", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_productions", "Retrieve all configured Ensemble interoperability productions.", {}, async () => {
    const started = Date.now();
    logger.info({ tool: "get_productions" }, "MCP tool started");
    const result = await ensHandlers.getProductions();
    logger.info({ tool: "get_productions", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("search_messages", "Search Interoperability message headers (HL7, etc) by SessionId, source, or target.", searchMessagesSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "search_messages" }, "MCP tool started");
    const result = await ensHandlers.searchMessages(input);
    logger.info({ tool: "search_messages", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_message_trace", "Retrieve the trace events for a given message SessionId.", getMessageTraceSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "get_message_trace" }, "MCP tool started");
    const result = await ensHandlers.getMessageTrace(input);
    logger.info({ tool: "get_message_trace", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("get_routing_rules", "Retrieve routing rules and business processes (BPL).", {}, async () => {
    const started = Date.now();
    logger.info({ tool: "get_routing_rules" }, "MCP tool started");
    const result = await ensHandlers.getRoutingRules();
    logger.info({ tool: "get_routing_rules", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("sync_from_iris", "Downloads classes and routines from the IRIS namespace to the local workspace folder.", syncFromIrisSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "sync_from_iris" }, "MCP tool started");
    const result = await syncHandlers.syncFromIris(input);
    logger.info({ tool: "sync_from_iris", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("sync_to_iris", "Uploads files from the local workspace folder to the IRIS namespace.", syncToIrisSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "sync_to_iris" }, "MCP tool started");
    const result = await syncHandlers.syncToIris(input);
    logger.info({ tool: "sync_to_iris", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  server.tool("compare_iris_file", "Compares a local file with its live IRIS database counterpart to resolve sync conflicts.", compareIrisFileSchema, async (input) => {
    const started = Date.now();
    logger.info({ tool: "compare_iris_file" }, "MCP tool started");
    const result = await syncHandlers.compareIrisFile(input);
    logger.info({ tool: "compare_iris_file", durationMs: Date.now() - started }, "MCP tool completed");
    return result;
  });

  return server;
}

import type { AppConfig } from "../config/env.js";
import type { AtelierClient } from "../iris/atelierClient.js";
import { mapUnknownError } from "../iris/errors.js";
import { runSqlQuerySchema } from "../schemas/documents.js";
import { asMcpText, fail, ok } from "../utils/responses.js";

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

export function createSqlToolHandlers(client: AtelierClient, config: AppConfig) {
  return {
    async runSqlQuery(input: unknown) {
      try {
        const values = asInputObject(input);
        const query = runSqlQuerySchema.query.parse(values.query);
        const parameters = runSqlQuerySchema.parameters?.parse(values.parameters);
        
        if (!query.trim().toUpperCase().startsWith("SELECT")) {
          return asMcpText(fail("SQL_ERROR", "Only SELECT queries are allowed for safety reasons."));
        }

        const result = await client.runQuery(query, parameters);
        return asMcpText(ok({ query, result }));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

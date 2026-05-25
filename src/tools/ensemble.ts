import type { AppConfig } from "../config/env.js";
import type { AtelierClient } from "../iris/atelierClient.js";
import { mapUnknownError } from "../iris/errors.js";
import { getEnsAdapterSchema, getEnsClassesSchema, getMessageTraceSchema, searchMessagesSchema } from "../schemas/documents.js";
import { asMcpText, fail, ok } from "../utils/responses.js";

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

export function createEnsembleToolHandlers(client: AtelierClient, config: AppConfig) {
  return {
    async getEnsClasses(input: unknown) {
      try {
        const values = asInputObject(input);
        const type = getEnsClassesSchema.type.parse(values.type);
        const result = await client.getEnsClasses(type);
        return asMcpText(ok({ type, result }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getEnsAdapter(input: unknown) {
      try {
        const values = asInputObject(input);
        const name = getEnsAdapterSchema.name.parse(values.name);
        const result = await client.getEnsAdapter(name);
        return asMcpText(ok({ name, result }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getProductions() {
      try {
        const query = "SELECT ID, Name, Description, ActorPoolSize FROM Ens_Config.Production";
        const result = await client.runQuery(query);
        return asMcpText(ok(result));
      } catch (error) {
        return mcpError(error);
      }
    },

    async searchMessages(input: unknown) {
      try {
        const values = asInputObject(input);
        const sessionId = values.sessionId as string | undefined;
        const source = values.source as string | undefined;
        const target = values.target as string | undefined;
        const limit = (values.limit as number | undefined) ?? 50;
        
        let query = `SELECT TOP ${limit} ID, MessageBodyClassName, SessionId, TimeCreated, SourceConfigName, TargetConfigName FROM Ens.MessageHeader WHERE 1=1`;
        const params: unknown[] = [];
        if (sessionId) {
          query += " AND SessionId = ?";
          params.push(sessionId);
        }
        if (source) {
          query += " AND SourceConfigName = ?";
          params.push(source);
        }
        if (target) {
          query += " AND TargetConfigName = ?";
          params.push(target);
        }
        query += " ORDER BY ID DESC";
        
        const result = await client.runQuery(query, params);
        return asMcpText(ok(result));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getMessageTrace(input: unknown) {
      try {
        const values = asInputObject(input);
        const sessionId = values.sessionId as string;
        
        const query = "SELECT ID, MessageBodyClassName, MessageBodyId, SourceConfigName, TargetConfigName, TimeCreated, Status FROM Ens.MessageHeader WHERE SessionId = ? ORDER BY TimeCreated ASC";
        const result = await client.runQuery(query, [sessionId]);
        return asMcpText(ok(result));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getRoutingRules() {
      try {
        const query = "SELECT ID, Name, Super, Description FROM %Dictionary.ClassDefinition WHERE Super LIKE '%Ens.Rule.Definition%' OR Super LIKE '%Ens.BPL.Process%'";
        const result = await client.runQuery(query);
        return asMcpText(ok(result));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

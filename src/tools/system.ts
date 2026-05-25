import type { AppConfig } from "../config/env.js";
import type { AtelierClient } from "../iris/atelierClient.js";
import { mapUnknownError } from "../iris/errors.js";
import { asMcpText, fail, ok } from "../utils/responses.js";

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

export function createSystemToolHandlers(client: AtelierClient, config: AppConfig) {
  return {
    async getSystemJobs(input: unknown) {
      try {
        const result = await client.getSystemJobs();
        return asMcpText(ok({ result }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getCSPApps(input: unknown) {
      try {
        const values = asInputObject(input);
        const namespace = values.namespace ? String(values.namespace) : undefined;
        const result = await client.getCSPApps(namespace);
        return asMcpText(ok({ namespace, result }));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

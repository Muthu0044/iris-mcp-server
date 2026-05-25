import type { AppConfig } from "../config/env.js";
import type { AtelierClient } from "../iris/atelierClient.js";
import { IrisError, mapUnknownError } from "../iris/errors.js";
import { getRoutineSchema, saveRoutineSchema } from "../schemas/documents.js";
import { asMcpText, fail, ok } from "../utils/responses.js";

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function validatePayloadSize(content: string, maxBytes: number): void {
  const size = Buffer.byteLength(content, "utf8");
  if (size > maxBytes) {
    throw new IrisError("PAYLOAD_TOO_LARGE", `Routine content exceeds ${maxBytes} bytes`);
  }
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

export function createRoutineToolHandlers(client: AtelierClient, config: AppConfig) {
  return {
    async getRoutine(input: unknown) {
      try {
        const values = asInputObject(input);
        const routineName = getRoutineSchema.routineName.parse(values.routineName);
        const doc = await client.getRoutine(routineName);
        return asMcpText(ok({ routineName, document: doc, content: doc.content.join("\n") }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async saveRoutine(input: unknown) {
      try {
        const values = asInputObject(input);
        const routineName = saveRoutineSchema.routineName.parse(values.routineName);
        const content = saveRoutineSchema.content.parse(values.content);
        validatePayloadSize(content, config.MAX_SOURCE_PAYLOAD_BYTES);
        const doc = await client.saveRoutine(routineName, content);
        return asMcpText(ok({ routineName, document: doc }));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

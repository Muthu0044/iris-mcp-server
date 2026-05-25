import type { AtelierClient } from "../iris/atelierClient.js";
import { IrisError, mapUnknownError } from "../iris/errors.js";
import { compileClassSchema, getClassSchema, isProtectedClassName, listClassesSchema, saveClassSchema } from "../schemas/documents.js";
import { asMcpText, fail, ok } from "../utils/responses.js";
import type { AppConfig } from "../config/env.js";

function validatePayloadSize(content: string, maxBytes: number): void {
  const size = Buffer.byteLength(content, "utf8");
  if (size > maxBytes) {
    throw new IrisError("PAYLOAD_TOO_LARGE", `Class content exceeds ${maxBytes} bytes`);
  }
}

function assertWritableClass(className: string): void {
  if (isProtectedClassName(className)) {
    throw new IrisError("PROTECTED_CLASS", "Refusing to modify protected system class");
  }
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

export function createClassToolHandlers(client: AtelierClient, config: AppConfig) {
  return {
    async listClasses(input: unknown) {
      try {
        const values = asInputObject(input);
        const parsed = listClassesSchema;
        const packageName = parsed.package?.parse(values.package);
        const limit = parsed.limit?.parse(values.limit);
        const classes = await client.listClasses({ package: packageName, limit });
        return asMcpText(ok({ classes }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getClass(input: unknown) {
      try {
        const values = asInputObject(input);
        const parsed = getClassSchema.className.parse(values.className);
        const doc = await client.getClass(parsed);
        return asMcpText(ok({ className: parsed, document: doc, content: doc.content.join("\n") }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async saveClass(input: unknown) {
      try {
        const values = asInputObject(input);
        const className = saveClassSchema.className.parse(values.className);
        const content = saveClassSchema.content.parse(values.content);
        assertWritableClass(className);
        validatePayloadSize(content, config.MAX_SOURCE_PAYLOAD_BYTES);
        const doc = await client.saveClass(className, content);
        return asMcpText(ok({ className, document: doc }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async compileClass(input: unknown) {
      try {
        const values = asInputObject(input);
        const className = compileClassSchema.className.parse(values.className);
        const result = await client.compileClass(className);
        return asMcpText(ok({ className, ...result }));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

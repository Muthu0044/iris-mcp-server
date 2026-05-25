import type { AtelierClient } from "../iris/atelierClient.js";
import { mapUnknownError } from "../iris/errors.js";
import { getDocumentIndexSchema } from "../schemas/documents.js";
import { asMcpText, fail, ok } from "../utils/responses.js";

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

export function createMetadataToolHandlers(client: AtelierClient) {
  return {
    async getNamespaceMetadata() {
      try {
        const metadata = await client.getNamespaceMetadata();
        return asMcpText(ok({ metadata }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async getDocumentIndex(input: unknown) {
      try {
        const values = asInputObject(input);
        const documentName = getDocumentIndexSchema.documentName.parse(values.documentName);
        const index = await client.getDocumentIndex(documentName);
        return asMcpText(ok({ documentName, index }));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

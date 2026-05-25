import type { AtelierClient } from "../iris/atelierClient.js";
import { mapUnknownError } from "../iris/errors.js";
import { searchTextSchema } from "../schemas/documents.js";
import { asMcpText, fail, ok } from "../utils/responses.js";

function asInputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mcpError(error: unknown) {
  const mapped = mapUnknownError(error);
  return asMcpText(fail(mapped.code, mapped.message, mapped.details));
}

export function createSearchToolHandlers(client: AtelierClient) {
  return {
    async searchText(input: unknown) {
      try {
        const values = asInputObject(input);
        const result = await client.searchText({
          query: searchTextSchema.query.parse(values.query),
          documents: searchTextSchema.documents.parse(values.documents),
          regex: searchTextSchema.regex.parse(values.regex),
          includeSystem: searchTextSchema.includeSystem.parse(values.includeSystem),
          includeGenerated: searchTextSchema.includeGenerated.parse(values.includeGenerated),
          max: searchTextSchema.max.parse(values.max),
          wholeWord: searchTextSchema.wholeWord.parse(values.wholeWord),
          caseSensitive: searchTextSchema.caseSensitive.parse(values.caseSensitive),
          wildcards: searchTextSchema.wildcards.parse(values.wildcards)
        });
        return asMcpText(ok(result));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

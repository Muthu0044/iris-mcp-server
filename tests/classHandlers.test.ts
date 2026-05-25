import { describe, expect, it } from "vitest";
import type { AppConfig } from "../src/config/env.js";
import type { AtelierClient } from "../src/iris/atelierClient.js";
import { createClassToolHandlers } from "../src/tools/classes.js";

const config = {
  MAX_SOURCE_PAYLOAD_BYTES: 100
} as AppConfig;

function parseToolText(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as unknown;
}

describe("class tool handlers", () => {
  it("joins class source lines for get_class", async () => {
    const client = {
      async getClass() {
        return {
          name: "User.Test.cls",
          db: "USER",
          ts: "1",
          cat: "CLS",
          status: "",
          enc: false,
          content: ["Class User.Test", "{", "}"]
        };
      }
    } as AtelierClient;

    const handlers = createClassToolHandlers(client, config);
    const response = parseToolText(await handlers.getClass({ className: "User.Test" }));

    expect(response).toMatchObject({
      success: true,
      data: {
        className: "User.Test",
        content: "Class User.Test\n{\n}"
      }
    });
  });

  it("blocks writes to protected classes", async () => {
    const client = {} as AtelierClient;
    const handlers = createClassToolHandlers(client, config);
    const response = parseToolText(await handlers.saveClass({ className: "%SYS.Test", content: "Class %SYS.Test {}" }));

    expect(response).toMatchObject({
      success: false,
      error: {
        code: "PROTECTED_CLASS"
      }
    });
  });
});

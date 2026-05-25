import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../src/config/env.js";
import { AtelierClient } from "../src/iris/atelierClient.js";
import type { Logger } from "../src/utils/logger.js";

const request = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({ request })),
    isAxiosError: vi.fn(() => false)
  },
  isAxiosError: vi.fn(() => false)
}));

const config = {
  IRIS_BASE_URL: "http://localhost/api/atelier/",
  IRIS_API_VERSION: "v8",
  IRIS_NAMESPACE: "user",
  IRIS_USERNAME: "superuser",
  IRIS_PASSWORD: "sys",
  IRIS_REQUEST_TIMEOUT_MS: 10000,
  IRIS_MAX_RETRIES: 0
} as AppConfig;

const logger = {
  debug: vi.fn(),
  error: vi.fn()
} as unknown as Logger;

describe("AtelierClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the same docnames route as the working Atelier curl for listing classes", async () => {
    request.mockResolvedValueOnce({
      status: 200,
      data: {
        status: { errors: [], summary: "" },
        console: [],
        result: {
          content: [
            { name: "User.Test.cls", cat: "CLS", ts: "1", db: "USER" },
            { name: "User.Other.mac", cat: "RTN", ts: "1", db: "USER" }
          ]
        }
      }
    });

    const client = new AtelierClient(config, logger);
    const result = await client.listClasses({});

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "v8/user/docnames"
      })
    );
    expect(result).toEqual([{ name: "User.Test.cls", cat: "CLS", ts: "1", db: "USER" }]);
  });

  it("saves classes using Atelier's JSON document body", async () => {
    request.mockResolvedValueOnce({
      status: 200,
      data: {
        status: { errors: [], summary: "" },
        console: [],
        result: {
          name: "User.Test.cls",
          db: "USER",
          ts: "1",
          cat: "CLS",
          status: "",
          enc: false,
          content: []
        }
      }
    });

    const client = new AtelierClient(config, logger);
    await client.saveClass("User.Test", "Class User.Test\r\n{\r\n}");

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        url: "v8/user/doc/User.Test.cls",
        params: { ignoreConflict: 1 },
        headers: { "Content-Type": "application/json" },
        data: {
          enc: false,
          content: ["Class User.Test", "{", "}"]
        }
      })
    );
  });

  it("saves routines using the same Atelier JSON document body", async () => {
    request.mockResolvedValueOnce({
      status: 200,
      data: {
        status: { errors: [], summary: "" },
        console: [],
        result: {
          name: "MyRoutine.mac",
          db: "USER",
          ts: "1",
          cat: "RTN",
          status: "",
          enc: false,
          content: []
        }
      }
    });

    const client = new AtelierClient(config, logger);
    await client.saveRoutine("MyRoutine", "MyRoutine ;\n quit");

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        url: "v8/user/doc/MyRoutine.mac",
        params: { ignoreConflict: 1 },
        headers: { "Content-Type": "application/json" },
        data: {
          enc: false,
          content: ["MyRoutine ;", " quit"]
        }
      })
    );
  });

  it("searches source with Atelier search query params", async () => {
    request.mockResolvedValueOnce({
      status: 200,
      data: {
        status: { errors: [], summary: "" },
        console: ["Searching"],
        result: [{ doc: "User.Test.cls", matches: [] }]
      }
    });

    const client = new AtelierClient(config, logger);
    await client.searchText({ query: "Email", regex: false, max: 50 });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "v8/user/action/search",
        params: expect.objectContaining({
          query: "Email",
          documents: "*.cls,*.mac,*.int,*.inc",
          regex: 0,
          max: 50
        })
      })
    );
  });

  it("requests document index metadata through action/index", async () => {
    request.mockResolvedValueOnce({
      status: 200,
      data: {
        status: { errors: [], summary: "" },
        console: [],
        result: { content: [{ name: "User.Test.cls" }] }
      }
    });

    const client = new AtelierClient(config, logger);
    await client.getDocumentIndex("User.Test.cls");

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "v8/user/action/index",
        headers: { "Content-Type": "application/json" },
        data: ["User.Test.cls"]
      })
    );
  });

  it("configures axios with the configured Atelier base URL", () => {
    new AtelierClient(config, logger);

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "http://localhost/api/atelier/"
      })
    );
  });
});

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  IRIS_BASE_URL: z.string().url().default("http://localhost:52773/api/atelier/"),
  IRIS_API_VERSION: z.string().regex(/^v\d+$/i).default("v8"),
  IRIS_NAMESPACE: z.string().min(1).default("USER"),
  IRIS_USERNAME: z.string().min(1),
  IRIS_PASSWORD: z.string().min(1),
  IRIS_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  IRIS_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(1),
  LOG_LEVEL: z.string().default("info"),
  MCP_SERVER_NAME: z.string().min(1).default("iris-mcp-server"),
  MCP_SERVER_VERSION: z.string().min(1).default("1.0.0"),
  MAX_SOURCE_PAYLOAD_BYTES: z.coerce.number().int().positive().default(1024 * 1024)
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}

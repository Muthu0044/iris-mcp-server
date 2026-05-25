import { loadConfig } from "./config/env.js";
import { createLogger } from "./utils/logger.js";
import { startHttpServer } from "./server/http.js";
import { startStdioServer } from "./server/stdio.js";

const config = loadConfig();
const logger = createLogger(config);

const stdio = process.argv.includes("--stdio");

if (stdio) {
  await startStdioServer(config, logger);
} else {
  await startHttpServer(config, logger);
}

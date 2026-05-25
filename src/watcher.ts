import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import { loadConfig } from "./config/env.js";
import { AtelierClient } from "./iris/atelierClient.js";
import { createLogger } from "./utils/logger.js";

function getDocumentNameForLocalPath(workspace: string, localPath: string): string {
  const relPath = path.relative(workspace, localPath);
  const parts = relPath.split(path.sep);
  const fileName = parts.pop();
  if (!fileName) return "";
  
  const ext = fileName.split(".").pop();
  if (ext && ext.toLowerCase() === "cls") {
    // Reconstruct ClassName
    const className = fileName.substring(0, fileName.lastIndexOf(".cls"));
    return parts.length > 0 ? `${parts.join(".")}.${className}.cls` : `${className}.cls`;
  }
  return fileName;
}

async function startWatcher() {
  const config = loadConfig();
  const logger = createLogger(config);
  const client = new AtelierClient(config, logger);
  const workspace = path.resolve(config.IRIS_LOCAL_WORKSPACE);

  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
    logger.info(`Created local workspace directory at ${workspace}`);
  }

  logger.info(`Starting IRIS Workspace Sync Watcher in: ${workspace}`);

  const watcher = chokidar.watch(workspace, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // do not upload everything on startup
  });

  const syncFileToIris = async (filePath: string) => {
    try {
      const docName = getDocumentNameForLocalPath(workspace, filePath);
      if (!docName) return;

      const content = fs.readFileSync(filePath, "utf-8");
      
      if (docName.toLowerCase().endsWith(".cls")) {
        await client.saveClass(docName, content);
        logger.info(`Synced Class: ${docName}`);
      } else {
        await client.saveRoutine(docName, content);
        logger.info(`Synced Routine: ${docName}`);
      }
    } catch (error: any) {
      logger.error(`Error syncing ${filePath} to IRIS: ${error.message}`);
    }
  };

  watcher
    .on('add', syncFileToIris)
    .on('change', syncFileToIris)
    .on('error', error => logger.error(`Watcher error: ${error}`));
}

startWatcher().catch(console.error);

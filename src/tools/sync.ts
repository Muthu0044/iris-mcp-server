import fs from "fs";
import path from "path";
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

function getLocalPathForDocument(workspace: string, docName: string): string {
  // If it's a class e.g., User.Test.cls, replace dots before the extension with slashes
  const parts = docName.split(".");
  const ext = parts.pop();
  if (ext && ext.toLowerCase() === "cls") {
    return path.join(workspace, ...parts) + "." + ext;
  }
  // For routines, just return the name
  return path.join(workspace, docName);
}

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

export function createSyncToolHandlers(client: AtelierClient, config: AppConfig) {
  const defaultWorkspace = config.IRIS_LOCAL_WORKSPACE;

  return {
    async syncFromIris(input: unknown) {
      try {
        const values = asInputObject(input);
        const workspace = (values.workspacePath as string) || defaultWorkspace;
        const pkg = values.package as string | undefined;
        const limit = values.limit as number | undefined;

        if (!fs.existsSync(workspace)) {
          fs.mkdirSync(workspace, { recursive: true });
        }

        const descriptors = await client.listClasses({ package: pkg, limit });
        const syncedFiles: string[] = [];

        for (const doc of descriptors) {
          if (doc.gen) continue; // Skip generated files
          let document;
          try {
            document = await client.getClass(doc.name); // Routine or Class, getClass uses docPath
          } catch (e: any) {
            if (e.statusCode === 404) continue; // Some system files appear in /docnames but lack fetchable source code
            throw e;
          }

          const localFilePath = getLocalPathForDocument(workspace, doc.name);
          const dir = path.dirname(localFilePath);
          
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          const contentString = document.content.join("\n");
          fs.writeFileSync(localFilePath, contentString, "utf-8");
          syncedFiles.push(localFilePath);
        }

        return asMcpText(ok({ syncedCount: syncedFiles.length, files: syncedFiles }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async syncToIris(input: unknown) {
      try {
        const values = asInputObject(input);
        const workspace = (values.workspacePath as string) || defaultWorkspace;
        const targetPath = values.path as string | undefined;

        if (!fs.existsSync(workspace)) {
          return asMcpText(fail("WORKSPACE_NOT_FOUND", "Local workspace directory does not exist."));
        }

        let filesToSync: string[] = [];
        if (targetPath) {
          const absolutePath = path.resolve(targetPath);
          if (fs.existsSync(absolutePath)) {
            if (fs.statSync(absolutePath).isDirectory()) {
              // Read directory recursively
              const readDir = (dir: string) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                  const fullPath = path.join(dir, item);
                  if (fs.statSync(fullPath).isDirectory()) readDir(fullPath);
                  else filesToSync.push(fullPath);
                }
              };
              readDir(absolutePath);
            } else {
              filesToSync.push(absolutePath);
            }
          }
        } else {
           const readDir = (dir: string) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const fullPath = path.join(dir, item);
              if (fs.statSync(fullPath).isDirectory()) readDir(fullPath);
              else filesToSync.push(fullPath);
            }
          };
          readDir(workspace);
        }

        const syncedDocuments: string[] = [];

        for (const file of filesToSync) {
          const content = fs.readFileSync(file, "utf-8");
          const docName = getDocumentNameForLocalPath(workspace, file);
          if (!docName) continue;
          
          if (docName.toLowerCase().endsWith(".cls")) {
            await client.saveClass(docName, content);
          } else {
            await client.saveRoutine(docName, content);
          }
          syncedDocuments.push(docName);
        }

        return asMcpText(ok({ syncedCount: syncedDocuments.length, documents: syncedDocuments }));
      } catch (error) {
        return mcpError(error);
      }
    },

    async compareIrisFile(input: unknown) {
      try {
        const values = asInputObject(input);
        const workspace = (values.workspacePath as string) || defaultWorkspace;
        const localPath = values.localPath as string;
        const absolutePath = path.resolve(localPath);

        if (!fs.existsSync(absolutePath)) {
           return asMcpText(fail("FILE_NOT_FOUND", "Local file does not exist."));
        }

        const localContent = fs.readFileSync(absolutePath, "utf-8");
        const docName = getDocumentNameForLocalPath(workspace, absolutePath);
        
        if (!docName) {
           return asMcpText(fail("INVALID_PATH", "Could not derive IRIS document name from local path."));
        }

        let remoteContent = "";
        try {
          const document = docName.toLowerCase().endsWith(".cls") 
            ? await client.getClass(docName) 
            : await client.getRoutine(docName);
          remoteContent = document.content.join("\n");
        } catch (e: any) {
          if (e.statusCode === 404) {
             remoteContent = "<FILE_NOT_FOUND_ON_SERVER>";
          } else {
             throw e;
          }
        }

        return asMcpText(ok({ 
          documentName: docName,
          localContent,
          remoteContent,
          isMatch: localContent === remoteContent
        }));
      } catch (error) {
        return mcpError(error);
      }
    }
  };
}

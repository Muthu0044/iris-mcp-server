import { z } from "zod";

export const classNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^%?[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*(?:\.cls)?$/i, "Invalid IRIS class name");

export const packageSchema = z
  .string()
  .trim()
  .regex(/^%?[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*$/i, "Invalid IRIS package name")
  .optional();

export const listClassesSchema = {
  package: packageSchema,
  limit: z.number().int().positive().max(1000).optional()
};

export const getClassSchema = {
  className: classNameSchema
};

export const saveClassSchema = {
  className: classNameSchema,
  content: z.string().min(1, "Class content cannot be empty")
};

export const compileClassSchema = {
  className: classNameSchema
};

export const deleteClassSchema = {
  className: classNameSchema
};

export const routineNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z%][A-Za-z0-9.%]*(?:\.(?:mac|int|inc|bas|mvi|mvb))?$/i, "Invalid IRIS routine name");

export const getRoutineSchema = {
  routineName: routineNameSchema
};

export const saveRoutineSchema = {
  routineName: routineNameSchema,
  content: z.string().min(1, "Routine content cannot be empty")
};

export const deleteRoutineSchema = {
  routineName: routineNameSchema
};

export const searchTextSchema = {
  query: z.string().min(1),
  documents: z.string().min(1).optional(),
  regex: z.boolean().optional(),
  includeSystem: z.boolean().optional(),
  includeGenerated: z.boolean().optional(),
  max: z.number().int().positive().max(1000).optional(),
  wholeWord: z.boolean().optional(),
  caseSensitive: z.boolean().optional(),
  wildcards: z.boolean().optional()
};

export const documentNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^%?[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*\.(?:cls|mac|int|inc|bas|mvi|mvb|csp)$/i, "Invalid IRIS document name");

export const getDocumentIndexSchema = {
  documentName: documentNameSchema
};

export const runSqlQuerySchema = {
  query: z.string().min(1, "SQL query cannot be empty"),
  parameters: z.array(z.union([z.string(), z.number(), z.boolean()])).optional()
};

export const getEnsClassesSchema = {
  type: z.enum(["service", "process", "operation"])
};

export const getEnsAdapterSchema = {
  name: classNameSchema
};

export const getCspAppsSchema = {
  namespace: z.string().optional()
};

export const searchMessagesSchema = {
  sessionId: z.string().optional(),
  source: z.string().optional(),
  target: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(50)
};

export const getMessageTraceSchema = {
  sessionId: z.string().describe("The SessionId to trace.")
};

export const syncFromIrisSchema = {
  workspacePath: z.string().optional().describe("Optional absolute path to the local workspace directory where files should be synced. If omitted, uses the server's default workspace."),
  package: z.string().optional().describe("Optional package to filter (e.g. 'User')"),
  limit: z.number().int().min(1).optional().describe("Optional limit to the number of classes fetched")
};

export const syncToIrisSchema = {
  workspacePath: z.string().optional().describe("Optional absolute path to the local workspace directory. If omitted, uses the server's default workspace."),
  path: z.string().optional().describe("Optional specific file or folder path to sync to IRIS")
};

export const compareIrisFileSchema = {
  workspacePath: z.string().optional().describe("Optional absolute path to the local workspace directory. If omitted, uses the server's default workspace."),
  localPath: z.string().describe("The local file path to compare against the IRIS server version")
};

export function isProtectedClassName(className: string): boolean {
  const normalized = className.replace(/\.cls$/i, "");
  return normalized.startsWith("%SYS.") || normalized.startsWith("%Dictionary.") || normalized === "%SYS";
}

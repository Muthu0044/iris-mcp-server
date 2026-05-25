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

export function isProtectedClassName(className: string): boolean {
  const normalized = className.replace(/\.cls$/i, "");
  return normalized.startsWith("%SYS.") || normalized.startsWith("%Dictionary.") || normalized === "%SYS";
}

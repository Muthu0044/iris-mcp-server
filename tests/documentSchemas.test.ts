import { describe, expect, it } from "vitest";
import { classNameSchema, documentNameSchema, isProtectedClassName, routineNameSchema } from "../src/schemas/documents.js";

describe("document schemas", () => {
  it("accepts normal and percent-prefixed class names", () => {
    expect(classNameSchema.parse("User.MyClass")).toBe("User.MyClass");
    expect(classNameSchema.parse("%Atelier.REST.cls")).toBe("%Atelier.REST.cls");
  });

  it("rejects unsafe class names", () => {
    expect(() => classNameSchema.parse("../User.MyClass")).toThrow();
    expect(() => classNameSchema.parse("User/MyClass")).toThrow();
  });

  it("detects protected system classes", () => {
    expect(isProtectedClassName("%SYS.Foo")).toBe(true);
    expect(isProtectedClassName("%Dictionary.ClassDefinition")).toBe(true);
    expect(isProtectedClassName("User.MyClass")).toBe(false);
  });

  it("accepts routine and document names for new tools", () => {
    expect(routineNameSchema.parse("MyRoutine")).toBe("MyRoutine");
    expect(routineNameSchema.parse("MyRoutine.int")).toBe("MyRoutine.int");
    expect(documentNameSchema.parse("User.Test.cls")).toBe("User.Test.cls");
    expect(documentNameSchema.parse("MyRoutine.mac")).toBe("MyRoutine.mac");
  });
});

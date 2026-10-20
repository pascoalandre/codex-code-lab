import { describe, expect, it } from "vitest";
import { classifyStatus, needsInput, parseDiagnostics, prepareSource } from "./csharp";

describe("prepareSource", () => {
  it("leaves classic programs with Main untouched", () => {
    const code = "using System;\nclass P { static void Main() { Console.WriteLine(1); } }";
    const r = prepareSource(code);
    expect(r.wrapped).toBe(false);
    expect(r.source).toBe(code);
  });

  it("wraps top-level statements into a generated Main", () => {
    const r = prepareSource('Console.WriteLine("Olá");');
    expect(r.wrapped).toBe(true);
    expect(r.source).toContain("static void Main(string[] args)");
    expect(r.source).toContain("using System;");
  });

  it("maps every generated statement line back to the user's line", () => {
    const code = "using System;\n\nint a = 2;\nConsole.WriteLine(a);";
    const r = prepareSource(code);
    const gen = r.source.split("\n");
    const idx = gen.indexOf("Console.WriteLine(a);");
    expect(r.lineMap[idx]).toBe(4);
  });

  it("moves top-level functions out of Main as static methods", () => {
    const code = "Console.WriteLine(Dobro(2));\nint Dobro(int x) => x * 2;";
    const src = prepareSource(code).source;
    expect(src).toContain("static int Dobro(int x) => x * 2;");
    const mainStart = src.indexOf("Main(string[] args) {");
    const mainEnd = src.indexOf("\n}", mainStart);
    expect(src.slice(mainStart, mainEnd)).not.toContain("Dobro(int x)");
  });

  it("keeps class declarations outside the generated program class", () => {
    const code = "var p = new Ponto();\nclass Ponto { public int X; }";
    const gen = prepareSource(code).source.split("\n");
    expect(gen.at(-1)).toBe("class Ponto { public int X; }");
    expect(gen.at(-2)).toBe("}");
  });

  it("does not add a using the user already wrote", () => {
    const r = prepareSource("using System.Linq;\nConsole.WriteLine(1);");
    expect(r.source.match(/using System\.Linq;/g)?.length).toBe(1);
  });
});

describe("parseDiagnostics", () => {
  it("reads line, column, code and severity", () => {
    const out = "Main.cs(4,10): error CS1002: ; expected\nCompilation failed: 1 error(s)";
    const [d] = parseDiagnostics(out);
    expect(d).toMatchObject({ line: 4, column: 10, severity: "error", code: "CS1002" });
  });

  it("reports errors of wrapped programs on the original line", () => {
    const prepared = prepareSource("using System;\n\nint x = ;");
    const genLine = prepared.source.split("\n").indexOf("int x = ;") + 1;
    const [d] = parseDiagnostics(`Main.cs(${genLine},9): error CS1525: Unexpected symbol`, prepared);
    expect(d.line).toBe(3);
    expect(d.column).toBe(9);
  });
});

describe("needsInput", () => {
  it("detects Console.ReadLine", () => {
    expect(needsInput("var n = Console.ReadLine();")).toBe(true);
  });
  it("ignores reads inside comments", () => {
    expect(needsInput("// Console.ReadLine();\nConsole.WriteLine(1);")).toBe(false);
  });
});

describe("classifyStatus", () => {
  it("maps engine statuses", () => {
    expect(classifyStatus(3)).toBe("success");
    expect(classifyStatus(6)).toBe("compile-error");
    expect(classifyStatus(5)).toBe("timeout");
    expect(classifyStatus(11)).toBe("runtime-error");
  });
});

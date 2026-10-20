import { describe, expect, it } from "vitest";
import {
  classifyStatus,
  needsInput,
  parseDiagnostics,
  prepareSource,
  WRAPPER_HEADER,
} from "./csharp";

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

  it("keeps user lines on the same line numbers", () => {
    const code = 'using System;\n\nint a = 2;\nConsole.WriteLine(a);';
    const r = prepareSource(code);
    expect(r.source.split("\n")[3]).toBe("Console.WriteLine(a);");
  });

  it("keeps class declarations outside the generated Main", () => {
    const code = "var p = new Ponto();\nclass Ponto { public int X; }";
    const lines = prepareSource(code).source.split("\n");
    expect(lines[1].startsWith("} } class Ponto")).toBe(true);
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

  it("subtracts the wrapper prefix from the column of the first statement", () => {
    const prepared = prepareSource("using System;\nint x = ;");
    const col = WRAPPER_HEADER.length + 9;
    const [d] = parseDiagnostics(`Main.cs(2,${col}): error CS1525: Unexpected symbol`, prepared);
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

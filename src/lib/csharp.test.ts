import { describe, expect, it } from "vitest";
import {
  classifyStatus,
  needsInput,
  parseDiagnostics,
  parseTranscript,
  transcriptText,
  WAIT_MARK,
  prepareModernSource,
  prepareSource,
  stripDigitSeparators,
  toCompilerSource,
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
    expect(d?.line).toBe(3);
    expect(d?.column).toBe(9);
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

describe("toCompilerSource", () => {
  it("removes digit separators from numbers but not from strings", () => {
    const out = stripDigitSeparators('long a = 9_000_000L; var s = "1_000"; // 2_000');
    expect(out).toBe('long a = 9000000L; var s = "1_000"; // 2_000');
  });
  it("keeps identifiers that contain underscores", () => {
    expect(stripDigitSeparators("int x1_2 = 3_0;")).toBe("int x1_2 = 30;");
  });
  it("prefixes a byte order mark so emoji compile", () => {
    expect(toCompilerSource("x").charCodeAt(0)).toBe(0xfeff);
  });
});

describe("prepareModernSource", () => {
  it("keeps the user's code intact after the implicit usings", () => {
    const code = 'string s = 5 switch { >= 5 => "a", _ => "b" };';
    const r = prepareModernSource(code);
    expect(r.source).toContain("#line 1\n" + code + "\n");
    expect(r.source).toContain("global using System.Linq;");
  });
});

describe("dotnet diagnostics", () => {
  it("drops the repeated summary copy and the project suffix", () => {
    const line = "/box/Main.cs(6,9): error CS0029: Cannot convert [/box/Main.csproj]";
    const d = parseDiagnostics(`${line}\nBuild FAILED.\n${line}`, prepareModernSource("a\nb\nc\nd\ne\nf"));
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ line: 6, column: 9, message: "Cannot convert" });
  });
});

describe("console input", () => {
  it("pauses for typed input only in interactive mode", () => {
    expect(prepareModernSource("var n = Console.ReadLine();", { interactive: true }).source).toContain(
      "internal const bool Interactive = true;",
    );
    expect(prepareModernSource("var n = Console.ReadLine();").source).toContain("internal const bool Interactive = false;");
  });

  it("seeds new Random() so replays after each typed line give the same numbers", () => {
    const src = prepareModernSource("var r = new Random();", { seed: 77 }).source;
    expect(src).toContain("global using Random = global::__CodexRandom;");
    expect(src).toContain("internal const int Seed = 77;");
  });

  it("points the Random alias into a file-scoped namespace", () => {
    const src = prepareModernSource("namespace App;\nclass P { static void Main() {} }").source;
    expect(src).toContain("global using Random = global::App.__CodexRandom;");
  });

  it("leaves Random alone when the user declares their own", () => {
    expect(prepareModernSource("class Random {}").source).not.toContain("global using Random");
  });

  it("shows typed input in place and detects when the program waits", () => {
    const out = "Nome: \u0002Ana\u0003\nOlá Ana\nIdade: " + WAIT_MARK;
    const t = parseTranscript(out);
    expect(t.waiting).toBe(true);
    expect(t.parts).toEqual([
      { kind: "out", text: "Nome: " },
      { kind: "in", text: "Ana" },
      { kind: "out", text: "Olá Ana\nIdade: " },
    ]);
    expect(transcriptText(out)).toBe("Nome: Ana\nOlá Ana\nIdade: ");
  });

  it("finished programs are not waiting", () => {
    expect(parseTranscript("Olá\n").waiting).toBe(false);
  });
});

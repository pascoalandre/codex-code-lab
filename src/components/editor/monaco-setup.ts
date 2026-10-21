import type { Monaco } from "@monaco-editor/react";
import { EDITOR_PALETTES, type ThemeId } from "@/lib/themes";

export const LANGUAGE_ID = "csharp-codex";

let registered = false;

const KEYWORDS = [
  "abstract", "as", "base", "checked", "class", "const", "delegate", "enum", "event", "explicit",
  "extern", "false", "fixed", "implicit", "interface", "internal", "is", "lock", "namespace", "new",
  "null", "operator", "out", "override", "params", "private", "protected", "public", "readonly",
  "ref", "sealed", "sizeof", "stackalloc", "static", "struct", "this", "true", "typeof", "unchecked",
  "unsafe", "using", "virtual", "volatile", "get", "set", "value", "partial", "where", "async",
  "nameof", "when", "from", "select", "orderby", "group", "by", "into", "let", "join", "on",
  "equals", "ascending", "descending", "global", "init", "record", "with",
];
const CONTROL = [
  "if", "else", "switch", "case", "default", "for", "foreach", "while", "do", "break", "continue",
  "return", "goto", "throw", "try", "catch", "finally", "yield", "await", "in",
];
const TYPE_KEYWORDS = [
  "bool", "byte", "char", "decimal", "double", "float", "int", "long", "object", "sbyte", "short",
  "string", "uint", "ulong", "ushort", "void", "var", "dynamic",
];

interface Member {
  name: string;
  detail: string;
  snippet?: string;
  kind?: "method" | "property";
}

const MEMBERS: Record<string, Member[]> = {
  Console: [
    { name: "WriteLine", detail: "Escreve uma linha na saída", snippet: "WriteLine($0);" },
    { name: "Write", detail: "Escreve sem quebra de linha", snippet: "Write($0);" },
    { name: "ReadLine", detail: "Lê uma linha da entrada", snippet: "ReadLine()" },
    { name: "Read", detail: "Lê o próximo carácter", snippet: "Read()" },
    { name: "ReadKey", detail: "Lê uma tecla", snippet: "ReadKey()" },
    { name: "Clear", detail: "Limpa a consola", snippet: "Clear();" },
    { name: "ForegroundColor", detail: "Cor do texto", kind: "property" },
    { name: "Out", detail: "TextWriter da saída padrão", kind: "property" },
  ],
  Math: [
    "Abs", "Acos", "Asin", "Atan", "Atan2", "Ceiling", "Cos", "Cosh", "Exp", "Floor", "Log", "Log10",
    "Max", "Min", "Pow", "Round", "Sign", "Sin", "Sinh", "Sqrt", "Tan", "Tanh", "Truncate",
  ]
    .map((n): Member => ({ name: n, detail: `Math.${n}(…)`, snippet: `${n}($0)` }))
    .concat([
      { name: "PI", detail: "π = 3.14159…", kind: "property" },
      { name: "E", detail: "e = 2.71828…", kind: "property" },
    ]),
  string: [
    { name: "Join", detail: "Junta elementos com separador", snippet: 'Join(", ", $0)' },
    { name: "Format", detail: "Formata texto", snippet: 'Format("$0")' },
    { name: "IsNullOrEmpty", detail: "Verifica nulo ou vazio", snippet: "IsNullOrEmpty($0)" },
    { name: "IsNullOrWhiteSpace", detail: "Verifica nulo ou espaços", snippet: "IsNullOrWhiteSpace($0)" },
    { name: "Concat", detail: "Concatena", snippet: "Concat($0)" },
    { name: "Empty", detail: "String vazia", kind: "property" },
  ],
  int: [
    { name: "Parse", detail: "Converte texto em int", snippet: "Parse($0)" },
    { name: "TryParse", detail: "Tenta converter texto", snippet: "TryParse($1, out int ${2:valor})" },
    { name: "MaxValue", detail: "2147483647", kind: "property" },
    { name: "MinValue", detail: "-2147483648", kind: "property" },
  ],
  double: [
    { name: "Parse", detail: "Converte texto em double", snippet: "Parse($0)" },
    { name: "TryParse", detail: "Tenta converter texto", snippet: "TryParse($1, out double ${2:valor})" },
    { name: "NaN", detail: "Não é um número", kind: "property" },
    { name: "PositiveInfinity", detail: "+∞", kind: "property" },
  ],
  Convert: ["ToInt32", "ToInt64", "ToDouble", "ToDecimal", "ToString", "ToBoolean", "ToChar"].map((n) => ({
    name: n,
    detail: `Convert.${n}(…)`,
    snippet: `${n}($0)`,
  })),
  Array: ["Sort", "Reverse", "IndexOf", "BinarySearch", "Copy", "Resize", "Fill", "Clear", "Exists", "Find"].map(
    (n) => ({ name: n, detail: `Array.${n}(…)`, snippet: `${n}($0)` }),
  ),
  Enumerable: ["Range", "Repeat", "Empty"].map((n) => ({ name: n, detail: `Enumerable.${n}(…)`, snippet: `${n}($0)` })),
  BigInteger: ["Pow", "ModPow", "Parse", "GreatestCommonDivisor", "Abs", "Max", "Min"].map((n) => ({
    name: n,
    detail: `BigInteger.${n}(…)`,
    snippet: `${n}($0)`,
  })),
};

const INSTANCE_MEMBERS = [
  "Length", "Count", "Add", "AddRange", "Remove", "RemoveAt", "Insert", "Contains", "IndexOf", "Clear",
  "ToString", "ToUpper", "ToLower", "Trim", "Split", "Substring", "Replace", "StartsWith", "EndsWith",
  "Where", "Select", "OrderBy", "OrderByDescending", "GroupBy", "First", "FirstOrDefault", "Last",
  "Any", "All", "Sum", "Average", "Min", "Max", "Distinct", "Take", "Skip", "ToList", "ToArray",
  "ToDictionary", "Aggregate", "Reverse", "Sort", "ForEach", "ContainsKey", "TryGetValue", "Keys",
  "Values", "GetLength", "Push", "Pop", "Peek", "Enqueue", "Dequeue", "Equals", "GetHashCode",
];

const SNIPPETS: { label: string; detail: string; body: string }[] = [
  { label: "cw", detail: "Console.WriteLine", body: "Console.WriteLine($0);" },
  { label: "crl", detail: "Ler linha da entrada", body: "string ${1:entrada} = Console.ReadLine();" },
  { label: "lerint", detail: "Ler um inteiro", body: "int ${1:n} = int.Parse(Console.ReadLine());" },
  { label: "lerdouble", detail: "Ler um número real", body: "double ${1:x} = double.Parse(Console.ReadLine().Replace(',', '.'), System.Globalization.CultureInfo.InvariantCulture);" },
  { label: "for", detail: "Ciclo for", body: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++)\n{\n\t$0\n}" },
  { label: "forr", detail: "Ciclo for invertido", body: "for (int ${1:i} = ${2:n} - 1; ${1:i} >= 0; ${1:i}--)\n{\n\t$0\n}" },
  { label: "foreach", detail: "Ciclo foreach", body: "foreach (var ${1:item} in ${2:colecao})\n{\n\t$0\n}" },
  { label: "while", detail: "Ciclo while", body: "while (${1:condicao})\n{\n\t$0\n}" },
  { label: "do", detail: "Ciclo do-while", body: "do\n{\n\t$0\n} while (${1:condicao});" },
  { label: "if", detail: "Condição if", body: "if (${1:condicao})\n{\n\t$0\n}" },
  { label: "ife", detail: "if / else", body: "if (${1:condicao})\n{\n\t$2\n}\nelse\n{\n\t$0\n}" },
  { label: "switch", detail: "switch", body: "switch (${1:valor})\n{\n\tcase ${2:1}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}" },
  { label: "try", detail: "try / catch", body: "try\n{\n\t$1\n}\ncatch (Exception ex)\n{\n\tConsole.WriteLine(ex.Message);$0\n}" },
  { label: "class", detail: "Nova classe", body: "class ${1:MinhaClasse}\n{\n\t$0\n}" },
  { label: "prop", detail: "Propriedade automática", body: "public ${1:int} ${2:Propriedade} { get; set; }" },
  { label: "ctor", detail: "Construtor", body: "public ${1:Classe}()\n{\n\t$0\n}" },
  { label: "method", detail: "Método estático", body: "static ${1:void} ${2:Metodo}(${3})\n{\n\t$0\n}" },
  { label: "svm", detail: "static void Main", body: "static void Main(string[] args)\n{\n\t$0\n}" },
  { label: "matriz", detail: "Matriz 2D com ciclo", body: "int[,] ${1:m} = new int[${2:3}, ${3:3}];\nfor (int i = 0; i < ${1:m}.GetLength(0); i++)\n\tfor (int j = 0; j < ${1:m}.GetLength(1); j++)\n\t\t${1:m}[i, j] = $0;" },
  { label: "vetor", detail: "Vetor com leitura", body: "int[] ${1:v} = Console.ReadLine().Split(' ').Select(int.Parse).ToArray();" },
  { label: "list", detail: "Nova lista", body: "var ${1:lista} = new List<${2:int}>();" },
  { label: "dict", detail: "Novo dicionário", body: "var ${1:mapa} = new Dictionary<${2:string}, ${3:int}>();" },
  { label: "programa", detail: "Programa completo", body: "using System;\n\nclass Program\n{\n\tstatic void Main(string[] args)\n\t{\n\t\t$0\n\t}\n}" },
];

const TYPES = [
  "Console", "Math", "Convert", "String", "List", "Dictionary", "HashSet", "Queue", "Stack", "Array",
  "Enumerable", "DateTime", "TimeSpan", "Random", "StringBuilder", "Exception", "ArgumentException",
  "InvalidOperationException", "BigInteger", "Complex", "Tuple", "Func", "Action", "Task",
  "CultureInfo", "Stopwatch", "KeyValuePair", "IEnumerable", "IComparable", "LinkedList", "SortedDictionary",
];

function defineThemes(monaco: Monaco) {
  for (const [id, p] of Object.entries(EDITOR_PALETTES)) {
    const strip = (h: string) => h.replace("#", "");
    monaco.editor.defineTheme(id, {
      base: p.base,
      inherit: true,
      rules: [
        { token: "", foreground: strip(p.fg) },
        { token: "keyword", foreground: strip(p.keyword) },
        { token: "keyword.control", foreground: strip(p.control) },
        { token: "keyword.type", foreground: strip(p.typeKw) },
        { token: "keyword.preprocessor", foreground: strip(p.comment) },
        { token: "type", foreground: strip(p.type) },
        { token: "function", foreground: strip(p.fn) },
        { token: "identifier", foreground: strip(p.fg) },
        { token: "string", foreground: strip(p.string) },
        { token: "string.escape", foreground: strip(p.number) },
        { token: "delimiter.interp", foreground: strip(p.keyword) },
        { token: "number", foreground: strip(p.number) },
        { token: "comment", foreground: strip(p.comment), fontStyle: "italic" },
        { token: "operator", foreground: strip(p.punct) },
        { token: "delimiter", foreground: strip(p.punct) },
      ],
      colors: {
        "editor.background": p.bg,
        "editor.foreground": p.fg,
        "editor.lineHighlightBackground": p.lineHighlight,
        "editor.lineHighlightBorder": "#00000000",
        "editor.selectionBackground": p.selection,
        "editorLineNumber.foreground": p.gutter,
        "editorLineNumber.activeForeground": p.fg,
        "editorCursor.foreground": p.cursor,
        "editorGutter.background": p.bg,
        "editorIndentGuide.background1": p.lineHighlight,
        "scrollbarSlider.background": p.selection,
        "minimap.background": p.bg,
      },
    });
  }
}

export function setupMonaco(monaco: Monaco) {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: LANGUAGE_ID, extensions: [".cs"], aliases: ["C#", "csharp"] });

  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"', notIn: ["string", "comment"] },
      { open: "'", close: "'", notIn: ["string", "comment"] },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],
    indentationRules: {
      increaseIndentPattern: /^.*\{[^}"']*$/,
      decreaseIndentPattern: /^\s*\}/,
    },
    onEnterRules: [
      {
        beforeText: /^\s*\/\/\/.*$/,
        action: { indentAction: monaco.languages.IndentAction.None, appendText: "/// " },
      },
    ],
  });

  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    defaultToken: "",
    tokenPostfix: ".cs",
    keywords: KEYWORDS,
    controlKeywords: CONTROL,
    typeKeywords: TYPE_KEYWORDS,
    symbols: /[=><!~?:&|+\-*/^%]+/,
    escapes: /\\(?:[abfnrtv\\"'0]|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/^\s*#\w+.*$/, "keyword.preprocessor"],
        [/\$@"|@\$"/, { token: "string", next: "@interpVerbatim" }],
        [/\$"/, { token: "string", next: "@interpolated" }],
        [/@"/, { token: "string", next: "@verbatim" }],
        [/"/, { token: "string", next: "@string" }],
        [/[A-Z]\w*(?=\s*(?:<[\w\s,<>[\]]*>)?\s*\()/, "function"],
        [
          /[a-z_]\w*(?=\s*\()/,
          {
            cases: {
              "@controlKeywords": "keyword.control",
              "@typeKeywords": "keyword.type",
              "@keywords": "keyword",
              "@default": "function",
            },
          },
        ],
        [/[A-Z]\w*/, "type"],
        [
          /[a-z_@]\w*/,
          {
            cases: {
              "@controlKeywords": "keyword.control",
              "@typeKeywords": "keyword.type",
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],
        { include: "@whitespace" },
        [/[{}()[\]]/, "@brackets"],
        [/@symbols/, "operator"],
        [/0[xX][0-9a-fA-F_]+[lLuU]*/, "number"],
        [/0[bB][01_]+[lLuU]*/, "number"],
        [/\d[\d_]*\.\d[\d_]*([eE][-+]?\d+)?[fFdDmM]?/, "number"],
        [/\d[\d_]*([eE][-+]?\d+)?[lLuUfFdDmM]*/, "number"],
        [/[;,.]/, "delimiter"],
        [/'[^\\']'/, "string"],
        [/'(@escapes)'/, "string"],
        [/'/, "string"],
      ],
      whitespace: [
        [/[ \t\r\n]+/, ""],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
      verbatim: [
        [/[^"]+/, "string"],
        [/""/, "string.escape"],
        [/"/, "string", "@pop"],
      ],
      interpolated: [
        [/[^\\"{]+/, "string"],
        [/\{\{/, "string.escape"],
        [/\{/, { token: "delimiter.interp", next: "@interpExpr" }],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
      interpVerbatim: [
        [/[^"{]+/, "string"],
        [/\{\{/, "string.escape"],
        [/\{/, { token: "delimiter.interp", next: "@interpExpr" }],
        [/""/, "string.escape"],
        [/"/, "string", "@pop"],
      ],
      interpExpr: [
        [/\}/, { token: "delimiter.interp", next: "@pop" }],
        [/:[^}"]*(?=\})/, "string.escape"],
        { include: "root" },
      ],
    },
  } as Parameters<Monaco["languages"]["setMonarchTokensProvider"]>[1]);

  const K = monaco.languages.CompletionItemKind;
  const InsertAsSnippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    triggerCharacters: ["."],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1);
      const member = before.match(/([A-Za-z_]\w*)\s*\.\s*$/);

      if (member) {
        const owner = member[1] === "String" ? "string" : member[1];
        const list = MEMBERS[owner];
        if (list) {
          return {
            suggestions: list.map((m) => ({
              label: m.name,
              kind: m.kind === "property" ? K.Property : K.Method,
              detail: m.detail,
              insertText: m.snippet ?? m.name,
              ...(m.snippet ? { insertTextRules: InsertAsSnippet } : {}),
              range,
            })),
          };
        }
        return {
          suggestions: INSTANCE_MEMBERS.map((n) => ({
            label: n,
            kind: /^[A-Z][a-z]+$/.test(n) && ["Length", "Count", "Keys", "Values"].includes(n) ? K.Property : K.Method,
            insertText: n,
            range,
          })),
        };
      }

      return {
        suggestions: [
          ...SNIPPETS.map((s) => ({
            label: s.label,
            kind: K.Snippet,
            detail: s.detail,
            documentation: s.body.replace(/\$\{\d+:([^}]+)\}/g, "$1").replace(/\$\d/g, ""),
            insertText: s.body,
            insertTextRules: InsertAsSnippet,
            range,
          })),
          ...[...KEYWORDS, ...CONTROL].map((k) => ({ label: k, kind: K.Keyword, insertText: k, range })),
          ...TYPE_KEYWORDS.map((k) => ({ label: k, kind: K.Keyword, insertText: k, range })),
          ...TYPES.map((t) => ({ label: t, kind: K.Class, insertText: t, range })),
        ],
      };
    },
  });

  defineThemes(monaco);
}

export function monacoThemeFor(id: ThemeId): string {
  return id;
}

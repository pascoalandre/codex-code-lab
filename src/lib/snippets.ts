/**
 * Tab snippets for the editor: type the word, then press Tab.
 * `$0` marks where the cursor lands; `\t` is one indentation level.
 */
export const SNIPPETS: Record<string, string> = {
  cw: "Console.WriteLine($0);",
  crl: "string entrada = Console.ReadLine();$0",
  lerint: "int n = int.Parse(Console.ReadLine());$0",
  lerdouble: "double x = double.Parse(Console.ReadLine());$0",
  for: "for (int i = 0; i < n; i++)\n{\n\t$0\n}",
  forr: "for (int i = n - 1; i >= 0; i--)\n{\n\t$0\n}",
  foreach: "foreach (var item in colecao)\n{\n\t$0\n}",
  while: "while (condicao)\n{\n\t$0\n}",
  do: "do\n{\n\t$0\n} while (condicao);",
  if: "if (condicao)\n{\n\t$0\n}",
  ife: "if (condicao)\n{\n\t$0\n}\nelse\n{\n\t\n}",
  switch: "switch (valor)\n{\n\tcase 1:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}",
  try: "try\n{\n\t$0\n}\ncatch (Exception ex)\n{\n\tConsole.WriteLine(ex.Message);\n}",
  class: "class MinhaClasse\n{\n\t$0\n}",
  prop: "public int Propriedade { get; set; }$0",
  svm: "static void Main(string[] args)\n{\n\t$0\n}",
  matriz: "int[,] m = new int[3, 3];\nfor (int i = 0; i < m.GetLength(0); i++)\n\tfor (int j = 0; j < m.GetLength(1); j++)\n\t\tm[i, j] = $0;",
  vetor: "int[] v = Console.ReadLine().Split(' ').Select(int.Parse).ToArray();$0",
  list: "var lista = new List<int>();$0",
  dict: "var mapa = new Dictionary<string, int>();$0",
  programa: "using System;\n\nclass Program\n{\n\tstatic void Main(string[] args)\n\t{\n\t\t$0\n\t}\n}",
};

/** Expands a snippet body for the given indentation; returns text and cursor offset. */
export function expandSnippet(body: string, indent: string, unit = "    "): { text: string; cursor: number } {
  const lines = body.split("\n").map((l, i) => (i === 0 ? "" : indent) + l.replace(/\t/g, unit));
  const joined = lines.join("\n");
  const at = joined.indexOf("$0");
  const text = joined.replace("$0", "");
  return { text, cursor: at === -1 ? text.length : at };
}

export type ExampleCategory =
  | "Fundamentos"
  | "Entrada de dados"
  | "Vetores"
  | "Matrizes"
  | "Matemática"
  | "Strings"
  | "POO"
  | "Coleções & LINQ"
  | "Algoritmos";

export type Level = "Iniciante" | "Intermédio" | "Avançado";

export interface Example {
  id: string;
  title: string;
  category: ExampleCategory;
  level: Level;
  description: string;
  stdin?: string;
  code: string;
}

export const CATEGORIES: ExampleCategory[] = [
  "Fundamentos",
  "Entrada de dados",
  "Vetores",
  "Matrizes",
  "Matemática",
  "Strings",
  "POO",
  "Coleções & LINQ",
  "Algoritmos",
];

const r = String.raw;

export const EXAMPLES: Example[] = [
  {
    id: "ola-mundo",
    title: "Olá, Mundo!",
    category: "Fundamentos",
    level: "Iniciante",
    description: "O primeiro programa: estrutura de uma aplicação de consola em C#.",
    code: r`using System;

namespace CSharpCodex
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Olá, Mundo! Bem-vindo ao C# Codex.");
            Console.WriteLine("Hoje é " + DateTime.Now.ToString("dd/MM/yyyy"));

            for (int i = 3; i > 0; i--)
            {
                Console.WriteLine($"Contagem: {i}...");
            }
            Console.WriteLine("Descolar! 🚀");
        }
    }
}
`,
  },
  {
    id: "tipos-operadores",
    title: "Tipos, variáveis e operadores",
    category: "Fundamentos",
    level: "Iniciante",
    description: "Tipos primitivos, conversões, operadores aritméticos e formatação de saída.",
    code: r`using System;

class Program
{
    static void Main()
    {
        int inteiro = 42;
        long grande = 9_000_000_000L;
        double real = 3.14159;
        decimal dinheiro = 1250.75m;
        bool verdade = true;
        char letra = 'C';
        string texto = "Codex";

        Console.WriteLine("=== Tipos primitivos ===");
        Console.WriteLine($"int      -> {inteiro}  (máx: {int.MaxValue})");
        Console.WriteLine($"long     -> {grande}");
        Console.WriteLine($"double   -> {real:F2}");
        Console.WriteLine($"decimal  -> {dinheiro:N2} Kz");
        Console.WriteLine($"bool     -> {verdade}");
        Console.WriteLine($"char     -> {letra} (código {(int)letra})");
        Console.WriteLine($"string   -> {texto} ({texto.Length} letras)");

        Console.WriteLine("\n=== Operadores ===");
        int a = 17, b = 5;
        Console.WriteLine($"{a} + {b} = {a + b}");
        Console.WriteLine($"{a} - {b} = {a - b}");
        Console.WriteLine($"{a} * {b} = {a * b}");
        Console.WriteLine($"{a} / {b} = {a / b}  (divisão inteira)");
        Console.WriteLine($"{a} % {b} = {a % b}  (resto)");
        Console.WriteLine($"{a} / {b} = {(double)a / b:F3}  (divisão real)");

        Console.WriteLine("\n=== Conversões ===");
        string numeroTexto = "123";
        int convertido = int.Parse(numeroTexto);
        Console.WriteLine($"\"{numeroTexto}\" + 1 = {convertido + 1}");
        Console.WriteLine($"Arredondar 2.567 -> {Math.Round(2.567, 2)}");
        Console.WriteLine($"Teto de 4.1 -> {Math.Ceiling(4.1)} | Piso -> {Math.Floor(4.9)}");
    }
}
`,
  },
  {
    id: "estilo-moderno",
    title: "C# moderno (instruções de topo)",
    category: "Fundamentos",
    level: "Iniciante",
    description: "Escreva sem classe nem Main: o C# Codex trata da estrutura automaticamente.",
    code: r`// Sem "class Program" nem "static void Main": o Codex gera a estrutura por si.
var linguagens = new List<string> { "C#", "F#", "TypeScript", "Python" };

Console.WriteLine("Linguagens favoritas:");
foreach (var l in linguagens.OrderBy(x => x))
    Console.WriteLine($"  • {l}");

Console.WriteLine($"\nQuadrado de 12 = {Quadrado(12)}");
Console.WriteLine($"Soma de 1 a 100 = {Enumerable.Range(1, 100).Sum()}");

var p = new Ponto(3, 4);
Console.WriteLine($"Distância de {p} à origem = {p.Distancia():F2}");

int Quadrado(int x) => x * x;

class Ponto
{
    public double X { get; }
    public double Y { get; }
    public Ponto(double x, double y) { X = x; Y = y; }
    public double Distancia() => Math.Sqrt(X * X + Y * Y);
    public override string ToString() => $"({X}, {Y})";
}
`,
  },
  {
    id: "calculadora",
    title: "Calculadora interactiva",
    category: "Entrada de dados",
    level: "Iniciante",
    description: "Lê dois números e uma operação do utilizador, com validação de entrada.",
    stdin: "12,5\n4\n*",
    code: r`using System;
using System.Globalization;

class Program
{
    static double LerNumero(string mensagem)
    {
        Console.Write(mensagem);
        string entrada = Console.ReadLine() ?? "";
        double valor;
        // Aceita vírgula ou ponto como separador decimal
        if (!double.TryParse(entrada.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out valor))
        {
            Console.WriteLine($"\n'{entrada}' não é um número válido. A usar 0.");
            return 0;
        }
        Console.WriteLine(valor);
        return valor;
    }

    static void Main()
    {
        Console.WriteLine("╔══════════════════════════╗");
        Console.WriteLine("║   CALCULADORA C# CODEX   ║");
        Console.WriteLine("╚══════════════════════════╝");

        double a = LerNumero("Primeiro número: ");
        double b = LerNumero("Segundo número: ");
        Console.Write("Operação (+ - * / ^): ");
        string op = (Console.ReadLine() ?? "+").Trim();
        Console.WriteLine(op);

        double resultado;
        switch (op)
        {
            case "+": resultado = a + b; break;
            case "-": resultado = a - b; break;
            case "*": resultado = a * b; break;
            case "^": resultado = Math.Pow(a, b); break;
            case "/":
                if (b == 0) { Console.WriteLine("Erro: divisão por zero!"); return; }
                resultado = a / b; break;
            default:
                Console.WriteLine("Operação desconhecida."); return;
        }

        Console.WriteLine($"\nResultado: {a} {op} {b} = {resultado:0.####}");
    }
}
`,
  },
  {
    id: "media-notas",
    title: "Média de notas do aluno",
    category: "Entrada de dados",
    level: "Iniciante",
    description: "Lê o nome e várias notas, calcula a média e a situação final.",
    stdin: "Ana Lopes\n4\n14\n16,5\n12\n18",
    code: r`using System;
using System.Globalization;

class Program
{
    static void Main()
    {
        Console.Write("Nome do aluno: ");
        string nome = Console.ReadLine();
        Console.WriteLine(nome);

        Console.Write("Quantas notas? ");
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine(n);

        double[] notas = new double[n];
        double soma = 0;

        for (int i = 0; i < n; i++)
        {
            Console.Write($"Nota {i + 1} (0-20): ");
            notas[i] = double.Parse(Console.ReadLine().Replace(',', '.'), CultureInfo.InvariantCulture);
            Console.WriteLine(notas[i]);
            soma += notas[i];
        }

        double media = soma / n;
        string situacao = media >= 10 ? "APROVADO ✅" : media >= 7 ? "EXAME ⚠️" : "REPROVADO ❌";

        Console.WriteLine("\n──────── Boletim ────────");
        Console.WriteLine($"Aluno:     {nome}");
        Console.WriteLine($"Notas:     {string.Join(" | ", notas)}");
        Console.WriteLine($"Média:     {media:F2} valores");
        Console.WriteLine($"Situação:  {situacao}");
    }
}
`,
  },
  {
    id: "tabuada",
    title: "Tabuada formatada",
    category: "Entrada de dados",
    level: "Iniciante",
    description: "Lê um número e imprime a sua tabuada com alinhamento em colunas.",
    stdin: "7",
    code: r`using System;

class Program
{
    static void Main()
    {
        Console.Write("Tabuada de que número? ");
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine(n + "\n");

        for (int i = 1; i <= 10; i++)
        {
            Console.WriteLine($"{n,3} x {i,2} = {n * i,4}");
        }
    }
}
`,
  },
  {
    id: "vetor-estatisticas",
    title: "Estatística de um vetor",
    category: "Vetores",
    level: "Intermédio",
    description: "Lê N valores e calcula mínimo, máximo, média, mediana, moda e desvio padrão.",
    stdin: "10\n4 8 15 16 23 42 8 4 8 15",
    code: r`using System;
using System.Linq;

class Program
{
    static void Main()
    {
        Console.Write("Quantidade de valores: ");
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine(n);

        Console.Write("Valores (separados por espaço): ");
        int[] v = Console.ReadLine()
            .Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
            .Take(n)
            .Select(int.Parse)
            .ToArray();
        Console.WriteLine(string.Join(" ", v));

        int[] ordenado = (int[])v.Clone();
        Array.Sort(ordenado);

        double media = v.Average();
        double mediana = n % 2 == 1
            ? ordenado[n / 2]
            : (ordenado[n / 2 - 1] + ordenado[n / 2]) / 2.0;
        double desvio = Math.Sqrt(v.Sum(x => Math.Pow(x - media, 2)) / n);
        var moda = v.GroupBy(x => x).OrderByDescending(g => g.Count()).First();

        Console.WriteLine("\n┌────────────────┬──────────┐");
        Console.WriteLine($"│ Mínimo         │ {v.Min(),8} │");
        Console.WriteLine($"│ Máximo         │ {v.Max(),8} │");
        Console.WriteLine($"│ Soma           │ {v.Sum(),8} │");
        Console.WriteLine($"│ Média          │ {media,8:F2} │");
        Console.WriteLine($"│ Mediana        │ {mediana,8:F2} │");
        Console.WriteLine($"│ Moda           │ {moda.Key,8} │");
        Console.WriteLine($"│ Desvio padrão  │ {desvio,8:F3} │");
        Console.WriteLine("└────────────────┴──────────┘");
        Console.WriteLine($"Ordenado: [{string.Join(", ", ordenado)}]");
    }
}
`,
  },
  {
    id: "ordenacao",
    title: "Algoritmos de ordenação",
    category: "Vetores",
    level: "Intermédio",
    description: "Bubble, Selection, Insertion e Quick Sort com contagem de comparações + pesquisa binária.",
    code: r`using System;

class Program
{
    static long comparacoes;

    static void Bubble(int[] a)
    {
        for (int i = 0; i < a.Length - 1; i++)
            for (int j = 0; j < a.Length - 1 - i; j++)
            {
                comparacoes++;
                if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
            }
    }

    static void Selection(int[] a)
    {
        for (int i = 0; i < a.Length - 1; i++)
        {
            int min = i;
            for (int j = i + 1; j < a.Length; j++) { comparacoes++; if (a[j] < a[min]) min = j; }
            int t = a[i]; a[i] = a[min]; a[min] = t;
        }
    }

    static void Insertion(int[] a)
    {
        for (int i = 1; i < a.Length; i++)
        {
            int chave = a[i], j = i - 1;
            while (j >= 0 && ++comparacoes > 0 && a[j] > chave) { a[j + 1] = a[j]; j--; }
            a[j + 1] = chave;
        }
    }

    static void Quick(int[] a, int lo, int hi)
    {
        if (lo >= hi) return;
        int pivo = a[(lo + hi) / 2], i = lo, j = hi;
        while (i <= j)
        {
            while (++comparacoes > 0 && a[i] < pivo) i++;
            while (++comparacoes > 0 && a[j] > pivo) j--;
            if (i <= j) { int t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; }
        }
        Quick(a, lo, j); Quick(a, i, hi);
    }

    static int PesquisaBinaria(int[] a, int alvo)
    {
        int lo = 0, hi = a.Length - 1;
        while (lo <= hi)
        {
            int meio = (lo + hi) / 2;
            if (a[meio] == alvo) return meio;
            if (a[meio] < alvo) lo = meio + 1; else hi = meio - 1;
        }
        return -1;
    }

    static void Testar(string nome, Action<int[]> algoritmo, int[] original)
    {
        int[] copia = (int[])original.Clone();
        comparacoes = 0;
        var sw = System.Diagnostics.Stopwatch.StartNew();
        algoritmo(copia);
        sw.Stop();
        Console.WriteLine($"{nome,-12} {comparacoes,12:N0} comparações  {sw.Elapsed.TotalMilliseconds,8:F2} ms");
    }

    static void Main()
    {
        var rnd = new Random(2026);
        int[] dados = new int[3000];
        for (int i = 0; i < dados.Length; i++) dados[i] = rnd.Next(1, 100000);

        Console.WriteLine($"A ordenar {dados.Length} números aleatórios...\n");
        Testar("Bubble", Bubble, dados);
        Testar("Selection", Selection, dados);
        Testar("Insertion", Insertion, dados);
        Testar("QuickSort", a => Quick(a, 0, a.Length - 1), dados);

        int[] ord = (int[])dados.Clone();
        Array.Sort(ord);
        int alvo = ord[1234];
        Console.WriteLine($"\nPesquisa binária por {alvo}: índice {PesquisaBinaria(ord, alvo)}");
        Console.WriteLine($"Primeiros 10: {string.Join(", ", ord, 0, 10)}");
    }
}
`,
  },
  {
    id: "matriz-operacoes",
    title: "Operações com matrizes",
    category: "Matrizes",
    level: "Intermédio",
    description: "Leitura de matrizes, soma, multiplicação, transposta, diagonais e traço.",
    stdin: "3\n2 -1 0\n4 3 5\n1 0 7\n1 2 3\n0 1 4\n5 6 0",
    code: r`using System;
using System.Linq;

class Program
{
    static int[,] LerMatriz(int n, string nome)
    {
        var m = new int[n, n];
        Console.WriteLine($"Matriz {nome} ({n}x{n}), uma linha por vez:");
        for (int i = 0; i < n; i++)
        {
            int[] linha = Console.ReadLine().Split(' ').Select(int.Parse).ToArray();
            for (int j = 0; j < n; j++) m[i, j] = linha[j];
        }
        return m;
    }

    static void Imprimir(string titulo, int[,] m)
    {
        Console.WriteLine($"\n{titulo}");
        int n = m.GetLength(0), c = m.GetLength(1);
        for (int i = 0; i < n; i++)
        {
            Console.Write(i == 0 ? "┌" : i == n - 1 ? "└" : "│");
            for (int j = 0; j < c; j++) Console.Write($"{m[i, j],6}");
            Console.WriteLine(i == 0 ? "  ┐" : i == n - 1 ? "  ┘" : "  │");
        }
    }

    static int[,] Multiplicar(int[,] a, int[,] b)
    {
        int n = a.GetLength(0), m = b.GetLength(1), k = a.GetLength(1);
        var r = new int[n, m];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < m; j++)
                for (int x = 0; x < k; x++)
                    r[i, j] += a[i, x] * b[x, j];
        return r;
    }

    static void Main()
    {
        Console.Write("Ordem das matrizes: ");
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine(n);
        var A = LerMatriz(n, "A");
        var B = LerMatriz(n, "B");

        var soma = new int[n, n];
        var transposta = new int[n, n];
        int traco = 0, diagSec = 0;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
            {
                soma[i, j] = A[i, j] + B[i, j];
                transposta[j, i] = A[i, j];
                if (i == j) traco += A[i, j];
                if (i + j == n - 1) diagSec += A[i, j];
            }

        Imprimir("A", A);
        Imprimir("B", B);
        Imprimir("A + B", soma);
        Imprimir("A × B", Multiplicar(A, B));
        Imprimir("Aᵀ (transposta)", transposta);
        Console.WriteLine($"\nTraço de A: {traco} | Diagonal secundária: {diagSec}");
    }
}
`,
  },
  {
    id: "determinante-inversa",
    title: "Determinante e matriz inversa",
    category: "Matrizes",
    level: "Avançado",
    description: "Eliminação de Gauss-Jordan com pivotagem parcial para calcular det(A) e A⁻¹.",
    code: r`using System;

class Program
{
    static void Imprimir(double[,] m, string titulo)
    {
        Console.WriteLine(titulo);
        for (int i = 0; i < m.GetLength(0); i++)
        {
            for (int j = 0; j < m.GetLength(1); j++) Console.Write($"{m[i, j],10:F4}");
            Console.WriteLine();
        }
        Console.WriteLine();
    }

    static double Determinante(double[,] origem)
    {
        int n = origem.GetLength(0);
        var a = (double[,])origem.Clone();
        double det = 1;
        for (int col = 0; col < n; col++)
        {
            int pivo = col;
            for (int i = col + 1; i < n; i++)
                if (Math.Abs(a[i, col]) > Math.Abs(a[pivo, col])) pivo = i;
            if (Math.Abs(a[pivo, col]) < 1e-12) return 0;
            if (pivo != col)
            {
                for (int j = 0; j < n; j++) { double t = a[col, j]; a[col, j] = a[pivo, j]; a[pivo, j] = t; }
                det = -det;
            }
            det *= a[col, col];
            for (int i = col + 1; i < n; i++)
            {
                double f = a[i, col] / a[col, col];
                for (int j = col; j < n; j++) a[i, j] -= f * a[col, j];
            }
        }
        return det;
    }

    static double[,] Inversa(double[,] m)
    {
        int n = m.GetLength(0);
        var a = new double[n, 2 * n];
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++) a[i, j] = m[i, j];
            a[i, n + i] = 1;
        }
        for (int col = 0; col < n; col++)
        {
            int pivo = col;
            for (int i = col + 1; i < n; i++)
                if (Math.Abs(a[i, col]) > Math.Abs(a[pivo, col])) pivo = i;
            for (int j = 0; j < 2 * n; j++) { double t = a[col, j]; a[col, j] = a[pivo, j]; a[pivo, j] = t; }
            double p = a[col, col];
            for (int j = 0; j < 2 * n; j++) a[col, j] /= p;
            for (int i = 0; i < n; i++)
            {
                if (i == col) continue;
                double f = a[i, col];
                for (int j = 0; j < 2 * n; j++) a[i, j] -= f * a[col, j];
            }
        }
        var inv = new double[n, n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) inv[i, j] = a[i, n + j];
        return inv;
    }

    static void Main()
    {
        double[,] A =
        {
            { 4, 7, 2 },
            { 3, 6, 1 },
            { 2, 5, 3 }
        };

        Imprimir(A, "Matriz A:");
        double det = Determinante(A);
        Console.WriteLine($"det(A) = {det:F4}\n");

        if (Math.Abs(det) < 1e-12) { Console.WriteLine("A matriz é singular (não tem inversa)."); return; }

        var inv = Inversa(A);
        Imprimir(inv, "A⁻¹:");

        // Verificação: A × A⁻¹ deve ser a identidade
        int n = A.GetLength(0);
        var I = new double[n, n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                for (int k = 0; k < n; k++) I[i, j] += A[i, k] * inv[k, j];
        Imprimir(I, "Verificação A × A⁻¹ (identidade):");
    }
}
`,
  },
  {
    id: "sistema-linear",
    title: "Sistema de equações lineares",
    category: "Matemática",
    level: "Avançado",
    description: "Resolve Ax = b por eliminação de Gauss com retro-substituição, lendo os dados da entrada.",
    stdin: "3\n2 1 -1 8\n-3 -1 2 -11\n-2 1 2 -3",
    code: r`using System;
using System.Linq;
using System.Globalization;

class Program
{
    static void Main()
    {
        Console.Write("Número de incógnitas: ");
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine(n);
        Console.WriteLine("Introduza cada equação como: a1 a2 ... an b");

        var m = new double[n, n + 1];
        for (int i = 0; i < n; i++)
        {
            var linha = Console.ReadLine().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => double.Parse(s.Replace(',', '.'), CultureInfo.InvariantCulture)).ToArray();
            for (int j = 0; j <= n; j++) m[i, j] = linha[j];
            Console.WriteLine("  " + string.Join(" ", linha));
        }

        // Eliminação com pivotagem parcial
        for (int k = 0; k < n; k++)
        {
            int p = k;
            for (int i = k + 1; i < n; i++) if (Math.Abs(m[i, k]) > Math.Abs(m[p, k])) p = i;
            if (Math.Abs(m[p, k]) < 1e-12) { Console.WriteLine("Sistema impossível ou indeterminado."); return; }
            for (int j = 0; j <= n; j++) { double t = m[k, j]; m[k, j] = m[p, j]; m[p, j] = t; }
            for (int i = k + 1; i < n; i++)
            {
                double f = m[i, k] / m[k, k];
                for (int j = k; j <= n; j++) m[i, j] -= f * m[k, j];
            }
        }

        var x = new double[n];
        for (int i = n - 1; i >= 0; i--)
        {
            double s = m[i, n];
            for (int j = i + 1; j < n; j++) s -= m[i, j] * x[j];
            x[i] = s / m[i, i];
        }

        Console.WriteLine("\nSolução:");
        for (int i = 0; i < n; i++) Console.WriteLine($"  x{i + 1} = {x[i],10:F4}");
    }
}
`,
  },
  {
    id: "primos-crivo",
    title: "Números primos (Crivo de Eratóstenes)",
    category: "Matemática",
    level: "Intermédio",
    description: "Encontra todos os primos até 1 milhão, primos gémeos e factorização.",
    code: r`using System;
using System.Collections.Generic;
using System.Diagnostics;

class Program
{
    static bool[] Crivo(int limite)
    {
        var composto = new bool[limite + 1];
        composto[0] = composto[1] = true;
        for (long i = 2; i * i <= limite; i++)
            if (!composto[i])
                for (long j = i * i; j <= limite; j += i) composto[j] = true;
        return composto;
    }

    static List<long> Fatorar(long n)
    {
        var fatores = new List<long>();
        for (long d = 2; d * d <= n; d++)
            while (n % d == 0) { fatores.Add(d); n /= d; }
        if (n > 1) fatores.Add(n);
        return fatores;
    }

    static void Main()
    {
        const int LIMITE = 1_000_000;
        var sw = Stopwatch.StartNew();
        var composto = Crivo(LIMITE);
        sw.Stop();

        int total = 0, gemeos = 0, ultimo = 0;
        var primeiros = new List<int>();
        for (int i = 2; i <= LIMITE; i++)
        {
            if (composto[i]) continue;
            total++;
            if (primeiros.Count < 20) primeiros.Add(i);
            if (i + 2 <= LIMITE && !composto[i + 2]) gemeos++;
            ultimo = i;
        }

        Console.WriteLine($"Primos até {LIMITE:N0}: {total:N0} (calculado em {sw.ElapsedMilliseconds} ms)");
        Console.WriteLine($"Primeiros 20: {string.Join(", ", primeiros)}");
        Console.WriteLine($"Maior primo encontrado: {ultimo:N0}");
        Console.WriteLine($"Pares de primos gémeos: {gemeos:N0}");

        Console.WriteLine("\nFactorização:");
        foreach (long n in new long[] { 360, 9973, 123456789, 600851475143 })
            Console.WriteLine($"  {n,15:N0} = {string.Join(" × ", Fatorar(n))}");
    }
}
`,
  },
  {
    id: "numeros-gigantes",
    title: "Números gigantes (BigInteger)",
    category: "Matemática",
    level: "Intermédio",
    description: "Fatorial de 100, Fibonacci 300, potências enormes e soma de dígitos com precisão arbitrária.",
    code: r`using System;
using System.Linq;
using System.Numerics;

class Program
{
    static BigInteger Fatorial(int n)
    {
        BigInteger r = 1;
        for (int i = 2; i <= n; i++) r *= i;
        return r;
    }

    static BigInteger Fibonacci(int n)
    {
        BigInteger a = 0, b = 1;
        for (int i = 0; i < n; i++) { var t = a + b; a = b; b = t; }
        return a;
    }

    static void Main()
    {
        var f100 = Fatorial(100);
        Console.WriteLine("100! =");
        Console.WriteLine(f100);
        Console.WriteLine($"→ {f100.ToString().Length} dígitos, soma dos dígitos = {f100.ToString().Sum(c => c - '0')}\n");

        Console.WriteLine($"Fibonacci(300) = {Fibonacci(300)}\n");

        var dois256 = BigInteger.Pow(2, 256);
        Console.WriteLine($"2^256 = {dois256}\n");

        var mod = BigInteger.ModPow(7, 1000000, 1000000007);
        Console.WriteLine($"7^1.000.000 mod 1.000.000.007 = {mod}");

        Console.WriteLine($"MDC(2^64, 6^40) = {BigInteger.GreatestCommonDivisor(BigInteger.Pow(2, 64), BigInteger.Pow(6, 40))}");
    }
}
`,
  },
  {
    id: "equacao-2grau",
    title: "Equação do 2º grau (com complexos)",
    category: "Matemática",
    level: "Intermédio",
    description: "Lê a, b e c, calcula Δ e as raízes reais ou complexas com System.Numerics.Complex.",
    stdin: "1\n-3\n10",
    code: r`using System;
using System.Globalization;
using System.Numerics;

class Program
{
    static double Ler(string nome)
    {
        Console.Write($"{nome} = ");
        double v = double.Parse(Console.ReadLine().Replace(',', '.'), CultureInfo.InvariantCulture);
        Console.WriteLine(v);
        return v;
    }

    static string Fmt(Complex z)
    {
        if (Math.Abs(z.Imaginary) < 1e-12) return z.Real.ToString("0.####");
        return $"{z.Real:0.####} {(z.Imaginary < 0 ? "-" : "+")} {Math.Abs(z.Imaginary):0.####}i";
    }

    static void Main()
    {
        Console.WriteLine("Resolver ax² + bx + c = 0\n");
        double a = Ler("a"), b = Ler("b"), c = Ler("c");

        if (a == 0) { Console.WriteLine("Não é do 2º grau (a = 0)."); return; }

        double delta = b * b - 4 * a * c;
        Console.WriteLine($"\nΔ = b² - 4ac = {delta}");

        Complex raiz = Complex.Sqrt(new Complex(delta, 0));
        Complex x1 = (-b + raiz) / (2 * a);
        Complex x2 = (-b - raiz) / (2 * a);

        if (delta > 0) Console.WriteLine("Duas raízes reais distintas:");
        else if (delta == 0) Console.WriteLine("Uma raiz real dupla:");
        else Console.WriteLine("Duas raízes complexas conjugadas:");

        Console.WriteLine($"  x₁ = {Fmt(x1)}");
        Console.WriteLine($"  x₂ = {Fmt(x2)}");

        double xv = -b / (2 * a), yv = -delta / (4 * a);
        Console.WriteLine($"\nVértice da parábola: ({xv:0.###}, {yv:0.###})");
        Console.WriteLine($"Concavidade: {(a > 0 ? "para cima ∪" : "para baixo ∩")}");
    }
}
`,
  },
  {
    id: "fracoes",
    title: "Frações, MDC e MMC",
    category: "Matemática",
    level: "Intermédio",
    description: "Struct Fracao com sobrecarga de operadores, simplificação automática e MDC/MMC.",
    code: r`using System;

struct Fracao
{
    public long Num { get; }
    public long Den { get; }

    public Fracao(long num, long den)
    {
        if (den == 0) throw new DivideByZeroException("Denominador zero");
        if (den < 0) { num = -num; den = -den; }
        long m = Matematica.Mdc(Math.Abs(num), den);
        Num = num / m; Den = den / m;
    }

    public static Fracao operator +(Fracao a, Fracao b) => new Fracao(a.Num * b.Den + b.Num * a.Den, a.Den * b.Den);
    public static Fracao operator -(Fracao a, Fracao b) => new Fracao(a.Num * b.Den - b.Num * a.Den, a.Den * b.Den);
    public static Fracao operator *(Fracao a, Fracao b) => new Fracao(a.Num * b.Num, a.Den * b.Den);
    public static Fracao operator /(Fracao a, Fracao b) => new Fracao(a.Num * b.Den, a.Den * b.Num);

    public double Valor => (double)Num / Den;
    public override string ToString() => Den == 1 ? Num.ToString() : $"{Num}/{Den}";
}

static class Matematica
{
    public static long Mdc(long a, long b) => b == 0 ? (a == 0 ? 1 : a) : Mdc(b, a % b);
    public static long Mmc(long a, long b) => a / Mdc(a, b) * b;
}

class Program
{
    static void Main()
    {
        var a = new Fracao(3, 4);
        var b = new Fracao(5, 6);

        Console.WriteLine($"a = {a}, b = {b}");
        Console.WriteLine($"a + b = {a + b}");
        Console.WriteLine($"a - b = {a - b}");
        Console.WriteLine($"a × b = {a * b}");
        Console.WriteLine($"a ÷ b = {a / b}  ≈ {(a / b).Valor:F5}");

        Console.WriteLine($"\nMDC(84, 36) = {Matematica.Mdc(84, 36)}");
        Console.WriteLine($"MMC(84, 36) = {Matematica.Mmc(84, 36)}");

        // Série harmónica: 1 + 1/2 + 1/3 + ... + 1/10
        var soma = new Fracao(0, 1);
        for (int i = 1; i <= 10; i++) soma += new Fracao(1, i);
        Console.WriteLine($"\nH(10) = {soma} ≈ {soma.Valor:F6}");
    }
}
`,
  },
  {
    id: "calculo-numerico",
    title: "Cálculo numérico",
    category: "Matemática",
    level: "Avançado",
    description: "Integral por Simpson, raiz por Newton-Raphson, π por Monte Carlo e série de Taylor.",
    code: r`using System;

class Program
{
    static double Simpson(Func<double, double> f, double a, double b, int n)
    {
        if (n % 2 == 1) n++;
        double h = (b - a) / n, s = f(a) + f(b);
        for (int i = 1; i < n; i++) s += f(a + i * h) * (i % 2 == 0 ? 2 : 4);
        return s * h / 3;
    }

    static double Newton(Func<double, double> f, Func<double, double> df, double x0, out int iteracoes)
    {
        double x = x0;
        for (iteracoes = 1; iteracoes <= 100; iteracoes++)
        {
            double proximo = x - f(x) / df(x);
            if (Math.Abs(proximo - x) < 1e-12) return proximo;
            x = proximo;
        }
        return x;
    }

    static double SenoTaylor(double x, int termos)
    {
        double soma = 0, termo = x;
        for (int n = 1; n <= termos; n++)
        {
            soma += termo;
            termo *= -x * x / ((2 * n) * (2 * n + 1));
        }
        return soma;
    }

    static void Main()
    {
        double integral = Simpson(x => Math.Exp(-x * x), 0, 1, 1000);
        Console.WriteLine($"∫₀¹ e^(-x²) dx ≈ {integral:F10}");

        int it;
        double raiz2 = Newton(x => x * x - 2, x => 2 * x, 1, out it);
        Console.WriteLine($"√2 por Newton-Raphson ≈ {raiz2:F12} ({it} iterações)");

        var rnd = new Random(42);
        int dentro = 0, total = 400_000;
        for (int i = 0; i < total; i++)
        {
            double x = rnd.NextDouble(), y = rnd.NextDouble();
            if (x * x + y * y <= 1) dentro++;
        }
        double pi = 4.0 * dentro / total;
        Console.WriteLine($"π por Monte Carlo ≈ {pi:F6} (erro {Math.Abs(pi - Math.PI):E2})");

        Console.WriteLine("\nsen(x) por série de Taylor vs Math.Sin:");
        foreach (double x in new[] { 0.5, 1.0, Math.PI / 2, 3.0 })
            Console.WriteLine($"  x = {x,6:F3}   Taylor = {SenoTaylor(x, 10),12:F9}   Math.Sin = {Math.Sin(x),12:F9}");
    }
}
`,
  },
  {
    id: "strings",
    title: "Manipulação de strings",
    category: "Strings",
    level: "Iniciante",
    description: "Palíndromos, contagem de vogais, inversão, StringBuilder e cifra de César.",
    stdin: "Socorram-me subi no onibus em Marrocos",
    code: r`using System;
using System.Linq;
using System.Text;

class Program
{
    static string Cesar(string texto, int chave)
    {
        var sb = new StringBuilder();
        foreach (char c in texto)
        {
            if (char.IsLetter(c))
            {
                char baseC = char.IsUpper(c) ? 'A' : 'a';
                sb.Append((char)(((c - baseC + chave) % 26 + 26) % 26 + baseC));
            }
            else sb.Append(c);
        }
        return sb.ToString();
    }

    static void Main()
    {
        Console.Write("Escreva uma frase: ");
        string frase = Console.ReadLine();
        Console.WriteLine(frase);

        string limpa = new string(frase.ToLower().Where(char.IsLetterOrDigit).ToArray());
        string invertida = new string(limpa.Reverse().ToArray());

        Console.WriteLine($"\nCaracteres:     {frase.Length}");
        Console.WriteLine($"Palavras:       {frase.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).Length}");
        Console.WriteLine($"Vogais:         {frase.ToLower().Count(c => "aeiouáéíóúâêôãõ".Contains(c))}");
        Console.WriteLine($"Maiúsculas:     {frase.ToUpper()}");
        Console.WriteLine($"Invertida:      {new string(frase.Reverse().ToArray())}");
        Console.WriteLine($"É palíndromo?   {(limpa == invertida ? "Sim ✅" : "Não")}");

        string cifrada = Cesar(frase, 3);
        Console.WriteLine($"\nCifra de César (+3): {cifrada}");
        Console.WriteLine($"Decifrada:           {Cesar(cifrada, -3)}");

        var freq = limpa.GroupBy(c => c).OrderByDescending(g => g.Count()).Take(3);
        Console.WriteLine("\nLetras mais frequentes:");
        foreach (var g in freq) Console.WriteLine($"  '{g.Key}' → {new string('█', g.Count())} {g.Count()}");
    }
}
`,
  },
  {
    id: "poo-banco",
    title: "POO: sistema bancário",
    category: "POO",
    level: "Intermédio",
    description: "Classes abstractas, herança, polimorfismo, interfaces, propriedades e excepções.",
    code: r`using System;
using System.Collections.Generic;

interface IRendimento
{
    void AplicarJuros();
}

abstract class Conta
{
    private static int proximoNumero = 1001;
    public int Numero { get; }
    public string Titular { get; }
    public decimal Saldo { get; protected set; }
    protected readonly List<string> extrato = new List<string>();

    protected Conta(string titular, decimal inicial)
    {
        Numero = proximoNumero++;
        Titular = titular;
        Depositar(inicial);
    }

    public void Depositar(decimal valor)
    {
        if (valor <= 0) throw new ArgumentException("O valor do depósito deve ser positivo.");
        Saldo += valor;
        extrato.Add($"+ {valor,12:N2}  depósito");
    }

    public virtual void Levantar(decimal valor)
    {
        if (valor > Saldo) throw new InvalidOperationException($"Saldo insuficiente na conta {Numero}.");
        Saldo -= valor;
        extrato.Add($"- {valor,12:N2}  levantamento");
    }

    public abstract string Tipo { get; }

    public void ImprimirExtrato()
    {
        Console.WriteLine($"\n[{Tipo}] Nº {Numero} — {Titular}");
        extrato.ForEach(l => Console.WriteLine("   " + l));
        Console.WriteLine($"   Saldo: {Saldo:N2} Kz");
    }
}

class ContaCorrente : Conta
{
    public decimal Taxa { get; } = 50m;
    public ContaCorrente(string t, decimal i) : base(t, i) { }
    public override string Tipo => "Corrente";
    public override void Levantar(decimal valor)
    {
        base.Levantar(valor + Taxa);
    }
}

class ContaPoupanca : Conta, IRendimento
{
    public double TaxaJuro { get; }
    public ContaPoupanca(string t, decimal i, double juro) : base(t, i) { TaxaJuro = juro; }
    public override string Tipo => "Poupança";
    public void AplicarJuros()
    {
        decimal juros = Math.Round(Saldo * (decimal)TaxaJuro, 2);
        Saldo += juros;
        extrato.Add($"+ {juros,12:N2}  juros ({TaxaJuro:P1})");
    }
}

class Program
{
    static void Main()
    {
        var contas = new List<Conta>
        {
            new ContaCorrente("Wizy Safary", 150000m),
            new ContaPoupanca("Maria Santos", 500000m, 0.035)
        };

        contas[0].Levantar(20000m);
        contas[1].Depositar(75000m);

        foreach (var c in contas)
            if (c is IRendimento r) r.AplicarJuros();

        try
        {
            contas[0].Levantar(1_000_000m);
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"⚠ Operação recusada: {ex.Message}");
        }

        contas.ForEach(c => c.ImprimirExtrato());
    }
}
`,
  },
  {
    id: "linq-colecoes",
    title: "Coleções e LINQ",
    category: "Coleções & LINQ",
    level: "Intermédio",
    description: "List, Dictionary, HashSet, Queue, Stack e consultas LINQ com agrupamentos.",
    code: r`using System;
using System.Collections.Generic;
using System.Linq;

class Produto
{
    public string Nome { get; set; }
    public string Categoria { get; set; }
    public decimal Preco { get; set; }
    public int Stock { get; set; }
}

class Program
{
    static void Main()
    {
        var produtos = new List<Produto>
        {
            new Produto { Nome = "Portátil", Categoria = "Informática", Preco = 450000, Stock = 4 },
            new Produto { Nome = "Rato", Categoria = "Informática", Preco = 8500, Stock = 40 },
            new Produto { Nome = "Teclado", Categoria = "Informática", Preco = 15000, Stock = 25 },
            new Produto { Nome = "Telemóvel", Categoria = "Telecom", Preco = 220000, Stock = 10 },
            new Produto { Nome = "Router", Categoria = "Telecom", Preco = 35000, Stock = 0 },
            new Produto { Nome = "Cadeira", Categoria = "Escritório", Preco = 60000, Stock = 7 },
        };

        Console.WriteLine("Produtos acima de 20.000 Kz, por preço:");
        foreach (var p in produtos.Where(p => p.Preco > 20000).OrderByDescending(p => p.Preco))
            Console.WriteLine($"  {p.Nome,-10} {p.Preco,10:N0} Kz");

        Console.WriteLine("\nResumo por categoria:");
        var grupos = produtos.GroupBy(p => p.Categoria)
            .Select(g => new { Categoria = g.Key, Itens = g.Count(), Valor = g.Sum(p => p.Preco * p.Stock) });
        foreach (var g in grupos)
            Console.WriteLine($"  {g.Categoria,-12} {g.Itens} itens   valor em stock: {g.Valor,12:N0} Kz");

        var esgotados = produtos.Where(p => p.Stock == 0).Select(p => p.Nome);
        Console.WriteLine($"\nEsgotados: {string.Join(", ", esgotados)}");

        var indice = produtos.ToDictionary(p => p.Nome.ToLower());
        Console.WriteLine($"Pesquisa 'rato': {indice["rato"].Preco:N0} Kz");

        var fila = new Queue<string>(new[] { "Cliente A", "Cliente B", "Cliente C" });
        var pilha = new Stack<int>(Enumerable.Range(1, 5));
        var unicos = new HashSet<int> { 3, 1, 3, 2, 1 };
        Console.WriteLine($"\nFila → atende {fila.Dequeue()}, restam {fila.Count}");
        Console.WriteLine($"Pilha → topo {pilha.Pop()}, depois {pilha.Peek()}");
        Console.WriteLine($"HashSet sem repetidos: {{ {string.Join(", ", unicos)} }}");
    }
}
`,
  },
  {
    id: "hanoi-recursao",
    title: "Recursão: Hanói e permutações",
    category: "Algoritmos",
    level: "Intermédio",
    description: "Torres de Hanói, permutações de uma palavra e o problema das N rainhas.",
    stdin: "4",
    code: r`using System;
using System.Collections.Generic;

class Program
{
    static int movimentos = 0;

    static void Hanoi(int n, char origem, char destino, char auxiliar)
    {
        if (n == 0) return;
        Hanoi(n - 1, origem, auxiliar, destino);
        movimentos++;
        if (movimentos <= 15) Console.WriteLine($"  {movimentos,2}. disco {n}: {origem} → {destino}");
        Hanoi(n - 1, auxiliar, destino, origem);
    }

    static void Permutar(string prefixo, string resto, List<string> saida)
    {
        if (resto.Length == 0) { saida.Add(prefixo); return; }
        for (int i = 0; i < resto.Length; i++)
            Permutar(prefixo + resto[i], resto.Remove(i, 1), saida);
    }

    static int Rainhas(int linha, int n, bool[] col, bool[] d1, bool[] d2)
    {
        if (linha == n) return 1;
        int total = 0;
        for (int c = 0; c < n; c++)
        {
            if (col[c] || d1[linha + c] || d2[linha - c + n - 1]) continue;
            col[c] = d1[linha + c] = d2[linha - c + n - 1] = true;
            total += Rainhas(linha + 1, n, col, d1, d2);
            col[c] = d1[linha + c] = d2[linha - c + n - 1] = false;
        }
        return total;
    }

    static void Main()
    {
        Console.Write("Número de discos: ");
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine(n);

        Hanoi(n, 'A', 'C', 'B');
        Console.WriteLine($"Total: {movimentos} movimentos (2^{n} - 1 = {(1 << n) - 1})\n");

        var perms = new List<string>();
        Permutar("", "ABCD", perms);
        Console.WriteLine($"Permutações de ABCD ({perms.Count}): {string.Join(" ", perms)}\n");

        for (int k = 4; k <= 8; k++)
            Console.WriteLine($"{k} rainhas → {Rainhas(0, k, new bool[k], new bool[2 * k], new bool[2 * k])} soluções");
    }
}
`,
  },
  {
    id: "jogo-adivinha",
    title: "Jogo: adivinhe o número",
    category: "Entrada de dados",
    level: "Iniciante",
    description: "Ciclo while com várias leituras: o programa dá pistas até acertar.",
    stdin: "50\n25\n37\n31\n34\n33",
    code: r`using System;

class Program
{
    static void Main()
    {
        var rnd = new Random(7);
        int segredo = rnd.Next(1, 101);
        int tentativas = 0;

        Console.WriteLine("Pensei num número entre 1 e 100. Consegue adivinhar?");

        while (true)
        {
            Console.Write("Palpite: ");
            string linha = Console.ReadLine();
            if (linha == null) { Console.WriteLine("\nSem mais palpites. O número era " + segredo); break; }

            int palpite;
            if (!int.TryParse(linha, out palpite)) { Console.WriteLine("número inválido"); continue; }
            Console.Write(palpite);
            tentativas++;

            if (palpite < segredo) Console.WriteLine("  → é maior ⬆");
            else if (palpite > segredo) Console.WriteLine("  → é menor ⬇");
            else
            {
                Console.WriteLine($"  → ACERTOU em {tentativas} tentativas! 🎉");
                break;
            }
        }
    }
}
`,
  },
];

export const DEFAULT_CODE = EXAMPLES[0]!.code;

export function getExample(id: string): Example | undefined {
  return EXAMPLES.find((e) => e.id === id);
}

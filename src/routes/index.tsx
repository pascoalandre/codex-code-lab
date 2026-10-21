import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Cloud,
  Grid3x3,
  Keyboard,
  Maximize2,
  Palette,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ModeToggle, Swatch, ThemePicker } from "@/components/ThemePicker";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { CATEGORIES, EXAMPLES } from "@/lib/examples";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C# Codex — Editor, compilador e execução de C# online" },
      {
        name: "description",
        content:
          "Escreva, compile e execute programas C# no navegador. Entrada de dados, vetores, matrizes, matemática avançada, temas VS Code e Drácula, e projectos na nuvem.",
      },
      { property: "og:title", content: "C# Codex — o seu IDE de C# no navegador" },
      {
        property: "og:description",
        content: "Compile e execute C# em segundos, com exemplos prontos, temas profissionais e projectos guardados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      <Nav />
      <Hero signedIn={!!user} />
      <Stats />
      <Features />
      <Themes />
      <ExamplesShowcase />
      <FinalCta signedIn={!!user} />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <a href="#recursos" className="rounded px-2.5 py-1.5 hover:text-foreground">Recursos</a>
          <a href="#temas" className="rounded px-2.5 py-1.5 hover:text-foreground">Temas</a>
          <a href="#exemplos" className="rounded px-2.5 py-1.5 hover:text-foreground">Exemplos</a>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemePicker />
          <ModeToggle />
          <div className="ml-1.5 hidden sm:block">
            <UserMenu />
          </div>
          <Button asChild variant="hero" size="sm" className="ml-1.5">
            <Link to="/playground">
              Abrir editor <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10 lg:pb-24">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
            Compilador online · sem instalar nada
          </span>
          <h1 className="mt-6 text-[2.6rem] font-semibold leading-[0.98] text-balance-tight sm:text-6xl lg:text-[4.2rem]">
            Escreva C#.
            <br />
            <span className="text-muted-foreground">Compile.</span>{" "}
            <span className="relative whitespace-nowrap text-primary">
              Execute.
              <span className="absolute -right-4 top-1 h-[0.85em] w-[3px] animate-blink bg-primary" />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            O C# Codex é um IDE completo no navegador: editor profissional, entrada de dados, matrizes, números
            gigantes e os seus projectos guardados na nuvem.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/playground">
                <Play className="fill-current" /> Começar a programar
              </Link>
            </Button>
            <Button asChild variant="subtle" size="xl">
              <Link to={signedIn ? "/projects" : "/auth"}>{signedIn ? "Os meus projectos" : "Criar conta grátis"}</Link>
            </Button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="size-3.5" /> Dica: <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> executa o programa
          </p>
        </div>

        <div className="animate-rise [animation-delay:120ms]">
          <IdePreview />
        </div>
      </div>
    </section>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground">{children}</kbd>
  );
}

/* Static, theme-aware mock of the IDE. */
function IdePreview() {
  const K = ({ children }: { children: ReactNode }) => <span className="text-syn-keyword">{children}</span>;
  const T = ({ children }: { children: ReactNode }) => <span className="text-syn-type">{children}</span>;
  const F = ({ children }: { children: ReactNode }) => <span className="text-syn-fn">{children}</span>;
  const S = ({ children }: { children: ReactNode }) => <span className="text-syn-string">{children}</span>;
  const N = ({ children }: { children: ReactNode }) => <span className="text-syn-number">{children}</span>;
  const C = ({ children }: { children: ReactNode }) => <span className="italic text-syn-comment">{children}</span>;
  const P = ({ children }: { children: ReactNode }) => <span className="text-syn-punct">{children}</span>;

  const lines: ReactNode[] = [
    <><K>using</K> <T>System</T><P>;</P></>,
    <><K>using</K> <T>System</T><P>.</P><T>Numerics</T><P>;</P></>,
    <></>,
    <><K>class</K> <T>Program</T></>,
    <><P>{"{"}</P></>,
    <>    <K>static void</K> <F>Main</F><P>()</P></>,
    <>    <P>{"{"}</P></>,
    <>        <C>// Fatorial de 50 com precisão arbitrária</C></>,
    <>        <T>BigInteger</T> f <P>=</P> <N>1</N><P>;</P></>,
    <>        <K>for</K> <P>(</P><K>int</K> i <P>=</P> <N>2</N><P>;</P> i <P>{"<="}</P> <N>50</N><P>;</P> i<P>++)</P> f <P>*=</P> i<P>;</P></>,
    <>        <T>Console</T><P>.</P><F>WriteLine</F><P>(</P><S>$"50! = {"{"}f{"}"}"</S><P>);</P></>,
    <>    <P>{"}"}</P></>,
    <><P>{"}"}</P></>,
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="overflow-hidden rounded-xl bg-editor shadow-window">
        <div className="flex h-10 items-center gap-2 border-b border-border bg-panel px-3">
          <span className="size-2.5 rounded-full bg-destructive/80" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
          <span className="ml-3 rounded-t border-x border-t border-border bg-editor px-3 py-1.5 font-mono text-[11px] text-foreground">
            Program.cs
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
            <Play className="size-3 fill-current" /> Executar
          </span>
        </div>
        <pre className="overflow-x-auto py-4 font-mono text-[11.5px] leading-[1.75] sm:text-[13px]">
          {lines.map((l, i) => (
            <div key={i} className={cn("flex pr-4", i === 9 && "bg-accent/40")}>
              <span className="w-10 shrink-0 select-none pr-4 text-right text-muted-foreground/50">{i + 1}</span>
              <span className="whitespace-pre text-foreground">{l}</span>
            </div>
          ))}
        </pre>
        <div className="border-t border-border bg-terminal px-4 py-3 font-mono text-[11.5px] leading-relaxed sm:text-[12.5px]">
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> mcs Program.cs && mono Program.exe
          </p>
          <p className="break-all text-foreground">50! = 30414093201713378043612608166064768844377641568960512000000000000</p>
          <p className="mt-1 text-success">✓ Executado com sucesso · 0.031 s · 4.7 MB</p>
        </div>
        <div className="flex h-6 items-center gap-3 bg-statusbar px-3 font-mono text-[10px] text-statusbar-foreground">
          <span className="font-semibold">C# · Mono</span>
          <span>Ln 10, Col 54</span>
          <span className="ml-auto">UTF-8</span>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const items = [
    [String(EXAMPLES.length), "exemplos prontos"],
    ["6", "temas de editor"],
    ["< 1 s", "para compilar"],
    ["0", "instalações"],
  ];
  return (
    <section className="border-y border-border bg-panel">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
        {items.map(([n, l], i) => (
          <div key={l} className={cn("px-4 py-6 sm:px-6", i >= 2 && "border-t border-border sm:border-t-0")}>
            <p className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{n}</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="label-mono text-primary">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-[1.05] text-balance-tight sm:text-[2.6rem]">{title}</h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Features() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <SectionHead
        kicker="01 / Recursos"
        title="Tudo o que um bom IDE precisa. Nada do que atrapalha."
        sub="Do primeiro Console.WriteLine a sistemas lineares — o C# Codex acompanha cada etapa da aprendizagem e do trabalho."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-6">
        <Feature className="md:col-span-4" icon={<Zap />} title="Editor de nível profissional">
          O mesmo motor do Visual Studio Code: realce de sintaxe C#, autocompletar, snippets (<code className="font-mono text-foreground">cw</code>,{" "}
          <code className="font-mono text-foreground">for</code>, <code className="font-mono text-foreground">matriz</code>), multicursor,
          minimapa e erros sublinhados na linha certa.
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px]">
            {["IntelliSense", "Snippets", "Multicursor", "Minimapa", "Procurar/Substituir", "Sticky scroll"].map((t) => (
              <span key={t} className="rounded border border-border bg-background px-2 py-1 text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </Feature>
        <Feature className="md:col-span-2" icon={<Keyboard />} title="Entrada de dados real">
          Programas com <code className="font-mono text-foreground">Console.ReadLine()</code> pedem os dados antes de executar — uma linha por leitura.
        </Feature>
        <Feature className="md:col-span-2" icon={<Grid3x3 />} title="Vetores e matrizes">
          Arrays, matrizes <code className="font-mono text-foreground">int[,]</code>, ordenação, determinantes e inversas — com saída alinhada.
        </Feature>
        <Feature className="md:col-span-2" icon={<Calculator />} title="Matemática pesada">
          <code className="font-mono text-foreground">BigInteger</code>, <code className="font-mono text-foreground">Complex</code>, crivos de
          primos com milhões de números e cálculo numérico.
        </Feature>
        <Feature className="md:col-span-2" icon={<Maximize2 />} title="Ecrã inteiro">
          Foque-se no código: o editor ocupa o ecrã todo com <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>F</Kbd>.
        </Feature>
        <Feature className="md:col-span-3" icon={<Cloud />} title="Projectos na nuvem">
          Crie uma conta e guarde projectos ilimitados. Gravação automática enquanto escreve, favoritos, duplicar e pesquisa.
        </Feature>
        <Feature className="md:col-span-3" icon={<Sparkles />} title="Erros explicados em português">
          Cada erro do compilador vem com uma explicação clara e um clique leva-o directamente à linha com o problema.
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
            CS1002 · Linha 8 — Falta um ponto e vírgula (;) no fim da instrução.
          </p>
        </Feature>
      </div>
    </section>
  );
}

function Feature({ icon, title, children, className }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <article className={cn("rounded-xl border border-border bg-card p-6 transition hover:border-primary/40", className)}>
      <div className="flex size-9 items-center justify-center rounded-md bg-primary/12 text-primary [&_svg]:size-[18px]">{icon}</div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </article>
  );
}

function Themes() {
  const { theme, setTheme } = useTheme();
  return (
    <section id="temas" className="scroll-mt-20 border-y border-border bg-panel">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <SectionHead
          kicker="02 / Temas"
          title="Claro, escuro, VS Code ou Drácula. Experimente agora."
          sub="Clique num tema: o site inteiro e o editor mudam na hora. A sua escolha fica guardada."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              data-active={theme.id === t.id}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50 data-[active=true]:border-primary data-[active=true]:shadow-glow"
            >
              <Swatch colors={t.swatch} />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block text-xs text-muted-foreground">{t.mode === "dark" ? "Escuro" : "Claro"}</span>
              </span>
              <Palette className="size-4 text-muted-foreground transition group-data-[active=true]:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExamplesShowcase() {
  const featured = ["calculadora", "matriz-operacoes", "numeros-gigantes", "sistema-linear", "primos-crivo", "poo-banco"];
  const list = featured.map((id) => EXAMPLES.find((e) => e.id === id)!).filter(Boolean);
  return (
    <section id="exemplos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="03 / Exemplos"
          title="Aprenda a partir de código que funciona."
          sub={`${EXAMPLES.length} programas comentados em ${CATEGORIES.length} categorias — abra, execute e modifique.`}
        />
        <Button asChild variant="subtle">
          <Link to="/playground">
            <BookOpen /> Ver todos
          </Link>
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {c} <span className="font-mono text-foreground">{EXAMPLES.filter((e) => e.category === c).length}</span>
          </span>
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ex) => (
          <Link
            key={ex.id}
            to="/playground"
            search={{ example: ex.id }}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/50"
          >
            <span className="label-mono text-muted-foreground">{ex.category}</span>
            <span className="mt-3 text-lg font-semibold tracking-tight">{ex.title}</span>
            <span className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{ex.description}</span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Play className="size-3.5 fill-current" /> Executar exemplo
              <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="bg-grid relative overflow-hidden rounded-2xl border border-border bg-panel px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="absolute left-1/2 top-0 -z-0 h-40 w-2/3 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-sm text-muted-foreground">
            <span className="text-syn-keyword">static void</span> <span className="text-syn-fn">Main</span>() {"{"}
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-[1.05] text-balance-tight sm:text-5xl">
            O seu próximo programa começa aqui.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/playground">
                <Play className="fill-current" /> Abrir o editor
              </Link>
            </Button>
            {!signedIn && (
              <Button asChild variant="subtle" size="xl">
                <Link to="/auth">Criar conta</Link>
              </Button>
            )}
          </div>
          <p className="mt-4 font-mono text-sm text-muted-foreground">{"}"}</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <p className="sm:ml-4">Editor, compilador e execução de C# no navegador.</p>
        <p className="font-mono text-xs sm:ml-auto">© {new Date().getFullYear()} C# Codex</p>
      </div>
    </footer>
  );
}

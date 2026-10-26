import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { ArrowRight, Bug, ChevronRight, Cloud, Code2, FolderOpen, Keyboard, LibraryBig, Maximize2, Play, SquareTerminal } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { LogoMark } from "@/components/brand/Logo";
import { ModeToggle, ThemePicker } from "@/components/ThemePicker";
import { UserMenu } from "@/components/UserMenu";
import { displayNameOf, useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { CATEGORIES, EXAMPLES, type Example, type ExampleCategory } from "@/lib/examples";
import { projectsQuery } from "@/lib/projects";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C# Codex — Editor, compilador e execução de C# online" },
      {
        name: "description",
        content:
          "Escreva, compile e execute programas C# no telemóvel ou no computador. Consola interactiva, vetores, matrizes, matemática, temas VS Code e Drácula, e projectos na nuvem.",
      },
      { property: "og:title", content: "C# Codex — o seu IDE de C# de bolso" },
      {
        property: "og:description",
        content: "Compile e execute C# em segundos, com consola interactiva, exemplos prontos e projectos guardados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CATEGORY_GLYPH: Record<ExampleCategory, string> = {
  Fundamentos: "{ }",
  "Entrada de dados": ">_",
  Vetores: "[ ]",
  Matrizes: "[,]",
  Matemática: "∑",
  Strings: '" "',
  POO: "◇",
  "Coleções & LINQ": "=>",
  Algoritmos: "ƒ",
};

const LEVEL_TONE: Record<Example["level"], string> = {
  Iniciante: "bg-success/12 text-success",
  Intermédio: "bg-info/12 text-info",
  Avançado: "bg-syn-keyword/12 text-syn-keyword",
};

function Home() {
  const { user } = useAuth();
  const first = user ? displayNameOf(user).split(" ")[0] : null;

  return (
    <AppShell
      active="home"
      leading={
        <Link to="/" className="ml-2 md:hidden" aria-label="C# Codex">
          <LogoMark className="size-9 rounded-xl text-xs" />
        </Link>
      }
      title={
        <span>
          C# <span className="text-muted-foreground">Codex</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-0.5 md:hidden">
          <ThemePicker />
          <ModeToggle />
          <div className="ml-1 mr-1">
            <UserMenu compact />
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        {/* Greeting */}
        <section className="animate-rise pt-2">
          <p className="text-sm font-medium text-muted-foreground">{first ? `Olá, ${first} 👋` : "Bem-vindo 👋"}</p>
          <h1 className="mt-1 text-[30px] font-bold leading-[1.1] tracking-tight md:text-[40px]">O que vamos programar hoje?</h1>
        </section>

        {/* Quick actions */}
        <section className="mt-6 grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <Link
            to="/playground"
            className="group relative overflow-hidden rounded-[28px] bg-primary p-5 text-primary-foreground transition active:scale-[0.99] md:row-span-2 md:p-7"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/12">
                <Code2 className="size-6" />
              </span>
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-foreground text-primary transition group-hover:translate-x-0.5">
                <ArrowRight className="size-5" />
              </span>
            </div>
            <h2 className="mt-8 text-2xl font-bold tracking-tight md:mt-14 md:text-3xl">Abrir o editor</h2>
            <p className="mt-1 text-sm opacity-80">C# 12 · .NET 8 · consola interactiva</p>
            <div className="code-font mt-5 overflow-hidden rounded-2xl bg-primary-foreground/10 px-4 py-3 text-[12.5px] leading-relaxed">
              <p className="opacity-70">// o seu primeiro programa</p>
              <p className="whitespace-nowrap">
                Console.<span className="font-semibold">WriteLine</span>("Olá, Angola!");
              </p>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <Link
              to={user ? "/projects" : "/auth"}
              className="flex flex-col justify-between gap-6 rounded-[28px] bg-surface-2 p-5 transition hover:bg-surface-3 active:scale-[0.99]"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
                <FolderOpen className="size-5" />
              </span>
              <span>
                <span className="block text-base font-semibold leading-tight">{user ? "Os meus projectos" : "Guardar projectos"}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{user ? "Guardados na nuvem" : "Crie uma conta grátis"}</span>
              </span>
            </Link>
            <a
              href="#exemplos"
              className="flex flex-col justify-between gap-6 rounded-[28px] bg-surface-2 p-5 transition hover:bg-surface-3 active:scale-[0.99]"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-syn-keyword">
                <LibraryBig className="size-5" />
              </span>
              <span>
                <span className="block text-base font-semibold leading-tight">{EXAMPLES.length} exemplos</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Prontos a executar</span>
              </span>
            </a>
          </div>
        </section>

        {user && <RecentProjects />}

        <ExamplesSection />
        <ThemesSection />
        <WhySection />

        <footer className="mt-12 flex flex-col items-center gap-3 border-t border-border/50 py-8 text-center">
          <LogoMark className="size-10 rounded-2xl" />
          <p className="text-sm text-muted-foreground">Editor, compilador e execução de C#.</p>
          <p className="text-sm">
            Desenvolvido por: <span className="font-semibold text-foreground">Pascoal André (Whizy Safary)</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} C# Codex</p>
        </footer>
      </div>
    </AppShell>
  );
}

function SectionTitle({ title, action, id }: { title: string; action?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-3 mt-10 flex scroll-mt-20 items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

function RecentProjects() {
  const { data } = useQuery({ ...projectsQuery(), staleTime: 30_000 });
  const recent = (data ?? []).slice(0, 3);
  if (!recent.length) return null;
  return (
    <section>
      <SectionTitle
        title="Continuar"
        action={
          <Link to="/projects" className="inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10">
            Ver todos <ChevronRight className="size-4" />
          </Link>
        }
      />
      <ul className="overflow-hidden rounded-[24px] bg-surface-1">
        {recent.map((p, i) => (
          <li key={p.id} className={cn(i > 0 && "border-t border-border/40")}>
            <Link to="/projects/$projectId" params={{ projectId: p.id }} className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-foreground/[0.03] active:bg-foreground/[0.06]">
              <span className="code-font flex size-11 shrink-0 items-center justify-center rounded-2xl bg-editor text-[13px] font-bold text-syn-keyword ring-1 ring-border/60">
                C#
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {p.code.split("\n").length} linhas · {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: pt })}
                </span>
              </span>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExamplesSection() {
  const [category, setCategory] = useState<ExampleCategory | "Todos">("Todos");
  const list = useMemo(() => EXAMPLES.filter((e) => category === "Todos" || e.category === category), [category]);
  return (
    <section>
      <SectionTitle id="exemplos" title="Exemplos" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {(["Todos", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            data-active={category === c}
            className="h-9 shrink-0 rounded-xl border border-border px-4 text-[13px] font-medium text-muted-foreground transition-colors data-[active=true]:border-transparent data-[active=true]:bg-primary-container data-[active=true]:text-on-primary-container"
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {list.map((ex) => (
          <li key={ex.id}>
            <Link
              to="/playground"
              search={{ example: ex.id }}
              className="group flex items-center gap-4 rounded-[22px] bg-surface-1 p-3 pr-4 transition hover:bg-surface-2 active:scale-[0.99]"
            >
              <span className="code-font flex size-12 shrink-0 items-center justify-center rounded-2xl bg-editor text-sm font-bold text-primary ring-1 ring-border/60">
                {CATEGORY_GLYPH[ex.category]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{ex.title}</span>
                </span>
                <span className="line-clamp-1 text-[13px] text-muted-foreground">{ex.description}</span>
                <span className="mt-1.5 flex items-center gap-1.5">
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", LEVEL_TONE[ex.level])}>{ex.level}</span>
                  {ex.stdin && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                      <Keyboard className="size-3" /> pede dados
                    </span>
                  )}
                </span>
              </span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Play className="size-4 fill-current" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ThemesSection() {
  const { theme, setTheme } = useTheme();
  return (
    <section>
      <SectionTitle title="Tema do editor" />
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0">
        {THEMES.map((t) => {
          const [bg, accent, kw, type] = t.swatch;
          const active = theme.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              className={cn(
                "w-44 shrink-0 snap-start overflow-hidden rounded-[22px] bg-surface-1 p-2 text-left ring-2 transition md:w-auto",
                active ? "ring-primary" : "ring-transparent hover:bg-surface-2",
              )}
            >
              {/* Mini preview painted with the theme's own colours. */}
              <span className="code-font block rounded-2xl p-3 text-[10px] leading-[1.7]" style={{ backgroundColor: bg }}>
                <span className="block" style={{ color: kw }}>
                  static void <span style={{ color: type }}>Main</span>
                </span>
                <span className="block" style={{ color: accent }}>
                  "Olá, mundo"
                </span>
                <span className="mt-1 block h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
              </span>
              <span className="flex items-center justify-between px-2 pb-1 pt-2.5">
                <span>
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.mode === "dark" ? "Escuro" : "Claro"}</span>
                </span>
                <span
                  className={cn(
                    "size-5 rounded-full border-2 transition",
                    active ? "border-primary bg-primary shadow-[inset_0_0_0_3px_var(--card)]" : "border-muted-foreground/40",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function WhySection() {
  const items = [
    { icon: SquareTerminal, title: "Consola interactiva", text: "O programa pede os dados e você escreve-os na própria consola." },
    { icon: Bug, title: "Erros em português", text: "Cada erro vem explicado, e um toque leva-o à linha certa." },
    { icon: Cloud, title: "Projectos na nuvem", text: "Gravação automática enquanto escreve, em qualquer aparelho." },
    { icon: Maximize2, title: "Ecrã inteiro", text: "Só o código e a consola, sem distracções." },
  ];
  return (
    <section>
      <SectionTitle title="Feito para programar no telemóvel" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[22px] bg-surface-1 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
              <Icon className="size-5" />
            </span>
            <p className="mt-4 text-sm font-semibold leading-tight">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

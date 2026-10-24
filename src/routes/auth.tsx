import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { ModeToggle, ThemePicker } from "@/components/ThemePicker";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/projects";
  return value;
}

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Entrar — C# Codex" },
      { name: "description", content: "Entre ou crie a sua conta no C# Codex para guardar os seus projectos C#." },
      { property: "og:title", content: "Entrar no C# Codex" },
      { property: "og:description", content: "Guarde e organize os seus projectos C# na nuvem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const search = Route.useSearch();
  const target = safeRedirect(search.redirect);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [user, loading, target, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sessão iniciada");
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("A palavra-passe deve ter pelo menos 6 caracteres.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${target}`,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) setSentTo(email);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSentTo(email);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo correu mal.";
      toast.error(translateAuthError(msg));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async () => {
    sessionStorage.setItem("codex-after-auth", target);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error("Não foi possível entrar. Tente novamente.");
  };

  useEffect(() => {
    if (!user) return;
    const stored = sessionStorage.getItem("codex-after-auth");
    if (stored) {
      sessionStorage.removeItem("codex-after-auth");
      navigate({ to: safeRedirect(stored), replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand side */}
      <aside className="bg-grid relative hidden overflow-hidden border-r border-border bg-panel p-10 lg:flex lg:flex-col">
        <Logo />
        <div className="my-auto max-w-md">
          <p className="label-mono text-primary">// a sua oficina de C#</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] text-balance-tight">
            Os seus programas, guardados e prontos a executar em qualquer lugar.
          </h2>
          <pre className="mt-8 overflow-hidden rounded-lg border border-border bg-editor p-5 font-mono text-[13px] leading-relaxed shadow-window">
            <code>
              <span className="text-syn-keyword">var</span> <span className="text-foreground">conta</span>{" "}
              <span className="text-syn-punct">=</span> <span className="text-syn-keyword">new</span>{" "}
              <span className="text-syn-type">Programador</span>
              <span className="text-syn-punct">(</span>
              <span className="text-syn-string">"você"</span>
              <span className="text-syn-punct">);</span>
              {"\n"}
              <span className="text-foreground">conta</span>
              <span className="text-syn-punct">.</span>
              <span className="text-syn-fn">Guardar</span>
              <span className="text-syn-punct">(</span>
              <span className="text-foreground">projectos</span>
              <span className="text-syn-punct">);</span>
              {"\n"}
              <span className="text-syn-comment">// ✓ sincronizado com a nuvem</span>
            </code>
          </pre>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Desenvolvido por: <span className="font-medium text-foreground">Pascoal André (Whizy Safary)</span>
          </p>
          <p>© {new Date().getFullYear()} C# Codex</p>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:invisible">
            <ArrowLeft className="size-4" /> Início
          </Link>
          <div className="flex items-center">
            <ThemePicker />
            <ModeToggle />
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <div className="lg:hidden">
            <Logo />
          </div>

          {sentTo ? (
            <div className="mt-8 animate-rise text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15">
                <MailCheck className="size-6 text-primary" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight">Verifique o seu e-mail</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviámos uma ligação para <span className="font-medium text-foreground">{sentTo}</span>.
                {mode === "signup" ? " Confirme a conta para começar." : " Use-a para definir uma nova palavra-passe."}
              </p>
              <Button variant="subtle" className="mt-6" onClick={() => { setSentTo(null); setMode("signin"); }}>
                Voltar a entrar
              </Button>
            </div>
          ) : (
            <div className="mt-8 animate-rise">
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "signin" ? "Bem-vindo de volta" : mode === "signup" ? "Criar conta gratuita" : "Recuperar acesso"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Entre para abrir os seus projectos."
                  : mode === "signup"
                    ? "Guarde projectos ilimitados na nuvem."
                    : "Indique o e-mail da sua conta."}
              </p>

              {mode !== "forgot" && (
                <>
                  <div className="mt-6 grid gap-2">
                    <Button variant="subtle" className="h-10" onClick={() => oauth()} type="button">
                      <GoogleIcon /> Continuar com Google
                    </Button>
                  </div>
                  <div className="my-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="label-mono text-muted-foreground">ou com e-mail</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={submit} className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamado" autoComplete="name" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com" autoComplete="email" />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Palavra-passe</Label>
                      {mode === "signin" && (
                        <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-primary">
                          Esqueceu-se?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                  </div>
                )}
                <Button type="submit" variant="hero" className="h-10 w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar ligação"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Ainda não tem conta?{" "}
                    <button onClick={() => setMode("signup")} className="font-medium text-foreground hover:text-primary">
                      Criar conta
                    </button>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <button onClick={() => setMode("signin")} className="font-medium text-foreground hover:text-primary">
                      Entrar
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground lg:hidden">
          Desenvolvido por: <span className="font-medium text-foreground">Pascoal André (Whizy Safary)</span>
        </p>
      </main>
    </div>
  );
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou palavra-passe incorrectos.";
  if (m.includes("email not confirmed")) return "Confirme o seu e-mail antes de entrar.";
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail.";
  if (m.includes("rate limit")) return "Demasiadas tentativas. Aguarde um pouco.";
  if (m.includes("password")) return msg;
  return msg;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

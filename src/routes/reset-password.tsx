import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova palavra-passe — C# Codex" },
      { name: "description", content: "Defina uma nova palavra-passe para a sua conta C# Codex." },
      { property: "og:title", content: "Nova palavra-passe — C# Codex" },
      { property: "og:description", content: "Recupere o acesso à sua conta C# Codex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Use pelo menos 6 caracteres.");
    if (password !== confirm) return toast.error("As palavras-passe não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Palavra-passe actualizada");
    navigate({ to: "/projects" });
  };

  return (
    <div className="bg-grid flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-window">
        <Logo />
        <div className="mt-6 flex size-10 items-center justify-center rounded-lg bg-primary/15">
          <KeyRound className="size-5 text-primary" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Definir nova palavra-passe</h1>
        {!recovery && (
          <p className="mt-2 text-sm text-muted-foreground">
            Abra esta página a partir da ligação enviada para o seu e-mail.
          </p>
        )}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">Nova palavra-passe</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirmar</Label>
            <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          <Button type="submit" variant="hero" className="h-10 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Guardar palavra-passe
          </Button>
        </form>
      </div>
    </div>
  );
}

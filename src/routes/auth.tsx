import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso al panel — Hemeroteca Gamer" },
      { name: "description", content: "Inicia sesión para gestionar revistas y noticias." },
      { property: "og:title", content: "Acceso al panel — Hemeroteca Gamer" },
      { property: "og:description", content: "Inicia sesión para gestionar revistas y noticias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMsg("Correo o contraseña incorrectos.");
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setMsg(error ? error.message : "Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-bold">{mode === "in" ? "Entrar al panel" : "Crear cuenta"}</h1>
        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="password" placeholder="Contraseña" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground">{mode === "in" ? "Entrar" : "Registrarme"}</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-xs text-muted-foreground underline">
          {mode === "in" ? "¿No tienes cuenta? Regístrate" : "Ya tengo cuenta"}
        </button>
      </form>
    </div>
  );
}

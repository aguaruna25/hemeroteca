import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Pide una revista · Hemeroteca Gamer" },
      { name: "description", content: "¿Buscas una revista gaming concreta? Cuéntanos cuál y te avisamos por correo." },
      { property: "og:title", content: "Pide una revista · Hemeroteca Gamer" },
      { property: "og:description", content: "¿Buscas una revista gaming concreta? Cuéntanos cuál y te avisamos por correo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contacto,
});

const schema = z.object({
  email: z.string().trim().email("Correo no válido").max(255),
  description: z.string().trim().min(1, "Describe lo que buscas").max(2000),
});

const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function Contacto() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: fd.get("email"), description: fd.get("description") });
    if (!parsed.success) return setMsg(parsed.error.issues[0]?.message ?? "Revisa el formulario");
    const file = fd.get("image") as File | null;
    if (file && file.size > 5 * 1024 * 1024) return setMsg("La imagen debe pesar menos de 5 MB");
    if (file && file.size > 0 && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) return setMsg("Usa una imagen JPG, PNG, WEBP o GIF");
    setBusy(true); setMsg("");
    let image_path: string | null = null;
    try {
      if (file && file.size > 0) {
        const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[file.type];
        image_path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("requests").upload(image_path, file);
        if (error) throw error;
      }
      const { error } = await supabase.from("magazine_requests").insert({ ...parsed.data, image_path });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Error desconocido";
      setMsg(/relation.*does not exist|schema cache|bucket not found|row-level security|permission denied/i.test(detail)
        ? "No se pudo guardar la solicitud. El administrador debe configurar la tabla y el almacenamiento en Supabase."
        : `No se pudo enviar: ${detail}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen font-sans">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">HEMEROTECA<span className="text-primary">.</span>GAMER</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Volver a la biblioteca</Link>
      </header>
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold">Pide una revista</h1>
        <p className="mt-2 text-muted-foreground">¿No encuentras el número que buscas? Déjanos tu correo, cuéntanos qué necesitas y, si quieres, sube una foto de la portada.</p>
        {done ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <p className="font-medium">¡Petición enviada!</p>
            <p className="mt-1 text-sm text-muted-foreground">Gracias, la hemos recibido. Revisaremos tu solicitud.</p>
            <button className="mt-4 text-sm text-primary underline" onClick={() => { setDone(false); setMsg(""); }}>Pedir otra revista</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6">
            <input name="email" type="email" placeholder="Tu correo" className={field} required maxLength={255} />
            <textarea name="description" placeholder="¿Qué revista buscas? (nombre, número, año…)" rows={5} className={field} required maxLength={2000} />
            <label className="text-sm text-muted-foreground">Imagen de referencia (opcional)
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block text-sm" />
            </label>
            <button disabled={busy} className="rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "Enviando…" : "Enviar petición"}</button>
            {msg && <p className="text-sm text-destructive">{msg}</p>}
          </form>
        )}
      </main>
    </div>
  );
}

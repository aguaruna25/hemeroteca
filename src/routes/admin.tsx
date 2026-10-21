import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel — Hemeroteca Gamer" },
      { name: "description", content: "Gestiona revistas y noticias." },
      { property: "og:title", content: "Panel — Hemeroteca Gamer" },
      { property: "og:description", content: "Gestiona revistas y noticias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

async function uploadImage(file: File | null) {
  if (!file) return null;
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
  const { error } = await supabase.storage.from("covers").upload(path, file);
  if (error) throw error;
  const { data } = await supabase.storage.from("covers").createSignedUrl(path, 60 * 60 * 24 * 365 * 20);
  return data?.signedUrl ?? null;
}

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<"loading" | "admin" | "denied">("loading");
  const [tab, setTab] = useState<"mag" | "news" | "req">("mag");
  const reqs = useQuery({
    queryKey: ["admin", "requests"],
    enabled: tab === "req",
    queryFn: async () => {
      const rows = (await supabase.from("magazine_requests").select("*").order("created_at", { ascending: false })).data ?? [];
      return Promise.all(rows.map(async (r) => ({
        ...r,
        url: r.image_path ? (await supabase.storage.from("requests").createSignedUrl(r.image_path, 3600)).data?.signedUrl ?? null : null,
      })));
    },
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return nav({ to: "/auth" });
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setState(ok ? "admin" : "denied");
    });
  }, [nav]);

  const mags = useQuery({
    queryKey: ["magazines"],
    enabled: state === "admin",
    queryFn: async () => (await supabase.from("magazines").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const news = useQuery({
    queryKey: ["news"],
    enabled: state === "admin",
    queryFn: async () => (await supabase.from("news").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function addMagazine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setMsg("");
    try {
      const cover_url = await uploadImage((f.get("cover") as File)?.size ? (f.get("cover") as File) : null);
      const payload = {
        title: String(f.get("title")), issue: String(f.get("issue")), year: Number(f.get("year")),
        description: String(f.get("description")), download_url: String(f.get("download_url")) || null,
        ...(cover_url ? { cover_url } : {}),
      };
      const { error } = editingId
        ? await supabase.from("magazines").update(payload).eq("id", editingId)
        : await supabase.from("magazines").insert(payload);
      if (error) throw error;
      form.reset(); setEditingId(null); setMsg(editingId ? "Revista actualizada ✓" : "Revista publicada ✓");
      qc.invalidateQueries();
    } catch { setMsg("No se pudo guardar. Inténtalo de nuevo."); }
    setBusy(false);
  }

  function startEdit(m: any) {
    setEditingId(m.id); setMsg("");
    const form = document.getElementById("magazine-form") as HTMLFormElement | null;
    if (!form) return;
    for (const name of ["title", "issue", "year", "description", "download_url"]) {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = String(m[name] ?? "");
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null); setMsg("");
    (document.getElementById("magazine-form") as HTMLFormElement | null)?.reset();
  }

  async function addNews(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setMsg("");
    try {
      const image_url = await uploadImage((f.get("image") as File)?.size ? (f.get("image") as File) : null);
      const { error } = await supabase.from("news").insert({
        tag: String(f.get("tag")) || "Noticia", title: String(f.get("title")), summary: String(f.get("summary")), image_url,
      });
      if (error) throw error;
      form.reset(); setMsg("Noticia publicada ✓");
      qc.invalidateQueries();
    } catch { setMsg("No se pudo guardar. Inténtalo de nuevo."); }
    setBusy(false);
  }

  async function remove(table: "magazines" | "news", id: string) {
    if (!confirm("¿Eliminar?")) return;
    await supabase.from(table).delete().eq("id", id);
    qc.invalidateQueries();
  }

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  if (state === "loading") return <p className="p-10 text-muted-foreground">Cargando…</p>;
  if (state === "denied")
    return (
      <div className="p-10 font-sans">
        <p>Tu cuenta no tiene permiso de administrador.</p>
        <button onClick={signOut} className="mt-4 text-sm underline">Cerrar sesión</button>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 font-sans">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-bold">HEMEROTECA<span className="text-primary">.</span>GAMER <span className="text-muted-foreground">/ panel</span></Link>
        <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">Cerrar sesión</button>
      </header>

      <div className="mt-8 flex gap-2">
        {([["mag", "Revistas"], ["news", "Noticias"], ["req", "Peticiones"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setMsg(""); }} className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      {tab === "req" ? (
        <ul className="mt-6 divide-y divide-border">
          {reqs.data?.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay peticiones.</p>}
          {reqs.data?.map((r) => (
            <li key={r.id} className="flex items-start gap-4 py-4 text-sm">
              {r.url ? <a href={r.url} target="_blank" rel="noreferrer"><img src={r.url} alt="" className="h-20 w-16 rounded object-cover" /></a> : <div className="h-20 w-16 rounded bg-muted" />}
              <div className="flex-1">
                <a href={`mailto:${r.email}`} className="font-medium hover:text-primary">{r.email}</a>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{r.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("es")}</p>
              </div>
              <button aria-label="Eliminar" onClick={async () => { await supabase.from("magazine_requests").delete().eq("id", r.id); qc.invalidateQueries({ queryKey: ["admin", "requests"] }); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      ) : tab === "mag" ? (
        <>
          <form id="magazine-form" onSubmit={addMagazine} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
            <input name="title" placeholder="Nombre de la revista" className={field} required />
            <input name="issue" placeholder="Número (ej. Nº 121)" className={field} />
            <input name="year" type="number" min={1980} max={2100} placeholder="Año" className={field} required />
            <input name="download_url" type="url" placeholder="Enlace de descarga (Drive, Mega…)" className={field} />
            <textarea name="description" placeholder="Descripción" className={`${field} md:col-span-2`} rows={3} />
            <label className="text-sm text-muted-foreground md:col-span-2">Portada <input name="cover" type="file" accept="image/*" className="ml-2 text-sm" /></label>
            <button disabled={busy} className="rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 md:col-span-2">{busy ? "Guardando…" : editingId ? "Guardar cambios" : "Publicar revista"}</button>
            {editingId && <button type="button" onClick={cancelEdit} disabled={busy} className="rounded-md border border-border py-2 text-sm md:col-span-2">Cancelar edición</button>}
            {editingId && <p className="text-xs text-muted-foreground md:col-span-2">Si no eliges una nueva portada, se conservará la actual.</p>}
            {msg && <p className="text-sm text-muted-foreground md:col-span-2">{msg}</p>}
          </form>
          <ul className="mt-6 divide-y divide-border">
            {mags.data?.map((m) => (
              <li key={m.id} className="flex items-center gap-4 py-3">
                {m.cover_url ? <img src={m.cover_url} alt="" className="h-14 w-10 rounded object-cover" /> : <div className="h-14 w-10 rounded bg-muted" />}
                <div className="flex-1 text-sm"><p className="font-medium">{m.title} {m.issue}</p><p className="text-xs text-muted-foreground">{m.year}{m.download_url ? "" : " · sin enlace"}</p></div>
                <button aria-label={`Editar ${m.title}`} title="Editar revista" onClick={() => startEdit(m)} className="text-muted-foreground hover:text-primary"><Pencil size={16} /></button>
                <button aria-label="Eliminar" onClick={() => remove("magazines", m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <form onSubmit={addNews} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
            <input name="title" placeholder="Titular" className={`${field} md:col-span-2`} required />
            <input name="tag" placeholder="Etiqueta (Noticia, Industria…)" className={field} />
            <label className="text-sm text-muted-foreground">Imagen <input name="image" type="file" accept="image/*" className="ml-2 text-sm" /></label>
            <textarea name="summary" placeholder="Resumen" className={`${field} md:col-span-2`} rows={3} />
            <button disabled={busy} className="rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 md:col-span-2">{busy ? "Guardando…" : "Publicar noticia"}</button>
            {msg && <p className="text-sm text-muted-foreground md:col-span-2">{msg}</p>}
          </form>
          <ul className="mt-6 divide-y divide-border">
            {news.data?.map((n) => (
              <li key={n.id} className="flex items-center gap-4 py-3 text-sm">
                <div className="flex-1"><p className="font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.tag}</p></div>
                <button aria-label="Eliminar" onClick={() => remove("news", n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

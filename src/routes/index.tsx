import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import s1 from "@/assets/slide1.jpg";
import s2 from "@/assets/slide2.jpg";
import s3 from "@/assets/slide3.jpg";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Magazine = Tables<"magazines">;
const fallback = [s1, s2, s3];
const hueOf = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const fmt = (d: string) => new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hemeroteca Gamer — Revistas de videojuegos desde los 90" },
      { name: "description", content: "Biblioteca para ver y descargar revistas gaming desde 1990 hasta hoy, con noticias del mundo de los videojuegos." },
      { property: "og:title", content: "Hemeroteca Gamer" },
      { property: "og:description", content: "Revistas de videojuegos desde los 90 hasta hoy, listas para descargar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const decades = ["Todas", "90s", "2000s", "2010s", "2020s"];

function Cover({ m }: { m: Magazine }) {
  if (m.cover_url)
    return <img src={m.cover_url} alt={`${m.title} ${m.issue}`} loading="lazy" className="aspect-[3/4] w-full rounded-lg object-cover" />;
  const hue = hueOf(m.id);
  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-lg p-3 flex flex-col justify-between"
      style={{ background: `linear-gradient(160deg, oklch(0.55 0.15 ${hue}), oklch(0.25 0.08 ${(hue + 40) % 360}))` }}
    >
      <span className="font-display text-xl font-bold uppercase leading-none text-foreground">{m.title}</span>
      <span className="font-display text-4xl font-bold text-foreground/20">{m.year}</span>
    </div>
  );
}

function Index() {
  const [i, setI] = useState(0);
  const [q, setQ] = useState("");
  const [dec, setDec] = useState("Todas");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const { data: magazines = [] } = useQuery({
    queryKey: ["magazines"],
    queryFn: async () => (await supabase.from("magazines").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: news = [] } = useQuery({
    queryKey: ["news"],
    queryFn: async () => (await supabase.from("news").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const selectedNews = news.find((n) => n.id === selectedNewsId);
  const slides = useMemo(() => {
    const items = [
      ...magazines.slice(0, 3).map((m) => ({ id: m.id, img: m.cover_url, kicker: "Recién agregada", title: `${m.title} ${m.issue}`, text: m.description || String(m.year) })),
      ...news.slice(0, 3).map((n) => ({ id: n.id, img: n.image_url, kicker: n.tag, title: n.title, text: n.summary || fmt(n.created_at) })),
    ];
    if (items.length === 0) return [{ id: "welcome", img: fallback[0]!, kicker: "HEMEROTECA GAMER", title: "Revistas de videojuegos", text: "Explora nuestra biblioteca. Pronto habrá nuevas revistas." }];
    return items.map((it, k) => ({ ...it, img: it.img ?? fallback[k % 3]! }));
  }, [magazines, news]);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % Math.max(slides.length, 1)), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const list = useMemo(
    () =>
      magazines.filter((m) => {
        const d = m.year < 2000 ? "90s" : m.year < 2010 ? "2000s" : m.year < 2020 ? "2010s" : "2020s";
        return (dec === "Todas" || d === dec) && m.title.toLowerCase().includes(q.toLowerCase());
      }),
    [q, dec, magazines],
  );

  return (
    <div className="min-h-screen font-sans">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <span className="font-display text-lg font-bold tracking-tight">
          HEMEROTECA<span className="text-primary">.</span>GAMER
        </span>
        <nav className="flex gap-5">
          <a href={`${import.meta.env.BASE_URL}contacto.html`} className="text-sm text-muted-foreground hover:text-foreground">Pedir revista</a>
          <a href={`${import.meta.env.BASE_URL}panel.html#/admin`} className="text-sm text-muted-foreground hover:text-foreground">Panel</a>
        </nav>
      </header>

      <section className="relative mx-auto h-[460px] max-w-7xl overflow-hidden px-6">
        <div className="relative h-full overflow-hidden rounded-2xl">
          {slides.map((s, k) => (
            <div key={s.id} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}>
              <img src={s.img} alt={s.title} width={1600} height={800} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-overlay" />
              <div className="absolute bottom-10 left-10 max-w-lg">
                <span className="text-xs font-medium uppercase tracking-widest text-primary">{s.kicker}</span>
                <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
          <div className="absolute bottom-10 right-10 flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                aria-label={d < 0 ? "Anterior" : "Siguiente"}
                onClick={() => setI((v) => (v + d + slides.length) % slides.length)}
                className="rounded-full border border-border bg-background/60 p-2 backdrop-blur hover:bg-primary hover:text-primary-foreground"
              >
                {d < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-7xl gap-4 px-6 md:grid-cols-3">
        {news.slice(0, 3).map((n) => (
          <button type="button" key={n.id} onClick={() => setSelectedNewsId(n.id)} className="overflow-hidden rounded-xl border border-border bg-card text-left hover:border-primary">
            {n.image_url ? <img src={n.image_url} alt={n.title} loading="lazy" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center bg-secondary text-muted-foreground">Hemeroteca Gamer</div>}
            <div className="p-5">
              <span className="text-xs uppercase tracking-widest text-primary">{n.tag}</span>
              <h3 className="mt-2 font-display text-lg font-semibold">{n.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{n.summary}</p>
              <p className="mt-3 text-xs text-muted-foreground">{fmt(n.created_at)}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">Leer noticia →</span>
            </div>
          </button>
        ))}
      </section>

      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedNewsId(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="news-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card">
            {selectedNews.image_url && <img src={selectedNews.image_url} alt={selectedNews.title} className="aspect-video w-full object-cover" />}
            <div className="p-6 md:p-8">
              <button type="button" onClick={() => setSelectedNewsId(null)} className="float-right rounded-md border border-border px-3 py-1 text-sm">Cerrar ×</button>
              <p className="text-xs uppercase tracking-widest text-primary">{selectedNews.tag} · {fmt(selectedNews.created_at)}</p>
              <h2 id="news-title" className="mt-4 font-display text-2xl font-bold">{selectedNews.title}</h2>
              <p className="mt-5 whitespace-pre-wrap leading-relaxed text-muted-foreground">{selectedNews.summary}</p>
            </div>
          </section>
        </div>
      )}
      <section className="mx-auto mt-16 max-w-7xl px-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Biblioteca</h2>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar revista…" className="bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {decades.map((d) => (
            <button
              key={d}
              onClick={() => setDec(d)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${dec === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {list.map((m) => (
            <div key={m.id} className="group">
              <div className="transition group-hover:-translate-y-1"><Cover m={m} /></div>
              <p className="mt-3 text-sm font-medium">{m.title} <span className="text-muted-foreground">{m.issue}</span></p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{m.year}{m.description ? ` · ${m.description}` : ""}</p>
              <a
                href={m.download_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { if (!m.download_url) { e.preventDefault(); alert("Archivo aún no disponible"); } }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border py-1.5 text-xs hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Download size={14} /> Descargar
              </a>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="mt-10 text-muted-foreground">No hay revistas para ese filtro.</p>}
      </section>
    </div>
  );
}

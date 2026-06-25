import { Shuffle, SearchX } from "lucide-react";
import { getDatosFeed, type DatoSort } from "@/lib/data/datos";
import SectionTabs from "@/components/feed/SectionTabs";
import DatoCard from "@/components/datos/DatoCard";
import DatoControls from "@/components/datos/DatoControls";
import Pagination from "@/components/feed/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default async function DatosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort as DatoSort) ?? "recientes";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const feed = await getDatosFeed({ sort, tipo: sp.tipo, q: sp.q, page });
  const { datos, totalPages, total } = feed;

  return (
    <div style={{ maxWidth: "820px" }}>
      <SectionTabs />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <div>
          <h1 className="dg-page-title">Datos random</h1>
          <p className="dg-page-sub" style={{ marginBottom: 0 }}>
            {sp.q
              ? `${total} resultado${total === 1 ? "" : "s"} para “${sp.q}”`
              : "Conocimiento distendido del equipo: libros, lecturas, videos y datos curiosos."}
          </p>
        </div>
        <Button href="/datos/nuevo" size="sm">
          Compartir un dato
        </Button>
      </div>

      <div style={{ marginTop: "16px" }}>
        <DatoControls sort={sort} tipo={sp.tipo} q={sp.q} />
      </div>

      {datos.length === 0 ? (
        <EmptyState
          icon={sp.q ? SearchX : Shuffle}
          title={sp.q ? "Sin resultados" : "Todavía no hay datos"}
          desc={
            sp.q
              ? "Probá con otros términos o limpiá la búsqueda."
              : "Compartí el primer dato: un libro que te gustó, un video o algo curioso para el equipo."
          }
          ctaHref={sp.q ? "/datos" : "/datos/nuevo"}
          ctaLabel={sp.q ? "Ver todo" : "Compartir un dato"}
        />
      ) : (
        <>
          {datos.map((d) => (
            <DatoCard key={d.id} dato={d} />
          ))}
          <Pagination
            page={page}
            totalPages={totalPages}
            params={{ sort, tipo: sp.tipo, q: sp.q }}
            basePath="/datos"
          />
        </>
      )}
    </div>
  );
}

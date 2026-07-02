import { Library, SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBiblioteca, type BibliotecaSort } from "@/lib/data/biblioteca";
import BibliotecaControls, {
  type BibliotecaParams,
} from "@/components/biblioteca/BibliotecaControls";
import BibliotecaTable from "@/components/biblioteca/BibliotecaTable";
import DigestButton from "@/components/digest/DigestButton";
import BackfillButton from "@/components/biblioteca/BackfillButton";
import Pagination from "@/components/feed/Pagination";
import EmptyState from "@/components/ui/EmptyState";

const SORTS: BibliotecaSort[] = ["recientes", "fecha_original", "interaccion"];

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const sort: BibliotecaSort = SORTS.includes(sp.sort as BibliotecaSort)
    ? (sp.sort as BibliotecaSort)
    : "recientes";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle()
    : { data: null };
  const isMod = me?.rol === "admin" || me?.rol === "moderador";

  const { rows, total, totalPages } = await getBiblioteca({
    q: sp.q,
    categoria: sp.categoria,
    tipo: sp.tipo,
    pubDesde: sp.pub_desde,
    pubHasta: sp.pub_hasta,
    origDesde: sp.orig_desde,
    origHasta: sp.orig_hasta,
    sort,
    page,
  });

  const params: BibliotecaParams = {
    sort,
    q: sp.q,
    categoria: sp.categoria,
    tipo: sp.tipo,
    pub_desde: sp.pub_desde,
    pub_hasta: sp.pub_hasta,
    orig_desde: sp.orig_desde,
    orig_hasta: sp.orig_hasta,
  };

  const hasFilters = !!(
    sp.q ||
    sp.categoria ||
    sp.tipo ||
    sp.pub_desde ||
    sp.pub_hasta ||
    sp.orig_desde ||
    sp.orig_hasta
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h1 className="dg-page-title" style={{ margin: 0 }}>
          Biblioteca de links
        </h1>
        <DigestButton periodo="semanal" label="Resumen semanal IA" shareHref="/biblioteca" />
      </div>
      <p className="dg-page-sub">
        {total} publicaci{total === 1 ? "ón" : "ones"} del Radar en una lista compacta y
        filtrable. Hacé clic en un título para abrir la publicación original.
      </p>

      <BibliotecaControls params={params} />

      {rows.length === 0 ? (
        <EmptyState
          icon={hasFilters ? SearchX : Library}
          title={hasFilters ? "Sin resultados" : "La biblioteca está vacía"}
          desc={
            hasFilters
              ? "Probá con otros filtros o limpialos para ver todo el repositorio."
              : "Cuando el equipo publique enlaces en el Radar, van a aparecer acá."
          }
          ctaHref={hasFilters ? "/biblioteca" : "/publicar"}
          ctaLabel={hasFilters ? "Ver toda la biblioteca" : "Publicar enlace"}
        />
      ) : (
        <>
          <BibliotecaTable rows={rows} />
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/biblioteca"
            params={{
              sort,
              q: sp.q,
              categoria: sp.categoria,
              tipo: sp.tipo,
              pub_desde: sp.pub_desde,
              pub_hasta: sp.pub_hasta,
              orig_desde: sp.orig_desde,
              orig_hasta: sp.orig_hasta,
            }}
          />
        </>
      )}

      {isMod && <BackfillButton />}
    </div>
  );
}

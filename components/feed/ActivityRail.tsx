import { getRecentActivity } from "@/lib/data/activity";
import { timeAgo } from "@/lib/ui";
import Card from "@/components/ui/Card";
import ActivityList, { type ActivityItem } from "./ActivityList";
import type { ActivityEvent } from "@/lib/types";

/** Texto + destino por tipo de evento; el título viene snapshoteado en payload. */
function toItem(e: ActivityEvent): ActivityItem {
  const p = e.payload;
  const titulo = p.titulo ?? "una publicación";
  let texto: string;
  let href: string;
  switch (e.tipo) {
    case "publico_enlace":
      texto = `publicó “${titulo}”`;
      href = `/post/${e.post_id}`;
      break;
    case "publico_dato":
      texto = `compartió un dato: “${titulo}”`;
      href = `/datos/${e.dato_id}`;
      break;
    case "comento_enlace":
      texto = `comentó en “${titulo}”`;
      href = `/post/${e.post_id}`;
      break;
    case "comento_dato":
      texto = `comentó en “${titulo}”`;
      href = `/datos/${e.dato_id}`;
      break;
    case "voto_enlace":
      texto = p.tipo_voto_nombre
        ? `votó “${p.tipo_voto_nombre}” en “${titulo}”`
        : `votó en “${titulo}”`;
      href = `/post/${e.post_id}`;
      break;
    case "like_dato":
      texto = `le gustó “${titulo}”`;
      href = `/datos/${e.dato_id}`;
      break;
    case "insignia":
      texto = `obtuvo la insignia ${p.badge_nombre ?? ""}`.trim();
      href = `/perfil/${e.actor_id}`;
      break;
    case "rango":
      texto = `subió a nivel ${p.rango_nuevo ?? ""}`.trim();
      href = `/perfil/${e.actor_id}`;
      break;
  }
  return {
    id: e.id,
    nombre: e.actor_nombre,
    texto,
    href,
    // computed server-side so the client markup matches the SSR output
    when: timeAgo(e.created_at),
  };
}

export default async function ActivityRail() {
  const events = await getRecentActivity(40);
  return (
    <Card pad="md">
      <div className="dg-section-label" style={{ marginBottom: "12px" }}>
        Actividad reciente
      </div>
      {events.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--fg-muted)", margin: 0 }}>
          Todavía sin actividad.
        </p>
      ) : (
        <ActivityList items={events.map(toItem)} />
      )}
    </Card>
  );
}

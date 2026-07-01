import { getRecentActivity } from "@/lib/data/activity";
import { railText } from "@/lib/activity-text";
import { timeAgo } from "@/lib/ui";
import Card from "@/components/ui/Card";
import ActivityList, { type ActivityItem } from "./ActivityList";
import type { ActivityEvent } from "@/lib/types";

function toItem(e: ActivityEvent): ActivityItem {
  return {
    id: e.id,
    nombre: e.actor_nombre,
    ...railText(e),
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

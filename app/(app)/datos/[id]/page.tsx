import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDato } from "@/lib/data/datos";
import { getPoll } from "@/lib/data/polls";
import PollWidget from "@/components/polls/PollWidget";
import { datoTipoBySlug } from "@/lib/constants";
import DatoComments from "@/components/datos/DatoComments";
import DeleteDatoButton from "@/components/datos/DeleteDatoButton";
import LikeButton from "@/components/datos/LikeButton";
import FileAttachment from "@/components/publish/FileAttachment";
import { Hashtags } from "@/components/ui/tags";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/ui";

export default async function DatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dato = await getDato(id);
  if (!dato) notFound();
  const poll = await getPoll({ datoId: id });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle()
    : { data: null };
  const canDelete =
    !!user && (user.id === dato.user_id || me?.rol === "admin" || me?.rol === "moderador");

  const autorNombre = dato.autor?.nombre ?? "Colaborador";
  const tipo = datoTipoBySlug(dato.tipo);

  // El bucket `recursos` es privado: la descarga usa una signed URL efímera.
  let fileUrl: string | null = null;
  if (dato.file_path) {
    const { data: signed } = await supabase.storage
      .from("recursos")
      .createSignedUrl(dato.file_path, 3600, { download: dato.file_name ?? true });
    fileUrl = signed?.signedUrl ?? null;
  }

  return (
    <div style={{ maxWidth: "820px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <Link
          href="/datos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--fg-secondary)",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={15} aria-hidden="true" /> Volver a Datos random
        </Link>
        {canDelete && <DeleteDatoButton datoId={dato.id} />}
      </div>

      <Card as="article" pad="lg" style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "16px" }}>
          <Avatar name={autorNombre} size={38} title={autorNombre} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg-primary)" }}>
              {autorNombre}
            </div>
            <div style={{ fontSize: "12px", color: "var(--fg-muted)" }}>{timeAgo(dato.created_at)}</div>
          </div>
          {tipo && <Badge color={tipo.color}>{tipo.nombre}</Badge>}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "25px",
            lineHeight: 1.2,
            margin: "0 0 12px",
            color: "var(--fg-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {dato.titulo}
        </h1>

        {dato.url && (
          <a
            href={dato.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "13.5px",
              color: "var(--dg-info)",
              marginBottom: "14px",
              wordBreak: "break-all",
            }}
          >
            <Link2 size={15} aria-hidden="true" style={{ flex: "none" }} /> {dato.url}
          </a>
        )}

        {fileUrl && dato.file_name && (
          <div>
            <FileAttachment url={fileUrl} name={dato.file_name} size={dato.file_size} />
          </div>
        )}

        {dato.descripcion && (
          <p
            style={{
              fontSize: "15px",
              color: "var(--dg-gray-700)",
              lineHeight: 1.6,
              margin: "8px 0 14px",
              whiteSpace: "pre-wrap",
            }}
          >
            {dato.descripcion}
          </p>
        )}

        {poll && <PollWidget poll={poll} />}

        <Hashtags etiquetas={dato.etiquetas} />

        <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid var(--dg-gray-100)" }}>
          <LikeButton datoId={dato.id} count={dato.likes_count} liked={dato.liked} />
        </div>
      </Card>

      <Card pad="lg" style={{ marginTop: "16px" }}>
        <DatoComments datoId={dato.id} comments={dato.comentarios} />
      </Card>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import FullState from "@/components/ui/FullState";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <FullState
      icon={AlertTriangle}
      tone="danger"
      title="Algo salió mal"
      desc="No pudimos cargar esta sección. Probá de nuevo; si el problema persiste, avisá al equipo de I+D."
    >
      <Button onClick={reset} icon={<AlertTriangle size={16} aria-hidden="true" />}>
        Reintentar
      </Button>
      <Button href="/radar" variant="outline">
        Ir al radar
      </Button>
    </FullState>
  );
}

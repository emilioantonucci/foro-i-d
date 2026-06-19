"use client";

import { useEffect } from "react";

/**
 * Last-resort handler for errors thrown in the root layout. It replaces the
 * whole document, so it cannot rely on globals.css — styles are inlined.
 */
export default function GlobalError({
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
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F4F2",
          fontFamily: "'Helvetica', 'Helvetica Neue', Arial, sans-serif",
          color: "#262626",
        }}
      >
        <div style={{ maxWidth: "420px", textAlign: "center", padding: "0 24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 10px" }}>
            Error inesperado
          </h1>
          <p style={{ fontSize: "15px", color: "#525252", lineHeight: 1.55, margin: "0 0 24px" }}>
            La aplicación encontró un problema. Recargá la página para volver a intentarlo.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#99CC06",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "12px 26px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}

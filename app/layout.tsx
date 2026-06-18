import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar I+D · I+D Hub — doinGlobal",
  description:
    "Sistema de inteligencia colectiva para Investigación y Desarrollo. No es un foro: es un radar estratégico.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

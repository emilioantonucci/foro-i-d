import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export interface ShellProfile {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
  rango: string;
}

export default function AppShell({
  profile,
  children,
}: {
  profile: ShellProfile;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F4F2" }}>
      <Sidebar profile={profile} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Suspense fallback={<div style={{ height: "57px", borderBottom: "1px solid #E8E8E8", background: "#fff" }} />}>
          <Topbar />
        </Suspense>
        <main style={{ flex: 1, padding: "24px 28px 56px" }}>{children}</main>
      </div>
    </div>
  );
}

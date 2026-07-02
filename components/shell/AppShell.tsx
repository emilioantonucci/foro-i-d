import ShellLayout from "./ShellLayout";

export interface ShellProfile {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
  rango: string;
}

export default function AppShell({
  profile,
  notifUnread = 0,
  banner,
  children,
}: {
  profile: ShellProfile;
  /** Count SSR de notificaciones no vistas para la campanita (dato volátil,
   *  por eso no vive en ShellProfile). */
  notifUnread?: number;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ShellLayout profile={profile} notifUnread={notifUnread} banner={banner}>
      {children}
    </ShellLayout>
  );
}

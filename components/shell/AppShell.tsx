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
  children,
}: {
  profile: ShellProfile;
  children: React.ReactNode;
}) {
  return <ShellLayout profile={profile}>{children}</ShellLayout>;
}

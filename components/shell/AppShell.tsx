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
  banner,
  children,
}: {
  profile: ShellProfile;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ShellLayout profile={profile} banner={banner}>
      {children}
    </ShellLayout>
  );
}

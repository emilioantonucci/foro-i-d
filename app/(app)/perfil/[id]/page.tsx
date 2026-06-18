import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getProfileStats } from "@/lib/data/profiles";
import { getPostsByUser } from "@/lib/data/posts";
import ProfileView from "@/components/profile/ProfileView";

export default async function PerfilIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id) redirect("/perfil");

  const [profile, stats, posts] = await Promise.all([
    getProfile(id),
    getProfileStats(id),
    getPostsByUser(id),
  ]);
  if (!profile) notFound();

  return <ProfileView profile={profile} stats={stats} posts={posts} />;
}

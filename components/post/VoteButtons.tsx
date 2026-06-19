import VoteChips from "@/components/feed/VoteChips";

export default function VoteButtons({
  postId,
  counts,
  userVotes,
}: {
  postId: string;
  counts: Record<string, number>;
  userVotes: string[];
}) {
  return <VoteChips postId={postId} counts={counts} myVotes={userVotes} mode="full" />;
}

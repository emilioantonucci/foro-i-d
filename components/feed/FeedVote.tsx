import VoteChips from "./VoteChips";

export default function FeedVote({
  postId,
  counts,
  misVotos,
}: {
  postId: string;
  counts: Record<string, number>;
  misVotos: string[];
}) {
  return (
    <VoteChips postId={postId} counts={counts} myVotes={misVotos} mode="quick" size="sm" />
  );
}

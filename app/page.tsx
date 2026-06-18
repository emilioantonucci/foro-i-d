import { redirect } from "next/navigation";

// The middleware already gates auth; an authenticated user landing on "/"
// is sent to the main radar feed.
export default function Home() {
  redirect("/radar");
}

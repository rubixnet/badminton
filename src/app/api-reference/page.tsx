import Link from "next/link";
import { ScoreApiTester } from "./score-api-tester";

export const metadata = { title: "Score API | Badminton Tracker" };

export default function ScoreApiReference() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Badminton Tracker</Link>
      <h1 className="text-2xl font-semibold">Score API</h1>
      <section aria-labelledby="endpoints" className="flex flex-col gap-3 border-y py-5">
        <h2 id="endpoints" className="font-medium">Endpoints</h2>
        <dl className="grid gap-4 text-sm">
          <div>
            <dt><code>GET /api/matches</code></dt>
            <dd className="text-muted-foreground">Paginated scores. Parameters: groupId, page, limit.</dd>
          </div>
          <div>
            <dt><code>GET /api/analytics</code></dt>
            <dd className="text-muted-foreground">Club match history. Parameter: groupId.</dd>
          </div>
          <div>
            <dt><code>POST /api/matches</code></dt>
            <dd className="text-muted-foreground">Record a score. Requires a signed-in club member and a JSON body with groupId, team1, team2, and optional checkpoints. Each team has a score and a players array.</dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">Private scores require a club member's session.</p>
      </section>
      <ScoreApiTester />
    </main>
  );
}

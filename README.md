# Badminton Tracker

Stop losing scores in group chats.

I built this because our weekend matches kept disappearing into WhatsApp threads. Someone would claim they were up 5-0 last week and nobody could prove otherwise. So now every game gets logged, and the numbers settle the arguments for us.

It works on a phone, it's dark by default, and it's meant to be used courtside in the two minutes between sets.

## What it does

- **Quick scoring** — log a match without fighting the UI. Tap, done, back to the game.
- **Checkpoints** — save scores mid-match, so you can see where a game actually turned and catch the comebacks and collapses.
- **Faults and bonuses** — track unforced errors, bad serves, or a great smash with bonus/deduction points if your group cares about that kind of thing.
- **Player profiles** — radars, average points, recent form, current streaks.
- **Head-to-head** — see your record against each person, and find out who you keep losing to.
- **Stats** — win rate over time and a yearly heatmap of how often you played.
- **Singles and doubles** — both 1v1 and 2v2, because our group does both.
- **Groups** — invite people with a link, share a roster, and everyone sees the same leaderboard on their own phone.

## The story

This started as a personal tool for my own group. Too many matches were going unrecorded and it was impossible to tell if anyone was actually improving or just getting lucky. It ended up being useful enough that I opened it up. If you take your friendly rivalries a little too seriously, you'll fit right in.

## Roadmap

- Make sure a match always has a winner — no ties.
- Only show match management to group admins.
- Let admins edit scores.
- Chart colors, and a nicer, more detailed homepage.
- Chart color setting during onboarding.
- A short tour for new users.
- A popover to add players by name while creating a match.

## Score API

Copy `.env.example` to `.env.local` and configure it with your own credentials.
Use plain values for the Convex URL and service account email, without Markdown
link syntax. Keep the private key and session secrets out of version control.

Open `/api-reference` to test read requests using the club ID from `/home/<groupId>`.
The tester shows HTTP status, elapsed time, and up to five returned matches.

The Next.js server needs `GOOGLE_SHEET_ID` and either
`GOOGLE_CLIENT_EMAIL` plus `GOOGLE_PRIVATE_KEY`, or
`GOOGLE_SERVICE_ACCOUNT_KEY` containing the service account JSON.
Give that service account Editor access to the spreadsheet. The app reads and
writes `Sheet1`; the spreadsheet itself does not need to be public.

## Performance Notes

- Measure a production build on mobile and track real-user LCP, INP, and CLS.
  Aim for p75 LCP at most 2.5 s, INP at most 200 ms, and CLS at most 0.1.
- For a new app, render the first view on the server and defer charts and
  editors until they are needed. Measure bundle size and endpoint latency
  before choosing what to optimize next.
- For score storage at scale, use indexed pagination by club and date in a
  database. The current shared Sheets snapshot reduces repeated reads within
  a warm server instance, but a cold read still fetches the sheet.

Sources: [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
and [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds).

# Reddit Pieces — WebHealth Founding Agency Pilot

8 finished pieces. Six comments to use under analogous live threads, plus two standalone posts for explicit self-promo / AMA contexts.

Comments contain **no link**. Standalone posts may carry the bare Cal URL only if subreddit rules allow it. Read every sub's rules before posting.

---

### Reddit 1 — r/SEO — comment — EN
**Plausible thread title to reply under:** "Why are clicks dropping but impressions rising in GSC?"

This pattern almost never means a manual penalty or an algorithm hit. The two usual culprits:

1. A new SERP feature appeared above your snippet — featured snippet, AI overview, video carousel, local pack. You stayed in the same position, but the visible click area moved.

2. Your title tag drifted from the query intent. Common after a CMS update where a template title overrides the page title.

To check: pull CTR per query for the same date range, segmented before/after the drop. If CTR dropped uniformly across all queries on that page, it is reason 1 (SERP layout). If it dropped only on a subset of queries, it is reason 2 (title vs. intent mismatch).

Crawl plus GSC together is what makes this fast. GSC alone tells you that something happened. The crawl tells you which template change introduced it.

(Disclosure: I'm building a tool that joins GSC, GA4 and crawl into a single ranked view, so this is the kind of question I look at every day. Happy to expand on any step if useful.)

— internal note: comment with explicit founder disclosure but no link, no pitch. "Plausible thread" is a search hint — find a real one and reply analogously.

---

### Reddit 2 — r/SEO — comment — EN
**Plausible thread title to reply under:** "Best way to report SEO progress to clients monthly?"

The mistake I see most often is reporting metrics, not decisions. A client doesn't need to see "CTR moved from 2.7 to 2.9". They need to see "these three pages need this change next week, here is why."

What seems to work for the agencies I've been talking to:

- One page per client per month, not a deck.
- Top of the page: 3 to 5 prioritised actions for the next cycle.
- Middle: which pages lost, which queries are close to better positions, which technical issue supports each priority.
- Bottom: KPI deltas as context, not headline.

The KPI table is reference material, not the story. The story is "what are we doing about it." Switching the structure usually ends the call 20 minutes earlier.

— internal note: same sub as Reddit 1, completely different thread, completely different structure. Lists vs. numbered reasoning.

---

### Reddit 3 — r/bigseo — comment — EN
**Plausible thread title to reply under:** "Do you still use Looker Studio for client reports in 2026?"

For us — solo dev side, currently talking to a small group of agencies — Looker is fine for the data layer. The bottleneck is not the chart. It's the part where someone reads four exports, decides what matters, and writes the next-action list.

Looker shows you the line dropped. It does not tell you whether the drop is on commercial pages, whether the crawl flagged a regression on those pages, or whether the queries that lost are the ones with rank potential. That stitching is still manual in most setups.

I'd keep Looker for clients who already know it. For the internal "what do we do next" step, a single ranked list across GSC, GA4 and crawl saves real time. Not magic — just join logic done once instead of every month.

— internal note: defends Looker for the client-facing side, separates the internal decision step. Avoids any "replace your tools" posture.

---

### Reddit 4 — r/agency — comment — EN
**Plausible thread title to reply under:** "How do you justify SEO retainer hours when the data is flat?"

Reframe the deliverable. The retainer isn't paying for traffic going up — that is outside your control. The retainer is paying for evidence-backed monthly decisions: what to fix, in what order, with what expected impact.

Two things that helped in conversations with agency owners I've spoken with:

- Document the "we considered and deprioritised" list. Showing a client three things you did NOT do (and why) is sometimes more reassuring than the three you did.
- Bring near-win queries every month. Positions 8 to 14 with rising impressions and CTR under 2 percent are cheap wins, look strong in a flat-traffic month, and are usually 30 minutes of work each.

Flat months are a positioning problem, not a data problem.

— internal note: agency-owner audience. Different opener ("Reframe…") than every other comment. Uses "evidence-backed" once — phrase from claim-safety list.

---

### Reddit 5 — r/SaaS — comment — EN
**Plausible thread title to reply under:** "Solo founders: how are you finding your first 10 customers?"

In this exact phase right now. Niche: SEO agencies in DACH and EN-speaking markets. Approach so far:

- No paid ads. Audience is zero on every platform.
- Posting one specific reporting insight per day on X. No threads, no listicles. The bio carries the offer, not the post.
- Reading subs for two weeks before posting. Comments only, no links. The first 30 days are pure listening.
- The first cohort is framed as a "founding pilot": free first month in exchange for two short calls and permission to use anonymised learnings. The cap is 10 because I'm doing the setup myself, which makes the limit honest instead of artificial.

Too early to claim what works. The thing I'd tell past-me: the offer matters more than the channel. A blank-account post with a clear, specific exchange beats a polished post with a vague CTA.

— internal note: build-in-public framing for r/SaaS. Discloses founder situation, no product name, no link.

---

### Reddit 6 — r/Selbststaendig — comment — DE
**Plausible thread title to reply under:** "Wie findet ihr eure ersten Kunden ohne Reichweite?"

Aktuell genau in der Phase. Solo, B2B, Zielgruppe sind kleine SEO-Agenturen im DACH-Raum.

Was bisher geholfen hat:

- Klares Tausch-Angebot statt Erstkunden-Rabatt. Erster Monat kostenlos gegen zwei kurze Feedback-Calls und die Erlaubnis, anonymisierte Learnings zu nutzen. Das wirkt ehrlicher als "50 Prozent Rabatt".
- Kein Massenversand. Stattdessen einzelne Antworten auf konkrete Posts auf LinkedIn und X, ohne Link, ohne Pitch — nur Substanz. Wer das Profil anklickt, sieht das Angebot.
- Strenge Begrenzung der ersten Kohorte (bei mir auf zehn). Nicht als Marketing-Trick, sondern weil ich das Onboarding selbst mache. Das macht das Limit glaubwürdig.

Reichweite folgt aus Substanz, nicht aus Frequenz. Hat bei mir mindestens drei gescheiterte Versuche gebraucht, bis das angekommen ist.

— internal note: only DE Reddit comment. Same topic as Reddit 5 but different framing (Tausch-Angebot vs. cadence rules), different structure, different language.

---

### Reddit 7 — r/SEO — standalone post (self-promo or weekly thread) — EN
**Title to use:** "Founding pilot: free first month for 10 agencies, in exchange for feedback"

I'm Lukas, solo founder, building a tool called WebHealth. It sits above GSC, GA4 and crawl data and turns the signals into a ranked action backlog for monthly client meetings. Not a replacement for Ahrefs, Semrush, Screaming Frog or Looker.

The pilot, plainly:

- 10 agencies, founder-led onboarding (I do the setup myself).
- 3 to 10 client sites per agency.
- One branded monthly snapshot with: which pages lost, which queries are near better positions, which technical issues support the priority, which 3 to 5 actions belong in this week's client meeting.
- First month free. After that 149 EUR per month, locked for 12 months for founding agencies.
- In return: one onboarding call, one feedback call, permission to use anonymised learnings.

The pilot is intentionally not a fit if you only want a single-website check, an Ahrefs replacement, or fully automated SEO decisions without review.

If your agency runs monthly client SEO reporting on five or more sites, the fit-check is here: https://cal.com/lukas-devbrew/kennenlernen

Happy to answer anything in the comments — including the awkward stuff.

— internal note: only post in this file using a structured offer block. Cal link present. Only post here for an explicit self-promo / weekly thread. Read the sub rules first.

---

### Reddit 8 — r/agency — AMA-style standalone — EN
**Title to use:** "What I'm learning building a decision layer above SEO tools"

Background: solo founder, EU-based, building a tool that joins GSC, GA4 and crawl data into a ranked action list for monthly client reporting. Currently running a small founding pilot with agencies.

Things that have surprised me in the first weeks of conversations with agency owners:

1. Nobody is asking for another dashboard. Every fit-check call has confirmed the same thing — the data layer is solved, the decision layer is not.

2. White-label is hygiene, not a differentiator. A branded PDF on its own loses interest fast. The branded snapshot only matters when the actions inside it are good.

3. The "free first month" frame works better when paired with a concrete exchange (two short calls, anonymised learnings) than when framed as a discount. Owners are tired of fake scarcity.

4. The hardest copy decision was admitting the tool does NOT replace Ahrefs, Semrush, Screaming Frog or Looker. Owners visibly relax when they read that on the homepage.

5. The most-requested feature is something I haven't built yet: scheduled monthly auto-send. It is on the roadmap, labelled as planned, not pretended to exist.

If you run an agency and any of this is interesting, I'll answer specifics in the comments. The pilot link is in my profile so I'm not breaking sub rules — happy to share it directly if a mod confirms it's allowed.

— internal note: AMA framing, no link in body (deferred to profile / mod permission). Numbered observations rather than offer block — distinct from Reddit 7. Use only after 30 days of comment history in r/agency.

# Webhealth Launch Month Promotion Kit

**Prepared:** 2026-03-11
**Public brand to use:** `Webhealth`
**Current public domain:** `https://webhealth.devbrew.dev`
**Primary CTA:** `See the sample report`
**Primary destination:** `https://webhealth.devbrew.dev/demo`

## Positioning

Use this one-liner everywhere public until you decide to rebrand the site:

> Webhealth helps founders doing their own SEO understand what changed in organic traffic and what to fix first.

### Message house

| Pain | Proof to show | Product language to use | Default CTA |
|---|---|---|---|
| "Traffic changed, but the hard part is proving why." | Pages losing clicks, affected URLs, likely causes | `pages losing clicks`, `affected URLs`, `likely causes`, `next fixes` | `See the sample report` |
| "Current tools show data, not diagnosis." | Period-over-period changes tied to pages and causes | `what dropped`, `what changed`, `what to fix first` | `See the sample report` |
| "Technical issues only matter when they explain impact." | Crawl issue tied to affected pages or URLs | `technical issues tied to pages`, `crawl context`, `affected pages` | `See the sample report` |
| "Doing your own SEO means you need output, not a giant suite." | Ranked next fixes and plain-English report sections | `next fixes`, `priority`, `impact`, `start here` | `See the sample report` |
| "The useful report is the one that reduces decision fatigue." | One concrete next action, not a wall of metrics | `what dropped`, `likely causes`, `next fixes` | `See the sample report` |

### Writing rules

- Start with the pain, not the feature.
- Keep X posts concise and readable in one screen.
- Use plain outcomes before product labels: `pages losing clicks`, `likely causes`, `technical issues tied to affected URLs`, `next fixes`.
- Introduce `Quick Wins` and `Action Backlog` later, once the audience already understands the output shape.
- Do not claim traffic wins you cannot prove yet.
- Use only one CTA per post.
- For cold traffic, send people to the demo, not the homepage.

### Post formula

Use this order for most posts:

1. Observation: one specific thing that feels true in the workflow.
2. Proof: screenshot, GIF, or one concrete example as early as possible.
3. Product implication: what a better report should surface.
4. CTA: only on conversation posts and click posts.

### X voice reset

X should sound closer to Lukas' existing feed than to a marketing framework.

- Open with statements, not questions.
- Prefer short, blunt observations over structured hooks.
- Use first-person only when it feels natural.
- Avoid `Reply with...`, `What do you think?`, and similar engagement bait.
- Let the screenshot or GIF do more of the explaining.
- Keep X post types clear: no CTA on observation posts, one grounded question on conversation posts, `sample report below` on click posts.
- When you manually edit a live X post, treat that version as the new style reference and only roll the change forward into the upcoming X posts.
- LinkedIn and community posts stay more structured on purpose; only X gets this voice shift.

### Post mix

Use this split across the month:

- `50%` native proof or observation posts
- `25%` conversation posts
- `25%` direct click posts

### Month arc

- Week 1: problem recognition
- Week 2: workflow proof
- Week 3: actionability proof
- Week 4: fit, differentiation, conversion

## Channel rules

### X

- Post `3x/week`: Monday, Wednesday, Friday.
- Use Monday and Wednesday for native pain/proof posts.
- Use Friday for the direct click-driving post.
- Run `2 reply sprints/week` on Tuesday and Thursday.
- Avoid hashtag stuffing. One targeted keyword phrase in plain text is enough.

### LinkedIn

- Post every other Thursday.
- Reuse the strongest X idea as a short carousel or annotated screenshot set.
- Keep links light. The image or carousel should carry the story on its own.

### Founder community

- Post every other Tuesday.
- Lead with the user's workflow, not your messaging.
- Link only if the thread rules allow it.

## Screenshot and asset brief

Use these asset IDs in the CSV calendar.

### Asset 1: `demo-summary-kpis`

- Route: `/demo`
- Capture: header plus `Executive Summary` and KPI cards
- Crop targets: `16:9`, `4:5`, `9:16`
- Overlay text: `Traffic changed. Here's what to fix first.`
- Why it works: strongest single-shot proof of "before vs after" plus actionability

### Asset 2: `demo-quick-wins`

- Route: `/demo`
- Capture: `Quick Wins` section with lost clicks / near-win keywords visible
- Crop targets: `16:9`, `4:5`, `9:16`
- Overlay text: `Ranking is not the same as getting clicks.`
- Why it works: visually supports the "not just charts, actual priorities" story

### Asset 3: `demo-technical-issues`

- Route: `/demo`
- Capture: `Deep Dive Technical` plus crawl summary / issue counts
- Crop targets: `16:9`, `4:5`, `9:16`
- Overlay text: `Small technical issues quietly leak traffic.`
- Why it works: turns invisible problems into visible proof

### Asset 4: `demo-action-backlog`

- Route: `/demo`
- Capture: `Action Backlog` rows with effort and impact visible
- Crop targets: `16:9`, `4:5`, `9:16`
- Overlay text: `Not another dashboard. A ranked to-do list.`
- Why it works: supports the "what do I fix this week?" angle

### Asset 5: `workflow-report-setup`

- Route: authenticated dashboard flow
- Capture: property picker + date comparison flow from the new report dialog
- Crop targets: `16:9`, `4:5`, `9:16`
- Overlay text: `Connect once. Generate when traffic changes.`
- Why it works: supports the "one workflow instead of three tools" angle
- Fallback if you do not want to log in for capture: use the existing hero product screenshot in `apps/web/public/hero-screenshot.png`

### GIF 1: `gif-workflow`

- Flow: sync property -> create report -> land on finished report
- Length: `8-12s`
- Use for: Week 2 workflow post

### GIF 2: `gif-quick-win-detail`

- Flow: open one Quick Win or detail item to show the report is interactive and actionable
- Length: `6-10s`
- Use for: Week 3 actionability post

## UTM pattern

Use this pattern for every link:

```text
https://webhealth.devbrew.dev/demo?utm_source=<channel>&utm_medium=social&utm_campaign=launch_month1&utm_content=<angle>
```

Recommended `utm_content` keys:

- `traffic-detective`
- `workflow-gif`
- `before-after-report`
- `quick-wins-proof`
- `technical-issues-proof`
- `action-backlog-proof`
- `who-its-for`
- `monthly-pain-roundup`

## 30-day calendar

For A/B copy variants for every scheduled publishable post, see `docs/marketing/2026-03-11-webaudit-post-variants.md`.

### Week 1: 2026-03-16 to 2026-03-22

**Goal:** problem recognition first, proof second.

#### X post 1 - 2026-03-16

When traffic drops, the annoying part usually is not spotting it.

It is being 4 tabs deep before you even have an idea why that is.

Asset: none
CTA: no CTA
Format: single tweet

#### Community post 1 - 2026-03-17

If your search traffic dipped this week, what would you trust first?

GSC deltas.
Affected pages.
Crawl issues.
Something else entirely.

I keep seeing the same manual loop:
confirm the drop
find the pages
check for technical changes
turn that into one sensible next step

If the thread rules allow links, the sample report is here:
`https://webhealth.devbrew.dev/demo?utm_source=community&utm_medium=social&utm_campaign=launch_month1&utm_content=problem-feedback`

Asset: none
CTA: ask workflow question
Format: discussion post

#### X post 2 - 2026-03-18

This is still the annoying part for me:

something changed

and now I still have to open GSC, GA4, and crawl data myself.

Just to get an idea why that is.

Asset: `demo-summary-kpis`
CTA: no CTA
Format: single tweet

#### X post 3 - 2026-03-20

This is more useful to me than another ranking chart:

pages losing clicks
what likely changed
what to fix next

That is the part I want faster.

Sample report below:
https://webhealth.devbrew.dev/demo?utm_source=x&utm_medium=social&utm_campaign=launch_month1&utm_content=quick-wins-proof

Asset: `demo-quick-wins`
CTA: see the sample report
Format: single tweet

### Week 2: 2026-03-23 to 2026-03-29

**Goal:** workflow proof, then output proof.

#### X post 4 - 2026-03-23

Post 1:

Google sign-in should not turn into a scavenger hunt.

The useful flow is simple:
GSC + GA4
compare the time periods
run the crawl
show what changed

Post 2:

Then show me the pages that moved and what I should look at next.

That is the useful part.

Asset: `gif-workflow`
CTA: no CTA
Format: short thread (2 posts max)

#### X post 5 - 2026-03-25

A report still feels unfinished if it shows a drop but not:

which pages moved
what likely changed
what I should look at next

Otherwise I still need more tabs just to get an idea why that happened.

Asset: `demo-summary-kpis`
CTA: no CTA
Format: single tweet

#### X post 6 - 2026-03-27

Technical issues only get interesting once they explain the drop.

Broken links.
Missing meta descriptions.
Missing H1s.
Duplicate titles.

Tie them to the pages that moved and it gets a lot more useful.

Sample report below:
https://webhealth.devbrew.dev/demo?utm_source=x&utm_medium=social&utm_campaign=launch_month1&utm_content=technical-issues-proof

Asset: `demo-technical-issues`
CTA: see the sample report
Format: single tweet

#### LinkedIn post 1 - 2026-03-26

**Caption**

Founders doing their own SEO usually do not need more dashboards.

They need a faster path from:

something changed

to:

here is what likely changed and what to fix first

That is the workflow behind Webhealth:

- compare periods clearly
- add crawl context
- show affected pages
- rank the next fixes

If you want to see the report shape:
https://webhealth.devbrew.dev/demo?utm_source=linkedin&utm_medium=social&utm_campaign=launch_month1&utm_content=workflow-carousel

**Carousel outline**

1. Traffic changed. Now what?
2. Current workflow: GSC + GA4 + crawl + guesswork
3. Compare periods clearly
4. Show affected pages
5. Show likely causes and next fixes
6. CTA: See the sample report

Asset: `demo-summary-kpis`
CTA: see the sample report
Format: carousel post

### Week 3: 2026-03-30 to 2026-04-05

**Goal:** actionability proof.

#### X post 7 - 2026-03-30

A report gets a lot more useful once it stops dumping 97 issues on you.

More like:
start here
these pages moved
this is likely why

Asset: `gif-quick-win-detail`
CTA: no CTA
Format: single tweet

#### Community post 2 - 2026-03-31

When traffic drops, what do you trust enough to act on first?

1. before-vs-after traffic deltas
2. affected pages losing clicks
3. technical issues tied to those pages
4. ranked next fixes

I keep thinking the best output is the one that removes hesitation fastest.

If the thread rules allow links, here is the sample report:
`https://webhealth.devbrew.dev/demo?utm_source=community&utm_medium=social&utm_campaign=launch_month1&utm_content=output-feedback`

Asset: none
CTA: ask workflow question
Format: discussion post

#### X post 8 - 2026-04-01

A report still feels unfinished if it shows a drop but not:

the pages that moved
what likely caused it
what to look at next

That is a lot more useful than another dashboard.

Asset: `demo-action-backlog`
CTA: no CTA
Format: single tweet

#### X post 9 - 2026-04-03

Post 1:

If a report leaves me wondering what to do next, it still feels unfinished.

I want:
what moved
why that likely happened
what I should look at first
which pages are involved

Post 2:

That is a lot better than just "issues found."

Sample report below:
https://webhealth.devbrew.dev/demo?utm_source=x&utm_medium=social&utm_campaign=launch_month1&utm_content=action-backlog-proof

Asset: `demo-action-backlog`
CTA: see the sample report
Format: short thread (2 posts max)

### Week 4: 2026-04-06 to 2026-04-12

**Goal:** fit, differentiation, conversion.

#### X post 10 - 2026-04-06

Webhealth is for people doing their own SEO and wanting a faster idea of what changed.

Not for people who want the biggest suite possible just because it has more tabs.

That tradeoff feels fine to me.

Asset: none
CTA: audience-fit statement
Format: single tweet

#### X post 11 - 2026-04-08

Most tools already show me enough data.

The harder part is turning that into an idea of what actually changed.

That is the part I care about.

Asset: `demo-summary-kpis`
CTA: no CTA
Format: single tweet

#### X post 12 - 2026-04-10

Post 1:

If I am doing SEO myself, I do not want a bigger suite.

I want to see:
what changed
which pages moved
what likely caused it
what to look at next

Post 2:

That is the direction with Webhealth.

Sample report below:
https://webhealth.devbrew.dev/demo?utm_source=x&utm_medium=social&utm_campaign=launch_month1&utm_content=monthly-pain-roundup

Asset: `demo-summary-kpis`
CTA: see the sample report
Format: short thread (2 posts max)

#### LinkedIn post 2 - 2026-04-09

**Caption**

After a few weeks of sharing this workflow, one thing feels clearer:

founders doing their own SEO do not need more visibility in the abstract.

They need a faster path from:

something changed

to:

these pages were affected, this likely caused it, start here.

That is the report shape I keep pushing Webhealth toward:

- comparison before snapshot
- traffic change with crawl context
- affected URLs before generic issue lists
- next fixes instead of more charts

The strongest reactions so far have been to the parts that shorten diagnosis time.

Sample report:
https://webhealth.devbrew.dev/demo?utm_source=linkedin&utm_medium=social&utm_campaign=launch_month1&utm_content=recap-post

**Carousel outline**

1. Seeing the change is step one
2. Diagnosis is the slow part
3. Compare periods clearly
4. Show affected pages
5. Add technical context
6. Rank the next fixes
7. CTA: See the sample report

Asset: `demo-summary-kpis`
CTA: see the sample report
Format: carousel post

## Reply sprint prompts

Use these during Tuesday/Thursday reply sessions:

- "What do you trust first when traffic moves: deltas, pages, or technical context?"
- "Does GSC alone ever feel enough to explain a drop?"
- "What takes the longest right now: confirming the drop, finding the pages, or deciding what to fix?"
- "Would you rather see affected pages first or a longer issue list?"
- "What makes you act faster: likely causes or ranked next fixes?"
- "What boring technical issue has explained a drop for you before?"

## Weekly review checklist

Check this every Friday after the direct-response post:

- X impressions
- X profile visits
- demo link clicks
- `/demo` visits
- sign-up starts
- replies that mention a real pain point
- which asset got the most clicks
- which hook got the most qualified replies

Double down only on posts that drive:

- demo clicks
- useful replies
- repeat profile visits

## Product Hunt gate

Only move into Product Hunt prep if all of this is true:

- the app is publicly usable today
- the demo reflects the real product quality
- onboarding is clean enough that traffic will not bounce immediately
- you can prepare a first comment, teaser, and gallery without scrambling

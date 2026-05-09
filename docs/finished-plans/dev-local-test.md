Here's the full procedure:
                                               
---                                                                                                                                                                       
Step 1 — DB migrations (run once from repo root)                                                                                                                          
cd /Users/cancelcloud/Developer/DevBrew/WebHealth
pnpm db:push                                                                                                                                                              
This pushes the Drizzle schema to Neon. After that, seed the plan settings:
pnpm db:seed:plan-settings

  ---
Step 2 — Start the worker (terminal 1)
cd /Users/cancelcloud/Developer/DevBrew/WebHealth/.worktrees/pre-launch
pnpm worker

  ---
Step 3 — Start the web app (terminal 2)
cd /Users/cancelcloud/Developer/DevBrew/WebHealth/.worktrees/pre-launch
pnpm dev
Then open https://webhealth-xy.localcan.dev.

  ---
What to test:

1. Onboarding modal — sign in with a fresh account (no properties), should see the modal, sync fires, 3-step guide appears, "Go to Properties →" navigates away and sets
   webhealth_welcomed in localStorage
2. Pricing page — visit /pricing directly, check metadata title in browser tab
3. Agency card — on / and /settings, verify "Coming Soon" badge, no price/feature list, mailto link works
4. Settings tabs — only "Account" and "Contact Us" visible (no Notifications), no "View Devices" button, GitHub Discussions link in Contact Us
5. Report page — open any report, disabled "Share" button with tooltip should appear
6. Sidebar usage card — check "Deep Dives" label with ? tooltip (only visible on paid plans with limits)
7. Stripe checkout — upgrade flow should redirect back correctly (uses NEXT_PUBLIC_APP_URL now, not hardcoded URL)

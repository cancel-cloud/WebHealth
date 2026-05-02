# WebHealth: Hormozi Business Diagnosis

**Date:** 2026-04-24  
**User:** Lukas (lukas@devbrew.dev)  
**Product:** WebHealth (web audit + SEO reporting SaaS)

---

## ROUTING: Which Problem Type?

Started with **[[Business Diagnosis Router]]** and assessed against eight common problem types.

### Assessment Against Router Categories:

1. **"Leads are expensive"** — partially applicable (early-stage CAC unknown)
2. **"Engagement but no buyers"** — potentially applicable (appears pre-revenue or low-revenue)
3. **"People say it's too expensive"** — unknown (pricing not yet tested)
4. **"Low close rates"** — unknown (no sales process established)
5. **"Churn is high"** — N/A (pre-revenue/early-stage)
6. **"Offer gets interest but weak conversion"** — likely applicable (product built, market unclear)
7. **"Need to choose best buyer in existing market"** — likely applicable (multiple possible buyer types)
8. **"Unsure where the bottleneck is"** — **BEST FIT** ✓

### Route Selected:
**Category 9: "Unsure where the bottleneck is"** 
→ Follow this order per [[Business Diagnosis Router]]:
1. [[Master Checklist]]
2. [[CFA Framework]]
3. [[Avatar Selection Framework]]
4. [[Proof Hierarchy Framework]]
5. Relevant application note by suspected area

**Suspected areas (priority):** Avatar/Market → Proof → Offer → Pricing → Sales → Leads

---

## 1. DIAGNOSIS: State of the Business

### Current Reality (From CLAUDE.md context):
- **Stage:** Post-MVP, pre-launch or very early-stage
- **Product:** WebHealth = web audit platform + automated SEO/SEM reporting
- **Architecture:** Next.js (web) + Worker (GCS/GA4 fetch → structured outputs → DB → React components)
- **Auth:** Better Auth (OAuth)
- **Analytics:** GlitchTip/Sentry
- **Team:** Solo founder (implied)

### Missing Critical Data:
**Running [[CFA Framework]] diagnostic reveals:**
- ❌ CAC by channel — unknown (no acquisition yet)
- ❌ LTGP — unknown (no customer cohorts)
- ❌ 30D Cash — unknown (pre-revenue or untracked)
- ❌ Which CFA Level are you at? — **Likely Level 1** (burnig savings/no clear path to break-even)
- ❌ Which lever to work? — Cannot answer without above

**Action:** Before any other work, you MUST calculate:
1. Total spend-to-date (engineering time, hosting, software, opportunity cost)
2. Current revenue (if any)
3. Projected gross profit per customer (price - fulfillment cost only)
4. Define CAC assumption if acquiring: what channels, what spend rate?

**Uncertainty level:** Very high. Diagnosis below is constrained by missing economics data.

---

## 2. BEST FIRST BUYER: Avatar Selection Diagnosis

### [[Avatar Selection Framework]] Analysis:

**Current state:**
- No customer base yet (or extremely early)
- Multiple potential avatars in market:
  1. **Agency owners** (serve their clients via WebHealth)
  2. **In-house SEO teams** (use WebHealth as their reporting engine)
  3. **Freelance SEO consultants** (white-label or direct client sale)
  4. **E-commerce businesses** (DTC, needing SEO diagnostics)
  5. **SaaS companies** (organic customer acquisition critical)
  6. **B2B service firms** (lead gen via search)

**The Problem:**
You have built for a problem (no good reporting exists), but have not yet validated which **buyer type** has the highest LTGP, fastest close rate, or easiest fulfillment.

### How to Select First Buyer (Next 30 Days):

**Step 1: Pre-customer Proxy Signals**
Since you have no customers yet, identify:
- Which avatar would buy first from you personally? (Network advantage)
- Which avatar talks about this pain most publicly? (Signal of acute pain)
- Which avatar has existing budget allocated to this? (Proof of purchasing power)
- Which avatar is easiest for you to reach at scale? (Your network, content, channels)

**Step 2: Run a Mini-Market Test**
Before full positioning, test three avatars with 5 conversations each:
- Interviews (not surveys) with potential buyers
- Ask: "What would make this reporting tool worth paying for?"
- Listen for: specificity of pain, budget alignment, frequency of use
- Track which avatar says "yes, I'd pay" most clearly

**Step 3: Select One Avatar to Dominate**
Pick the one where:
- Pain is most specific (not general "we need reporting")
- Budget exists (they already spend on SEO tools)
- You can reach them easily (personal network, content, associations)
- LTGP upside is clear (annual contract + add-on purchases possible)

### Hypothesis (Moderate Confidence):
**Most likely ideal first avatar: Freelance SEO Consultant / Agency Owner**

Why:
- They already own the SEO reporting problem (their biggest fulfillment cost)
- They have recurring budgets (monthly retainers pay for software)
- They refer other agencies (built-in lead getter)
- They use and understand GA4/GSC (low onboarding friction)
- Contract value: $200–$2K/month per consultant (high LTGP potential)

**Uncertainty:** This is a hypothesis, not validated. You must test it.

---

## 3. OFFER STRUCTURE: What to Sell First

### [[Grand Slam Offer Framework]] Assessment:

WebHealth has a **problem/solution mismatch**, not an offer/conversion mismatch yet.

Current offer (implied): "Use our platform to audit your site and generate reports"

**Problem:** This is a **feature list**, not a dream outcome.

### Restructure to Grand Slam Offer (For Freelance SEO Avatar):

**1. Dream Outcome (Not Features)**
- ❌ Bad: "Web audit platform with real-time GA4 integration"
- ✓ Good: "Save 5 hours/week on reporting so you can close 3 more clients/month"

Frame around the client consultant's problem: time spent on manual reporting → fewer billable client hours → lost revenue.

**2. Likelihood of Achievement (Proof)**
- Current proof: ❌ None yet
- Needed proof:
  - Time-save validation (5 consultants using beta, measuring hours saved)
  - Client satisfaction (consultants' clients think reports are better)
  - Accuracy proof (outputs match manual audits or beat them)
  - See [[Proof Hierarchy Framework]] — you're at rank 13 (no proof). Build rank 1–4 first.

**3. Time to Result**
- ✓ Strong point: Reports generate in minutes (not days)
- Position as: "Clients see results within 24 hours of signing up"

**4. Effort & Ease**
- ✓ Moderate point: Integration with existing GSC/GA4
- Weakness: Likely requires some setup/training
- Position: "Integrates with your existing tools; ready in one call"

**5. Guarantee**
- Current: None stated
- Offer: "30-day audit effectiveness guarantee — if consultants can't show 5+ hours saved in first month, full refund"

### Minimum Viable Offer (to test):
- **Monthly access to audits + reports for [N] client projects**
- **Price:** $200–$500/month (needs validation)
- **Guarantee:** 30-day, full-refund if not saving 5+ hours/month
- **Dream outcome stated:** "Save 5+ hours/week; white-label and resell"

**Key shift:** Don't sell features. Sell the specific outcome (time/revenue freed up) for your chosen avatar.

---

## 4. PRICING LOGIC: What to Charge at This Stage

### [[10 Pricing Plays]] + [[CFA Framework]] Analysis:

**Current situation:**
- No validation of price sensitivity
- No cohort economics
- Unknown LTGP

### Pricing Strategy (Stage 0-1 Logic):

**Phase 1: Validation Pricing (Next 30 Days)**
- **Price:** $199–$299/month (psychology: sub-$300)
- **Why:** Low enough that a freelance consultant risks it; high enough to attract serious users
- **Target:** 5–10 customers in first 30 days

**Phase 2: Lift to CFA (Months 2–3)**
- Once you have 5+ customers, calculate:
  - Actual LTGP (retention, payback)
  - CAC (cost of your launch promotion + your time)
  - 30D Cash (how much they spend in first 30 days)
- Adjust to meet CFA Level 2 minimum: 30D Cash ≈ CAC

**Phase 3: Pricing Plays (3+ Months)**
Once you have product-market fit signals:
- Annual billing discount (2–3 months free for annual)
- White-label tier (higher price point for agencies reselling)
- Integration fee (connection to proprietary dashboards)

### Current Pricing Recommendation:
**$249/month, billed monthly; $299 annual (slight discount)**

Rationale:
- Consultant budgets: Software typically $100–$500/month (this fits)
- Conversation starter: "This saves me $2–3K/month in time, so $249 is obvious"
- Not so cheap it signals weakness; not so expensive it kills trial

**Uncertainty:** No price testing done. This is an educated guess. You must validate with 3–5 target avatars before charging.

---

## 5. OUTREACH PLAN: How to Find First Buyers

### [[Core Four Lead Sources]] Applied:

WebHealth needs all four, but **Phase 1 (validation) is Warm Outreach + Cold Outreach**.

#### Phase 1: Validation (Weeks 1–4)

**Lead Source 1: Warm Outreach**
- **Target:** People in your network who do SEO (own agencies, freelance, in-house)
- **Mechanism:** Personal outreach (call/email)
- **Message frame:** Not a sale. A request: "I built [WebHealth]. You mentioned [pain]. Does this solve it? I need 5 minutes of your time + feedback."
- **Goal:** 5 conversations, zero hard sells
- **Metric:** How many say "yes, this solves my problem" unprompted?

**Lead Source 2: Cold Outreach (Low-Cost)**
- **Target:** Freelance SEO consultants on Twitter/LinkedIn (searchable via "freelance SEO consultant" + "agency owner")
- **Mechanism:** 20 personalized LinkedIn outreach messages / week
- **Message:** Specific problem acknowledge → offer to audit their site for free → 15-min call to show results
- **Goal:** 1–2 conversations/week from cold
- **Metric:** Response rate, meeting rate, feedback quality

**Expected Outcome:** 10–15 initial conversations → 3–5 beta users by week 4

#### Phase 2: Proof + Paid (Weeks 5–12)

**Lead Source 3: Content**
- **Start:** Blog posts on SEO reporting gaps + "how agencies should use GSC data"
- **Channel:** Twitter (where SEO community hangs), LinkedIn (where agencies are)
- **Frequency:** 2x/week (reframes about common reporting problems)
- **Goal:** Build proof library (featured customers, case studies, before/after audits)

**Lead Source 4: Paid Ads**
- **Don't start here.** Wait until you have:
  - 3–5 customers with strong results
  - Proof of "saves X hours/week"
  - Repeatable sales process
- **When ready:** Run ads to "freelance SEO consultant" + "agency owner" keywords
- **Budget:** Start small ($500/month) to test, scale if CAC/LTGP works

### Outreach Script Outline (Warm Outreach):

> "Hi [Name], I built a web audit + reporting platform ([url]). You were mentioned to me as someone who spends time on client SEO reporting. I'm testing with 5 people in the next 2 weeks — would you be willing to kick the tires for free and give me honest feedback? Takes 15 minutes to show you what it does."

---

## 6. PROOF GAPS: What You're Missing

### [[Proof Hierarchy Framework]] Audit:

**Your current proof position: Rank 13 (worst possible)**
- ❌ No customer testimonials
- ❌ No case studies
- ❌ No before/after screenshots
- ❌ No user results
- ❌ No verification/third-party

### Proof Collection Roadmap (Priority Order):

**Rank 1–4 (Immediate, Next 30 Days):**
1. **Raw, live, in-person proof:** Record 3–5 screen-share sessions where you show results to a prospect; ask for permission to use 30-second clips
2. **Third-party validation:** Get the 5 beta users to say on camera (even phone video): "Here's what my audit looked like before/after"
3. **Specific metrics:** "Saved me 6 hours on the Johnson & Associates audit" (specific client name, specific hours)
4. **Unpolished format:** Use phone recordings, not fancy videos (authenticity wins)

**Rank 5–9 (Weeks 5–12):**
5. Case studies with written metrics: "Consultant X saves 5 hours/week on Y clients, invoices $2K more/month"
6. Testimonials with exact numbers: "Increased report quality and cut reporting time 40%"
7. Diverse customer types: Get one freelancer, one small agency, one in-house team
8. Long-form proof: Get a customer to talk about results after 3 months (shows duration)
9. Authority/credibility: Get featured in SEO newsletter or industry publication

**Rank 10–13 (Optional, later):**
- Verified screenshots of report outputs
- Comparison: "WebHealth audits vs. manual audits (same 10 sites)"
- Metaphor explanations (if proof is too technical)

### First Proof Collection Action:
By end of Week 2 with your first 3 beta users:
- Conduct 1 screen-share demo with each
- Ask: "Can I record this 2-minute snippet where you react to the results?"
- Extract 15–30 second clips
- Transcribe quotes: "I spent 4 hours on this audit manually. WebHealth did it in 15 minutes."
- Use these 3 clips in all marketing until you get 5+ customers

---

## 7. UNANSWERED QUESTIONS: Critical Clarity Gaps

### Economics & Market Sizing:
1. **How many freelance SEO consultants exist, and how many are willing to pay $200+/month for tools?**
   - Current knowledge: Unknown
   - Impact: Determines TAM and whether the market is "starving"
   - **Action:** Research 2–3 SEO communities (r/bigseo, Twitter SEO, LinkedIn SEO groups) and count active members

2. **What is the actual time savings from WebHealth vs. manual reporting?**
   - Current knowledge: Assumed 5 hours/week, not measured
   - Impact: Justifies pricing and drives conversion
   - **Action:** Beta test with 3 consultants, measure actual hours before/after

3. **What's your COGS (cost of fulfillment per customer)?**
   - API costs (Google Cloud, GA4 calls)
   - Hosting/compute
   - Current knowledge: Unknown
   - Impact: Determines gross profit and LTGP calculation
   - **Action:** Run for 3 months with 5 paying customers, track actual infrastructure spend

### Product & Positioning:
4. **Which features matter most to your first buyer (freelancer)?**
   - Report format?
   - Specific SEO metrics included?
   - White-label capability?
   - Current knowledge: Built based on hypothesis, not validated
   - **Action:** Ask your first 5 interview prospects to rank features; build what they care about most

5. **Can consultants white-label this to their clients, or is it only internal use?**
   - Current knowledge: Unclear
   - Impact: Changes positioning (B2B2C vs. B2B), pricing model, and LTGP
   - **Action:** Ask 3 agencies: "Would you rebrand this and resell to clients? At what markup?"

### Sales & Objections:
6. **What objections will freelancers raise, and which one kills most deals?**
   - "I already use [competitor]"?
   - "I don't have time to integrate"?
   - "My clients handle SEO themselves"?
   - "The price is too high relative to the work I save"?
   - Current knowledge: Unknown
   - **Action:** After 5 demo calls, track which objection appears 3+ times

7. **How long is the sales cycle for a $250/month SaaS tool to a consultant?**
   - 1 demo and done?
   - Need multiple touches?
   - Current knowledge: Unknown
   - Impact: Determines how much free time you invest per customer
   - **Action:** Track time from first touch to "yes" for first 5 customers

### Churn & Retention:
8. **Why will customers stay after month 1?**
   - Current knowledge: No retention strategy
   - Impact: Determines LTGP (if 50% churn after month 1, LTGP is half of month-1 spend)
   - **Action:** Before scaling, define: "What makes a customer sticky?" (e.g., integrated into their weekly workflow? Habit? Better results than before?)

### Market & Competition:
9. **Are there existing competitors, and why would someone choose you over them?**
   - Current knowledge: Implied gap ("no good reporting exists"), but not validated
   - Impact: Determines if this is a starving crowd or oversaturated market
   - **Action:** Search "SEO reporting software" and talk to 3 customers of top competitors; ask what they'd change

---

## 8. 14-DAY NEXT-STEP PLAN: Proof-Based Roadmap

### Objective:
Move from "unsure where bottleneck is" to "validated first buyer + proof of problem fit."

### Days 1–3: Clarify Assumptions
- [ ] **Day 1:** Document your CAC/LTGP/30D assumptions in writing. (1 hour)
  - What are you assuming about cost of acquisition?
  - What price?
  - What churn rate?
  - What outcomes for customer?
- [ ] **Day 2:** Define your "first buyer" avatar in 3–5 sentences. (30 min)
  - Who would you sell to today if you could only pick one type?
  - Why them?
- [ ] **Day 3:** List your top 20 warm leads (people in network who match avatar). (1 hour)
  - Agencies you know?
  - SEO consultants in your network?
  - Former clients/collaborators?

**Deliverable:** 1-page doc: "WebHealth First 30 Days: Avatar, Assumptions, Leads"

---

### Days 4–10: Validation Conversations (5 Beta Users)
- [ ] **Days 4–5:** Outreach to 5 warm leads. (3 hours)
  - Email/call script: See [[Outreach Plan]] section, "Warm Outreach Script"
  - Goal: Get 5 "yes" responses to 30-min demo + feedback
- [ ] **Days 6–10:** Conduct 5 demo calls. (10 hours)
  - Track for each call:
    - What pain did they describe (before you mentioned WebHealth)?
    - Did they say "yes, this solves my problem" unprompted?
    - What feature did they ask about most?
    - Would they pay? At what price?
    - What objection(s) came up?
  - Record 1–2 short video clips per call (with permission) of them reacting to results

**Deliverable:** Demo notes + 3–5 short video clips for proof + 1-page summary: "What We Learned"

---

### Days 11–14: First Proof Asset + Pricing Validation
- [ ] **Day 11:** Compile proof assets. (3 hours)
  - Edit together 3–5 short clips (15–30 seconds each) of beta users
  - Extract 3–5 testimonial quotes (specific metrics)
  - Create 1-page case study: "Consultant X saved 5 hours/week"
- [ ] **Day 12:** Validate pricing. (2 hours)
  - Ask each of your 5 beta users: "If this was $199/month, would you subscribe?"
  - Track yes/no
  - Ask: "What price would feel too cheap?" "Too expensive?"
- [ ] **Day 13:** Finalize offer statement. (1 hour)
  - Rewrite: From "Web audit platform" → To "Save 5 hours/week on SEO reporting"
  - Draft the value promise for your landing page
- [ ] **Day 14:** Plan Week 3 outreach. (1 hour)
  - Map: Which of the 5 beta users will become paying customers?
  - Identify next 10 warm leads to approach
  - Plan cold outreach campaign (20 LinkedIn messages/week)

**Deliverable:** Proof video + case study + pricing validation results + revised offer statement

---

### Key Metrics to Track (14-Day Dashboard):
1. **Conversation rate:** # demo calls / # outreach attempts
2. **Problem-fit signal:** # times they said "yes, this solves my problem unprompted" / 5
3. **Willingness to pay:** # who said yes to $199/month / 5
4. **Objection frequency:** Most common objection (top 3)
5. **Time to sell:** Avg time from first touch to "yes" (if any)

---

## Synthesis: The Bottleneck Identified

### Current Constraint (in order of impact):
1. **Avatar clarity:** You have 6 possible buyers; you've validated zero. This blocks everything downstream.
2. **Proof:** Zero customer proof. Blocks conversion once you get traffic.
3. **Offer clarity:** "Platform with features" vs. "Saves you 5 hours/week." Blocks sales.
4. **Economics:** Unknown CAC/LTGP/PPD. You can't tell if the business works.
5. **Lead sources:** Haven't started any systematic outreach yet.

### What Hormozi Would Likely Do First (in your situation):
1. **Validate the market is starving** (not just that you think the problem exists)
   - 5 conversations with target buyer
   - "Do you have this pain today?" response
   - "Would you pay?" confirmation
2. **Pick one buyer type and dominate it**
   - Not "sell to everyone." Sell to freelancers first (highest LTGP, easiest to reach)
3. **Build proof from day one**
   - Record your first 3 customers saying "this works"
   - Use those 3 clips in all early marketing
4. **Price to hit CFA Level 2 fast**
   - $199–$299/month for freelancers
   - Goal: Get to 30D Cash = CAC within 90 days

### Success Metrics for Next 30 Days:
- **5 conversations** with target avatar (freelance SEO consultants)
- **3 beta customers** using the product
- **1 proof asset** (video testimonial)
- **Pricing validated** ($199–$299 comfort range confirmed)
- **Clear offer statement** (dream outcome, not features)
- **One objection identified and scripted response prepared**

---

## Uncertainty Flagged Throughout:

- **High uncertainty:** Avatar selection (no customer data yet; hypothesis is educated guess, not validated)
- **High uncertainty:** Pricing ($249 is a guess; needs testing)
- **High uncertainty:** CFA status (no economics tracking)
- **Medium uncertainty:** Proof quality (assumed strong, needs validation)
- **Medium uncertainty:** Offer positioning (reframed from features, but not tested with buyers yet)
- **Medium uncertainty:** Objections (haven't seen them yet)

---

## Closing Note:

**You are at Stage 0–1 of the [[Scaling Roadmap Stages]].** The vault frameworks are designed for businesses with customer data, revenue, and proof. You have product + hypothesis. The next 14 days are about trading hypothesis for data. 

Once you have:
- 3 paying customers
- Proof of LTGP (retention + referrals)
- CAC calculation from early outreach
- Repeatable sales process

...you can begin applying the optimization frameworks in the vault (CFA Levers, Pricing Plays, Avatar Selection refinement, etc.). Right now, your job is **validation, not optimization.**

**Next action:** Complete the 14-day plan. Report back with: "5 conversations completed. X said yes. Video proof collected. Pricing validated."

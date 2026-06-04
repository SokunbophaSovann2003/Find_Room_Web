# Joul — 8-Week Pre-Launch Plan
### May 29 – July 26, 2026

---

## Context

Today is **Friday, May 29, 2026**. Launch target is **the week of July 20–26, 2026**, to catch the August Cambodian university intake. That gives us exactly **8 weeks**.

The MVP is mostly built but currently runs in localStorage demo mode — no real backend, no real users, no real listings persisted to the cloud. These 8 weeks must close that technical gap while simultaneously seeding both sides of the marketplace: landlords and student renters.

---

## Definition of Launch Readiness

By launch day we must have **all** of the following:

- Joul running on a real domain (e.g. joul.kh) with HTTPS, served from production hosting
- Firebase Firestore as the real data layer for rooms and users (demo mode disabled)
- Firebase Storage handling all image uploads (no more data URLs in localStorage)
- Auto-occupy feature working end-to-end (tested by manipulating `lastActivityAt`)
- **20+ active, verified landlord listings** (real rooms, real photos, real phone numbers)
- **200+ student users** registered or engaged (Telegram channel members + Facebook page followers + registered accounts combined)
- Khmer-first UI confirmed by 5+ native testers
- Working analytics — daily active users, listings created, contact taps visible in a dashboard
- Public Telegram channel and Facebook page with 4+ weeks of content history
- Printed pitch card / A6 flyer with Telegram QR code for door-to-door
- Terms of Service and Privacy Policy live on the site
- A written 24-hour incident response plan (who to call when something breaks)

---

## Roles

**Bobe (you):**
- All landlord outreach, warm and cold
- Pitch refinement (iterate the script every week based on real reactions)
- Social media content (Facebook page, Telegram channel, TikTok if chosen)
- Student recruitment partnerships and outreach
- Brand decisions (logo, colors, copy, voice)
- Talking to early users — landlords and students alike

**Tech Team:**
- Firebase setup and configuration
- All backend wiring (auth, rooms, storage, security rules)
- Deployment to production hosting
- Domain and DNS setup
- Bug fixes and performance optimization
- Analytics integration
- QA testing infrastructure

**Shared (Bobe + Tech Team):**
- Weekly milestone reviews (every Sunday evening)
- Soft launch and bug triage
- Launch day execution
- Daily standup during launch week

---

## Weekly Sync Rhythm

- **Sunday 7–8 PM:** Full team weekly sync. What got done, what didn't, what's blocking, what's next week's plan.
- **Wednesday evening:** Mid-week check-in (text or quick call). Are we still on track for Sunday's milestone?
- **Daily during launch week (July 20–26):** 15-minute morning standup.

---

# Week 1 — Foundation
### June 1 – June 7

**Theme:** Real backend exists. Real network is mapped.

### Tech Team Deliverables
- Create a real Firebase project under an account Bobe owns
- Wire `.env.local` with real Firebase keys; demo mode disabled
- Migrate `Room` writes from localStorage to Firestore (List Room form writes to Firestore; Explore reads from Firestore)
- Auth flow now creates real Firebase users (not localStorage sessions)
- Deploy to a staging URL (Vercel preview, Firebase Hosting, or similar)
- Smoke test: register, list a room from device A, see it from device B

### Bobe Deliverables
- Write a full list of warm-network landlord prospects — **minimum 10 names**. Include name, phone, relationship, and estimated number of rooms each one has.
- Contact your own landlord first. Ask: would they let you list their building's rooms as Joul's very first listings, even before public launch?
- Draft a short Telegram + Facebook intro message to send to your 5 closest friends asking them to introduce you to landlords they know.

### Shared Deliverables
- **Decide:** domain name. joul.kh vs joulkh.com vs other. Buy it this week if available.
- **Decide:** brand color, logo, and basic visual identity. Lock it this week so it stops being a future decision.
- Sunday sync: review progress, adjust plan if needed.

### Risks This Week
- Firebase setup takes longer than expected → allocate buffer in week 2
- Bobe's network list comes back smaller than expected → if under 5 names by Friday, we revise strategy in Sunday sync

---

# Week 2 — First Real Listings
### June 8 – June 14

**Theme:** Real rooms on a real database.

### Tech Team Deliverables
- Image upload to Firebase Storage (replaces the localStorage data-URL approach)
- Auto-occupy feature deployed and tested in staging
- Firestore security rules: only the owner can edit/delete their own listing; anyone can read available rooms
- Set up Firebase Analytics (or Google Analytics); verify events fire — room view, contact tap, signup

### Bobe Deliverables
- Sign up **3–5 of your warm-network landlords personally**. Sit with them. List their rooms together.
- Photograph each room yourself if needed — quality matters, this is the demo content for everyone else
- Each listing must have: 3+ real photos, accurate price, real phone or Telegram, complete description in Khmer
- Iterate the pitch script after each conversation. Note what landed and what didn't.

### Shared Deliverables
- **Decide:** company registration timing. Register now, before launch, or after first revenue?
- Print **200 pitch cards** with Telegram QR and a one-line Joul promise in Khmer
- Sunday sync: first listings reviewed for quality, demo state confirmed

### Risks This Week
- Landlord conversations take longer than 20 minutes (especially older landlords) → block 90 minutes per visit, not 20
- Firebase Storage upload bugs on slow connections → test on real Khmer 4G, not on home Wi-Fi

---

# Week 3 — Cold Outreach Begins
### June 15 – June 21

**Theme:** Real strangers say yes.

### Tech Team Deliverables
- Production deployment on real domain (joul.kh or chosen alternative)
- HTTPS active; mobile performance pass on real devices (test on a 3-year-old Android phone, not the team's iPhones)
- Fix all P0 and P1 bugs surfaced in week 2
- Lighthouse score 80+ on mobile

### Bobe Deliverables
- Begin cold outreach: target **10 doors per evening, 2–3 evenings per week** (~30 doors/week)
- Realistic conversion: 1-in-5 says yes. Goal: 6 new cold landlords this week.
- **Running total by end of week 3: 9–11 active landlords**
- Start the Joul Facebook page and Telegram channel. Post the first 3 pieces of content (introduction, behind-the-scenes, first listing showcase).

### Shared Deliverables
- Write Terms of Service and Privacy Policy (Khmer-friendly template; do not over-engineer — 1-page each is fine for now)
- **Decide:** the first university to target for student recruitment. Visit it in person, take photos of bulletin boards, observe student traffic patterns.
- Sunday sync: outreach metrics review — doors knocked, conversion rate, common objections

### Risks This Week
- Cold conversion below 1-in-5 → pitch needs more iteration; do role-play with the team
- Bobe's energy / morale dips after the first few rejections → discuss support in Sunday sync; rejection is normal

---

# Week 4 — Mid-Point Reality Check
### June 22 – June 28

**Theme:** Honest assessment. Course-correct if needed.

### Tech Team Deliverables
- Implement the search filters that ship at launch (price range, area, property type — confirm with Bobe which exactly)
- Set up daily Firestore backup. Losing data is unrecoverable; back up from day one.
- Begin load testing with simulated 100 concurrent users
- Document the deployment process so any team member can deploy

### Bobe Deliverables
- **Running total by end of week 4: 13–15 active landlords**
- If we're below 10 landlords, we have a conversion problem and we rethink the pitch or the geography
- Lock the **student recruitment plan**: which specific Facebook groups, which Telegram channels, which university partnership contacts
- Reach out to 3 university student services offices or student associations directly. Ask for a meeting.

### Shared Deliverables
- **Mid-point honest review:** Are we on track for July 26 launch? If we're behind on landlords or tech, what do we cut?
- Sunday sync becomes a strategic review, not just a status update.

### Risks This Week
- Behind on landlord count → consider lowering the launch target to 15 listings, or pushing the launch by 1 week (better to delay than to launch dead)
- Behind on tech → identify which features can be dropped or simplified for v1

---

# Week 5 — Student Side Activated
### June 29 – July 5

**Theme:** Demand starts to gather.

### Tech Team Deliverables
- Final QA pass with 5 internal testers using real devices
- Performance: page load under 3 seconds on Cambodian 4G
- All admin tools tested — admin can mark rooms occupied, manage users, change settings
- Error monitoring set up (Sentry or similar — when something breaks, we know within 5 minutes)

### Bobe Deliverables
- **Running total by end of week 5: 16–18 active landlords**
- Begin student-side outreach in earnest:
  - Post in 5 active Facebook groups for Phnom Penh students looking for rooms
  - Join 3 Telegram student channels; engage organically before posting your own announcement
  - Reach out to 2 universities about flyering or dorm posters
- Aim to onboard the **first 20 students as "early renters"** — register them, gather their feedback before public launch

### Shared Deliverables
- **Decide:** launch day exact date (likely Saturday July 25 or Sunday July 26 for weekend traffic peak)
- **Decide:** launch announcement plan — Facebook post, Telegram broadcast, who shares it, what time
- Sunday sync: student channel growth review

### Risks This Week
- Student channels don't grow → student outreach needs more aggressive tactics (paid Facebook ads, partnerships, flyering on campus)
- Last-minute landlord defections (someone changes their mind) → expect this; replace from a waitlist of 5 backup landlords

---

# Week 6 — Soft Launch
### July 6 – July 12

**Theme:** Real users find real problems before strangers do.

### Tech Team Deliverables
- Soft-launch mode: site publicly accessible but not actively promoted
- All planned features are live
- Bug bash for any rough edges
- A "Report a problem" form added to the site

### Bobe Deliverables
- **Running total by end of week 6: 18–20 active landlords**
- Invite 30–50 trusted users (friends, family, classmates, early student contacts) to use Joul as if it were live
- Personally call or message 10 of them and walk through their experience
- Document every confusion, every bug, every "I didn't understand X"

### Shared Deliverables
- Daily check-ins this week — bugs and confusions need to be triaged within 24 hours
- Decide which soft-launch issues are launch blockers and which can ship as v1.1 (some imperfections are OK)
- Sunday sync: **go / no-go decision for the public launch in 2 weeks**

### Risks This Week
- Major bug surfaced that requires significant rework → may need to delay public launch by 1 week. Better to delay than to launch broken.
- Soft-launch users don't engage at all → real value-proposition problem; talk to them individually to understand why

---

# Week 7 — Hard Launch Prep
### July 13 – July 19

**Theme:** Everything is ready. Everyone is rested.

### Tech Team Deliverables
- All launch-blocker bugs from soft launch fixed
- Monitoring dashboards live — watch DAU, signups, listing creates, contact taps in real time
- Backup and disaster recovery rehearsal — pretend Firebase goes down for 1 hour, what happens?
- Final security review — security rules tight, no exposed API keys, rate limiting on signups to prevent spam

### Bobe Deliverables
- **Running total by end of week 7: 22–25 active landlords** (buffer above the 20 target — assume 2–3 will go silent at the last minute)
- Final pitch card / flyer ready in physical form
- Press / influencer / partner outreach: identify 3–5 local Khmer Telegram channels or Facebook pages that might cover the launch
- Write the launch announcement post in Khmer (and English version) — schedule it for launch morning
- 30-minute call with each of the first 5 landlords confirming they're ready and excited

### Shared Deliverables
- **Final go / no-go meeting on Friday July 17.** Are we ready? If not, what do we delay?
- Sunday sync: locked launch day plan, hour-by-hour

### Risks This Week
- Last-minute critical bug → have a hot-fix process ready
- Founder burnout (you and the team are tired) → rest deliberately Friday and Saturday this week, full energy for next week

---

# Week 8 — Public Launch
### July 20 – July 26

**Theme:** Hands on. Eyes open. Respond fast.

### Day-by-Day Schedule

**Monday July 20** — Soft pre-announcement. Tease the launch in your Telegram channel and Facebook page. "Joul launches this Saturday."

**Tuesday July 21** — Personally call each of your 20+ landlords. Remind them the public launch is Saturday. Confirm their listings are active and they're available to respond to inquiries.

**Wednesday July 22** — Post launch teaser content. Daily Telegram and Facebook posts begin. Tone: friendly, local, excited but not desperate.

**Thursday July 23** — Final QA pass. Final ad creative ready. Test that signup, login, list-room, and contact-landlord all work flawlessly from a fresh device.

**Friday July 24** — Quiet day. Rest. Eat well. Sleep early. You and your team will work hard tomorrow.

**Saturday July 25 — LAUNCH DAY**
- **8 AM:** Tech team confirms all systems green
- **9 AM:** Launch post goes live on Facebook page, Telegram channel, your personal accounts
- **9 AM:** Friends, family, early supporters share the post (line them up in advance)
- **10 AM – 10 PM:** Monitor closely. Any bugs, any signup problems, any landlord questions — answered within 30 minutes
- Track real-time: signups, listings viewed, contact taps
- **Evening:** Quick team sync — what worked, what's breaking, what's the priority for Sunday

**Sunday July 26** — Continue momentum. Run first targeted Facebook ads to student demographics in Phnom Penh. Personal outreach to 10 more potential landlords. Don't stop just because you "launched" — Sunday is half of the launch weekend.

### Daily Metrics to Track in Launch Week
- New user signups per day
- New listings created per day
- Total room views per day
- Contact button taps per day
- Site uptime (target 99.5%+)
- Median page load time (target under 3 seconds)

---

## Post-Launch (Week 9+)

Outside the scope of this 8-week plan, but worth previewing now so we don't go silent on day 8:

- **First-month measurement:** Of the 200 students who signed up, how many actually contacted a landlord? Of those contacts, how many actually rented? This is the metric that turns Joul from a "platform with users" into a "platform that produces rentals."
- **First post-launch retro (mid-August):** What did we learn? What surprised us? Iterate.
- Begin planning **Phase 2** — Stage 2 SaaS features for multi-unit landlords (paid dashboard, advanced analytics, eventually payments).

---

## Top 5 Risks Across the Whole Plan

1. **Firebase migration takes longer than estimated.** Mitigation: tech team starts in week 1, not week 2. Buffer built into week 2.
2. **Landlord cold conversion is below 1-in-5.** Mitigation: pitch iteration every week. If we hit week 4 below 10 total landlords, we change geography or pitch tactics.
3. **Student channels don't grow.** Mitigation: start social/Telegram in week 3, not week 5. Be ready to invest in paid Facebook ads if organic isn't working.
4. **Critical bug surfaces during soft launch.** Mitigation: build a hot-fix process in week 6. Don't promise instant fixes — promise transparency.
5. **Founder burnout.** Mitigation: respect the weekly sync rhythm. Take Saturdays after cold-outreach sessions off. Eat real meals. Sleep early. This is a marathon, not a sprint.

---

## What This Plan Does NOT Cover

- Monetization / revenue (Phase 2 territory; nothing paid in the first 90 days)
- Investor pitch deck (separate work; we tackle that next, after this plan is locked)
- Fundraising — grants and angels (discuss after launch traction is real)
- Company registration legal details (handled by a lawyer in parallel)
- Regional expansion beyond Phnom Penh (post-traction, post-MVP)

---

_Adjust anything that doesn't match your reality — your team size, your evenings free, your budget. We lock the final version at our next Sunday sync._

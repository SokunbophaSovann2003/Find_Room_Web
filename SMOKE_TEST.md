# JoulKH — Launch Smoke Test (Real Phone)

**Goal:** confirm a brand-new person can sign up, list a room, and that an admin approval makes it show up publicly.

**You need:**
- A **second phone** that can receive SMS (NOT `0973531332` — that's already the admin).
- The admin login: phone `0973531332`, password `Sokunbopha@22`.
- The site: **https://www.joulkh.com**

Tick each box as you go. If anything doesn't match the "✅ Expected" line, **stop and write down what you saw** (a screenshot is best).

---

## Part A — New user signs up  (use the SECOND phone)

1. On the second phone, open **https://www.joulkh.com**
2. Tap **Log in** (top right) → switch to **Register / Create account**
3. Enter the second phone's number and a password → tap continue
4. Wait for the **SMS code** to arrive on that phone
   - ✅ Expected: a text from **JoulKH** with a 6-digit code arrives within ~1 minute
5. Type the code → finish creating the account
   - ✅ Expected: account is created and you're signed in (you land on Explore or Profile)

**A passed?**  ☐ Yes   ☐ No — what happened: ________________

---

## Part B — That new user lists a room

6. Still signed in as the new user, tap **List room** (or the ➕ button)
7. Fill in the basics: a **title** (e.g. "Test Room — please ignore"), a short description, pick a location, set a price
8. Tap **Create / Publish**
   - ✅ Expected: you see a success message
9. Go to **Explore** and search/scroll for that room
   - ✅ Expected: the room does **NOT** appear yet (it's waiting for admin review)

**B passed?**  ☐ Yes   ☐ No — what happened: ________________

---

## Part C — Admin approves it  (can be the same phone or a computer)

10. Open **https://www.joulkh.com/user/admin**
11. Log in as admin: phone `0973531332`, password `Sokunbopha@22`
12. On the **Rooms** screen, look for the test room — it should be marked **Pending**
    - ✅ Expected: the test room is listed with a "Pending" status
13. Open it and tap **Approve** (or the approve action)
    - ✅ Expected: its status changes to **Published / Available**
14. Open a **normal browser** (or the second phone) and go to **Explore**
    - ✅ Expected: the test room now **appears** on Explore for everyone

**C passed?**  ☐ Yes   ☐ No — what happened: ________________

---

## Part D — "Help me find a room" request  (use the SECOND phone / new user)

15. Signed in as the new user, go to **Explore**
16. Tap the **"No time to search? Let us find a room for you"** banner near the top
    - ✅ Expected: the **Help me find a room** form opens
    - (If you tapped it while logged **out**, it should first ask you to log in)
17. Fill it in: your **phone** (required), a **budget**, pick a **location** and **type**, add a short **note** (e.g. "near a university") → tap **Submit request**
    - ✅ Expected: you see a **"Request received!"** confirmation
18. Log in as **admin** → open the **Requests** tab (bottom nav)
    - ✅ Expected: your request appears with the name, phone, and the details you entered
19. On the admin notification **bell** (top right), check for a new alert
    - ✅ Expected: a "New room request" notification is there; tapping it opens the Requests page
20. As admin, try **Mark handled**, then **Delete** on the test request
    - ✅ Expected: status changes, then the request is removed

**D passed?**  ☐ Yes   ☐ No — what happened: ________________

---

## After the test (cleanup)

21. As admin, **delete** the "Test Room — please ignore" listing so it doesn't clutter the real site.
22. As admin, **delete** the test "Help me find a room" request (if not already done in step 20).

---

## Result

- All four parts (A, B, C, D) passed → 🎉 the core loops work on real devices — ready to launch.
- Anything failed → note what you saw and send it to me; I'll fix it.

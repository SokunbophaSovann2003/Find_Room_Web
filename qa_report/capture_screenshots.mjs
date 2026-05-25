import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "screenshots_2026-05-22");
const BASE = "http://localhost:3000";
const WAIT = "domcontentloaded";

async function goto(page, url, settle = 800) {
  await page.goto(url, { waitUntil: WAIT, timeout: 60000 });
  await page.waitForTimeout(settle);
}

async function fresh(ctx) {
  await ctx.clearCookies();
  await ctx.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  });
}

async function setLangEN(page) {
  await page.evaluate(() => localStorage.setItem("findroom.language", "en"));
}

async function setAdminSession(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "findroom.session",
      JSON.stringify({ uid: "demo-85512000000", phoneNumber: "+85512000000" })
    );
  });
}

async function snap(page, name) {
  const path = join(OUT, `${name}.png`);
  try {
    await page.screenshot({ path, fullPage: false, timeout: 8000, animations: "disabled" });
  } catch (err) {
    console.log("retry", name, err.message?.slice(0, 60));
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path, fullPage: false, timeout: 15000 });
  }
  console.log("captured", name);
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await fresh(ctx);

  // ---------- Anonymous user ----------
  const page = await ctx.newPage();

  // 01 — explore desktop (clean, EN)
  await goto(page, `${BASE}/explore`);
  await setLangEN(page);
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(500);
  await snap(page, "01_explore_desktop");

  // 02 — Location picker open (locate by the first search bar button)
  const locBtn = page.locator('form button').first();
  await locBtn.click();
  await page.waitForTimeout(400);
  await snap(page, "02_location_picker");

  // Choose Phnom Penh -> BKK
  await page.locator('[role=dialog] button:has-text("Phnom Penh")').first().click();
  await page.waitForTimeout(200);
  await page.locator('[role=dialog] button:has-text("Boeng Keng Kang")').first().click();
  await page.waitForTimeout(200);
  await page.locator('[role=dialog] button:has-text("Show all rooms in Boeng Keng Kang")').click();
  await page.waitForTimeout(300);
  await snap(page, "03_explore_filtered_bkk");

  // Clear filter — also handle Khmer aria-label fallback
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Clear location"], button[aria-label="សម្អាតទីតាំង"]');
    btn?.click();
  });
  await page.waitForTimeout(400);

  // 04 — Property type filter open (second form button)
  await page.locator('form button').nth(1).click();
  await page.waitForTimeout(400);
  await snap(page, "04_property_type_open");

  // Click Condo via DOM (popover closes on outside click)
  await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('button'));
    const condo = opts.find(b => b.textContent.trim() === 'Condo');
    condo?.click();
  });
  await page.waitForTimeout(400);

  // 05 — Sort by price (third form button)
  await page.locator('form button').nth(2).click();
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('button'));
    const asc = opts.find(b => /Price: low to high/i.test(b.textContent.trim()));
    asc?.click();
  });
  await page.waitForTimeout(400);
  await snap(page, "05_sort_price_asc");

  // 06 — Map view (clear filters first)
  await goto(page, `${BASE}/explore`, 500);
  await setLangEN(page);
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(800);
  await page.locator('button[role=tab]').nth(1).click();
  await page.waitForTimeout(1500);
  await snap(page, "06_map_view");

  // 07 — Room detail
  await goto(page, `${BASE}/rooms/1`);
  await page.waitForTimeout(300);
  await snap(page, "07_room_detail");

  // 08 — Room contact modal — click via DOM (sticky button may be off-screen)
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Contact');
    btn?.click();
  });
  await page.waitForTimeout(500);
  await snap(page, "08_contact_modal");
  await page.evaluate(() => document.querySelector('button[aria-label="Close"]')?.click());
  await page.waitForTimeout(400);

  // 09 — Room location modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Location');
    btn?.click();
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('[role=dialog] button')).find(b => /Show map/i.test(b.textContent.trim()));
    btn?.click();
  });
  await page.waitForTimeout(2000);
  await snap(page, "09_location_modal");
  await page.evaluate(() => document.querySelector('button[aria-label="Close"]')?.click());
  await page.waitForTimeout(300);

  // 10 — Room not found
  await goto(page, `${BASE}/rooms/does-not-exist`);
  await snap(page, "10_room_not_found");

  // 11 — Login modal (anonymous: need fresh page without admin session)
  const anonCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const anonPg = await anonCtx.newPage();
  await goto(anonPg, `${BASE}/explore`);
  await anonPg.evaluate(() => localStorage.setItem("findroom.language", "en"));
  await anonPg.reload({ waitUntil: "domcontentloaded" }); await anonPg.waitForTimeout(700);
  await anonPg.locator('nav button').filter({ hasText: /Log in/i }).click();
  await anonPg.waitForTimeout(400);
  await snap(anonPg, "11_login_modal");

  // 12 — Register modal
  await anonPg.locator('button:has-text("Create one")').click().catch(() => {});
  await anonPg.waitForTimeout(400);
  await snap(anonPg, "12_register_modal");
  await anonPg.close();

  await page.close();

  // ---------- Logged-in (admin in user view) ----------
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const apage = await adminCtx.newPage();
  await goto(apage, `${BASE}/explore`);
  await setLangEN(apage);
  await setAdminSession(apage);
  await apage.reload({ waitUntil: "domcontentloaded" }); await apage.waitForTimeout(700);

  // 13 — Profile page
  await goto(apage, `${BASE}/profile`);
  await apage.waitForTimeout(500);
  await snap(apage, "13_profile_page");

  // 14 — Edit profile modal
  await apage.locator('button:has-text("Edit profile")').click();
  await apage.waitForTimeout(500);
  await snap(apage, "14_edit_profile_modal");
  await apage.locator('button:has-text("Cancel")').click().catch(() => {});
  await apage.waitForTimeout(300);

  // 15 — List room form
  await goto(apage, `${BASE}/profile/list-room`);
  await apage.waitForTimeout(400);
  await snap(apage, "15_list_room_form");

  // 16 — Validation error (publish blank)
  await apage.click('button:has-text("Publish listing")');
  await apage.waitForTimeout(400);
  await snap(apage, "16_list_room_validation");

  // 17 — Fees modal
  await apage.click('button:has-text("Add fees")');
  await apage.waitForTimeout(400);
  await snap(apage, "17_fees_modal");
  await apage.click('[role=dialog] button:has-text("Done")').catch(() => {});

  // ---------- Admin console ----------
  await goto(apage, `${BASE}/user/admin`);
  await apage.waitForTimeout(700);
  await snap(apage, "18_admin_rooms");

  // 19 — Edit listing modal — RowActions uses onBlur=close so use dispatchEvent
  await apage.evaluate(async () => {
    const row = document.querySelector('button[aria-label="Row actions"]');
    row?.click();
    await new Promise(r => setTimeout(r, 200));
    const edit = Array.from(document.querySelectorAll('[role=menu] button')).find(b => /^Edit$/.test(b.textContent.trim()));
    if (edit) {
      ["mousedown", "mouseup", "click"].forEach(ev =>
        edit.dispatchEvent(new MouseEvent(ev, { bubbles: true, cancelable: true, button: 0 }))
      );
    }
  });
  await apage.waitForTimeout(600);
  await snap(apage, "19_admin_edit_listing");
  await apage.locator('button:has-text("Cancel")').click().catch(() => {});
  await apage.waitForTimeout(300);

  // 20 — Admin users page
  await goto(apage, `${BASE}/user/admin/users`);
  await apage.waitForTimeout(500);
  await snap(apage, "20_admin_users");

  // 21 — Admin notifications
  await goto(apage, `${BASE}/user/admin/notifications`);
  await apage.waitForTimeout(400);
  await snap(apage, "21_admin_notifications");

  // 22 — Admin settings
  await goto(apage, `${BASE}/user/admin/settings`);
  await apage.waitForTimeout(400);
  await snap(apage, "22_admin_settings");

  // 23 — DUPLICATE BUG — return to /explore after admin visit
  await goto(apage, `${BASE}/explore`);
  await apage.waitForTimeout(700);
  await snap(apage, "23_bug_explore_duplicates");

  await apage.close();

  // ---------- Mobile screenshots ----------
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await mCtx.newPage();
  await goto(mp, `${BASE}/explore`);
  await mp.evaluate(() => localStorage.setItem("findroom.language", "en"));
  await mp.reload({ waitUntil: "domcontentloaded" }); await mp.waitForTimeout(500);
  await snap(mp, "30_mobile_explore");

  await goto(mp, `${BASE}/rooms/1`);
  await mp.waitForTimeout(400);
  await snap(mp, "31_mobile_room_detail");

  await mp.close();

  // ---------- Tablet screenshots ----------
  const tCtx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tp = await tCtx.newPage();
  await goto(tp, `${BASE}/explore`);
  await tp.evaluate(() => localStorage.setItem("findroom.language", "en"));
  await tp.reload({ waitUntil: "domcontentloaded" }); await tp.waitForTimeout(500);
  await snap(tp, "40_tablet_explore");
  await tp.close();

  // ---------- Khmer language ----------
  const kCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const kp = await kCtx.newPage();
  await goto(kp, `${BASE}/explore`);
  await kp.evaluate(() => localStorage.setItem("findroom.language", "km"));
  await kp.reload({ waitUntil: "domcontentloaded" }); await kp.waitForTimeout(500);
  await snap(kp, "50_explore_khmer");
  await kp.close();

  await browser.close();
  console.log("All screenshots captured to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

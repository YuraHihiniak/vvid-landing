# Yandex.Metrika Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Yandex.Metrika tracking (counter `110339563`) to the VVID landing, with two custom conversion goals (`brief_submit`, `telegram_click`), and ship it to production.

**Architecture:** Single-file change to `VVID.dc.html` — a standard Metrika snippet in `<head>`, one `reachGoal` call added to the existing brief-form success path, and one new tracking method wired to both existing Telegram CTA links via the file's `{{ handler }}` binding convention. No build step, no new files, no test framework — this repo is one self-contained HTML file served directly by Caddy.

**Tech Stack:** Vanilla JS, Yandex.Metrika tag.js, the project's own `support.js`/DC runtime (React+Babel via CDN, custom `{{ }}` binding syntax).

## Global Constraints

- Counter ID is `110339563` — use this exact literal everywhere `ym(...)` is called; do not introduce a config variable (YAGNI — single file, single counter, never changes without a code edit anyway).
- Every `ym(...)` call must be guarded with `window.ym &&` and wrapped in `try/catch` so an ad-blocker stripping the Metrika script cannot break the brief form or Telegram CTA.
- Only `VVID.dc.html` is touched. No other file in the repo changes.
- This repo has no automated test runner. "Testing" for every task below means: serve the file locally via the existing `vvid` launch config (`python3 -m http.server 8124`, open `http://127.0.0.1:8124/VVID.dc.html`) and verify behavior via the browser preview tools (network tab, console, clicks) — not via a unit-test command.
- Deploy (final task only) is `scp` + `ssh cp` to the GCP VM per `vvid-landing-deploy` — **not** `git push**. Confirm with the user before running the deploy commands (they are irreversible-ish: overwrite the live file).

---

### Task 1: Add the Metrika counter snippet to `<head>`

**Files:**
- Modify: `VVID.dc.html:39`

**Interfaces:**
- Produces: a global `window.ym` function (installed by the Metrika tag.js loader) that Tasks 2 and 3 call.

- [ ] **Step 1: Insert the snippet immediately before `</head>`**

In `VVID.dc.html`, the only closing `</head>` tag is at line 39. Replace it:

```
old_string:
</head>

new_string:
<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=110339563', 'ym');

    ym(110339563, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/110339563" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
</head>
```

- [ ] **Step 2: Start the local server**

Use the preview tool to start the `vvid` launch config (serves the repo root on :8124). If already running, reuse it.

- [ ] **Step 3: Verify the counter loads**

Open `http://127.0.0.1:8124/VVID.dc.html` in the preview. Check network requests for:
- A request to `https://mc.yandex.ru/metrika/tag.js?id=110339563` (status 200, or blocked by an ad-blocker — either is fine locally, just confirm the request was attempted and no page JS error resulted).
- Evaluate `typeof window.ym` in the console — expect `"function"` (or `"undefined"` if a local ad-blocker stripped it; if so, temporarily disable the blocker to confirm the snippet itself is correct, then re-enable it — the point of this check is to catch a syntax error in the inserted script, not to defeat ad-blockers).
- No new console errors introduced by the snippet.

- [ ] **Step 4: Commit**

```bash
cd /Users/securitsa/PycharmProjects/vvid/vvid-landing
git add VVID.dc.html
git commit -m "feat: add Yandex.Metrika counter (110339563)"
```

---

### Task 2: Fire `brief_submit` goal on successful brief-form submission

**Files:**
- Modify: `VVID.dc.html:1575-1596` (method `onSubmit`)

**Interfaces:**
- Consumes: `window.ym` (produced by Task 1).

- [ ] **Step 1: Add the `reachGoal` call to the success branch of `onSubmit`**

Current code (unchanged parts shown for context/anchoring):

```
old_string:
      const data=await r.json().catch(()=>({}));
      if(!r.ok || !data.ok) throw new Error('rejected');
      if(b){ b.disabled=true; b.style.opacity='1'; b.style.background='#1b1812'; b.style.color='#e4ded2';
        b.textContent=(en?'brief sent':'бриф отправлен')+(data.ticket?(' · '+data.ticket):' ✓'); }

new_string:
      const data=await r.json().catch(()=>({}));
      if(!r.ok || !data.ok) throw new Error('rejected');
      try{ window.ym && window.ym(110339563,'reachGoal','brief_submit'); }catch(e){}
      if(b){ b.disabled=true; b.style.opacity='1'; b.style.background='#1b1812'; b.style.color='#e4ded2';
        b.textContent=(en?'brief sent':'бриф отправлен')+(data.ticket?(' · '+data.ticket):' ✓'); }
```

This places the goal fire right after the response is confirmed successful (`data.ok` true) and before the button UI updates — a failed submission (caught by the surrounding `try/catch` in `onSubmit`, which sets `this._briefSent=false` and shows an error) never reaches this line, so only real successes count.

- [ ] **Step 2: Verify in the browser**

With the local server running (from Task 1), open `VVID.dc.html`, open the console, and run:

```js
window.ym = function(){ console.log('ym called with', arguments); };
```

This stubs `ym` so the goal call is observable without a live network round-trip. Then submit the brief form with a task + contact filled in (the local `/api/brief` endpoint will 404/fail since there's no backend running locally — that's fine, this step only checks Task 2's line if the fetch succeeds; if it can't succeed locally, instead directly invoke the component method from the console to isolate this from the network):

```js
// Find the DC component instance and call onSubmit's goal line directly isn't possible from outside,
// so instead confirm by code inspection + the Task 4 live-site check.
```

Since this repo has no local `/api/brief` backend to fully exercise the success path (see `vvid-brief-bot` sibling repo — not part of this change), full end-to-end verification of this goal happens against production in Task 4's post-deploy check. For this task, verify by re-reading the edited block to confirm:
- The `try/catch`-wrapped `ym` call is present and sits between the `data.ok` check and the button-text update.
- No syntax errors: reload the page locally and confirm the file still parses (no new console errors, page renders, brief form section still visible).

- [ ] **Step 3: Commit**

```bash
git add VVID.dc.html
git commit -m "feat: fire brief_submit Metrika goal on successful brief submission"
```

---

### Task 3: Fire `telegram_click` goal on Telegram CTA clicks

**Files:**
- Modify: `VVID.dc.html:1596` (add new method `trackTelegramClick` right after `onSubmit`, before `/* ---------- CALM MODE ---------- */`)
- Modify: `VVID.dc.html:548` (footer Telegram link)
- Modify: `VVID.dc.html:561` (floating Telegram CTA)

**Interfaces:**
- Consumes: `window.ym` (produced by Task 1).
- Produces: `trackTelegramClick()` method on the DC `Component` class, referenced via `{{ trackTelegramClick }}` bindings (consumed by the two anchor edits in this same task).

- [ ] **Step 1: Add the `trackTelegramClick` method**

```
old_string:
    }catch(err){
      this._briefSent=false;
      if(b){ b.disabled=false; b.style.opacity='1'; b.textContent=en?'error — message @vvid_helper_bot →':'ошибка — напишите @vvid_helper_bot →'; }
    }
  }

  /* ---------- CALM MODE ---------- */

new_string:
    }catch(err){
      this._briefSent=false;
      if(b){ b.disabled=false; b.style.opacity='1'; b.textContent=en?'error — message @vvid_helper_bot →':'ошибка — напишите @vvid_helper_bot →'; }
    }
  }

  trackTelegramClick(){ try{ window.ym && window.ym(110339563,'reachGoal','telegram_click'); }catch(e){} }

  /* ---------- CALM MODE ---------- */
```

- [ ] **Step 2: Wire the footer Telegram link**

```
old_string:
            <a href="https://t.me/vvid_helper_bot" target="_blank" rel="noopener noreferrer" style="color:#cfc7b9" style-hover="color:#e4ded2">telegram @vvid_helper_bot</a>

new_string:
            <a href="https://t.me/vvid_helper_bot" target="_blank" rel="noopener noreferrer" onClick="{{ trackTelegramClick }}" style="color:#cfc7b9" style-hover="color:#e4ded2">telegram @vvid_helper_bot</a>
```

- [ ] **Step 3: Wire the floating Telegram CTA**

```
old_string:
  <a href="https://t.me/vvid_helper_bot" target="_blank" rel="noopener noreferrer" data-float-cta="1" data-magnetic="1" class="float-tg" style="position:fixed;bottom:24px;right:24px;z-index:8500;display:inline-flex;align-items:center;gap:10px;background:#13110c;color:#e4ded2;padding:13px 22px 13px 17px;border-radius:50px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;box-shadow:0 16px 40px -12px rgba(19,17,12,.5)"><svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" style="flex:none;color:#c66048"><path fill="currentColor" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg><span>{{ t.ctaTelegram }}</span></a>

new_string:
  <a href="https://t.me/vvid_helper_bot" target="_blank" rel="noopener noreferrer" onClick="{{ trackTelegramClick }}" data-float-cta="1" data-magnetic="1" class="float-tg" style="position:fixed;bottom:24px;right:24px;z-index:8500;display:inline-flex;align-items:center;gap:10px;background:#13110c;color:#e4ded2;padding:13px 22px 13px 17px;border-radius:50px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;box-shadow:0 16px 40px -12px rgba(19,17,12,.5)"><svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" style="flex:none;color:#c66048"><path fill="currentColor" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg><span>{{ t.ctaTelegram }}</span></a>
```

- [ ] **Step 4: Verify in the browser**

With the local server (Task 1) running, reload `VVID.dc.html`. In the console, stub tracking to make the call observable without depending on the real Metrika script:

```js
window.ym = function(){ console.log('ym called with', arguments); };
```

Then:
- Click the footer Telegram link (bottom of page, "telegram @vvid_helper_bot"). Confirm the console logs `ym called with ... 110339563 reachGoal telegram_click` and that the link still opens `https://t.me/vvid_helper_bot` in a new tab (the `onClick` binding must not call `preventDefault` — it doesn't, per the code above, so this should hold, but confirm visually).
- Click the floating Telegram button (bottom-right pill). Confirm the same console log and that it still navigates.
- Confirm no new console errors and the DC runtime didn't fail to parse the file (page still renders normally — header, hero, footer all visible).

- [ ] **Step 5: Commit**

```bash
git add VVID.dc.html
git commit -m "feat: fire telegram_click Metrika goal on Telegram CTA clicks"
```

---

### Task 4: Deploy to production and verify live

**Files:** none (deployment only)

**Interfaces:** none — this task only ships the already-committed `VVID.dc.html` from Tasks 1–3.

- [ ] **Step 1: Confirm with the user immediately before running the deploy commands**

State plainly: "About to overwrite the live `VVID.dc.html` on vvid.solutions with the version including Metrika tracking. Proceeding." (Per this plan's Global Constraints, this is a live-site overwrite — flag it, then proceed, since the user already asked for prod deploy as part of this task.)

- [ ] **Step 2: Deploy**

```bash
cd /Users/securitsa/PycharmProjects/vvid/vvid-landing
scp VVID.dc.html kegor@34.88.169.39:/tmp/
ssh kegor@34.88.169.39 'sudo cp /tmp/VVID.dc.html /home/securitsa/vvid-site/ && sudo chown securitsa:securitsa /home/securitsa/vvid-site/VVID.dc.html'
```

- [ ] **Step 3: Verify the live site serves the new file**

```bash
curl -s https://vvid.solutions/ | grep -c "110339563"
```

Expected: a number ≥ 3 (the tag.js URL, the `ym(110339563, 'init'...)` call, and the noscript `watch/110339563` image all contain the literal).

- [ ] **Step 4: Verify the counter and goals fire against the real backend**

Open `https://vvid.solutions/` directly in the browser preview (not localhost — `/api/brief` only exists on the live domain).
- Confirm in the Network tab: a request to `mc.yandex.ru/metrika/tag.js?id=110339563` and a `watch/110339563` beacon fire on page load.
- Click the floating Telegram CTA; confirm a further `watch` request fires (goal ping) alongside the tab opening `t.me/vvid_helper_bot`.
- If comfortable submitting a real (test) brief: fill the form with an obvious test value (e.g. task: "test — ignore", contact: your own contact) and submit; confirm the button changes to "бриф отправлен" and a `watch` request fires around the same time. Skip this step if you don't want a test row landing in `vvid-brief-bot`'s ticket log — the counter+CTA checks above are sufficient to confirm the deploy is good, and the `brief_submit` goal code was already verified statically in Task 2.

- [ ] **Step 5: Point the user to Metrika's real-time report**

Tell the user: open `https://metrika.yandex.ru` → counter `110339563` → Report → Real-time, and confirm the visit (and any goal firings from Step 4) show up within ~1–2 minutes.

No commit in this task — nothing in the repo changes; this only ships what Tasks 1–3 already committed.

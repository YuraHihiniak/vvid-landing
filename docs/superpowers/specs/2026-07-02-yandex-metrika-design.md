# Yandex.Metrika Analytics — Design

**Date:** 2026-07-02
**Status:** Approved

## Problem

The landing (`VVID.dc.html`) has no analytics at all — no page-view tracking, no
visibility into which visitors submit the brief form or click through to the
Telegram bot. We need basic traffic + conversion tracking for the RU market.

## Goals

- Page views tracked via Yandex.Metrika, counter ID `110339563`.
- Scroll depth / engagement tracked via Metrika's built-in scroll map + Webvisor
  (no custom JS needed for this).
- Custom goal `brief_submit` fires on successful `/api/brief` submission.
- Custom goal `telegram_click` fires on click of either Telegram CTA (footer link
  and floating button).
- Counter must not break the page if blocked by an ad-blocker.

## Non-Goals

- No Google Analytics / dual tracking (RU-audience site, GA4 is often blocked).
- No cookie-consent banner (out of scope for this change; site currently has none
  and this doesn't add new PII collection beyond what Metrika does by default).
- No custom scroll-depth JS — Metrika's scroll map covers it.

## Design

### 1. Counter snippet

Standard Yandex.Metrika tag inserted into `<head>`, right before `</head>`
([VVID.dc.html:39](../../../VVID.dc.html)), exactly as provided by Metrika for
counter `110339563`:

```html
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
```

`webvisor` + `clickmap` + `accurateTrackBounce` give scroll/engagement data for
free — no bespoke scroll listener needed.

### 2. `brief_submit` goal

In `onSubmit()` ([VVID.dc.html:1575](../../../VVID.dc.html)), after the fetch to
`/api/brief` succeeds (right where the button text switches to "бриф
отправлен"), add:

```js
try{ window.ym && window.ym(110339563,'reachGoal','brief_submit'); }catch(e){}
```

Placed only in the success branch — a failed submission should not count as a
conversion.

### 3. `telegram_click` goal

Add one method to the `Component` class, next to `onSubmit`:

```js
trackTelegramClick(){ try{ window.ym && window.ym(110339563,'reachGoal','telegram_click'); }catch(e){} }
```

Bind it via `onClick="{{ trackTelegramClick }}"` on both existing Telegram
anchors — the footer link ([VVID.dc.html:548](../../../VVID.dc.html)) and the
floating CTA ([VVID.dc.html:561](../../../VVID.dc.html)) — following the same
`{{ handler }}` binding pattern already used elsewhere in the file (e.g.
`onClick="{{ toggleCalm }}"`). Both links keep their existing `href`/`target`
behavior; the click handler only fires the goal, it doesn't intercept
navigation.

### 4. Resilience

Every `ym(...)` call is wrapped in `try/catch` and guarded by `window.ym &&`,
so an ad-blocker stripping the Metrika script can't throw and break the brief
form or Telegram CTA.

## Deployment

Same as every landing change — this repo's `git push` does **not** deploy.
After the edit is committed, ship via `scp`:

```
scp VVID.dc.html kegor@34.88.169.39:/tmp/
ssh kegor@34.88.169.39 'sudo cp /tmp/VVID.dc.html /home/securitsa/vvid-site/ && sudo chown securitsa:securitsa /home/securitsa/vvid-site/VVID.dc.html'
```

## Testing

- Local: serve via `python3 -m http.server 8123`, open `/VVID.dc.html`, confirm
  in Network tab that `mc.yandex.ru/metrika/tag.js` and `watch/110339563`
  requests fire.
- Confirm the `ym` counter object appears on `window` in the console.
- Submit the brief form (or trigger the success path) and confirm a
  `reachGoal` call for `brief_submit` fires (visible in Network as a `watch`
  request with `brief_submit` in the payload, or via Metrika's real-time
  report after deploy).
- Click each Telegram CTA and confirm a `telegram_click` `reachGoal` fires the
  same way.
- After deploy, verify goals appear in Metrika's real-time report
  (`metrika.yandex.ru` → counter `110339563` → Report → Real-time).

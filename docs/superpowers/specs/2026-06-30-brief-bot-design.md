# VVID Brief Bot — Design

**Date:** 2026-06-30
**Status:** Approved

## Problem

The landing page (`VVID.dc.html`, section `#brief`) has a brief-submission form with
four fields — task, contact, budget, about — but `onSubmit` does nothing except change
the button label. Submissions are lost. We need a Telegram bot that receives these
submissions, forwards them to a team chat, assigns each a short unique ticket number,
and exposes an "acknowledge / taken into work" button in the chat.

## Goals

- Form submissions delivered to a Telegram group chat.
- Each submission gets a short, human-readable ticket number (`VV-1042`).
- An inline button "✅ Взято в работу" that marks who acknowledged and when.
- New private GitHub repo `vvid-brief-bot` in the user's account.
- GitHub Actions CI builds a Docker image and pushes it to GHCR.
- Deployed via docker-compose on the same GCP VM as the landing (34.88.169.39, vvid.solutions).
- Clean, layered architecture modelled on the `vmesto` project (but no hardcoded secrets).

## Non-Goals

- No admin web UI. The chat is the interface.
- No auth/accounts. Anti-spam only (rate limit + honeypot).
- No migration framework; SQLite schema created on startup.

## Architecture

Single Python process, two concurrent entrypoints:

1. **HTTP intake** (`aiohttp`) — `POST /api/brief`, `GET /healthz`.
2. **Telegram polling** (`pyTelegramBotAPI`) — handles the inline-button callback.

```
Browser ──POST /api/brief──► Caddy (vvid.solutions) ──► brief-bot:8000 (HTTP intake)
                                                              │
                                          SQLite (briefs + ticket counter, on a volume)
                                                              │
                                          Telegram Bot API ──► team chat
                                              [message: VV-1042 + fields + ✅ button]
```

### Layers

```
src/
  app.py              entrypoint: start HTTP server + Telegram polling thread
  config.py           env: BOT_TOKEN, CHAT_ID, DB_PATH, PORT, TICKET_START, RATE_LIMIT
  domain/
    brief.py          Brief dataclass + Status (new|taken)
  storage/
    repository.py     SQLite: save brief, atomic ticket allocation, mark taken
  telegram/
    notifier.py       build + send chat message with inline button
    callbacks.py      handle "taken" button: edit message (who/when), anti-double
  http/
    intake.py         POST /api/brief: validate → repo.save → notifier.send → {ok,ticket}
```

**Boundaries:** `http` does not import `telebot` — it calls a `Notifier` protocol.
`storage` knows nothing about transport. Each layer is unit-testable in isolation.

## Data Flow

1. Browser sends `POST /api/brief` JSON `{task, contact, budget, about, hp}`.
2. `intake` validates (task + contact required, length caps, honeypot `hp` empty,
   per-IP rate limit), then `repository.save` writes the row and atomically allocates
   the next ticket number.
3. `notifier` sends to the chat: ticket, fields, timestamp, inline button **✅ Взято в работу**.
4. HTTP responds `{ ok: true, ticket: "VV-1042" }`; the form button shows
   «бриф отправлен · VV-1042».
5. A manager taps the button → `callbacks` edits the message to
   «✅ Взято: @user · 14:30», removes the button, ignores repeat taps.

## Storage

SQLite file on a Docker named volume (survives restarts).

- `briefs(id INTEGER PK AUTOINCREMENT, ticket TEXT UNIQUE, task, contact, budget,
  about, status, taken_by, taken_at, created_at)`.
- Ticket number = `TICKET_START + (rowid - 1)`, rendered `VV-<n>` (start 1001).
- Allocation is atomic via the single INSERT (rowid), avoiding a separate counter race.

## Ticket Format

`VV-1042` — sequential, short, human-readable, sortable. Starts at `VV-1001`.

## Acknowledge Button

Callback data `take:<ticket>`. On tap: load brief; if already taken, answer the
callback with «уже взято @who» and do nothing; else set status=taken, taken_by,
taken_at, edit the message text to prepend «✅ Взято: @user · HH:MM» and drop the
keyboard.

## CI

GitHub Actions on push to `main`: multi-stage buildx → push to
`ghcr.io/<user>/vvid-brief-bot` with tags `latest` + commit `sha`. Same pattern as
vmesto's `deploy.yml`.

## Deployment

`docker-compose.yml` next to the landing on the VM:

- service `brief-bot` pulls the GHCR image, reads env from `.env`, mounts a volume
  for the SQLite file, exposes `8000` on the internal network only.
- Caddy: add `handle /api/brief* { reverse_proxy brief-bot:8000 }` to the
  vvid.solutions site block. Landing keeps serving as today.

## Frontend Changes (landing repo)

In `VVID.dc.html`:
- add `name` attributes to the four fields + a hidden honeypot input;
- rewrite `onSubmit` to `fetch('/api/brief', {method:'POST', json})`, show the returned
  ticket in the button, handle errors, keep the existing visual style.

## Security

- Secrets only via env / `.env` (gitignored). No tokens in the repo.
- Per-IP rate limit and honeypot field against spam.
- Field length caps; non-root container user; healthcheck.

## Testing

- `storage`: ticket allocation is sequential and unique; taken transition is idempotent.
- `http`: validation rejects missing/oversized fields and filled honeypot; happy path
  returns a ticket and calls the notifier (fake notifier).
- `telegram`: message formatting; callback marks taken once, rejects double-take.

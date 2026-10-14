# Meet Models Mini App

This is the static Telegram Mini App front end. It reads public directory entries from `data/creators.json`; keep private Telegram file IDs, verification material, and personal contact details out of this file.

## Local preview

In PowerShell, run `python -m http.server 8000` from this folder, then open `http://localhost:8000`. Telegram features gracefully fall back to browser behavior when the page is opened outside Telegram.

## Hosting and bot setup

Host this folder at an HTTPS URL, then set `MEET_MODELS_URL` in the bot environment to that URL and restart the bot. Telegram requires HTTPS for Mini Apps. The app's creator feed is static for now; publish only approved profiles and their public teaser assets in `data/creators.json`.

## Directory feed format

The feed is a JSON array. Example:

```json
[
  {
    "id": "creator-123",
    "name": "Creator display name",
    "bio": "A short public profile description.",
    "tags": ["Solo", "VIP"],
    "verified": true,
    "featured": true,
    "hot": false,
    "followers": 1200,
    "preview_image": "./images/creator-123.jpg",
    "items": [
      { "title": "Private feed", "price_label": "From $10", "content_code": "CONTENT_CODE" }
    ]
  }
]
```

Tags drive category filters (for example `Solo`, `Live`, `VIP`, `Explicit`). Each item can have a `content_code` that identifies the paid item already configured in the bot. The app sends that code back to the bot; the bot rechecks the approved creator and item in its database and presents the existing Telegram checkout buttons. Never put a Telegram bot token or private content file ID in the feed.

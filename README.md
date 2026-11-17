# Clean-share

Clean-share is an offline, zero-dependency URL cleaner and share-link builder.

Paste a link, get the same link without the tracking — and a ready-to-share
WhatsApp / Telegram / SMS / email link. Nothing is uploaded anywhere: every
check happens on your own device, in the browser or on the command line.

> **Demo:** live at https://slash-sketch.github.io/clean-share/demo/ —
> paste a link or a message, clean it, copy or share. The library itself
> is finished and tested below.

## Before / after

| Before | After |
|---|---|
| `https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc123` | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| `https://example.com/page?utm_source=google&utm_medium=cpc&id=7` | `https://example.com/page?id=7` |
| `https://www.amazon.com/dp/B08N5WRWNW?tag=aff-20` | `https://www.amazon.com/dp/B08N5WRWNW` |
| `https://www.amazon.com/s?k=headphones&tag=aff-20` | `https://www.amazon.com/s?k=headphones` |
| `https://x.com/search?q=clean&s=abc&ref_src=twsrc` | `https://x.com/search?q=clean` |
| `https://open.spotify.com/track/123?si=abc&context=xyz` | `https://open.spotify.com/track/123` |

YouTube keeps `v`, `t` and `list` — those are the video itself.
Amazon keeps `k` (your search) — the tag is the tracker.

## What we never strip

Clean-share never silently breaks a link:

- **Signed URLs are returned completely untouched.** If a URL carries
  `sig`, `signature`, `hmac`, `token`, `expires`, `policy`, or any
  parameter starting with `X-Amz-`, nothing is removed — not even a
  known tracker. Stripping one of those would break the link.
- **Unknown parameters are kept.** If a parameter is not a known tracker
  and is not in a provider's strip list, it stays. On a site with no
  provider rule, a lone unknown parameter (the page's identity) is
  never removed.
- **Every removal is reported.** `clean()` returns `{ url, removed, kept, rules }`
  so you can see exactly what was taken out and why.

## Install

**Not published yet.** The name `clean-share` was checked on 2026-11-17 and
is free on both npm and PyPI, but nothing has been published and the name
is not reserved — availability can change until the first publish. Do not
install it from a registry yet. The packaging files are ready
(`package.json` for npm, `pyproject.toml` for PyPI, both version 0.1.0);
publishing needs npm / PyPI accounts and is a separate, approved step.

```bash
# Intended (not published yet):
npm install clean-share
pip install clean-share
```

Until then, copy `core/clean-share.js` (browser / Node / extension) or
`core/clean_share.py` (Python 3.10+, standard library only) into your
project. Both files are zero-dependency and self-contained.

## Chrome extension (Week 4)

A Manifest V3 extension lives in `extension/` and reuses the same core —
no cleaning logic is duplicated. No analytics, no network calls, offline.

1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** and select the `extension/` folder.
3. Click the toolbar icon to clean a pasted link or the current tab, or
   right-click any link and choose **Clean-share: clean this link**.

Full steps and the Web Store bundling note are in `extension/README.md`.
The extension is **not** published to the Chrome Web Store yet.

## Use

### JavaScript

```js
import { clean, cleanText, shareLinks, isClean } from "./core/clean-share.js";

clean("https://example.com/page?utm_source=x&id=7");
// { url: "https://example.com/page?id=7", removed: ["utm_source"], kept: ["id"], rules: ["global"] }

cleanText("see https://example.com/page?utm_source=x&id=7");
// { text: "see https://example.com/page?id=7", replacements: [...] }

shareLinks({ phone: "+92 300 1234567", text: "Hi, I want this item", url: "https://example.com/p?id=7" });
// { whatsapp: "https://wa.me/923001234567?text=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7",
//   telegram: "https://t.me/share/url?url=...&text=...",
//   sms: "sms:+923001234567?&body=...", email: "mailto:?subject=...&body=...", web: "https://wa.me/..." }

isClean("https://example.com/page?id=7"); // true
```

### Python

```python
from clean_share import clean, clean_text, share_links, is_clean

clean("https://example.com/page?utm_source=x&id=7")
# {"url": "https://example.com/page?id=7", "removed": ["utm_source"], "kept": ["id"], "rules": ["global"]}

clean_text("see https://example.com/page?utm_source=x&id=7")
share_links(phone="+92 300 1234567", text="Hi, I want this item", url="https://example.com/p?id=7")
is_clean("https://example.com/page?id=7")  # True
```

The JS and Python APIs are identical by design: same function names
(`clean` / `clean_text`, `cleanText` in JS), same option names, same
`data/rules.json` rule file, and the same 152 fixtures drive both test
suites — so a link cleaned in one language cleans the same way in the other.

## Rules

`data/rules.json` is the single rule file both libraries use:

- **~40 global tracking parameters** — `utm_*` (any parameter starting
  with `utm_`), `fbclid`, `gclid`, `gbraid`, `wbraid`, `msclkid`,
  `mc_cid` / `mc_eid`, `igshid`, `twclid`, `li_fat_id`, `dclid`, `_ga`,
  `_gl`, `srsltid`, and more.
- **35 providers** — YouTube, Google Search, Facebook, Instagram,
  TikTok, X, Amazon, AliExpress, Spotify, LinkedIn, Daraz, OLX, Shopee,
  eBay, Reddit, Medium, Pinterest, Snapchat, Telegram, WhatsApp, Shein,
  Temu, Quora, Notion, Etsy, Flipkart, Booking.com, IMDb, Google Play,
  Apple App Store, Steam, Udemy, plus the redirect wrappers below.
  Each provider has `id`, `hosts`, `strip`, `keep`, and a `source`
  (the provider's own help page, or the public record that documents
  the parameter). See `CONTRIBUTING.md` to add one.

The rule list was built clean-room from public parameter names and
provider help pages. It is **not** copied from ClearURLs (LGPL) or any
other rule set.

## Tests

```bash
node tests/test_js.mjs      # JS suite
python3 tests/test_py.py    # Python suite
```

Both suites run the same `tests/fixtures.json` (152 before/after URL
pairs: global trackers, YouTube, Amazon, Facebook, signed URLs that must
stay untouched, and edge cases) plus `cleanText` / `shareLinks` /
`isClean` checks.

## Repo layout

```
clean-share/
  README.md            # this file
  LICENSE              # MIT
  CONTRIBUTING.md      # how to add a provider rule
  core/
    clean-share.js     # JS twin, zero deps, no Node APIs
    clean_share.py     # Python twin, stdlib only
  data/
    rules.json         # canonical rules (global + providers)
  tests/
    fixtures.json      # 152 before/after URL pairs
    test_js.mjs        # JS test runner
    test_py.py         # Python test runner
  demo/                # static PWA demo (Week 3): paste a link or message, clean it, copy/share
  extension/           # Chrome MV3 extension (Week 4): popup + service worker, reuses core/
    manifest.json
    popup.html
    popup.js
    background.js
    README.md
  package.json         # npm packaging (0.1.0) — NOT published yet
  pyproject.toml       # PyPI packaging (0.1.0) — NOT published yet
```

## Status

Week 5 — 10 more providers (Quora, Notion, Etsy, Flipkart, Booking.com,
IMDb, Google Play, Apple App Store, Steam, Udemy) → 35 providers and
152 fixtures. Deliberate keeps: Quora `share` is never stripped
(`?share=1` bypasses the login wall), Flipkart `pid` and Udemy
`couponCode` stay (product identity / discount), Zoom was left out —
its `zak` parameter is an auth token, stripping it would break host
links. **Nothing is published yet**: not to npm, not to PyPI, not to
the Chrome Web Store. Name `clean-share` was free on npm and PyPI when
checked 2026-11-17.

Week 4 — Chrome MV3 extension in `extension/` (popup + right-click
service worker on the same core) plus npm (`package.json`) and PyPI
(`pyproject.toml`) packaging files, both version 0.1.0. **Nothing is
published yet**: not to npm, not to PyPI, not to the Chrome Web Store.
Name `clean-share` was free on npm and PyPI when checked 2026-11-17.

Week 2–3 — core library expanded to 25 providers, plus the static demo PWA
in `demo/` (paste a link or a whole message, see what was removed, copy or
share via WhatsApp / Telegram / SMS / email; works offline after first load).
Publishing to npm / PyPI is still to come (names to be confirmed first).
Week 4 plan: Chrome MV3 extension on the same core.

Redirect wrappers (Gmail/Google `/url`, Outlook Safe Links, `t.co`/`bit.ly`,
Reddit `/out`) are unwrapped **only** when the target URL is already encoded
in the link itself. Clean-share never follows a short link over the network:
a real `t.co`/`bit.ly` short code with no encoded target is left unchanged.

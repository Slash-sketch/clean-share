# Contributing to Clean-share

Thank you — the easiest and most valuable contribution is **one new
provider rule**. You do not need to write code.

## Add a provider rule (good first contribution)

1. Pick a site whose links carry tracking parameters (for example a
   shopping, news, or video site that is not in `data/rules.json` yet).
2. Find two real example links: one dirty (with tracking) and one clean.
   Note which parameters are tracking and which ones are the page
   itself (video id, search query, product id). **Never list a parameter
   that carries the page's identity as a strip parameter.**
3. Add one provider object to `data/rules.json`:

```json
{
  "id": "example-site",
  "hosts": ["example.com", "www.example.com"],
  "strip": ["tracking_param_1", "tracking_param_2"],
  "keep": ["id", "q"],
  "source": "https://example.com/help/sharing-links"
}
```

- `id`: short kebab-case name, unique in the file.
- `hosts`: every host the rule applies to (include `www.` variants).
- `strip`: tracking parameters only. Do not add `sig`, `signature`,
  `hmac`, `token`, `expires`, `policy`, or anything starting with
  `X-Amz-` — signed URLs are protected by the signed-URL guard and
  must never be touched.
- `keep`: parameters that must never be stripped, even if they also
  appear in a strip list.
- `source`: a link to the provider's own help page, or a note saying
  the parameters were observed in a real shared link. Every rule
  needs a source.

4. Add **at least two fixtures** to `tests/fixtures.json` — one dirty
   link that gets cleaned, and one clean link that stays unchanged:

```json
{
  "input": "https://example.com/page?tracking_param_1=x&id=7",
  "expected_url": "https://example.com/page?id=7",
  "removed": ["tracking_param_1"],
  "kept": ["id"],
  "note": "example-site: strip tracking_param_1, keep id"
}
```

5. Run both test suites and make sure they pass:

```bash
node tests/test_js.mjs
python3 tests/test_py.py
```

## Other contributions

- **Fix a wrong rule:** open an issue with the before/after links and
  what the site actually needs. A rule that breaks a real link is a bug.
- **Translations:** the demo UI (Week 3) keeps all strings in one file
  per language — a new language file is a welcome PR.
- **Tests:** more fixtures are always welcome, especially signed URLs,
  edge cases (fragments, ports, encoded values, duplicate parameters),
  and providers we have not covered yet.

## What not to do

- **Do not copy rule data from ClearURLs or any other LGPL-licensed
  list.** Clean-share's rules are built clean-room from public
  parameter names and provider help pages. If you are unsure whether
  a parameter list is safe to copy, ask in the issue first.
- Do not add network calls, analytics, accounts, or a server. The
  library is offline and zero-dependency by design.
- Do not add a feature that follows short links over the network.
  Clean-share only unwraps what is already encoded in the URL itself.

## Code style

- JS: vanilla, no framework, no Node APIs in `core/clean-share.js`.
- Python: standard library only (`urllib.parse`) in
  `core/clean_share.py`.
- Keep the JS and Python APIs identical. If you change one, change
  the other the same way, and add fixtures that both suites run.

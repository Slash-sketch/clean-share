# Contributing to Clean-share

Thank you — the easiest and most valuable contribution is **one new
provider rule**. You do not need to write code, and you do not need
to install anything to propose one. If you can copy a link from your
browser's address bar, you can contribute.

## First PR in 15 minutes (no code needed)

**Step 1 — Pick a site.** Choose a site whose shared links carry
tracking parameters and that is not already in `data/rules.json`.
Check the full list first: [`docs/providers.md`](docs/providers.md).
Good picks are shopping, news, video, and social sites. If the site's
links only ever carry `utm_*` parameters, it needs no rule — the
global list already strips those.

**Step 2 — Find two real links.** Share a page from that site to
yourself (or copy a link from the site's own Share button) and look
at the query string — the part after `?`.

- **Tracking** = who shared it, which campaign, which app.
  Examples: `utm_source`, `fbclid`, `ref`, `si`, `spm`, `at_medium`.
- **Identity** = which page it is. Examples: a video id (`v`),
  a search query (`q`), a product id (`pid`, `goods_id`), a
  revision (`oldid`). Identity parameters are **never** stripped.

If you cannot tell a parameter apart, leave it out of the rule —
Clean-share keeps anything it does not recognise, so an omitted
parameter is safe. A wrongly stripped parameter breaks real links.

**Step 3 — Add one provider object** to `data/rules.json`, after the
last provider (currently `soundcloud`). Copy this shape exactly:

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
- `hosts`: every host the rule applies to. Matching is by host
  suffix, so `example.com` also matches `www.example.com` and any
  other subdomain — you only need the bare domain plus `www.` for
  clarity, not every subdomain.
- `strip`: tracking parameters **only** (see the guard below).
- `keep`: parameters that must never be stripped, even if they also
  appear in a strip list. If nothing needs protecting, use `[]`.
- `source`: a link to the provider's own help page, or the site's
  homepage if the parameters were observed in a real shared link.
  Every rule needs a source.

Worked example — the BBC rule that was added in Week 6:

```json
{
  "id": "bbc",
  "hosts": ["bbc.com", "www.bbc.com", "bbc.co.uk", "www.bbc.co.uk"],
  "strip": ["at_medium", "at_campaign", "at_custom1", "at_custom2",
            "at_custom3", "at_custom4", "at_custom5",
            "at_bbc_team", "at_ptr_name"],
  "keep": [],
  "source": "https://www.bbc.com/"
}
```

BBC's RSS links arrive as `?at_medium=RSS&at_campaign=rss` — pure
campaign tags, and the article itself lives in the path, so there is
nothing to keep.

**Step 4 — Add at least two fixtures** to `tests/fixtures.json`,
at the end of the `fixtures` array — one dirty link that gets
cleaned, and one clean link (or a link where the important
parameters survive). Copy this shape exactly:

```json
{
  "input": "https://example.com/page?tracking_param_1=x&id=7",
  "expected_url": "https://example.com/page?id=7",
  "removed": ["tracking_param_1"],
  "kept": ["id"],
  "note": "example-site: strip tracking_param_1, keep id"
}
```

- `removed` and `kept` use **lower-case** parameter names, in the
  order they appear in the input URL.
- `kept` may be `[]` when everything is stripped.
- Then bump the `"count"` number at the top of `tests/fixtures.json`
  by the number of fixtures you added.

**Step 5 — Run both test suites** and make sure they pass with
0 failed:

```bash
node tests/test_js.mjs
python3 tests/test_py.py
```

If a suite reports a failure, read the failing fixture name — it
tells you exactly which `expected_url`, `removed`, or `kept` value
does not match. The two suites run the same fixtures, so a rule
that passes in one language must pass in the other.

**Step 6 — Open the pull request.** Title it `Add <site> provider`
and paste the before/after links from your fixtures into the PR
description. That is the whole PR: one rule + two fixtures. A
maintainer will run the suites and merge it.

## The signed-URL guard (non-negotiable)

**Never** put any of these in a `strip` list: `sig`, `signature`,
`hmac`, `token`, `expires`, `policy`, or anything starting with
`X-Amz-`. If a URL carries one of them, Clean-share returns the
whole URL completely untouched — stripping a signed parameter would
break the link. This is checked by the test suites, and a PR that
tries to strip one will fail.

The same thinking applies to auth tokens that are not in the guard
list. Zoom's `zak` parameter is an auth token, which is why Zoom
has no rule at all. If a parameter is what lets the recipient open
the page, it is identity, not tracking — keep it.

## What NOT to strip

- **Page identity:** video ids, product ids, search queries,
  revision ids, dates a booking needs (`checkin`, `checkout`).
- **Discounts and access:** Udemy's `couponCode`, Quora's `share`
  (`?share=1` bypasses the login wall).
- **Anything you are unsure about.** Omit it; Clean-share keeps
  unknown parameters by design. Say so in the PR and a maintainer
  will check it.

## Other contributions

- **Fix a wrong rule:** open an issue with the before/after links
  and what the site actually needs. A rule that breaks a real link
  is a bug — it gets fixed before anything else.
- **Fix a wrong fixture:** same thing. Fixtures are the contract
  both libraries promise to keep.
- **Translations:** the demo UI (Week 3) keeps all strings in one
  file per language (`demo/i18n/`) — a new language file is a
  welcome PR.
- **Tests:** more fixtures are always welcome, especially signed
  URLs, edge cases (fragments, ports, encoded values, duplicate
  parameters), and providers we have not covered yet.
- **Docs:** if a step above confused you, the fix is a PR to this
  file. Tell us where you got stuck.

## What not to do

- **Do not copy rule data from ClearURLs or any other LGPL-licensed
  list.** Clean-share's rules are built clean-room from public
  parameter names and provider help pages. If you are unsure whether
  a parameter list is safe to copy, ask in the issue first.
- Do not add network calls, analytics, accounts, or a server. The
  library is offline and zero-dependency by design.
- Do not add a feature that follows short links over the network.
  Clean-share only unwraps what is already encoded in the URL itself.
- Do not change the JS and Python cores just to add a provider.
  Provider rules live in `data/rules.json` only; the cores embed a
  snapshot of it, and a maintainer syncs the snapshot when a rule
  is merged. (If you do touch a core file, change both twins the
  same way — the test suites enforce identical behaviour.)

## Code style

- JS: vanilla, no framework, no Node APIs in `core/clean-share.js`.
- Python: standard library only (`urllib.parse`) in
  `core/clean_share.py`.
- Keep the JS and Python APIs identical. If you change one, change
  the other the same way, and add fixtures that both suites run.

## PR checklist

- [ ] One provider object in `data/rules.json`, with a `source`
- [ ] At least 2 fixtures in `tests/fixtures.json`, `count` updated
- [ ] No signed-guard parameter (`sig`, `signature`, `hmac`,
      `token`, `expires`, `policy`, `X-Amz-*`) in `strip`
- [ ] `node tests/test_js.mjs` passes, 0 failed
- [ ] `python3 tests/test_py.py` passes, 0 failed
- [ ] PR description shows the before/after links

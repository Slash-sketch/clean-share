#!/usr/bin/env python3
"""Clean-share Python tests — runs tests/fixtures.json through core/clean_share.py.
Usage: python3 tests/test_py.py        (run from the repo root)
Exit code 0 = all pass, 1 = any failure.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "core"))
from clean_share import clean, clean_text, share_links, is_clean  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
with open(os.path.join(ROOT, "data", "rules.json"), encoding="utf-8") as f:
    RULES = json.load(f)
with open(os.path.join(ROOT, "tests", "fixtures.json"), encoding="utf-8") as f:
    FIXTURES = json.load(f)["fixtures"]

passed = failed = 0
failures = []


def check(name, actual, expected):
    global passed, failed
    if actual == expected:
        passed += 1
    else:
        failed += 1
        failures.append(f"{name}\n  expected: {expected!r}\n  actual:   {actual!r}")


# 1. Fixture tests — same fixtures drive the JS suite.
for i, fx in enumerate(FIXTURES, 1):
    result = clean(fx["input"], rules=RULES)
    check(f"fixture {i} url ({fx['note']})", result["url"], fx["expected_url"])
    check(f"fixture {i} removed ({fx['note']})", result["removed"], fx["removed"])
    check(f"fixture {i} kept ({fx['note']})", result["kept"], fx["kept"])

# 2. clean_text
r = clean_text(
    "see https://example.com/page?utm_source=x&id=7 "
    "and https://www.youtube.com/watch?v=abc&si=123.",
    rules=RULES,
)
check("clean_text url 1", "https://example.com/page?id=7" in r["text"], True)
check("clean_text url 2", "https://www.youtube.com/watch?v=abc" in r["text"], True)
check("clean_text trailing period kept", r["text"].endswith("."), True)
check("clean_text replacements", len(r["replacements"]), 2)
check("clean_text no links", clean_text("no links here", rules=RULES)["replacements"], [])

# 3. share_links
s = share_links(
    phone="+92 300 1234567",
    text="Hi, I want this item",
    url="https://example.com/p?utm_source=x&id=7",
)
check("share_links whatsapp", s["whatsapp"],
      "https://wa.me/923001234567?text=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7")
check("share_links web == whatsapp", s["web"], s["whatsapp"])
check("share_links telegram", s["telegram"],
      "https://t.me/share/url?url=https%3A%2F%2Fexample.com%2Fp%3Fid%3D7&text=Hi%2C%20I%20want%20this%20item")
check("share_links sms", s["sms"],
      "sms:+923001234567?&body=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7")
check("share_links email", s["email"],
      "mailto:?subject=Hi%2C%20I%20want%20this%20item&body=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7")
check("share_links dict arg", share_links({"text": "hello"})["whatsapp"], "https://wa.me/?text=hello")
check("share_links no phone", share_links(text="hello")["whatsapp"], "https://wa.me/?text=hello")

# 4. is_clean
check("is_clean clean url", is_clean("https://example.com/page?id=7", rules=RULES), True)
check("is_clean dirty url", is_clean("https://example.com/page?utm_source=x", rules=RULES), False)
check("is_clean invalid url", is_clean("not a url", rules=RULES), False)
check("is_clean signed url untouched", is_clean("https://example.com/f?sig=abc&utm_source=x", rules=RULES), True)

# 5. Rules file sanity
check("rules global count", len(RULES["global_strip"]), 40)
check("rules provider count", len(RULES["providers"]), 35)
check("rules signed guard", RULES["signed_guard"]["params"],
      ["sig", "signature", "hmac", "token", "expires", "policy"])

print(f"Python: {passed} passed, {failed} failed, {len(FIXTURES)} fixtures")
if failures:
    print("\nFailures:\n" + "\n".join(failures))
    sys.exit(1)

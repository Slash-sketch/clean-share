// Clean-share JS tests — runs tests/fixtures.json through core/clean-share.js.
// Usage: node tests/test_js.mjs        (run from the repo root)
// Exit code 0 = all pass, 1 = any failure.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { clean, cleanText, shareLinks, isClean } from "../core/clean-share.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rules = JSON.parse(readFileSync(join(root, "data", "rules.json"), "utf8"));
const { fixtures } = JSON.parse(readFileSync(join(root, "tests", "fixtures.json"), "utf8"));

let passed = 0;
let failed = 0;
const failures = [];
function eq(actual, expected) { return JSON.stringify(actual) === JSON.stringify(expected); }
function check(name, actual, expected) {
  if (eq(actual, expected)) { passed++; }
  else { failed++; failures.push(`${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`); }
}

// 1. Fixture tests — same fixtures drive the Python suite.
for (const [i, fx] of fixtures.entries()) {
  const result = clean(fx.input, { rules });
  check(`fixture ${i + 1} url (${fx.note})`, result.url, fx.expected_url);
  check(`fixture ${i + 1} removed (${fx.note})`, result.removed, fx.removed);
  check(`fixture ${i + 1} kept (${fx.note})`, result.kept, fx.kept);
}

// 2. cleanText
{
  const r = cleanText("see https://example.com/page?utm_source=x&id=7 and https://www.youtube.com/watch?v=abc&si=123.", { rules });
  check("cleanText url 1", r.text.includes("https://example.com/page?id=7"), true);
  check("cleanText url 2", r.text.includes("https://www.youtube.com/watch?v=abc"), true);
  check("cleanText trailing period kept", r.text.endsWith("."), true);
  check("cleanText replacements", r.replacements.length, 2);
  const r2 = cleanText("no links here", { rules });
  check("cleanText no links", r2.replacements, []);
}

// 3. shareLinks
{
  const s = shareLinks({ phone: "+92 300 1234567", text: "Hi, I want this item", url: "https://example.com/p?utm_source=x&id=7" });
  check("shareLinks whatsapp", s.whatsapp, "https://wa.me/923001234567?text=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7");
  check("shareLinks web == whatsapp", s.web, s.whatsapp);
  check("shareLinks telegram", s.telegram, "https://t.me/share/url?url=https%3A%2F%2Fexample.com%2Fp%3Fid%3D7&text=Hi%2C%20I%20want%20this%20item");
  check("shareLinks sms", s.sms, "sms:+923001234567?&body=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7");
  check("shareLinks email", s.email, "mailto:?subject=Hi%2C%20I%20want%20this%20item&body=Hi%2C%20I%20want%20this%20item%20https%3A%2F%2Fexample.com%2Fp%3Fid%3D7");
  const s2 = shareLinks({ text: "hello" });
  check("shareLinks no phone", s2.whatsapp, "https://wa.me/?text=hello");
}

// 4. isClean
check("isClean clean url", isClean("https://example.com/page?id=7", { rules }), true);
check("isClean dirty url", isClean("https://example.com/page?utm_source=x", { rules }), false);
check("isClean invalid url", isClean("not a url", { rules }), false);
check("isClean signed url untouched", isClean("https://example.com/f?sig=abc&utm_source=x", { rules }), true);

// 5. Rules file sanity
check("rules global count", rules.global_strip.length, 40);
check("rules provider count", rules.providers.length, 40);
check("rules signed guard", rules.signed_guard.params, ["sig", "signature", "hmac", "token", "expires", "policy"]);

console.log(`JS: ${passed} passed, ${failed} failed, ${fixtures.length} fixtures`);
if (failures.length) { console.log("\nFailures:\n" + failures.join("\n")); process.exit(1); }

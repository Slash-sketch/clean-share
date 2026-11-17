// Clean-share demo — static PWA. Uses ../core/clean-share.js directly;
// no logic is duplicated here. No upload, no analytics, no server.
import { clean, cleanText, shareLinks, isClean } from "../core/clean-share.js";

const FALLBACK = {
  already_clean: "Already clean.",
  clean_button: "Clean",
  copied: "Copied!",
  copy_button: "Copy clean link",
  copy_failed: "Copy failed — select the text and copy it yourself.",
  empty_input: "Paste a link or a message first.",
  invalid_url: "That does not look like a link. Try a link starting with https://",
  nothing_removed: "Nothing was removed — this link was already clean.",
  signed_note: "Signed link — returned untouched so it still works.",
};

let STRINGS = { ...FALLBACK };
try {
  const res = await fetch("i18n/en.json");
  if (res.ok) STRINGS = { ...FALLBACK, ...(await res.json()) };
} catch {
  // file:// or offline on first load: fall back to built-in English strings.
}

function applyStrings() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (STRINGS[key]) el.textContent = STRINGS[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (STRINGS[key]) el.placeholder = STRINGS[key];
  });
}
applyStrings();

const inputEl = document.getElementById("input");
const phoneEl = document.getElementById("phone");
const messageEl = document.getElementById("message");
const outputEl = document.getElementById("output");
const cleanUrlEl = document.getElementById("cleanUrl");
const statusEl = document.getElementById("status");
const removedListEl = document.getElementById("removedList");
const keptListEl = document.getElementById("keptList");
const replacementsBlock = document.getElementById("replacementsBlock");
const replacementsListEl = document.getElementById("replacementsList");

function renderChips(el, list, removed) {
  el.innerHTML = list.length
    ? list.map((name) => `<span class="chip${removed ? " removed" : ""}">${name.replace(/</g, "&lt;")}</span>`).join("")
    : "—";
}

let lastCleanText = "";

function doClean() {
  const raw = inputEl.value.trim();
  if (!raw) {
    statusEl.textContent = STRINGS.empty_input;
    outputEl.hidden = false;
    return;
  }
  const urls = raw.match(/https?:\/\/[^\s<>"']+/g) || [];
  const phone = phoneEl.value.trim();
  const message = messageEl.value.trim();

  if (urls.length === 1 && raw === urls[0]) {
    const result = clean(raw);
    lastCleanText = result.url;
    cleanUrlEl.textContent = result.url;
    const signed = result.rules.includes("signed-url-guard");
    statusEl.textContent = signed
      ? STRINGS.signed_note
      : result.removed.length === 0
        ? STRINGS.nothing_removed
        : isClean(raw)
          ? STRINGS.already_clean
          : "";
    renderChips(removedListEl, result.removed, true);
    renderChips(keptListEl, result.kept, false);
    replacementsBlock.hidden = true;
    updateShare(result.url, phone, message);
  } else {
    const result = cleanText(raw);
    // Show the first cleaned link as the headline, and the full text below it.
    const first = result.replacements[0];
    lastCleanText = result.text;
    cleanUrlEl.textContent = first ? first.to : result.text;
    statusEl.textContent = result.replacements.length === 0
      ? STRINGS.nothing_removed
      : `${result.replacements.length} link(s) cleaned.`;
    const removed = [...new Set(result.replacements.flatMap((r) => r.removed))];
    renderChips(removedListEl, removed, true);
    renderChips(keptListEl, [], false);
    replacementsBlock.hidden = false;
    replacementsListEl.innerHTML = result.replacements.length
      ? result.replacements.map((r) => `<div><code>${r.from.replace(/</g, "&lt;")}</code><br>→ <code>${r.to.replace(/</g, "&lt;")}</code></div>`).join("")
      : "—";
    updateShare(first ? first.to : "", phone, message);
  }
  outputEl.hidden = false;
}

function updateShare(url, phone, message) {
  const links = shareLinks({ phone, text: message, url });
  document.getElementById("waLink").href = links.whatsapp;
  document.getElementById("tgLink").href = links.telegram;
  document.getElementById("smsLink").href = links.sms;
  document.getElementById("emailLink").href = links.email;
}

document.getElementById("cleanBtn").addEventListener("click", doClean);
document.getElementById("clearBtn").addEventListener("click", () => {
  inputEl.value = "";
  outputEl.hidden = true;
  inputEl.focus();
});
document.getElementById("exampleBtn").addEventListener("click", () => {
  inputEl.value = "Check this out https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc123 and https://example.com/page?utm_source=google&id=7";
  doClean();
});
document.getElementById("pasteBtn").addEventListener("click", async () => {
  try {
    inputEl.value = await navigator.clipboard.readText();
    doClean();
  } catch {
    inputEl.focus();
  }
});
document.getElementById("copyBtn").addEventListener("click", async () => {
  const btn = document.getElementById("copyBtn");
  try {
    await navigator.clipboard.writeText(lastCleanText);
    btn.textContent = STRINGS.copied;
    setTimeout(() => { btn.textContent = STRINGS.copy_button; }, 1500);
  } catch {
    statusEl.textContent = STRINGS.copy_failed;
  }
});
inputEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") doClean();
});

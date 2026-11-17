// Clean-share popup — Chrome MV3 extension.
// Uses ./clean-share.js, a bundled copy of ../core/clean-share.js (identical file); no cleaning logic is duplicated here.
// No analytics, no network calls, offline. Works as the action popup and as a
// full tab (the background worker opens it as a tab after a context-menu clean).
import { clean, cleanText, shareLinks, isClean } from "./clean-share.js";

// DOM work only runs in a real page. Guarded so this module can be
// import-checked in Node (where `document` does not exist).
if (typeof document !== "undefined") {
  const inputEl = document.getElementById("input");
  const outputEl = document.getElementById("output");
  const cleanUrlEl = document.getElementById("cleanUrl");
  const statusEl = document.getElementById("status");
  const removedListEl = document.getElementById("removedList");
  const keptListEl = document.getElementById("keptList");

  let lastCleanText = "";

  function renderChips(el, list, removed) {
    el.textContent = "";
    if (!list.length) {
      el.textContent = "—";
      return;
    }
    for (const name of list) {
      const chip = document.createElement("span");
      chip.className = "chip" + (removed ? " removed" : "");
      chip.textContent = name;
      el.appendChild(chip);
    }
  }

  function updateShare(url) {
    const links = shareLinks({ url });
    document.getElementById("waLink").href = links.whatsapp;
    document.getElementById("tgLink").href = links.telegram;
    document.getElementById("smsLink").href = links.sms;
    document.getElementById("emailLink").href = links.email;
  }

  function showResult(cleaned, removed, kept, status) {
    lastCleanText = cleaned;
    cleanUrlEl.textContent = cleaned;
    statusEl.textContent = status;
    renderChips(removedListEl, removed, true);
    renderChips(keptListEl, kept, false);
    updateShare(cleaned);
    outputEl.hidden = false;
  }

  function doClean() {
    const raw = inputEl.value.trim();
    if (!raw) {
      statusEl.textContent = "Paste a link or a message first.";
      outputEl.hidden = false;
      return;
    }
    const urls = raw.match(/https?:\/\/[^\s<>"']+/g) || [];
    if (urls.length === 1 && raw === urls[0]) {
      const result = clean(raw);
      const signed = result.rules.includes("signed-url-guard");
      showResult(
        result.url,
        result.removed,
        result.kept,
        signed
          ? "Signed link — returned untouched so it still works."
          : result.removed.length === 0
            ? "Nothing was removed — this link was already clean."
            : ""
      );
    } else {
      const result = cleanText(raw);
      const first = result.replacements[0];
      const removed = [...new Set(result.replacements.flatMap((r) => r.removed))];
      showResult(
        first ? first.to : result.text,
        removed,
        [],
        result.replacements.length === 0
          ? "Nothing was removed — this text was already clean."
          : `${result.replacements.length} link(s) cleaned.`
      );
    }
    // Keep the last result for the next popup open.
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ lastCleaned: { text: lastCleanText, at: Date.now() } }).catch(() => {});
    }
  }

  document.getElementById("cleanBtn").addEventListener("click", doClean);
  document.getElementById("clearBtn").addEventListener("click", () => {
    inputEl.value = "";
    outputEl.hidden = true;
    inputEl.focus();
  });
  document.getElementById("pasteBtn").addEventListener("click", async () => {
    try {
      inputEl.value = await navigator.clipboard.readText();
      doClean();
    } catch {
      inputEl.focus();
    }
  });
  document.getElementById("tabBtn").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        inputEl.value = tab.url;
        doClean();
      }
    } catch {
      statusEl.textContent = "Could not read the current tab URL.";
      outputEl.hidden = false;
    }
  });
  document.getElementById("copyBtn").addEventListener("click", async () => {
    const btn = document.getElementById("copyBtn");
    try {
      await navigator.clipboard.writeText(lastCleanText);
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = "Copy clean link"; }, 1500);
    } catch {
      statusEl.textContent = "Copy failed — select the text and copy it yourself.";
    }
  });
  inputEl.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") doClean();
  });

  // Prefill with the last context-menu clean, if any.
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get("lastCleaned").then(({ lastCleaned }) => {
      if (lastCleaned?.text) {
        inputEl.value = lastCleaned.text;
        doClean();
      }
    }).catch(() => {});
  }
}

// Clean-share background service worker — Chrome MV3.
// Uses ./clean-share.js, a bundled copy of ../core/clean-share.js (identical file); no cleaning logic is duplicated here.
// Right-click a link (or anywhere on a page) -> clean that URL -> open the
// popup as a tab showing the clean link, ready to copy or share.
// No analytics, no network calls, offline.
import { clean } from "./clean-share.js";

// Pure handler, exported so it can be exercised without Chrome APIs.
export async function handleContextClick(info, chromeApi) {
  const raw = info.linkUrl || info.pageUrl || "";
  if (!raw) return null;
  const result = clean(raw);
  const record = {
    original: raw,
    cleaned: result.url,
    removed: result.removed,
    kept: result.kept,
    rules: result.rules,
    at: Date.now(),
  };
  if (chromeApi?.storage?.local) {
    await chromeApi.storage.local.set({ lastCleaned: { text: result.url, ...record } });
  }
  if (chromeApi?.tabs?.create && chromeApi?.runtime?.getURL) {
    await chromeApi.tabs.create({ url: chromeApi.runtime.getURL("popup.html") });
  }
  return record;
}

if (typeof chrome !== "undefined" && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "clean-share-link",
      title: "Clean-share: clean this link",
      contexts: ["link"],
    });
    chrome.contextMenus.create({
      id: "clean-share-page",
      title: "Clean-share: clean this page URL",
      contexts: ["page"],
    });
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    handleContextClick(info, chrome).catch(() => {});
  });
}

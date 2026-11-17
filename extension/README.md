# Clean-share — Chrome extension (MV3)

Offline, zero-dependency. The popup and the background service worker both
import `./clean-share.js` — a bundled copy of `../core/clean-share.js`,
byte-identical to the library core. No cleaning logic is duplicated.
No analytics, no network calls, nothing is uploaded. When the core changes,
copy it again: `cp ../core/clean-share.js extension/clean-share.js`.

## Install (Load unpacked)

1. Open `chrome://extensions` in Chrome (or any Chromium browser).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Click the Clean-share icon in the toolbar (pin it if it is hidden).

## Use

- **Popup:** click the toolbar icon, paste a link or a message, press
  **Clean**. **Clean current tab** cleans the URL of the tab you are on.
  **Copy clean link** copies the result; WhatsApp / Telegram / SMS / Email
  open a ready-to-send share link.
- **Right-click:** on any link, choose **Clean-share: clean this link**;
  on a page, **Clean-share: clean this page URL**. The clean link opens
  in the popup (as a tab) ready to copy or share.
- Signed links are returned untouched, exactly as the library does.

## Packaging note for the Web Store

The core is already bundled in this folder (`clean-share.js`), so Load
unpacked works as-is. Do **not** publish to the Chrome Web Store yet.

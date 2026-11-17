// Clean-share — offline, zero-dependency URL cleaner.
// MIT License. No runtime dependencies, no Node APIs, no network calls.
// Runs in the browser, Node, and a Chrome MV3 extension.
//
// Canonical rules live in data/rules.json. The DEFAULT_RULES below are an
// embedded snapshot of that file so the library works in a browser without
// a fetch. Pass { rules } to clean() / cleanText() to use a different
// (e.g. freshly loaded) rule set instead.
//
// API (identical in the Python twin, core/clean_share.py):
//   clean(url, options?)          -> { url, removed, kept, rules }
//   cleanText(text, options?)     -> { text, replacements }
//   shareLinks({ phone, text, url }) -> { whatsapp, telegram, sms, email, web }
//   isClean(url, options?)        -> boolean

export const DEFAULT_RULES = {
  version: "0.4.0",
  updated: "2026-11-17",
  global_strip: [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
    "fbclid", "fb_action_ids", "fb_action_types", "fb_source", "fb_ref",
    "gclid", "gbraid", "wbraid", "msclkid", "mc_cid", "mc_eid",
    "igshid", "igsh", "twclid", "li_fat_id", "dclid", "yclid",
    "_ga", "_gl", "_gac", "_fbp", "srsltid", "gad_source",
    "vero_id", "vero_conv", "vero_event", "_hsenc", "_hsmi", "_ke", "_kx", "mkt_tok",
  ],
  signed_guard: { params: ["sig", "signature", "hmac", "token", "expires", "policy"] },
  providers: [
    { id: "youtube", hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"], strip: ["si", "feature", "ab_channel", "pp", "embeds_referring_euri", "embeds_referring_origin"], keep: ["v", "t", "list", "index", "start", "end"], source: "https://support.google.com/youtube/answer/171780" },
    { id: "google-play", hosts: ["play.google.com"], strip: ["referrer", "pcampaignid", "paffiliateid", "pcamrefid"], keep: ["id", "hl", "gl"], source: "https://support.google.com/affiliate/answer/7521141" },
    { id: "google-search", hosts: ["google.com", "www.google.com", "google.co.uk", "www.google.co.uk"], strip: ["ved", "ei", "uact", "oq", "gs_lcp", "sclient", "source", "sca_esv", "sxsrf", "rlz", "sa", "sqi", "iflsig", "gbv"], keep: ["q", "hl"], source: "https://support.google.com/websearch/answer/35890" },
    { id: "facebook", hosts: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"], strip: ["mibextid", "ref", "__tn__", "__xts__", "__cft__", "eav", "paipv", "rdc", "rdr", "idorvanity"], keep: ["id", "story_fbid", "v"], source: "https://www.facebook.com/help/192946942409345" },
    { id: "instagram", hosts: ["instagram.com", "www.instagram.com"], strip: ["hl", "eav"], keep: [], source: "https://help.instagram.com/116024195217477" },
    { id: "tiktok", hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"], strip: ["_t", "_r", "is_from_webapp", "sender_device", "sender_web_id", "sec_uid", "share_app_id", "share_iid", "u_code", "share_item_id", "timestamp"], keep: ["is_copy_url"], source: "https://support.tiktok.com/en/using-tiktok/sharing-videos" },
    { id: "x", hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"], strip: ["s", "ref_src", "ref_url", "ref_cta"], keep: ["q"], source: "https://help.x.com/en/using-x/search" },
    { id: "amazon", hosts: ["amazon.com", "www.amazon.com", "amazon.co.uk", "www.amazon.co.uk"], strip: ["tag", "ref", "psc", "pd_rd_w", "pd_rd_r", "pf_rd_p", "pf_rd_r", "_encoding", "content-id", "srsltid", "s", "sprefix"], keep: ["k", "node", "asin"], source: "https://www.amazon.com/gp/help/customer/display.html?nodeId=468520" },
    { id: "aliexpress", hosts: ["aliexpress.com", "www.aliexpress.com", "aliexpress.us", "www.aliexpress.us"], strip: ["spm", "algo_pvid", "algo_exp_id", "pdp_npi", "scm", "aff_fcid", "aff_fsk", "aff_platform", "aff_trace_key", "dp", "isViewCP", "srcSns"], keep: [], source: "https://helpcenter.aliexpress.com/s/article" },
    { id: "spotify", hosts: ["open.spotify.com", "spotify.com", "www.spotify.com"], strip: ["si", "context", "nd"], keep: [], source: "https://support.spotify.com/article/share-music/" },
    { id: "linkedin", hosts: ["linkedin.com", "www.linkedin.com"], strip: ["trk", "trkInfo", "lipi", "lici", "upsell", "refId", "midSig"], keep: ["id", "start"], source: "https://www.linkedin.com/help/linkedin/answer/a1337205" },
    { id: "daraz", hosts: ["daraz.pk", "www.daraz.pk", "daraz.com", "www.daraz.com"], strip: ["spm", "algo_pvid", "algo_exp_id", "scm", "search", "traffic_source"], keep: ["sku", "id", "q"], source: "https://www.daraz.pk/help/" },
    { id: "olx", hosts: ["olx.com.pk", "www.olx.com.pk", "olx.com", "www.olx.com"], strip: ["bs", "t", "referrer"], keep: ["id", "q"], source: "https://www.olx.com.pk/" },
    { id: "shopee", hosts: ["shopee.ph", "shopee.com.my", "shopee.sg", "shopee.com", "www.shopee.ph", "www.shopee.com.my"], strip: ["sp_atk", "xpt", "is_from_search", "af_siteid"], keep: ["i", "s"], source: "https://shopee.ph/" },
    { id: "ebay", hosts: ["ebay.com", "www.ebay.com", "ebay.co.uk", "www.ebay.co.uk"], strip: ["_trkparms", "_trksid", "hash", "amdata", "mkcid", "mkrid", "campid", "toolid", "customid"], keep: ["itm", "_nkw"], source: "https://www.ebay.com/help/" },
    { id: "reddit", hosts: ["reddit.com", "www.reddit.com", "old.reddit.com", "out.reddit.com"], strip: ["ref", "ref_source", "context"], keep: ["q"], source: "https://support.reddithelp.com/", unwrap_param: "url", unwrap_hosts: ["out.reddit.com"] },
    { id: "medium", hosts: ["medium.com", "www.medium.com"], strip: ["sk", "source"], keep: [], source: "https://help.medium.com/" },
    { id: "gmail-wrapper", hosts: ["www.google.com", "google.com"], strip: [], keep: [], source: "https://support.google.com/accounts/answer/32040", unwrap_param: "q", path_prefix: "/url" },
    { id: "outlook-safelinks", hosts: ["safelinks.protection.outlook.com"], strip: [], keep: [], source: "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about", unwrap_param: "url" },
    { id: "tco-bitly", hosts: ["t.co", "bit.ly", "bitly.com", "www.bitly.com"], strip: [], keep: [], source: "https://help.x.com/en/using-x/how-to-use-t-co", unwrap_param: "url" },
    { id: "pinterest", hosts: ["pinterest.com", "www.pinterest.com", "pin.it"], strip: ["invite"], keep: [], source: "https://help.pinterest.com/en/article/share-pins" },
    { id: "snapchat", hosts: ["snapchat.com", "www.snapchat.com"], strip: ["sender_web_id", "share_id"], keep: [], source: "https://help.snapchat.com/" },
    { id: "telegram", hosts: ["t.me", "telegram.me", "telegram.org", "www.telegram.org"], strip: ["ref"], keep: ["start"], source: "https://telegram.org/faq" },
    { id: "whatsapp", hosts: ["wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com"], strip: [], keep: ["text", "phone"], source: "https://faq.whatsapp.com/" },
    { id: "shein", hosts: ["shein.com", "www.shein.com"], strip: ["src_identifier", "src_module", "src_tab_page_id", "main_attr"], keep: ["goods_id"], source: "https://www.shein.com/" },
    { id: "temu", hosts: ["temu.com", "www.temu.com"], strip: ["_x_sessn_id", "_x_ns", "refer_page_name", "refer_page_id", "refer_page_sn"], keep: ["goods_id"], source: "https://www.temu.com/" },
    { id: "quora", hosts: ["quora.com", "www.quora.com"], strip: ["ch", "oid", "srid", "target_type"], keep: [], source: "https://www.quora.com/" },
    { id: "notion", hosts: ["notion.so", "www.notion.so", "notion.site"], strip: ["pvs"], keep: [], source: "https://www.notion.so/" },
    { id: "etsy", hosts: ["etsy.com", "www.etsy.com"], strip: ["click_key", "click_sum", "ref", "frs", "sts", "ga_search_query", "ga_search_type", "ga_view_type", "ga_ship_to", "show_sold_out_detail", "organic_search_click", "logging_key"], keep: ["q"], source: "https://www.etsy.com/" },
    { id: "flipkart", hosts: ["flipkart.com", "www.flipkart.com"], strip: ["affid", "affExtParam1", "affExtParam2", "lid", "otracker"], keep: ["pid", "q"], source: "https://www.flipkart.com/" },
    { id: "booking", hosts: ["booking.com", "www.booking.com"], strip: ["aid", "label", "sid", "srpvid"], keep: ["checkin", "checkout", "dest_id", "dest_type", "group_adults", "group_children", "no_rooms"], source: "https://www.booking.com/" },
    { id: "imdb", hosts: ["imdb.com", "www.imdb.com"], strip: ["ref_"], keep: ["q"], source: "https://bugzilla.mozilla.org/show_bug.cgi?id=1945449" },
    { id: "app-store", hosts: ["apps.apple.com", "itunes.apple.com", "www.apps.apple.com"], strip: ["at", "ct", "pt"], keep: ["id", "mt"], source: "https://apps.apple.com/" },
    { id: "steam", hosts: ["store.steampowered.com", "steampowered.com", "steamcommunity.com"], strip: ["snr"], keep: ["l"], source: "https://store.steampowered.com/" },
    { id: "udemy", hosts: ["udemy.com", "www.udemy.com"], strip: ["ranMID", "ranEAID", "ranSiteID", "siteID"], keep: ["couponCode", "q"], source: "https://www.udemy.com/" },
    { id: "bbc", hosts: ["bbc.com", "www.bbc.com", "bbc.co.uk", "www.bbc.co.uk"], strip: ["at_medium", "at_campaign", "at_custom1", "at_custom2", "at_custom3", "at_custom4", "at_custom5", "at_bbc_team", "at_ptr_name"], keep: [], source: "https://www.bbc.com/" },
    { id: "wikipedia", hosts: ["wikipedia.org", "www.wikipedia.org", "wikimedia.org", "www.wikimedia.org", "mediawiki.org", "www.mediawiki.org"], strip: ["wprov"], keep: ["title", "oldid", "action", "diff", "redirect"], source: "https://wikitech.wikimedia.org/wiki/Provenance" },
    { id: "kickstarter", hosts: ["kickstarter.com", "www.kickstarter.com"], strip: ["ref"], keep: [], source: "https://help.kickstarter.com/en-us/articles/16236548-how-do-i-create-a-custom-referral-tag-and-track-referral-stats" },
    { id: "substack", hosts: ["substack.com", "www.substack.com", "open.substack.com"], strip: ["r"], keep: [], source: "https://substack.com/" },
    { id: "soundcloud", hosts: ["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"], strip: ["si"], keep: [], source: "https://soundcloud.com/" },
  ],
};

const SIGNED_PARAMS = new Set(DEFAULT_RULES.signed_guard.params);

function decodeName(raw) {
  try { return decodeURIComponent(raw.replace(/\+/g, " ")); } catch { return raw; }
}

// Split a URL into { before, query, fragment } without normalising anything.
// Keeping the raw name/value strings is what makes JS and Python agree
// byte-for-byte, and what preserves the user's original encoding.
function splitUrl(input) {
  let rest = input;
  let fragment = "";
  const hash = rest.indexOf("#");
  if (hash !== -1) { fragment = rest.slice(hash); rest = rest.slice(0, hash); }
  const q = rest.indexOf("?");
  if (q === -1) return { before: rest, query: null, fragment };
  return { before: rest.slice(0, q), query: rest.slice(q + 1), fragment };
}

function hostOf(before) {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(before);
  if (!m) return "";
  let host = m[1].toLowerCase();
  // Strip a port if present (e.g. example.com:8080).
  const colon = host.lastIndexOf(":");
  if (colon !== -1) host = host.slice(0, colon);
  return host;
}

function findProvider(host, rules) {
  if (!host) return null;
  for (const p of rules.providers || []) {
    for (const h of p.hosts || []) {
      const hl = h.toLowerCase();
      if (host === hl || host.endsWith("." + hl)) return p;
    }
  }
  return null;
}

function findWrapper(host, before, rules) {
  if (!host) return null;
  const path = before.replace(/^https?:\/\/[^/?#]+/i, "") || "/";
  for (const p of rules.providers || []) {
    if (!p.unwrap_param) continue;
    if (p.path_prefix && !path.startsWith(p.path_prefix)) continue;
    const hosts = p.unwrap_hosts || p.hosts || [];
    for (const h of hosts) {
      const hl = h.toLowerCase();
      if (host === hl || host.endsWith("." + hl)) return p;
    }
  }
  return null;
}

function decodeValue(raw) {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export function clean(input, options = {}) {
  const rules = options.rules || DEFAULT_RULES;
  const globalStrip = new Set((rules.global_strip || []).map((s) => s.toLowerCase()));
  const signed = new Set((rules.signed_guard?.params || []).map((s) => s.toLowerCase()));

  if (typeof input !== "string" || !/^https?:\/\//i.test(input)) {
    return { url: input, removed: [], kept: [], rules: ["invalid-url"] };
  }
  const { before, query, fragment } = splitUrl(input);
  if (query === null || query === "") {
    return { url: input, removed: [], kept: [], rules: [] };
  }
  // Parse params, preserving raw name/value and order.
  const params = query.split("&").filter((p) => p !== "").map((p) => {
    const eq = p.indexOf("=");
    const rawName = eq === -1 ? p : p.slice(0, eq);
    const rawValue = eq === -1 ? "" : p.slice(eq + 1);
    return { rawName, rawValue, hasEq: eq !== -1, name: decodeName(rawName).toLowerCase() };
  });
  if (params.length === 0) return { url: input, removed: [], kept: [], rules: [] };

  // Safety guard (non-negotiable): a signed URL is returned untouched.
  // Stripping sig/signature/hmac/token/expires/policy/X-Amz-* would break it.
  const isSigned = params.some((p) => signed.has(p.name) || p.name.startsWith("x-amz-"));
  if (isSigned) {
    return {
      url: input,
      removed: [],
      kept: params.map((p) => p.name),
      rules: ["signed-url-guard"],
    };
  }

  const host = hostOf(before);

  // Redirect-wrapper unwrap (offline only): if this host/path is a known
  // wrapper and the target URL is already encoded in the link itself,
  // unwrap it and clean the target. Never follow a short link over the
  // network — a real t.co/bit.ly short code has no encoded target and
  // falls through to normal stripping below, unchanged.
  const wrapper = findWrapper(host, before, rules);
  if (wrapper) {
    const targetParam = params.find((p) => p.name === wrapper.unwrap_param.toLowerCase());
    if (targetParam) {
      const target = decodeValue(targetParam.rawValue);
      if (/^https?:\/\//i.test(target) && target !== input) {
        const inner = clean(target, options);
        return { url: inner.url, removed: inner.removed, kept: inner.kept, rules: [`unwrap:${wrapper.id}`, ...inner.rules] };
      }
    }
  }

  const provider = findProvider(host, rules);
  const providerStrip = new Set((provider?.strip || []).map((s) => s.toLowerCase()));
  const providerKeep = new Set((provider?.keep || []).map((s) => s.toLowerCase()));

  const removed = [];
  const kept = [];
  const keptRaw = [];
  let removedGlobal = false;
  let removedProvider = false;
  for (const p of params) {
    // A kept parameter is never stripped, even if it also appears in a strip list.
    if (providerKeep.has(p.name)) { kept.push(p.name); keptRaw.push(p); continue; }
    const isGlobal = globalStrip.has(p.name) || p.name.startsWith("utm_");
    const isProvider = providerStrip.has(p.name);
    if (isGlobal || isProvider) {
      removed.push(p.name);
      if (isGlobal) removedGlobal = true;
      if (isProvider) removedProvider = true;
      continue;
    }
    // Anything we do not recognise is kept. This is also the
    // "only carrier of page identity" guard: on a host with no rule,
    // an unknown single parameter is never removed.
    kept.push(p.name);
    keptRaw.push(p);
  }

  const applied = [];
  if (removedGlobal) applied.push("global");
  if (removedProvider && provider) applied.push(provider.id);

  let url;
  if (keptRaw.length === 0) {
    url = before + fragment;
  } else {
    const qs = keptRaw.map((p) => (p.hasEq ? `${p.rawName}=${p.rawValue}` : p.rawName)).join("&");
    url = `${before}?${qs}${fragment}`;
  }
  return { url, removed, kept, rules: applied };
}

export function isClean(input, options = {}) {
  const result = clean(input, options);
  if (result.rules.includes("invalid-url")) return false;
  return result.removed.length === 0;
}

const URL_RE = /https?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/;

export function cleanText(text, options = {}) {
  if (typeof text !== "string") return { text, replacements: [] };
  const replacements = [];
  const out = text.replace(URL_RE, (match) => {
    // Trailing sentence punctuation is not part of the URL.
    const punctMatch = TRAILING_PUNCT.exec(match);
    let suffix = "";
    let urlPart = match;
    if (punctMatch) { suffix = punctMatch[0]; urlPart = match.slice(0, -suffix.length); }
    const result = clean(urlPart, options);
    if (result.removed.length === 0) return match;
    replacements.push({ from: urlPart, to: result.url, removed: result.removed });
    return result.url + suffix;
  });
  return { text: out, replacements };
}

function encode(s) { return encodeURIComponent(s); }

function normalisePhone(phone) {
  if (!phone) return "";
  const raw = String(phone);
  let digits = raw.replace(/\D/g, "");
  if (/^00/.test(raw.trim()) || digits.startsWith("00")) digits = digits.replace(/^00/, "");
  return digits;
}

export function shareLinks(input = {}) {
  const phone = input.phone || "";
  const text = input.text || "";
  const url = input.url || "";
  const cleanedUrl = url ? clean(url).url : "";
  const message = text || "";
  const combined = [message, cleanedUrl].filter(Boolean).join(" ");
  const digits = normalisePhone(phone);

  const whatsapp = digits
    ? (combined ? `https://wa.me/${digits}?text=${encode(combined)}` : `https://wa.me/${digits}`)
    : (combined ? `https://wa.me/?text=${encode(combined)}` : "https://wa.me/");
  const telegram = cleanedUrl
    ? `https://t.me/share/url?url=${encode(cleanedUrl)}&text=${encode(message)}`
    : (message ? `https://t.me/share/url?text=${encode(message)}` : "https://t.me/share/url");
  const sms = phone
    ? `sms:+${digits}?&body=${encode(combined)}`
    : `sms:?&body=${encode(combined)}`;
  const subject = message ? message.split("\n")[0].slice(0, 80) : "Shared link";
  const email = `mailto:?subject=${encode(subject)}&body=${encode(combined)}`;
  return { whatsapp, telegram, sms, email, web: whatsapp };
}

export default { clean, cleanText, shareLinks, isClean, DEFAULT_RULES };

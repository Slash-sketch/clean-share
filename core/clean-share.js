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
  version: "0.1.0",
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
    { id: "google-search", hosts: ["google.com", "www.google.com", "google.co.uk", "www.google.co.uk"], strip: ["ved", "ei", "uact", "oq", "gs_lcp", "sclient", "source", "sca_esv", "sxsrf", "rlz", "sa", "sqi", "iflsig", "gbv"], keep: ["q", "hl"], source: "https://support.google.com/websearch/answer/35890" },
    { id: "facebook", hosts: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"], strip: ["mibextid", "ref", "__tn__", "__xts__", "__cft__", "eav", "paipv", "rdc", "rdr", "idorvanity"], keep: ["id", "story_fbid", "v"], source: "https://www.facebook.com/help/192946942409345" },
    { id: "instagram", hosts: ["instagram.com", "www.instagram.com"], strip: ["hl", "eav"], keep: [], source: "https://help.instagram.com/116024195217477" },
    { id: "tiktok", hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"], strip: ["_t", "_r", "is_from_webapp", "sender_device", "sender_web_id", "sec_uid", "share_app_id", "share_iid", "u_code", "share_item_id", "timestamp"], keep: ["is_copy_url"], source: "https://support.tiktok.com/en/using-tiktok/sharing-videos" },
    { id: "x", hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"], strip: ["s", "ref_src", "ref_url", "ref_cta"], keep: ["q"], source: "https://help.x.com/en/using-x/search" },
    { id: "amazon", hosts: ["amazon.com", "www.amazon.com", "amazon.co.uk", "www.amazon.co.uk"], strip: ["tag", "ref", "psc", "pd_rd_w", "pd_rd_r", "pf_rd_p", "pf_rd_r", "_encoding", "content-id", "srsltid", "s", "sprefix"], keep: ["k", "node", "asin"], source: "https://www.amazon.com/gp/help/customer/display.html?nodeId=468520" },
    { id: "aliexpress", hosts: ["aliexpress.com", "www.aliexpress.com", "aliexpress.us", "www.aliexpress.us"], strip: ["spm", "algo_pvid", "algo_exp_id", "pdp_npi", "scm", "aff_fcid", "aff_fsk", "aff_platform", "aff_trace_key", "dp", "isViewCP", "srcSns"], keep: [], source: "https://helpcenter.aliexpress.com/s/article" },
    { id: "spotify", hosts: ["open.spotify.com", "spotify.com", "www.spotify.com"], strip: ["si", "context", "nd"], keep: [], source: "https://support.spotify.com/article/share-music/" },
    { id: "linkedin", hosts: ["linkedin.com", "www.linkedin.com"], strip: ["trk", "trkInfo", "lipi", "lici", "upsell", "refId", "midSig"], keep: ["id", "start"], source: "https://www.linkedin.com/help/linkedin/answer/a1337205" },
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

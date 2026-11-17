# Clean-share — offline, zero-dependency URL cleaner.
# MIT License. Standard library only (urllib.parse). No network calls.
#
# Canonical rules live in data/rules.json. DEFAULT_RULES below is an
# embedded snapshot of that file. Pass ``rules=`` to clean() / clean_text()
# to use a different (e.g. freshly loaded) rule set instead.
#
# API (identical to the JS twin, core/clean-share.js):
#   clean(url, rules=None)        -> {"url", "removed", "kept", "rules"}
#   clean_text(text, rules=None)  -> {"text", "replacements"}
#   share_links(phone=None, text="", url="")  (also accepts one dict)
#                                 -> {"whatsapp", "telegram", "sms", "email", "web"}
#   is_clean(url, rules=None)     -> bool
"""Clean-share: strip tracking parameters from URLs, offline."""

import json
import os
import re
from urllib.parse import quote, unquote

__all__ = ["clean", "clean_text", "share_links", "is_clean", "DEFAULT_RULES", "load_rules"]

__version__ = "0.1.0"
__author__ = "Slash-sketch"

DEFAULT_RULES = {
    "version": "0.2.0",
    "updated": "2026-11-17",
    "global_strip": [
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
        "fbclid", "fb_action_ids", "fb_action_types", "fb_source", "fb_ref",
        "gclid", "gbraid", "wbraid", "msclkid", "mc_cid", "mc_eid",
        "igshid", "igsh", "twclid", "li_fat_id", "dclid", "yclid",
        "_ga", "_gl", "_gac", "_fbp", "srsltid", "gad_source",
        "vero_id", "vero_conv", "vero_event", "_hsenc", "_hsmi", "_ke", "_kx", "mkt_tok",
    ],
    "signed_guard": {"params": ["sig", "signature", "hmac", "token", "expires", "policy"]},
    "providers": [
        {"id": "youtube", "hosts": ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"], "strip": ["si", "feature", "ab_channel", "pp", "embeds_referring_euri", "embeds_referring_origin"], "keep": ["v", "t", "list", "index", "start", "end"], "source": "https://support.google.com/youtube/answer/171780"},
        {"id": "google-search", "hosts": ["google.com", "www.google.com", "google.co.uk", "www.google.co.uk"], "strip": ["ved", "ei", "uact", "oq", "gs_lcp", "sclient", "source", "sca_esv", "sxsrf", "rlz", "sa", "sqi", "iflsig", "gbv"], "keep": ["q", "hl"], "source": "https://support.google.com/websearch/answer/35890"},
        {"id": "facebook", "hosts": ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"], "strip": ["mibextid", "ref", "__tn__", "__xts__", "__cft__", "eav", "paipv", "rdc", "rdr", "idorvanity"], "keep": ["id", "story_fbid", "v"], "source": "https://www.facebook.com/help/192946942409345"},
        {"id": "instagram", "hosts": ["instagram.com", "www.instagram.com"], "strip": ["hl", "eav"], "keep": [], "source": "https://help.instagram.com/116024195217477"},
        {"id": "tiktok", "hosts": ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"], "strip": ["_t", "_r", "is_from_webapp", "sender_device", "sender_web_id", "sec_uid", "share_app_id", "share_iid", "u_code", "share_item_id", "timestamp"], "keep": ["is_copy_url"], "source": "https://support.tiktok.com/en/using-tiktok/sharing-videos"},
        {"id": "x", "hosts": ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"], "strip": ["s", "ref_src", "ref_url", "ref_cta"], "keep": ["q"], "source": "https://help.x.com/en/using-x/search"},
        {"id": "amazon", "hosts": ["amazon.com", "www.amazon.com", "amazon.co.uk", "www.amazon.co.uk"], "strip": ["tag", "ref", "psc", "pd_rd_w", "pd_rd_r", "pf_rd_p", "pf_rd_r", "_encoding", "content-id", "srsltid", "s", "sprefix"], "keep": ["k", "node", "asin"], "source": "https://www.amazon.com/gp/help/customer/display.html?nodeId=468520"},
        {"id": "aliexpress", "hosts": ["aliexpress.com", "www.aliexpress.com", "aliexpress.us", "www.aliexpress.us"], "strip": ["spm", "algo_pvid", "algo_exp_id", "pdp_npi", "scm", "aff_fcid", "aff_fsk", "aff_platform", "aff_trace_key", "dp", "isViewCP", "srcSns"], "keep": [], "source": "https://helpcenter.aliexpress.com/s/article"},
        {"id": "spotify", "hosts": ["open.spotify.com", "spotify.com", "www.spotify.com"], "strip": ["si", "context", "nd"], "keep": [], "source": "https://support.spotify.com/article/share-music/"},
        {"id": "linkedin", "hosts": ["linkedin.com", "www.linkedin.com"], "strip": ["trk", "trkInfo", "lipi", "lici", "upsell", "refId", "midSig"], "keep": ["id", "start"], "source": "https://www.linkedin.com/help/linkedin/answer/a1337205"},
        {"id": "daraz", "hosts": ["daraz.pk", "www.daraz.pk", "daraz.com", "www.daraz.com"], "strip": ["spm", "algo_pvid", "algo_exp_id", "scm", "search", "traffic_source"], "keep": ["sku", "id", "q"], "source": "https://www.daraz.pk/help/"},
        {"id": "olx", "hosts": ["olx.com.pk", "www.olx.com.pk", "olx.com", "www.olx.com"], "strip": ["bs", "t", "referrer"], "keep": ["id", "q"], "source": "https://www.olx.com.pk/"},
        {"id": "shopee", "hosts": ["shopee.ph", "shopee.com.my", "shopee.sg", "shopee.com", "www.shopee.ph", "www.shopee.com.my"], "strip": ["sp_atk", "xpt", "is_from_search", "af_siteid"], "keep": ["i", "s"], "source": "https://shopee.ph/"},
        {"id": "ebay", "hosts": ["ebay.com", "www.ebay.com", "ebay.co.uk", "www.ebay.co.uk"], "strip": ["_trkparms", "_trksid", "hash", "amdata", "mkcid", "mkrid", "campid", "toolid", "customid"], "keep": ["itm", "_nkw"], "source": "https://www.ebay.com/help/"},
        {"id": "reddit", "hosts": ["reddit.com", "www.reddit.com", "old.reddit.com", "out.reddit.com"], "strip": ["ref", "ref_source", "context"], "keep": ["q"], "source": "https://support.reddithelp.com/", "unwrap_param": "url", "unwrap_hosts": ["out.reddit.com"]},
        {"id": "medium", "hosts": ["medium.com", "www.medium.com"], "strip": ["sk", "source"], "keep": [], "source": "https://help.medium.com/"},
        {"id": "gmail-wrapper", "hosts": ["www.google.com", "google.com"], "strip": [], "keep": [], "source": "https://support.google.com/accounts/answer/32040", "unwrap_param": "q", "path_prefix": "/url"},
        {"id": "outlook-safelinks", "hosts": ["safelinks.protection.outlook.com"], "strip": [], "keep": [], "source": "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about", "unwrap_param": "url"},
        {"id": "tco-bitly", "hosts": ["t.co", "bit.ly", "bitly.com", "www.bitly.com"], "strip": [], "keep": [], "source": "https://help.x.com/en/using-x/how-to-use-t-co", "unwrap_param": "url"},
        {"id": "pinterest", "hosts": ["pinterest.com", "www.pinterest.com", "pin.it"], "strip": ["invite"], "keep": [], "source": "https://help.pinterest.com/en/article/share-pins"},
        {"id": "snapchat", "hosts": ["snapchat.com", "www.snapchat.com"], "strip": ["sender_web_id", "share_id"], "keep": [], "source": "https://help.snapchat.com/"},
        {"id": "telegram", "hosts": ["t.me", "telegram.me", "telegram.org", "www.telegram.org"], "strip": ["ref"], "keep": ["start"], "source": "https://telegram.org/faq"},
        {"id": "whatsapp", "hosts": ["wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com"], "strip": [], "keep": ["text", "phone"], "source": "https://faq.whatsapp.com/"},
        {"id": "shein", "hosts": ["shein.com", "www.shein.com"], "strip": ["src_identifier", "src_module", "src_tab_page_id", "main_attr"], "keep": ["goods_id"], "source": "https://www.shein.com/"},
        {"id": "temu", "hosts": ["temu.com", "www.temu.com"], "strip": ["_x_sessn_id", "_x_ns", "refer_page_name", "refer_page_id", "refer_page_sn"], "keep": ["goods_id"], "source": "https://www.temu.com/"},
    ],
}


def load_rules(path=None):
    """Load data/rules.json (canonical). Falls back to DEFAULT_RULES."""
    candidates = []
    if path:
        candidates.append(path)
    candidates.append(os.path.join(os.path.dirname(__file__), "..", "data", "rules.json"))
    candidates.append(os.path.join(os.getcwd(), "data", "rules.json"))
    for candidate in candidates:
        try:
            with open(candidate, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            continue
    return DEFAULT_RULES


def _decode_name(raw):
    try:
        return unquote(raw.replace("+", " "))
    except Exception:
        return raw


def _split_url(text):
    fragment = ""
    rest = text
    h = rest.find("#")
    if h != -1:
        fragment = rest[h:]
        rest = rest[:h]
    q = rest.find("?")
    if q == -1:
        return rest, None, fragment
    return rest[:q], rest[q + 1:], fragment


def _host_of(before):
    m = re.match(r"https?://([^/?#:]+)", before, re.IGNORECASE)
    if not m:
        return ""
    host = m.group(1).lower()
    if ":" in host:
        host = host.rsplit(":", 1)[0]
    return host


def _find_provider(host, rules):
    if not host:
        return None
    for provider in rules.get("providers") or []:
        for h in provider.get("hosts") or []:
            hl = h.lower()
            if host == hl or host.endswith("." + hl):
                return provider
    return None


def _find_wrapper(host, before, rules):
    """Find a redirect-wrapper provider for this host/path, if any."""
    if not host:
        return None
    path = re.sub(r"^https?://[^/?#]+", "", before, flags=re.IGNORECASE) or "/"
    for provider in rules.get("providers") or []:
        if not provider.get("unwrap_param"):
            continue
        prefix = provider.get("path_prefix")
        if prefix and not path.startswith(prefix):
            continue
        for h in provider.get("unwrap_hosts") or provider.get("hosts") or []:
            hl = h.lower()
            if host == hl or host.endswith("." + hl):
                return provider
    return None


def _decode_value(raw):
    try:
        return unquote(raw)
    except Exception:
        return raw


def clean(url, rules=None):
    """Strip tracking parameters. Returns {url, removed, kept, rules}."""
    rules = rules or DEFAULT_RULES
    global_strip = {s.lower() for s in rules.get("global_strip") or []}
    signed = {s.lower() for s in (rules.get("signed_guard") or {}).get("params") or []}

    if not isinstance(url, str) or not re.match(r"https?://", url, re.IGNORECASE):
        return {"url": url, "removed": [], "kept": [], "rules": ["invalid-url"]}

    before, query, fragment = _split_url(url)
    if query is None or query == "":
        return {"url": url, "removed": [], "kept": [], "rules": []}

    params = []
    for part in query.split("&"):
        if part == "":
            continue
        eq = part.find("=")
        if eq == -1:
            raw_name, raw_value, has_eq = part, "", False
        else:
            raw_name, raw_value, has_eq = part[:eq], part[eq + 1:], True
        params.append({
            "raw_name": raw_name, "raw_value": raw_value, "has_eq": has_eq,
            "name": _decode_name(raw_name).lower(),
        })
    if not params:
        return {"url": url, "removed": [], "kept": [], "rules": []}

    # Safety guard (non-negotiable): a signed URL is returned untouched.
    if any(p["name"] in signed or p["name"].startswith("x-amz-") for p in params):
        return {
            "url": url,
            "removed": [],
            "kept": [p["name"] for p in params],
            "rules": ["signed-url-guard"],
        }

    host = _host_of(before)

    # Redirect-wrapper unwrap (offline only): if this host/path is a known
    # wrapper and the target URL is already encoded in the link itself,
    # unwrap it and clean the target. Never follow a short link over the
    # network — a real t.co/bit.ly short code has no encoded target and
    # falls through to normal stripping below, unchanged.
    wrapper = _find_wrapper(host, before, rules)
    if wrapper:
        target_param = next(
            (p for p in params if p["name"] == wrapper["unwrap_param"].lower()), None
        )
        if target_param:
            target = _decode_value(target_param["raw_value"])
            if re.match(r"https?://", target, re.IGNORECASE) and target != url:
                inner = clean(target, rules=rules)
                return {
                    "url": inner["url"],
                    "removed": inner["removed"],
                    "kept": inner["kept"],
                    "rules": [f"unwrap:{wrapper['id']}"] + inner["rules"],
                }

    provider = _find_provider(host, rules)
    provider_strip = {s.lower() for s in (provider or {}).get("strip") or []}
    provider_keep = {s.lower() for s in (provider or {}).get("keep") or []}

    removed, kept, kept_raw = [], [], []
    removed_global = removed_provider = False
    for p in params:
        if p["name"] in provider_keep:
            kept.append(p["name"])
            kept_raw.append(p)
            continue
        is_global = p["name"] in global_strip or p["name"].startswith("utm_")
        is_provider = p["name"] in provider_strip
        if is_global or is_provider:
            removed.append(p["name"])
            removed_global = removed_global or is_global
            removed_provider = removed_provider or is_provider
            continue
        # Anything unrecognised is kept. This is also the "only carrier
        # of page identity" guard: on a host with no rule, an unknown
        # single parameter is never removed.
        kept.append(p["name"])
        kept_raw.append(p)

    applied = []
    if removed_global:
        applied.append("global")
    if removed_provider and provider:
        applied.append(provider["id"])

    if not kept_raw:
        out = before + fragment
    else:
        qs = "&".join(
            f"{p['raw_name']}={p['raw_value']}" if p["has_eq"] else p["raw_name"]
            for p in kept_raw
        )
        out = f"{before}?{qs}{fragment}"
    return {"url": out, "removed": removed, "kept": kept, "rules": applied}


def is_clean(url, rules=None):
    """True when clean() removes nothing (False for invalid URLs)."""
    result = clean(url, rules=rules)
    if "invalid-url" in result["rules"]:
        return False
    return len(result["removed"]) == 0


_URL_RE = re.compile(r"https?://[^\s<>\"']+")
_TRAILING = re.compile(r"[.,;:!?)\]}]+$")


def clean_text(text, rules=None):
    """Clean every URL in a block of text. Returns {text, replacements}."""
    if not isinstance(text, str):
        return {"text": text, "replacements": []}
    replacements = []

    def _replace(match):
        found = match.group(0)
        m = _TRAILING.search(found)
        suffix, url_part = ("", found)
        if m:
            suffix, url_part = m.group(0), found[: -len(m.group(0))]
        result = clean(url_part, rules=rules)
        if not result["removed"]:
            return found
        replacements.append({"from": url_part, "to": result["url"], "removed": result["removed"]})
        return result["url"] + suffix

    return {"text": _URL_RE.sub(_replace, text), "replacements": replacements}


def _encode(s):
    # Match JS encodeURIComponent: leave - _ . ! ~ * ' ( ) unescaped.
    return quote(s, safe="-_.!~*'()")


def _normalise_phone(phone):
    if not phone:
        return ""
    raw = str(phone)
    digits = re.sub(r"\D", "", raw)
    if raw.strip().startswith("00") or digits.startswith("00"):
        digits = re.sub(r"^00", "", digits)
    return digits


def share_links(phone=None, text="", url="", **kwargs):
    """Build share links. Also accepts one dict: share_links({...})."""
    if isinstance(phone, dict):
        data = phone
        phone, text, url = data.get("phone"), data.get("text", ""), data.get("url", "")
    phone = phone or kwargs.get("phone") or ""
    text = text or kwargs.get("text") or ""
    url = url or kwargs.get("url") or ""
    cleaned_url = clean(url)["url"] if url else ""
    combined = " ".join(p for p in [text, cleaned_url] if p)
    digits = _normalise_phone(phone)

    if digits:
        whatsapp = f"https://wa.me/{digits}?text={_encode(combined)}" if combined else f"https://wa.me/{digits}"
    else:
        whatsapp = f"https://wa.me/?text={_encode(combined)}" if combined else "https://wa.me/"
    if cleaned_url:
        telegram = f"https://t.me/share/url?url={_encode(cleaned_url)}&text={_encode(text)}"
    elif text:
        telegram = f"https://t.me/share/url?text={_encode(text)}"
    else:
        telegram = "https://t.me/share/url"
    sms = f"sms:+{digits}?&body={_encode(combined)}" if phone else f"sms:?&body={_encode(combined)}"
    subject = text.split("\n")[0][:80] if text else "Shared link"
    email = f"mailto:?subject={_encode(subject)}&body={_encode(combined)}"
    return {"whatsapp": whatsapp, "telegram": telegram, "sms": sms, "email": email, "web": whatsapp}

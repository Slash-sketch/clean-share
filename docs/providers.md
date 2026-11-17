# Providers

Every provider rule in Clean-share, generated from `data/rules.json` (rules version 0.4.0, updated 2026-11-17). If this table and `rules.json` ever disagree, `rules.json` wins — regenerate this file from it.

Matching is by host suffix: a rule for `example.com` also matches `www.example.com` and any other subdomain. Unknown parameters are always kept; see the signed-URL guard below.

## Global tracking parameters

These are stripped from **every** URL, whatever the site. Any parameter whose name starts with `utm_` is also stripped, even if it is not listed here.

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `utm_source_platform`, `utm_creative_format`, `utm_marketing_tactic`, `fbclid`, `fb_action_ids`, `fb_action_types`, `fb_source`, `fb_ref`, `gclid`, `gbraid`, `wbraid`, `msclkid`, `mc_cid`, `mc_eid`, `igshid`, `igsh`, `twclid`, `li_fat_id`, `dclid`, `yclid`, `_ga`, `_gl`, `_gac`, `_fbp`, `srsltid`, `gad_source`, `vero_id`, `vero_conv`, `vero_event`, `_hsenc`, `_hsmi`, `_ke`, `_kx`, `mkt_tok`

## Signed-URL guard (applies to every provider)

If a URL carries any of `sig`, `signature`, `hmac`, `token`, `expires`, `policy`, or any parameter starting with `X-Amz-`, the URL is returned **completely untouched** — nothing is removed, not even a known tracker. Stripping a signed parameter would break the link. This is why, for example, a Kickstarter link carrying `token` is left alone: the token is the page's access key, not a tracker.

## Provider rules

| Provider | Hosts | Stripped | Kept | Source |
|---|---|---|---|---|
| **youtube** | `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`, `music.youtube.com` | `si`, `feature`, `ab_channel`, `pp`, `embeds_referring_euri`, `embeds_referring_origin` | `v`, `t`, `list`, `index`, `start`, `end` | [https://support.google.com/youtube/answer/171780](https://support.google.com/youtube/answer/171780) |
| **google-play** | `play.google.com` | `referrer`, `pcampaignid`, `paffiliateid`, `pcamrefid` | `id`, `hl`, `gl` | [https://support.google.com/affiliate/answer/7521141](https://support.google.com/affiliate/answer/7521141) |
| **google-search** | `google.com`, `www.google.com`, `google.co.uk`, `www.google.co.uk` | `ved`, `ei`, `uact`, `oq`, `gs_lcp`, `sclient`, `source`, `sca_esv`, `sxsrf`, `rlz`, `sa`, `sqi`, `iflsig`, `gbv` | `q`, `hl` | [https://support.google.com/websearch/answer/35890](https://support.google.com/websearch/answer/35890) |
| **facebook** | `facebook.com`, `www.facebook.com`, `m.facebook.com`, `fb.com`, `www.fb.com` | `mibextid`, `ref`, `__tn__`, `__xts__`, `__cft__`, `eav`, `paipv`, `rdc`, `rdr`, `idorvanity` | `id`, `story_fbid`, `v` | [https://www.facebook.com/help/192946942409345](https://www.facebook.com/help/192946942409345) |
| **instagram** | `instagram.com`, `www.instagram.com` | `hl`, `eav` | — | [https://help.instagram.com/116024195217477](https://help.instagram.com/116024195217477) |
| **tiktok** | `tiktok.com`, `www.tiktok.com`, `vm.tiktok.com` | `_t`, `_r`, `is_from_webapp`, `sender_device`, `sender_web_id`, `sec_uid`, `share_app_id`, `share_iid`, `u_code`, `share_item_id`, `timestamp` | `is_copy_url` | [https://support.tiktok.com/en/using-tiktok/sharing-videos](https://support.tiktok.com/en/using-tiktok/sharing-videos) |
| **x** | `x.com`, `www.x.com`, `twitter.com`, `www.twitter.com`, `mobile.twitter.com` | `s`, `ref_src`, `ref_url`, `ref_cta` | `q` | [https://help.x.com/en/using-x/search](https://help.x.com/en/using-x/search) |
| **amazon** | `amazon.com`, `www.amazon.com`, `amazon.co.uk`, `www.amazon.co.uk` | `tag`, `ref`, `psc`, `pd_rd_w`, `pd_rd_r`, `pf_rd_p`, `pf_rd_r`, `_encoding`, `content-id`, `srsltid`, `s`, `sprefix` | `k`, `node`, `asin` | [https://www.amazon.com/gp/help/customer/display.html?nodeId=468520](https://www.amazon.com/gp/help/customer/display.html?nodeId=468520) |
| **aliexpress** | `aliexpress.com`, `www.aliexpress.com`, `aliexpress.us`, `www.aliexpress.us` | `spm`, `algo_pvid`, `algo_exp_id`, `pdp_npi`, `scm`, `aff_fcid`, `aff_fsk`, `aff_platform`, `aff_trace_key`, `dp`, `isViewCP`, `srcSns` | — | [https://helpcenter.aliexpress.com/s/article](https://helpcenter.aliexpress.com/s/article) |
| **spotify** | `open.spotify.com`, `spotify.com`, `www.spotify.com` | `si`, `context`, `nd` | — | [https://support.spotify.com/article/share-music/](https://support.spotify.com/article/share-music/) |
| **linkedin** | `linkedin.com`, `www.linkedin.com` | `trk`, `trkInfo`, `lipi`, `lici`, `upsell`, `refId`, `midSig` | `id`, `start` | [https://www.linkedin.com/help/linkedin/answer/a1337205](https://www.linkedin.com/help/linkedin/answer/a1337205) |
| **daraz** | `daraz.pk`, `www.daraz.pk`, `daraz.com`, `www.daraz.com` | `spm`, `algo_pvid`, `algo_exp_id`, `scm`, `search`, `traffic_source` | `sku`, `id`, `q` | [https://www.daraz.pk/help/](https://www.daraz.pk/help/) |
| **olx** | `olx.com.pk`, `www.olx.com.pk`, `olx.com`, `www.olx.com` | `bs`, `t`, `referrer` | `id`, `q` | [https://www.olx.com.pk/](https://www.olx.com.pk/) |
| **shopee** | `shopee.ph`, `shopee.com.my`, `shopee.sg`, `shopee.com`, `www.shopee.ph`, `www.shopee.com.my` | `sp_atk`, `xpt`, `is_from_search`, `af_siteid` | `i`, `s` | [https://shopee.ph/](https://shopee.ph/) |
| **ebay** | `ebay.com`, `www.ebay.com`, `ebay.co.uk`, `www.ebay.co.uk` | `_trkparms`, `_trksid`, `hash`, `amdata`, `mkcid`, `mkrid`, `campid`, `toolid`, `customid` | `itm`, `_nkw` | [https://www.ebay.com/help/](https://www.ebay.com/help/) |
| **reddit** | `reddit.com`, `www.reddit.com`, `old.reddit.com`, `out.reddit.com` | `ref`, `ref_source`, `context` Unwraps `?url=<url>` offline only, when the target is already encoded in the link. | `q` | [https://support.reddithelp.com/](https://support.reddithelp.com/) |
| **medium** | `medium.com`, `www.medium.com` | `sk`, `source` | — | [https://help.medium.com/](https://help.medium.com/) |
| **gmail-wrapper** | `www.google.com`, `google.com` | — Unwraps `?q=<url>` offline only, when the target is already encoded in the link. | — | [https://support.google.com/accounts/answer/32040](https://support.google.com/accounts/answer/32040) |
| **outlook-safelinks** | `safelinks.protection.outlook.com` | — Unwraps `?url=<url>` offline only, when the target is already encoded in the link. | — | [https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about](https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about) |
| **tco-bitly** | `t.co`, `bit.ly`, `bitly.com`, `www.bitly.com` | — Unwraps `?url=<url>` offline only, when the target is already encoded in the link. | — | [https://help.x.com/en/using-x/how-to-use-t-co](https://help.x.com/en/using-x/how-to-use-t-co) |
| **pinterest** | `pinterest.com`, `www.pinterest.com`, `pin.it` | `invite` | — | [https://help.pinterest.com/en/article/share-pins](https://help.pinterest.com/en/article/share-pins) |
| **snapchat** | `snapchat.com`, `www.snapchat.com` | `sender_web_id`, `share_id` | — | [https://help.snapchat.com/](https://help.snapchat.com/) |
| **telegram** | `t.me`, `telegram.me`, `telegram.org`, `www.telegram.org` | `ref` | `start` | [https://telegram.org/faq](https://telegram.org/faq) |
| **whatsapp** | `wa.me`, `api.whatsapp.com`, `whatsapp.com`, `www.whatsapp.com` | — | `text`, `phone` | [https://faq.whatsapp.com/](https://faq.whatsapp.com/) |
| **shein** | `shein.com`, `www.shein.com` | `src_identifier`, `src_module`, `src_tab_page_id`, `main_attr` | `goods_id` | [https://www.shein.com/](https://www.shein.com/) |
| **temu** | `temu.com`, `www.temu.com` | `_x_sessn_id`, `_x_ns`, `refer_page_name`, `refer_page_id`, `refer_page_sn` | `goods_id` | [https://www.temu.com/](https://www.temu.com/) |
| **quora** | `quora.com`, `www.quora.com` | `ch`, `oid`, `srid`, `target_type` | — | [https://www.quora.com/](https://www.quora.com/) |
| **notion** | `notion.so`, `www.notion.so`, `notion.site` | `pvs` | — | [https://www.notion.so/](https://www.notion.so/) |
| **etsy** | `etsy.com`, `www.etsy.com` | `click_key`, `click_sum`, `ref`, `frs`, `sts`, `ga_search_query`, `ga_search_type`, `ga_view_type`, `ga_ship_to`, `show_sold_out_detail`, `organic_search_click`, `logging_key` | `q` | [https://www.etsy.com/](https://www.etsy.com/) |
| **flipkart** | `flipkart.com`, `www.flipkart.com` | `affid`, `affExtParam1`, `affExtParam2`, `lid`, `otracker` | `pid`, `q` | [https://www.flipkart.com/](https://www.flipkart.com/) |
| **booking** | `booking.com`, `www.booking.com` | `aid`, `label`, `sid`, `srpvid` | `checkin`, `checkout`, `dest_id`, `dest_type`, `group_adults`, `group_children`, `no_rooms` | [https://www.booking.com/](https://www.booking.com/) |
| **imdb** | `imdb.com`, `www.imdb.com` | `ref_` | `q` | [https://bugzilla.mozilla.org/show_bug.cgi?id=1945449](https://bugzilla.mozilla.org/show_bug.cgi?id=1945449) |
| **app-store** | `apps.apple.com`, `itunes.apple.com`, `www.apps.apple.com` | `at`, `ct`, `pt` | `id`, `mt` | [https://apps.apple.com/](https://apps.apple.com/) |
| **steam** | `store.steampowered.com`, `steampowered.com`, `steamcommunity.com` | `snr` | `l` | [https://store.steampowered.com/](https://store.steampowered.com/) |
| **udemy** | `udemy.com`, `www.udemy.com` | `ranMID`, `ranEAID`, `ranSiteID`, `siteID` | `couponCode`, `q` | [https://www.udemy.com/](https://www.udemy.com/) |
| **bbc** | `bbc.com`, `www.bbc.com`, `bbc.co.uk`, `www.bbc.co.uk` | `at_medium`, `at_campaign`, `at_custom1`, `at_custom2`, `at_custom3`, `at_custom4`, `at_custom5`, `at_bbc_team`, `at_ptr_name` | — | [https://www.bbc.com/](https://www.bbc.com/) |
| **wikipedia** | `wikipedia.org`, `www.wikipedia.org`, `wikimedia.org`, `www.wikimedia.org`, `mediawiki.org`, `www.mediawiki.org` | `wprov` | `title`, `oldid`, `action`, `diff`, `redirect` | [https://wikitech.wikimedia.org/wiki/Provenance](https://wikitech.wikimedia.org/wiki/Provenance) |
| **kickstarter** | `kickstarter.com`, `www.kickstarter.com` | `ref` | — | [https://help.kickstarter.com/en-us/articles/16236548-how-do-i-create-a-custom-referral-tag-and-track-referral-stats](https://help.kickstarter.com/en-us/articles/16236548-how-do-i-create-a-custom-referral-tag-and-track-referral-stats) |
| **substack** | `substack.com`, `www.substack.com`, `open.substack.com` | `r` | — | [https://substack.com/](https://substack.com/) |
| **soundcloud** | `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` | `si` | — | [https://soundcloud.com/](https://soundcloud.com/) |

## Deliberate keeps (things we refuse to strip)

- **Quora** — `share` is never stripped: `?share=1` bypasses the login wall.
- **Flipkart** — `pid` stays (product identity); **Udemy** — `couponCode` stays (the discount).
- **YouTube** — `v`, `t`, `list` stay (the video itself); **Amazon** — `k` stays (your search).
- **Wikipedia** — `title`, `oldid`, `action`, `diff`, `redirect` stay (the page / revision).
- **Booking.com** — `checkin`, `checkout`, `dest_id`, `dest_type`, `group_adults`, `group_children`, `no_rooms` stay (the search itself).
- **Zoom was left out on purpose** — its `zak` parameter is an auth token; stripping it would break host links.
- **SoundCloud** — only `si` (the share id) is stripped; the track is in the path.
- **Kickstarter** — only `ref` (the referral tag) is stripped. A link that also carries `token` is left untouched by the signed-URL guard.

## How to add one

See [CONTRIBUTING.md](../CONTRIBUTING.md): one provider = one JSON rule in `data/rules.json` + 2 fixtures in `tests/fixtures.json`, then run both test suites. No code changes are needed for a new provider.

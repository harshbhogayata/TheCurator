# Web Desktop Design Spec

How the **website** becomes a real desktop product at ≥1024px while the **mobile web layout stays an exact mirror of the Expo app** below 1024px.

> Status: **Proposal — awaiting sign-off.** No code written yet.
> Owner: frontend. Related: `MOBILE_ARCHITECTURE.md`, `frontend/src/lib/layout.ts`.

---

## 1. The problem we are fixing

After the "foolproof" layout pass, every authenticated screen renders as a **680px column centered next to a 220px sidebar**. On a 1440px monitor that paints content into ~680px and leaves ~1,200px of empty `surface-container-low`. The result reads as *a phone running in the middle of a desktop monitor*, not a website.

The marketing/auth screens (`Welcome`, `SignIn`) already prove desktop is achievable — `Welcome` is a 2-column split at `max-w-screen-xl`. The goal is to make the in-app experience live up to that.

### Decision (locked)

- **Mobile (< 1024px): exact parity with Expo app.** One column, 680px cap, floating bottom tab bar, pill header. No change.
- **Desktop (≥ 1024px): a true website.** Editorial grids, a masthead, a magazine article page, grid-native cards. Web and mobile **intentionally diverge** above 1024px.

This supersedes the "single 680px column everywhere" rule from the previous pass. The 680px column is retained **only** as the mobile collapse target and as the reading measure inside the article/brief pages.

---

## 2. Principles

1. **Same data, same tokens, same palette — different composition.** No new colors, no new fonts. We add *layout* primitives and *card variants*, not a new design language.
2. **One breakpoint that matters: `lg` = 1024px.** Below it, mobile. At/above it, desktop. Avoid a ladder of fragile breakpoints; use fluid grids (`auto-fill` / `minmax`) so content reflows without per-width rules.
3. **Content type dictates width, not the page.** Feeds get wide grids; reading gets a narrow measure; forms get a medium column. Pages declare *which archetype* they are, never raw widths.
4. **Cards are built for their context.** A full-bleed hero is for one featured slot or a phone; grids use a card designed for grids.
5. **Desktop affordances are mandatory.** Hover states, a global search in the masthead, visible "where am I."

---

## 3. Layout archetypes

Replace the single `ScreenContent` with three archetype wrappers. Each collapses to the existing mobile column below `lg`.

| Archetype | Desktop max width | Inner behavior | Used by |
|-----------|-------------------|----------------|---------|
| `FeedLayout` | **1200px** | Editorial grid region(s) | Explore, Saved, Collections, Search, Reading Stats |
| `ReadLayout` | **1120px canvas / 720px text measure** | Hero can go full canvas width; body text capped at 720px and centered | Article, CollectionDetail header, Brief featured |
| `FormLayout` | **760px** | Single centered column | Settings, Account, Profile, About, Help, Privacy, Donate, Menu, LanguageRegion, ConnectedAccounts, DataExport |

**Mobile collapse:** all three render as the current single column — `width:100%`, `max-width:680px`, `contentPadding` (14/20/32 by breakpoint from `layout.ts`), centered. So phones are untouched.

### Width math (sanity check, 1440px viewport)

```
1440 viewport − 220 sidebar = 1220 usable
FeedLayout content = 1200 (with ~16px breathing room each side)  ✅ fills the canvas
ReadLayout canvas  = 1120, text measure 720 centered            ✅ magazine feel
FormLayout         = 760                                          ✅ forms shouldn't be wide
```

---

## 4. The card system

Today `ArticleCard` has `default`, `featured`, `compact` — all using the full-bleed hero (`shape.imageHero`, fixed `h-[300px]`, title overlaid). We **add one variant** and reserve the hero for the featured slot.

| Variant | Image | Title | Radius | Height | Use |
|---------|-------|-------|--------|--------|-----|
| `featured` (existing) | full-bleed hero, title overlaid | over image | `shape.imageHero` (80/40/100/60) | tall (~420px desktop) | 1 per feed, hero slot |
| `default` (existing) | full-bleed hero, title overlaid | over image | `shape.imageHero` | `h-[300px]` | **mobile feed only** |
| **`grid` (new)** | **image on top, fixed 16:9** | **below image, in flow** | **`radius.lg` = 20px** | auto (image 16:9 + text) | **desktop grids** |
| `compact` (existing) | left thumbnail | right of thumb | `shape.imageCard` | small row | search results, dense lists |

### `grid` card spec

```
┌─────────────────────────┐
│                         │
│   image  (aspect 16:9)  │   object-cover, radius.lg, subtle border
│                         │
├─────────────────────────┤
│ CATEGORY · readTime     │   overline, text-outline
│ Title two lines max      │   font-headline, text-xl, clamp-2
│ Excerpt two lines        │   text-on-surface-variant, clamp-2  (optional)
│ ◔ source dots   🔖 save  │   meta row
└─────────────────────────┘
hover: lift (translateY -2px) + shadow grow + title → primary
```

- No organic asymmetric corners on `grid` cards — they tile poorly. Use the clean `radius.lg`.
- Save button moves to the meta row (no overlay needed when the image isn't the whole card).
- Mobile never uses `grid`; it stays on `default`/`featured`/`compact`.

---

## 5. Editorial grid (Explore / feeds)

```
DESKTOP (≥1024)
┌───────────────────────────────────────┬──────────────────┐
│                                       │  secondary card  │
│        FEATURED  (hero variant)        │  (grid variant)  │
│        spans 2 rows                     ├──────────────────┤
│                                       │  secondary card  │
├──────────────┬──────────────┬─────────┴──────────────────┤
│  grid card   │  grid card   │  grid card   │  grid card   │
│  grid card   │  grid card   │  grid card   │  grid card   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Top region: `grid-template-columns: 2fr 1fr`; featured on the left, two secondary `grid` cards stacked on the right.
- Story region: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px`. Fluid — no breakpoint maintenance.
- Category filters: on desktop render as a **wrapping chip rail** (not horizontal scroll), full width above the story region. (Phase 2 option: left sub-rail.)
- Ad slots: `AdBanner position="inline"` becomes a full-width band between the featured region and the grid.

**Mobile:** unchanged — featured + vertical `FeedStack` of `default` cards.

---

## 6. Masthead (desktop only)

A slim top bar **inside the content area** (not over the sidebar). Single biggest "this is a website" signal; currently missing.

```
┌──────────────────────────────────────────────────────────────┐
│  Page Title (font-headline)   [ 🔍 search… ]      ☾  ⓘ  avatar │
└──────────────────────────────────────────────────────────────┘
```

- Left: current page title (`text-2xl` headline italic).
- Center/stretch: global search input → routes to `/search?q=`.
- Right: theme toggle, subscription badge, account menu (avatar → dropdown: Account, Settings, Sign out).
- Sticky to top, `backdrop-blur`, `border-b border-outline-variant/10`.
- Hidden < 1024px (mobile keeps the pill header).

---

## 7. Article page → magazine (`ReadLayout`)

`Article.tsx` is already the best-designed desktop page but is currently **broken**: the 680px contract squashes its `max-w-4xl`, and the sticky toolbar pins to `top-16`/`lg:top-20` (a header that no longer exists on desktop).

Target:

- Opt out of feed width; use `ReadLayout` (1120 canvas).
- **Hero image** spans the full 1120 canvas (or breaks out slightly), `height: clamp(320px, 45vw, 560px)`, not a fixed `60vh`.
- **Headline** `text-5xl → text-7xl` centered or left over a ~900px block.
- **Body** capped at **720px** measure, centered, drop-cap retained, `reading width` preference still respected (narrow 640 / normal 720 / wide 900).
- **Toolbar**: sticky to the masthead bottom (recompute offset from masthead height, not the dead `top-16`). On mobile keep the floating pill toolbar.
- **Related narratives**: keep the alternating image-left/image-right editorial layout — it already looks great wide.

---

## 8. Per-page plan

| Page | Archetype | Desktop layout | Priority |
|------|-----------|----------------|----------|
| Explore | `FeedLayout` | featured + auto-fill grid, wrapping filters | **P0** |
| Article | `ReadLayout` | magazine spread, fix toolbar offset | **P0** |
| (AppShell) | — | add masthead | **P0** |
| Saved | `FeedLayout` | usage banner full-width, `grid` cards | P1 |
| Collections | `FeedLayout` | `grid` of collection cards (2–3 col) | P1 |
| CollectionDetail | `FeedLayout` + `ReadLayout` header | collection header band + `grid` cards | P1 |
| Search | `FeedLayout` | results grid + persistent left filter rail | P1 |
| Brief | `FeedLayout` | featured player left, 2-col brief list right, quote band | P1 |
| Reading Stats | `FeedLayout` | stat cards 4-up, charts wide | P1 |
| Settings | `FormLayout` | unchanged (already fine) | P2 |
| Account / Profile / Menu | `FormLayout` | unchanged | P2 |
| Donate | `FormLayout` (plans 3-up) | plan cards in a row | P2 |
| About / Help / Privacy / LanguageRegion / ConnectedAccounts / DataExport | `FormLayout` | unchanged | P2 |
| Welcome / SignIn / Onboarding | n/a (no AppShell) | already desktop-grade — leave | — |

---

## 9. Files & components

**New**
- `frontend/src/ui/layouts/feed-layout.tsx` — `FeedLayout` wrapper (replaces `ScreenContent` for feeds).
- `frontend/src/ui/layouts/read-layout.tsx` — `ReadLayout` (canvas + measure).
- `frontend/src/ui/layouts/form-layout.tsx` — `FormLayout`.
- `frontend/src/ui/editorial-grid.tsx` — featured + auto-fill story grid.
- `frontend/src/ui/masthead.tsx` — desktop top bar.
- `ArticleCard` `grid` variant (extend existing component, not a new file).

**Changed**
- `frontend/src/app/components/AppShell.tsx` — accept `archetype` prop, render masthead on desktop, route children through the chosen layout. Keep mobile path identical.
- `frontend/src/lib/layout.ts` — add `FEED_MAX_WIDTH=1200`, `READ_CANVAS_WIDTH=1120`, `READ_MEASURE=720`, `FORM_MAX_WIDTH=760`; keep `MAX_CONTENT_WIDTH=680` as the mobile collapse + reading fallback.
- `frontend/src/ui/feed-stack.tsx` — gains a `grid` mode (CSS grid auto-fill) used only at ≥lg; stays flex column on mobile.
- Each page swaps `<AppShell>` body to declare its archetype and (for feeds) use `EditorialGrid` / `FeedStack grid`.

**Unchanged / preserved**
- `ScreenContent` stays for backward-compat during migration, then is removed.
- `BottomNav`, mobile header, `DevModeBanner`, tokens, contexts, hooks, services.

### `AppShell` API after change

```tsx
<AppShell title="Explore" archetype="feed">…</AppShell>
<AppShell title={article.title} archetype="read" showHeader={false}>…</AppShell>
<AppShell title="Settings" archetype="form">…</AppShell>
```

Default `archetype="form"` (safe narrow column) so any un-migrated page never stretches badly.

---

## 10. Token additions (`layout.ts`)

```ts
export const FEED_MAX_WIDTH = 1200;
export const READ_CANVAS_WIDTH = 1120;
export const READ_MEASURE = 720;
export const FORM_MAX_WIDTH = 760;
export const MASTHEAD_HEIGHT = 64;
// existing: MAX_CONTENT_WIDTH=680 (mobile collapse), WEB_DESKTOP_BREAKPOINT=1024,
//           WEB_SIDEBAR_WIDTH=220, TAB_BAR_MAX_WIDTH=420
```

Desktop typography bumps (Tailwind utility targets, applied only at `lg:`):
- Section titles `lg:text-3xl`
- Card grid titles `text-xl`
- Body/excerpt `lg:text-lg`
- Generous `leading` on reading content (already present in Article).

---

## 11. Breakpoint behavior

| Element | < 1024px (mobile parity) | ≥ 1024px (desktop) |
|---------|--------------------------|--------------------|
| Nav | floating bottom tab bar | left sidebar |
| Header | pill header (menu/title/avatar) | masthead (title/search/account) |
| Feed | `FeedStack` column, `default` cards, 680px | `EditorialGrid`, `grid` cards, 1200px |
| Article | 680px column, floating toolbar | 1120 canvas, 720 measure, sticky toolbar |
| Forms | 680px column | 760px column |
| Filters | horizontal scroll chips | wrapping rail |

---

## 12. Acceptance criteria

- **Explore (desktop):** featured hero + ≥2 secondary + a fluid grid that fills to 1200px; no empty letterbox cards; filters wrap; cards lift on hover.
- **Article (desktop):** hero spans canvas; body reads at 720px; toolbar sticks correctly under masthead; no reference to a non-existent header offset.
- **Masthead:** search routes to `/search`; account dropdown works; hidden on mobile.
- **Mobile (every page):** pixel-identical to current behavior (bottom nav, pill header, 680 column). Verified at 390px and 768px.
- **No regressions:** `npm run build` passes; dark mode checked at 1440px; no horizontal scroll at 1024/1280/1440.
- **Cards:** `grid` variant never used below `lg`; `default`/`featured` never tiled in a multi-column grid.

---

## 13. Phasing

**P0 — "it's a website"**
1. Add layout tokens + the three archetype wrappers + `archetype` prop on `AppShell`.
2. `grid` card variant + `EditorialGrid`.
3. Masthead.
4. Migrate **Explore** and **Article**.
5. Build, visual QA at 1024/1280/1440 + mobile.

**P1 — consistency**
6. Saved, Collections, CollectionDetail, Search (filter rail), Brief, Reading Stats.

**P2 — finish**
7. `FormLayout` across settings-family (mostly already correct).
8. Empty/loading states sized for the wide canvas; dark-mode polish; remove `ScreenContent`.

---

## 14. Risks & notes

- **Divergence cost:** web and mobile now differ above 1024px — the layout *contract* still guarantees mobile parity, but the "one source of truth for composition" is gone by design. Tokens/cards remain shared.
- **`auto-fill` minmax** keeps the grid maintainable; resist adding `sm:/md:/xl:` column counts.
- **Image assets:** `grid` cards use 16:9; verify `ImageWithFallback` query images don't look cropped awkwardly.
- **`Article` reading-width preference** must still win over the 720 default.
```

# The Curator · Matches — Final Plan

**Isolated Expo app** · Dark sports broadcast UI · Phased ships A → B → C  
**Not** the warm editorial paper of the news Curator app.

---

## 1. Vision

**One line:** The live sports desk — scores, briefs, and watch context in a dark broadcast environment.

**Bundle:** `com.curator.matches` (separate from `com.curator.app`)

**Design soul:** Stadium night · broadcast graphics · tabular scores — **not** magazine / paper / cream palette.

**Shared with news Curator:** RevenueCat account, optional SSO later, subscription tier names (Free / Basic / Premium / Lifetime).  
**Not shared:** theme, typography role, article stack, audio mini-player.

---

## 2. Visual system — Dark sports (locked)

### Palette

| Token | Value | Use |
|-------|-------|-----|
| `background` | `#080a0f` | App base |
| `surface` | `#10141c` | Cards |
| `surfaceElevated` | `#181d28` | Hero broadcast card |
| `surfaceGlass` | `rgba(16, 20, 28, 0.82)` | Pill header / tab bar blur |
| `onSurface` | `#eef0f4` | Primary text |
| `onSurfaceMuted` | `#8b92a3` | Meta, labels |
| `outline` | `rgba(139, 146, 163, 0.22)` | Borders |
| `accent` | `#3dff9a` | LIVE, active tab, key CTAs (broadcast green) |
| `accentMuted` | `rgba(61, 255, 154, 0.18)` | LIVE chip bg |
| `gold` | `#c8bfa6` | Premium badge only (subscription parity) |
| `live` | `#ff4d4d` | Live dot pulse |
| `score` | `#ffffff` | Score numerals (tabular) |

### Typography

| Role | Font | Style |
|------|------|--------|
| Display / competition | Manrope 700 | Tight tracking, caps for labels |
| Scores | Manrope 800 / tabular nums | Large, center-aligned on cards |
| Status | Manrope 600 | “2ND HALF · 67′” |
| Editorial brief lines | Manrope 500 | Short lines only — not Newsreader italic |

### Shape

- Pills: `borderRadius 999` (header, tabs, chips)
- Cards: `16–20px` radius (tighter than news app organic shapes)
- Hero broadcast: subtle **top-edge stadium wash** (radial green at 6% opacity), not cream wash

### Chrome

- Floating **dark glass** pill header + tab bar (blur, 2px outline)
- Active tab: **accent fill** on dark (not gray primary)
- Sport chips: dark elevated pills; selected = accent border

---

## 3. Navigation (4 tabs)

| Tab | Header title | Purpose |
|-----|--------------|---------|
| **Live** | The Desk | On air now, watchlist strip, live groups |
| **Competitions** | Competitions | Edition catalog, featured hubs |
| **Agenda** | Your day | Today timeline, TZ-aware |
| **Watchlist** | Watchlist | Pins, teams, alerts |

**Header (all tabs):** `[☰]` · title pill · `[Region ▾]` · `[⌕]`  
**Sport rail:** Live + Competitions only  
**Menu modal:** Notifications, region, subscription, data sources, open news Curator app

---

## 4. Onboarding — “Build your desk” (5 screens)

| Step | Screen | Content |
|------|--------|---------|
| 0 | **Welcome** | Dark hero, logo mark, “Your live sports desk” |
| 1 | **Region** | Global · United States · United Kingdom · India + timezone auto |
| 2 | **Sports** | Multi-select chips: Football, Cricket, US Sports, Tennis, Esports |
| 3 | **Competitions** | Pick up to 3 pins (VCT, EWC, WC, IPL, EPL search) |
| 4 | **Alerts** | Optional kickoff alerts (Basic+ gate later) |
| 5 | **Complete** | “Desk ready” → Live tab |

Stored: `matches.onboarding.complete`, `matches.desk.region`, `matches.desk.sports[]`, `matches.desk.pins[]`

---

## 5. Screen inventory

### Tab roots
- `live` — Desk sections: On Air hero, Your Watchlist, Live Now, Starting Soon
- `competitions` — Pinned, On Air comps, Featured editions, By sport
- `agenda` — Day/Week toggle, hour blocks
- `watchlist` — All · Competitions · Teams · Alerts

### Stack pushes
- `tournament/[id]` — Dynamic segments: Edition · Scores · Table · Bracket · Brief · Watch
- `match/[id]` — Match centre + timeline + Watch sheet
- `search` — Tournaments + teams
- `menu` — Modal
- `settings` — Modal
- `subscription` — Modal (Curator tier cards, dark skin)

### Ship B
- `brief/[id]` — Sport brief reader
- Desk brief strip on Live

### Ship C
- `cinema` — Full-screen player + mini player
- Watch sheet (in-app / external broadcaster)

---

## 6. Core components (quality gate)

| Component | Ship |
|-----------|------|
| `MatchesHeader` | A |
| `FloatingTabBar` | A |
| `SportRail` | A |
| `BroadcastCard` | A |
| `MatchRow` | A |
| `EditionCover` | A |
| `BracketSpread` | A |
| `DeskBriefStrip` | B |
| `VideoPlayer` + `MiniPlayer` | C |
| `WatchSheet` | A (links) / C (streams) |

---

## 7. Subscription (Curator-aligned)

| Tier | Matches |
|------|---------|
| Free | 3 pins, 60s refresh, ads, watch sheet, brief snippets |
| Basic | Ad-free, 10 pins, 3 teams, kickoff alerts |
| Premium | Unlimited, 15s refresh, all alerts, audio brief, PiP |
| Lifetime | = Premium |
| Curator Premium/Lifetime | **Unlock Matches Premium** |

Never paywall raw score or where-to-watch links.

---

## 8. Data & video (phased)

### Ship A — Seed + watch guides
- Seed data service (VCT, EWC, WC, IPL, EPL fixtures)
- Watch sheet: US / UK / India broadcaster links (editorial)

### Ship B — APIs
- Football/WC: API-Football or Sportmonks
- Cricket: Roanuz or Sportmonks
- Esports: PandaScore / manual VCT

### Ship C — Video
- Mux: own recaps
- WSC BlazeFeed: moments
- Genius/Stats Perform: full live (enterprise)

---

## 9. Ship milestones

### Ship A — Desk (weeks 1–4)
- [ ] Dark theme + fonts + pill chrome
- [ ] Onboarding 5 steps
- [ ] 4 tabs + menu
- [ ] BroadcastCard + MatchRow
- [ ] 2 edition hubs (VCT, WC) seed
- [ ] Match centre + Watch sheet
- [ ] Onboarding → Live personalization

**Exit:** Screenshots look broadcast-grade; no cream/paper anywhere.

### Ship B — Brief (weeks 5–7)
- [ ] Desk brief on Live
- [ ] Edition Brief segment
- [ ] Reader screen
- [ ] Subscription gating

### Ship C — Cinema (weeks 8–10)
- [ ] Video player + mini player
- [ ] Moments rail
- [ ] Premium video entitlements

---

## 10. Repo layout

```
curator-matches/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (onboarding)/
│   └── (main)/
│       ├── (tabs)/
│       ├── tournament/[id].tsx
│       ├── match/[id].tsx
│       └── menu.tsx
└── src/
    ├── theme/          # dark sports tokens
    ├── ui/             # header, tab bar, screen
    ├── desk/
    ├── edition/
    ├── onboarding/
    └── data/seed/
```

---

## 11. Legal footer (in menu)

- Scores may be delayed
- Not affiliated with FIFA, leagues, etc.
- Data provider attribution

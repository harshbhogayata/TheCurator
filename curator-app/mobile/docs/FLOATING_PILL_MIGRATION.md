# Mobile UX plan — floating pills & settings cleanup

Two tracks in one doc. **Do not implement until you pick an item** and test the prior one.

1. **Floating pills** — bottom CTAs → donate-style float (`#3` done, start testing at `#4`)
2. **Settings cleanup** — remove redundant rows already reachable via tabs / menu / profile (`#S1`, planned only)

**Status:** Planning — floating pills start at **#4**; settings cleanup at **#S1** when you’re ready.

---

## Rules (do not break these)

1. **No coupling to audio mini player** — `audio-mini-player.tsx` stays independent. Never import it or mirror its interior (progress strip, play circle, wave, etc.).
2. **One screen → one pill module** — each surface gets its own file + `*_PILL_LAYOUT` constants (copy the pattern from donate; do not share a generic “smart” component that couples screens).
3. **Hardcoded geometry, themed colors** — inset, height, radius, shadow, and type sizes live in that screen’s `*_PILL_LAYOUT`. Only `palette.*` comes from theme (light/dark).
4. **Single press target** — the whole pill is one `Pressable`; no nested icon buttons fighting text for width.
5. **Scroll clearance** — each screen exports `get*ScrollPadding(bottomInset)` so content is not hidden under the float.
6. **Ship one item at a time** — EAS update after each; manual test on device before checking the box below.

---

## Reference (done)

| # | Screen | File | Component / constants |
|---|--------|------|------------------------|
| 3 | Support Us | `app/(app)/donate.tsx` | `src/ui/donate-subscribe-pill.tsx` → `DONATE_SUBSCRIBE_PILL_LAYOUT` |

**Baseline geometry** (copy when creating new pills; tweak per screen if needed):

```ts
horizontalInset: 16
bottomInsetMin: 24
safeBottomPadding: 16
pillHeight: 64
borderRadius: 999
paddingHorizontal: 20
paddingVertical: 12
scrollTailGap: 20
titleFontSize: 15 / lineHeight 19
subtitleFontSize: 12 / lineHeight 16
shadow: offsetY 8, radius 24, opacity 0.16, elevation 12
maxWidth: 420
```

---

## Already floating (do not migrate)

| Surface | File | Notes |
|---------|------|--------|
| Tab bar | `app/(app)/(tabs)/_layout.tsx` | `FloatingTabBar` — different role (nav) |
| Audio mini player | `src/ui/audio-mini-player.tsx` | Playback controls — **leave alone** |

---

## Migration backlog (#4 → end)

### Phase 1 — Auth (test first)

| # | Screen | File(s) | Current | Target pill | New module (proposed) | Test ID(s) |
|---|--------|---------|---------|-------------|------------------------|------------|
| 4 | Sign in | `app/(auth)/sign-in.tsx` | Sticky footer bar + border-top; `PrimaryButton` ×2 | Float **Sign in** pill; secondary “Create account” as ghost text above pill or second smaller pill | `src/ui/auth-sign-in-pill.tsx` | `auth-sign-in` (keep) |
| 5 | Sign up | `app/(auth)/sign-up.tsx` | Same sticky footer | Float **Create account** pill; “Sign in instead” link above | `src/ui/auth-sign-up-pill.tsx` | existing sign-up testIDs |
| 6 | Welcome | `app/(auth)/welcome.tsx` | Bottom `ctaSection`, full-width buttons in layout | Float **Get started** pill; secondary account link outside pill | `src/ui/welcome-cta-pill.tsx` | `welcome-get-started` |

**Phase 1 manual tests**

- [ ] #4 Light + dark: keyboard open — pill stays above keyboard / not clipped
- [ ] #4 Tap Sign in — submits; loading state on pill
- [ ] #5 Create account flow; validation errors don’t cover pill
- [ ] #6 Get started → sign-up; sign-in link works
- [ ] Small phone (narrow width): long labels shrink (`adjustsFontSizeToFit`), no overlap
- [ ] Scroll content never hidden under pill

---

### Phase 2 — Monetization

| # | Screen | File(s) | Current | Target | New module (proposed) |
|---|--------|---------|---------|--------|------------------------|
| 7 | Settings membership | `app/(app)/settings.tsx` | Inline `membershipButton` in card | Optional: float **Manage plan** — *after* **#S1** cleanup so screen is slimmer | `src/ui/settings-membership-pill.tsx` OR in-card restyle |
| 8 | Paywall sheet | `src/ui/paywall-modal.tsx` | Sheet bottom `primaryButton` | Float **Upgrade now** inside sheet (absolute bottom of sheet, not screen) | `src/ui/paywall-upgrade-pill.tsx` |
| 12 | Ad upgrade | `src/ui/ad-banner.tsx` | Inline feed/top Upgrade chips | Keep inline for feed; optional float only on dedicated upgrade moments | defer / case-by-case |

**Phase 2 manual tests**

- [ ] #7 Free vs paid copy on pill; navigates to Support Us
- [ ] #8 Paywall from brief audio + article audio; Upgrade → donate; Not now dismisses
- [ ] #12 Feed ad Upgrade still tappable; no double pills with tab bar

---

### Phase 3 — Modals & sheets

| # | Screen | File(s) | Current | Target | New module (proposed) |
|---|--------|---------|---------|--------|------------------------|
| 9 | Add to collection | `src/ui/add-to-collection-modal.tsx` | `BottomSheetFooter` Add / Cancel | Float **Add** pill + text Cancel above | `src/ui/add-collection-pill.tsx` |
| 13 | Confirm dialog | `src/ui/confirm-dialog.tsx` | Modal action row | Primary float pill for confirm; destructive variant constant | `src/ui/confirm-dialog-pill.tsx` |
| 14 | Collections create | `app/(app)/collections.tsx` | Sheet submit buttons | Float **Create collection** in sheet | `src/ui/collection-create-pill.tsx` |
| 15 | Collection detail | `app/(app)/collection/[id].tsx` | Edit/save in sheet | Float **Save** in edit sheet | `src/ui/collection-save-pill.tsx` |

**Phase 3 manual tests**

- [ ] #9 Select articles → Add enabled; empty selection disabled
- [ ] #13 Confirm / cancel flows (delete collection, etc.)
- [ ] #14–15 Create + edit collection end-to-end

---

### Phase 4 — Onboarding & utility

| # | Screen | File(s) | Current | Target | New module (proposed) |
|---|--------|---------|---------|--------|------------------------|
| 10 | Onboarding | `src/onboarding/components.tsx` | Bottom row Back / Skip / Continue | Float **Continue**; Back/Skip stay as top/side chips | `src/ui/onboarding-continue-pill.tsx` |
| 11 | Data export | `app/(app)/data-export.tsx` | Full-width `requestButton` in scroll | Float **Request export** | `src/ui/data-export-pill.tsx` |
| 16 | Error state | `src/ui/error-state.tsx` | Inline retry pill | Optional float **Try again** when used full-screen | `src/ui/error-retry-pill.tsx` |
| 17 | Help | `app/(app)/help.tsx` | Support/contact pills in scroll | Float **Contact support** if primary action | `src/ui/help-contact-pill.tsx` |

**Phase 4 manual tests**

- [ ] #10 Each onboarding step: Continue disabled/enabled correctly
- [ ] #11 Export request + list scroll clearance
- [ ] #16 Briefs/Explore error retry
- [ ] #17 Help mailto / link opens

---

### Phase 5 — Evaluate (probably no float)

| # | Item | File | Recommendation |
|---|------|------|----------------|
| 18 | `PrimaryButton` | `src/ui/primary-button.tsx` | Keep for **in-scroll** actions. Do not force float. New floats use dedicated `*-pill.tsx` files. |
| — | Menu sign out | `app/(app)/menu.tsx` | List row — no float |
| — | Profile / article | `profile.tsx`, `article/[id].tsx` | In-content actions — no float |

---

## Implementation checklist (per item)

When picking up #N:

1. [ ] Create `src/ui/<screen>-pill.tsx` with `*_PILL_LAYOUT` + `get*ScrollPadding`
2. [ ] Replace old footer/button in screen file only
3. [ ] Remove dead styles (sticky footer, old button styles)
4. [ ] Add / keep `testID` on pill
5. [ ] `npx tsc --noEmit` in `curator-app/mobile`
6. [ ] `eas update --channel preview` (or your test channel)
7. [ ] Run manual tests for that # in the table above
8. [ ] Check box in this doc + note commit hash

---

## Progress log

| # | Done | Commit | Tested by | Notes |
|---|------|--------|-----------|-------|
| 3 | ✅ | `ad56f80` | | Donate subscribe — isolated |
| 4 | ⬜ | | | |
| 5 | ⬜ | | | |
| 6 | ⬜ | | | |
| 7 | ⬜ | | | |
| 8 | ⬜ | | | |
| 9 | ⬜ | | | |
| 10 | ⬜ | | | |
| 11 | ⬜ | | | |
| 12 | ⬜ | | | |
| 13 | ⬜ | | | |
| 14 | ⬜ | | | |
| 15 | ⬜ | | | |
| 16 | ⬜ | | | |
| 17 | ⬜ | | | |
| S1 | ⬜ | | | Settings Account section removal |
| M1 | ⬜ | | | Optional menu nav dedup |

---

## Settings screen cleanup (planned — do not ship yet)

**Goal:** Settings should be **preferences only**, not a second app menu. Navigation to Brief / Explore / Search / Saved / Collections / Profile / Support is already one tap away (tabs, header avatar, hamburger menu).

**File:** `app/(app)/settings.tsx`

### Remove (redundant — already elsewhere)

| ID | Row / section | Why redundant | Reachable via |
|----|----------------|---------------|---------------|
| S1a | **Account** → Profile & Account | Duplicate profile entry | Menu → Profile; header avatar → Profile; Profile → account actions |
| S1b | **Account** → Connected Accounts | Duplicate | Profile → Connected Accounts (`profile.tsx` `profileActions`) |
| S1c | **Account** → Support The Curator | Duplicate | Membership card CTA (same screen); Menu → Support Us |
| S1d | **Account** section heading | Empty after removals | — |

*Optional later (menu dedup, not settings):* Menu still lists Daily Briefs, Explore, Search, Saved, Collections, Profile — same as tab bar + profile. Track as **#M1** if you want a slimmer menu in a follow-up.*

### Keep (real settings)

| Section | Items |
|---------|--------|
| Membership card | Tier badge + single CTA → donate (only monetization entry on this screen) |
| Alerts & Delivery | Notification cadence, push toggle, email digest |
| Reading & Experience | Text size, auto-save, reduce motion, topics & interests |
| Appearance | Theme (light / dark / auto), Language & Region |
| Sign out | Destructive action at bottom |

### Implementation notes (when you do #S1)

1. Delete the whole **Account** `SectionHeading` + `sectionStack` block (three `ActionRow`s).
2. Remove unused imports: `User`, `Heart`, `Link2` if nothing else uses them.
3. Do **not** remove membership card — it replaces the duplicate Support row.
4. Confirm Profile still links to Account / Connected Accounts / Donate (`profile.tsx`).
5. Update help copy if it says “cancel from Settings” only — still true for preferences; subscription management is Profile / Support Us.

### #S1 manual tests

- [ ] Settings opens — no Account section; no broken layout gaps
- [ ] Profile → Connected Accounts still works
- [ ] Profile / menu → Support Us still works
- [ ] Membership card CTA still opens donate
- [ ] All preference toggles still save (theme, notifications, text size, topics)
- [ ] Sign out still works

### Settings progress log

| ID | Done | Commit | Notes |
|----|------|--------|-------|
| S1 | ⬜ | | Remove redundant Account rows (S1a–S1d) |
| M1 | ⬜ | | Optional: slim down `menu.tsx` duplicate nav items |

**When ready:** say **“do #S1 settings cleanup”** — only `settings.tsx`, no pill work in the same PR.

---

## Z-index / stacking notes

- Floating pills: `zIndex: 40`
- Header: `zIndex: 50`
- Tab bar: `zIndex: 50`
- On tab screens, float bottom = `max(insets.bottom + 16, 24)` — same as donate
- On **modal screens** (donate, auth), no tab bar — pill can sit lower
- If audio mini player + float pill ever coexist, audio wins playback context; monetization screens should not show both

---

## When you’re ready

| Say | Action |
|-----|--------|
| **“do #4 sign in pill”** | `sign-in.tsx` + `auth-sign-in-pill.tsx` only |
| **“do #S1 settings cleanup”** | Remove redundant Account rows in `settings.tsx` only |

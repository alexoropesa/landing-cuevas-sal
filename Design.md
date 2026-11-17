# Design.md — Halita · Cueva de Sal

> Single source of truth for the visual system. Every page (`index.htm`, `admin.htm`) and every future section **must** consume these tokens. Tokens live in code at [`css/tokens.css`](css/tokens.css); this file documents them. If you add a token in code, add it here in the same commit.

**Provenance.** Typography, spacing, radii, shadow structure and component treatment were extracted from the raw CSS of the aesthetic reference (clireo.framer.website). **The colour palette was replaced on 2026-11-17 at the client's request** with "Sal y brasa", a warm mineral palette sampled from the cave photography (see `DECISIONS.md` §11). Structure and flows come from Mobbin references (see `DECISIONS.md` §2). Values that are not in the reference are marked `★ added`, with the reason.

---

## 1. Design Principles

1. **Mineral warmth.** Every surface is a tone of salt, sand or cave rock, so the UI and the photography read as one scene. There are no cool blues or greys.
2. **One voice of ink.** All text is a shade of umber (`--text-*`). There is no pure black text anywhere.
3. **Regular weight, tight tracking.** Headlines are weight 400 with negative letter-spacing (-0.035em → -0.06em). Hierarchy comes from size and tracking, not boldness. Weight 500 is reserved for buttons, labels and numbers.
4. **Hairlines, not boxes.** Separation is done with 1px hairlines (`--border-hairline`) and soft umber-tinted layered shadows, never with heavy borders.
5. **Rounded, not bubbly.** Radii run 8 → 24px. Pills (30px) are only for buttons, chips and badges.
6. **Photography carries emotion; UI carries information.** Never put text inside images. Text over a photo sits on a scrim token.
7. **Consistency over novelty.** Reuse an existing component variant before creating a new one. New variants must be documented here.

---

## 2. Color Tokens — palette "Sal y brasa"

### 2.1 Primitive palette (sampled from the cave photography)

| Primitive | Value | Source in the images |
|---|---|---|
| `rock-950` | `#24160F` | cave rock in deep shadow |
| `rock-900` | `#2A1A12` | strongest ink |
| `rock-800` | `#3A2419` | shadowed salt rock: inverse surface, primary button |
| `rock-700` | `#4A3226` | body ink |
| `salt-50` | `#F7F1EA` | white salt floor: page canvas |
| `salt-0` | `#FFFDFA` | cards |
| `sand-100` | `#EFE5DA` | salt dune: subtle surface, input fill |
| `rose-200` | `#F3D9C4` | pink salt brick: tint, selection |
| `amber-400` | `#E8A06A` | backlit brick glow: highlight badge, dots |
| `amber-500` | `#D98B3A` | lamp light: rating stars |
| `terracotta-600` | `#B5603A` | brick mortar: links, focus ring |
| `sage-600` / `sage-50` / `sage-100` | `#5E7A5C` / `#EEF2EA` / `#DCE5D6` | success ★ (a warm green that fits the palette) |
| `red-600` / `red-50` ★ | `#C8323F` / `#FDF0F1` | error |

### 2.2 Semantic tokens

| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | `#F7F1EA` | page background |
| `--bg-surface` | `#FFFDFA` | cards, modals, header |
| `--bg-subtle` | `#EFE5DA` | section bands, input fill, table header, hover fill |
| `--bg-tint` | `#F3D9C4` | selected chip/slot background, accent wash |
| `--bg-inverse` | `#3A2419` | dark sections, popular plan, gift band |
| `--bg-inverse-deep` | `#24160F` | manifesto, footer, promo strip, toasts |
| `--bg-inverse-raised` | `rgba(255,255,255,0.08)` | cards on inverse sections |
| `--bg-scrim` | `rgba(36,22,15,0.45)` | modal backdrop |
| `--bg-image-scrim` | `linear-gradient(180deg, rgba(36,22,15,0) 35%, rgba(36,22,15,0.72) 100%)` | text over photos |
| `--text-strong` | `#2A1A12` | headings |
| `--text-default` | `#4A3226` | body |
| `--text-muted` | `rgba(42,26,18,0.64)` | secondary copy, helper text |
| `--text-subtle` | `rgba(42,26,18,0.46)` | captions, placeholders |
| `--text-disabled` | `rgba(42,26,18,0.30)` | disabled |
| `--text-on-inverse` | `#FFFFFF` | text on umber |
| `--text-on-inverse-muted` | `rgba(255,255,255,0.72)` | secondary text on umber |
| `--border-hairline` | `rgba(58,36,25,0.09)` | default card / divider |
| `--border-default` | `rgba(58,36,25,0.16)` | inputs, outlined buttons |
| `--border-strong` | `#3A2419` | selected outline |
| `--border-inverse` | `rgba(255,255,255,0.12)` | dividers on umber |
| `--accent` / `--accent-hover` | `#3A2419` / `#24160F` | primary action |
| `--accent-link` | `#B5603A` | inline links, focus ring base |
| `--accent-highlight` | `#E8A06A` | "Más popular" badge, eyebrow dot, ticker dots |
| `--rating` | `#D98B3A` | stars |
| `--success` / `--success-bg` / `--success-border` | `#5E7A5C` / `#EEF2EA` / `#DCE5D6` | success states |
| `--danger` / `--danger-bg` | `#C8323F` / `#FDF0F1` | errors |
| `--focus-ring` | `0 0 0 3px rgba(181,96,58,0.35)` | keyboard focus |
| Shadows `--shadow-1..3` | same layered structure as the reference, tinted `rgba(58,36,25,…)` | elevation |

**Contrast (approximate):** `--text-default` on `--bg-canvas` ≈ 11:1. White on `--bg-inverse` ≈ 14:1. `--accent-link` on white ≈ 4.6:1, so use it for links and focus only, never for small body text. `--accent-highlight` is decorative only and always carries `--text-strong` text.

**Theme:** light-only. The umber inverse sections provide the dark rhythm. No dark mode in phase 1 (see DECISIONS.md).

---

## 3. Typography

| Family | Token | Use |
|---|---|---|
| **Golos Text** (variable, 400–600) | `--font-sans` | everything |
| **Fragment Mono** 400 | `--font-mono` | eyebrows, micro-labels, codes (booking ref, promo code) |

Load: Google Fonts `Golos+Text:wght@400;500;600` + `Fragment+Mono`. Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.

### 3.1 Scale (desktop → mobile, via `clamp`)

| Token | Size | Line-height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `--fs-display` | clamp(48px, 6.2vw, 90px) | 0.98 | -0.06em | 400 | hero H1 |
| `--fs-h1` | clamp(40px, 4.7vw, 68px) | 1.01 | -0.055em | 400 | manifesto, section H2 large |
| `--fs-h2` | clamp(32px, 3.3vw, 48px) | 1.04 | -0.045em | 400 | section titles |
| `--fs-h3` | clamp(24px, 2.2vw, 32px) | 1.1 | -0.04em | 400 | panel titles, plan prices |
| `--fs-h4` | 22px (mobile 20px) | 1.2 | -0.035em | 400 | card titles |
| `--fs-lead` | clamp(17px, 1.4vw, 20px) | 1.45 | -0.01em | 400 | hero subtitle, intros |
| `--fs-body` | 16px | 1.5 | 0 | 400 | body |
| `--fs-small` | 14px | 1.45 | 0 | 400 | helper, captions, table |
| `--fs-micro` | 12px | 1.35 | 0.04em uppercase | 400 mono | eyebrows, badges |
| `--fs-num` | inherit | — | -0.04em | 500 | prices, stats (tabular-nums) |

Rules: max text measure 62ch for body, 18ch for display. Only `h1` per page is the hero title. Do not bold body copy; emphasise with `--text-strong`.

---

## 4. Spacing System

Base unit 4px. Tokens: 

| Token | px | | Token | px |
|---|---|---|---|---|
| `--sp-1` | 4 | | `--sp-8` | 32 |
| `--sp-1-5` | 6 | | `--sp-10` | 40 |
| `--sp-2` | 8 | | `--sp-12` | 50 |
| `--sp-2-5` | 10 | | `--sp-15` | 60 |
| `--sp-3` | 12 | | `--sp-20` | 80 |
| `--sp-4` | 16 | | `--sp-30` | 120 |
| `--sp-5` | 20 | | | |
| `--sp-6` | 24 | | | |

(Values match the reference gaps 4/6/8/10/12/16/20/24/32/40/50/60 and section paddings 80/120.)

- **Section padding (block):** desktop `--sp-30` (120), tablet `--sp-20` (80), mobile `--sp-15` (60).
- **Gutter (inline):** desktop 32, tablet 24, mobile 16.
- **Card padding:** 24 desktop / 20 mobile. Compact card 16.
- **Stack gaps:** title→body 16; heading block→content 50 (desktop) / 32 (mobile); grid gap 20 (cards), 10 (chips/slots).

---

## 5. Layout Rules

- **Container:** `--container-max: 1440px`, centered, inline padding = gutter. Content never exceeds 1440. **Full-bleed exceptions:** hero background, breathing section A image, inverse (umber) section backgrounds — they span 100vw while their content stays in the container.
- **Grid:** 12 columns, gap 20px desktop; 8 cols / 20px tablet; 4 cols / 16px mobile.
- **Breakpoints (from reference):** mobile `< 810px`, tablet `810–1199px`, desktop `≥ 1200px`.
- **Navigation:**
  - Desktop/tablet: fixed floating header pill (`--header-h` 64px) inset 16px from top, white surface, `--shadow-2`. Promo strip (when active) sits above it.
  - Mobile: **native app shell** — compact header 56px (logo + context title + gift action), bottom tab bar 64px + safe-area, only `.app-scroll` scrolls, FAB WhatsApp floats 16px above the tab bar.
- **Z-index scale:** content 1 · sticky 20 · header 40 · tabbar 45 · fab 50 · drawer/modal 60 · toast 70.

---

## 6. Visual Effects

### 6.1 Radius
| Token | px | Use |
|---|---|---|
| `--r-xs` | 8 | small chips in tables, calendar days |
| `--r-sm` | 14 | inputs, slot buttons, small cards |
| `--r-md` | 16 | cards, tabs container |
| `--r-lg` | 20 | large cards, media |
| `--r-xl` | 24 | modals, hero media, bottom-sheet top corners |
| `--r-pill` | 30 | buttons, chips, badges, segmented controls |

### 6.2 Shadows (layered structure from reference, umber-tinted)
| Token | Value | Use |
|---|---|---|
| `--shadow-1` | `0 0.6px 0.6px -1.25px rgba(58,36,25,.02), 0 2.29px 2.29px -2.5px rgba(58,36,25,.02), 0 10px 10px -3.75px rgba(58,36,25,.01)` | resting cards on white |
| `--shadow-2` | `0 0.6px 0.6px -1.25px rgba(58,36,25,.04), 0 2.29px 2.29px -2.5px rgba(58,36,25,.04), 0 10px 10px -3.75px rgba(58,36,25,.02)` | cards on canvas, header |
| `--shadow-3` | `0 0.6px 0.6px -1.25px rgba(58,36,25,.06), 0 2.29px 2.29px -2.5px rgba(58,36,25,.05), 0 10px 10px -3.75px rgba(58,36,25,.02)` | hover / raised |
| `--shadow-pop` | `0 0.6px 1.57px -1.5px rgba(0,0,0,.17), 0 2.29px 5.95px -3px rgba(0,0,0,.14), 0 10px 26px -4.5px rgba(0,0,0,.02)` | buttons on photos, FAB, popovers |
| `--shadow-modal` ★ | `0 24px 64px -12px rgba(36,22,15,.28)` | modals/drawers (reference has no modal; scaled from `--shadow-pop` tint) |

### 6.3 Outlines
Focus: `outline: none; box-shadow: var(--focus-ring)` on all interactive elements via `:focus-visible`. Selected: `1px solid var(--border-strong)` + `--bg-tint` fill.

### 6.4 Motion tokens
| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | 160ms (hover, press) |
| `--dur-base` | 280ms (tabs, accordion, step change) |
| `--dur-slow` | 520ms (modal/sheet, reveals) |
Motion One owns micro-interactions/UI state; GSAP owns scroll. They never animate the same element's same property (see DECISIONS.md §6). Everything is disabled under `prefers-reduced-motion: reduce`.

---

## 7. Component Guidelines

### Buttons `.btn`
- Height 48 (`--btn-h`), small 40 (`.btn--sm`), padding `13px 22px`, radius `--r-pill`, font 15/500, tracking -0.01em, icon 18px, gap 8.
- `.btn--primary`: bg `--accent`, text white. Hover `--accent-hover`. One primary per view region.
- `.btn--secondary`: bg `--bg-surface`, text `--text-strong`, border `--border-default`.
- `.btn--ghost`: transparent, text `--text-default`, hover fill `--bg-subtle`.
- `.btn--light`: white bg on photos/umber, text `--text-strong`, `--shadow-pop`.
- `.btn--whatsapp`: secondary variant with WhatsApp glyph — never green fill (brand stays umber).
- `.btn--block`: full width. `.btn--icon`: 44×44 square-round.

### Inputs `.field`
- Label 14/500 `--text-strong`, 6px above control. Helper/error 13px below.
- Control height 48, padding `13px 16px`, radius `--r-sm`, bg `--bg-subtle`, border 1px transparent → hover `--border-default` → focus bg white + `--border-strong` + `--focus-ring`.
- Error: border `--danger`, helper text `--danger`, icon. Success (validated): check icon `--success` at right.
- Checkbox/radio: 20px, radius 6 / round, checked fill `--accent`.
- Selectable cards `.choice`: surface, hairline, radius `--r-md`, padding 16; selected = `--border-strong` 1px + `--bg-tint` 30% wash + check.

### Cards `.card`
Surface white, border `--border-hairline`, radius `--r-lg`, `--shadow-2`, padding 24. Interactive cards lift: hover `--shadow-3`, translateY(-2px). `.card--inverse` on umber: `--bg-inverse-raised`, `--border-inverse`.

### Tabs
- `.tabs` (primary): segmented pill container `--bg-subtle`, radius `--r-pill`, padding 4; tab height 40, active = white surface + `--shadow-2` sliding indicator.
- `.subtabs` (secondary): text tabs with 2px underline indicator `--accent`, 14px.
- Mobile: tabs scroll horizontally with snap, never wrap.

### Chips `.chip`
Height 36, padding 0 14, radius pill, border `--border-default`, 14px. Selected: bg `--accent`, text white. Used for filters (gallery, testimonials).

### Badges `.badge`
Height 24, padding 0 10, radius pill, 12px mono uppercase. Variants: `--neutral` (`--bg-subtle`), `--highlight` (`--accent-highlight`, ink text), `--success`, `--inverse`.

### Tables `.table`
Header row `--bg-subtle`, 13px mono uppercase `--text-muted`, row height 52, hairline separators, numbers right-aligned tabular. On mobile, tables convert to stacked rows (`data-label`).

### Modals `.modal` & bottom sheets
- Desktop: centered panel max-width 560 (`--modal-w`), booking/gift flows 880 (`--modal-w-lg`) with summary column, radius `--r-xl`, `--shadow-modal`, backdrop `--bg-scrim`. Header 64 with title + close; sticky footer 72 with total + actions (Airbnb pattern).
- Mobile: **bottom sheet** — full width, top radius `--r-xl`, max-height 92dvh, 36×4 drag handle, swipe-down to close, footer respects `env(safe-area-inset-bottom)`.
- Focus trap, `Esc` closes, focus returns to trigger, `aria-modal="true"`.

### Drawers `.drawer`
Right side, width 440, full height, used in admin for edit forms (Time2book pattern). Mobile → bottom sheet.

### Stepper `.steps`
Horizontal 3-step progress at top of multi-step flows: numbered 24px dots, active `--accent`, done shows check; label 13px. Mobile shows "Paso 2 de 3" + progress bar.

### Accordion `.acc`
Item hairline-separated, trigger 18px row min-height 64, plus icon rotates 45° when open; panel animates height.

### Calendar & slots
Month grid, 7 cols, day 40×40 radius `--r-xs`; today has dot; selected `--accent` filled; disabled `--text-disabled`, struck. Slots: grid of 96px min buttons, height 44, radius `--r-sm`, hairline; selected filled `--accent`; low availability shows "Quedan n" in 11px; full = disabled.

### Toast
Bottom-center (desktop) / above tabbar (mobile), umber inverse pill, 14px, 4s.

### Gift card `.giftcard`
Ratio 1.6:1, radius `--r-lg`, padding 20, `--shadow-modal`. Three designs only: `--sand` (`--media-fallback`, white ink), `--navy` (white surface, `--text-strong`, hairline), `--ink` (`--bg-inverse`, white ink). Brand row 16/500 · message 13px · amount 36px tracking -0.04em · mono 11px label. `.is-static` for in-flow use (previews).

### Flow layout `.flow` (booking / gift)
Two columns: main (scroll) + 280px summary aside on `--bg-canvas` with hairline divider. Sticky foot shows `.foot-total` (20/500 price + 12px context) and Back (ghost) / Next (primary). Mobile: aside hidden, progress bar + "Paso n de 3" replaces the dot stepper.

### Step list `.how-step` (scroll sequence)
Mono number column 48px + body. Inactive opacity 0.4, active 1 (desktop ≥1200 only, driven by ScrollTrigger). Sticky media 4:5 with a 3px white progress bar.

### Ticker `.ticker`
Hairline top/bottom, 24–40px words in `--text-subtle`, separated by 8px `--accent-highlight` dots, linear 40s loop, paused off-screen.

### Admin: KPI `.kpi`, save bar `.savebar`, settings row `.setting`
KPI = card, 13px label with icon, 32px tabular value, 12px hint. Save bar = floating `--bg-inverse-deep` pill with Discard (ghost) / Save (white) — appears only when the draft differs from saved. Setting row = 2-col (label/help | controls), hairline separated.

### Media `.media`
Radius `--r-lg`, `overflow:hidden`, `object-fit: cover`, background fallback `--media-fallback` (warm salt gradient — the only warm surface, because it stands in for a photo).

---

## 8. Interaction States

| State | Rule |
|---|---|
| Hover | buttons darken (`--accent-hover`) or fill `--bg-subtle`; cards `--shadow-3` + -2px; links underline. 160ms. Hover only under `(hover:hover)`. |
| Focus | `:focus-visible` → `--focus-ring`; never remove without replacement. |
| Active / pressed | scale 0.97 (Motion), 120ms. |
| Disabled | opacity 0.45, `cursor:not-allowed`, no hover. Slots/days: `--text-disabled` + line-through. |
| Loading | button keeps width, label → 16px spinner (border 2px currentColor, 0.8s linear), `aria-busy="true"`. |
| Selected | `--bg-tint` fill + `--border-strong`, or full `--accent` fill for chips/slots/days. |
| Error | `--danger` border + message under field; form-level summary banner `--danger-bg`. |
| Success | `--success-bg` banner with check icon; field check icon. |
| Empty | muted 14px message + optional ghost action. |

---

## 9. Responsive Rules

| Component | Desktop ≥1200 | Tablet 810–1199 | Mobile <810 (app shell) |
|---|---|---|---|
| Header | floating pill, anchors + 2 CTAs | pill, anchors collapse to menu button | compact 56px bar; navigation in bottom tab bar |
| Hero | full-bleed, copy bottom-left, stats right | stats below copy | image 100% wide, copy overlaid, stats as 3-col strip |
| Benefits | tabs + 2-col panel (media / content) | same, media 40% | tabs scroll-x, media on top |
| How it works | pinned: sticky media left, steps right | unpinned 2-col | vertical steps with inline media |
| Gallery | 4-col bento | 3-col | 2-col; lightbox fullscreen |
| Pricing | 3 cards row; table | 3 cards (tight) | horizontal snap carousel, popular first-centered; table → stacked |
| Testimonials | carousel 3 visible | 2 visible | 1.1 visible, swipe |
| FAQ | tabs + accordion + side card | same | tabs scroll-x, side card below |
| Contact | 2 col (info+map / form) | 2 col | stacked |
| Modals | centered dialog | centered dialog | bottom sheet |
| Admin | sidebar 248 + content | collapsed icon sidebar 72 | bottom tab bar + bottom-sheet drawers |

Touch targets ≥ 44×44 on mobile. Body text never below 14px.

---

## 10. Changelog
- v1.0 (2026-11-17) — initial system extracted from reference; added error palette, `--shadow-modal`, `--text-subtle`, motion tokens, media fallback.
- v1.1 (2026-11-17) — documented components introduced during build: gift card, flow layout, how-step, ticker, admin KPI/savebar/setting. Global rule: headings and `b/strong` never exceed weight 500.
- v2.0 (2026-11-17) — **Palette replaced** with "Sal y brasa" at the client's request: warm mineral tones sampled from the cave photography replace the reference navy/blue. Typography, spacing, radii and shadow structure are unchanged; shadows and scrims are now umber-tinted. Principle 1 changed from "Clinical calm" to "Mineral warmth".

# DECISIONS.md

Each ambiguity in the brief, how it was resolved and why.

## 1. Stack and architecture
| Ambiguity | Decision | Criterion |
|---|---|---|
| "Motion for React / client components" vs. the existing project (`index.htm`, `style.css`, `script.js`, no build) | **Vanilla HTML/CSS/JS, no build step.** Motion One (`motion@11.11.17` UMD, `window.Motion`) + GSAP 3.12.5 + ScrollTrigger from CDN. | Respect the existing setup. The site opens by double-clicking `index.htm`. The "client components only where needed" rule becomes: only animation modules touch the DOM for motion, and content renders without JS animation. |
| ES modules | **Classic `<script defer>` files** sharing one namespace (`window.Halita`). | ES modules fail over `file://` (CORS). |
| Separate functional components from styles | `css/tokens.css` (tokens) → `css/components.css` (reusable components) → `style.css` (site sections) / `css/admin.css`. JS split by responsibility: `js/content.js` (data + store), `js/ui.js` (modal/sheet, toasts, icons, validation), `js/flows.js` (booking, gift card, lead, contact), `script.js` (site rendering and wiring), `js/motion.js` (all animation), `js/admin.js`. | Matches rule 6 of the brief. |

## 2. UX references (Mobbin) → where they were used
| Pattern | Mobbin reference | Applied to |
|---|---|---|
| Booking modal: guests stepper → date strip → time slots → sticky footer with total + "Siguiente" | Airbnb · "Selecting reservation date (service)" | Booking step 1–2 structure, sticky footer |
| Date picker with morning/afternoon slot groups | GoDaddy · "Adding a date and time" | Slot grouping in step 2 |
| Side drawer with service → schedule → client, Dismiss/Confirm footer | Time2book · "Adding a client to schedule" | Admin edit drawers |
| Full-bleed photo hero, copy bottom-left, 3 stats with dividers bottom-right | Function · hero section | Hero |
| 3-plan pricing with a highlighted middle plan and "Most popular" badge | OpenTable / TravelPerk pricing sections | Pricing |
| Settings with left nav + tabs + business-hours rows | Quo · business hours | Admin › Horarios |
| Service library table with actions and a "Create" primary button | Square · service library | Admin › Precios / Testimonios tables |
| Floating bottom tab bar, compact header | OpenTable iOS / ClassPass iOS | Mobile app shell |

Mobbin was used only for structure. Every color, font, radius and shadow comes from Design.md.

## 3. Visual reference (clireo.framer.website)
- WebFetch returned text only, so the raw HTML was downloaded and the Framer CSS tokens were parsed (colors, `--framer-font-size`, letter-spacing, radii, `box-shadow`). Values are in Design.md §2–6.
- **Content max-width:** the reference uses 1300px, but the brief says 1440px. **The brief wins**, so the value is 1440px.
- **Brand color temperature:** the reference is cool navy and blue, while salt caves are warm amber and pink. **The reference wins for the UI** (rule 2). The warmth lives only in the photography and the image fallback gradient. This contrast also supports the brief: clinical trust in the chrome, sensory warmth in the images.
- **Missing states in the reference** (error, modal shadow): added and marked `★ added` in Design.md (conflict rule 3).

## 4. Content and claims ("Never fabricate metrics, testimonials or business claims")
- The brief needs a Google rating, a session count, testimonials, an address, prices and a phone number, but **no real data was supplied.**
- **Decision:** all of these are **editable sample data** in the CMS (`js/content.js` defaults). While `meta.demo === true`, a visible ribbon reads **"Vista previa · datos de ejemplo"**, and the admin dashboard shows a checklist of fields to replace. Unchecking "Modo demo" in Admin › Ajustes removes the ribbon once the real data is in.
- Medical copy is phrased as a *complementary* therapy, with a permanent disclaimer under Benefits and in the FAQ (contraindications). There are no cure claims.
- Breathing sections were chosen so that **no invented metric is needed** (see §7).

## 5. Functional requirements
| RF | Decision |
|---|---|
| RF-01 Reserva | Modal (desktop) or bottom sheet (mobile) with **3 steps**: ① Sesión (type Adulto/Infantil/Privada + people + plan) ② Fecha y hora (month calendar + slots grouped Mañana/Tarde, availability from opening hours, capacity 8/slot minus stored bookings) ③ Datos y pago. Then a confirmation screen with a booking code, `.ics` download and a WhatsApp share. Every "Reservar…" button opens the same flow, preselecting context (plan or benefit). |
| RF-02 Pago | **Simulated.** Card fields with format validation (Luhn, expiry, CVC), or "Pagar en el centro". A 1.2s fake processing delay. No data leaves the browser. |
| RF-03 Selector de beneficios | 4 primary tabs (Respiratorio, Piel, Estrés, Niños), each with **sub-tabs Clínico / Sensorial**, which is the "filter by objective" requirement. A CTA in each panel opens booking with the matching type (Niños → Infantil). |
| RF-04 WhatsApp | Persistent FAB. The message is **built from the section currently in view** (IntersectionObserver) plus any selected plan. Opens `https://wa.me/<number>?text=…`. On mobile it sits above the tab bar. |
| RF-05 CMS | `admin.htm`: a client-side admin (sidebar + tabs + tables + drawers) editing prices (3 plans × 3 types), the seasonal promo, opening hours, testimonials and business settings, plus an inbox of bookings, leads, messages and gift cards. It persists to `localStorage`, and the public site reads the same store. **Export/Import JSON** is the bridge to a real backend. The login is a demo gate (`demo@halita.es` / `halita`) and is **not security**. Real authentication needs a server (phase 2). |
| Lead generation KPI | "Guía de bienestar respiratorio" lead form (name + email + profile + consent) → success state with a download of a printable guide (`guia-bienestar-respiratorio.html`). |
| Gift card | 3-step modal: amount or plan → personalise (recipient, message, design, delivery date) → simulated payment → preview card + code. |

## 6. Motion ownership
- **GSAP + ScrollTrigger:** hero intro timeline, `[data-reveal]` section and item reveals (opacity, y), `[data-parallax]` image yPercent, the pinned "Cómo funciona" sequence (desktop only), the manifesto word scrub, and the testimonial marquee.
- **Motion One:** button press scale, card hover lift, tab indicator and panel crossfade, accordion height, modal and bottom-sheet enter/exit and drag snap, booking step transitions, toasts, and price changes.
- **No collisions:** GSAP animates wrapper elements (`[data-reveal]`), and Motion animates their *children* (`.card`, `.btn`, panels). Parallax images (GSAP) are never hover targets.
- **Mobile scroller:** in the app shell `.app-scroll` is the scroller. `gsap.matchMedia()` creates ScrollTriggers with `scroller: ".app-scroll"` on mobile and the window on desktop.
- `prefers-reduced-motion: reduce` skips all of the above. Content is visible by default: reveals set their initial state from JS, so nothing stays hidden if a CDN fails.

## 7. Breathing sections (2, different archetypes, not adjacent)
1. **Category A, Pure visual/atmospheric:** a full-bleed cinematic cave image with slow parallax and a one-line caption. **Placement:** between *Beneficios* (dense, tabbed, text-heavy) and *Cómo funciona* (procedural). It resets attention before the "how".
2. **Category B, Editorial statement:** a brand manifesto, *"No vienes a hacer nada. Vienes a respirar."*, with a scroll-scrubbed word reveal on a navy full-bleed band. **Placement:** between *Tarifas* (the most transactional moment) and *Testimonios*. It reframes price into meaning before the social proof.
- Category C (metrics) was rejected because it would require invented numbers. The kinetic marquee (D) appears only as the testimonials ticker, not as a separate section.

## 8. Mobile app shell
- ≤809px: `body` does not scroll. A fixed compact header (56px) shows the logo, the title of the current section (updates on scroll) and a gift-card action. `.app-scroll` is the only scroller. The bottom tab bar has **Inicio · Beneficios · Reservar (primary) · Tarifas · Más**. "Más" opens a bottom sheet with the remaining sections and actions. All modals render as bottom sheets with drag-to-dismiss.
- Tablet (810–1199px) keeps the desktop page model. The header collapses its anchors into a menu that opens a drawer.

## 9. Images and video
- **Generator:** the brief specifies Nodal MCP (Nano Banana 2 Lite, and GPT Image for transparency). **Nodal was unreachable in this session** (ECONNREFUSED at session start). The session could not reconnect, and calling it by hand with the stored token was blocked. **Decision:** build every image slot with its final filename, aspect ratio and art-directed prompt (`assets/PROMPTS.md`). Each slot shows a designed salt-gradient fallback until the file exists, so dropping the generated files into `assets/img/` completes the site with no code change.
- **Video:** Nano Banana is image-only. The hero uses a still with a slow GSAP "breathing" scale instead of video. A video slot can be added later (`hero.mp4`, poster = `hero.jpg`).
- **People:** no generated faces are attached to testimonials, because that would imply real customers. Testimonials use initials avatars.

## 10. Other
- **Language:** Spanish (es-ES), with euros and a 24h clock, because the brief is in Spanish.
- **Map:** an OpenStreetMap embed (interactive, no API key) plus a "Cómo llegar" link to Google Maps. The coordinates are editable in the CMS.
- **No dark mode** in phase 1, because the reference has none. The navy inverse sections give the page its dark rhythm.
- **Accessibility:** semantic landmarks, ARIA tabs and accordion, focus trap in dialogs, `Esc` to close, visible focus rings, ≥44px touch targets, and reduced motion respected.

## 11. Palette change (2026-11-17)
- **Request:** the client found the navy/blue palette from the visual reference cold next to the warm cave photography and asked for a palette that feels of a piece with it.
- **Decision:** "Sal y brasa". Every colour is sampled from the images: salt-white canvas `#F7F1EA`, sand `#EFE5DA`, pink salt brick `#F3D9C4`, umber rock `#3A2419` for dark sections and the primary button, amber `#E8A06A` for highlights, terracotta `#B5603A` for links and focus, and sage `#5E7A5C` for success.
- **Scope:** colour only. Typography (Golos Text / Fragment Mono), scale, spacing, radii and the layered shadow structure still come from clireo.framer.website. This overrides the earlier rule in §3 ("the reference wins for the UI"), because the client asked for it explicitly. That is the exception Design.md §5 allows.
- **Implementation:** the change is almost entirely in `css/tokens.css`. The hardcoded tints in `style.css` (hero and breath scrims), the select-arrow and success-icon data URIs, the favicons, `theme-color` and the downloadable gift-card SVG were updated to match.

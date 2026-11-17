# QuoteRevive — Redesign V4 Blueprint

**Source:** frame-by-frame analysis of Finn's 3 new Dribbble reference videos (downloaded, ffmpeg frame extraction at 31 timestamps + dense 0.1–2.0s motion studies + programmatic colour sampling).
**Status:** RESEARCH + BLUEPRINT ONLY — no app code changed.
**Videos:**
- V1 — `original-18367a3….mp4` (30.4s, 3670×2304, 60fps)
- V2 — `original-b0a167b….mp4` (28.5s, 3670×2304, 60fps)
- V3 — `original-a36c820….mp4` (47.1s, 1440×1080, 30fps)

---

# PART 1 — PER-VIDEO ANALYSIS

## Video 1 — "Antimetal" landing page (hero + dashboard tour)

**Product:** Antimetal — AWS cloud-cost savings SaaS ("Save time & money on AWS"). A slow cinematic scroll-tour of the real marketing site.

**Layout & structure**
- Centred single-column hero: logo top-left, centred nav links, "Sign in" top-right. Huge 2-line headline, 2-line sub, one CTA, then a full-width product screenshot (the actual dashboard) rising from the bottom edge, clipped by the viewport.
- Below the fold: monochrome logo wall → "The problem" section (wall of question cards) → "The solution" headline → feature sections with live mini-UI cards → footer area.
- The whole page sits on a **blueprint grid**: hairline vertical/horizontal rules with small white node-circles at intersections, and faint dotted pixel-cluster decorations scattered on the grid.

**Colour palette (sampled)**
- Background: icy blue gradient, `#D2E7FA` (top) → `#DBEBF6` → near-white `#F5F8FB`/`#FFFFFF` lower down. Sections below the hero go almost pure white `#FDFDFD`.
- Ink (headlines/text): near-black navy `#101828`-ish (reads as soft black, not pure #000).
- Primary data blue: bright azure `#2E7CF6`-ish (progress bars, chart lines).
- **Signature accent: chartreuse/lime `#C6F135`-ish** — used ONLY as a small segment inside the black CTA button and tiny highlights.
- Secondary data colours: amber `#FFB224`-ish, gauge red `#E5484D`-ish, pastel icon blobs (mint `#D9F7E8`, pink `#FDE8F1`, lilac `#ECE9FB`, peach `#FDEBDD`, sky `#E2F2FD`).
- Muted text: blue-grey `#667085`-ish.

**Typography**
- Headlines: very large (≈64–76px at desktop), extra-bold, **tight tracking (-0.03em)**, tight leading (1.02), geometric-humanist grotesque — closest Google Fonts match: **Inter Tight** (700/800) or Archivo Expanded-off. Antimetal's real font is custom; Inter Tight is the honest free twin.
- Body/UI: clean Inter-class grotesque, 14–16px, medium weight labels, sentence-case eyebrows inside small white pills (with a tiny icon), tabular numerals for money.

**Buttons**
- Primary CTA: **black pill** (radius ≈10–12px, not fully round — a "squircle pill"), white text, with a **lime segment chip** on its left half (split-button look). In the sticky nav it becomes a compact black pill "Book a demo" + a ghost/outline "Sign in" pill.
- Hover (seen in nav pass): the lime segment brightens/expands slightly; buttons feel springy, ~200ms.

**Cards / containers**
- Dashboard mock: white, radius ≈16px, hairline border `#E4E9F2`, one huge soft diffused shadow (y≈24px, blur ≈60px, blue-grey at ~12%).
- Inner stat cards: white, radius 12px, hairline border, almost no shadow — separation by borders, not elevation.
- Question cards (problem wall): white, radius 16px, soft shadow, a pastel blob (rounded-square) holding a thin line icon, question text centred under it.
- Progress bar: thick (10px) rounded azure bar with hatched/light segment + amber segment.

**Backgrounds:** blueprint grid + node dots + dotted pixel clusters (subtle animated shimmer — dot clusters shift between frames); gradient wash icy-blue → white.

**Icons:** thin 1.5px line icons (Lucide-class), plus filled AWS brand glyphs in white circular chips in the orbit diagram.

**Motion (frame-compared)**
- Hero entrance is fast and already settled by 0.5s: soft fade/rise, no drama.
- The promo is a **scroll tour**: as it scrolls, the hero dashboard screenshot scales up to a full app view; the sticky nav condenses in (Sign in + Book a demo appear).
- **Odometer count-ups:** money numbers roll digit-by-digit (mid-roll digits visible: "$2,424", "$4,119" half-turned) tied to scroll position — Saved goes $0 → $7,315 across the tour while the azure progress bar **grows in width** and segments appear.
- Question-card wall: cards drift like a slow marquee/grid shuffle, edge cards faded/blurred.
- Feature cards: numbers keep counting, tiny green status dots appear on orbit icons ("Optimized" pill pops in).
- Character: smooth, slow, expensive-feeling — long ease-outs (600–1200ms), scroll-linked rather than snappy.

## Video 2 — "Antimetal" continued (features, card collage, Guardrails)

**Product/sections:** the same Antimetal site, lower half: Commitment features, Visibility section, a floating dashboard-card collage, Budgeting + Spend-breakdown feature pair, and the "Guardrails" animated diagram.

**Layout & structure**
- Feature blocks sit directly on the blueprint grid (no boxes) — centred headline + 2-line copy, generous white space (150px+ gaps).
- A divider motif: rows of small chevrons `>>>>` and `<<<<` facing a centre node on a hairline — used as section separators.
- **Floating card collage:** real dashboard cards (Savings table, Guardrails gauge, Budget line chart, stacked-bar spend card, EC2 review card, Invite card) float at different depths over the page — some sharp, some blurred/faded at the edges — a parallax "product explosion".
- Feature pairs: two live UI cards side by side, caption (title + 2-line copy) centred UNDER each card.
- Guardrails diagram: customer-logo nodes in white circles on the left; dotted connector lines draw horizontally to the right; alert pills ("Compliance Risks", "Resource Misallocation", "Security Vulnerabilities") slide/pop in along the lines one after another.

**Colours/typography:** identical system to V1 (white ground, ink headlines, azure data blue, pastel blobs). Section eyebrows are plain small grey text ("Visibility", "Guardrails") centred above the headline — no pill here.

**Buttons/cards:** same as V1; chart tooltip card (white, radius 12, soft shadow) follows the cursor over the stacked bars showing per-day breakdown.

**Motion (frame-compared)**
- Cards **rise with blur→sharp focus** (a card at the bottom of frame at 6s is heavily blurred, fully sharp by 9s) — scroll reveal = translateY + blur(8px)→0 + fade, ~700ms ease-out.
- Collage cards drift at different speeds (parallax layers) while scrolling.
- Bar-chart hover: tooltip card tracks the mouse; the hovered bar's segment values swap (Jan 1 → Jan 4 → Jan 8 across frames).
- Budget card numbers odometer-roll ($25.5K → $25.1K mid-roll).
- Guardrails: dotted lines **draw** (stroke-dashoffset) left→right, then pills pop in sequentially (~300ms apart), small caret triangles pulse at line ends.
- Character: same slow-luxury ease as V1; micro-interactions ~200–300ms.

## Video 3 — "pipl.ai" promo (browser-window stage, kinetic type, camera zooms)

**Product:** pipl.ai — cold-email/sales-engagement SaaS. Unlike V1/V2 (a site tour), this is a **motion-design promo**: the whole website is presented inside a fake browser window floating on a gradient stage, with camera pans/zooms into the UI.

**Layout & structure**
- Stage: soft **lavender/periwinkle aurora gradient** around a white browser window (radius ≈14px, big soft shadow).
- Hero: left-aligned — small eyebrow ("rev up your sales engine" with a dot), huge 3-line headline, grey sub, two buttons; right side: the dashboard UI slides in, half-cropped by the window edge, with floating glass icon badges (pink star, blue bell) bobbing around it.
- Feature rows alternate left/right: text block with a thin outline illustration icon + dashboard card cluster backed by a **rainbow-gradient panel** (pink → violet → azure → teal → yellow) peeking out behind the white cards.
- Then: gradient-word headline section ("Revolutionize Your Sales Process"), a full-bleed dashboard zoom, FAQ accordion (white rows, blue circular + buttons), testimonial cards on periwinkle gradient panels, a review CTA block, and a **deep-navy footer** (#0D0D26-ish) — the only dark element in all three videos.

**Colour palette (sampled)**
- Stage gradient: `#EDE6FE` (pink-lavender corners) → `#C9CFF8` / `#CCD3FA` (periwinkle edges) → `#EFE1FA` tints.
- Page ground: white `#FFFFFF`/`#FDFDFD`.
- Ink: deep navy-black `#0B0B1E`-ish headlines.
- Primary: periwinkle blue `#4B5CF5`-ish pill buttons ("Get Early Access"); nav CTA is a **black pill** ("Sign Up").
- Gradient text: one word per headline in a gradient — "Sales" violet→pink `#7C5CFC → #F471B5`; "Questions" pink→orange; "10,000+" full rainbow (cyan→violet→pink→orange).
- Logo: black wordmark with orange-red ".ai" `#FF5A3C`-ish.
- Dashboard accents: azure stat tiles `#2E7CF6`, green deltas `#22C07A`-ish, red warning triangles.

**Typography**
- Headlines: extra-bold rounded geometric grotesque, tight tracking, ≈54–64px — closest Google Fonts: **Plus Jakarta Sans (800)** (Manrope 800 is the runner-up). Same family does UI text at smaller sizes; body grey `#5B5B6E`-ish.
- FAQ/questions in a lighter weight of the same family (500) at ~20px.

**Buttons**
- Primary: periwinkle pill, radius full (999px), white text, soft blue shadow; secondary: white pill with hairline border ("Contact Us"). Nav: black pill. Hover states in the promo are mostly cursor clicks on toggles (blue iOS-style switches flip with a spring).

**Cards / containers**
- White cards radius 14–18px, hairline borders, soft shadows; cards sit ON gradient panels offset by ~14px (gradient acts as a coloured "shadow frame").
- Floating glass badges: rounded-square, semi-transparent gradient fill + white icon, backdrop blur, gentle bobbing.
- FAQ rows: white, radius 12, hairline border, blue circle with white "+" at right.

**Motion (frame-compared, dense 0.1–2.0s study)**
- **Word-by-word headline reveal:** each word slides in from the left with horizontal blur/stretch ("Unlock" sharp → "More" blurring in → "Leads, and" → "Meetings"), ~150–250ms stagger per word, blur 6px→0 + translateX 24px→0 + slight scaleX settle. Eyebrow text swaps mid-animation ("your sales engine" → "rev up your sales engine").
- Sub-copy fades up after the headline; buttons pop in (scale 0.9→1 + fade).
- Dashboard mock **slides in from the right** behind a lavender panel mask and settles with a soft ease-out (~800ms); floating badges bob continuously (translateY ±8px, ~3s ease-in-out loop) with slight rotation.
- Scroll = **camera moves**: the browser window pans and zooms INTO the dashboard until the app fills the frame (scale ~1→1.6, smooth 1s+ ease), cards inside fly/rotate in 3D (one sequence has account cards tumbling with rainbow gradient borders), then it pulls back out.
- Kinetic type moment: "Cold Email automations" — words slide horizontally at different speeds/weights (one word bold black, the other light grey) as the camera passes.
- Toggle switches flip as the cursor "clicks" them; stat numbers tick.
- Character: bouncier and faster than Antimetal — springy overshoot on pops, ~250–450ms micro, 700–1000ms camera moves, all ease-out cubic.

---

# PART 2 — THE UNIFIED DIRECTION FOR QUOTEREVIVE

## Name: **"Blueprint Aurora"**

Take Antimetal's *structure and discipline* (blueprint grid, icy azure, floating real-product cards, odometer money numbers, one restrained lime spark) and pipl.ai's *warmth and play* (periwinkle-lavender aurora washes, one gradient word per headline, word-reveal motion, floating glass badges, springy pops). The result: a light, premium, engineering-clean SaaS that still feels alive — and reads instantly as "money + systems", which is exactly QuoteRevive's promise to contractors.

**Why this fits Finn's constraints**
- All three references are **predominantly light** — there is NO dark-theme conflict for the page itself. The only dark elements in the refs are (a) black pill buttons and (b) pipl's navy footer.
- **Recommendation on the dark elements:** keep them *small and deliberate* — primary buttons in deep ink-navy `#141433` (not pure black) with the lime segment chip (Antimetal's signature), and NO dark sections/bands anywhere; footer stays light with an ink-navy text block. This honours the refs' button styling (which Finn explicitly liked) without recreating the round-2 "black design" he rejected. If even the ink buttons feel too dark in build, the fallback is azure primary buttons — the blueprint must be built so swapping `--btn-bg` is a one-line change.
- **No tick/check icons anywhere** — status is shown with dots, pills, and the word itself, never a ✓.
- Sliders and forms get the full treatment specified in Part 4 (Antimetal's thick progress bar DNA + pipl's springy toggles/pills).

## Palette (tokens)

| Token | Hex | Use |
|---|---|---|
| `--ground` | `#F6F9FC` | page ground (icy white) |
| `--ground-hero` | gradient `#D9EBFA → #EDF3FD → #F6F9FC` | hero wash (Antimetal icy → pipl lavender) |
| `--aurora-violet` | `#C9CFF8` | aurora wash / gradient panel |
| `--aurora-pink` | `#F3DFF7` | aurora wash tint |
| `--card` | `#FFFFFF` | cards |
| `--ink` | `#131A2A` | headlines (soft navy-black, never #000) |
| `--ink-btn` | `#141433` | primary button bg (deep ink-navy) |
| `--body` | `#3E4A5C` | body text |
| `--muted` | `#68778D` | captions, labels |
| `--line` | `#E3EAF3` | hairline borders, blueprint grid |
| `--azure` | `#2E7CF6` | primary data/action blue, links, chart line 1 |
| `--periwinkle` | `#4B5CF5` | gradient partner, chart line 2, focus rings |
| `--lime` | `#C6F135` | SPARK ONLY: button segment chip, "revived/booked" money, live dots |
| `--amber` | `#FFB224` | pending/due-soon |
| `--red` | `#E5484D` | overdue/errors |
| `--green` | `#1FA97A` | replied/positive deltas (not lime — lime is decorative spark) |
| gradient word | `linear-gradient(92deg,#2E7CF6,#7C5CFC 45%,#F471B5)` | ONE word per headline |
| gradient panel | `linear-gradient(135deg,#F471B5,#7C5CFC 35%,#2E7CF6 70%,#39D0C4)` | behind hero mock + feature card clusters (offset frame) |
| pastel blobs | mint `#D9F7E8`, pink `#FDE8F1`, lilac `#ECE9FB`, peach `#FDEBDD`, sky `#E2F2FD` | icon chips in cards/lists |

## Typography

- **Display:** `Plus Jakarta Sans` 800 — headlines, stat numerals, logo. (Matches pipl's rounded grotesque; Finn already approved Jakarta in the round-3 design, so it carries zero font-rejection risk. Antimetal's tighter feel is borrowed via tracking, not family.)
- **Body/UI:** `Manrope` 500/600/700 — paragraphs, labels, tables, buttons. (Approved in round 3; rounder and warmer than Inter.)
- **Fallbacks:** Jakarta → `"Manrope", system-ui, sans-serif`; Manrope → `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Numerals:** Jakarta with `font-variant-numeric: tabular-nums` for all money/stats (Antimetal's odometer look needs tabular figures).
- **Type scale (desktop / mobile):**
  - Display-1 hero: 68px / 42px, lh 1.02, ls -0.03em, 800
  - Display-2 section: 46px / 32px, lh 1.06, ls -0.028em, 800
  - H3 card/feature title: 21px, lh 1.25, ls -0.015em, 700 (Jakarta)
  - Stat numeral: 40px, lh 1, ls -0.02em, 800 (Jakarta, tabular)
  - Body: 16.5px, lh 1.6, Manrope 500
  - Small/caption: 13.5px, lh 1.5, Manrope 600
  - Eyebrow (pill): 12.5px, Manrope 700, sentence case, ink on white pill
  - Button: 15.5px, Manrope 700
  - Table: 14.5px rows / 12px uppercase-ish muted headers (letter-spacing 0.04em, weight 700 — use sparingly, section eyebrows stay sentence case per Antimetal)

## Spacing / radius / shadow tokens

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 110 (section gaps 110px desktop, 64px mobile — Antimetal's airy rhythm).
- Container: max-width 1180px, side padding 24px.
- Radius: `--r-sm 10px` (inputs, small chips), `--r-md 14px` (buttons are pills: 999px; cards inner), `--r-lg 18px` (cards), `--r-xl 24px` (hero mock, gradient panels).
- Borders: 1px solid `--line` everywhere; blueprint grid lines at `#DFE9F4`.
- Shadows:
  - `--shadow-card: 0 1px 2px rgba(19,26,42,.04), 0 12px 32px -12px rgba(46,124,246,.12)`
  - `--shadow-lift: 0 2px 4px rgba(19,26,42,.05), 0 28px 60px -16px rgba(27,52,102,.22)` (hero mock, floating cards)
  - `--shadow-btn: 0 8px 20px -8px rgba(20,20,51,.45)` (ink pill), azure variant for periwinkle buttons `0 8px 20px -8px rgba(75,92,245,.5)`
  - Focus glow: `0 0 0 4px rgba(75,92,245,.16)` + border `--periwinkle`.


---

# PART 3 — COMPONENT SPECS

## Buttons
- **Primary (ink pill, Antimetal-style):** bg `--ink-btn`, white text, radius 999px, padding 13px 22px 13px 14px, with a **lime segment chip** on the left: a 30×30 rounded-full (or 10px-radius squircle) lime block holding a small ink arrow/spark glyph (never a tick). `--shadow-btn`. Hover: chip slides/expands 4px wider, button lifts 1px, shadow deepens (~200ms spring). Active: scale 0.98.
- **Accent (periwinkle pill):** bg `--periwinkle` (or azure→periwinkle gradient 92deg), white text, full pill, blue shadow — used for in-app primary actions (Launch campaign, Send) where ink would be heavy.
- **Ghost:** white bg, 1px `--line` border, ink text; hover border → `#C7D5E8`, bg `#FBFDFF`.
- **Small:** 9px 16px padding, 14px text — table/nav use.
- Nav (landing): ghost "Log in" + ink pill "Start free month" (with lime chip), condensing in on scroll exactly like Antimetal's sticky nav.

## Cards
- Standard: white, `--r-lg`, 1px `--line`, `--shadow-card`, padding 24px.
- Floating/product cards (hero mock, feature clusters): `--shadow-lift`, `--r-xl` for the mock frame.
- **Gradient-frame card (pipl signature):** card sits on a `gradient panel` div offset by 14px down-right (panel radius `--r-xl`, opacity 0.9) — use for the hero dashboard mock and ONE feature cluster per page section, not everywhere.
- Stat card (dashboard strip): no individual boxes — one wide card, 4 cells divided by hairlines (Antimetal Overview DNA): pastel icon chip (38px rounded-square, thin line icon) + 2-word label, 40px numeral, one tiny muted sub-line.
- Icon chips: pastel blob = 44px rounded-square (radius 13px) in one of the 5 pastel tints with a 1.5px-stroke line icon in a deepened shade of the same hue. NO tick icons — use mail, phone, calendar, dollar, bell, arrow glyphs.

## Inputs & forms (polished — Finn's standing requirement)
- **Floating labels** on all text inputs/selects/textarea: label starts inside (16px, muted), floats to 11.5px azure caption above the field on focus/fill; field bg white, 1px `#D8E1EE` border, radius `--r-sm`, padding 14px 16px (with label space), transition border+shadow 180ms.
- Focus: border `--periwinkle` + focus-glow shadow. Error: border `--red`, soft red banner (existing pattern) — keep the app's current error/success components, restyle only.
- Selects: same shell with a chevron glyph; segmented controls (auth mode, reply status) as pill groups on a `#EEF3FA` track, active segment white with shadow (pipl toggle DNA).
- Toggles (campaign active etc.): iOS-style, 46×26, azure when on, knob spring 220ms cubic-bezier(.34,1.56,.64,1).
- Form grouping: fields inside white cards with 24px padding and a small Jakarta 700 card title; two-column grid ≥720px.
- Auth forms: centred 440px card on the aurora hero wash, gradient-frame treatment, logo on top.

## Slider (RichSlider — restyle, keep component behaviour)
- Track: 10px tall (Antimetal progress-bar weight), radius full; filled portion = azure→periwinkle gradient; remainder `#E4EBF5` with subtle hatch optional.
- Thumb: 30px white circle, 2px azure border, `--shadow-lift`-lite, grows to 34px on hover/drag with the focus-glow ring.
- **Value bubble:** floats above the thumb, follows it — ink-navy pill, white Jakarta 700 tabular text (e.g. "18%"), tiny caret; always visible while dragging, fades in on hover/focus.
- Step marks: small dots under the track at min/quartiles/max + Manrope 600 muted min/max labels at the ends.
- The second calculator slider (avg job value) gets the same treatment with $ formatting in the bubble.

## Chart (dashboard Activity overview)
- Keep the real-data SVG line chart. Lines: azure (sent) + periwinkle/violet (replies), 2.5px, rounded caps; area fill azure at 8% gradient; dotted grid `#E3EAF3`; hover crosshair + white tooltip card (`--r-md`, `--shadow-lift`) like Antimetal's bar tooltip; dots on hover only. Line draw-in animation on mount (stroke-dashoffset 900ms ease-out) — CSS/JS-light, see Part 6.

## Badges / pills / status
- Status pills: soft tinted bg (pastel family), deepened text shade, 12.5px Manrope 700, radius full, with a 7px **dot** (never a tick): New = azure, In sequence = violet, Replied = amber-dark, Booked = green with lime dot option, Dead = grey.
- Trial chip (nav/topbar): white pill, hairline border, small lime dot + "23 days left of free month".

---

# PART 4 — MOTION SPEC

**Character:** Antimetal's smooth luxury for scroll/page motion + pipl's spring for micro-interactions. Two easings cover everything:
- `--ease-out: cubic-bezier(.22,.8,.28,1)` (reveals, slides, camera-feel zooms)
- `--ease-spring: cubic-bezier(.34,1.45,.64,1)` (pops, toggles, chips, buttons)
- Respect `prefers-reduced-motion`: disable all but opacity fades.

| Name | Where | Spec |
|---|---|---|
| `word-reveal` | Hero headline (landing) | Each word: opacity 0, translateX(26px), blur(6px), scaleX(1.04) → natural; 520ms `--ease-out`, stagger 90ms/word. Eyebrow pill fades in first (300ms). |
| `fade-up` | Sub-copy, buttons, section blocks | opacity 0 + translateY(18px) → 0; 600ms `--ease-out`, stagger 80ms between siblings (IntersectionObserver adds `.in`). |
| `blur-rise` | Cards entering on scroll (V2 signature) | opacity 0, translateY(28px), blur(8px) → sharp; 700ms `--ease-out`. |
| `mock-in` | Hero dashboard mock | Slides up 40px + scale .97→1 + fade; 900ms `--ease-out`, delay 250ms after headline. Gradient panel fades in behind it offset. |
| `float-bob` | Glass badges on hero mock ("Reply received", "Job booked · $12,500") | translateY ±8px + rotate ±1.5deg, 3.2s ease-in-out infinite alternate. |
| `count-up` | Calculator result $, dashboard stat numerals, revived $ | Odometer-style count 0→value, 900ms ease-out, tabular Jakarta. JS rAF (small helper) — the ONLY JS-driven number motion. |
| `bar-grow` | Calculator result bar + campaign progress | width 0→%, 800ms `--ease-out` (Antimetal progress DNA). |
| `draw-line` | 4-touch sequence diagram (landing) + chart lines | stroke-dashoffset → 0, 1000ms `--ease-out` when in view; sequence dots pop with `--ease-spring` stagger 140ms as the line passes. |
| `pill-pop` | Alert/status pills in sequence diagram, toasts | scale .8→1 + fade, 320ms `--ease-spring`, stagger 120ms. |
| `card-hover` | Feature cards, quote rows, list cards | translateY(-3px) + shadow card→lift, 220ms `--ease-out`. |
| `btn-hover` | Primary buttons | lime chip expands 4px, lift 1px, 200ms `--ease-spring`. |
| `toggle-flip` | Switches | knob 220ms `--ease-spring`. |
| `page-in` | Dashboard view switches | content fades/slides 8px, 260ms `--ease-out` (no blur — app must feel fast). |
| `skeleton-pulse` | Dashboard loading states | soft 1.4s opacity pulse on `--line`-tinted blocks. |
| `marquee-drift` | Pain-point question wall (landing, optional) | two rows translateX slowly (40s linear infinite, opposite directions), edge fade masks — Antimetal's drifting question wall. Pause on hover. |

Durations discipline: micro 180–320ms, reveals 520–900ms, nothing over 1000ms except marquee/bob loops. No scroll-jacking; all scroll reveals are one-shot.

---

# PART 5 — LANDING PAGE STRUCTURE (section by section)

1. **Topbar** — transparent over hero wash → condenses to white blur bar on scroll (Antimetal). Logo left (ink Jakarta 800 wordmark + lime dot), centre links (How it works, The sequence, Calculator, FAQ), right: ghost "Log in" + ink pill "Start free month" with lime chip.
2. **Hero** — blueprint grid + icy→lavender aurora wash background, dotted pixel clusters at grid nodes (subtle shimmer). Centred: eyebrow pill ("For home-service contractors" + azure dot), Display-1 headline with `word-reveal` and ONE gradient word — e.g. "Dead quotes are **money** on the table." (gradient on "money"), 2-line sub, primary ink pill CTA + ghost "Try the demo" pill. Below: **hero dashboard mock** (real demo data) in a `--r-xl` white frame on the offset **gradient panel**, `mock-in` entrance, two floating glass badges (`float-bob`): "Reply received — Kitchen remodel" and "Job booked · $12,500" (lime dot). Under the mock: honest facts strip (4 touches · 25 days · your own Gmail · stops when they reply) as 4 mini items with pastel icon chips — no fake logos/testimonials.
3. **Pain wall** — eyebrow pill "The problem", Display-2 "Quotes go quiet. Revenue shouldn't." Then the drifting **question-card wall** (Antimetal): white cards with pastel icon chips and real contractor pain questions ("Sent the estimate… then nothing?", "Too busy on site to chase follow-ups?"), `marquee-drift` rows with edge fades.
4. **How it works** — 3 step cards (Import your old quotes → We write the follow-ups → Replies land on one board), numbered with gradient numeral chips (01/02/03 in Jakarta 800, periwinkle), `blur-rise` stagger, connected by a dotted line that `draw-line`s across on desktop.
5. **The sequence (dark-free "band")** — on a soft aurora-tinted panel (`#EEF1FE` wash, NOT dark): Display-2 "Four touches. Twenty-five days. Zero chasing." + the 4-touch timeline: horizontal dotted line, 4 numbered gradient circles (Day 0/3/10/25), each with a mini email card under it (subject line preview). Line draws, dots `pill-pop` in sequence.
6. **Calculator** — white card, left: two RichSliders (unsold quotes count; average job value) + revival-% RichSlider; right: result panel on icy gradient (`#EAF2FE → #F3F0FE`) with "Sitting idle" (ink) and "You could revive" (azure, `count-up` odometer), `bar-grow` proportion bar (azure + amber segments, Antimetal-style). CTA under results: ink pill "Start reviving — free for a month".
7. **Pricing note** — single centred card: "Your first month is on us." + one line: no card, every feature, then $10/month. (Honest, unchanged pricing facts.)
8. **FAQ** — pipl-style accordion: white rows, hairline borders, periwinkle circle "+" button rotating 45° on open, 300ms height ease. 4–5 honest questions.
9. **Final CTA** — aurora wash panel (`--r-xl`) with Display-2 "Your old quotes are worth money." + ink pill CTA + demo ghost pill.
10. **Footer** — light (NOT pipl's navy): ground bg, ink logo, 3 link columns in muted, bottom hairline + "QuoteRevive — built for home-service pros" line. Optional: one ink-navy block ONLY if Finn wants the pipl footer — default is light per his standing preference.

---

# PART 6 — DASHBOARD STRUCTURE (new theme)

**Shell**
- Background `--ground` with the faintest blueprint grid in the header zone only (app must stay calm for daily use).
- **Left sidebar** (replaces current navy sidebar): WHITE sidebar, 232px, hairline right border — Antimetal's app sidebar is white; pipl's is white too. (The round-4 navy sidebar goes.) Logo top (ink wordmark + lime dot), nav items as full-width rows: 1.5px line icon in a pastel chip (active item: chip fills azure, icon white; row bg `#EEF4FE`, radius 12, ink 700 text; inactive: muted text, hover bg `#F2F6FC`). Items: Dashboard, Quotes, Campaign, Send Center (due-count badge = red pill, white text), Replies, Settings. Bottom: business card (initial avatar in gradient circle, business name, trial line) + Log out row.
- Mobile: sidebar collapses to the existing top icon-row pattern (white bar, icon chips, badge kept) — no horizontal overflow.
- **Topbar:** white, hairline bottom border: view title (Jakarta 800, 22px) left; right: trial chip (lime dot + days left), business name, Log out ghost pill.
- Content max-width 1180px, padding 28px; views animate with `page-in`.

**Dashboard home**
- Row 1 — **one wide stat strip card** (Antimetal Overview pattern): header row "Overview" + date pill; 4 cells with hairline dividers: Quotes tracked (sky chip), Idle pipeline (lilac chip), Emails sent (mint chip), Jobs booked (peach chip) — 40px tabular numerals (`count-up` on first mount), one tiny sub-line each (revived $ in green under Jobs booked).
- Row 2 — **Activity overview (7fr) + Upcoming sends (5fr)**: chart card per Part 3 chart spec (azure sent / periwinkle replies, dotted grid, tooltip card, draw-in on mount); Upcoming list rows: gradient initial-avatar circles, name + job type, due label right (Overdue red / Today amber / date muted) + "Touch N of 4" caption.
- Row 3 — **Needs attention** slim card only when touches are due: amber dot, "N follow-ups due", accent pill button → Send Center. Empty states: dashed-border card, pastel chip icon, one line + one button (sample-data load stays).

**Quotes view** — toolbar card (search input w/ floating label behaviour compact variant, status filter segmented pills, Import CSV + Add quote buttons); table in a white card: rows 56px, hover lift tint `#F7FAFE`, status pills (dot style, Part 3), amount tabular right-aligned; import report as soft tinted banners (existing).

**Campaign view** — left: 4 template editor cards stacked (Day chips as gradient numbered circles), floating-label inputs for subject, textarea body; right (sticky): live preview card on gradient-frame treatment + Launch button (accent pill) + queue summary. After launch: queue grouped by due date with `pill-pop` stagger on first render.

**Send Center** — due list as cards: customer avatar-initial, touch chip ("Touch 2 of 4"), subject preview, actions: "Open in Gmail" (accent pill), "Copy" (ghost), "Mark sent" (ink pill w/ lime chip). Sent items collapse into a muted list below. Empty state: pastel bell chip + "All caught up".

**Replies view** — board columns or list (keep current list logic): reply cards with status segmented control (New / Interested / Not now / Booked) as pill track; Booked flips the card's left border lime and adds revived $ (count-up).

**Settings view** — profile form card (floating labels, two-column), booking link + reply-to fields, data card (Export / Import backup buttons), danger zone (delete all) in a soft red-tinted card. Local-data honest note kept.

**Auth (login/register)** — centred card on aurora wash + blueprint grid, gradient-frame, floating-label fields, ink pill submit with lime chip, demo button as ghost pill with azure dot.

---

# PART 7 — IMPLEMENTATION NOTES

- **CSS-first motion:** `word-reveal`, `fade-up`, `blur-rise`, `mock-in`, `float-bob`, `bar-grow`, `pill-pop`, `card-hover`, toggles and accordion are pure CSS (keyframes + transitions + an `.in` class). Scroll reveals need ONE tiny IntersectionObserver hook (~20 lines) adding `.in` — the only new JS for landing motion.
- **JS-needed:** `count-up` (one rAF helper, ~25 lines, reused by calculator + stats), chart line draw (set stroke-dasharray from path length on mount — inline in the existing chart component), RichSlider bubble positioning (already exists — restyle only), marquee (pure CSS keyframes on duplicated row content).
- **No new libraries.** Fonts: Plus Jakarta Sans + Manrope already loaded — v4 keeps both (Antimetal's Inter Tight feel is approximated with Jakarta's tight tracking at display sizes; if Finn wants the exact Antimetal cut later, swapping display family to Inter Tight is a one-variable change — flag it, don't do it silently).
- **Files touched in build (expected):** `app/globals.css` (token swap + new keyframes/utilities), `app/page.tsx` (markup/class changes only), `app/layout.tsx` (unchanged unless font change is approved). **`app/lib.ts` stays byte-identical** — all logic, Supabase sync, tests (116) unaffected.
- **Supabase note:** the wiring work (cloud auth/data) is design-neutral — v4 classes must be applied to whatever the current page.tsx structure is at build time; re-check git state before starting the build round.
- **Verification for the build round:** grep proof of zero ✓/✔ characters, served-CSS check for new tokens (`#141433`, `#C6F135`, aurora gradient), build clean, 116/116 tests, live HTML check for the word-reveal headline + gradient panel markers.
- **Risks / watch-outs:** (1) lime is a spark, not a surface — if it spreads, the design turns toy-like; cap it at button chips, booked/revived accents, live dots. (2) Blueprint grid must stay hairline-faint or it fights the text. (3) Gradient panels: max 2 per viewport. (4) Word-reveal must not delay LCP text paint on slow phones — cap total headline animation at ~1.1s and render text in DOM normally (animation is enhancement only).

*Blueprint prepared 2026-11-17 from Finn's three reference videos. No code was changed.*

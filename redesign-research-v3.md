# QuoteRevive UI Redesign — Round 3 Research

Date: 2026-11-16. Trigger: Finn's feedback on the Round 2 "Ledger & Hi-Vis" design.

## Finn's 5 complaints (verbatim, paraphrased)

1. The black/dark colour is not good — make it better (light/bright).
2. The font (Bricolage Grotesque) is not good — use a genuinely better font.
3. Do not use check/tick (✓) icons — they don't look good.
4. The calculator slider is too simple.
5. The forms are too simple.
Plus: take design ideas from the Dribbble reference video he supplied.

## 1. Reference video analysis (primary guide)

Source: `https://cdn.dribbble.com/userupload/45813364/file/31ce7d6b5df62785a06836e34d072272.mp4`
Downloaded to /tmp (18.3 MB, 9.5 s, 1600×1200), frames extracted with ffmpeg at 2 s
intervals (5 frames) and inspected visually. It is a Dribbble presentation video for
**"FluentAI"**, a B2B sales-data SaaS. What the design in the video actually does:

- **Light, bright surfaces.** The product UI itself is white and very light warm-grey
  cards with hairline borders and huge, soft, diffused shadows, floating with generous
  whitespace. Very large corner radii (~24–32 px on cards). (The dark charcoal behind
  the cards is only the Dribbble presentation stage, not the site's own theme.)
- **Typography.** One bold, rounded grotesque sans used at oversized sizes with tight
  letter-spacing and sentence case ("good tools drive growth", "All you need to reach
  the right people — powered by AI"). Secondary words are set in medium grey inside the
  same headline ("productivity" in grey). Small grey captions sit under huge numerals
  ("2.3B+" / "120M+").
- **Inline icon chips inside the headline.** The signature move: the "oo" of "good" is
  replaced by two circular gradient badges (hot-pink and azure, white glyphs inside),
  and a small red rounded-square app-icon chip sits inline in "drive • growth". A big
  rotated coral-red pill sticker ("Watch" + play button) overlaps the hero.
- **Colourful app-icon chips as the accent system.** Features (Prospector, Job Changes,
  CRM, Data Enrichment, AI Research) each get a small rounded-square gradient glyph —
  blue, pink, red, yellow, green, purple — one consistent filled style, used sparingly
  on white. Nothing else is heavily coloured; text is near-black on white.
- **Components.** Bento grid of white cards; circular medallions for logos/avatars;
  overlapping avatar stacks with a "+ joined" count; tiny pill badges ("✦ Discover us");
  dotted-grid texture inside cards; email rows with small coloured status dots; tiny
  green/red percentage pills; pill buttons — dark pill primary ("Get a demo",
  "Start for free", "Try Now") and light-grey pill secondary ("Request a demo").
- **Motion feel.** Cards glide in with soft parallax and a slight 3D tilt of whole
  panels, staggered entrances, playful floating stickers. Friendly, premium, "alive"
  — but the surfaces stay calm and light.

### How the video's language maps to QuoteRevive Round 3

- Adopt: light warm off-white ground, white bento cards, big soft shadows, 22–26 px
  radii, oversized tight-tracked headline with **inline gradient icon chips**, grey
  secondary word in the headline, colourful rounded-square glyph chips for steps /
  sequence / facts, avatar-style initial medallions in the product mock, dotted
  texture, pill buttons, soft rise/float motion.
- Deliberate deviation: the video's primary pill buttons are black. Finn explicitly
  rejected black, so the primary pill becomes the brand azure instead of black.
  Everything else follows the video.

## 2. Fresh research round (2026 sources)

- **Font pairings for SaaS landing pages, 2026** (morton-digital.com, "Best Fonts for a
  SaaS Landing Page in 2026"): Plus Jakarta Sans is their "premium but warm" pick —
  "reads slightly warmer than Inter and slightly tighter than Manrope. The terminals
  are softer, which lands well on consumer SaaS and B2B that wants to feel
  approachable." Manrope is their single-family-with-character pick — "geometric like
  Inter but with rounder terminals and more personality at heavy weights."
- **Fonts an agency actually ships, 2026** (gleamstudio.design): Manrope — "a geometric
  sans with rounder, friendlier shapes than Inter… works for big bold hero headings and
  at 16px for paragraphs." Plus Jakarta Sans — "geometric but with softened terminals
  that read as approachable rather than clinical… holds up at 14px in dense card
  layouts, where many geometric fonts fall apart."
- **Best Google Fonts for UI** (bruvora.com, Jul 2026): Manrope "has become a startup
  favorite because it reads as 'designed' out of the box"; warns Inter is "the
  reflexive default of every AI tool, template, and rushed rebuild" — a fast way to
  look generic. (Finn rejected Inter-alone before; consistent.)
- **2026 visual direction** (Dribbble/Behance-derived, frontend-design-skills visual
  direction spec): "Clean SaaS" archetype = #FFFFFF bg / dark text / one vivid accent /
  #F9FAFB surface; display type at least 3× body size; section spacing 120–200 px
  signals value; bento grids (Vercel Ship, Notion, Apple) remain the dominant feature
  layout; one icon style, one set.
- **SaaS landing trends 2026** (taqwah.agency; gleamstudio.design): bento grids +
  oversized bold typography are the top two patterns; playful colour systems are
  expanding into growth-stage B2B SaaS; Linear ships light-mode-first marketing pages.

### Font decision

- **Display: Plus Jakarta Sans (700/800)** — soft, rounded terminals; warm and human;
  at ExtraBold it closely matches the rounded grotesque in Finn's reference video.
- **Body/UI: Manrope (400–800)** — rounder and friendlier than Inter, aligned numeral
  heights (good for money figures and tables), reads "designed" at small sizes.
- Rejected this round: Bricolage Grotesque (Finn: not good — too quirky/edged),
  Inter alone (Finn rejected before; also the generic AI default per Bruvora),
  Playfair/serifs (Finn rejected before; wrong voice for contractors), Space Grotesk /
  Sora (techy, edged terminals), IBM Plex Mono (dropped entirely — labels now set in
  Jakarta, uppercase with letter-spacing).

## 3. Chosen direction — "Fluent Light"

- **Ground:** soft warm off-white `#F6F6F2`; **surfaces:** pure white `#FFFFFF` with
  hairline border `#E9E7DF` and large soft shadows; section tint `#EEF1FE` (pale azure)
  for the sequence band. No dark sections anywhere — hero, bands, calculator panel,
  stat cards, topbar and footer are all light.
- **Text:** soft deep warm charcoal `#262219` (never pure black); secondary `#6E675C`;
  faint `#A79E8F`.
- **Primary accent:** vivid azure `#3E63F9` (the video's blue chip), hover `#2F4BD0`,
  soft tint `#EAF0FF`. Primary buttons are azure pills with a soft coloured shadow —
  the video's black pill, recoloured per Finn's feedback.
- **Chip palette (accents only, from the video):** pink `#F43F8E`, azure `#2E9BFF`,
  green `#12B76A`, amber `#FFB020`, violet `#8B5CF6`, coral `#FF5A3C` — used for
  headline chips, step medallions, sequence dots, fact rules, mock avatars/dots.
- **Money semantic:** revived/potential revenue in green `#0E9F5D` on soft green tint.
- **Radii:** cards 22–24 px, pills 999 px, inputs 14–16 px. **Motion:** soft rise
  entrances, gentle float on hero cards, slow light marquee; reduced-motion respected.

## 4. How each complaint is fixed

1. **Black/dark gone** — dark hero, dark sequence band, dark calculator panel, dark
   "revived" stat card, dark topbar and dark footer all replaced with light surfaces;
   text is soft charcoal, never #000.
2. **New fonts** — Plus Jakarta Sans display + Manrope body (see decision above);
   Bricolage, Archivo and IBM Plex Mono removed.
3. **Zero tick icons** — hero checklist now uses small coloured dots; "Copied ✓" and
   "Profile saved ✓" strings removed; status is shown with dots and pills. Final code
   is grepped for ✓ / ✔ / checkmark SVGs to prove none remain.
4. **Rich slider** — custom range component: filled azure track (progress gradient),
   28 px white thumb with azure ring + soft shadow that grows on hover/focus, a
   floating azure value bubble that follows the thumb, step tick marks under the
   track, and min/max labels. Used for both calculator sliders.
5. **Forms rebuilt** — floating labels on text/email/password/number/url inputs
   (label shrinks into the top of the field on focus/fill), boxed caption-label
   selects, generous 16 px padding, soft borders with a 4 px focus glow ring, fields
   grouped in white cards with hints as microcopy, and soft red/green error/success
   banners. Applied to sign-up, log-in, add-quote, settings profile and the campaign
   template editor.

# QuoteRevive UI Redesign — Research Notes (2026-11-16)

## Why the old design was rejected
Finn called the live design "boht basic": Georgia serif headlines + system sans body,
flat white cards, thin borders, no hero composition, no visual hierarchy beyond size.
It read like a default template, not a product.

## What the best SaaS sites do right now (2026 patterns)
Sources: taqwah.agency "SaaS Landing Page Design Trends 2026", aydesign.ai trends
roundup, stan.vision "Best SaaS website design examples 2026", overpass.studio roundup,
Dribbble trending SaaS/dashboard shots (dribbble.com/shots/27386753 AI SaaS Dashboard,
Orizon / UserActive / Masum Parvej dashboard work).

- **Oversized, outcome-first typography is the hero.** Linear/Stripe pattern: one
  declarative headline at display size (60–76px) carries the whole value proposition
  in 6–10 words before any image appears. Type IS the visual.
- **Product-first heroes.** Static illustrations are dead; winners show a real-feeling
  product preview (Linear's animated board, Hatch's dashboard screenshots) inside or
  directly under the hero, framed like a browser window with layered shadows.
- **Bento / modular card grids** for features; big bold numerals for metrics on
  dashboards (Dribbble consensus: large type numbers, restrained neutrals, colour
  used semantically and sparingly).
- **Restrained neutral base + ONE confident accent.** Ramp/Linear: disciplined
  spacing, high-contrast type, colour only where it means something. The generic
  purple/blue "AI gradient" is now a negative signal — it reads as a template.
- **Editorial typography systems** (Cursor/Arc pattern): a display face with real
  character at headlines, a clean grotesque for UI, mono for labels/data — signals
  taste before a single feature is read.
- **Motion that explains, not entertains:** small fades/rises on load, hover lifts,
  nothing cinematic or slow.
- **Proof directly under the hero** (logo walls / stat strips) — but QuoteRevive has
  no customers yet, so our strip uses honest product facts instead of fake proof.

## Competitor / adjacent sites studied

### Jobber — https://getjobber.com
- Hero: short outcome headline "Run a stronger service business", subhead, star-rating
  chips (4.8 App Store / 4.5 Google Play) as instant proof, then a scrolling wall of
  real customer photos/names.
- Big stat band: "92 million+ jobs completed", "100K+ businesses", "12 hours+ saved",
  "44% revenue growth" — huge numerals, tiny labels.
- Does well: trades-native confidence, human photos, stat band rhythm, "No credit
  card required" microcopy under every CTA.

### Housecall Pro — https://www.housecallpro.com
- Hero: "Everything to run and grow your business" + "No credit card required" above
  the fold; bold blue brand, chunky rounded cards, testimonial cards with a hard
  metric per card ("3.3X revenue growth", "15 team users").
- Does well: one metric per proof card; dense but scannable; CTA repetition.

### NiceJob — https://nicejob.com
- Hero: "Stop chasing customers. Start attracting them instead." — italic serif accent
  words inside a big sans headline; rating chips row (4.9 / Google / G2); stat strip
  "2M+ reviews enabled · 20% repeat service rate · 50K+ businesses served".
- Numbered editorial sections (01 Get Found / 02 …) with product visuals.
- Does well: the italic-accent-word headline trick, numbered sections, honest
  checklist microcopy ("✓14-day free trial ✓No credit card required ✓No contract").

### Hatch — https://www.usehatchapp.com (the quote-follow-up / speed-to-lead player)
- Direct competitor for follow-up: "The AI communications platform for the trades".
  Case-study cards lead with one huge result each ("$7M in Rehash Revenue",
  "81% of Leads Booked by AI") over a dark, premium canvas; dashboard screenshots
  with real numbers; FAQ heavy.
- Does well: dark premium canvas + one-result-per-card proof layout; shows the
  actual product UI early.

### GoHighLevel — https://www.gohighlevel.com
- Dark hero, huge counters band (leads generated / appointments booked / sales
  facilitated), feature mega-lists in cards, badge wall.
- Does well: counter band as a section rhythm device. (Its clutter is the cautionary
  tale — we stay minimal.)

## CHOSEN DIRECTION — "Ledger & Hi-Vis" (editorial trades aesthetic)

Deliberately NOT the purple/blue AI-gradient look and NOT default SaaS blue.
Trades-native: think a beautifully typeset invoice/ledger crossed with hi-vis
workwear orange.

- **Palette**
  - Paper (page bg): `#F5F0E6` warm cream
  - Ink (text + dark sections): `#121E18` deep green-black
  - Card: `#FFFDF7` warm white; borders `#E4DCC9` warm sand
  - Accent (primary CTA / highlights): `#FF5A1F` signal orange, hover `#E8480F`
  - Accent soft: `#FFEDE4`; Success/revived: `#178A50`, soft `#E2F3E8`
  - Warn: `#B45309` / `#FBF0DA`; Bad: `#C22F24`
- **Type** (Google Fonts via next/font)
  - Display: **Bricolage Grotesque** 700/800 — characterful grotesque with quirky
    letterforms; reads designed, not generated. Tight tracking (-0.02em), 1.02 lh.
  - Body/UI: **Archivo** 400/500/600/700 — clean workhorse grotesque.
  - Mono accents: **IBM Plex Mono** 500/600 — eyebrows, table headers, stat labels,
    marquee; gives the ledger/invoice feel.
  - Scale: hero clamp(2.9rem, 6.2vw, 4.5rem); H2 clamp(2rem, 4vw, 2.85rem);
    stat numerals 2.1rem Bricolage 800.
- **System**: radius 18px cards / 12px buttons / 999px pills; warm layered shadows
  (`0 1px 2px rgba(18,30,24,.05), 0 16px 40px -16px rgba(18,30,24,.22)`); 8pt spacing;
  hover lift on cards/buttons; fade-rise entrance keyframes + gentle float on hero
  cards; `prefers-reduced-motion` respected.
- **Hero composition**: full-bleed ink section — mono eyebrow pill, huge Bricolage
  headline with the money phrase in italic orange, honest sub, two CTAs, checklist
  microcopy (free month / no card / sends from your Gmail), then a CSS-built product
  preview: browser-chrome window containing a mini QuoteRevive dashboard (stat chips,
  quote rows using the real demo data, sequence progress) with two floating cards —
  "Reply received" and "Job booked · $12,500" — the exact outcome the product sells.
- **Proof strip**: honest product facts only — "4 touches · 25 days", "Sends from
  your own Gmail", "Stops when they reply", "1 month free, then $10/month".
- **Marquee band**: the trades served (from the app's own trade list), mono font,
  orange band — rhythm + audience signal without fake logos.
- **Dashboard**: sticky ink topbar with blur; segmented pill nav in a floating bar;
  stat cards with top accent rule and big numerals; tables with mono uppercase
  headers, row hover, pill status selects; dashed-border empty states; sequence
  timeline dots connected by a line.

## Hard constraints honoured
Presentation layer only — `app/lib.ts` logic, calculator math, CSV import, campaign
behaviour, trial logic untouched. No invented testimonials, customer counts or
revenue claims anywhere; the hero mock mirrors the app's real demo data.

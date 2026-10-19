# Design System Inspired by Starbucks

## 1. Visual Theme & Atmosphere

Starbucks' design system is a **warm, confident retail flagship** wearing the green of their storefront apron across every surface. The canvas alternates between a neutral-warm cream (`#f2f0eb`) and a ceramic off-white (`#edebe9`) — colors that reference actual store materials: the paper napkins, the café walls, the wood finishes — while the signature **Starbucks Green** (`#006241`) anchors the brand moment on hero bands, CTAs, and the Rewards experience. The greens come in four calibrated shades (Starbucks, Accent, House, Uplift) each mapped to a specific surface role, and gold (`#cba258`) appears only around Rewards-status ceremony — not as a general accent.

Typography carries most of the brand voice. The proprietary **SoDoSans** typeface (custom to Starbucks) sits across nearly every surface with a tight `-0.16px` letter-spacing — it reads confident and friendly rather than fashion-magazine severe. What's unusual: the Rewards page switches to a warm serif (`"Lander Tall", "Iowan Old Style", Georgia`) for specific headline moments, subtly echoing the nostalgic feel of a coffeehouse chalkboard. And the Careers pages use a handwritten script (`"Kalam", "Comic Sans MS", cursive`) for personal cup-name touches. Three typefaces, three contexts — the system is disciplined about when each appears.

The surfaces breathe through rounded geometry. Every button is a 50px full-pill. Cards take a 12px rounded-rectangle. The "Frap" floating CTA — a 56px circular order button in Green Accent (`#00754A`) — is the product's signature depth move: it floats bottom-right with a layered shadow stack (`0 0 6px rgba(0,0,0,0.24)` base + `0 8px 12px rgba(0,0,0,0.14)` ambient) and compresses via `scale(0.95)` on press. Elevations are otherwise restrained — card shadows stay at a whispered `0.14/0.24` alpha, global nav gets a quiet three-layer shadow stack. The whole system feels like clean café signage: legible, warm, and never shouting.

**Key Characteristics:**
- Four-tier green brand system (Starbucks / Accent / House / Uplift) each mapped to a distinct surface role — not a single "brand green"
- Gold reserved for Rewards-status moments only; never a general-purpose accent
- Warm-neutral canvas (`#f2f0eb` / `#edebe9`) instead of cold white — references café materials
- Custom proprietary typeface (SoDoSans) with tight `-0.16px` letter-spacing as the universal voice
- Context-specific type switches: serif (Lander Tall) for Rewards, script (Kalam) for Careers cup-names
- Full-pill buttons (`50px` radius) universal, `scale(0.95)` active press the signature micro-interaction
- Floating "Frap" circular CTA (`56px`, Green Accent fill, layered shadow stack) — the product's signature elevation element
- Gift-card surfaces designed as **photographed physical product** — every card is a distinct illustrated photograph rather than a generated graphic
- 12px card radius + whisper-soft shadows keep content cards flat-plus-hint-of-lift
- Rem-based spacing scale anchored at 1.6rem (~16px) = `--space-3`, stepping to 6.4rem (~64px)

**Color-block page rhythm:** Cream hero → White content sections → Dark-green (`#1E3932`) feature band with white text → Cream utility zone → Dark-green (`#1E3932`) footer with gold / white text — an espresso-dark bookend around the bright body.

## 2. Color Palette & Roles

**Source pages analyzed:** homepage, rewards, gift cards, product detail (Pink Energy Drink), product nutrition (Cold Brew).

### Primary

- **Starbucks Green** (`#006241`): The historic brand green. Used on h1 headings, primary section headers on the Rewards page, and as the main brand signal wherever a single dominant color is needed.
- **Green Accent** (`#00754A`): A slightly brighter, more luminous green. The primary filled-CTA color ("Explore our afternoon menu", "See the spring menu") and the fill of the floating Frap circular button.
- **House Green** (`#1E3932`): The deep near-black brand green. Footer surface, feature-band backgrounds, reward-status dark surfaces, and the headline "Free coffee is just the beginning" hero band on Rewards.
- **Green Uplift** (`#2b5148`): A secondary mid-dark green used sparingly on decorative accents and dark-gradient moments.
- **Green Light** (`#d4e9e2`): A pale mint wash used for form-valid-state tints and light green utility surfaces.

### Secondary & Accent

- **Gold** (`#cba258`): Reserved almost exclusively for Rewards-status ceremony — Gold-tier callouts, partnership badges (SkyMiles, Bonvoy), and premium-feeling accents. Never a general-purpose brand color.
- **Gold Light** (`#dfc49d`): Softer gold for background washes on gold-tier sections.
- **Gold Lightest** (`#faf6ee`): Cream-gold page-surface wash used under partnership sections on the Rewards page — ties the gold accent back into the warm neutral system.

### Surface & Background

- **White** (`#ffffff`): Primary card and modal surface. Also card fill on gift-card tiles.
- **Neutral Cool** (`#f9f9f9`): Subtle cool-gray surface used on dropdown menus ("Account" dropdown), form-card wraps, and quiet utility containers.
- **Neutral Warm** (`#f2f0eb`): The warm cream **primary page canvas** for Rewards utility zones and hero bands.
- **Ceramic** (`#edebe9`): A slightly warmer/darker cream for zone separators, soft page-section washes, and Rewards partnership band.
- **Black** (`#000000`): Deep ink reserved for the dark top-of-page CTA strip ("Join now") and high-contrast top-nav sign-in buttons.

### Neutrals & Text

- **Text Black** (`rgba(0, 0, 0, 0.87)`): Primary heading and body text color on light surfaces. Not pure black — an 87%-opacity black that reads warmer.
- **Text Black Soft** (`rgba(0, 0, 0, 0.58)`): Secondary/metadata text on light surfaces.
- **Text White** (`rgba(255, 255, 255, 1)`): Primary heading/body text on dark green surfaces.
- **Text White Soft** (`rgba(255, 255, 255, 0.70)`): Secondary text on dark-green surfaces — footer link descriptions, caption text.
- **Rewards Green** (`#33433d`): A dedicated muted slate-green used only on Rewards-page text blocks — a slightly "dustier" reading color than Text Black that signals "reward surface" without using full Starbucks Green.

### Semantic & Accent

- **Red** (`#c82014`): Error and destructive state (form invalid, destructive actions).
- **Yellow** (`#fbbc05`): Warning state, legacy brand touch.
- **Green Light** (`#d4e9e2` at 33% opacity = `hsl(160 32% 87% / 33%)`): Form valid-field tint background.
- **Red Tint** (`hsl(4 82% 43% / 5%)`): Invalid-field tint on forms.

### Black / White Alpha Ladders

Two parallel translucent scales for overlay and secondary-text use:
- `rgba(0,0,0,0.06)` through `rgba(0,0,0,0.90)` in 10% steps — for dark overlays on light surfaces
- `rgba(255,255,255,0.10)` through `rgba(255,255,255,0.90)` in 10% steps — for light overlays on dark surfaces

### Gradient System

No structural gradient tokens observed. Surface hierarchy is solid-color-block throughout — the system relies on its five-tier cream/green surface palette rather than gradients.

## 3. Typography Rules

### Font Family

- **Primary:** `SoDoSans, "Helvetica Neue", Helvetica, Arial, sans-serif` — Starbucks' proprietary corporate typeface, used across nearly every surface
- **Loading Fallback:** `"Helvetica Neue", Helvetica, Arial, sans-serif` — what users see before SoDoSans loads
- **Rewards Serif:** `"Lander Tall", "Iowan Old Style", Georgia, serif` — used on specific Rewards-page headline moments for a warm editorial feel
- **Careers Script:** `"Kalam", "Comic Sans MS", cursive` — used exclusively for Careers-page "cup name" decorative touches, referencing the hand-written names on Starbucks cups

No OpenType stylistic sets explicitly activated at `:root`.

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display (text-10) | 5.0rem / 80px | 400–600 | 1.2 | -0.16px | Largest Rewards/hero display |
| Jumbo (text-9) | 3.6rem / 58px | 400–600 | 1.2 | -0.16px | Secondary hero headings |
| Hero Large (text-8) | 2.8rem / 45px | 400–600 | 1.2–1.5 | -0.16px | Landing section headlines |
| H1 | 24px | 600 | 36px | -0.16px | Starbucks-Green primary heading |
| H2 | 24px | 400 | 36px | -0.16px | Regular-weight section title in Text Black |
| Body Large | 19px | 400–600 | 33.25px (~1.75) | -0.16px | Hero intro copy, feature-band body |
| Body (text-3) | 1.6rem / 16px | 400 | 1.5 (24px) | -0.01em | Default body copy |
| Small (text-2) | 1.4rem / ~14px | 400–600 | 1.5 | -0.01em | Button label, metadata, form labels |
| Micro (text-1) | 1.3rem / ~13px | 400 | 1.5 | -0.01em | Active float-label state, caption micro-copy |
| Button Label | 14–16px | 400–600 | 1.2 | -0.01em | All pill-button labels |

**Letter-spacing tokens:**
- `letterSpacingNormal`: `-0.01em` (default — tight, characteristic)
- `letterSpacingLoose`: `0.1em` (emphasized caps)
- `letterSpacingLooser`: `0.15em` (uppercase-style labels, extreme emphasis)

**Line-height tokens:**
- `lineHeightNormal`: `1.5` (body)
- `lineHeightCompact`: `1.2` (display/buttons)

### Principles

- **Tight negative tracking (`-0.01em`)** is applied almost universally — the entire product reads slightly compressed, which gives SoDoSans its confident presence without feeling squeezed.
- **Weight shifts carry hierarchy, not size shifts.** H1 and H2 share the same 24px/36px size; only weight (600 vs 400) and color (Starbucks-Green vs Text Black) separate them.
- **Size tokens use rem, anchored to `1rem = 10px`** on this site (via a `font-size: 62.5%` root trick). So `1.6rem` = 16px, `2.4rem` = 24px, etc. The scale is semantic (textSize-1 through textSize-10), not arbitrary pixel values.
- **Context-specific typeface swaps** — serif on Rewards, script on Careers — are deliberate and localized. Never mix them with the primary sans within the same surface.
- **Body text never goes pure black** — it sits at `rgba(0,0,0,0.87)` to match the warm-neutral canvas temperature.

### Note on Font Substitutes

SoDoSans is proprietary to Starbucks (licensed from House Industries, not publicly available). Reasonable open-source substitutes:
- **Inter** (Google Fonts) — similar humanist geometric proportions, wide weight range
- **Manrope** — slightly rounder, similar confident feel
- **Nunito Sans** — warmer, good for a "café" brand substitute

If substituting, verify the tight `-0.01em` / `-0.16px` tracking still reads well; some open-source fonts need `-0.005em` instead.

Lander Tall (the Rewards serif) is custom — open-source substitutes: **Iowan Old Style** (already in fallback), **Lora**, or **Source Serif Pro**. Kalam (Careers script) is available on Google Fonts directly.

## 4. Component Stylings

### Buttons

**1. Primary Filled — "Explore our afternoon menu / Sign up for free"**
- Background: `#00754A` (Green Accent)
- Text: `#ffffff`
- Border: `1px solid #00754A`
- Radius: `50px` (full pill)
- Padding: `7px 16px`
- Font: SoDoSans, 16px, weight 600, letter-spacing `-0.01em`
- Active state: `transform: scale(0.95)` via `--buttonActiveScale`
- Transition: `all 0.2s ease`

**2. Primary Outlined — "Give them a try / Start an order"**
- Background: transparent
- Text: `#00754A` (Green Accent)
- Border: `1px solid #00754A`
- Same radius/padding/active/transition as Primary Filled

**3. Black Filled — "Join now"**
- Background: `#000000`
- Text: `#ffffff`
- Border: `1px solid #000000`
- Radius: `50px`, Padding: `7px 16px`
- Font: 14px, weight 600
- Used on the top-of-page join strip and similar conversion moments

**4. Dark Outlined — "Sign in"**
- Background: transparent
- Text: `rgba(0, 0, 0, 0.87)` (Text Black)
- Border: `1px solid rgba(0, 0, 0, 0.87)`
- Radius: `50px`, Padding: `7px 16px`
- Font: 14px, weight 600

**5. Green-on-Green Inverted — "See the spring menu"**
- Background: `#ffffff`
- Text: `#00754A`
- Border: `1px solid #ffffff`
- Used when the surface behind the button is the dark green House Green band — white button with green text instead of a filled green pill on green bg

**6. Outlined on Dark — "Learn more / Order now"**
- Background: transparent
- Text: `#ffffff`
- Border: `1px solid #ffffff`
- Used on dark-green feature bands for secondary action paired with a white filled CTA

**7. Consent Agree (dark-green variant)**
- Background: `rgb(0, 130, 72)` (a specific variant green used in the cookie-consent module)
- Text: `#ffffff`
- No border, `50px` radius, `7px 16px` padding, 14px / weight 400
- Slightly brighter than Green Accent — reserved for the consent-banner Agree action

**8. Frap — Floating Circular Order Button**
- Background: `#00754A` (Green Accent)
- Icon: `#ffffff`
- Size: `5.6rem / 56px` (standard), `4rem / 40px` (mini variant)
- Radius: `50%` (full circle)
- Fixed bottom-right, `-0.8rem` touch offset for extra tap comfort
- Shadow stack: base `0 0 6px rgba(0,0,0,0.24)` + ambient `0 8px 12px rgba(0,0,0,0.14)`
- Active state: ambient shadow fades to `0 8px 12px rgba(0,0,0,0)`
- This is the product's signature elevation element — it floats over every scrolled surface

**9. Full-width Feedback Tab — "Provide feedback"**
- Background: `#00754A`
- Text: `#ffffff`
- Radius: `12px 12px 0px 0px` (top-rounded only)
- Padding: `8px 16px`
- Font: 14px, weight 400
- Positioned fixed bottom-right-inside, attached to the viewport edge

### Cards & Containers

**Content Card (default)**
- Background: `#ffffff` (`--cardBackgroundColor`)
- Radius: `12px` (`--cardBorderRadius`)
- Shadow: `0px 0px .5px 0px rgba(0,0,0,0.14), 0px 1px 1px 0px rgba(0,0,0,0.24)` (`--cardBoxShadow`)
- Used for: feature cards, menu-item tiles, reward-status panels

**Gift Card Tile**
- Background: illustrated photography fills the card (no solid bg)
- Radius: similar to cards (`~12px`, slightly tighter on corners)
- Shadow: lighter than default card — these are treated like physical cards laid on the canvas
- Labeled by category above the card grid (Spring, Thank You, Birthday, Celebration, Mother's Day, Appreciation, Encouragement, Milestones, Anytime)

**Rewards Status Cards (Rewards page signature)**
- Three-column grid: Bronze / Gold / Silver-ish — each a dark-green (`#1E3932`) panel with:
  - Colored gradient/color header ring
  - Numbered "Level" badge
  - Status title in large SoDoSans weight 600
  - Stars / benefits list in white/translucent-white text
  - Bottom "As you earn more stars…" progression caption

**Partnership Card (Rewards)**
- Background: `#faf6ee` (Gold Lightest) warm-cream surface
- Content: partner logos ("SkyMiles", "Bonvoy") centered, with descriptive text below
- Radius and shadow follow default card spec

**Dropdown Menu (Account dropdown, top-nav)**
- Background: `#f9f9f9` (Neutral Cool)
- Menu items at `24px / weight 400` in Text Black
- No border — just background surface shift against white nav

**Modal**
- Padding: `2.4rem` (`--modalPadding`)
- Top padding: `8.8rem` (`--modalTopPadding`) — leaves room for close button / header
- Combined vertical padding: `11.2rem`
- Radius inherits from card spec (`12px`)

### Inputs & Forms

**Floating Label Input**
- Label floats above the input border when focused/filled
- Desktop label font size: `1.9rem` default, animates to `1.4rem` when active
- Mobile label font size: `1.6rem` default, animates to `1.3rem` active
- Label horizontal offset: `12px` from left
- Active label translate: up to `-12px` with `-50%` Y translation
- Field padding: `12px`
- Form horizontal padding: `1.6rem`
- Validation: valid-field gets `rgba(green-light, 0.33)` tint; invalid-field gets `rgba(red, 0.05)` tint
- Transition: `0.3s option-label-marker-expansion cubic-bezier(0.32, 2.32, 0.61, 0.27)` on checked-input

**Option Icon (checkbox/radio)**
- Padding: `3px` inner
- Uses the checked-input cubic-bezier animation above (a slightly "springy" 2.32 overshoot curve)

### Navigation

**Global Nav (top bar)**
- Fixed position with progressive heights: `64px` xs → `72px` mobile → `83px` tablet → `99px` desktop
- Shadow stack: `0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)` — three-layer soft lift
- Left: Starbucks wordmark logo, offsetting by `99px` (md) / `131px` (lg) from left edge
- Primary links inline in SoDoSans weight 400–600: Menu · Rewards · Gift Cards
- Right: Find a store link + Sign in (outlined) + Join now (black filled)

**Sub-nav (second bar, e.g., Rewards internal)**
- Height: `53px` (global subnav) / `48px` (internal subnav)
- Typically horizontal tab group beneath the global nav

**Mobile Nav**
- Collapses to a hamburger drawer below tablet breakpoint
- Frap floating button persists at bottom-right regardless of nav state

### Image Treatment

- **Hero photography**: Product photos (beverages in clear glass with colored backgrounds — coral, sage, warm amber) occupy ~40vw of a split-hero layout; text occupies the other 60vw (`--headerCrateProportion: 40vw` / `--contentCrateProportion: 60vw`)
- **Gift card illustrations**: Each card is a distinct illustrated photograph (painted-feel, hand-drawn-looking, warm color palette). Never generic generated graphics.
- **Rewards ceremony imagery**: Photographs of Starbucks Rewards App screens held in-hand, angled compositions — product-in-context photography.
- **Menu thumbnails**: Square or 4:3 product photography with clean white/cream backdrops, slight soft drop-shadow around the glass.
- **Image fade-in**: `opacity 0.3s ease-in` transition on image load (`--imageFadeTransition`).

### Feature Band (dark-green hero strip)

Full-width `#1E3932` (House Green) band with:
- Left: white headline + subhead + CTA row
- Right: product photography or illustration
- Split ratio ~40/60 or 50/50 depending on section
- White text throughout with `rgba(255,255,255,0.70)` for secondary copy
- CTAs follow Green-on-Green Inverted (white filled) + Outlined on Dark (white outline) pairing

### Expander / Accordion

- Duration: `300ms` (`--expanderDuration`)
- Timing curve: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — a measured ease-out
- Used for FAQ sections on Rewards and gift page

### Cookie Consent Module

Dark-green modal card at top of page with "Agree" (green-filled) and "Manage preferences" (outlined) buttons. Appears on first visit; dismissible.

### Product Detail Components (PDP signature cluster)

A repeating component cluster used on menu product pages (e.g., `/menu/product/40498/iced` for a drink detail, `/menu/product/.../nutrition` for nutrition facts). These extend the component inventory without changing tokens.

**Size Options Selector**
- Horizontal row of 4 cup-icon buttons (Tall / Grande / Venti / Trenta)
- Each item: cup silhouette icon on top, size name below (16/700 in Starbucks-Green), fluid-ounce caption (13/400 in Text Black Soft)
- Active state: a green circular ring outline (`2px solid #00754A`) around the selected cup icon
- Inactive: no ring, same typography
- Full-width row, equal spacing
- Radius of container: `12px` or flat; individual icons are `50%` circular
- Padding: `16px 24px` internal

**Add-in / Milk Select (outlined rectangle)**
- Background: `#ffffff`
- Border: `1px solid #d6dbde` (Input Border)
- Radius: `4px`
- Full-width in its column
- Floating label above top border: "Add-ins" / "Milk" / "Add-ins" — 13/700 in Text Black, uppercase, `0.325px` letter-spacing
- Value displayed centered (e.g., "Ice", "Coconut", "Strawberry Fruit Inclusions scoop"): 16/400 Text Black
- Chevron-down icon right side in Text Black Soft
- Focus: border shifts to Green Accent (`#00754A`)

**Numeric Stepper**
- Embedded inside an Add-in row when a quantity is required (e.g., Strawberry Fruit Inclusions scoop)
- `−` minus button + count number + `+` plus button, all inline right of the label
- Buttons: circular `32×32px` with `1px solid #d6dbde` border, neutral gray icon
- Count number: 16/700 Text Black centered

**Customize Button**
- Background: `#ffffff`
- Text: `#00754A` (Green Accent)
- Border: `1.5px solid #00754A`
- Radius: `50px` (full pill)
- Padding: `14px 40px` (generously larger than default pills — this is a secondary primary action)
- Label: "Customize" with a gold sparkle ✨ icon inset left
- Used for: entering the drink-customization flow after size/milk selection

**Add to Order Button (PDP)**
- Background: `#00754A` (Green Accent)
- Text: `#ffffff`
- Radius: `50px`
- Padding: `14px 32px`
- Pinned top-right of product card and/or aligned right within the store-availability band
- Same scale(0.95) active behavior as other primary CTAs

**Rewards Cost Pill — "200★ item"**
- Background: transparent
- Border: `1px solid #cba258` (Gold)
- Text: `#cba258` (Gold)
- Radius: `50px` (full pill)
- Padding: `4px 12px`
- Content: "200★ item" where `★` is a small filled star glyph — indicates the Rewards Stars required to redeem this item
- Font: Proxima Nova 13/700 with `0.5px` letter-spacing
- Used only on products that are Rewards-redeemable

**Product Description Band**
- Full-width dark-green band (`#1E3932` House Green)
- Contains top-to-bottom:
  1. Rewards Cost Pill (gold) if applicable
  2. Product description body copy in white (16/400/1.5)
  3. Nutritional summary inline ("140 calories, 25g sugar, 2.5g fat") with info-icon tooltip — 14/700 white
  4. "Full nutrition & ingredients list" outlined-white-on-green pill button
- Padding: `32px` vertical
- Appears beneath the primary product header band

**Ingredients / Nutrition Table**
- Two-column layout on the Nutrition page
- Left column: "Ingredients" header + list or "Not available for this item" placeholder text block with an explanatory paragraph in Text Black Soft 14/400
- Right column: "Nutrition" header + label/value rows
- Each row: nutrient label (Proxima Nova 14/400) on the left, value (e.g., "140 calories", "25g", "205 mg**") on the right, separated by a `1px solid #e7e7e7` hairline below
- Footnote for caffeine/asterisk markers in 13/400 Text Black Soft at the bottom
- Reusable pattern for nutrition facts regulation-compliant tables

**Store Availability Selector**
- Appears on dark-green feature band above the size-options row
- Full-width rounded rectangle with transparent-white interior
- Text: "For item availability, choose a store" in white, 14/400
- Right side: chevron-down affordance + shopping-bag SVG icon in white outline
- Radius: `4px`
- Height: ~48px

**PDP Breadcrumb**
- "Menu / Refreshers / Pink Energy Drink" trail above the product title
- Separator: `/` slash character in Text Black Soft
- Current page is unlinked, prior pages are underlined green-accent links
- Font: 14/400 Proxima Nova
- Appears on all PDP pages

**Back Chevron Link (PDP nutrition / detail sub-pages)**
- "← Back" text link above section headings on the nutrition page
- Text in Green Accent (`#00754A`) 14/700 Proxima Nova
- Left chevron `<` in the same green
- Alternative to full breadcrumb on deep sub-pages

## 5. Layout Principles

### Spacing System

Rem-based semantic scale (anchored `1rem = 10px`):

| Token | Rem | Pixels | Typical Use |
|-------|-----|--------|-------------|
| `--space-1` | `0.4rem` | 4px | Tightest inline padding |
| `--space-2` | `0.8rem` | 8px | Small gap, button vertical padding |
| `--space-3` | `1.6rem` | 16px | Default — card padding, outer gutter xs |
| `--space-4` | `2.4rem` | 24px | Section inner spacing, outer gutter md |
| `--space-5` | `3.2rem` | 32px | Major between-section spacing |
| `--space-6` | `4rem` | 40px | Large gaps, outer gutter lg, header crate |
| `--space-7` | `4.8rem` | 48px | Section-to-section spacing |
| `--space-8` | `5.6rem` | 56px | Very large breathing — Frap height |
| `--space-9` | `6.4rem` | 64px | Widest section padding |

**Gutter tokens:**
- `--outerGutter: 1.6rem` (16px, default / mobile)
- `--outerGutterMedium: 2.4rem` (24px, tablet)
- `--outerGutterLarge: 4.0rem` (40px, desktop)

**Universal rhythm constant:** `1.6rem` (16px) appears across every page as the default outer gutter, card padding baseline, and text size 3 body — the system's most frequent spacing unit.

### Grid & Container

- Column width scale: `--columnWidthSmall: 343px` / `Medium: 500px` / `Large: 720px` / `XLarge: 1440px`
- Gift-card grid uses a 3-5-up responsive grid of `~343px` tiles
- Rewards status section: 3-up dark-green panels at `lg+` breakpoints
- Hero: asymmetric split 40% (image) / 60% (content) via `--headerCrateProportion` / `--contentCrateProportion`

### Whitespace Philosophy

Whitespace carries the feeling of "plenty of space in the café." Section padding leans generous (40–64px). Content blocks are separated by whitespace rather than dividers. The cream canvas (`#f2f0eb`) is itself a visual breath between white cards and green feature bands.

### Border Radius Scale

| Value | Use |
|-------|-----|
| `12px` | Cards, modals, menu-item tiles (`--cardBorderRadius`) |
| `12px 12px 0 0` | Full-width feedback tab (top-rounded only) |
| `50px` | All buttons — full-pill radius (`--buttonBorderRadius`) |
| `50%` | Circular icons, Frap floating button, avatar thumbnails |
| Specialty | `3.3333%/5.298%` elliptical for Starbucks-Visa-Card mockups (`--svcRoundedCorners`) |

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Card | `0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)` | Default content cards — a whisper-soft dual-shadow |
| Global Nav | `0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)` | Triple-layer soft lift on the fixed top bar |
| Frap Base | `0 0 6px rgba(0,0,0,0.24)` | Base halo around the floating circular CTA |
| Frap Ambient | `0 8px 12px rgba(0,0,0,0.14)` | Stacked directional ambient — floats the Frap forward |
| Gift Card | Light drop shadow around illustrated photograph | Physical-card feel for gift tiles |
| Starbucks Card (SVC) | `drop-shadow(0 4px 1px rgba(0,0,0,0.11)) drop-shadow(0 0 2px rgba(0,0,0,0.24))` | Stacked SVG drop shadows for Starbucks Card visuals |

**Shadow philosophy:** Whisper-soft, layered over solid — the system never reaches for a single heavy drop shadow. Instead, it stacks 2–3 low-alpha shadows with different offsets to simulate real-world ambient + direct lighting. The Frap button is the most elevated element on any page.

### Decorative Depth

- **No gradient system** — surfaces are solid color-block
- **Color-block banding** carries perceived depth (dark-green bands read as "recessed feature zones" between cream/white body sections)
- **SVG filter shadows** on Starbucks-Card visuals add a slight 3D physicality without a box-shadow

## 7. Do's and Don'ts

### Do
- Use Neutral Warm (`#f2f0eb`) or Ceramic (`#edebe9`) as page canvas instead of pure white — the warm cream is the signature
- Map the green tiers to their intended surface role — Starbucks Green for headings, Green Accent for CTAs, House Green for deep bands, Uplift for decorative
- Keep tracking tight at `-0.01em` / `-0.16px` on SoDoSans across the whole system
- Use 50px full-pill radius on every button without exception
- Apply `transform: scale(0.95)` as the universal button active state
- Reserve Gold for Rewards-status ceremony moments only
- Use SoDoSans for nearly everything; switch to Lander Tall serif only for Rewards editorial headlines; reserve Kalam script for Careers "cup name" moments
- Layer 2–3 low-alpha shadows instead of one heavier drop shadow for elevation
- Use the Frap circular CTA as the persistent floating order entry on every shopping surface
- Let the cream canvas breathe between content cards — use whitespace, not dividers

### Don't
- Don't use pure white as the page canvas — the warm cream temperature is load-bearing
- Don't pick "one brand green" — the four-green system is intentional; using only `#006241` everywhere flattens the brand
- Don't use Gold as a general-purpose accent — it's a Rewards signal only
- Don't square the corners on buttons — the 50px pill is universal
- Don't introduce gradient fills — the system is color-block throughout
- Don't weight-contrast h1 and h2 by size — the hierarchy comes from weight + color (600 Starbucks-Green vs 400 Text Black)
- Don't use pure black for body text — `rgba(0,0,0,0.87)` matches the warm canvas
- Don't skip the `scale(0.95)` active feedback on buttons — it's a signature micro-interaction
- Don't stack single heavy shadows; always layer 2–3 low-alpha ones
- Don't introduce serifs or scripts into the main shopping flow — they belong to Rewards and Careers contexts respectively

## 8. Responsive Behavior

### Breakpoints

Inferred from component width tokens and progressive nav heights:

| Name | Width | Key Changes |
|------|-------|-------------|
| xs | < 480px | Global nav 64px; hamburger menu; single-column layouts; pill buttons full-width |
| Mobile | 480–767px | Global nav 72px; gift-card grid 2-up; card padding tightens |
| Tablet | 768–1023px | Global nav 83px; gift-card grid 3-up; hero split begins to appear |
| Desktop | 1024–1439px | Global nav 99px; gift-card grid 4-up; full asymmetric hero 40/60 |
| XLarge | 1440px+ | Content caps at `--columnWidthXLarge`; gift-card grid 5-up; extra cream margin |

### Touch Targets

- Pill buttons at `7px 16px` padding measure ~32px tall — below 44px WCAG AAA minimum for touch-only surfaces. On mobile, button padding may be visually expanded to meet the minimum.
- Frap floating circular button at `56px` is well above minimum.
- Frap uses `--frapTouchOffset: calc(-1 * .8rem)` to extend tap area 8px beyond visual edge.
- Form float-label inputs grow their label font size on mobile (1.6rem base vs 1.9rem desktop) — easier to tap and read at arm's-length.

### Collapsing Strategy

- **Global nav height scales progressively**: 64 → 72 → 83 → 99px across breakpoints, not a single value
- **Hero split collapses**: 40/60 asymmetric split → stacked (image top, content below) at mobile
- **Gift-card grid**: 5-up → 4-up → 3-up → 2-up → 1-up across breakpoints with adjusted card widths
- **Feature bands**: Stay full-width but text + imagery stack vertically on mobile
- **Outer gutter scales**: 16px → 24px → 40px as viewport grows
- **Rewards 3-column status panels**: Stack to single column on mobile

### Image Behavior

- Hero product photography crops tighter vertically on mobile; content becomes the visual anchor
- Gift-card illustrations preserve aspect ratio; card grid reflows
- `opacity 0.3s ease-in` fade-in transition on image load (prevents jarring pop-in)
- Rewards app-in-hand photography scales proportionally; never stretches

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: "Green Accent (`#00754A`)"
- Primary CTA text: "White (`#ffffff`)"
- Brand heading: "Starbucks Green (`#006241`)"
- Feature band / footer: "House Green (`#1E3932`)"
- Page canvas: "Neutral Warm (`#f2f0eb`)"
- Card canvas: "White (`#ffffff`)"
- Heading text on light: "Text Black (`rgba(0,0,0,0.87)`)"
- Body text on light: "Text Black Soft (`rgba(0,0,0,0.58)`)"
- Body text on dark-green: "Text White Soft (`rgba(255,255,255,0.70)`)"
- Rewards accent: "Gold (`#cba258`)"
- Rewards text: "Rewards Green (`#33433d`)"
- Destructive: "Red (`#c82014`)"

### Example Component Prompts

1. "Create a primary Starbucks CTA pill button with Green Accent (`#00754A`) background, white text 'Explore our afternoon menu', SoDoSans font at 16px weight 600 with `-0.01em` letter-spacing, `50px` border-radius (full pill), `7px 16px` padding. Apply `transform: scale(0.95)` as the active state with a `0.2s ease` transition."

2. "Design a content card with White (`#ffffff`) background at `12px` border-radius, layered shadow `0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)`. Pad contents `16–24px` (`--space-3` to `--space-4`). Place on a Neutral Warm (`#f2f0eb`) page canvas with `16px` gap to siblings."

3. "Build the Frap floating circular order button — `56px` diameter, Green Accent (`#00754A`) fill, white shopping-bag icon centered. Layered shadow: `0 0 6px rgba(0,0,0,0.24)` + `0 8px 12px rgba(0,0,0,0.14)`. Fixed position bottom-right with `-0.8rem` touch offset. Active state collapses the ambient shadow to `0 8px 12px rgba(0,0,0,0)` with `scale(0.95)`."

4. "Build a dark-green feature band — full-width section with House Green (`#1E3932`) background. Left column: white SoDoSans h2 at 24px weight 600, followed by a Text White Soft (`rgba(255,255,255,0.70)`) body paragraph and a CTA row with two buttons (White-filled with Green Accent text for primary, Outlined-on-Dark white border for secondary). Right column: product photography. Split ratio 40/60, stacked vertically below `768px`."

5. "Create a Rewards status card — House Green (`#1E3932`) panel with `12px` border-radius, colored gradient top stripe (Bronze/Silver/Gold tier). Title in SoDoSans 24px weight 600 in white. Benefits list as white bullets with `rgba(255,255,255,0.70)` secondary captions. Bottom progression text in Text White Soft. Stack 3 panels in a grid at `lg+`, single column on mobile."

6. "Design a gift-card tile — card radius matches `12px`, fills with an illustrated photograph (hand-drawn watercolor-painted feel) as the entire surface. Subtle drop shadow makes it feel like a physical card on the cream canvas. Group under a category label ('Spring', 'Thank You', 'Birthday') in SoDoSans 24px weight 400 above the grid."

7. "Create a Starbucks product-detail header — House Green (`#1E3932`) band with breadcrumb 'Menu / Refreshers / Pink Energy Drink' in 14/400 white above the product title in SoDoSans 32/700 uppercase white. Product photograph centered below title. Below photo: a 4-up size selector row — each cup-icon button shows a vertical cup silhouette, size name ('Tall' / 'Grande' / 'Venti' / 'Trenta') in 16/700 white, and fluid-ounce in 13/400 Text White Soft. Selected size wraps the cup icon in a `2px solid #00754A` circular ring."

8. "Build a Starbucks customize flow — under the size selector, 3 stacked outlined-rectangle input rows (white bg, `1px solid #d6dbde` border, `4px` radius). Each has a floating label ('Add-ins', 'Milk', 'Add-ins') above the top border in 13/700 Text Black uppercase. Value centered (e.g., 'Ice', 'Coconut'). Right side: chevron-down in Text Black Soft. For the scoop row, embed a numeric stepper (`−` `1` `+` with circular `32px` outlined buttons). Below all three fields: outlined green 'Customize' pill with gold sparkle icon, `50px` radius, `14px 40px` padding. Pair with a Green Accent filled 'Add to Order' pill in the same row."

9. "Design a Starbucks product description band — full-width House Green (`#1E3932`) below product header. Top: a gold-outlined '200★ item' Rewards Cost Pill (`50px` radius, `4px 12px` padding, gold `#cba258` border and text). Below: product description in white 16/400/1.5. Nutritional inline summary in white 14/700 ('140 calories, 25g sugar, 2.5g fat') with info-icon tooltip. Outlined-white-on-green pill button 'Full nutrition &amp; ingredients list'. 32px vertical padding."

10. "Create a Starbucks nutrition facts table — two-column layout inside a White card. Left column: 'Ingredients' header (24/400 Text Black), followed by ingredient list or 'Not available for this item' placeholder paragraph in 14/400 Text Black Soft. Right column: 'Nutrition' header, then label/value rows (nutrient name left, value right) separated by `1px solid #e7e7e7` hairlines. Typography: labels in 14/400 Text Black, values in 14/700 Text Black right-aligned. Footnote asterisk markers in 13/400 Text Black Soft at the bottom."

### Iteration Guide

When refining existing screens generated with this design system:
1. Focus on ONE component at a time
2. Reference specific color names and hex codes from this document
3. Use natural language descriptions ("warm cream canvas," "four-tier green system") alongside exact values
4. Preserve the 50px pill + `scale(0.95)` active state universally
5. Check that greens are mapped to their correct role (Green Accent for CTA, Starbucks Green for heading, House Green for band)
6. Don't introduce gradients — the system is color-block
7. Keep SoDoSans tracking at `-0.01em` / `-0.16px` across the board

### Known Gaps

- SoDoSans is a proprietary typeface not available on Google Fonts — when implementing publicly, use Inter or Manrope as a substitute and document the swap
- Lander Tall (Rewards serif) is also custom — substitute with Iowan Old Style, Lora, or Source Serif Pro
- Specific per-component animation timings beyond the few documented (`--duration: 0.4s`, `--iconTransition: all ease-out 0.2s`, `--expanderDuration: 300ms`) are not captured for every interactive surface
- Form error-state full styling (red border weight, icon placement) visible on the tint token but not exhaustively extracted
- Careers-page specific components (cup-name card, search radio grid) are referenced in token names but not covered by this extraction
- Starbucks Visa Card / Starbucks-Card (SVC) detailed mockup specs are hinted at by `--svcRoundedCorners` and `--svcShadowFilter` tokens but not fully documented

## 10. 연차 신청함 화면 배치·구성 규칙 (Leave Request Application Layout & Structure)

연차 신청함은 DESIGN.md의 핵심 비주얼 시스템(Neutral Warm Cream 캔버스, House Green 서피스, 50px pill 버튼, Pretendard 폰트)을 기반으로, 직관적인 2-컬럼 포털 워크스페이스 구조를 따릅니다. 본 섹션은 현재 화면의 모든 배치, 구성 요소, 버튼 위치 및 인터랙션 규칙을 규정합니다.

---

### 10.1 전체 레이아웃 구조 (Overall 2-Column Architecture)

1. **2-컬럼 분할 구조**:
   - **좌측 사이드바 (Navigation Sidebar)**: 화면 좌측에 전체 뷰포트 높이(`h-screen`, `sticky top-0`)로 고정 배치되어 네비게이션과 사용자 프로필을 담당합니다.
   - **우측 메인 작업 영역 (Main Workspace)**: 우측 전체를 차지하며 상하 스크롤이 가능한 메인 작업 캔버스입니다.
2. **배경색 및 표면 대비**:
   - **사이드바**: House Green (`#1E3932`) 단색 다크 서피스 적용.
   - **메인 작업 영역**: Neutral Warm Cream (`#f2f0eb`) 웜톤 캔버스 적용 (`min-h-screen flex-1 p-6 sm:p-8 lg:p-10`).
3. **콘텐츠 너비 제한 (Container Constraint)**:
   - 메인 콘텐츠는 최대 가로폭 `max-w-5xl` ~ `max-w-6xl`로 중앙 정렬되어, 대화면에서도 시각적 피로감 없이 편안한 가독 여백을 유지합니다.
4. **브랜드 및 상표 배제 (Brand Neutrality)**:
   - 외부 상표명, 특정 기업 로고, 카페 브랜드 등은 화면에 표시하지 않으며, 순수 시스템 식별 명칭(예: `연차 관리 시스템`)과 중립적인 기하학 아이콘만 사용합니다.

---

### 10.2 좌측 내비게이션 사이드바 (Navigation Sidebar)

- **규격**: 데스크톱 기준 가로폭 `w-64` (256px), 높이 `100vh` 고정, 세로 플렉스 정렬 (`flex flex-col`).
- **상단 머리 영역 (System Header)**:
  - 시스템 아이콘: 반투명 화이트 둥근 사각 박스(`bg-white/10 p-2.5 rounded-xl`) 내 달력/체크 아이콘 배치.
  - 시스템 타이틀: Pretendard 18px Bold 화이트(`text-white`) 텍스트 ("연차 관리 시스템").
  - 서브 텍스트: 12px Text White Soft (`rgba(255, 255, 255, 0.70)`) ("근태 및 휴가 관리").
- **중앙 네비게이션 메뉴 (Navigation Links)**:
  - 세로 방향 메뉴 리스트 (`flex flex-col gap-1.5`).
  - 역할별 메뉴 분기:
    - `신청함` / `내 신청 목록`: 결재함 및 내 연차 신청 목록 (전체 사용자 공통).
    - `일정 (달력)`: 월간 연차 현황 달력 뷰 (팀장 역할 전용).
    - `비밀번호 변경`: 계정 비밀번호 변경 팝업 트리거.
  - **활성(Active) 탭 스타일**: Green Accent (`bg-[#00754A]`) 또는 고대비 반투명 배경(`bg-white/15`), 화이트 텍스트, 모서리 `rounded-xl`, 폰트 굵기 600.
  - **비활성(Inactive) 탭 스타일**: `text-white/70`, 마우스 호버 시 부드러운 배경 반투명 강조(`hover:bg-white/5 hover:text-white`).
- **하단 사용자 프로필 및 로그아웃 카드 (Bottom Profile & Logout Card)**:
  - 사이드바 맨 하단에 고정 (`mt-auto`).
  - **프로필 정보 박스**: 어두운 반투명 카드(`bg-white/5 border border-white/10 rounded-xl p-3.5`).
    - 상단: 사용자 이름 (`이름`) 및 소속 부서 (`부서`) 볼드 표시.
    - 중단: 로그인된 이메일 주소 (`email`, Text White Soft, 12px).
    - 우측/상단 뱃지: 역할 뱃지 (`직원` 또는 `팀장`, 반투명 알약 형태).
  - **로그아웃 버튼**: 프로필 박스 하단에 배치된 로그아웃 액션 버튼. 클릭 시 클라이언트 메모리, 신청 내역, 명단 정보를 즉시 전부 초기화하여 다음 사용자에게 데이터가 잔존하지 않도록 보장.

---

### 10.3 메인 상단 머리 영역 및 액션 버튼 위치 (Page Header & Action CTA)

- **배치**: 가로 양 끝 정렬 (`flex items-center justify-between mb-8 pb-2`).
- **좌측 텍스트 블록**:
  - **페이지 대제목**: Pretendard Bold 28px–32px, House Green (`#1E3932`) 또는 Text Black (`rgba(0,0,0,0.87)`).
    - 팀장: `결재함`
    - 직원: `내 신청`
  - **서브 설명문**: 14px Text Black Soft (`rgba(0,0,0,0.58)`). 현재 페이지의 기능과 안내를 친절하게 기술.
- **우측 액션 버튼 위치**:
  - **직원 화면**: `+ 새 연차 신청` 버튼
    - 위치: 머리 영역 우측 상단.
    - 스타일: Primary Filled CTA Green Accent (`#00754A`), 백색 텍스트, 50px pill (`rounded-full`), 패딩 `10px 22px`, 폰트 14~15px Bold, 클릭 시 `scale(0.95)` 마이크로인터랙션.
    - 동작: 클릭 시 연차 신청 모달 팝업을 중앙에 즉시 엽니다.
  - **팀장 화면**: `새로고침` 버튼
    - 위치: 머리 영역 우측 상단.
    - 스타일: Outlined pill 버튼 (`border border-stone-300 hover:bg-white`).
    - 동작: 연차 신청 데이터 및 통계 목록 즉시 재조회.

---

### 10.4 3개 요약 메트릭 카드 (Summary Metric Cards)

상단 머리 영역 바로 아래에 위치하며, 한눈에 현황을 파악할 수 있는 3열 반응형 그리드(`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8`)를 형성합니다.

1. **처리 대기 (Pending)**: 대기 중인 연차 신청 건수 (시계/대기 아이콘).
2. **승인 완료 (Approved)**: 승인 처리된 연차 건수 (체크/완료 아이콘, Green Accent 강조).
3. **반려 (Rejected)**: 반려 처리된 연차 건수 (경고/반려 아이콘, 로즈/레드 톤).

- **카드 공통 스타일**:
  - 표면: White (`#ffffff`), 모서리 `rounded-[12px]`, 테두리 `1px solid #edebe9`.
  - 그림자: 위스퍼 섀도우 (`0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)`).
  - 내부 패딩: `p-5` (~20px).
  - 내부 요소 배치: 상단에 라벨(13px, Text Black Soft)과 우측 아이콘 배치, 하단에 Pretendard Bold 28px 대형 숫자와 "건" 단위 텍스트 정렬.

---

### 10.5 필터 탭 네비게이션 (Filter Tabs)

- **위치**: 메트릭 카드와 신청 목록 카드 사이에 가로선 구분과 함께 배치 (`flex items-center gap-6 border-b border-[#edebe9] mb-4 px-1`).
- **탭 목록**: `전체`, `대기`, `승인`, `반려`.
- **활성(Active) 탭**: Text Green Accent (`#00754A`), 폰트 굵기 600, 하단에 2px 두께의 Green Accent 언더라인 인디케이터 표시.
- **비활성(Inactive) 탭**: Text Black Soft (`rgba(0,0,0,0.58)`), 마우스 호버 시 본문 텍스트 색상으로 전환.

---

### 10.6 카드형 목록 모양 및 구성 (Card-based Request List Items)

단순 HTML `<table>` 형태를 탈피하고, `참고화면.jpg`의 세련된 독립 카드 리스트 형태(`flex flex-col gap-3`)로 구성합니다.

- **카드 컨테이너**:
  - 표면: 백색 배경(`bg-white`), 모서리 `rounded-[12px]`, 테두리 `1px solid #edebe9`, 패딩 `p-4 sm:p-5`.
  - 인터랙션: 마우스 호버 시 부드러운 테두리 강조 및 미세 리프트 효과 (`transition-all`).
  - 정렬: 가로 양 끝 플렉스 배치 (`flex items-center justify-between gap-4`).
- **좌측 콘텐츠 클러스터 (신청자 정보 & 사유)**:
  - **원형 이니셜 아바타 (Avatar Badge)**:
    - 규격: `44×44px` 정원형 (`rounded-full`), 중앙 정렬.
    - 색상: 연한 세이지 그린 바탕(`bg-[#d4e9e2]`) 위에 짙은 하우스 그린 텍스트(`text-[#1E3932]`).
    - 내용: 신청자 성명(또는 닉네임)의 첫 글자(이니셜)를 굵게 표시 (예: "김", "박", "이").
  - **텍스트 정보 블록**:
    - **상단 타이틀**: **`{신청자 이름}`** · **`{연차 사유}`** (Pretendard Bold 16px, `text-[#1E3932]`).
    - **하단 메타데이터**: `{기간 (M월 D일 ~ M월 D일 또는 당일)}` · `{소속 부서}` · `{신청일}` (13px, Text Black Soft).
- **우측 상태 및 액션 클러스터 (Status & Action Cluster)**:
  - **상태 뱃지 (Status Badge)**:
    - `대기`: 호박색/옐로우 틴트 (`bg-amber-50 text-amber-800 border border-amber-200/60`).
    - `승인`: 페일 민트 틴트 (`bg-[#d4e9e2]/60 text-[#00754A] border border-[#00754A]/20`).
    - `반려`: 소프트 로즈 틴트 (`bg-rose-50 text-rose-700 border border-rose-200/60`).
    - 형태: 알약형 (`rounded-full`), 패딩 `4px 10px`, 폰트 크기 12~13px Bold.
  - **팀장 전용 액션 버튼 (대기 건에만 노출)**:
    - **승인 버튼**: Green Accent (`#00754A`) 채움 버튼, 백색 텍스트, 50px pill (`rounded-full`), 패딩 `6px 14px`, 13px Bold. 클릭 시 즉시 승인 처리.
    - **반려 버튼**: Outlined 로즈 테두리 버튼 (`border border-rose-300 text-rose-700 hover:bg-rose-50`), 50px pill (`rounded-full`), 패딩 `6px 14px`, 13px Bold. 클릭 시 즉시 반려 처리.
  - **상세 버튼**: 중립 Outlined pill 버튼 (`border border-stone-200 text-stone-600 hover:bg-stone-50`). 클릭 시 상세 팝업 모달 호출.

---

### 10.7 모달 팝업 및 자동 닫힘 인터랙션 규칙 (Modals & Dismissal Rule)

1. **오버레이 배경**: 화면 전체를 덮는 딤 오버레이 (`bg-black/40 backdrop-blur-xs`).
2. **모달 창 컨테이너**: 백색 표면 (`#ffffff`), 모서리 `rounded-[16px]`, 내부 패딩 `p-6 sm:p-8`, 최대 너비 `max-w-md` ~ `max-w-lg`, 중앙 정렬 및 깊은 그림자.
3. **직원 연차 신청 모달 (New Request Modal)**:
   - 상단 헤더: "새 연차 신청" 볼드 타이틀 + 우측 상단 둥근 닫기(X) 아이콘 버튼.
   - 입력 폼: 시작일(`start_date`), 종료일(`end_date`), 사유(`reason`).
   - 인풋 스타일: `rounded-xl`, 테두리 `#edebe9`, 포커스 시 Green Accent 포커스 링.
   - 하단 버튼: Outlined "취소" pill 버튼 + Green Accent 채움 "신청하기" 50px pill 버튼.
4. **승인/반려 시 자동 닫힘 필수 규칙 (Auto-dismissal Rule)**:
   - 팀장이 상세 팝업이나 모달 내에서 `승인` 또는 `반려` 버튼을 누르면, **사용자가 우측 상단의 'X' 버튼을 누르지 않아도 즉시 모달 창이 자동으로 닫히고** 화면 목록이 갱신되어야 합니다.

---

### 10.8 팀장 전용 달력 및 반려자 리스트 구성 규칙 (Calendar & Rejected List)

사이드바에서 `일정 (달력)` 메뉴를 선택했을 때 표시되는 화면 구성입니다.

1. **상단 네비게이션**: 이전 달/다음 달 이동 화살표(`ChevronLeft`, `ChevronRight`)와 중앙 `YYYY년 M월` 타이틀, "오늘" 바로가기 버튼.
2. **요일 및 그리드 헤더**: 일, 월, 화, 수, 목, 금, 토 7열 헤더.
3. **월간 달력 날짜 셀**: 6행 그리드, 오늘 날짜는 Accent 서클 링 표시, 당월 외 날짜는 흐리게(`opacity-40`) 감쇄.
4. **일정 칩(Chips) 색상 규칙**:
   - **승인된 일정**: **초록색** 칩 (`bg-[#00754A] text-white` 또는 `bg-[#d4e9e2] text-[#1E3932]`)으로 달력 셀 내 표시.
   - **승인 대기 일정**: **노란색** 칩 (`bg-amber-100 text-amber-900 border border-amber-300`)으로 달력 셀 내 표시.
   - **반려된 일정**: **달력 내부에는 일절 표시하지 않음** (시각적 혼선 방지).
5. **독립된 반려자 전용 리스트 (Rejected List Panel)**:
   - 달력 우측(또는 하단)에 별도의 독립 카드 패널(`반려 내역`)을 마련.
   - 반려 처리된 신청 건들만 명단 형태로 리스트업하여 이름, 반려된 기간, 부서, 사유를 깔끔하게 열람 가능하도록 분리 배치.

---

### 10.9 미인가 사용자 차단 화면 (Unauthorized Member Fallback)

- Supabase `members` 테이블에 등록되지 않은 이메일로 로그인한 경우:
  - 사이드바 네비게이션 및 연차 신청 데이터를 화면에서 전부 은닉.
  - 웜 크림 캔버스 중앙에 단일 경고 카드 렌더링:
    - 안내 문구: **`명단에 없습니다. 관리자에게 등록을 요청하세요`**
    - 액션: 하단에 50px 알약형 "로그아웃" 버튼 단독 제공하여 즉시 세션을 초기화할 수 있도록 지원.

---

### 10.10 디자인 무결성 점검 체크리스트 (Design Integrity Checklist)

- [ ] 메인 캔버스에 차가운 순백색 대신 Neutral Warm Cream (`#f2f0eb`)을 사용했는가?
- [ ] 좌측 사이드바 배경으로 House Green (`#1E3932`)을 일관되게 적용했는가?
- [ ] 주요 액션 버튼(CTA) 및 활성 표시에 Green Accent (`#00754A`)을 사용했는가?
- [ ] 모든 버튼 모서리는 50px 알약형(`rounded-full`)이며, 클릭 시 `scale(0.95)` 마이크로인터랙션을 유지하는가?
- [ ] 카드 컴포넌트는 `rounded-[12px]` 모서리와 whisper-soft 그림자를 준수하는가?
- [ ] Pretendard 웹폰트와 자간 `-0.01em`이 적용되어 있는가?
- [ ] 특정 상표, 카페 브랜드명, 외부 기업 로고가 철저히 배제되어 있는가?
- [ ] 승인/반려 처리 시 모달이 수동 닫기 없이 자동으로 종료되는가?



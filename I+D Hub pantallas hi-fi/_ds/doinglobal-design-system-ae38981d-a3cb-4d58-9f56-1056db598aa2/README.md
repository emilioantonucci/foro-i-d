# doinGlobal Design System

A design system for **doinGlobal** — a 100% online professional-education institution with over a decade of experience offering MBAs, master's degrees, and professional certifications across Iberoamérica. Strategic partners include Universidad de Salamanca, Fundación General de la Universidad de Salamanca, Banco Interamericano de Desarrollo, Cursos Internacionales de la Universidad de Salamanca, and Collège de Paris.

This folder contains brand foundations, color + typography tokens, logo assets, iconography guidance, ready-to-use CSS, and a Website/landing UI kit of React components.

---

## Sources

All foundations here come from official brand assets provided by the doinGlobal team:

- **`uploads/doinGlobal - Brand Manual 2025.pdf`** — v2.25 full brand manual (logo rules, colors, type, web UI kit)
- **`uploads/dG_Portal del alumno_ Esquema de color 2.pdf`** — semantic state colors (error / warning / success / info) from the Student Portal color scheme
- **Logo files** (4 PNGs): `DG-logo original.png`, `DG-logo negro.png`, `DG-logo blanco.png`, `DG_Isologo.png`
- **Fonts**: Helvetica family (TTF/OTF) + Poppins full family (TTF)

---

## Index

| File | What it is |
| --- | --- |
| `README.md` | This file — brand overview, content fundamentals, visual foundations, iconography |
| `SKILL.md` | Agent-skill manifest — entry point when this system is used as a Claude Skill |
| `colors_and_type.css` | CSS variables + semantic type classes (`--dg-*`, `.dg-h1`, `.dg-p`, …) |
| `fonts.css` | `@font-face` declarations for Helvetica + Poppins (self-hosted) |
| `fonts/` | TTF / OTF source files |
| `assets/` | Logos (primary, black, white, isologo) |
| `preview/` | Cards rendered in the Design System tab |
| `ui_kits/website/` | Website / landing page UI kit — React components + live `index.html` |

---

## Content fundamentals

**Voice.** Professional, clear, and close — aimed at building trust with professional audiences across all of Iberoamérica. Formal and neutral in tone, without losing accessibility or warmth. Priority is transmitting **academic credibility, professional rigor, and global vision** — no exaggeration, no empty phrases.

**Language.** Spanish — specifically **neutral Spanish (español neutro)**, no regionalisms and no use of "vos". Never colloquial, never overtly promotional. Technical vocabulary is fine when needed, but always explained simply.

**Point of view.** First person plural — an institutional *"nosotros"*. "En doinGlobal diseñamos propuestas de formación adaptadas a sus necesidades." Addresses the reader as **usted** (implicit — "Le otorgamos…"), never **tú** and never **vos**.

**Casing.** Sentence case for headings and body; only the wordmark uses the distinctive lowercase-doin + uppercase-G pattern (`doinGlobal`). Titles are concise, not shouty.

**Emoji.** Not part of editorial copy. The brand manual itself uses ✅ / ❌ / 🚫 only as in-document markers to flag correct vs. incorrect examples — never in user-facing product surfaces.

**Reinforce brand differentiators.** Actively weave these concepts in: *comunidad global, aprendizaje continuo, certificaciones profesionales, alianzas estratégicas, impacto profesional.*

**CTAs.** Inspiring and direct — motivational but aligned with the value proposition. Formal register.

### Examples (from the brand manual)

| ✅ Correct | ❌ Incorrect |
| --- | --- |
| "En doinGlobal desarrollamos propuestas de formación adaptadas a sus necesidades." | "Te traemos una propuesta increíble para vos." |
| "Impulsa tu crecimiento profesional" | "¡Aprovechá esta promo imperdible!" |
| "Inscríbete ahora" | "Tenemos una súper promo por tiempo limitado" |
| "Le otorgamos un beneficio por inscripción anticipada" | |
| "Beneficio exclusivo por tiempo limitado" | |

---

## Visual foundations

### Color system

The palette is intentionally tight: **black, white, a light gray, and a single accent green.** The manual specifies a strict *chromatic hierarchy* for digital surfaces:

- **85 % white (`#FFFFFF`)** — dominant background on all websites, emails, and landings. Also the color of the primary banner header title in landings/emails.
- **10 % black / dark gray (`#262626`)** — body text, with tonal variations for emphasis or de-emphasis. Also used for buttons and icons.
- **5 % green (`#99CC06`)** — *exclusively* for the highest-priority CTAs (buttons) and small details / icon accents. **Never** allowed to become the dominant color of a product.

The gray `#F4F4F4` is a secondary surface — used behind lower-priority content blocks.

**Semantic / state colors** (from the Portal del Alumno scheme): Error `#C62A2F`, Alert `#FFBA1A`, Success/Completed/Approved `#99CC06`, Info/In-progress `#30587D`, Neutral/Unavailable `#AAAAB4`. Each has a darker pair for emphasis or text-on-light usage.

### Typography

- **Primary — Helvetica.** Body text, UI, most titles. An efficient, sans-serif, rounded, highly-legible workhorse.
- **Secondary — Poppins.** Geometric sans-serif with firm, clean strokes — used for quick-reading titles and display moments where Helvetica would feel neutral.

Scale (from Brand Manual p.19 "UI Kit Web Design"):

| Token | Size | Weight |
| --- | --- | --- |
| H1 | 64 px | Helvetica Bold |
| H2 | 48 px | Helvetica Bold |
| H3 | 40 px (also 18 px as subhead variant) | Helvetica Bold |
| PH1 | 16 / 16 (Bold label + Regular body) | Helvetica |
| PH2 | 16 / 14 (Bold label + Regular body) | Helvetica |

### Layout & surfaces

- **Generous white space.** White dominates; content breathes.
- **Rounded corners.** Buttons are **fully pill-shaped** (`border-radius: 999px`). Containers use a softer moderate radius (`10–16 px`). Cards are conservative — no excessive rounding.
- **Four container styles** from the manual:
  1. **Jerarquía 1** — white fill, thin gray border, dark-gray text, green accents/icons.
  2. **Jerarquía 2** — gray fill (`#F4F4F4`), dark-gray text — for lower-importance content.
  3. **Inactivo / Premium dark** — dark-gray fill (`#262626`), white text, green highlights — for highest-priority content.
  4. **Accent green fill** — white bold/semibold text on green, dark-gray details — **used exceptionally**, rarely.
  5. **Image background** — only short text or icons on photographic backgrounds.
- **Image banners.** Photos always carry a **55 %-opacity black multiply overlay** (`rgba(0,0,0,0.55)`) to guarantee contrast with the white headline on top. Some banners use the same overlay over **black-and-white** versions of the photo for an even more editorial, academic feel.

### Motion, states, shadows

- **Conservative motion.** No bouncy springs, no decorative animation. Short fades and ease-outs (~200 ms) for hover and transitions. Standard easing: `cubic-bezier(0.2, 0, 0, 1)`.
- **Hover states** on buttons use a secondary style (darker fill or outline swap, per the manual's "Botón secundario/hover 1/2").
- **No heavy drop-shadows.** Surfaces are predominantly flat. A very subtle shadow (`0 1px 2px rgba(38,38,38,0.06)`) is acceptable for sticky headers or floating menus. Containers are separated by borders and background color — not elevation.
- **Borders** are hairline gray (`#E8E8E8` / `#D4D4D4`); they define the Jerarquía-1 container style.

### Backgrounds & imagery

- **No gradients as decoration.** The brand is flat-color. The only overlay in use is the black 55 % multiply on photographic banners.
- **No hand-drawn illustrations, no patterns, no textures.** The brand visual vocabulary is photographic + flat color only.
- **Imagery tone.** Professional environments — students, professors, campuses, conferences. Warm daylight or desaturated B&W. Never stocky, never AI-looking.

### Logo & brand element

The **wordmark** (`doinGlobal`) is the primary identity. The capital `G` visually separates "Global," and the `do` is rendered in brand green, turning the wordmark into a short phrase. An additional **isologo / brand element** — an abstraction of the logo — exists and has its own minimum sizes (75 px) and clear-space rules. Minimum width for the full logo is **200 px**. Clear space around any logo = **1× the logo's height**.

**Not allowed:** changing the type hierarchy, recoloring any element of the logo, deformations, added effects, or placing the logo over busy/low-contrast backgrounds.

---

## Iconography

The brand manual does **not** prescribe a specific icon library or custom icon set. Icons appear in the manual as small green-accented glyphs on containers (e.g., WhatsApp, check-marks, slider dots, navigation arrows) — they are **outline-style, single-weight, flat**, and either green-on-white or white-on-dark.

**Our recommendation — and the default for this system:** use **[Lucide](https://lucide.dev)** via CDN. Lucide icons are:

- Outline, 2-px single stroke — matches the brand's restrained visual feel.
- Flat, no color baked in — takes on `currentColor`, so they naturally pick up the brand green (`#99CC06`) for primary accents or `#262626` for neutral use.
- Huge coverage, actively maintained, one-line CDN install.

This is **a substitution** — the brand manual does not prescribe a specific icon set, so Lucide is a reasonable visual-DNA match rather than a literal import. If the team adopts an internal icon library later, swap Lucide out and document it here.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="check-circle" style="color: var(--dg-green); width: 20px; height: 20px;"></i>
<script>lucide.createIcons();</script>
```

**Emoji.** Not used in product UI. Reserved for editorial/internal markers only.
**Unicode glyphs as icons.** Not used — prefer Lucide SVGs.
**Raster icons.** Avoid in new work. All icons should be vector.

---

## Asset manifest

- `assets/logo-primary.png` — wordmark, green `do` + dark `inGlobal`, transparent PNG (1920×1080 canvas)
- `assets/logo-black.png` — monochrome dark version on transparent bg
- `assets/logo-white.png` — monochrome white version for dark backgrounds
- `assets/isologo.png` — the brand element / abstract mark (436×139)

---

## How to use this system

```html
<link rel="stylesheet" href="/path/to/fonts.css">
<link rel="stylesheet" href="/path/to/colors_and_type.css">
```

Then use CSS vars directly (`color: var(--dg-green)`) or semantic classes (`<h1 class="dg-h1">...</h1>`). For higher-level components, import from `ui_kits/website/`.

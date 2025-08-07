## 3commas Design System Guidelines (shadcn/ui + Tailwind v4)

These guidelines codify how we design and build UI in this repo. They are tailored to our current stack: Tailwind CSS v4, shadcn/ui (New York style), Radix primitives, Class Variance Authority (CVA), next-themes for dark mode, and OKLCH colors defined in `app/globals.css`.

### Core Design Principles

- **Typography: 4 sizes, 2 weights**

  - **Size 1 (Headings/Large):** `text-3xl` + `font-semibold`
  - **Size 2 (Subheading):** `text-xl` + `font-semibold`
  - **Size 3 (Body):** `text-base` + `font-normal`
  - **Size 4 (Small/Labels):** `text-sm` + `font-normal`
  - Only these 4 sizes and 2 weights should be used across the app.

- **8pt Grid System**

  - All layout spacing values must be divisible by 8 or 4.
  - Use Tailwind spacing steps: `2, 3, 4, 6, 8, 10, 12` etc. mapping to 8/12/16/24/32/40/48 px.
  - Avoid arbitrary pixel utilities for layout (`p-[3px]`, `gap-[5px]`, etc.).

- **60/30/10 Color Rule**

  - **60% neutral:** `bg-background`, `bg-card`
  - **30% complementary:** `text-foreground`, borders, neutral UI
  - **10% accent (brand):** `bg-primary`, `text-primary`, interactive highlights

- **Clean Visual Structure**
  - Logical grouping, consistent spacing, proper alignment.
  - Simplicity over flashiness; emphasize clarity and function first.

## Foundation

### Current Project Setup Snapshot

- Tailwind v4 is active: `@import "tailwindcss"` in `app/globals.css` and `@tailwindcss/postcss` in PostCSS.
- OKLCH colors and tokens are defined in `:root` and `.dark` in `app/globals.css` and registered via `@theme inline`.
- shadcn/ui (New York) is configured in `components.json` with aliases for `ui`, `components`, and `utils`.
- CVA is used for variants in core components (Button, Badge, Toggle, Sidebar, etc.).
- `data-slot` attributes are consistently used on component parts.
- Dark mode via `next-themes` with `ThemeProvider` and a `ModeToggle` switch.

### Tailwind v4 Conventions We Use

- `@theme inline` for design tokens (colors, radii, fonts, shadows).
- `@custom-variant dark (&:is(.dark *))` for dark styles.
- Container queries (e.g., `@container/...` and `@[...]` range variants) in several components.

## Typography System

### Allowed Sizes & Weights

- Size 1: `text-3xl` + `font-semibold` (primary page headings, hero titles)
- Size 2: `text-xl` + `font-semibold` (section headings, card titles when emphasized)
- Size 3: `text-base` + `font-normal` (body copy, inputs by default)
- Size 4: `text-sm` + `font-normal` (secondary text, descriptions, captions)

Notes

- Prefer `tabular-nums` for numerical data and KPIs. Already used in places (e.g., dashboard cards).
- Avoid `text-xs` in new code. Use `text-sm` for smallest text. If density is necessary, discuss explicitly in review.
- Only two weights: `font-semibold` for headings/emphasis, `font-normal` otherwise.

### Fonts

- The project currently sets `--font-sans` in `app/globals.css` (DM Sans) and also loads Geist via Next fonts in `app/layout.tsx`. To keep a single source of truth, we will standardize on one sans font:
  - Recommended: **Geist** as primary sans across the app.
  - Action: map Tailwind’s `--font-sans` token to Geist.

Suggested update (optional) to consolidate fonts in `app/globals.css`:

```css
@theme inline {
  /* Map Tailwind font tokens to Next font variables */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

## 8pt Grid System

### Spacing Rules

- Use spacing values divisible by 8 or 4.
- Allowed layout spacing steps (examples):
  - `p|m|gap-0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 10 (40px), 12 (48px)`
- Avoid arbitrary pixel spacing (`[3px]`, `[5px]`, `[25px]`, etc.) for layout.
- Border radii, hairlines, and decorative corners may use small constants (e.g., `rounded-[2px]`) if not affecting layout rhythm.

### Examples

- Instead of `p-[3px]` → use `p-1` (4px) or `p-2` (8px)
- Instead of `gap-[5px]` → use `gap-1.5` (6px) or `gap-2` (8px)
- Instead of `rounded-[25px]` → use `rounded-[24px]` or a Tailwind token (`rounded-3xl`) if equivalent

## 60/30/10 Color Rule

### Tokens (already present)

- Light/Dark variables defined in `app/globals.css` for: `--background`, `--foreground`, `--card`, `--muted`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, and chart/sidebars.
- Registered to Tailwind tokens via `@theme inline` as `--color-*` variants, enabling utilities like `bg-primary`, `text-muted-foreground`, etc.

### Application

- Layout backgrounds: `bg-background` (60%)
- Text and neutrals: `text-foreground` + borders (30%)
- Accent: `bg-primary`, `text-primary`, `ring-primary` for CTA emphasis (10%)
- Do not overuse accent beyond primary calls-to-action and critical highlights.

### Accessibility

- Maintain adequate contrast. Use OKLCH values that meet WCAG AA where practical.
- Validate contrast on dark backgrounds especially for `muted-foreground` and disabled states.

## Component Architecture

- Each component exposes a structure/behavior layer (Radix) and a style layer (Tailwind).
- Use **CVA** for variants: define `variant` and `size` enums with sensible defaults.
- Mark structural parts with `data-slot` for targeted styling and overrides.

Patterns we follow

- Buttons: `variant` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and `size` (`sm`, `default`, `lg`, `icon`).
- Forms: Inputs are `text-base` by default and can step down to `text-sm` on MD to fit density (`md:text-sm`), but should not use `text-xs`.
- Sidebar/Navigation: Use data attributes (`data-sidebar` and `data-slot`) for state and slot styling.

## Visual Hierarchy

- Use consistent spacing and alignment to visually group related elements.
- Reserve accent colors and stronger contrast for primary actions and critical content.
- Keep descriptive text smaller and lighter `text-sm text-muted-foreground`.

## Dark Mode

- Dark mode is driven by `.dark` class from `next-themes`. Tokens are defined in `app/globals.css`.
- Enable/disable via `ModeToggle`, default to `system`.
- Use `@custom-variant dark` for style tweaks if needed.

## Container Queries

- Prefer container queries for component-level responsiveness instead of global breakpoints, e.g., `@[250px]/card:text-3xl`.
- Keep typography sizes inside the allowed set even when adapting per container.

## Data Visualization

- Use `--color-chart-1` through `--color-chart-5` for charts.
- Keep chart labels in Size 4 (`text-sm`) and titles in Size 2 (`text-xl font-semibold`).
- Use `tabular-nums` for numerical axes and KPIs.

## Motion & Animation

- Purposeful motion only; prefer short, smooth transitions.
- Defaults:
  - Transition duration: 150–250ms for UI affordances; 300–450ms for larger overlays.
  - Easing: `ease-out` for entrances, `ease-in` for exits. Use `ease-[cubic-bezier(0.4,0,0.2,1)]` if custom.
- Respect reduced motion preferences.

## Technical Implementation Guidance

- Use Tailwind utilities first; avoid custom CSS unless required.
- Keep `@layer base` minimal (reset-like); tokens go under `@theme`.
- Prefer semantic color utilities (`bg-card`, `text-muted-foreground`) over raw colors.
- Use `data-slot` for all public component parts.
- Keep CVA definitions co-located with components and expose their `VariantProps`.

## Known Non‑Compliances To Fix (as of this commit)

Layout spacing and sizes

- `components/ui/tabs.tsx`: `p-[3px]` → use `p-1` (4px) or `p-2` (8px)
- `components/ui/switch.tsx`: `h-[1.15rem]` → use `h-5` (20px) or `h-6` (24px). Keep width in-step too.
- `app/dashboard/chart-area-interactive.tsx`: `h-[250px]` → use `h-64` (256px) or `h-60` (240px)
- `components/ui/drawer.tsx`: `w-[100px]` drag handle → use `w-24` (96px) or `w-28` (112px)
- `components/react-bits/pixel-card.tsx`: `rounded-[25px]` → `rounded-[24px]` or `rounded-3xl`
- `components/ui/tooltip.tsx`: `size-2.5` (10px) arrow → prefer `size-2` (8px) or `size-3` (12px) if visually acceptable

Typography

- Avoid `text-xs` (found in select labels). Use `text-sm` for smallest text.
- Ensure headings and titles conform to the 4-size scale (e.g., `CardTitle` instances should be Size 2 by default unless the design explicitly calls for Size 1).

Decorative exceptions (allowed)

- Small radii or offsets used for purely decorative purposes (e.g., tooltip arrow `rounded-[2px]`, fine transforms) are acceptable if they don’t affect layout rhythm.

## Adoption Plan (Incremental)

1. Typography standardization

   - Replace `text-xs` usages with `text-sm`.
   - Audit headings/subheadings to use Size 1/2 appropriately.

2. Spacing cleanup

   - Replace arbitrary pixel spacing on layout containers with 8/4-compliant classes.
   - Normalize one-off sizes to nearest 8/4 step (see items above).

3. Font consolidation (optional but recommended)

   - Map Tailwind `--font-sans`/`--font-mono` to Geist variables in `@theme`.
   - Remove conflicting base font declarations in `:root` once consolidated.

4. Component variant hygiene

   - Ensure all public components expose CVA `variant`/`size` and use `data-slot`.
   - Keep variant classnames using semantic tokens (no hard-coded colors).

5. Dark mode QA
   - Validate contrast for `muted-foreground`, inputs, and disabled states in `.dark`.
   - Ensure focus rings meet contrast and are consistently applied (`focus-visible:ring-[3px]`).

## Code Review Checklist

Core Principles

- [ ] Uses only 4 font sizes and 2 weights
- [ ] All layout spacing values are divisible by 8 or 4
- [ ] Color usage follows 60/30/10 distribution
- [ ] Elements are logically grouped with consistent spacing/alignment

Technical Implementation

- [ ] OKLCH color variables are used via semantic utilities
- [ ] `@theme` registers tokens; `@layer base` kept minimal
- [ ] Components expose `data-slot` and variants via CVA
- [ ] Dark mode is consistent; adequate contrast maintained
- [ ] Accessibility: focus states, keyboard nav, and contrast verified

Repo-Specific Flags

- [ ] Replaced `p-[3px]` and other arbitrary pixel layout spacings
- [ ] Replaced `text-xs` with `text-sm` where applicable
- [ ] Normalized non-8/4 sizes (e.g., `h-[250px]`, `w-[100px]`, `rounded-[25px]`)
- [ ] Optional: Consolidated fonts to Geist via `@theme` mapping

## References

- shadcn/ui: `https://ui.shadcn.com/docs`
- shadcn/ui v4 Demo: `https://v4.shadcn.com/`
- Tailwind CSS v4 Docs: `https://tailwindcss.com/docs`
- Tailwind v4 Upgrade Guide: `https://tailwindcss.com/docs/upgrade-guide`
- shadcn/ui Design System (Figma): `https://www.figma.com/community/file/1203061493325953101/shadcn-ui-design-system`

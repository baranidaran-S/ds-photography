# DS Photography: colour palettes

The website currently uses **Palette 1 (Black + gold + sindoor red)**.
The other palettes below are saved so they can be tried one by one once the site is finished.

## How to apply a palette

All colours live in `src/app/globals.css`:

1. In the `@theme { … }` block, replace the values of the six colour tokens.
2. In the `:root { … }` block just below it, set the three button variables.

Nothing else needs to change. Every section reads these variables.

| Token | Where it shows |
|---|---|
| `--color-night` | Dark base: shading on hero photos, menu bar after scrolling, phone menu, photo list panel |
| `--color-brand` | Main colour: buttons, logo lotus, thin lines, "colours" headline word, arch outline |
| `--color-brand-light` | Small labels on dark (e.g. "Weddings · Celebrations · Little ones", active photo name) |
| `--color-accent` | Decorative accent: lotus above the headline, photo progress lines, button hover |
| `--color-accent-deep` | Accent for text on the cream section ("Rooted in tradition," and the "Our story" button) |
| `--color-cream` | Ivory text on dark, and the cream section background (keep `#fff8ee` unless noted) |
| `--btn-fg` | Text colour on the main button |
| `--btn-hover-bg` / `--btn-hover-fg` | Colour that fills the button on hover, and its text colour |

---

## 1. Black + gold + sindoor red ✅ live now

Black base, rich flat gold, sindoor red as a small accent. Red and gold is the classic Indian wedding pair; black makes it modern.

```css
--color-night: #0b0a0a;
--color-brand: #d6b26c;
--color-brand-light: #f0ddb5;
--color-accent: #c8102e;
--color-accent-deep: #8e1120;
--color-cream: #fff8ee;

--btn-fg: var(--color-night);
--btn-hover-bg: var(--color-accent);
--btn-hover-fg: var(--color-cream);
```

---

## Gold palettes

### 2. Black + gold

Pure black and gold, no red. The most minimal.

```css
--color-night: #0b0a0a;
--color-brand: #d6b26c;
--color-brand-light: #f0ddb5;
--color-accent: #d6b26c;
--color-accent-deep: #6b5330;

--btn-fg: var(--color-night);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

### 3. Maroon + gold

Deep sindoor maroon with gold. Traditional and warm.

```css
--color-night: #3a0b14;
--color-brand: #d6b26c;
--color-brand-light: #f0ddb5;
--color-accent: #e3bf78;
--color-accent-deep: #6e1423;

--btn-fg: var(--color-night);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

### 4. Emerald + gold

Deep bottle green with gold. Royal and fresh.

```css
--color-night: #0a2620;
--color-brand: #d6b26c;
--color-brand-light: #f0ddb5;
--color-accent: #d6b26c;
--color-accent-deep: #0f4a37;

--btn-fg: var(--color-night);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

---

## Non-gold palettes

### 5. Rani pink

Deep ink black with the hot rani pink of Indian bridal wear. Bold, fashion-forward and rarely used by photographers. Most unique option.

```css
--color-night: #140a12;
--color-brand: #d6246e;
--color-brand-light: #f7b6cf;
--color-accent: #d6246e;
--color-accent-deep: #9c1452;

--btn-fg: var(--color-cream);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

### 6. Peacock & marigold

Deep peacock teal with marigold orange. Festive and fresh; great with haldi and mehendi photos.

```css
--color-night: #05262b;
--color-brand: #f29a2e;
--color-brand-light: #ffd9a6;
--color-accent: #f29a2e;
--color-accent-deep: #0b5560;

--btn-fg: var(--color-night);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

### 7. Plum & blush

Dark plum with soft rose pink. Romantic and gentle; best if newborn and maternity are a big part of the business.

```css
--color-night: #1c0e1a;
--color-brand: #e8b4ae;
--color-brand-light: #f7dcd8;
--color-accent: #e8b4ae;
--color-accent-deep: #6b2a4f;

--btn-fg: var(--color-night);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

### 8. Forest & terracotta

Earthy green-black with terracotta clay. Calm, natural and editorial.

```css
--color-night: #141a15;
--color-brand: #c8643b;
--color-brand-light: #f0c2a6;
--color-accent: #c8643b;
--color-accent-deep: #8e3f22;

--btn-fg: var(--color-cream);
--btn-hover-bg: var(--color-cream);
--btn-hover-fg: var(--color-night);
```

---

## Directions already tried and dropped

- **Timeless Luxe** (ivory `#f7f3ee`, espresso `#2b221d`, champagne `#b8935a`, blush `#eadbd3`; Cormorant Garamond + Jost + Allura): felt like a foreign website.
- **Utsav** (maroon + shiny temple gold, marigold toran garlands, falling petals, saree-border strip): too fully Indian; looked awkward.
- **Shiny yellow gold** (`#d4a24c` gradient buttons) and **beige champagne** (`#c8a97e`): first too flashy, then too dull and muddy.

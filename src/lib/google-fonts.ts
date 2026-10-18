// ─── Google Fonts Loading System ────────────────────────────────────────────
// Loads Google Fonts dynamically via the CSS API, with caching and preloading.

export type FontCategory = "display" | "sans" | "serif" | "mono";

export interface GoogleFontEntry {
  family: string;
  category: FontCategory;
  weights: number[];
  defaultWeight: number;
}

// ─── Curated Font Catalog ───────────────────────────────────────────────────

export const GOOGLE_FONTS: GoogleFontEntry[] = [
  // Display
  { family: "Anton", category: "display", weights: [400], defaultWeight: 400 },
  { family: "Bebas Neue", category: "display", weights: [400], defaultWeight: 400 },
  { family: "Oswald", category: "display", weights: [200, 300, 400, 500, 600, 700], defaultWeight: 400 },
  { family: "Playfair Display", category: "display", weights: [400, 500, 600, 700, 800, 900], defaultWeight: 700 },
  { family: "Abril Fatface", category: "display", weights: [400], defaultWeight: 400 },

  // Sans-serif
  { family: "Inter", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "DM Sans", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Poppins", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Montserrat", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Raleway", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Work Sans", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Nunito", category: "sans", weights: [200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Rubik", category: "sans", weights: [300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Outfit", category: "sans", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },

  // Serif
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900], defaultWeight: 400 },
  { family: "Lora", category: "serif", weights: [400, 500, 600, 700], defaultWeight: 400 },
  { family: "Crimson Text", category: "serif", weights: [400, 600, 700], defaultWeight: 400 },
  { family: "Source Serif 4", category: "serif", weights: [200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
  { family: "Bitter", category: "serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },

  // Monospace
  { family: "IBM Plex Mono", category: "mono", weights: [100, 200, 300, 400, 500, 600, 700], defaultWeight: 400 },
  { family: "JetBrains Mono", category: "mono", weights: [100, 200, 300, 400, 500, 600, 700, 800], defaultWeight: 400 },
  { family: "Fira Code", category: "mono", weights: [300, 400, 500, 600, 700], defaultWeight: 400 },
  { family: "Space Mono", category: "mono", weights: [400, 700], defaultWeight: 400 },
  { family: "Inconsolata", category: "mono", weights: [200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400 },
];

export const FONT_CATEGORIES: { id: FontCategory; label: string }[] = [
  { id: "display", label: "Display" },
  { id: "sans", label: "Sans Serif" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Monospace" },
];

export const WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

// ─── Font lookup helpers ────────────────────────────────────────────────────

const fontMap = new Map<string, GoogleFontEntry>();
for (const entry of GOOGLE_FONTS) {
  fontMap.set(entry.family, entry);
}

export function getFontEntry(family: string): GoogleFontEntry | undefined {
  return fontMap.get(family);
}

// ─── Loading infrastructure ─────────────────────────────────────────────────

const loadedFonts = new Set<string>();
const loadingPromises = new Map<string, Promise<void>>();

/**
 * Load a Google Font by family name. Injects a <link> tag for the Google Fonts
 * CSS API and waits for the font to become available via document.fonts.
 */
export async function loadGoogleFont(
  family: string,
  weights?: number[],
): Promise<void> {
  const key = family;

  // Already loaded
  if (loadedFonts.has(key)) return;

  // Already loading — reuse the in-flight promise
  const existing = loadingPromises.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      // Determine weights to load
      const entry = fontMap.get(family);
      const wts = weights ?? entry?.weights ?? [400, 700];
      const weightStr = wts.join(";");
      const encodedFamily = family.replace(/ /g, "+");

      // Inject <link> for Google Fonts CSS
      const linkId = `gf-${encodedFamily}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@0,${weightStr};1,${weightStr}&display=swap`;
        document.head.appendChild(link);
      }

      // Wait for the font to become available
      // Try loading with the default weight first
      const testWeight = entry?.defaultWeight ?? 400;
      await document.fonts.load(`${testWeight} 16px "${family}"`);

      loadedFonts.add(key);
    } catch (err) {
      console.warn(`Failed to load Google Font "${family}":`, err);
      // Still mark as loaded to avoid infinite retries
      loadedFonts.add(key);
    } finally {
      loadingPromises.delete(key);
    }
  })();

  loadingPromises.set(key, promise);
  return promise;
}

/**
 * Check if a font has been loaded already.
 */
export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family);
}

/**
 * Load all fonts referenced in a DesignSpec before rendering.
 */
export async function loadFontsFromSpec(spec: {
  fonts?: string[];
  textBlocks?: Array<{ fontFamily?: string }>;
}): Promise<void> {
  const families = new Set<string>();

  // From explicit fonts array
  if (spec.fonts) {
    for (const f of spec.fonts) families.add(f);
  }

  // From text blocks
  if (spec.textBlocks) {
    for (const tb of spec.textBlocks) {
      if (tb.fontFamily) families.add(tb.fontFamily);
    }
  }

  if (families.size === 0) return;

  await Promise.all([...families].map((f) => loadGoogleFont(f)));
}

/**
 * Preload the default font set used by the Design Studio toolbar.
 */
export async function preloadDefaultFonts(): Promise<void> {
  await Promise.all([
    loadGoogleFont("Anton"),
    loadGoogleFont("DM Sans"),
    loadGoogleFont("Inter"),
    loadGoogleFont("IBM Plex Mono"),
  ]);
}

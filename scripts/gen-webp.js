/**
 * Image pipeline (prebuild/predev).
 * Reads original client photos from assets-src/photos/ and generates
 * optimized WebP (3 widths) + a JPG fallback into public/img/.
 * Also generates the og-image.jpg (1200x630) social card.
 * Skips files whose outputs are newer than the source (fast re-runs).
 */
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC_DIR = 'assets-src/photos';
const OUT_DIR = 'public/img';
const WIDTHS = [480, 800, 1200];
const OG_SOURCE = 'kanelsnegl.jpg';

mkdirSync(OUT_DIR, { recursive: true });

const isStale = (src, out) => {
  if (!existsSync(out)) return true;
  return statSync(out).mtimeMs < statSync(src).mtimeMs;
};

const sources = readdirSync(SRC_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
let generated = 0;

for (const file of sources) {
  const src = join(SRC_DIR, file);
  const { name } = parse(file);

  for (const w of WIDTHS) {
    const out = join(OUT_DIR, `${name}-${w}.webp`);
    if (isStale(src, out)) {
      await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 75 }).toFile(out);
      generated++;
    }
  }

  // Single JPG fallback for <picture>
  const jpgOut = join(OUT_DIR, `${name}-800.jpg`);
  if (isStale(src, jpgOut)) {
    await sharp(src).resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(jpgOut);
    generated++;
  }
}

// og-image: scrapers don't read WebP, keep it JPG ~1200px
const ogSrc = join(SRC_DIR, OG_SOURCE);
const ogOut = join(OUT_DIR, 'og-image.jpg');
if (existsSync(ogSrc) && isStale(ogSrc, ogOut)) {
  await sharp(ogSrc).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(ogOut);
  generated++;
}

console.log(`[gen-webp] ${sources.length} sources, ${generated} files generated in ${OUT_DIR}`);

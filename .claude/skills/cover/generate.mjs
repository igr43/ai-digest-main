// Генерация обложки через Cloudflare Workers AI в едином стиле дайджеста.
//
// node .claude/skills/cover/generate.mjs <article-slug> "<subject>" [--palette sage|blush|sand|mono] [--crop-top N] [--from <raw.jpg>]
//
// <subject> — только сюжет кадра по-английски (какие предметы в кадре). Стиль и палитра добавляются здесь,
// чтобы все обложки выглядели одной серией. Не дублируй стилевые слова и цвета в <subject>.
// --palette     — одна из PALETTES, по умолчанию sage.
// --crop-top N  — смещение кадра 16:9 сверху в пикселях (0–448). По умолчанию центр.
// --from FILE   — не генерировать заново, а переобрезать уже скачанный исходник.
//
// Ключи: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN из окружения.

import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(join(process.cwd(), 'package.json'));
const sharp = require('sharp');

export const STYLE =
  'Premium lifestyle still-life photograph for a high-end wellness brand, editorial magazine quality, photorealistic. ' +
  'Shot from above at a 45-degree angle, objects casually but deliberately arranged with breathing space between them. ' +
  'Warm natural morning sunlight from a side window, crisp directional light with soft-edged shadows, ' +
  'dappled shadow pattern of leaves and window frames falling across the surface. ' +
  'Tactile matte textures: waffle and terry cotton, ribbed rubber, matte powder-coated metal, linen, ceramic. ' +
  'Restrained tonal palette, slightly muted and desaturated, gentle film-like softness, no glossy plastic look. ' +
  'No text, no letters, no numbers, no logos, no brand marks, no watermark, no frames, no collage.';

// Палитры серии. Одна палитра на кадр, выбирается под тему статьи.
export const PALETTES = {
  sage: 'Palette: sage green and olive objects on warm linen and cream, with a few matte black accents.',
  blush: 'Palette: dusty blush pink and soft white objects on a charcoal surface over light oak wood.',
  sand: 'Palette: sand, beige and warm stone objects on off-white, with a few matte black accents.',
  mono: 'Black and white photograph, high-key, bright soft whites and deep clean blacks, fine grain.',
};

const W = 1024;
const H = 576;

const args = process.argv.slice(2);
const slug = args[0];
const subject = args[1];
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

if (!slug || (!subject && !opt('--from'))) {
  console.error('usage: generate.mjs <article-slug> "<subject>" [--crop-top N] [--from raw.jpg]');
  process.exit(2);
}

let rawPath = opt('--from');

if (!rawPath) {
  const acc = process.env.CLOUDFLARE_ACCOUNT_ID;
  const tok = process.env.CLOUDFLARE_API_TOKEN;
  if (!acc || !tok) {
    console.error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN не заданы в окружении');
    process.exit(3);
  }
  const palette = opt('--palette') ?? 'sage';
  if (!PALETTES[palette]) {
    console.error(`неизвестная палитра "${palette}", есть: ${Object.keys(PALETTES).join(', ')}`);
    process.exit(2);
  }
  const prompt = `${subject.trim().replace(/\.?$/, '.')} ${STYLE} ${PALETTES[palette]}`;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps: 8 }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success || !json.result?.image) {
    console.error(`Cloudflare HTTP ${res.status}: ${JSON.stringify(json.errors ?? json)}`);
    process.exit(4);
  }
  rawPath = join(mkdtempSync(join(tmpdir(), 'cover-')), 'raw.jpg');
  writeFileSync(rawPath, Buffer.from(json.result.image, 'base64'));
}

const meta = await sharp(rawPath).metadata();
const h = Math.round((meta.width * 9) / 16);
const maxTop = meta.height - h;
const top = Math.min(maxTop, Math.max(0, Number(opt('--crop-top') ?? Math.round(maxTop / 2))));

const out = resolve('src/content/blog', `${slug}.cover.webp`);
await sharp(rawPath)
  .extract({ left: 0, top, width: meta.width, height: h })
  .resize(W, H)
  .webp({ quality: 85 })
  .toFile(out);

console.log(`raw: ${rawPath}`);
console.log(`crop-top: ${top} (0–${maxTop})`);
console.log(`saved: ${out}`);

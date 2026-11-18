// Техническая проверка обложки. Визуальную проверку делает агент по чек-листу из SKILL.md.
//
// node .claude/skills/cover/check.mjs <article-slug>
//
// Проверяет: файл существует, формат webp, ровно 1024x576, размер в разумных пределах,
// картинка не пустая (есть детали), в статье прописан cover на этот файл.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(join(process.cwd(), 'package.json'));
const sharp = require('sharp');

const slug = process.argv[2];
if (!slug) {
  console.error('usage: check.mjs <article-slug>');
  process.exit(2);
}

const img = join('src/content/blog', `${slug}.cover.webp`);
const md = join('src/content/blog', `${slug}.md`);
const fails = [];

if (!existsSync(img)) fails.push(`нет файла ${img}`);
else {
  const m = await sharp(img).metadata();
  if (m.format !== 'webp') fails.push(`формат ${m.format}, нужен webp`);
  if (m.width !== 1024 || m.height !== 576) fails.push(`размер ${m.width}x${m.height}, нужен 1024x576`);
  const kb = statSync(img).size / 1024;
  if (kb < 10) fails.push(`файл ${kb.toFixed(1)} КБ — похоже на пустую или битую картинку`);
  if (kb > 400) fails.push(`файл ${kb.toFixed(0)} КБ — слишком тяжёлый для обложки`);
  const { channels } = await sharp(img).stats();
  const spread = Math.max(...channels.slice(0, 3).map((c) => c.stdev));
  if (spread < 12) fails.push(`почти однотонная картинка (stdev ${spread.toFixed(1)})`);
}

if (!existsSync(md)) fails.push(`нет статьи ${md}`);
else {
  const cover = readFileSync(md, 'utf8').match(/^cover:\s*['"]?([^'"\r\n]*)/m)?.[1];
  if (cover !== `./${slug}.cover.webp`) fails.push(`cover в статье = "${cover ?? ''}", нужен ./${slug}.cover.webp`);
}

if (fails.length) {
  console.log('FAIL');
  for (const f of fails) console.log(`- ${f}`);
  process.exit(1);
}
console.log('OK');

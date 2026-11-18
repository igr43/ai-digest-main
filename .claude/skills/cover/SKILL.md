---
name: cover
description: Generate cover image for a digest article via Cloudflare Workers AI in the unified digest style, then verify it
disable-model-invocation: true
argument-hint: [article description]
---

Generate a cover image for the article described below.

Article description: $ARGUMENTS

## Unified style

Every cover in the digest looks like one series: a premium lifestyle still life for a high-end wellness brand. Expensive feel comes from light, a restrained palette and tactile textures — not from a sterile studio backdrop.

The style was derived from the user's references (Pinterest-style fitness flat lays, 2026-11-18):

- **Light.** Warm natural sunlight from a side window. Directional, with soft-edged but visible shadows. Dappled shadows of leaves and window frames across the surface. Never flat studio light, never neon or colored gels.
- **Palette.** One muted tonal family per frame plus a deep dark accent. Slightly desaturated, matte, gentle film-like softness. No saturated rainbow mixes, no glossy plastic.
- **Composition.** Still life shot from above or at about 45°, objects arranged casually but deliberately, with breathing space between them. All key objects fully inside the frame.
- **Textures.** Waffle and terry cotton, ribbed yoga mats, matte rubber and powder-coated metal, linen, ceramic, eucalyptus leaves.
- **Mood.** Calm morning routine, lived-in but tidy. Aspirational, not sporty-aggressive.
- No text, letters, numbers, logos, brand marks or watermarks. No collages, no split screens, no illustration or 3D render look.

Not part of the style: dark low-key gym interiors and food shot on black slate. They split the series into two moods.

The style text lives in `STYLE` inside `generate.mjs` and is appended to every prompt automatically. Do not restyle covers per article; change `STYLE` only on purpose, for the whole digest.

### Palette

Pick one with `--palette`, matching the topic. Rotate so neighboring articles don't all share one palette.

| Palette | Look | Fits |
|---|---|---|
| `sage` (default) | Sage and olive on warm linen, matte black accents | Health, longevity, nutrition, recovery |
| `blush` | Dusty pink and white on charcoal over light oak | Training at home, women's fitness, lifestyle |
| `sand` | Sand, beige, warm stone, black accents | Studies, guidelines, general news |
| `mono` | High-key black and white | Strength, bodybuilding, competitions |

### Subject

You write only the subject — which objects are in the frame — in English, one or two sentences. No colors or style words: the script adds them.

- Three to five objects that carry the topic: dumbbells, kettlebell, rolled yoga mat, folded towel, resistance band, ceramic bowl of berries or nuts, eucalyptus sprig, sleep mask, jump rope.
- **Avoid objects that attract text and logos:** bottles, jars, packaging, books, notebooks, phones and tablets with screens, sneakers, branded clothing. If one is unavoidable, write `completely blank, no label, no markings`.
- Dumbbells and plates: `smooth ... with completely blank surfaces and no markings` — otherwise the model writes weights on them.
- Avoid faces and full bodies. If a person is needed, show a fragment: hands, a forearm, a silhouette.
- Add `everything fully inside the frame with space around the edges`.
- No pills, syringes or medical imagery unless the article is about them; no "before/after" bodies.

## Steps

1. Find the article file in `src/content/blog/` that matches the description (search by `title` and `description` in frontmatter). If there is no match or several candidates, ask the user which file to use.
2. Compose the subject following the rules above.
3. Generate. Credentials come from `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; never write them to files or print them.

   ```bash
   node .claude/skills/cover/generate.mjs <article-slug> "<subject>" --palette <sage|blush|sand|mono>
   ```

   The script calls `@cf/black-forest-labs/flux-2-dev` at 1024x576 and saves `src/content/blog/<article-slug>.cover.webp`. It prints the `raw:` path of the source image.

   **Quota.** Workers AI Free gives 10,000 neurons per day (reset 00:00 UTC). One `flux-2-dev` cover costs about 3,000 neurons, so about 3 generations per day. When the quota runs out, requests fail with an error and nothing is charged.
   `--model schnell` switches to `flux-1-schnell` (about 100 neurons, square output cropped to 16:9). It fails the checklist much more often — text on objects, broken objects — so use it only when `dev` is out of quota, and say so in the report.
4. Set `cover: './<article-slug>.cover.webp'` in the article frontmatter. Never put a remote image URL there.
5. Run the technical check:

   ```bash
   node .claude/skills/cover/check.mjs <article-slug>
   ```

   It verifies webp, 1024x576, file size, that the image is not blank, and the `cover` field. Fix anything it reports.
6. Visual check — read the saved image with Read and go through every item:

   - [ ] No text, letters, numbers or pseudo-text anywhere — check labels, insoles, dumbbell heads, mats.
   - [ ] No logos or brand marks: swooshes, three stripes, apples, emblems on shoes, clothes, devices, packaging.
   - [ ] Light and palette match the style: warm side sunlight with visible shadows, one muted tonal family, matte look.
   - [ ] No anatomy or object defects: extra or missing fingers, limbs, floating shoes without legs, melted or merged objects.
   - [ ] The topic is readable from the image without the title.
   - [ ] Style matches: photorealistic, neutral seamless background, soft light, one accent color, plenty of negative space. Compare with one or two recent `*.cover.webp` in `src/content/blog/` — it should look like the same series.
   - [ ] The crop does not cut the subject, heads or key objects at the edges.
   - [ ] Nothing misleading or inappropriate for a health publication.

   If only the crop fails on a `schnell` image, re-crop without regenerating:
   `node .claude/skills/cover/generate.mjs <article-slug> --from <raw path> --crop-top <N>` (smaller N moves the frame up), then read the image again. `dev` images are already 16:9 and are not cropped.

   If anything else fails, adjust the subject to remove the cause and generate again. At most 3 generations per article.
7. Report the file path and which checklist items needed a retry.

## If something fails

- Credentials are missing (exit code 3) → ask the user to set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; do not ask them to paste tokens into the chat.
- Cloudflare returns an error (exit code 4) → report the error as is, do not invent a file. A daily quota error on `dev` → either wait until 00:00 UTC or retry with `--model schnell`; tell the user which.
- Three generations still fail the visual check → keep the best one uncommitted, report which items failed, and let the user decide.

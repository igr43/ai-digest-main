---
name: digest
description: Full digest article publishing cycle - search, write, cover, commit, deploy
disable-model-invocation: true
---

Execute a full digest publishing cycle. Follow each step in order.

## Step 1. Search for news

Use the Tavily MCP server (`tavily_search`, `time_range: "week"`) to search for fitness, bodybuilding, health and nutrition news from the past week.
Search queries: "fitness research news this week", "sports nutrition study", "exercise health study".
Prefer peer-reviewed studies and official recommendations (ACSM, WHO, medical journals). Skip pseudoscience and supplement marketing.
Check `src/content/blog/` and skip topics that are already covered.
Pick the single most newsworthy item. Confirm it with `tavily_extract` on the primary source before writing.

## Step 2. Write the article

Write an article about the selected news item.
Follow the editorial policy from `src/content/blog/CLAUDE.md` strictly:

- Language — Russian. Title up to 80 characters, description — one sentence up to 160 characters, body up to 300 words.
- Frontmatter: `title`, `description`, `pubDate` (today), `source` (link to the primary source), `tags` (1–3).
- Save the article as `src/content/blog/YYYY-MM-DD-slug.md`.

## Step 3. Generate cover image

Read `.claude/skills/cover/SKILL.md` and follow its steps for this article, using a one-sentence description of the article.
Do not call `/cover` through the Skill tool: it has `disable-model-invocation: true`.

## Step 4. Add cover to article

Add the saved cover path to the article's frontmatter: `cover: './<article-slug>.cover.webp'`.
The Stop hook `.claude/hooks/validate-article.js` rejects the article if `cover` is empty.

## Step 5. Commit and push

Direct push to `main` is blocked by a hook. Publish through the `digest/auto` branch.

- `git checkout -B digest/auto`.
- Stage only the article and its cover: `git add src/content/blog/<article-slug>.md src/content/blog/<article-slug>.cover.webp`.
- Commit in Conventional Commits format, description in Russian, first line up to 72 characters:
  `feat(blog): добавить статью о <short topic>`.
- `git push origin digest/auto`. No force push.

## Step 6. Report

Print a summary:

- Article title and file path.
- Cover image path.
- Git commit hash and branch.
- Deployed URL (if known from Vercel). Vercel deploys production only from `main`, so for `digest/auto` give the preview URL or say it is unknown.

## If something fails

- No suitable news found → stop and report, do not write an article.
- Cover generation failed → do not commit the article, report the error.
- Push failed → report the error, do not retry with force.

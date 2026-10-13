# Стек и команды

## Стек

- Astro `^6.1.1` (`src/content/blog/` — статьи в markdown с frontmatter).
- Node `>=22.12.0` (из `engines` в `package.json`).
- Интеграции Astro: `@astrojs/mdx` (MDX в постах), `@astrojs/sitemap` (генерация `sitemap-index.xml` при билде), `@astrojs/rss` (RSS-фид из той же коллекции). Оптимизация изображений — `sharp` через `astro:assets`.
- SSR-адаптера пока нет — чистый статический билд. Если фаза курса потребует серверную логику, понадобится `@astrojs/vercel` и `output: 'server' | 'hybrid'` в `astro.config.mjs`.
- TypeScript strict (`astro/tsconfigs/strict` + `strictNullChecks`).
- Vercel (автодеплой на push в `main`).
- MCP: Tavily (поиск новостей и исследований), Replicate (обложки).

## Команды

- `npm run dev` — локальный сервер на `:4321`.
- `npm run build` — production-сборка.
- `npm run preview` — просмотр сборки.

## Источник правды

Версии, `engines` и npm-скрипты дублируют `package.json`; строгость типов — `tsconfig.json`; интеграции и отсутствие адаптера — `astro.config.mjs`. При расхождении верить коду, а не этому файлу.

# Fitness Digest

Автоматический дайджест о фитнесе, бодибилдинге и здоровом образе жизни. Статьи находит, пишет, иллюстрирует и публикует команда агентов Claude Code — от поиска новости до коммита в репозиторий.

**Сайт:** [ai-digest-main-two.vercel.app](https://ai-digest-main-two.vercel.app)

![Astro](https://img.shields.io/badge/Astro-6-BC52EE?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Claude Code](https://img.shields.io/badge/Claude_Code-агенты-D97757)
![Vercel](https://img.shields.io/badge/Vercel-деплой-000000?logo=vercel&logoColor=white)

Финальный проект курса **Claude Code Basics**: за восемь этапов блог вырос из пустого шаблона Astro в полностью автоматический пайплайн публикации.

## Как устроен пайплайн

Выпуск запускается одной командой `/digest` в Claude Code:

```
/digest
   │
   ▼
news-scout ── поиск через Tavily, фильтр по редполитике → 3 темы с первоисточниками
   │
   ├──► writer ──► cover-artist      ┐
   ├──► writer ──► cover-artist      ├─ три темы параллельно
   └──► writer ──► cover-artist      ┘
                         │
                         ▼
                   page-builder ── проверка статей → коммит в ветку digest/auto → push
                         │
                         ▼
                 Vercel собирает и публикует сайт
```

| Агент | Что делает | Инструменты |
|---|---|---|
| `news-scout` | Ищет свежие новости и исследования, отбрасывает маркетинг, перепечатки и дубли | Tavily MCP |
| `writer` | Пишет статью на 300–500 слов по редполитике со ссылкой на первоисточник | WebFetch |
| `cover-artist` | Генерирует обложку 16:9 (flux-schnell) и вписывает её в frontmatter | Replicate MCP |
| `page-builder` | Проверяет статьи, собирает коммит выпуска и пушит | Bash, git |

Если один из `writer` падает, тема пропускается, остальные публикуются; статья без обложки после двух повторов не публикуется.

### Контроль качества через хуки

| Хук | Событие | Назначение |
|---|---|---|
| `block-main-push.sh` | PreToolUse | Запрещает агентам пушить напрямую в `main` |
| `pipeline-log.sh` | PostToolUse | Пишет каждый вызов инструмента в `logs/pipeline.log` |
| `validate-article.js` | Stop | Проверяет, что у свежих статей заполнены `title`, `description`, `pubDate`, `cover`, `source` |

Редполитика (тематика, требования к источникам, структура статьи) лежит в [`src/content/blog/CLAUDE.md`](src/content/blog/CLAUDE.md), правила для git и коммитов — в [`.claude/rules/`](.claude/rules/).

## Быстрый старт

Нужен Node.js 22.12+.

```bash
git clone https://github.com/igr43/ai-digest-main.git
cd ai-digest-main
npm install
npm run dev
```

Сайт откроется на `http://localhost:4321`.

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер на `:4321` |
| `npm run build` | production-сборка в `dist/` |
| `npm run preview` | предпросмотр сборки |

### Запуск автоматики

1. Создать `.env` с ключами MCP-серверов:

   ```env
   TAVILY_API_KEY=...
   REPLICATE_API_TOKEN=...
   ```

2. Запустить Claude Code с подгруженным окружением и выполнить выпуск:

   ```bash
   ./run-claude.sh
   > /digest
   ```

Конфигурация MCP-серверов в `.mcp.json` написана под Windows (`cmd /c npx ...`); на macOS и Linux замените `command` на `npx`, а `args` — на аргументы без `/c`.

## Структура

```
.
├── .claude/
│   ├── agents/        # news-scout, writer, cover-artist, page-builder
│   ├── skills/        # /digest — оркестрация, /cover — обложка
│   ├── commands/      # /commit
│   ├── hooks/         # контроль push, логирование, валидация статей
│   └── rules/         # git-workflow, стек, правила сжатия контекста
├── src/
│   ├── content/blog/  # статьи (markdown) + CLAUDE.md с редполитикой
│   ├── components/    # Astro-компоненты
│   ├── layouts/       # шаблон статьи
│   └── pages/         # главная, блог, about, RSS
├── docs/              # план пакетной работы над выпусками
├── .mcp.json          # Tavily и Replicate
└── run-claude.sh      # запуск Claude Code с .env
```

## Формат статьи

```markdown
---
title: 'Заголовок статьи'
description: 'Краткое описание в 2–3 предложения.'
pubDate: '2026-03-25'
tags: ['фитнес', 'питание']
cover: 'https://…'
source: 'https://example.com/original-article'
---

Текст статьи, 300–500 слов.
```

## Стек

[Astro](https://astro.build) 6 (MDX, sitemap, RSS) · TypeScript strict · [Claude Code](https://claude.com/claude-code) (субагенты, skills, hooks) · MCP: [Tavily](https://tavily.com), [Replicate](https://replicate.com) · [Vercel](https://vercel.com)

## Автор

Куценко Игорь — [@igr43](https://github.com/igr43)

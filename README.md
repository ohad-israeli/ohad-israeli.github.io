# ohad-israeli.github.io

My personal site — a hub for articles about the projects I'm working on. Built with
[Astro](https://astro.build) and deployed to GitHub Pages via GitHub Actions.

Live at **https://ohad-israeli.github.io**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build into dist/
npm run preview  # serve the built site locally
```

## Add a project article

Every project is one Markdown/MDX file in `src/content/projects/`. The **filename
becomes the URL slug** (e.g. `kafka-demo.mdx` → `/projects/kafka-demo`). Copy the
template and edit the frontmatter:

```bash
cp src/content/projects/example-project.mdx src/content/projects/my-project.mdx
```

```yaml
---
title: "My Project"
description: "One-line summary shown in listings and previews."
date: 2026-06-02
tags: ["kafka", "streaming"]
repo: "https://github.com/ohad-israeli/my-project"  # optional — adds a "View code" button
demo: "https://example.com"                          # optional — adds a "Live demo" button
status: "active"   # wip | active | archived
draft: false       # true keeps it out of the published build
---
```

New articles automatically appear on the home page and `/projects`, get their own
page, and are included in `/rss.xml`. The schema is enforced in
`src/content.config.ts` — the build fails if frontmatter is missing or malformed.

## Supporting repos (the "when needed" convention)

Small projects live entirely in the article. When a project has substantial code,
docs, or assets, give it its own repository instead of bloating this one:

1. Name the repo to match the article slug (article `kafka-demo.mdx` → repo
   `kafka-demo`).
2. Give the repo a `README.md` that links back to the article, plus a `LICENSE` and
   whatever folders it needs (`src/`, `docs/`, `assets/`).
3. Point the article at it with the `repo:` frontmatter field — a **View code**
   button then shows up in the article header.

## Project structure

```
src/
├── content.config.ts        # projects collection schema (zod)
├── content/projects/        # one .md/.mdx per project
├── layouts/                 # BaseLayout, ProjectLayout
├── components/              # Header, Footer, ProjectCard, ThemeToggle
├── pages/                   # index, about, projects/, rss.xml.ts
└── styles/global.css        # dev-focused dark theme + design tokens
```

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes it to GitHub Pages. One-time setup: in the repo's **Settings → Pages**,
set the source to **GitHub Actions**.

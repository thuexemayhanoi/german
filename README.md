# Vietnam Zweirad Guide · German Premium Blog

**Website:** https://de.rentbikehanoi.com/  
**Repository:** https://github.com/thuexemayhanoi/german  
**Production:** GitHub Pages, `main`, **CNAME must stay exactly `de.rentbikehanoi.com`**

A lightweight, German-language editorial site with premium global design, SEO-safe static pages, a shared responsive mega menu and footer, topic hub pages, article layouts, in-browser search, RSS, a publishing pipeline, and a **300-topic editorial plan**.

## Status (initial release)
- 10 published informational hub pages (independent text).
- 3 independently written starter guide pages for site demonstration; review them periodically.
- **300 planned topics**, not 300 published articles, grouped 30 × 10.
- The site has no AI writer running and **uses no paid AI API, no LLM installed on the server, and no automatic content generation**.
- External AIs such as ChatGPT, Claude, Mistral or Gemini can write JSON drafts using the prompts exported below; publishing is a separate human-controlled step.
- Generated pages are committed to repository root for existing GitHub Pages branch deployment. This project does not change Pages configuration.

## Run locally (requires Node.js 22, no npm dependencies)
```bash
node scripts/build.mjs
node scripts/build.mjs --check
node --test tests/site.test.mjs
node scripts/qa.mjs
```

## Editorial workflow – use external AI without API
```bash
node scripts/editorial.mjs status
node scripts/editorial.mjs next --count 5
node scripts/editorial.mjs claim DE-001 --writer Claude
node scripts/editorial.mjs prompt DE-001
# Copy the prompt to the external AI chat; request JSON and save it locally.
node scripts/editorial.mjs validate draft.json
node scripts/editorial.mjs stage draft.json
# Human fact check. Work on non-main branch and approve EXACT ID.
node scripts/editorial.mjs publish .local-drafts/DE-001.json --approve DE-001
node scripts/qa.mjs
# Commit to a review branch; PR + CI; merge only after owner review.
```

Publication is never automatically approved. New topics exist in `data/editorial-plan.json`, live content in `content/posts/*.json`. Once approved, the build creates HTML, adds articles to sitemap, search index, RSS and archive; the footer/header always link only to actual published routes. `.local-drafts` is ignored by Git.

**Important:** Planned topics are hypotheses. Each new article needs native German writing, intent checking, two genuine reviewed sources, proofread facts, SEO QA and owner sign-off. No fabricated prices, licensing requirements or business claims.

See [editorial workflow](docs/EDITORIAL_WORKFLOW.md) and [release checklist](docs/RELEASE_CHECKLIST.md).

## Continuous German AI-chat writing — up to five pairs per handoff
[Continuous writer and publisher runbook](docs/CONTINUOUS_WRITER.md). A connected ChatGPT/Claude/Mistral/Gemini coding chat writes 2, 4, 6, 8 or 10 original German articles per handoff, verifies real sources, scores each >=75, runs `node scripts/factory.mjs check-batch`, then submits one inbox batch. The factory publishes up to five independent QA-passing pairs in one workflow, then Pages deploys. The external AI refreshes main and starts another handoff. GitHub Actions does not write articles or call AI APIs. The queue can resume after session interruption.

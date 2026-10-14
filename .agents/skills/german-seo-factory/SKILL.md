---
name: german-seo-factory
description: Write, verify, QA and publish native-German SEO articles for de.rentbikehanoi.com in repo thuexemayhanoi/german. Covers Matrix rules (DE-001..DE-300), de-DE prose standards, source verification, inbox drafts, factory QA >=75, pair publishing, and recovery. Use whenever writing, reviewing, or publishing German content in this repository.
---

# German SEO Factory — execution skill

Repository: `thuexemayhanoi/german`. Production: `main` → GitHub Pages → https://de.rentbikehanoi.com/. Never edit another repository or site. Preserve CNAME bytes exactly.

## 1. Native German (de-DE)
- Write original, natural German. No machine-translation clones, no copied passages.
- Use neutral, factual advisory tone ("du"-form as the site does). Vary sentence length; no filler repetition between articles.
- Correct umlauts in prose; slugs always transliterate (`ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`), lowercase, hyphen-separated.
- No invented prices, deposits, license rules, laws, inventory, availability, promotions, reviews or business claims. If a claim cannot be verified, drop it.

## 2. Search intent and topical authority
- Each Matrix row (`data/editorial-plan.json`) is one distinct intent. Match the row's `title`, `slug`, `hub`, `keywordHypothesis` and `intent` exactly — never edit them in a draft.
- Write to the intent: `informational` = explain and orient; `commercial` = compare criteria and decision factors without naming unverifiable offers.
- Never publish two articles answering the same question (cannibalization). Check existing `content/posts` and pending inbox before writing.

## 3. Title, headings, meta, slug
- Draft JSON must keep the Matrix title (24–115 chars), slug and hub byte-identical.
- H1 is the title (rendered by build). Use 4–12 H2 `sections`, each heading >= 8 chars, unique within the article.
- `description`: 85–180 chars, contains the core keyword naturally, no clickbait.
- `excerpt`: 80–330 chars, a genuine summary, distinct from `description`.

## 4. Source verification (anti-fabrication)
- Every article needs >= 2 real HTTPS sources on distinct domains, each with `checkedOn` (ISO date, not in the future, actually checked that day).
- Prefer primary/official sources: Auswärtiges Amt, vietnamesische Behörden, vietnam.travel, WHO/UIA for health, ADAC, etc.
- Open and read each cited page before citing it. Verify that the cited page really supports the sentence it is attached to. If unsure, remove the assertion instead of weakening it.
- Sources are labeled clearly in German; no affiliate/tracker URLs, no `example.org`-style placeholders.

## 5. Internal linking and hubs
- 10 topic hubs (`/themen/<hub>/`) group the articles. The article belongs to exactly one hub; the generator builds breadcrumb, hub link and "Weitere Empfehlungen".
- Do not hand-add internal links inside prose; the deterministic build owns navigation. Cross-topic coverage happens through distinct Matrix rows per hub.

## 6. Article JSON and QA >= 75
- Draft file: `content/inbox/DE-XXX.json` with fields: `id`, `hub`, `title`, `slug`, `description`, `excerpt`, `sections` (each `{heading, paragraphs[>=2], bullets?}`), `sources`, optional `date`.
- Body >= 450 meaningful German words (700+ preferred); every paragraph >= 100 chars; bullets >= 12 chars each.
- Score with `node scripts/factory.mjs score content/inbox/DE-XXX.json` (>= 75, zero critical errors). Do not lower thresholds or alter QA code to pass.

## 7. Workflow: write → QA → inbox → factory → Pages
1. Fetch fresh main; read AGENTS.md, this skill, `data/editorial-plan.json`, `content/inbox`, `reports/factory-last-pair.json`.
2. Recover any pending/odd inbox batch before starting a new one.
3. Select the next 2–10 consecutive unpublished non-BLOCKED IDs (prefer 4–6).
4. Write drafts; verify every source and factual claim.
5. Stage drafts in `content/inbox/`; score each; run `node scripts/factory.mjs check-batch`.
6. Push the inbox batch as one fast-forward commit to main. Never push `content/posts`, never edit Matrix statuses, never force-push.
7. Wait for the `German Continuous Pair Factory` workflow (publishes pairs, rebuilds HTML/sitemap/feed/search, runs QA and tests) and the Pages deployment.
8. Verify: IDs PUBLISHED in Matrix, files in `content/posts`, live URL `https://de.rentbikehanoi.com/ratgeber/<slug>/` responds, inbox empty. Then fetch fresh main and repeat.

## 8. Failure and recovery
- QA FAIL / JSON error: read the error, fix the draft at the root cause, re-score.
- Odd or partial inbox: complete the missing draft; never submit a solo article.
- Failed workflow run: read its log; drafts stay in inbox for repair; do not reset the Matrix or skip IDs.
- Session/quota end: state is already durable in GitHub (Matrix + posts + inbox). The next session resumes from fresh main.
- Git push race: refetch and rebase/re-run QA; never force-push.

## 9. Uniqueness and cannibalization control
- Before writing, scan existing titles, keywords and slugs (all 300 Matrix rows + published posts) for overlap.
- No two articles may share the same body; the factory rejects duplicate bodies across the batch and against published posts.
- If a planned row lacks standalone value or evidence, leave it `IDEA`/flag it `BLOCKED`-style (never invent content to fill a slot).

## 10. Post-publish SEO checks
- Live URL returns HTTP 200 and is in `sitemap.xml`; canonical, `lang="de"`, Article + BreadcrumbList schema intact.
- Archive (`/ratgeber/`), search index, RSS and hub page list the article.
- Never claim indexing/ranking/traffic without real GSC data. Do not index unpublished ideas; `robots.txt` and sitemap stay valid.

# Continuous Writer — German pair factory (QA 75; NO AI API)

**Only repository:** thuexemayhanoi/german. **Production:** main, de.rentbikehanoi.com. **Target:** 200 Matrix topics DE-001..DE-200, separately from three original START guides.

## Actual execution architecture
- **External AI chat agent** (ChatGPT Work / Claude / Mistral / Gemini) writes original native-German article JSON, using its own active coding/GitHub session. It must continue from the repository's current state, not its conversation history.
- **GitHub Actions** runs ordinary deterministic Node tooling only. It does NOT call any AI API, cannot think/write prose, cannot wake up a disconnected external AI session, and does not use cron to generate content.
- Push two well-researched JSON drafts into content/inbox/DE-xxx.json on main. The automatic workflow factory-publish.yml inspects and scores both (>=75, zero critical errors), promotes both into content/posts, changes Matrix statuses to PUBLISHED, regenerates HTML/sitemap/feed/search, checks site QA, commits, pushes, and requests a GitHub Pages rebuild.
- The publisher may consume several pending pairs in a single run (up to ten queued drafts). One pair is a publication checkpoint. A failure never authorizes publishing invalid articles or resetting a previous good pair.

## Repeating writer loop (do not stop between pairs)

1. FETCH fresh origin/main; inspect AGENTS.md, data/editorial-plan.json, content/inbox and reports/factory-last-pair.json.
2. RECOVER: if content/inbox contains pending drafts, fix and finish that pending pair FIRST; if a prior publish run failed, inspect its logs. Do not skip or duplicate Matrix IDs.
3. Find next pair: node scripts/factory.mjs status and node scripts/factory.mjs next 2. The IDs must be the next two consecutive unpublished non-BLOCKED rows in Matrix order.
4. WRITE exactly two complete JSON drafts in native German. Keep Matrix id, hub, title, slug exact; 450+ meaningful German words each; 4–12 H2 sections, each with at least two paragraphs of at least 100 characters; strong meta description and excerpt. Use real and independently checked citations; at least two dated HTTPS sources on distinct domains. Do not invent law, license rules, prices, availability, inventory, travel safety assurance or customer reviews. Avoid copy/paste and repetitive filler.
5. QA locally: node scripts/factory.mjs score content/inbox/DE-XXX.json for EACH; node scripts/factory.mjs check for pair. Both must score >=75, with zero critical. Fix small failures yourself; don't lower the threshold.
6. PUSH only these two drafts to main as a fast-forward writer commit (or through a safe connector branch/merge after QA). Do NOT push direct content/posts or change PUBLISHED rows. NEVER force push.
7. WAIT until GitHub workflow "German Continuous Pair Factory" completes successfully and Pages rebuild completes. Verify both IDs PUBLISHED in fresh main, both files in content/posts and canonical URLs included in sitemap. GitHub Actions cannot automatically write the next pair.
8. FETCH main again to incorporate factory commits. Repeat from step 1 IMMEDIATELY: two more articles, QA, push, wait, fetch, continue. Do not stop because a pair or batch succeeded.

## Stop conditions
Only stop writing when all 200 Matrix rows are PUBLISHED, the owner manually says stop, tool/runtime/connectivity/quota truly ends, or there is a material blocking failure that cannot safely be repaired. When a session ends, save state in GitHub (already published articles, pending drafts, Matrix) and resume from fresh main in a new external AI session. No claim of perpetual AI execution without a live session.

## Factory CLI
- node scripts/factory.mjs status — counts and pending queue.
- node scripts/factory.mjs next 2 — next two rows not already pending.
- node scripts/factory.mjs score path/to/DE-xxx.json — single draft grade.
- node scripts/factory.mjs check — validate exactly two inbox drafts.
- node scripts/factory.mjs publish — **GitHub Actions on main ONLY**; manual CLI cannot bypass the publication guard.

## Quality rubric out of 100
- Matrix identity/hub/title/slug: 20.
- Sections, unique H2, full paragraphs: 22.
- Article depth 450+/700+ words and German language signals: 22.
- SEO title, excerpt, description: 16.
- Structured, distinct and checked source references: 20.

PASS requires score >=75 and zero critical. This scores measurable structure, **not factual truth**. The active external writer must verify facts and real cited source content, not just URLs. Two well-formed URLs alone are not research. For legal or safety assertions prefer primary sources. If the writer cannot verify, remove the assertion rather than fabricate.

## Repair/serialization
- No force push or matrix reset. Only the next two Matrix IDs may be published.
- Pending inbox count must be EVEN, between 2 and 10. If odd, fix incomplete submissions instead of silently publishing a solo article.
- Workflow has a single global concurrency group and refetches main before every pair. The publisher push is followed by fresh-main processing of subsequent queued pairs.
- When bot-created commits do not trigger Pages automatically, workflow requests the GitHub Pages rebuild using its built-in GitHub token. This is NOT an AI API. Pages success must still be checked.
- If factory fails before its commit, the original drafts remain in inbox for repair. If another pair was already committed, preserve it and resume the next.
- A failed QA score or critical factual uncertainty is a blocker for that pair; fix the article. Never simply change the rubric to pass.

## One-time instruction for a connected external coding AI
Work **only** in https://github.com/thuexemayhanoi/german. Read current main AGENTS.md and docs/CONTINUOUS_WRITER.md; learn exact Matrix state. The owner authorizes continuous 2-article writing + factory QA75 + publishing. While your session is active, repeat without further permission: fetch main -> recover pending pair -> write next 2 new native German articles with genuine sources -> QA75 -> commit/push both inbox JSON files -> wait for successful factory + Pages -> verify Matrix status and URLs -> fetch fresh main -> write next 2. Continue until 200 articles, owner stop, runtime disconnects or major unrecoverable blocker. Fix small errors independently. Never use paid AI APIs or local LLM runtimes. Don't mark an idea as published without a real page.

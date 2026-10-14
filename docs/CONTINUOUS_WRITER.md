# Continuous Writer — German pair factory (QA 75; NO AI API)

**Only repository:** thuexemayhanoi/german. **Production:** main, de.rentbikehanoi.com. **Target:** 300 Matrix topics DE-001..DE-300, separately from three original START guides.

## Actual execution architecture
- **External AI chat agent** (ChatGPT Work / Claude / Mistral / Gemini) writes original native-German article JSON, using its own active coding/GitHub session. It must continue from the repository's current state, not its conversation history.
- **GitHub Actions** runs ordinary deterministic Node tooling only. It does NOT call any AI API, cannot think/write prose, cannot wake up a disconnected external AI session, and does not use cron to generate content.
- Push an even batch of 2–10 researched JSON drafts into content/inbox/DE-xxx.json on main. The automatic workflow factory-publish.yml inspects and scores both (>=75, zero critical errors), promotes both into content/posts, changes Matrix statuses to PUBLISHED, regenerates HTML/sitemap/feed/search, checks site QA, commits and pushes; GitHub Pages picks up the production commit.
- The publisher may consume several pending pairs in a single run (up to ten queued drafts). One pair is a publication checkpoint. A failure never authorizes publishing invalid articles or resetting a previous good pair.

## Fast external writer loop — 2 to 10 drafts per handoff

The existing GitHub publisher can accept 2, 4, 6, 8 or 10 drafts in one inbox update, then commit exactly **two** articles at a time. This avoids a fresh external writer -> GitHub -> Pages round trip between every pair. The external AI **must** remain in an active chat/coding session; GitHub Actions cannot generate prose.

1. FETCH fresh main, inspect Matrix, reports, content/inbox, running workflow. RECOVER any pending or failed batch before starting another writer submission.
2. SELECT the **next 2–10 consecutive unpublished, non-BLOCKED IDs**, with an EVEN count, using `node scripts/factory.mjs next 10`. Prefer **4–6 articles per handoff** for quality. Use 10 only when the writer can actually research and fact-check all 10. Never skip or duplicate IDs.
3. WRITE original native de-DE article JSON for each exact Matrix id/title/hub/slug. >=450 useful German body words, 4–12 unique H2 sections, each containing 2 substantial paragraphs; correctly sized metadata; 2 real HTTPS references from separate domains with nonfuture checkedOn. **Open and verify each source and consequential factual claim.** Avoid repeated generic passages or fabricated prices, laws, deposits, availability, insurance, reviews or experiences.
4. STAGE only the 2–10 JSON drafts in `content/inbox/DE-xxx.json`. Run `node scripts/factory.mjs score content/inbox/DE-xxx.json` for EACH and `node scripts/factory.mjs check-batch` for ALL. Every article must score >=75 with zero errors. Structural QA alone is not proof of factual truth.
5. PUSH the verified inbox batch in **one fast-forward commit** to main under the existing standing owner authorization (or use a reviewed PR if required). Do not push to content/posts, change Matrix statuses, overwrite generated HTML or force push. If main changes, refetch and revalidate.
6. VERIFY the single `German Continuous Pair Factory` workflow succeeds: it preflights all drafts before publishing and commits each **two-article pair** separately, with full site QA and fresh-main reconciliation. Wait for the latest Pages run and actual public URLs, confirm inbox empty and Matrix up to date.
7. REFETCH current main and start the next even handoff while the external coding session is actually connected. Stop at 300 published articles, manual owner stop, real session/quota disconnect or a material unrepairable blocker; record the state. No paid AI API, local LLM or scheduled prose writer is introduced.

On failure, fix evidence/quality/order and rerun QA. Do not weaken QA, fabricate citations, reset the Matrix or claim unpublished URLs exist.
## Stop conditions
Only stop writing when all 300 Matrix rows are PUBLISHED, the owner manually says stop, tool/runtime/connectivity/quota truly ends, or there is a material blocking failure that cannot safely be repaired. When a session ends, save state in GitHub (already published articles, pending drafts, Matrix) and resume from fresh main in a new external AI session. No claim of perpetual AI execution without a live session.

## Factory CLI
- node scripts/factory.mjs status — counts and pending queue.
- node scripts/factory.mjs next 2 — next two rows not already pending.
- node scripts/factory.mjs score path/to/DE-xxx.json — single draft grade.
- node scripts/factory.mjs check — validate exactly two inbox drafts.
- node scripts/factory.mjs check-batch — preflight the entire even 2–10 draft inbox (empty inbox succeeds without changes).
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
- Workflow has a single global concurrency group, preflights the whole batch before any commit and refetches main before every pair. The publisher push is followed by fresh-main processing of subsequent queued pairs.
- When bot-created commits do not trigger Pages automatically, workflow relies on the native GitHub Pages build event after the bot push, without an extra duplicate build request. This is NOT an AI API. Pages success must still be checked.
- If factory fails before its commit, the original drafts remain in inbox for repair. If another pair was already committed, preserve it and resume the next.
- A failed QA score or critical factual uncertainty is a blocker for that pair; fix the article. Never simply change the rubric to pass.

## One-time instruction for a connected external coding AI

Work ONLY in thuexemayhanoi/german. Read fresh main AGENTS.md and docs/CONTINUOUS_WRITER.md. The owner authorizes repeat external AI writing while this coding session remains active. Recover any pending inbox/failed run first. Select 2, 4, 6, 8 or 10 consecutive uncompleted DE IDs (prefer 4–6), write distinctive native-German articles with real verified sources, score each >=75 and pass `node scripts/factory.mjs check-batch`. Push only the complete researched inbox JSON batch as one safe fast-forward writer commit. Wait for the deterministic factory to publish each two-article checkpoint and GitHub Pages to deploy; verify current main, published URLs and inbox empty; fetch fresh main and repeat. Continue until 300/300, manual stop, genuine session disconnect or serious unrecoverable error. Fix errors instead of bypassing QA. No paid AI APIs, no background writing by GitHub Actions, no fake citations.

# 200 articles – external AI workflow (NO API)

## What exists
- Exactly **200 planned German topics**, IDs `DE-001` to `DE-200` in `data/editorial-plan.json`, 20 per hub.
- These are hypotheses, **not** 200 live articles. Start by researching target queries/intent in German.
- Three sample guides have separate `START-xx` IDs and are already available on the site.
- No content-writing API, local AI model, agent process, schedule, or autonomous publish pipeline.
- The 200-topic cap is enforced by IDs, not by a hidden credit counter.

## Operating entirely on iPhone
A GitHub-connected ChatGPT Work session, Claude coding environment, or other external editor can inspect this repo, run simple Node CLI commands in its workspace, and prepare JSON draft files. If the environment cannot run Node, copy a topic prompt from `node scripts/editorial.mjs prompt DE-001` (or reconstruct using the Matrix), and let a coding agent validate/import it afterwards.

## Production steps
1. `node scripts/editorial.mjs next --count 5` lists five unclaimed ideas.
2. Claim before parallel writing: `node scripts/editorial.mjs claim DE-001 --writer Claude`. Commit claim updates on the collaboration branch. A second writer must not overwrite a claim.
3. `node scripts/editorial.mjs prompt DE-001` gives a standalone native-German writing assignment. Paste it into ChatGPT, Claude, Mistral or Gemini **as chat**, not API.
4. Request a JSON draft with sections and two real dated source references; independently verify links and claims, especially legal or pricing statements.
5. `node scripts/editorial.mjs validate DE-001.json` checks fields, minimum body length, source URL shapes and duplicates (not factual truth). `stage` copies into ignored `.local-drafts` and does not publish.
6. Owner reviews intent, facts, wording, copyright, sources and safety. Use a non-main branch, then `publish .local-drafts/DE-001.json --approve DE-001`. Exact ID match is mandatory. This command does **not** authorize itself; the human must supply approval.
7. Run build check, QA and tests. Commit and push a small batch; open PR to `main`. Confirm preview/CI and merge only on owner approval.
8. After deployment, verify live URL, canonical, sitemap and internal links; update checkpoint.
9. On failure, fix on branch, or revert the publishing PR. Never silently delete URLs or change slugs.

## Draft contract
- Keep `id`, `hub`, `slug`, `title` aligned to Matrix.
- `description` 85–180 chars; `excerpt` 80–330 chars.
- 4–12 article `sections` with `heading`, at least two substantial `paragraphs`, optional `bullets`.
- At least 450 German body words and 2 **verified** HTTPS sources with `label`, `url`, `checkedOn` (YYYY-MM-DD).
- Reviewed sources in JSON do not prove facts; a reviewer still must verify every consequential claim.
- No claims of official requirements without current official sources. No invented prices, discounts, inventory, legal interpretation, reviews or user testimony.
- The site renders all content as escaped plain text (no injected HTML/scripts).
- 200 queued topics remain editable before publishing, but preserve unique IDs and topic-to-hub ownership.

## Matrix state contract
`IDEA → RESEARCHED → DRAFT → QA_APPROVED → PUBLISHED` or `BLOCKED`.

Publishing with owner approval sets the topic `PUBLISHED` atomically with a real `content/posts/DE-xxx.json` in the working tree. Generator rejects missing published content or mismatched canonical slug. Technical QA validates URLs, language, source files, and header/footer. Git review protects from concurrent changes.

## Recovery
Use GitHub commit history, PR review, `data/editorial-plan.json` and writer claims to resume from any interrupted session. No background task restarts itself when quotas refresh.

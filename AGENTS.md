# Repo contract – thuexemayhanoi/german
- **ONLY** edit `thuexemayhanoi/german`. Never modify /global, /blog, WordPress or another website.
- CNAME: `de.rentbikehanoi.com`. Preserve exact bytes. No DNS or GitHub Pages source migration.
- Production `main` contains committed generated static HTML. Use `node scripts/build.mjs` followed by `node scripts/build.mjs --check`, tests and QA.
- Language is native **German (de-DE)**; no multilingual directories or machine-translation clones.
- `data/editorial-plan.json` has **exactly 200** unique topic slots (10 hubs × 20). Never claim IDEAs are published URLs.
- `content/posts` contains *approved* static articles. An authorized two-article inbox queue may be published under the owner's standing batch instruction ONLY after the external writer verifies claims and citations and the deterministic factory passes QA >=75 with zero critical errors. The manual editorial CLI still requires its explicit per-ID approval.
- Absolutely **no paid AI writer APIs, no API keys, no local/open-source LLM runtime, no scheduled automatic AI writing**. The content factory is a CLI and editorial QA workflow only.
- `scripts/build.mjs` owns all generated HTML; do not hand-edit pages in output. Source templates and JSON are authoritative.
- Keep semantic accessible mega menu, responsive header, premium article body/footer; sitemap includes only published HTML.
- Protect canonical, metadata, German lang, local links, RSS, 404; no invented NAP, prices, reviews, legal requirements, availability or vehicle inventory.
- Work on review branches in small, tested commits; CI and owner review before main.
- GitHub Pages only; minimize dependencies and scripts to keep quick performance and operational simplicity.

## Continuous external writer (standing owner instruction)
- Read `docs/CONTINUOUS_WRITER.md`. Active AI chat session writes next two articles in native German, source-checks them, QA >=75, pushes two `content/inbox/DE-xxx.json` drafts, waits for factory + Pages, fetches fresh main and immediately repeats while runtime is active.
- GitHub Actions is deterministic; it neither generates prose nor calls AI APIs. No perpetual external AI process can be guaranteed when a session ends. Never reset matrix, force push, skip pending repair or publish fictitious citations.

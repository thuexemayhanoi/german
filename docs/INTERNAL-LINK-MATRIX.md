# German internal linking graph (300 DE + three starter articles)

Production: https://de.rentbikehanoi.com/ · Repository: thuexemayhanoi/german.

## Evidence-based architecture

- **Supporting content → Cluster pillar:** Every 303 published article has an existing contextual end-of-article link to its own /themen/<hub>/ pillar. Its JSON body, slug and canonical stay unchanged.
- **Pillar → Relevant next step:** 10 topic hubs are enriched with two manually curated semantically related hubs and one carefully chosen priority URL (contact, disclaimers or published guide archive). No hub receives an unsolicited contextual homepage link.
- **Site information → appropriate cluster:** About, contact, privacy and legal pages receive contextual links reflecting their actual contents. The first /ratgeber/ archive exposes all 10 curated hubs.
- **Homepage:** Remains an informational portal, not an invented commercial money page. Its established home navigation/breadcrumb/footer links remain. The blog's /kontakt/ is an enquiry/information page, not a verified checkout or real-time booking system.
- **No empty/draft URLs:** Everything generated from 300 published DE JSONs + three START guides; no fictional locations, prices or services.

## Generated artifacts

- reports/internal-link-graph.csv — table: URL → outgoing URLs → incoming URLs → anchor text → cluster → recommended links/status.
- reports/internal-link-graph.json — same URL inventory with individual edges, link scopes, inbound/outbound counts, exact anchor texts and reasoned recommendations.
- scripts/internal-link-graph.mjs — reproducible static extraction from every published generated page and live sitemap, `--check` prevents drift.
- data/internal-link-plan.json — exact controlled anchor/URL pairs for ten topic hubs, four main pages and the archive.

**Interpretation:** `navigation-or-template` includes header/footer and generic archive/article-card navigation; `contextual` means explicitly curated links or the existing article-end link to its hub. Incoming counts for the homepage naturally include global navigation; they are not proof of SEO authority or ranking. Recommendations marked `implemented` are rendered links; `recommended` are future opportunities, not automatically published.

## Release and safety

This is a generator-driven change: never hand-edit the 345 generated HTML outputs. Build with Node 22 and run `node scripts/build.mjs --check`, `node scripts/qa.mjs`, `node scripts/qa-internal-links.mjs`, `node scripts/internal-link-graph.mjs --check`, site+factory tests. Review branch diff to verify the 303 existing article routes, 300 JSONs, canonical, sitemap, NAP and Writer were not modified. Owner review required before merging to main.

No proof of Google Search Console indexing, ranking improvement or revenue is claimed.

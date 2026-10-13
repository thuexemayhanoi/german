# Deployment and QA checklist (German site)

## Before PR
- Read `CNAME`: `de.rentbikehanoi.com`.
- `node scripts/build.mjs` then `node scripts/build.mjs --check`.
- `node --test tests/site.test.mjs`.
- `node scripts/qa.mjs`.
- Confirm no IDEA appears as a live article URL, in sitemap, search, footer or RSS.
- Confirm every live article has a unique slug, self-canonical, German HTML language, Article JSON-LD, references if externally drafted.
- Open mega menu with mouse, touchscreen and keyboard. Validate Escape/outside-close; mobile drawer; search with and without JS; article TOC and reading progress.
- Manually inspect mobile at 390px, tablet and desktop; keyboard focus and contrast.
- Check Core Web Vitals using real measurements, never assume benchmark scores.
- Review GitHub Actions result; protect CNAME, DNS, and other repositories.

## After owner-approved merge
- Confirm GitHub Pages deployment success for the new main commit.
- Verify https://de.rentbikehanoi.com/ , `/ratgeber/`, `/suche/`, `/themen/fahrzeugwahl/` and starter articles.
- Check sitemap, robots.txt and 404.
- For broken production changes, revert the merge commit via reviewed PR; do not delete historic article slugs without a redirect and SEO plan.

## Non-goals
- Automatic AI writing/scheduling/approval.
- Hidden API keys, open-source AI hosting, WordPress installation.
- Claiming 200 published articles from 200 planned topics.

# Technical Evidence Map

This page links the skills listed in my CV to concrete project evidence that can be reviewed on GitHub.

## Public evidence

| Area | What I worked on | Evidence |
|---|---|---|
| Web development | Responsive layouts, deployment, website maintenance and troubleshooting | [Portfolio overview](./README.md) |
| Accessibility testing | Automated accessibility scanning with axe-core and browser-based checks | [Accessibility Scanner Cloud](https://github.com/cirochiado/accessibility-scanner-cloud) |
| Browser automation | Playwright/Chromium scanning, page interaction and behavioural checks | [cloud-scan.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/cloud-scan.mjs), [behavior.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/behavior.mjs) |
| Technical SEO | Crawl-oriented SEO analysis and structured SEO results | [seo-scan.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/seo-scan.mjs), [seo-result-builder.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/seo-result-builder.mjs) |
| Performance analysis | Browser-collected performance signals and deterministic scoring | [performance-scan.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/performance-scan.mjs), [performance-score.test.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/test/performance-score.test.mjs) |
| Serverless APIs | Netlify Functions, background jobs, polling endpoints and report generation | [Netlify functions](https://github.com/cirochiado/accessibility-scanner-cloud/tree/main/netlify/functions) |
| Security | Bearer authentication, private-network blocking and SSRF protections | [auth.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/auth.mjs), [security.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/security.mjs) |
| Automated testing | Node test runner, result validation and performance scoring tests | [test/](https://github.com/cirochiado/accessibility-scanner-cloud/tree/main/test) |
| Cloud storage | Netlify Blobs for jobs, history and generated reports | [storage.mjs](https://github.com/cirochiado/accessibility-scanner-cloud/blob/main/_src/storage.mjs) |
| Git / GitHub workflow | Branches, commits, pull requests, validation and release-oriented work | [CIRO Business OS case study](./CASE-STUDY-CIRO-BUSINESS-OS.md) |

## Private engineering work documented publicly

The main CIRO Business OS and CIRO Control source repositories are private, but I maintain public documentation that summarizes the technical work without exposing private code, credentials or internal data.

### Backend and control plane

I have worked with:

- TypeScript and Node.js
- Fastify APIs
- PostgreSQL 17
- schema migrations
- database roles and privilege validation
- JSON-schema-driven contracts
- worker orchestration
- controlled connector boundaries

See:

- [CIRO Business OS / CIRO Control case study](./CASE-STUDY-CIRO-BUSINESS-OS.md)
- [CIRO architecture overview](./ARCHITECTURE-CIRO-BUSINESS-OS.md)

### CI/CD and validation

The projects use a branch-and-pull-request workflow with explicit validation gates, including:

- TypeScript strict checks
- automated regression suites
- migration validation
- database runtime checks
- dependency and network guards
- GitHub Actions
- fail-closed acceptance criteria
- release and validation receipts

The accepted contract/policy foundation recorded **124/124 passing tests**.  
The isolated CIRO Control D1 candidate includes a **44-case local test matrix**.

## Why this page exists

Some of my most advanced work is maintained in private repositories. This evidence map gives recruiters a fast way to verify the public work, understand the private project scope and connect the skills in my CV to concrete examples.

Portfolio: https://webdeveloperciro.com

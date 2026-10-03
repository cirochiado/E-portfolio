# CIRO Business OS / CIRO Control

Backend and automation work maintained in private repositories.

The project combines a typed API, background worker orchestration, PostgreSQL and controlled integrations. This folder gives a high-level overview without exposing private source code or credentials.

## What I worked on

- TypeScript and Node.js
- Fastify APIs
- PostgreSQL schema migrations
- database roles and privilege checks
- API and worker separation
- automated tests and regression checks
- GitHub Actions and pull-request workflows
- n8n and Odoo integrations
- controlled external-service connectors

## Engineering approach

The project separates request handling, worker execution and provider integrations so each layer can be tested independently. Database changes are validated through migrations and runtime checks, while CI gates catch regressions before changes are promoted.

Security-related work includes least-privilege database access, restricted connector boundaries, secret separation and tests that block unintended network activity.

See [architecture.md](./architecture.md) for the high-level structure.

## Repository visibility

The implementation repositories are private because they contain internal project material. The public notes here focus on the architecture and the technical areas I worked with.

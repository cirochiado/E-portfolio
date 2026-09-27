# Case Study — CIRO Business OS / CIRO Control

This document is a public, recruiter-friendly summary of engineering work maintained in private repositories.

The goal is to demonstrate the technical areas I have worked on without publishing private source code, credentials, production data or internal implementation details.

## Project overview

CIRO Business OS is a structured backend and automation platform built around typed contracts, policy enforcement, PostgreSQL, API/worker separation and strict validation gates.

A related CIRO Control candidate implements a local-only control plane using Fastify, persistent worker orchestration and a closed connector gateway with deterministic fake adapters.

## What I worked with

### Backend and application architecture

- TypeScript
- Node.js
- Fastify
- modular packages and service boundaries
- schema-driven contracts
- API and worker separation
- deterministic test doubles

### PostgreSQL and data layer

- PostgreSQL 17
- schema migrations
- roles and privilege validation
- row-level security concepts
- migration runner validation
- backup / restore verification
- deterministic database test fixtures

### Git and GitHub workflow

- feature / repair branches
- pull-request based changes
- commit and tree verification
- candidate branches
- merge validation
- GitHub Actions
- CI checks and regression gates
- release / validation receipts

### Testing and quality

The work uses explicit validation gates rather than relying only on manual checks.

Examples include:

- TypeScript strict checks
- contract and policy regressions
- local database validation
- API / worker tests
- security and network guards
- dependency checks
- migration validation
- fail-closed acceptance criteria

One accepted foundation stage recorded **124/124 passing tests** for the contract and policy core.

The isolated CIRO Control D1 candidate includes a **44-case local test matrix** covering the control API, worker orchestration and connector boundary.

## Security-oriented design

The project has given me practical exposure to security-conscious engineering decisions such as:

- least-privilege database roles
- fail-closed validation
- server-derived identity context
- restricted connector boundaries
- blocking unintended outbound network access during tests
- secret and credential separation
- synthetic data for deterministic test environments
- explicit promotion and deployment gates

## Tooling and integrations

The wider project ecosystem includes work involving:

- GitHub
- GitHub Actions
- PostgreSQL
- n8n
- Odoo
- Netlify
- OpenAI integrations

## What this project taught me

This project has helped me move beyond simply writing code and understand how software changes can be:

1. designed against explicit contracts,
2. implemented in small controlled stages,
3. tested automatically,
4. reviewed through Git and pull requests,
5. validated before promotion,
6. documented so that another person can reproduce the state of the project.

It has also given me substantial practice in debugging, regression analysis, reading logs, isolating failures and making minimal repairs without introducing unrelated changes.

## Repository visibility

The main source repositories are private because they contain internal architecture and project material.

Public examples of related work are available on my GitHub profile, including:

- Accessibility Scanner Cloud: https://github.com/cirochiado/accessibility-scanner-cloud
- Portfolio repository: https://github.com/cirochiado/E-portfolio

Portfolio: https://webdeveloperciro.com

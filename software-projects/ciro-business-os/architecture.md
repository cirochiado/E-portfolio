# Architecture

```mermaid
flowchart LR
    U[User / Operator] --> API[Fastify API]
    API --> STORE[(Technical Store)]
    API --> POLICY[Contracts and Policy]

    WORKER[Background Worker] --> STORE
    WORKER --> POLICY
    WORKER --> GATEWAY[Connector Gateway]

    STORE --> PG[(PostgreSQL)]
    GATEWAY --> N8N[n8n]
    GATEWAY --> ODOO[Odoo]
    GATEWAY --> EXT[External Services]

    GH[GitHub] --> CI[GitHub Actions]
    CI --> TESTS[Tests and Static Checks]
    CI --> DB[Migration Validation]
    CI --> GUARDS[Security and Network Guards]
```

## Main boundaries

### API

Handles requests and creates technical state without directly calling external providers.

### Worker

Processes queued work independently from the HTTP layer.

### Connector gateway

Keeps provider-specific logic behind one controlled boundary. This makes integrations easier to test and prevents application code from depending directly on provider credentials.

### PostgreSQL

Stores application state and supports schema migrations, role separation and privilege validation.

### CI/CD

GitHub Actions runs automated checks for application code, database changes and security-related constraints before a change is accepted.

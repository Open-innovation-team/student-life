# Student Life Monorepo

## Commands

```bash
npm run build    # builds apps in the correct order
npm run lint     # runs lint across all apps
```

### Configuration initiale (à faire une seule fois)

#### 1. Backend — origines CORS autorisées

Dans `apps/backend/api/.env`, ajoute ton IP locale à `BETTER_AUTH_TRUSTED_ORIGINS` :

```bash
# Windows : ipconfig | Linux/Mac : ip addr ou ifconfig
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:8081,http://localhost:3001,http://TON_IP:8081,http://TON_IP:3001
```

#### 2. Mobile — IP de l'API

Copie le fichier template et renseigne ton IP :

```bash
cp apps/mobile/.env.example apps/mobile/.env
# puis édite apps/mobile/.env :
# EXPO_PUBLIC_API_HOST=TON_IP
```

> Le fichier `apps/mobile/.env` est gitignored — chaque dev le crée localement.
> Ne jamais hardcoder d'IP dans le code source.

---

### Local Development (3 Terminals)

```bash
# Terminal 1: web
npm run dev -w @student-life/web

# Terminal 2: mobile
npm run dev -w @student-life/mobile

# Terminal 3: api
npm run dev -w @student-life/api
```

## Monorepo Structure

```text
student-life/                          <- monorepo root (git)
|
|-- package.json                       <- npm workspaces + turbo scripts
|-- package-lock.json
|-- turbo.json
|-- README.md
|
|-- apps/
|   |-- backend/
|   |   |-- api/                       <- NestJS REST API
|   |   |   |-- src/
|   |   |   |   |-- main.ts            <- entry point (default port 3001)
|   |   |   |   |-- app.module.ts
|   |   |   |   |-- app.controller.ts
|   |   |   |   `-- app.service.ts
|   |   |   |-- test/
|   |   |   |-- package.json
|   |   |   |-- eslint.config.mjs
|   |   |   `-- tsconfig.json
|   |   |-- db/                        <- empty (planned: migrations, seeds)
|   |   `-- lib/                       <- empty (planned: shared backend utils)
|   |
|   |-- mobile/                        <- Expo React Native (iOS / Android)
|   |   |-- App.tsx
|   |   |-- app.json
|   |   |-- index.ts
|   |   |-- tsconfig.json
|   |   |-- package.json
|   |   `-- assets/
|   |
|   `-- web/                           <- Next.js (App Router)
|       |-- app/
|       |   |-- layout.tsx             <- root layout
|       |   |-- page.tsx               <- home page
|       |   `-- globals.css
|       |-- public/
|       |-- package.json
|       |-- eslint.config.mjs
|       |-- next.config.ts
|       `-- tsconfig.json
|
`-- packages/
    |-- eslint-config/                 <- empty (shared config package scaffold)
    |-- types/
    |   |-- src/
    |   |   |-- index.ts
    |   |   `-- user.ts
    |   |-- package.json
    |   `-- tsconfig.json
    `-- typescript-config/
        |-- base.json
        |-- nestjs.json
        |-- nextjs.json
        |-- react-native.json
        `-- package.json

Note: generated folders like `node_modules/` and `.next/` are intentionally omitted.
```

## Data Flow

```text
+-------------+      HTTP/REST      +------------------------+
|  web (Next) | ------------------->|                        |
+-------------+                     |   api (NestJS)         |
                                    |   apps/backend/api     |
+-------------+      HTTP/REST      |                        |
| mobile      | ------------------->|                        |
| (Expo RN)   |                     +-----------+------------+
+-------------+                                 |
                                                v
                                      apps/backend/db/
                                      (database to connect)
```

# Prople Store

Prople Store is a multi-platform application marketplace and publishing console. This repository contains its React web application, Express server, API routes, and Progressive Web App (PWA) configuration.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

**Links:** [Marketplace](https://www.prople.co.in) · [Platform guide](docs/PLATFORM_GUIDE.md) · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

## Contents

- [Project overview](#project-overview)
- [Features](#features)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Development commands](#development-commands)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Project overview

Prople Store aims to make software discovery and publishing available across mobile, desktop, and web platforms. The application provides a catalog and publisher workflow; downloadable packages are referenced from publisher-provided sources rather than being built into this repository.

This project is under active development. Capabilities, supported package formats, and deployment requirements may change. Consult the [platform guide](docs/PLATFORM_GUIDE.md) and [roadmap](ROADMAP.md) for additional product and technical context.

## Features

- Browse and search a multi-platform application catalog.
- Use the publisher console to create and manage application listings and releases.
- Run as a web application with PWA support.
- Integrate with configured backend services, including Supabase and search/email providers.
- Run the Express server locally or build a production server bundle.

For platform and publishing details, see the [platform guide](docs/PLATFORM_GUIDE.md).

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4
- **Server:** Node.js 20+, Express 4, TypeScript
- **Integrations:** Supabase, Meilisearch, and Resend (depending on the configured features)
- **PWA:** `vite-plugin-pwa`

## Getting started

### Prerequisites

- Node.js 20 or later
- npm
- Git

### Install and run locally

```bash
git clone https://github.com/sam-live2c/prople-store.git
cd prople-store
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local work, the application has fallback behavior for some unconfigured integrations. See [Contributing](CONTRIBUTING.md) for details. Features that depend on external services require the corresponding credentials and configuration.

## Configuration

Copy the sample file if you need to configure integrations:

```bash
cp .env.example .env
```

Set only the values required for the integrations you plan to use. The `.env.example` file lists the supported variables, including configuration for Supabase, Meilisearch, email delivery, Firebase, and optional AI features. The exact requirements depend on the enabled application functionality and deployment environment.

**Keep server credentials private.** Never commit `.env` files or expose secret/admin keys, session secrets, or internal security keys in client-side code. Variables prefixed with `VITE_` are intended for the browser build; only put values there that are safe to publish.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run the TypeScript checks (`tsc --noEmit`). |
| `npm run test:catalog` | Validate the starter catalog. |
| `npm run build` | Build the frontend and production server bundle. |
| `npm start` | Start the production server. |
| `npm run start:bundle` | Start the bundled production server. |
| `npm run preview` | Preview the Vite production build. |

Before submitting a change, run the checks relevant to it; at minimum, run `npm run lint` and `npm run build`. For catalog changes, also run `npm run test:catalog`.

## Deployment

The repository includes configuration for both a Node.js server deployment and Vercel (`vercel.json`). Choose the deployment model that fits your environment, configure the required environment variables securely, and build the application:

```bash
npm install
npm run build
```

For a Node.js deployment, start the built application with `npm start` or `npm run start:bundle`. For reverse-proxy guidance, see [`nginx/README.md`](nginx/README.md). Verify your hosting provider's Node.js version, environment-variable handling, routing, and persistent-storage requirements before deploying.

## Contributing

Contributions are welcome. Before starting substantial work, open or find an issue or discussion so the proposed change can be aligned with the project's direction. For small fixes, you can open a pull request directly.

A typical contribution workflow:

1. Fork the repository and create a focused branch from `main`.
2. Install dependencies with `npm install` and make your change.
3. Run the relevant validation commands from [Development commands](#development-commands).
4. Open a pull request against `main`. Explain the motivation, summarize the changes, and include the checks you ran; include screenshots for visible UI changes when helpful.

Please follow the project's [Code of Conduct](CODE_OF_CONDUCT.md). The full [contribution guide](CONTRIBUTING.md) includes setup notes, coding standards, issue and pull-request guidance, and contributor resources:

- [Platform and publishing guide](docs/PLATFORM_GUIDE.md)
- [Good first issues](docs/GOOD_FIRST_ISSUES.md)
- [Advanced contributor challenges](docs/ADVANCED_CONTRIBUTOR_CHALLENGES.md)
- [Project roadmap](ROADMAP.md)

## Security

Do not report security vulnerabilities in public issues or pull requests. Follow the private reporting instructions in [SECURITY.md](SECURITY.md).

## License

This project is distributed under the [Apache License 2.0](LICENSE). See [`NOTICE`](NOTICE) for attribution information.

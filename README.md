<div align="center">

  <img src="public/logo.png" alt="Prople Store Logo" width="100" height="100" />

  # Prople Store
  **Independent Multi-Platform Application Marketplace & Developer Console**

  [![CI Status](https://img.shields.io/github/actions/workflow/status/sam-live2c/prople-apps-store-/ci.yml?branch=main&label=CI%20Build&logo=github&style=flat-square)](https://github.com/sam-live2c/prople-apps-store-/actions)
  [![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](LICENSE)
  [![Node.js](https://img.shields.io/badge/Node.js-v20%20%7C%20v22-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-v19-61dafb?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)
  [![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white&style=flat-square)](https://web.dev/progressive-web-apps/)

  <p align="center">
    <a href="https://www.prople.co.in"><strong>Official Marketplace</strong></a> •
    <a href="docs/PLATFORM_GUIDE.md"><strong>Platform Guide</strong></a> •
    <a href="SECURITY.md"><strong>Security Policy</strong></a> •
    <a href="ROADMAP.md"><strong>Roadmap</strong></a> •
    <a href="CONTRIBUTING.md"><strong>Contributing</strong></a>
  </p>

</div>

---

## 📌 Executive Summary

**Prople Store** is an independent, consumer-grade digital application marketplace operated by **Cloaktail Industries**. It offers verified multi-platform software distribution across **Android**, **Apple (iOS/iPadOS)**, **Mac (macOS)**, **Linux**, **Windows**, and modern **Web/PWA** applications.

### 🌟 Core Pillars

| Pillar | Benefit |
| :--- | :--- |
| 🛡️ **Zero-Byte Directory Pointer** | Prople Store never hosts or proxies executable binaries. All installs issue direct HTTP `302 Found` redirects to verified publisher upstream CDNs (Cloudflare R2, AWS S3, GitHub Releases), strictly adhering to statutory safe-harbor standards (Section 79 IT Act 2000, EU DSA, US 47 U.S.C. § 230). |
| 🔒 **Cryptographic SHA-256** | Every binary release includes an immutable 64-character SHA-256 checksum verified via cloud digest headers, sidecar signatures, or pre-flight verification. |
| 🌐 **Universal Format Support** | Distribute software across 22+ packaging formats (`.apk`, `.aab`, `.ipa`, `.dmg`, `.pkg`, `.deb`, `.AppImage`, `.rpm`, `.exe`, `.msi`, `.pwa`). |
| ⚖️ **Merit-Based Discovery** | Transparent Bayesian rating algorithm with zero paid placements, zero sponsored ads, and zero forced sign-in walls for browsing or downloading. |

---

## 💻 Supported Platforms & Formats

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PROPLE STORE PLATFORMS                          │
├─────────────┬─────────────┬─────────────┬──────────────┬───────────────┤
│   Android   │    Apple    │     Mac     │    Linux     │    Windows    │
│  (.apk/.aab)│   (.ipa)    │ (.dmg/.pkg) │(.deb/.appimg)│  (.exe/.msi)  │
└─────────────┴─────────────┴─────────────┴──────────────┴───────────────┘
```

| Icon | Platform | Minimum Target OS | Primary Packaging Formats |
| :---: | :--- | :--- | :--- |
| 🤖 | **Android** | Android 7.0 (Nougat)+ | `.apk` (Standard Package), `.aab` (Android App Bundle) |
| 🍏 | **Apple (iOS / iPadOS)** | iOS / iPadOS 14.0+ | `.ipa` (Sideload & Enterprise Package) |
| 🖥️ | **Mac (macOS)** | macOS 12.0 (Monterey)+ | `.dmg` (Disk Image), `.pkg` (Installer), `.zip` |
| 🐧 | **Linux** | Universal Linux Kernel | `.deb` (Debian/Ubuntu), `.AppImage`, `.rpm` (Fedora/RHEL), `.flatpak` |
| 🪟 | **Windows** | Windows 10, 11 (64-bit) | `.exe` (Win32/x64), `.msi` (MSI Installer), `.msix`, `.appx` |
| 🌐 | **Web Applications** | Modern Standards | Progressive Web Apps (`.pwa`), Responsive Web Apps, Sandboxes |

---

## 🏛️ Architecture & Verification Flow

```text
[ Developer / Publisher ]
           │
           │  (1) Publishes Release Metadata & Direct Binary URL
           ▼
┌──────────────────────────────────────────────────────────┐
│                   PROPLE STORE BACKEND                   │
│                                                          │
│  • Resolves format, size & SHA-256 Checksum              │
│  • Enforces rate-limits (3 apps / 15m, 5 updates / 1h)   │
│  • Validates Content Security & Safe Harbor Pointers     │
└──────────────────────────────────────────────────────────┘
           │
           │  (2) Indexes into Authoritative Database & Meilisearch
           ▼
[ Discovery Client (Web / PWA / Mobile) ]
           │
           │  (3) User clicks "Install" or "Download"
           ▼
┌──────────────────────────────────────────────────────────┐
│                HTTP 302 DIRECTORY POINTER                │
│   (Zero bytes stored or proxy-streamed on Prople Store)  │
└──────────────────────────────────────────────────────────┘
           │
           │  (4) Direct authenticated stream from Upstream Host
           ▼
[ Upstream CDN / GitHub Releases / AWS S3 / Cloudflare R2 ]
```

---

## 🚀 Key Platform Features

<details open>
<summary><strong>🔍 Discovery & In-App Experience</strong></summary>

- **Zero-Barrier Browsing**: Explore listings, Top Charts, categories, and full-text search with zero login walls.
- **Contained Downloads**: Downloads start directly inside the app view without disruptive blank-tab redirects.
- **Deep Search**: Instant sub-5ms fuzzy search powered by Meilisearch with client-side fallback index.
- **Offline & PWA Resilience**: Service Worker background caching, app install prompt, and local persistence.
</details>

<details>
<summary><strong>🛠️ Developer Console & Publishing</strong></summary>

- **6-Step Release Wizard**: Step-by-step guidance covering binaries, media, permissions, and Data Safety.
- **Universal Publisher Identity**: Single verified publisher name managed centrally in **Settings → Edit Profile** (30-min grace period, 15-day cooldown) with release-level anti-spoofing protection.
- **Multi-Host Binary Sources**: Link files directly from AWS S3, Cloudflare R2, GitHub Releases, or self-hosted servers.
- **Publishing Quotas**: Guarded by rate limiters to prevent catalog spam and automated abuse.
</details>

<details>
<summary><strong>🔐 Security & Data Transparency</strong></summary>

- **Complete Data Safety Disclosures**: Mandatory disclosures on collected data, shared data, and deletion policies.
- **Categorized OS Permissions**: Clear explanations of requested system permissions before installation.
- **Authentication**: 6-digit email OTP verification codes and Google OAuth integration.
- **Defensive Engineering**: Built-in SSRF protection, strict CORS origin policies, and honeypot scrapers defense.
</details>

---

## 🛠️ Tech Stack

```text
Frontend:       React 19 • TypeScript • Tailwind CSS v4 • Lucide Icons • Motion
Backend:        Express 4.x • Node.js 22 • tsx • esbuild
Database:       Supabase PostgreSQL (Authoritative Store)
Search Engine:  Meilisearch (Full-text) with Local Fuzzy Match Fallback
SEO & GEO:      Schema.org JSON-LD • OpenGraph • Sitemaps • /llms.txt Specification
Security:       RFC 9116 security.txt • OWASP Headers • SHA-256 Integrity Verification
```

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (recommended)
- **npm**: `v10+`

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/sam-live2c/prople-apps-store-.git
cd prople-apps-store-

# Install dependencies
npm install
```

### 3. Environment Setup

Copy the sample environment file:

```bash
cp .env.example .env
```

Key configuration variables (all variables have safe local mock defaults if left blank):

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Supabase PostgreSQL project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Public publishable anonymous key for client RLS operations |
| `SUPABASE_SECRET_KEY` | Server-side service key (never expose to client) |
| `RESEND_API_KEY` | API key for transactional 2FA OTP verification emails |
| `AUTH_EMAIL_FROM` | Sender address for transactional emails |
| `MEILISEARCH_HOST` | Meilisearch server host (Default: `http://localhost:7700`) |
| `MEILISEARCH_ADMIN_KEY` | Meilisearch Master/Admin API key |

### 4. Run Development Server

```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

### 5. Production Build

```bash
# Compile client assets and bundle server
npm run build

# Start production server
npm start
```

---

## 📂 Project Organization

```text
├── api/                       # Serverless API routes (Vercel & cloud functions)
│   ├── apps.ts                # Catalog retrieval API
│   ├── auth/[action].ts       # OTP 2FA and profile sync gateway
│   ├── download-apk.ts        # Zero-byte 302 pointer redirect handler
│   └── resolve-apk.ts         # Multi-host binary URL, format & cloud SHA-256 resolver
├── docs/                      # Technical specifications & developer guides
│   ├── PLATFORM_GUIDE.md      # Publishing, browsing & catalog standards
│   ├── GOOD_FIRST_ISSUES.md   # Beginner starter challenges with acceptance criteria
│   └── ADVANCED_CONTRIBUTOR_CHALLENGES.md # Advanced crypto, search & systems tasks
├── public/                    # Static web assets & SEO manifests
│   ├── manifest.webmanifest   # Progressive Web App manifest
│   ├── robots.txt             # Search crawler directives & GEO permissions
│   ├── sitemap.xml            # XML Sitemap index
│   └── .well-known/           # RFC 9116 security.txt disclosure policy
├── server/                    # Backend server infrastructure
│   ├── authSecurity.ts        # Rate limiters & brute-force defense
│   ├── emailAuth.ts           # Resend OTP delivery engine
│   ├── meilisearch.ts         # Full-text search catalog sync
│   ├── securityDefense.ts     # OWASP defense engine (SSRF, CORS, prototype pollution)
│   └── supabase.ts            # Supabase PostgreSQL client & data mappings
├── src/                       # Frontend application source
│   ├── components/            # UI pages, sections, dialogs & navigation
│   ├── context/               # React Context providers (Auth, Navigation, Install, Theme)
│   ├── services/              # Client-side business logic & services
│   ├── utils/                 # Security validators, algorithms & formatters
│   ├── App.tsx                # Application shell & route router
│   └── main.tsx               # Bootstrap & PWA service worker registration
├── server.ts                  # Unified full-stack Express server
└── package.json               # Manifest & build scripts
```

---

## 🔒 Security & Vulnerability Disclosure

Security is a fundamental priority. If you discover a vulnerability, **please do not open a public GitHub issue**.

Please report vulnerabilities directly to our security response team:

- **Security Team Email**: [cloaktailsupport@gmail.com](mailto:cloaktailsupport@gmail.com)
- **Alternate Contact**: [cloaktailofficial@gmail.com](mailto:cloaktailofficial@gmail.com)
- **RFC 9116 Disclosure**: [www.prople.co.in/.well-known/security.txt](https://www.prople.co.in/.well-known/security.txt)
- Full details: [SECURITY.md](SECURITY.md)

---

## 🤝 Contributing

We welcome community contributions! Here's how to get involved:

- 🟢 [**Good First Issues**](docs/GOOD_FIRST_ISSUES.md) — Great starting points for new contributors.
- 🗺️ [**Roadmap**](ROADMAP.md) — Future milestones and architectural RFCs.
- 📖 [**Contributing Guide**](CONTRIBUTING.md) — Development setup, PR guidelines, and style rules.
- 📜 [**Code of Conduct**](CODE_OF_CONDUCT.md) — Community expectations and inclusivity standards.

---

## 📄 License & Attribution

This project is open-source under the **[Apache License 2.0](LICENSE)**.

```text
Copyright © 2026 Cloaktail Industries.
Founder & Lead: Sahanur Molla
All rights reserved.
```

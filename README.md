# Recovery Assistant Project

A private, independently maintained recovery organizer and defensive diagnostics toolkit. It is not affiliated with Epic Games, Discord, Microsoft, or other service providers.

## Start here

- **Windows desktop app:** open `Epic_Games_Recovery_Assistant/OPEN_PROJECT.bat` after extracting the project on Windows 10/11. This builds and launches the native C++17 desktop dashboard. It does not start the browser website.
- **Browser website:** install Node.js 26 LTS or newer, open a terminal in `Epic_Games_Recovery_Assistant/web/`, run `node server.mjs`, then open `http://127.0.0.1:8080`. The main dashboard includes a **DISCORD Server Dashboard** tab served through explicit same-origin routes.
- **Separate Recovery Panel:** see [recovery-panel/README.md](recovery-panel/README.md). It is a separate Node.js app with administrator configuration.
- **Full setup walkthrough:** [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md).
- **DigitalOcean/private network lab:** `Epic_Games_Recovery_Assistant/web/network-lab.html` (VPS, VPN, restricted proxy, Kali, PuTTY, and firewall tabs).
- **Server package setup lab:** `Epic_Games_Recovery_Assistant/web/server-network-lab.html` (Windows 11, Ubuntu, Kali, prerequisites, package commands, and usage tabs).
- **Folder and component map:** [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Main components

| Component | Location | Runtime |
|---|---|---|
| Native desktop dashboard | `Epic_Games_Recovery_Assistant/recovery_assistant.c++` | C++17 / Windows |
| Native PDF evidence scanner | `Epic_Games_Recovery_Assistant/paf_evidence_scanner.c++` | C++17 + Poppler `pdftotext.exe` |
| Browser website and multitool | `Epic_Games_Recovery_Assistant/web/` | HTML, CSS, browser JavaScript, Node.js server |
| Companion dashboard | `DISCORD-SERVER-DASHBOARD/` | Static HTML/CSS/JS; optional read-only private LAN host |
| Separate Recovery Panel | `recovery-panel/` | Node.js 26+, Express, browser JavaScript |
| CI workflows | `.github/workflows/` | GitHub Actions |
| Setup and project docs | `docs/` and component README files | Markdown / text |

## Current scope and important limitations

- The browser multitool and Recovery Panel are separate applications; both link to the network lab and package-setup guides, but they do not share a server or automatically synchronize records.
- Recovery records in the Recovery Panel are stored in that browser's local storage. Export a backup before clearing browser data or changing devices.
- The browser PDF scanner uses PDF.js from a CDN. The native Windows scanner uses Poppler for text extraction and does not OCR image-only PDFs.
- The Recovery Panel uses a custom SQLite-backed session store that persists across process restarts. It is a single-instance store, not a distributed multi-host session service. Do not expose the panel to the public internet or treat it as production-ready without HTTPS, network restrictions, secure database/key backups, deployment controls, and an independent security review.
- The project does not sign in to provider accounts, verify ownership, bypass account checks, or submit recovery requests on a user's behalf.
- Scanner inputs and reports are local. The project must not collect browser credentials, steal tokens, or transmit passwords, cookies, session data, or recovery codes.
- A successful GitHub Actions build proves only the checks in that workflow passed; it is not a complete security audit or a guarantee on every computer.

## Development and verification

The Windows workflow compiles the native C++ desktop app and PDF scanner and packages Windows artifacts. The web workflow checks inline browser JavaScript syntax, Node.js server syntax, Recovery Panel dependencies/audit, and compiles the C++ static web server.

The Recovery Panel currently has pinned direct dependencies but no committed `package-lock.json`; CI therefore uses `npm install`, not `npm ci`. Transitive dependency reproducibility remains an improvement item. See the setup guide for exact commands and limitations.

## Updates

Review changes through pull requests. Downloadable GitHub Actions artifacts expire according to their retention period; the source ZIP for the current `main` branch is separate and follows the latest commit.

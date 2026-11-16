# Setup Guide

This guide reflects the actual launch scripts and application boundaries in the repository. Keep the folder structure intact after extracting the ZIP.

## 1. Download and extract

1. Open the private GitHub repository in a browser and sign in with an account that has access.
2. Download the current `main` source ZIP or the latest Windows build artifact.
3. On Windows, right-click the ZIP and choose **Extract All**.
4. Keep the extracted `Epic_Games_Recovery_Assistant` folder intact. Do not run scripts directly from inside the ZIP preview.

Actions artifacts expire; the branch source ZIP follows `main` and is source code, not a prebuilt Windows installer.

## 2. Windows 10/11 — native desktop dashboard

**Easiest method**

1. Open the extracted `Epic_Games_Recovery_Assistant` folder.
2. Double-click `OPEN_PROJECT.bat`.
3. The setup checks for a C++17 compiler. If missing, it may offer to install MSYS2 and GCC through Windows Package Manager (`winget`).
4. The build script also checks for Poppler's `pdftotext.exe` for the native PDF scanner and may offer to install it through MSYS2.
5. Approve only installations you expect. Follow any restart/reopen instructions.
6. The scripts build `Epic_Games_Recovery_Assistant.exe` and `paf_evidence_scanner.exe`, then launch the native desktop dashboard.

**Important launcher distinction**

- `OPEN_PROJECT.bat` → `FIRST_RUN_SETUP.bat` → `first_run_setup.ps1` → build → native desktop app.
- `START_HERE.bat` → dependency helper → build → native desktop app.
- `run.bat` launches the already-built native desktop app.
- These desktop launchers do **not** start the browser website, install Node.js, or open the browser.

If automatic setup is unavailable, install MSYS2 from https://www.msys2.org/, open its UCRT64 terminal, run `pacman -Syu`, then install `mingw-w64-ucrt-x86_64-gcc` and `mingw-w64-ucrt-x86_64-poppler`. Ensure `C:\msys64\ucrt64\bin` is on PATH, reopen the terminal, and run `build.bat`.

## 3. Windows — main browser multitool

This is a separate app from the native desktop dashboard.

1. Install Node.js 26 LTS or newer from https://nodejs.org/.
2. Open PowerShell in `Epic_Games_Recovery_Assistant\web`.
3. Start the server:
   ```powershell
   node .\server.mjs
   ```
4. On the same PC, open http://127.0.0.1:8080.
5. To stop the server, return to PowerShell and press Ctrl+C.

The default server port is 8080; set the PORT environment variable before launch to use a different port. Optional DeepSeek chat and Telegram features require their own server-side environment settings. For administrator-reviewed recovery intake, also set RECOVERY_PANEL_INTAKE_URL to the Recovery Panel HTTPS base URL and RECOVERY_INTAKE_TOKEN to the shared random bearer secret. Configure the same token on the panel. Do not put API keys, intake tokens, or bot tokens in browser HTML/JavaScript or commit them to Git.

The Dockerfile is optional and is only for users who deliberately want a container deployment. The container listens on HTTP; public hosting requires HTTPS termination and appropriate network controls.

The browser navigation includes two separate lab workspaces: **DigitalOcean & VPS Lab** (`/network-lab.html`) and **Server Setup & Packages** (`/server-network-lab.html`). The second page has machine-specific tabs for Windows 11 host tools, Ubuntu VPS packages, WireGuard, restricted Squid, Kali Linux VM setup, and a per-device requirements checklist. These are instructions to review and run on the named machine; they do not install software or provision a VPS automatically.

## 4. Separate Recovery Panel

The Recovery Panel is not the same server as the main browser multitool.

1. Install Node.js 26 LTS or newer.
2. Open a terminal in the repository's `recovery-panel` folder.
3. Install the currently pinned direct dependencies:
   ```sh
   npm install
   ```
4. Create a strong, unique panel password and generate its scrypt record:
   ```sh
   node -e "const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');const h=c.scryptSync('REPLACE_WITH_A_LONG_UNIQUE_PANEL_PASSWORD',s,64).toString('hex');console.log(s+':'+h)"
   ```
5. Set these environment variables in your local shell or hosting secret manager:
   - `ADMIN_EMAIL`: administrator email.
   - `ADMIN_PASSWORD_SCRYPT`: generated `salt:hash` value.
   - `SESSION_SECRET`: random secret of at least 32 characters. Generate with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.
   - `NODE_ENV=development` for local use.
   - PORT=3000 (optional; default is 3000).
   - RECOVERY_DATA_KEY: exactly 64 hexadecimal characters for AES-256-GCM encryption. Generate with: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))".
   - RECOVERY_INTAKE_TOKEN: shared server-to-server secret of at least 32 characters. Generate with: node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))".
   - RECOVERY_DB_PATH: optional path for the SQLite database; default is recovery-panel/data/recovery-requests.sqlite.
   - Keep the same RECOVERY_INTAKE_TOKEN on the main web server and Recovery Panel. On the main web server also set RECOVERY_PANEL_INTAKE_URL to the panel base URL. Production URLs must use HTTPS.
6. Start the panel:
   ```sh
   npm start
   ```
7. Open http://localhost:3000 on that computer.

The panel has Recovery Records, PDF Evidence Scanner, and Fast Recovery Progress tabs. Existing manually created Recovery Records remain in browser local storage on that device. Incoming browser-tool submissions are stored separately in the panel's server-side SQLite database, encrypted at rest with the configured RECOVERY_DATA_KEY. The Fast Recovery Progress tab lets the administrator inspect incoming requests, request more information, approve or reject them, and record an official Epic reference after manual submission. Back up the SQLite database and its encryption key separately and securely. The panel also links to both network lab workspaces.

**Production warning:** administrator sessions now persist in a separate SQLite database across process restarts. This is a single-instance store, not a distributed multi-host session service. The panel is not certified production-ready. Before public deployment, enforce HTTPS, restrict network access, protect both SQLite databases and the encryption key with secure backups, review hosting logs, and arrange an independent security review. No production deployment is included in this setup.

The Recovery Panel uses Node's built-in node:sqlite module (Node 26+) for both the encrypted request database and persistent session database; no additional SQLite npm package is required. Run `npm test` to exercise synthetic intake, validation, administrator review, approved export, audit history, logout, and session persistence across a restart. Direct dependencies remain pinned and no package-lock.json is committed; CI uses npm install, not npm ci, so transitive dependency versions are not fully locked yet.

## 5. iPhone / mobile browser

- The browser interfaces are responsive web pages; open the website URL in Safari after the server is running and reachable from the phone.
- For same-Wi-Fi access, the PC firewall and server network binding must allow the phone to reach the PC's LAN address and configured port. Use a trusted private network only.
- Do not expose the development HTTP server directly to the public internet. Use a properly configured HTTPS deployment for remote access.
- The native Windows `.exe` files do not run on iPhone.
- Manually created Recovery Records remain local to the browser/device. Consented intake submissions are stored in the separate server-side encrypted database and are visible in Fast Recovery Progress after administrator sign-in.

## 6. PDF evidence scanner

- Native Windows scanner: `paf_evidence_scanner.c++` compiled to `paf_evidence_scanner.exe`; uses Poppler `pdftotext.exe` for text extraction.
- Browser scanners: PDF.js is loaded from a CDN, so the browser needs internet access to load the library.
- Neither path performs OCR on image-only pages. A PDF with scanned images may show no readable text.
- Browser and native PDF scanners run only when started by the user. The PDF scanners limit a run to 10 files, 20 MiB per file, and 500 pages per file; extracted text is processed in memory and not written to the report.
- Review evidence yourself. Scanner indicators are not proof of account ownership or credential validity.
- Keep sensitive source PDFs and exported reports private.

## 7. Network tools and multitool safety

Use network checks only on systems and networks you own or are authorized to administer. The included Windows network helper is limited to local status information and bounded private IPv4 TCP checks. It does not upload scan files, reports, credentials, or secrets through a VPN or proxy.

Never paste passwords, one-time codes, recovery codes, session cookies, access tokens, API keys, webhook URLs, or private keys into the project or support messages. The project must not be used to harvest browser tokens, activate token grabbers, bypass account verification, or exfiltrate credentials.

## 8. Updating and troubleshooting

- Read the change notes and review the PR before updating.
- The Windows updater requires GitHub CLI, authenticated access to the private repository, and a successful main-branch build artifact. It verifies the artifact checksum and backs up local files before copying.
- Do not run an update while the application is open. Close it first, then reopen after the update.
- If the build fails, capture the first meaningful error and the compiler/runtime versions. Remove personal information and secrets from logs before sharing.
- Check GitHub Actions for the exact commit and workflow result. A green CI run means the configured automated checks passed; it does not prove every feature works on every device.

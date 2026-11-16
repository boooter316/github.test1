# Recovery Assistant Web Panel

A separate, self-hosted dashboard. It is an independent organizer and is not affiliated with Epic Games.

## Features

- Server-side administrator sign-in; no public sign-up.
- Persistent administrator sessions stored in a separate SQLite database, with HTTP-only/SameSite cookies, login rate limiting, security headers, and scrypt password verification.
- Mobile-friendly dashboard for iPhone and desktop.
- Recovery Records, PDF Evidence Scanner, a local Account Identifier Evidence Scan tab, and Fast Recovery Progress, plus linked DigitalOcean/private-network and server package-setup lab pages.
- Local PDF evidence indicators and a local identifier evidence index for selected PDF/TXT/CSV/JSON files. The identifier index counts email-address patterns, explicitly labelled Fortnite display-name/username fields, and explicitly labelled Epic Account ID fields; it reports counts and page/line locations only. Document text and matched values are never displayed or included in reports.
- PDF scan reports can be downloaded as TXT from the panel.
- Epic Account ID/account-number field, customer first and last name, display name, optional account email, case status, support reference, non-secret error text, and notes.
- Structured linked-platform entries limited to platform name, public username, and public profile ID; requests to change an email/display name or review a linked-account disconnect are tracked for official provider support.
- Tracks access status for email, phone/SMS, and authenticator-app recovery methods.
- JSON and readable TXT exports downloadable on a phone or computer, plus validated JSON backup restore (with confirmation before replacing local records).
- Instant local search across recovery-record fields; search stays in the browser and does not send record contents to the server.
- Optional generic Discord notifications for panel sign-in, sign-out, and general dashboard errors. No account data or error contents are sent.

Manually created Recovery Records are stored in browser local storage on the device. Consented browser-tool intake requests are stored separately in the panel's encrypted server-side SQLite database and are never sent to Discord. Intake rejects unexpected fields and accepts only explicitly allowlisted non-secret account details.
- Administrators can export an individual approved request as JSON from Fast Recovery Progress. Export is disabled until approval, uses a no-store download, and records an export event in the audit history. The PDF and identifier scanners also process selected files in the browser; they do not upload evidence. The identifier scan is limited to 10 files per run and 20 MiB per file (text files have a 2 MiB decoded-text cap). Email addresses are counted by pattern; Fortnite names are counted only when explicitly labelled `Fortnite username` or `Fortnite display name`; Epic IDs are counted only when explicitly labelled `Epic Account ID`/`Account ID`. The report contains counts and page/line locations, never the matched values. It is a local document index, not an account lookup or ownership verification. It limits each scan batch to 10 PDFs, 20 MB per PDF, and 500 pages per PDF to keep memory use bounded. Image-only PDFs are not OCR-scanned, and encrypted or unreadable files may be skipped. Fortnite names and Epic IDs are counted only when their labels are explicit, to reduce false positives. PDF.js is loaded from its CDN, so the browser needs internet access to load the scanner engine. Export backups before clearing browser data or changing devices.

## Requirements and setup

Requires Node.js 26 LTS or newer. The request queue uses Node's built-in node:sqlite module; no SQLite npm dependency is needed. The panel's CI installs the pinned direct dependencies, checks server syntax, and runs an npm audit for high/critical production advisories. Generate a scrypt password hash from a strong unique panel password:

    node -e "const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');const h=c.scryptSync('REPLACE_WITH_A_LONG_UNIQUE_PANEL_PASSWORD',s,64).toString('hex');console.log(s+':'+h)"

Set these environment secrets on your host:

- ADMIN_EMAIL — administrator email for this panel.
- ADMIN_PASSWORD_SCRYPT — generated salt:hash value.
- SESSION_SECRET — random secret of at least 32 characters.
- NODE_ENV=production
- PORT — supplied by many hosts, otherwise defaults to 3000.
- RECOVERY_DATA_KEY — required to enable the encrypted SQLite request database; exactly 64 hexadecimal characters (32 random bytes). Generate with: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))".
- RECOVERY_INTAKE_TOKEN — shared server-to-server bearer secret, at least 32 random characters. Generate with: node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))". Configure the same value on the browser web server.
- RECOVERY_DB_PATH — optional path for the encrypted recovery-request SQLite database; defaults to recovery-panel/data/recovery-requests.sqlite.
- RECOVERY_SESSION_DB_PATH — optional path for the administrator-session SQLite database; defaults to recovery-panel/data/panel-sessions.sqlite. Keep both databases and backups outside public/static folders.
- Optional DISCORD_WEBHOOK_URL — generic event notifications only; request contents are never sent.

The main browser web server also needs RECOVERY_PANEL_INTAKE_URL set to the private panel's HTTPS base URL (for example, https://panel.example.com) and the same RECOVERY_INTAKE_TOKEN. The browser posts to its same-origin /api/recovery-intake endpoint; the web server forwards the request to the panel. Do not put either secret in browser JavaScript or commit it to GitHub.

Never commit passwords, password hashes, session secrets, or webhook URLs. Never send Epic account data, IP addresses, email addresses, recovery notes, evidence, or submitted error text to Discord.

## Dependency maintenance

The direct runtime dependencies are pinned to the reviewed stable releases: Express 5.3.0, express-rate-limit 8.7.4, express-session 1.19.0, Helmet 8.3.0, and dotenv 18.0.10. These versions were checked against the npm registry on 2026-11-16; no direct dependency bump was indicated. CI installs the committed dependency tree with `npm ci`, runs the panel tests, and audits production dependencies. When updating packages, update `package.json` and `package-lock.json` together, then run the same checks before merging.

## Run locally

Requirements:
- Node.js 26 LTS or newer (includes npm; use the Node.js installer or your operating-system package manager).
- No separate SQLite installation is required; the panel uses Node.js's built-in `node:sqlite` module.
- A terminal opened in the `recovery-panel` directory.

Install the exact dependency tree recorded in `package-lock.json`:

    npm ci

Start the panel:

    npm start

Open http://localhost:3000 on the same computer. For phone access, the server must be reachable on a trusted network. Do not expose an unencrypted HTTP login to the public internet.

## Tests and dependency reproducibility

Run `npm test` for the panel integration test. It starts the server with temporary SQLite databases and synthetic account details, then checks bearer-token intake, secret-field rejection, administrator login, review transitions, approved export, audit history, logout, and session persistence across a server restart. CI runs this test through `npm run check`.

The direct dependency versions in `package.json` are pinned and `package-lock.json` records the complete npm dependency tree and integrity hashes. Use `npm ci` for repeatable installs; it removes any existing `node_modules` directory and installs exactly what the lockfile records. To intentionally change dependency versions, edit `package.json` and run `npm install`, review the resulting lockfile diff, then run `npm ci`, `npm run check`, and `npm audit --omit=dev --audit-level=high` before committing both manifest files.

For the repository-wide component map and Windows/browser/mobile setup steps, see [the project setup guide](../docs/SETUP_GUIDE.md) and [project structure](../docs/PROJECT_STRUCTURE.md).

## Production caution

Administrator sessions are stored in `RECOVERY_SESSION_DB_PATH` (default `recovery-panel/data/panel-sessions.sqlite`) using SQLite so they survive a process restart. This is a single-instance session store, not a multi-region or multi-host session service. Back up the session database securely or allow sessions to expire; do not copy it into public/static folders. Approved-record export is an administrator convenience, not an Epic submission integration; it does not update Epic systems or perform email/username changes or linked-account disconnections. Before public deployment, enforce HTTPS, restrict network access, review hosting backups and logs, and arrange an independent security review. Persistent sessions do not certify the panel as production-ready.


## Administrator-reviewed recovery intake

The browser Recovery Assistant can submit a consented, non-secret recovery summary to the private panel. The main web server forwards it server-to-server using RECOVERY_INTAKE_TOKEN. The panel encrypts the request payload with AES-256-GCM and stores it in a local SQLite database using Node's built-in node:sqlite module. The administrator can review requests in the Fast Recovery Progress tab, request more information, approve or reject, and record the official Epic recovery reference after manually submitting through Epic's official recovery form.

Approval is an internal workflow state only. This project does not connect to, read from, or write to Epic's private databases and does not submit recovery requests to Epic automatically. Never collect or store passwords, one-time codes, backup codes, authenticator secrets, cookies, access tokens, full card numbers, CVV, or private account credentials. The web intake allowlist excludes IP/VPN history and payment credentials. The database key is not recoverable if lost; back up the key separately in a secure secrets manager and back up the database securely. Use HTTPS, access restrictions, secure backups, and a production-grade persistent session store before public deployment.

## Official Epic links

- https://www.epicgames.com/id/login
- https://www.epicgames.com/help/en-US/

The panel links to Epic's official pages; it does not imitate them, collect Epic passwords or verification codes, submit recovery requests, access Epic private systems, or bypass ownership checks. Email, SMS, and authenticator options are access-status notes only.

## Troubleshooting

- Missing configuration: set all three required administrator environment variables and restart.
- Sign-in fails: verify the admin email and exact scrypt salt:hash value.
- Page will not load: run npm ci, confirm Node.js 26+, then npm start and inspect the server terminal.
- Discord notifications do not arrive: verify the secret is an HTTPS Discord webhook URL for a server you control. Notifications are optional.
- iPhone export: use Safari and check Files > Downloads. The dashboard creates a file on demand; it does not email or upload records.

Never share panel passwords, webhook URLs, Epic passwords, 2FA codes, backup codes, cookies, or tokens when asking for help.


## Project checklist

The main website and Recovery Panel include an optional on-page checklist for tracking the included Recovery Assistant, local PDF scanner, navigation tabs, and background artwork. Checklist selections are temporary in the current page and are not saved or uploaded.


## DigitalOcean and private network lab

The dashboard links to two separate tabbed guides: `public/network-lab.html` covers DigitalOcean VPS, private WireGuard VPN, restricted private Squid proxy, Kali Linux, PuTTY/SSH, and IP/firewall checks; `public/server-network-lab.html` covers Windows 11, Ubuntu VPS, Kali VM, VirtualBox, PuTTY, requirements, and machine-specific package installation. Neither guide provisions billable cloud resources or stores provider API tokens. Keep proxy access private; never expose an open proxy. These guides are for authorized server administration and do not configure C2 or covert remote control.

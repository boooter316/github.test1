# Recovery Assistant Web Panel

A separate, self-hosted dashboard. It is an independent organizer and is not affiliated with Epic Games.

## Features

- Server-side administrator sign-in; no public sign-up.
- Session cookies, login rate limiting, security headers, and scrypt password verification.
- Mobile-friendly dashboard for iPhone and desktop.
- Separate Recovery Records and PDF Evidence Scanner tabs.
- Local PDF text inspection with page-level evidence indicators; document text and matched secret values are never displayed or included in reports.
- PDF scan reports can be downloaded as TXT from the panel.
- Epic Account ID/account-number field, display name, optional account email, case status, support reference, non-secret error text, and notes.
- Tracks access status for email, phone/SMS, and authenticator-app recovery methods.
- JSON and readable TXT exports downloadable on a phone or computer.
- Optional generic Discord notifications for panel sign-in, sign-out, and general dashboard errors. No account data or error contents are sent.

Recovery records are stored in browser local storage on the device and are not uploaded to the server or Discord. The PDF scanner also processes selected files in the browser; it does not upload evidence. Image-only PDFs are not OCR-scanned, and encrypted or unreadable files may be skipped. PDF.js is loaded from its CDN, so the browser needs internet access to load the scanner engine. Export backups before clearing browser data or changing devices.

## Requirements and setup

Requires Node.js 26 LTS or newer. The panel's CI installs the pinned direct dependencies, checks server syntax, and runs an npm audit for high/critical production advisories. Generate a scrypt password hash from a strong unique panel password:

    node -e "const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');const h=c.scryptSync('REPLACE_WITH_A_LONG_UNIQUE_PANEL_PASSWORD',s,64).toString('hex');console.log(s+':'+h)"

Set these environment secrets on your host:

- ADMIN_EMAIL — administrator email for this panel.
- ADMIN_PASSWORD_SCRYPT — generated salt:hash value.
- SESSION_SECRET — random secret of at least 32 characters. Generate with: node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
- NODE_ENV=production
- PORT — supplied by many hosts, otherwise defaults to 3000.
- Optional DISCORD_WEBHOOK_URL — webhook URL for a Discord server you control.

Never commit passwords, password hashes, session secrets, or webhook URLs. Never send Epic account data, IP addresses, email addresses, recovery notes, evidence, or submitted error text to Discord.

## Run locally

    npm install
    npm start

Open http://localhost:3000 on the same computer. For phone access, the server must be reachable on a trusted network. Do not expose an unencrypted HTTP login to the public internet.

## Production caution

The panel currently uses Express MemoryStore for sessions. MemoryStore is not suitable for production or multi-instance hosting. Do not expose this panel publicly until you configure a maintained persistent session store, enforce HTTPS, restrict network access, and review hosting backups and logs. The app emits a production warning; this update does not certify the panel as production-ready. This is not a completed security audit.

## Official Epic links

- https://www.epicgames.com/id/login
- https://www.epicgames.com/help/en-US/

The panel links to Epic's official pages; it does not imitate them, collect Epic passwords or verification codes, submit recovery requests, access Epic private systems, or bypass ownership checks. Email, SMS, and authenticator options are access-status notes only.

## Troubleshooting

- Missing configuration: set all three required administrator environment variables and restart.
- Sign-in fails: verify the admin email and exact scrypt salt:hash value.
- Page will not load: run npm install, confirm Node.js 20+, then npm start and inspect the server terminal.
- Discord notifications do not arrive: verify the secret is an HTTPS Discord webhook URL for a server you control. Notifications are optional.
- iPhone export: use Safari and check Files > Downloads. The dashboard creates a file on demand; it does not email or upload records.

Never share panel passwords, webhook URLs, Epic passwords, 2FA codes, backup codes, cookies, or tokens when asking for help.


## Project checklist

The main website and Recovery Panel include an optional on-page checklist for tracking the included Recovery Assistant, local PDF scanner, navigation tabs, and background artwork. Checklist selections are temporary in the current page and are not saved or uploaded.

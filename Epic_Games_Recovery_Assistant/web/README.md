# Browser-based Recovery Assistant (C++17) — updated companion form

This folder contains a C++17 web server and a browser-based recovery-request builder.

## Hosting and SellHub decision

**DigitalOcean is not part of the hosting plan. Do not create or deploy this app on DigitalOcean.**

SellHub at https://sellhub.cx/ is being considered as the storefront/checkout provider. A storefront and an application host are different services: the C++ server needs a continuously running Linux/container host that supports Docker (or an equivalent C++ runtime). I could not verify from publicly accessible SellHub documentation that sellhub.cx runs arbitrary customer C++/Docker applications; direct access to its site returned HTTP 403 during review. Therefore this project must not claim that SellHub hosts the C++ server.

Until SellHub confirms its supported integration and hosting capabilities, treat SellHub only as a possible sales/checkout layer. Choose a separate Docker-compatible host other than DigitalOcean for the C++ web service. No hosting provider has been configured or deployed yet.

## Current deployment status

The GitHub Actions Linux build confirms only that the C++ server compiles. It does not create a public website or deploy a running service.

The container expects HTTP port `8080` (or the `PORT` environment variable). Put it behind a provider-managed HTTPS ingress or a correctly configured reverse proxy with TLS. Do not expose the plain-HTTP container directly to the public internet.

## Updated recovery and appeal form

The browser form includes current and previous Epic contact/display-name details, requested display-name/email changes for planning, email/SMS/phone/authenticator-app 2FA method and access notes, optional historical VPN/proxy context, linked-platform identifiers, and platform-specific recovery/appeal fields for Epic, Xbox, PlayStation, Steam, and Nintendo. It can export a JSON packet and use browser print-to-PDF. The PDF/JSON/text packet is a user-entered evidence summary only—not an account dump, database export, credential dump, or executable script.

## Local security scanner tabs

The browser page also includes separate Discord and Fortnite/Epic text-scanning tabs. They inspect only text or log files the user explicitly selects, plus optional pasted text, inside the browser. The Fortnite scanner reports numbered findings with source filenames, line numbers, match categories, confidence labels, and previews; email addresses, account IDs, and display names are shown in full in local results and downloadable reports. Detection covers JWT-shaped values, Epic/Fortnite bearer or eg1 token patterns, and labelled password, passphrase, access/refresh/id/auth token, API/client secret, cookie, session, CSRF, and XSRF fields. Secret values remain redacted. Confidence labels describe pattern strength only and do not establish that a credential is valid. The scanners do not open browser credential stores, sign in, test whether a credential is active, or retrieve passwords, tokens, cookies, or sessions. A pattern match is not proof that an account is compromised or that a credential works.

## Privacy and scope

- Form data is processed in the browser tab only. The server serves the static page and has no form-submission endpoint or account database.
- Users can export a JSON recovery packet or use the browser Print / Save as PDF feature. Fortnite/Epic scan findings can be downloaded as a plain-text `.txt` report or printed/saved as PDF.
- The page does not request passwords, account PINs, full card numbers, CVV, 2FA codes, backup codes, authenticator secrets, cookies, or API keys.
- Historical IP/VPN details are optional context only, never proof of ownership. No IP spoofing, proxy rotation, account dumps, platform bypass, or restriction removal.
- It does not sign in to accounts, verify ownership, unlink services, change account details, lock accounts, submit tickets, or provide live agent chat.
- There is no hardcoded login or API key. Never put an API secret in browser JavaScript or a public repository.

## SellHub integration status

The current application has no paid-user login, checkout verification, or purchase-entitlement endpoint. Publicly accessible information for the exact `sellhub.cx` service was insufficient to verify its API/webhook contract. Do not confuse `sellhub.cx` with similarly named services or use another provider's API documentation as proof of compatibility.

Before enabling paid access, obtain the exact SellHub.cx seller API/webhook documentation or confirmation from SellHub support. Then implement server-side payment verification only if the provider supports authenticated, signed purchase/refund events or a trusted order-status API. The implementation must validate signatures, reject replayed events, handle refunds/chargebacks, and keep secrets in the chosen host's private environment variables. Never trust a browser redirect, query parameter, screenshot, or user-entered order number as proof of payment. Until that integration is verified and implemented, keep checkout and app access separate.

## Deploy to a non-DigitalOcean Docker host

These are provider-neutral requirements; they are not instructions for a specific provider:

1. Choose a host that explicitly supports continuously running Docker containers or Linux C++ web services.
2. Connect the private GitHub repository `boooter316/github.test1`, branch `main`.
3. Set the app's source/build context to `Epic_Games_Recovery_Assistant/web`.
4. Select the Dockerfile in that directory.
5. Configure the web service to listen on port `8080` (or pass the provider's assigned `PORT`).
6. Configure provider-managed HTTPS/TLS and test `/healthz`; it should return `ok`.
7. Confirm logs, restart behavior, resource limits, and private environment-variable support before making the service public.

Do not enter payment details or create a paid hosting resource until the provider, price, and deployment configuration are understood.

## API keys and sign-in

No API key is required for the current static form. If a future server-side integration needs a secret, store it only as a private environment variable on the selected host or in an appropriate CI secret; never put it in source code, HTML, JavaScript, GitHub commits, or PDFs. Use a proper identity provider for any future administrator or paid-user login; do not hardcode credentials in the application.

## Run with Docker locally

From this directory:

```sh
docker build -t recovery-assistant-web .
docker run --rm -p 8080:8080 recovery-assistant-web
```

Open http://localhost:8080 for local testing.

## Build locally

```sh
g++ -std=c++17 -O2 -Wall -Wextra -pedantic server.cpp -o recovery-web
PORT=8080 ./recovery-web
```


## Legal and authorized-use notice

Use the local scanners only on files and accounts you own or are expressly authorized to assess. Follow applicable laws, platform terms, and workplace policies. Pattern matches are not credential validation, proof of ownership, or proof of compromise. Do not use scan results to access another person's account, impersonate anyone, bypass security controls, or disclose private information. Review reports before sharing and promptly revoke or rotate any exposed credentials. This independent tool is provided “as is,” without warranty; it is not legal advice and does not guarantee account recovery or security.


## Expanded Fortnite/Epic scan reporting

The Fortnite/Epic scanner reports one numbered entry for each detected pattern match, including its source filename (or pasted-text source), line number, detection category, confidence label, and safe preview. The report includes scan timestamp, scanned-source list, totals by finding type, totals by source, and skipped-file notices. TXT export and browser print-to-PDF use the same report text.

In addition to authentication and account-detail patterns, the scanner includes heuristic indicators for SQL injection, cross-site scripting (XSS), HTML/script injection, command injection, path traversal, server-side template injection, and LDAP injection. These are static text-pattern indicators only: they can produce false positives and do not establish that an application is vulnerable or that an attack succeeded. The scanner does not execute input, probe a live service, test credentials, or perform exploit attempts. Passwords, tokens, cookies, and session secrets remain redacted in on-screen and exported reports.


## Pro-style multi-platform local scanner

The Pro-style scanner update expands local text scanning to identify account-related fields and log events associated with Epic Games/Fortnite, Xbox, PlayStation, Nintendo, Steam, Google, Twitch, YouTube, TikTok, Instagram, WeGo, and Roblox. Supported indicators include email addresses, Epic and platform-labelled account IDs, usernames/display names/gamertags, sign-in and account event references, JWT-shaped strings, and labelled credential fields.

The scanner accepts selected text/log/configuration files and text-based PDF files. PDF text extraction is performed locally in the browser with PDF.js loaded from its CDN; image-only/scanned PDFs are not OCR-scanned. File size is limited to 10 MB per file and PDF extraction is capped at 200 pages. Reports retain numbered findings, source filename, line number, type, confidence label, safely masked preview, scan timestamp, source/type totals, skipped-file notices, and TXT/PDF export.

**Credential safety:** Passwords, passphrases, tokens, cookies, session identifiers, and similar secret values are redacted. The scanner does not grab accounts or credentials, access browser password stores, validate logins, sign in, inspect platform databases, or bypass security controls. Account IDs, email addresses, and usernames are non-secret identifiers but may still be personal information; review reports before sharing them.

Detection is pattern-based and may produce false positives or miss formats not covered by its rules. Confidence labels describe pattern strength, not whether an account or credential is valid. PDF.js requires an internet connection to load; if it is unavailable, PDF files are reported as skipped. This is a local file auditor, not a commercial certification or guarantee of security.


## Windows 11 VPN and proxy controls

The Pro Multi-Platform Scanner tab includes optional controls for selecting a VPN setup preference, opening Windows VPN settings, entering an HTTP/HTTPS proxy endpoint, and downloading a PowerShell helper.

- Use the official app for third-party VPN providers. The helper can connect/disconnect a configured Windows built-in VPN profile; it is not a universal controller for every VPN client.
- The helper backs up the current-user Windows proxy values before enabling a proxy and offers a restore/off action. Use only proxy endpoints you own or are authorized to use.
- The page's VPN/proxy route selector records the intended mode (VPN only, proxy only, both, or neither); it cannot override provider routing or force applications that ignore Windows proxy settings. The status text distinguishes guidance from verified connection state.
- Windows proxy settings are HTTP/HTTPS only. SOCKS5 must be configured separately in an application that supports it.
- No paid VPS or DigitalOcean service is required.
- File selection, parsing, pattern matching, and reports remain local. The scanner does not upload scanned files or passwords, tokens, cookies, or session secrets through a VPN or proxy.

The browser cannot directly change Windows registry/network settings. Use the downloaded PowerShell helper and your VPN provider's official app to apply or restore settings. Review the script before running it. Windows runtime testing is required on the target PC before relying on it.


## Fortnite / Epic diagnostic log checks

The Pro Multi-Platform Scanner page also includes a separate local diagnostic check for common crash/fatal errors, launch or installation failures, network/DNS timeouts, Easy Anti-Cheat, Epic Online Services, update/version mismatches, and graphics/device issues. It reports aggregate counts only, limits each selected file to 5 MB, and does not display, save, or transmit log excerpts or credential values. These are troubleshooting indicators, not proof of account status, enforcement, or compromise.


## Support ticket manager and recovery retry guard

The Recovery Assistant includes a local ticket-drafting aid for preparing a consolidated new support request or a concise follow-up tied to an existing case. It does not submit tickets, send spam reports, contact Epic, or automatically retry account recovery.

- Local pacing limits: at most two new-ticket drafts in a rolling seven-day window, and one follow-up draft per 48 hours.
- The user can record an existing case reference and status, then prepare a follow-up that asks support to append new information to that same case.
- Only rate-limit timestamps are stored in browser local storage; account details and ticket text are not persisted by this feature or sent to the server.
- The pause message clearly states that it is an assistant-side drafting limit, not evidence that Epic has locked the account.
- If Epic displays an actual temporary lock or cooldown notice, follow the exact instructions and wait period shown by Epic. Do not repeatedly submit new tickets or reports while a case is pending.

These limits are client-side safeguards and can be cleared by clearing browser site data; they are not enforceable platform-wide limits and do not represent Epic's own ticket policy. Always use the official support channel and submit only accurate, necessary updates.


## Local IP and account evidence consistency report

The Pro scanner includes a local-only evidence review for reference IPv4/IPv6 addresses, account IDs, usernames/display names, email addresses, and optional incident date/time windows. It scans selected text/log/config files and pasted text, reports exact reference-identifier matches and other identifier-bearing lines, counts timestamps inside/outside the supplied window, and classifies the result as corroborated records, a partial match, or insufficient evidence. It provides TXT export and browser print/save-to-PDF.

- Files are limited to 5 MB each and 20 MB combined for this check.
- No IP geolocation, reputation lookup, account login, Epic API request, or remote verification is performed.
- “Corroborated records” means multiple identifier types were found in the selected text; it is not a percentage, identity verification, ownership certificate, or proof that no unauthorized access occurred.
- IP addresses can be shared/reassigned or reflect VPNs, proxies, mobile carrier NAT, schools, workplaces, or household networks. Usernames/emails can change or be copied; timestamps can be incomplete or use different time zones.
- A PDF is only a formatted copy of the report, not independent verification. For ownership review, provide original platform-issued records and original purchase receipts through official secure support. Only the platform can make an ownership decision.
- Evidence is processed in the browser tab and is not uploaded by this feature. Remove passwords, tokens, cookies, 2FA codes, and other secrets from logs before selecting them.


## Pro Account Ownership Evidence Packet

The Pro scanner includes a local-only ownership evidence packet builder. It lets a user identify the platform they are asking to review, record an existing official support case, note a non-secret receipt/order reference and oldest evidence date, select original evidence categories they say they can provide, and add factual notes. It generates a TXT report and a browser print/save-as-PDF copy.

- A historical IPv4/IPv6 address and its original source/date are required inputs before the packet can be generated. The user must copy these from an original account, platform security, or device record; the page validates only the address format, not its history or authenticity.
- The report records the supplied IP as **USER-SUPPLIED — NOT INDEPENDENTLY MATCHED OR VERIFIED**. An IP can be shared, reassigned, dynamic, or associated with a VPN, proxy, school, workplace, carrier NAT, or household; it does not identify a person by itself and cannot approve ownership.
- The report status is always **NOT VERIFIED — AWAITING OFFICIAL PLATFORM REVIEW**. Requiring an IP field does not certify an owner or authorize transfer/lockout. Only the platform can independently compare original IP/timestamp data and other evidence against its internal account records and decide who is entitled to the account.
- Checklist selections, IP details, and notes are user-entered claims; the tool does not authenticate receipts, screenshots, emails, IP history, or documents.
- Users should submit only original, unedited platform-issued records through official secure support. Do not fabricate or alter evidence or submit another person's private records.
- The feature does not request or accept passwords, 2FA codes, backup codes, cookies, tokens, full payment-card numbers, or document uploads. No account login, external lookup, API request, or upload occurs; the report is generated in the browser.


## Multi-tool tab navigation

The browser interface groups the existing features into selectable tabs so users can open one tool at a time instead of scrolling through every section.

- **Recovery Assistant** has separate Recovery Form, Ticket Manager, and Setup & Help tabs.
- **Discord Scanner** remains its own top-level tab.
- **Pro Multi-Tool** has separate Multi-Platform Scanner, VPN & Proxy, IP Evidence Checker, Ownership Packet, and Fortnite Diagnostics tabs.
- The tab organizer moves the existing feature elements without replacing their controls or event handlers. The original local-only processing and credential-redaction boundaries remain in force.
- Tabs are created in the browser at page load. This change does not install or run user-supplied scripts, activate Windows networking, connect to accounts, or make account changes.

# Browser-based Recovery Assistant (C++17) — updated companion form

This folder contains the browser-based recovery-request builder, a Node.js web/API server for the optional DeepSeek chat, and the original C++17 static server source.

## First-run Windows setup

For Windows 10/11, extract the project and double-click
`Epic_Games_Recovery_Assistant/OPEN_PROJECT.bat`. This launcher runs
`FIRST_RUN_SETUP.bat` and `first_run_setup.ps1`, checks for the C++ build
tools, builds the native desktop application and launches it.

**This launcher does not install Node.js, start the browser server, or open
the browser dashboard.** The actual batch and PowerShell launchers were
checked against this description on the current main branch.

For the browser multitool, install Node.js 26 LTS or newer separately. Open a
terminal in this `web/` folder, run `node server.mjs`, then visit
`http://127.0.0.1:8080`. Press Ctrl+C in the server terminal to stop it.

`START_HERE.bat` is another desktop-focused setup path. `run.bat` launches
the already-built native desktop app only. The optional Dockerfile runs the
Node.js browser server in a container; Docker is not required for local use.
Package installation requires user approval, and a new PATH entry may
require opening a fresh terminal or restarting Windows.

For the complete, current walkthrough, see [the repository setup guide](../../docs/SETUP_GUIDE.md)
and [the project structure map](../../docs/PROJECT_STRUCTURE.md).

Docker is optional for local use. It is only needed if you specifically want
to run the browser server in a container. Windows does not run installers
merely because a folder is opened; the user must launch the setup batch file
and approve any requested installations. The setup does not install or
configure API keys, Telegram bot tokens, VPN/proxy settings, or browser
extensions. Those remain separate, explicit configuration steps.

## Dashboard and Script Builder

The browser dashboard links to the existing Recovery Assistant, scanners,
account pages, network diagnostics, and Setup & Install page. The separate
Script Builder imports and edits user-selected text source locally (up to
2 MB) and supports Python, C++17, and C#.

The builder can download a source file or a single ZIP containing source,
README/setup instructions, a test script, a Windows run script, and an EXE
build script. Python projects use PyInstaller; C++17 projects use MSVC or
g++; C# projects target .NET 10 and publish a self-contained Windows x64
single-file executable. Visual Studio Code and Visual Studio are supported
as editors.

### Script Builder requirements

- **Python:** Python 3.10 or newer and pip. The generated build script installs
  the requirements listed in `requirements.txt` and PyInstaller.
- **C++17:** Visual Studio with the Desktop development with C++ workload
  (MSVC), or MSYS2 with the UCRT64 GCC toolchain.
- **C#:** .NET 10 SDK, or a Visual Studio version with .NET 10 support and
  the .NET desktop development workload.
- **Editors:** Visual Studio Code or Visual Studio. The editor alone is not
  a compiler; install the language SDK/toolchain as listed above.

The browser never executes imported code or uploads source files to the
server. It prepares local files for the user to review and run on Windows.
The Debug/Review action checks only basic file integrity; the generated
Test script invokes the actual language compiler/runtime locally. The Build
EXE package creates the Windows build instructions and batch file, but the
EXE is not built until that batch file succeeds on the Windows computer.
Changing a file extension does not translate code between languages. Review
source and third-party dependencies before running them. Do not use the
builder for credential theft, token grabbers, malware, unauthorized access,
stealth, or exfiltration. The global Stop control requests cancellation for
cooperative browser tasks; a separate Windows process must be stopped in
its own terminal (Ctrl+C).

## Hosting and SellHub decision

**DigitalOcean is not part of the hosting plan. Do not create or deploy this app on DigitalOcean.**

SellHub at https://sellhub.cx/ is being considered as the storefront/checkout provider. A storefront and an application host are different services: the C++ server needs a continuously running Linux/container host that supports Docker (or an equivalent C++ runtime). I could not verify from publicly accessible SellHub documentation that sellhub.cx runs arbitrary customer C++/Docker applications; direct access to its site returned HTTP 403 during review. Therefore this project must not claim that SellHub hosts the C++ server.

Until SellHub confirms its supported integration and hosting capabilities, treat SellHub only as a possible sales/checkout layer. Choose a separate Docker-compatible host other than DigitalOcean for the C++ web service. No hosting provider has been configured or deployed yet.

## Current deployment status

The GitHub Actions Linux build confirms only that the C++ server compiles. It does not create a public website or deploy a running service.

The Docker container runs the Node.js server on HTTP port `8080` (or the `PORT` environment variable). It serves `index.html`, the local analyzer assets, `/healthz`, and a same-origin `/api/chat` endpoint. The chat endpoint forwards requests to DeepSeek using a server-only API key. Browser connections are limited to the same origin. The original `server.cpp` remains available as a static-only C++ server; it does not provide the DeepSeek API proxy. Put it behind a provider-managed HTTPS ingress or a correctly configured reverse proxy with TLS. Do not expose the plain-HTTP container directly to the public internet.

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

The recovery-request form itself does not require an API key. Faze Jarvis does use a DeepSeek API key on the server; configure it only as a private host environment variable. Never put API secrets in source code, HTML, JavaScript, GitHub commits, or PDFs. Do not hardcode credentials in the application.


## Faze Jarvis / DeepSeek chat

The Faze Jarvis tab uses the official DeepSeek Chat Completions endpoint through `server.mjs`. The default model is `deepseek-flash`, with thinking enabled and DeepSeek's high safety-check option. The browser sends chat messages only to the same-origin backend; it never receives the DeepSeek API key.

Configure these private environment variables on the Docker host:
- `DEEPSEEK_API_KEY`: your DeepSeek API key.
- `CHAT_ACCESS_PASSWORD`: a separate password that authorizes access to this app's chat endpoint.

Both values are required. Enter only the app access password in the browser chat form; never paste the DeepSeek API key into the page. The backend validates message roles and lengths, limits requests, applies a timeout, and does not log chat contents. Keep the service behind authenticated/private access and monitor API usage. A public deployment needs proper user authentication and abuse controls before enabling paid API access.

The assistant is intended for ordinary coding and defensive security. It does not bypass provider safety systems, authentication, platform restrictions, or access controls. It is not a substitute for reviewing generated code.

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

 
## Official account links page

The browser interface includes a separate **Account Links** page with shortcuts to official websites for Epic Games/Fortnite, Roblox, GTA/Rockstar Games, Minecraft, Xbox, Steam, PlayStation, Nintendo, TeamSpeak, GitHub, Facebook, Instagram, Twitch, YouTube, TikTok, X, Snapchat, Microsoft, Google, Gmail, and Yahoo. These are external website shortcuts only; they do not connect accounts, read private profile data, sign in, validate credentials, or change linked-account settings. Users must sign in and manage connections directly through each service's official website. The links open in a new tab with `noopener noreferrer`. The page also includes Discord, Disney+, GeForce NOW, LEGO, Cash App, PayPal, Apple ID/Apple Pay, Google Pay, and Bitcoin wallet-selection information.


## Network Security & Wireshark suite

The Pro Multi-Tool includes a separate Network Security & Wireshark sub-tab.

- **Windows connection snapshots:** download and run `network_security_snapshot.ps1` on a Windows computer you own or are authorized to administer. A normal run writes a JSON snapshot; `-Watch` writes periodic JSONL snapshots. It records interface IP configuration, TCP endpoints/states, UDP endpoints, and adapter byte/packet counters. It does not capture packet payloads or collect passwords, cookies, tokens, or message contents.
- **Wireshark capture analysis:** import authorized `.pcap` or `.pcapng` files (50 MB per file, 250,000 packets parsed per file). The in-browser parser reports packet/protocol counts, endpoint pairs, DNS query names, and TLS ClientHello/SNI metadata where supported. It does not display packet payloads or attempt to decrypt TLS.
- **Credential-exposure indicator:** optionally inspect an authorized Wireshark text export or log. The detector counts password/token/cookie/session/API-secret-like patterns and discards matched values; it does not test or validate credentials.
- **Reports:** export the summary to TXT or use browser print/save-as-PDF. DNS names and endpoint metadata can still be sensitive; keep reports private.

The browser cannot directly capture live packets or inspect Windows network interfaces. Use Wireshark for user-initiated packet capture and the PowerShell helper for local metadata snapshots. The helper requires Windows PowerShell with the NetTCPIP/NetAdapter cmdlets; some endpoint details may be unavailable without elevated permissions. The PCAP parser currently supports Ethernet, Linux cooked v1, and raw-IP classic PCAP/PCAPNG captures; unsupported link types or malformed captures may be skipped. This is defensive metadata analysis, not credential interception, traffic decryption, identity attribution, or proof of compromise. Capture only traffic you own or have explicit authorization to inspect.


## Account Status & Details workspace

The separate **Account Status & Details** top-level page provides an individual service tab for Epic Games/Fortnite, Roblox, Rockstar/GTA, Minecraft, Xbox, Steam, PlayStation, Nintendo, TeamSpeak, GitHub, Facebook, Instagram, Twitch, YouTube, TikTok, X, Snapchat, Microsoft, Google, Gmail, Yahoo, Discord, Disney+, GeForce NOW, LEGO, Cash App, PayPal, Apple ID/Apple Pay, Google Pay, and Bitcoin wallet information.

- Each service tab links to that provider's official site and provides fields for username/display name, email, public account/profile ID, optional user-supplied IP address, user-reported status, last-checked date, and non-secret notes.
- The page always labels provider connection as **NOT CONNECTED — official provider authorization is not configured**. Opening an official site is not an OAuth connection and does not retrieve private account data.
- Values are user-entered and explicitly marked unverified. The TXT export is a copy of those notes, not a provider-issued status report or proof of ownership.
- Drafts remain in JavaScript memory in the current browser tab only; they are not uploaded or persisted after refresh/close.
- Real account data access would require a separate provider-approved OAuth/API integration for each service, secure server-side callback/session handling, app registration and credentials, documented scopes, user consent, and provider policy review. This UI does not implement those integrations.
- Do not enter passwords, 2FA/one-time codes, recovery codes, cookies, session/API tokens, full payment details, wallet seed phrases, or private keys. Bitcoin is a network/asset, not a single account provider; the Bitcoin entry links to wallet-selection information only.

## Account Connections & Payment Services

A separate Account Connections page provides official-site shortcuts for Discord, Disney+, NVIDIA/GeForce NOW, LEGO, Roblox, Microsoft/Xbox, Google, Epic Games, Cash App/Bitcoin, PayPal, Apple Pay, and Google Wallet/Pay. It explains where users can review authorized apps, linked accounts, and automatic payments, and how to revoke a connection with the provider.

These are provider shortcuts and user instructions only. The project does not authenticate, exchange OAuth tokens, verify account ownership, connect payment wallets, read balances, move funds, or remove third-party connections. The page always states that connection status is not checked by this app. Real linking requires provider-specific approval, OAuth/API registration, secure server-side implementation, explicit consent, and appropriate payment-provider approval. Never enter passwords, one-time codes, wallet seed phrases, private keys, full card numbers, or CVV.

## Wireshark packet and port diagnostics

A separate Wireshark & Ports page links to the official Wireshark download and user guide, provides common display-filter examples, and builds a TCP, UDP, or combined display filter for a user-entered port (1–65535). The page does not capture packets itself, sniff other people's traffic, scan public IP ranges, open ports, or transmit packets. Capture only traffic you own or have explicit authorization to inspect. Packet captures can contain personal or authentication data; keep captures minimal and private.


## DigitalOcean & VPS Network Lab

The browser multitool provides a separate **DigitalOcean & VPS Lab** navigation link. The tabbed guide covers manually creating a DigitalOcean Droplet, private WireGuard VPN, restricted Squid proxy, Kali Linux in VirtualBox, PuTTY/SSH administration, and server IP/firewall checks. It does not create paid cloud resources or handle DigitalOcean API credentials. Restrict SSH and proxy ports to trusted addresses, and never operate an open proxy. These are legitimate administration guides, not C2 instructions.

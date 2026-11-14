# Epic Games Recovery Assistant — Windows Desktop Edition

**Version 3.9.** A locally run Windows C++17 recovery-information organizer. It is not made, operated, or endorsed by Epic Games.

## Download the Windows executable

The Windows build is produced by GitHub Actions. Open the latest successful **Build Windows Recovery Assistant** run, expand **Artifacts**, and download **Epic-Games-Recovery-Assistant-Windows**. Extract the downloaded ZIP and run `Epic_Games_Recovery_Assistant.exe`.

- [Latest Windows build workflow runs](https://github.com/boooter316/github.test1/actions/workflows/build-windows.yml)
- [Windows build workflow](https://github.com/boooter316/github.test1/blob/main/.github/workflows/build-windows.yml)

The repository is private, so downloading the artifact requires access to this repository. GitHub Actions builds the executable; it does not install or run it on your computer. Windows may show a security warning for an unsigned executable. Only run a build you downloaded from this repository and trust.

## No hosting required

This is a **desktop executable**, not a website deployment. It runs locally on a Windows computer and does not require DigitalOcean, SellHub, a VPS, Docker, a public server, or a continuously running hosting provider. SellHub is not required to launch or use the program. No SellHub API key or webhook is needed.

The separate browser-based prototype in the `web/` folder is not the Windows desktop executable and is not needed to run this program.

## Build from source (optional)

1. Install MinGW-w64/GCC with C++17 support and add `g++` to PATH: https://www.mingw-w64.org/
2. Open this folder in File Explorer.
3. Run `setup.bat` to compile `recovery_assistant.cpp`.
4. Run `run.bat` to launch the program.

The GitHub Actions workflow also builds a Windows executable whenever the desktop source or build workflow changes, and can be manually run from the GitHub Actions tab.

## Features

- Organizes Epic Account ID, current/previous display names and emails, account dates, creator code, invoice/order ID, purchase name, optional billing address, payment provider, and card last four digits only.
- Records each 2FA method (Epic Authenticator, third-party authenticator app, email, SMS/phone), preferred method, and separate access-status notes for each method. It can record which official recovery contact method the user wants to discuss with support. It does not store phone numbers or verification codes.
- Optional historical IP and VPN/proxy provider/region/use/date notes for truthful context only; the app does not connect to, configure, rotate, or use a VPN/proxy.
- Platform-specific recovery/restriction appeal notes and official support links for Epic, Xbox, PlayStation, Steam, and Nintendo.
- Linked-service review fields for Xbox, PlayStation, Steam, Nintendo, Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, and other services.
- Planning fields for Epic display-name/email changes; actual changes require official sign-in and verification.
- Exports a local recovery evidence packet: PDF report, JSON data, readable text details, support-request draft, and a copy of `recovery_assistant.cpp` when `recovery_assistant.cpp` is beside the executable. The checklist can note names of genuine evidence files kept privately on the computer; it does not ingest or extract those files. If it is unavailable, the packet includes `SOURCE_NOT_COPIED.txt`. This exports only information the user enters; it cannot extract platform databases, credentials, cookies, tokens, or account data.
- Opens official recovery, support, account settings, linked-account and 2FA help pages.

## Version 3.9 additions

- Adds Epic recovery request status, request ID, last-submission date/waiting-period, and missing non-secret evidence tracking.
- Copies the C++ source file from beside the running executable into the export packet, including when launched from a desktop shortcut.
- Aligns the setup and launcher scripts with the executable filename produced by GitHub Actions.
- Retains structured case/reference ID, restriction type, date/duration, appeal status, and factual-notes fields for Xbox, PlayStation, Steam, and Nintendo.
- Adds an evidence-file checklist and evidence-source/date notes so users can organize genuine receipts, notices, screenshots, and support emails they already possess.
- Clarifies that the preferred email/SMS-phone/authenticator route is a planning note for official support; the program does not collect the full phone number or verification codes.
- Adds an expanded restriction-review checklist for all supported platforms.
- Keeps export limited to user-entered notes; no platform account dump, credential dump, or account-extraction script is included.

## Earlier features

- Separate access-status fields for email, SMS/phone, Epic Authenticator, and third-party authenticator apps.
- Additional historical VPN/proxy-use notes and explicit prompts to use only remembered, truthful network history.
- Separate appeal-summary fields for Xbox, PlayStation, Steam, and Nintendo.
- Clear evidence-export wording: the PDF/JSON/text packet contains only information typed into the app; there is no account dump or account-extraction script.

## Security and limitations

- This app does not sign in to Epic, contact Epic APIs, verify ownership, or submit tickets. The readiness field is only your own checklist, not an ownership check.
- It cannot remove restrictions/bans, unlink services, change usernames/emails/payment methods, lock accounts, or guarantee recovery. The relevant platform must approve those actions.
- It does not provide live agent chat or pretend to be an agent.
- It does not spoof IP addresses, rotate proxies, bypass 2FA, impersonate a previous network/location, or access databases through PuTTY, C2, or VPS infrastructure.
- A remembered IP is optional context, not proof of ownership and not required by this app.
- Never enter passwords, account PINs, CVV, full card numbers, 2FA codes, backup codes, authenticator secrets, session cookies, or access tokens.
- Billing details and card last four digits are optional. Provide them only through an official secure form if the platform specifically requests them.
- Keep exported files private because they may contain personal information.

## Official Epic resources

- Recovery help: https://www.epicgames.com/help/c-45487929/a21414514
- Support/contact: https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US
- Linked accounts: https://www.epicgames.com/account/connections
- 2FA/security settings: https://www.epicgames.com/account/password
- Available 2FA methods: https://www.epicgames.com/help/c-45487929/c-38978022/a11272697
- Lost authenticator/SMS access: https://www.epicgames.com/help/c-45487929/c-38978022/a22922707?lang=en-US
- Sign-in: https://www.epicgames.com/id/login
- Sanctions and appeals: https://safety.epicgames.com/en-US/sanctions-and-appeals

## Build status

The Windows workflow compiles the C++ source and uploads the resulting executable as a downloadable artifact. A successful build confirms compilation, not a complete runtime test on every Windows computer.

# Epic Games Recovery Assistant — Windows Desktop Edition

**Version 4.4.** A locally run Windows C++17 recovery-information organizer. It is not made, operated, or endorsed by Epic Games.

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
3. Run `build.bat` (or `setup.bat`) to compile `recovery_assistant.cpp`.
4. Run `run.bat` to launch the program.

The GitHub Actions workflow also builds a Windows executable whenever the desktop source or build workflow changes, and can be manually run from the GitHub Actions tab.

## Prompts

Use the following prompts when asking an AI assistant to help maintain this project. Share the relevant source files and error messages, but never share passwords, 2FA codes, backup codes, session cookies, access tokens, or other account secrets.

**Add a feature**

> Update the Epic Games Recovery Assistant in C++17. Preserve the existing Windows desktop console application, menu structure, local-only design, and current features. Add the requested feature using truthful user-entered recovery notes and official platform guidance only. Do not add account scraping, credential collection, IP spoofing, proxy rotation, verification bypasses, or automatic account actions. Update the README and build scripts if needed.

**Fix a build error**

> Review the supplied C++17 source and exact compiler output. Identify the cause, make the smallest safe correction, and keep the project compatible with the existing Windows build workflow and setup.bat. Do not claim the program builds or runs unless the build and runtime tests have actually passed.

**Review security and privacy**

> Audit this project for collection or storage of passwords, 2FA codes, backup codes, authenticator secrets, cookies, tokens, full payment-card numbers, or CVV. Check that exports contain only user-entered non-secret information, that local data stays local, and that recovery and appeal actions remain with the official platform.

**Update the documentation**

> Update the README to match the actual current source code, setup instructions, menu options, export files, and GitHub Actions workflow. Keep setup/build instructions separate from usage instructions, and put this Prompts section directly after the project setup/build instructions.

## Features

- Dedicated failed-recovery tracking and an Epic follow-up ticket draft, included in the local evidence packet.
- Expanded linked-service inventory for Xbox, PlayStation, Nintendo, Steam, Twitch, YouTube, Instagram, TikTok, Facebook, Google/Gmail, LEGO, Roblox, and GTA/Rockstar Games.
- Password-change planning prompts that never request or store a current or new password; users must change passwords themselves through Epic's official security page.
- Phone-number ownership status without collecting the full number, plus explicit IP-history consistency notes.

- Organizes Epic Account ID and optional Epic-provided account-number/reference (both exported to PDF, JSON, and text), current/previous display names and emails, account dates, creator code, invoice/order ID, purchase name, optional billing address, payment provider, and card last four digits only.
- Records each 2FA method (Epic Authenticator, third-party authenticator app, email, SMS/phone), preferred method, and separate access-status notes for each method. It can record which official recovery contact method the user wants to discuss with support. It does not store phone numbers or verification codes.
- Optional historical IP and VPN/proxy provider/region/use/date notes for truthful context only; the app does not connect to, configure, rotate, or use a VPN/proxy. An optional login-activity CSV records only manually entered attempt metadata (username/display name, email, activity, result, and non-secret error message), never passwords or authentication codes.
- Platform-specific recovery/restriction appeal notes and official support links for Epic, Xbox, PlayStation, Steam, and Nintendo.
- Linked-service review fields for Xbox, PlayStation, Steam, Nintendo, Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, and other services.
- Planning fields for Epic display-name/email changes; actual changes require official sign-in and verification.
- Exports a local recovery evidence packet: PDF report, JSON data, readable text details, support-request draft, optional IP-history CSV log, optional login-activity CSV log, and a copy of `recovery_assistant.cpp` when `recovery_assistant.cpp` is beside the executable. The checklist can note names of genuine evidence files kept privately on the computer; it does not ingest or extract those files. If it is unavailable, the packet includes `SOURCE_NOT_COPIED.txt`. This exports only information the user enters; it cannot extract platform databases, credentials, cookies, tokens, or account data.
- Includes an offline guided recovery chat for common questions; it is not a live AI model or Epic agent.
- Prepares a support-request draft and opens Epic's official contact page; the user reviews and submits it. No automatic ticket submission or direct Epic API connection.
- Opens official recovery, support, account settings, linked-account and 2FA help pages.

## Version 4.4 additions

- Adds `build.bat` as a one-click build launcher; `setup.bat` performs the C++17 compilation of the correctly named `recovery_assistant.cpp` into `Epic_Games_Recovery_Assistant.exe`.
- Adds an optional local `ip_history_log.csv`. It appends IP addresses manually entered by the user, the Epic Account ID label, approximate use date, record source, and a clear `NOT VERIFIED` status.
- The logger does not discover the device's IP, make network requests, spoof an address, use a VPN/proxy, or compare an address with Epic's private records. It cannot confirm that an IP belongs to the account; only Epic can perform that verification.

## Version 4.4 additions

- Adds an optional `login_activity_log.csv` that records user-reported sign-in/password-reset/recovery-attempt metadata with a local timestamp, account ID label, optional username/display name and email, activity type, result, and non-secret error message.
- Marks each entry `USER-REPORTED - NOT VERIFIED BY EPIC`. The app does not monitor sign-ins, connect to Epic, or capture passwords, 2FA codes, backup codes, cookies, or tokens.
- Keeps VPN/proxy details as historical notes only. It does not route traffic through proxies, rotate VPNs, spoof IP addresses, or imitate a previous location.

## Version 4.3 additions

- Adds an optional local `login_activity_log.csv` for user-reported sign-in and recovery-attempt metadata: local timestamp, Epic Account ID label, username/display name, email address, activity type, result, and non-secret error message. Entries are marked `USER-REPORTED - NOT VERIFIED BY EPIC`.
- The login log never asks for or stores passwords, 2FA codes, backup codes, cookies, or tokens. It does not sign in to Epic or monitor login activity automatically.

## Version 4.2 additions

- Adds an expanded linked-service inventory for Xbox, PlayStation, Nintendo, Steam, Twitch, YouTube, Instagram, TikTok, Facebook, Google/Gmail, LEGO, Roblox, and GTA/Rockstar Games. It records public profile identifiers and link-status notes only.
- Adds password-change planning and phone-number-control status without collecting passwords, full phone numbers, or verification codes.
- Adds historical IP consistency notes, including the source/date of a remembered IP. The app cannot obtain Epic's internal IP records, compare addresses against them, or verify account creation/ownership. Epic must perform any account-side verification through its official process.

## Version 4.1 additions

- Adds an Account Recovery Failed section to record whether an attempt failed, date/time, exact error text, failed step, Epic request/reference number, prior troubleshooting, waiting instructions, and prior support response.
- Includes those failure details in the PDF, JSON, and readable text evidence exports.
- Reworks the support-request draft into a recovery-failure follow-up message that includes the recorded failure details and asks Epic for approved next steps or alternative verification options.
- The app does not automatically retry recovery, submit tickets, bypass waiting periods, or guarantee account restoration.

## Version 4.0 additions

- Adds an explicit optional Epic account-number/alternate-reference field alongside Epic Account ID; both are included in the PDF, JSON, and readable text export.
- Adds an offline guided recovery chat covering account IDs, historical IP notes, 2FA, evidence exports, and support-ticket preparation. It is clearly labeled as an offline helper, not live AI or Epic Support.
- Keeps support-ticket creation as a reviewed draft for the account owner to submit through Epic's official contact form; the app does not claim to send tickets or contact Epic directly.

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
- The guided chat is an offline rule-based helper, not a live AI service or Epic agent. It does not provide live agent chat or pretend to be an agent.
- The support-request draft is not sent automatically. The user must review it and submit it through Epic's official contact process.
- It does not spoof IP addresses, rotate proxies, bypass 2FA, impersonate a previous network/location, or access databases through PuTTY, C2, or VPS infrastructure.
- A remembered IP is optional context, not proof of ownership and not required by this app. The app cannot perform a live IP check or compare a user's IP with Epic's private account records; do not treat an apparent match as verification.
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

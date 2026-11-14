# Epic Games Recovery Assistant — C++17 Edition

**Version 3.3.** A Windows C++17 local recovery-information organizer. It is not made, operated, or endorsed by Epic Games.

## Build and run (Windows)

1. Install MinGW-w64/GCC with C++17 support and add `g++` to PATH: https://www.mingw-w64.org/
2. Open this folder in File Explorer.
3. Run `setup.bat` to compile `recovery_assistant.cpp`.
4. Run `run.bat` to launch the program.

The PDF generator is built into the C++ source; no Python, external PDF package, or separate PDF installer is needed. `setup.bat` builds the C++ program; it does not install a PDF reader.

## Version 3.3 additions

- Expanded original-account-country and purchase-history context fields.
- Added clearer payment-method review notes without collecting full card numbers, CVV, or payment credentials.
- Added a per-service linked-account inventory prompt covering public IDs/profile names, approximate link dates, and current link status.
- Added separate appeal-note fields for Epic, Xbox, PlayStation, Steam, and Nintendo.
- Added an official Epic Support Assistant/ticket entry in the page menu. The app still cannot provide live agent chat or submit a ticket itself.

## Features

- Organizes Epic Account ID, current/previous display names and emails, account dates, creator code, invoice/order ID, purchase name, optional billing address, payment provider, and card last four digits only.
- Records each 2FA method (Epic Authenticator, third-party authenticator app, email, SMS/phone), preferred method, and access status separately. Never stores verification codes.
- Optional historical IP and VPN/proxy provider/region/use notes for truthful context only; the app does not connect to, configure, rotate, or use a VPN/proxy.
- Platform-specific recovery/restriction appeal notes and official support links for Epic, Xbox, PlayStation, Steam, and Nintendo.
- Linked-service review fields for Xbox, PlayStation, Steam, Nintendo, Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, and other services.
- Planning fields for Epic display-name/email changes; actual changes require official sign-in and verification.
- Exports a local recovery packet: PDF, JSON data dump, readable text details, and support-request draft. The C++ source itself is the buildable program; no separate Python script is used.
- Opens the current Epic account-recovery request form, support, sign-in, account settings, display-name/email help, linked-account and 2FA recovery pages, plus official Xbox, PlayStation, Steam, and Nintendo support pages.
- Includes a direct link to Epic’s official Sanctions and Appeals portal; Epic reviews eligible Epic sanctions, while Xbox, PlayStation, Steam, and Nintendo restrictions must be appealed with the respective platform.

## Security and limitations

- This app does not sign in to Epic, contact Epic APIs, verify ownership, or submit tickets. The readiness field is only your own checklist, not an ownership check.
- It cannot remove restrictions/bans, unlink services, change usernames/emails/payment methods, lock accounts, or guarantee recovery. The relevant platform must approve those actions.
- It prepares a support draft; it does not provide live agent chat or pretend to be an agent.
- It does not spoof IP addresses, rotate proxies, bypass 2FA, impersonate a previous network/location, or access databases through PuTTY, C2, or VPS infrastructure.
- A remembered IP is optional context, not proof of ownership and not required by this app.
- Never enter passwords, account PINs, CVV, full card numbers, 2FA codes, backup codes, authenticator secrets, session cookies, or access tokens.
- Billing details and card last four digits are optional. Provide them only through an official secure form if the platform specifically requests them.
- If ownership evidence is missing, the app advises pausing and contacting official support. It never automatically locks, disables, or temporarily suspends an account.
- Keep exported files private because they may contain personal information.

## Official Epic resources

- Recovery help: https://www.epicgames.com/help/c-45487929/a21414514
- Support/contact: https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US
- Linked accounts: https://www.epicgames.com/account/connections
- 2FA/security settings: https://www.epicgames.com/account/password
- Available 2FA methods: https://www.epicgames.com/help/c-45487929/c-38978022/a11272697
- Lost authenticator/SMS access: https://www.epicgames.com/help/c-45487929/c-38978022/a22922707?lang=en-US
- Unlink a console account: https://www.epicgames.com/help/c-Category_EpicAccounts/c-38854402/a17347934?lang=en-US
- Sign-in: https://www.epicgames.com/id/login

## Test status

The source and build scripts are published, but still need compilation and execution on a Windows computer. GitHub publication is not proof of a successful Windows runtime test. The official recovery and 2FA links were checked against Epic's current help pages on November 13, 2026.

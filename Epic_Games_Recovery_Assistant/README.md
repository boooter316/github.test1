# Epic Games Recovery Assistant

Version 2.0. A Windows Python desktop utility for organizing truthful Epic Games account-recovery information, preparing support-request drafts, and exporting a local recovery packet.

## Install and run

- Windows 10 or Windows 11
- Python 3.10 or newer
- ReportLab (installed by the included setup script)

1. Install Python from https://www.python.org/downloads/ and enable **Add Python to PATH**.
2. Open this folder in File Explorer.
3. Run `setup.bat` to install/update the PDF dependency and launch the app.
4. Run `run.bat` for later launches.

## Version 2.0 features

- **Account recovery organizer:** current, original, and previous email/display names; desired display name/email planning fields; first/last name; country and region; account creation date; Epic Account ID; purchase Invoice ID; linked account identifiers and approximate linking dates.
- **Expanded optional ownership context:** Support-A-Creator code; name and billing address/city/state/ZIP used for past purchases; payment provider; card last four digits only; remembered original public IP and approximate date it was used. These are optional context fields, not proof of ownership. Never enter a full card number, CVV, account PIN, password, or verification code.
- **Two-step verification guide:** records whether Epic Authenticator, a third-party authenticator app, email, or SMS/phone was enabled and whether you can still access it. It never collects codes or backup codes.
- **VPN/proxy history:** records prior provider/region as context only. It never connects to VPNs/proxies, spoofs or rotates IP addresses, imitates an old location, or bypasses security checks.
- **Incident and recovery tracker:** incident description, non-secret evidence notes, recovery case ID, status, submission date, exact error/response message, and follow-up notes.
- **Restriction and appeal organizers:** Epic sanctions, Xbox, PlayStation, Steam, and Nintendo notice details, case references, dates, duration, status, and factual notes. The app cannot remove restrictions, clear bans, or bypass enforcement.
- **Support request builder:** drafts requests for Epic Games, Xbox, PlayStation, Steam, Nintendo, Apple, LEGO, Google, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, payment providers, or a custom service. Request types include recovery, compromised-account review, restriction appeal, unlinking, payment-method review, and profile changes.
- **Official support/contact links:** opens the service's official support page. Epic agent/live-chat availability varies; the app cannot create a live agent session or submit a ticket for you.
- **Ownership evidence readiness reminder:** if evidence is unavailable, it advises pausing and using the official recovery flow. It does not verify identity or lock/disable an account.
- **PDF and complete local export:** Generate a PDF or export a folder/ZIP containing `recovery_request.pdf`, `account_details.json`, a copy of `app.py` when available, `support_request_draft.txt`, and `README.txt`.

## Account dump / export

The **Export Full Recovery Packet** button creates a local, user-controlled export of the form information, PDF summary, support-request draft, and application script. This is a personal records export—not a credential dump. It does not collect passwords, cookies, authentication secrets, or other login tokens. The app does not upload the packet anywhere.

## Important security boundaries

- A remembered IP address is not reliable proof of account ownership. IP addresses can change or be shared by households, mobile carriers, workplaces, VPNs, and internet providers. Never spoof an IP or pretend to be at a previous location.
- Epic's current recovery instructions ask for account-identifying details and may include Account ID, Invoice ID, past emails/display names, linked-account information, phone/2FA history, and payment details. Provide only accurate information requested in Epic's official form. You can skip information you do not know.
- Billing address, city, ZIP/postal code, payment provider, and card last four digits are optional notes. Share them only through Epic's official recovery process if requested. Never put full card numbers, CVVs, bank passwords, account PINs, 2FA codes, backup codes, authenticator setup keys, session cookies, or passwords in this app.
- Epic's current help page says VPN/proxy use during an account recovery request may contribute to denial. For the relevant sign-in error, Epic instructs users to disconnect VPN/hosting/proxy services. This app records history only and does not activate or configure proxies/VPNs.
- Missing evidence does not trigger an account lock, disablement, or closure. The app only warns you to pause; only the platform can verify ownership or secure an account.
- The app does not access Epic's database, use PuTTY/C2/VPS infrastructure, alter account records, unlink accounts, change payment methods, remove restrictions, or submit recovery/appeal tickets automatically.
- All platform restriction decisions and account recovery outcomes are made by the relevant service. Correct information does not guarantee approval.

## Current official Epic guidance

- [Recover access to your Epic Games account](https://www.epicgames.com/help/c-1/a10856556?lang=en-US)
- [Submit an account recovery request](https://www.epicgames.com/help/c-45487929/a21414514)
- [Check recovery request status](https://www.epicgames.com/help/recovery-status-check/)
- [Appeal a recovery decision](https://www.epicgames.com/help/c-1/a17781729)
- [Why a recovery request may be denied](https://www.epicgames.com/help/en-US/account-c-202300000001645/account-security-c-202300000001755/why-was-my-account-recovery-request-denied-a202300000012540)
- [Available Epic 2FA methods](https://www.epicgames.com/help/c-45487929/c-38978022/a11272697)
- [Enable 2FA](https://www.epicgames.com/help/c-45487929/a10075388?lang=en-US)
- [Epic sign-in and VPN/proxy troubleshooting](https://www.epicgames.com/help/c-45487929/c-38854402/a20296521)
- [Epic account connections](https://www.epicgames.com/account/connections)
- [Epic Support](https://www.epicgames.com/help/en-US/)
- [Epic Support contact / assistant](https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US)
- [Epic Sanctions and Appeals](https://safety.epicgames.com/sanctions-and-appeals?mode=game)
- [Xbox Enforcement](https://enforcement.xbox.com/)
- [PlayStation suspensions](https://www.playstation.com/en-us/support/account/suspensions/)
- [Steam Support](https://help.steampowered.com/en/wizard/HelpWithAccount)
- [Nintendo Support](https://en-americas-support.nintendo.com/)

## Privacy

This is an independent organizer and is not affiliated with Epic Games. The app saves files only where you choose and does not send data to Epic or any other service. Keep exports private and share information only through the appropriate official support flow.

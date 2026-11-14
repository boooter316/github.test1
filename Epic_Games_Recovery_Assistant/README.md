# Epic Games Recovery Assistant

Version 1.6. A Windows Python desktop utility for organizing truthful Epic Games account-recovery information and creating a local recovery packet.

## Requirements
- Windows 10 or Windows 11
- Python 3.10 or newer
- ReportLab (install with `py -m pip install -r requirements.txt`)

## Install and run
1. Install Python from https://www.python.org/downloads/ and enable **Add Python to PATH**.
2. Open this folder in File Explorer.
3. Run `setup.bat` to install the PDF dependency and launch the app.
4. Use `run.bat` for later launches.

## Features
- Account details: current and previous emails/display names, desired new Epic display name/email (planning fields only), creation country/date, Epic Account ID, invoice ID, phone used for SMS 2FA, linked accounts and approximate linking dates, purchase payment types, and optional remembered original IP.
- Incident categories and a description/evidence section, plus an Epic recovery-response tracker for status, case reference, submission date, exact error message, and follow-up notes (including canceled, disabled/locked, denied, or pending states).
- Epic ban and sanction organizer: sanction ID, type, date, duration, stated rule, appeal status, and factual appeal notes; includes the official Sanctions and Appeals portal. This does not unlock accounts or remove bans.
- Xbox / PlayStation restriction organizer: records Gamertag / Online ID, notice reference, restriction type, date, duration, appeal status, and factual notes; links to the platform owners' official enforcement / suspension guidance.
- Steam / Nintendo restriction organizer: records account identifiers, support / notice references, restriction type, date, duration, appeal status, and factual notes; links to official support resources. It cannot remove restrictions, clear VAC/game bans, or bypass enforcement.
- Multi-select 2FA history: Epic Authenticator, third-party authenticator app, email, and SMS/phone; plus access status.
- VPN/proxy history fields for provider and region, strictly for truthful documentation; includes Epic's current troubleshooting advice to disconnect VPN/hosting/proxy services for the relevant sign-in error.
- PDF recovery-request summary, including Epic profile-change planning fields and Epic, Xbox, PlayStation, Steam, and Nintendo restriction/support notes.
- Official Epic instructions for changing the display name and account email. The app records the user's desired changes but does not change account settings itself.
- **Export Full Recovery Packet** (your local account-recovery export) creates a local folder containing:
  - `recovery_request.pdf`
  - `account_details.json` (structured form export)
  - `app.py` (copy of the running Python script, when available)
  - `README.txt` (handling and security notes)
- The app also creates a ZIP archive of the complete packet folder for easier storage or transfer.

## Privacy and security
- Packet files are saved to the folder you choose; this app does not upload or send them anywhere.
- The packet contains personal account information. Keep it private and share only through Epic's official recovery process.
- Never enter or store passwords, one-time verification codes, backup codes, authenticator setup keys, session cookies, or full payment-card numbers.
- VPN/proxy fields document past use only. Epic's current guidance says VPN/proxy use or submitting from a previously unused location can contribute to recovery-request denial; disconnect VPN/hosting/proxy services for the relevant sign-in error and do not submit a recovery request through a VPN/proxy. The app does not connect to a VPN/proxy, spoof or rotate IP addresses, recreate an old IP, or bypass Epic verification.
- Correct information does not guarantee approval; Epic independently reviews and verifies every recovery request. Check the recovery status page with the Recovery ID, and follow Epic's wait guidance rather than repeatedly retrying rate-limited requests.
- This is an independent organizer. It does not verify ownership, reset passwords, connect to Epic, unlock accounts, remove bans, evade sanctions, or submit recovery/appeal requests automatically.

## Official Epic guidance
Epic's available 2FA methods and recovery steps can change. Check the live official pages before acting:
- [Epic account recovery guide](https://www.epicgames.com/help/c-1/a10856556?lang=en-US)
- [How to submit an account recovery request](https://www.epicgames.com/help/c-45487929/a21414514)
- [Check the status of an account recovery request](https://www.epicgames.com/help/recovery-status-check/)
- [Why an account recovery request may be denied](https://www.epicgames.com/help/c-45487929/c-38978022/a14929060?lang=en-US)
- [Too many requests error during recovery or email change](https://www.epicgames.com/help/c-45487929/c-40721840/i-m-getting-a-too-many-requests-please-try-again-later-error-when-trying-to-recover-my-account-or-change-my-email-address-a15637378)
- [Available 2FA methods](https://www.epicgames.com/help/c-45487929/c-38978022/a11272697)
- [Locked out of authenticator or SMS 2FA](https://www.epicgames.com/help/c-45487929/c-38978022/a22922707?lang=en-US)
- [VPN/proxy sign-in troubleshooting](https://www.epicgames.com/help/c-45487929/c-38854402/a20296521?lang=en-US)
- [Epic ban / sanction explanation](https://www.epicgames.com/help/c-34254770/c-5719350646299/a12390848?lang=en-US)
- [Epic Sanctions and Appeals portal](https://safety.epicgames.com/sanctions-and-appeals?mode=game)
- [How to change Epic display name](https://www.epicgames.com/help/c-45487929/c-35761596/a18323090?lang=en-US)
- [How to change Epic account email](https://www.epicgames.com/help/c-45487929/c-40721840/a18546270?lang=en-US)
- [Xbox Enforcement History / Case Review](https://enforcement.xbox.com/)
- [Xbox Community Standards](https://www.xbox.com/en-US/legal/community-standards)
- [PlayStation suspensions and appeals](https://www.playstation.com/en-us/support/account/suspensions/)
- [Steam Support](https://help.steampowered.com/en/wizard/HelpWithAccount)
- [Steam Community Ban FAQ](https://help.steampowered.com/en/faqs/view/4F62-35F9-F395-5C23)
- [Nintendo account suspension guidance](https://en-americas-support.nintendo.com/app/answers/detail/a_id/50788/p/989/c/913)
- [Nintendo Account recovery process](https://en-americas-support.nintendo.com/app/answers/detail/p/850/a_id/47194)
- [Nintendo Support](https://en-americas-support.nintendo.com/)
- [Epic Support](https://www.epicgames.com/help/en-US/)

The app does not guarantee that Epic will accept a recovery request. Epic makes all account ownership and recovery decisions.

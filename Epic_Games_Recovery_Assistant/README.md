# Epic Games Recovery Assistant

Version 1.4. A Windows Python desktop utility for organizing truthful Epic Games account-recovery information and creating a local recovery packet.

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
- Incident categories and a description/evidence section.
- Epic ban and sanction organizer: sanction ID, type, date, duration, stated rule, appeal status, and factual appeal notes; includes the official Sanctions and Appeals portal. This does not unlock accounts or remove bans.
- Xbox / PlayStation restriction organizer: records Gamertag / Online ID, notice reference, restriction type, date, duration, appeal status, and factual notes; links to the platform owners' official enforcement / suspension guidance. It cannot remove restrictions or bypass enforcement.
- Multi-select 2FA history: Epic Authenticator, third-party authenticator app, email, and SMS/phone; plus access status.
- VPN/proxy history fields for provider and region, strictly for truthful documentation; includes Epic's current troubleshooting advice to disconnect VPN/hosting/proxy services for the relevant sign-in error.
- PDF recovery-request summary, including the new profile-change planning fields and Xbox / PlayStation appeal notes.
- Official Epic instructions for changing the display name and account email. The app records the user's desired changes but does not change account settings itself.
- **Export Full Recovery Packet** (your local account-recovery export) creates a local folder containing:
  - `recovery_request.pdf`
  - `account_details.json` (structured form export)
  - `app.py` (copy of the running script, when available)
  - `README.txt` (handling and security notes)

## Privacy and security
- Packet files are saved to the folder you choose; this app does not upload or send them anywhere.
- The packet contains personal account information. Keep it private and share only through Epic's official recovery process.
- Never enter or store passwords, one-time verification codes, backup codes, authenticator setup keys, session cookies, or full payment-card numbers.
- VPN/proxy fields document past use only. Epic's current guidance says VPN/proxy use or submitting from a previously unused location can contribute to recovery-request denial; disconnect VPN/hosting/proxy services for the relevant sign-in error and do not submit a recovery request through a VPN/proxy. The app does not connect to a VPN/proxy, spoof or rotate IP addresses, recreate an old IP, or bypass Epic verification.
- This is an independent organizer. It does not verify ownership, reset passwords, connect to Epic, unlock accounts, remove bans, evade sanctions, or submit recovery/appeal requests automatically.

## Official Epic guidance
Epic's available 2FA methods and recovery steps can change. Check the live official pages before acting:
- [Epic account recovery guide](https://www.epicgames.com/help/c-1/a10856556?lang=en-US)
- [How to submit an account recovery request](https://www.epicgames.com/help/c-45487929/a21414514)
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
- [Epic Support](https://www.epicgames.com/help/en-US/)

The app does not guarantee that Epic will accept a recovery request. Epic makes all account ownership and recovery decisions.

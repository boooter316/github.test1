# Epic Games Recovery Assistant

A Windows Python desktop utility for organizing truthful Epic Games account-recovery information and creating a local recovery packet.

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
- Account details: current and previous emails/display names, creation country/date, Epic Account ID, invoice ID, phone used for SMS 2FA, linked accounts and approximate linking dates, purchase payment types, and optional remembered original IP.
- Incident categories and a description/evidence section.
- Multi-select 2FA history: Epic Authenticator, third-party authenticator app, email, and SMS/phone; plus access status.
- VPN/proxy history fields for provider and region, strictly for truthful documentation.
- PDF recovery-request summary.
- **Export Full Recovery Packet** creates a local folder containing:
  - `recovery_request.pdf`
  - `account_details.json` (structured form export)
  - `app.py` (copy of the running script, when available)
  - `README.txt` (handling and security notes)

## Privacy and security
- Packet files are saved to the folder you choose; this app does not upload or send them anywhere.
- The packet contains personal account information. Keep it private and share only through Epic's official recovery process.
- Never enter or store passwords, one-time verification codes, backup codes, authenticator setup keys, session cookies, or full payment-card numbers.
- VPN/proxy fields document past use only. The app does not connect to a VPN/proxy, spoof or rotate IP addresses, recreate an old IP, or bypass Epic verification.
- This is an independent organizer. It does not verify ownership, reset passwords, connect to Epic, or submit recovery requests automatically.

## Official Epic guidance
Epic's available 2FA methods and recovery steps can change. Check the live official pages before acting:
- [Epic account recovery](https://www.epicgames.com/help/c-1/a10856556?lang=en-US)
- [How to submit an account recovery request](https://www.epicgames.com/help/c-45487929/a21414514)
- [Available 2FA methods](https://www.epicgames.com/help/c-45487929/c-38978022/a11272697)
- [Epic Support](https://www.epicgames.com/help/en-US/)

The app does not guarantee that Epic will accept a recovery request. Epic makes all account ownership and recovery decisions.

# Epic Games Recovery Assistant — Native Windows Desktop Edition

**Version 5.0.** A locally run C++17 Windows command-dashboard application. It is an independent organizer and is not made, operated, or endorsed by Epic Games.

## Launch the desktop dashboard

1. Download and extract the complete project ZIP on Windows 10/11.
2. Open the `Epic_Games_Recovery_Assistant` folder.
3. Double-click **`OPEN_PROJECT.bat`**.
4. The setup checks for the C++17 compiler, offers to install MSYS2/GCC if needed, builds `Epic_Games_Recovery_Assistant.exe`, and runs the dashboard in the Windows command window.

**Desktop-only launch:** `OPEN_PROJECT.bat` and `FIRST_RUN_SETUP.bat` do not install Node.js, start a web server, open a browser dashboard, or require a website. The executable is `Epic_Games_Recovery_Assistant.exe`. Run `run.bat` to open it again, or `build.bat` to rebuild it.

The app opens a local sign-in/register screen, followed by a numbered command dashboard. Its menu includes the recovery case workflow, recovery progress tracker, official Epic account/support links, local project files, and safety/help information. Official Epic pages open in your browser only when you explicitly choose a link; sign-in, verification, support submission, and account decisions remain on Epic's official services.

## Dashboard features

- Local sign-in/register gate. Local passwords are hidden while typed and stored only as salted PBKDF2-HMAC-SHA256 hashes in `%LOCALAPPDATA%\EpicRecoveryAssistant\local_users.db`. This is not an Epic login.
- Epic recovery information organizer and factual support-request draft.
- Recovery progress notes for account status, linked-account status, email/display-name status, email-change progress, and restriction end-date estimates.
- Local PDF, JSON, CSV, and text evidence exports, plus optional historical IP and login-activity notes.
- Official Epic recovery, contact, linked-account, account-security, sign-in, and sanctions/appeals links.
- Generic optional Discord application/build notifications only. Notifications never include account details, recovery notes, evidence, exports, passwords, or authentication secrets.

## Build requirements

- Windows 10 or Windows 11.
- MinGW-w64/GCC with C++17 support. The first-run wizard can offer MSYS2/GCC installation through Windows Package Manager (`winget`).
- No Node.js, Docker, browser server, hosted website, or web API key is required to launch the native desktop application.

Manual build:
1. Install MinGW-w64/GCC and add `g++` to PATH.
2. Run `build.bat` (which calls `setup.bat`).
3. Run `run.bat`.

GitHub Actions compiles the C++17 source on Windows and uploads the executable and complete project package. A successful CI build confirms compilation and packaging; it is not a guarantee of runtime behavior on every PC. Windows may warn that the unsigned executable is from an unknown publisher.

## Existing project scripts and browser assets

The repository retains its existing PowerShell, batch, and `web/` source files so project material is not silently discarded. **They are not launched by the native desktop startup path.** The old browser dashboard and its server are not part of the desktop dashboard workflow. Batch and PowerShell files remain source/maintenance scripts; they are not all independently compiled into EXE files. The supported primary Windows executable is `Epic_Games_Recovery_Assistant.exe`.

## Epic account and recovery limitations

The app does not sign in to Epic, connect to private Epic APIs, verify account ownership, submit tickets automatically, change account settings, unlink services, remove restrictions, bypass verification, or guarantee recovery. The recovery-progress tracker stores your own notes; it does not query Epic or verify account status. The support-request draft must be reviewed and submitted by you through Epic's official support process.

Never enter passwords, account PINs, full payment-card numbers, CVV, 2FA codes, backup codes, authenticator secrets, session cookies, or access tokens. Card last four digits are optional. Historical IP/VPN/proxy information is optional user-reported context only; the app does not spoof IPs, rotate proxies, or impersonate a location.

## Official Epic resources

- Recovery help: https://www.epicgames.com/help/c-45487929/a21414514
- Support/contact: https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US
- Linked accounts: https://www.epicgames.com/account/connections
- Account security: https://www.epicgames.com/account/password
- Sign-in: https://www.epicgames.com/id/login
- Sanctions and appeals: https://safety.epicgames.com/en-US/sanctions-and-appeals

## Security

The unsafe legacy Discord token-grabber was removed from the current source in PR #44. Do not restore or run it. A webhook secret was embedded in old Git history; revoke/rotate that webhook if you have not already done so. The safe Discord Security Scanner remains available in the retained legacy browser source, but is not currently integrated into this native command dashboard.

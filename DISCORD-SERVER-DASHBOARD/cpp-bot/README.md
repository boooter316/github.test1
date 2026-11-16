# Discord C++ Bot Starter

A minimal C++17 slash-command bot using [D++ (DPP)](https://dpp.dev/).

## Commands
- `/ping`: confirms the bot is online.
- `/ticket`: privately acknowledges a support request. This starter intentionally does not mass-create channels or send repeated webhook messages.

## Requirements
- C++17 compiler (Visual Studio 2022 on Windows is supported)
- CMake 3.20+
- D++ / DPP installed and discoverable by CMake

## Configure token securely

Windows PowerShell (current terminal only):

```powershell
$env:DISCORD_BOT_TOKEN = "paste-your-new-token-here"
```

Do not put the token in source files, commit it, or share it. Reset it immediately if exposed.

## Build

```powershell
cmake -S . -B build
cmake --build build --config Release
```

Run the generated executable from the same terminal session where the environment variable is set.

## Discord Developer Portal
1. Create an application at https://discord.com/developers/applications.
2. Add a bot user and copy its token into the environment variable above.
3. Under Installation / OAuth2, generate an install link with the `bot` and `applications.commands` scopes.
4. Grant only the permissions needed (typically View Channels, Send Messages, and Use Slash Commands).
5. Install it only in a server you own or administer.

## Ticket and webhook hardening before production
Configure a support category and support-role ID, authorize the requester and support staff to view the ticket, prevent duplicate open tickets, limit ticket creation per user, and log moderator actions. Webhook notifications should be optional, event-triggered, queued, rate-limited, and stored with secrets on the server. Never use them to spam or flood channels.

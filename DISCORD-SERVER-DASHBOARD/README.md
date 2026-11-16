# DISCORD SERVER DASHBOARD

A local-first dashboard shell for the existing `boooter316/github.test1` project. It adds a refreshed dark navy / neon pink / purple interface while keeping the original dashboard and its workspaces intact.

## What is included

- Dashboard landing page and mobile-responsive sidebar.
- Existing Main Tools page with a safe link back to the original browser dashboard.
- A companion **DISCORD Server Dashboard** tab embedded in the main browser dashboard at `/discord-server-dashboard/index.html`.
- Explicit same-origin static routes for the companion dashboard HTML, CSS and JavaScript; the main web server does not expose the repository tree.
- Project folder import and file browser.
- Browser-based text source editor with direct save support in browsers that expose the File System Access API; otherwise it downloads an edited copy.
- Separate Python, C++ and custom-script workspaces.
- Links to existing defensive scanners, Recovery Panel, network labs and build workflow.
- Private LAN static host for viewing the dashboard from another device on the same trusted local network.

## Start on Windows

1. Download/clone the repository and extract it.
2. Install Python 3.10+ if needed.
3. Double-click `START_PRIVATE_DASHBOARD.cmd`.
4. Open the localhost URL shown in the console.
5. To view it on another device, connect that device to the same private Wi-Fi and use the private IPv4 URL printed by the launcher.
6. Press Ctrl+C in the console to stop the host.

No internet connection is required between devices once they are on the same local network. Internet access is only needed to download the repository or install Python initially.

## Private LAN security model

The Python host is deliberately read-only:
- Serves only static HTML, CSS, JavaScript and image/font assets from three allowlisted project folders.
- Accepts only loopback, RFC1918 IPv4 and private IPv6 client addresses.
- Rejects requests outside the allowlist and blocks directory listings.
- Rejects POST, PUT and DELETE; there are no upload, command execution, terminal, injection or remote-control endpoints.
- Does not expose the repository root, source files, executables, PowerShell scripts, server code or Git metadata.
- Does not configure router port forwarding or public internet access.

Use only a trusted home/office LAN and keep Windows Firewall's network profile set to Private. Stop the host when finished. This is a static read-only viewer, not a private remote administration server.

## Editing projects

On desktop Chrome/Edge over localhost, use **Import Projects → Choose project folder**. The folder picker provides local file handles, so Save can write back to the selected file after browser permission. The fallback file picker reads selected files and downloads edited copies rather than overwriting originals. iOS Safari can view the dashboard and download edited files, but folder selection and direct write-back are browser-dependent.

The editor accepts text source only and limits the in-browser editor to files up to 2 MiB. It does not execute custom scripts, install packages, or build arbitrary executables. Use the existing project's documented local build workflow for trusted source code.

## Preserving the original tools

The original dashboard remains available separately and now includes a **DISCORD Server Dashboard** tab that opens this companion workspace. The companion dashboard links back to the main dashboard in a separate tab to avoid recursive iframe embedding. Existing server-dependent functions (for example optional AI or provider integrations) still need their original Node.js backend and configuration; the static LAN viewer does not start that backend. Existing tools remain in their original folders and are not copied or deleted.

This dashboard intentionally does not reproduce credential theft, token/session extraction, crypto clipping, injection, stress attacks, RAT/C2 command execution, or remote script execution.


## Private Access and approved-device allowlist

The **Private Access** navigation page explains offline same-LAN viewing, VPN limits for away-from-home access, and consent-based remote support. The local host now reads `approved_devices.json` and checks the exact connecting IP address on every request.

- Default configuration is fail-closed: `"allowed_ips": []` permits localhost only.
- To approve a personal phone/tablet, edit the JSON file locally in Windows Notepad and add that device's exact private IP.
- Remove an address to revoke it. The host reloads the allowlist on each request.
- Use a DHCP reservation if the router supports it, so your phone's private IP does not change unexpectedly.
- Do not use a wildcard or an entire subnet. IP allowlisting is not strong device identity or encryption.
- The configuration file is deliberately not served by the static web host.
- The viewer remains HTTP/read-only. Do not enter secrets, expose the port publicly, or port-forward it.

See [PRIVATE_ACCESS_GUIDE.md](PRIVATE_ACCESS_GUIDE.md) for step-by-step iPhone and Windows instructions and the distinction between offline LAN access and encrypted VPN access across networks.

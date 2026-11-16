# Private Access — setup and security guide

## What this feature does

The dashboard can be viewed without internet when your Windows PC and phone/tablet are connected to the same trusted local Wi-Fi/LAN. The local host serves static dashboard pages only. It does not provide remote desktop, remote shell, script execution, file upload, or control of another computer.

The host now checks an exact IP allowlist in `approved_devices.json` on every request:
- An empty `allowed_ips` list means only the Windows PC itself (localhost) can connect.
- Add the exact private IP address of a device you personally approve.
- Remove an address to revoke that address immediately; the host reloads the file for each request.
- Keep device IPs stable with DHCP reservations on your router if possible.

## Add your iPhone or another personal device

1. Connect the Windows PC and iPhone to the same trusted Wi-Fi.
2. On iPhone: Settings → Wi-Fi → tap the ⓘ beside the connected network → note **IP Address**.
3. On Windows: open Command Prompt and run `ipconfig`; note the IPv4 address for the same Wi-Fi adapter.
4. Open `DISCORD-SERVER-DASHBOARD/approved_devices.json` on the Windows PC.
5. Add only the iPhone's exact private IP address to `allowed_ips`, for example:

```json
{
  "allowed_ips": ["192.168.1.42"]
}
```

Use the real address shown on your iPhone, not the example. Keep valid JSON syntax. To approve more of your own devices, add each exact IP as another quoted item. Do not add a whole subnet or wildcard.

6. Start or restart `START_PRIVATE_DASHBOARD.cmd`.
7. Use the Windows host's private IPv4 address and port 8765 in Safari on the approved iPhone:
   `http://WINDOWS-PRIVATE-IP:8765/DISCORD-SERVER-DASHBOARD/`

If your router changes the iPhone's IP, update the allowlist. If you remove its IP, access is denied on the next request.

## Important limits of IP allowlisting

An IP allowlist is a useful network-level filter, not strong device identity or end-to-end encryption. A device on a hostile or compromised Wi-Fi network may be able to spoof or observe local traffic. Use this only on a trusted private network, enable WPA2/WPA3 Wi-Fi security, keep Windows Firewall enabled, and do not use public Wi-Fi. Do not port-forward TCP 8765 or expose this Python host to the public internet.

The dashboard is served over local HTTP, not HTTPS. Do not enter passwords, account credentials, recovery codes, tokens, or other secrets into it. The current LAN viewer is read-only.

## Away from home / internet-hosted access

A connection between different networks requires some network path. A private VPN such as Tailscale or WireGuard can create an encrypted private path, but initial setup and cross-network access generally require internet connectivity. A public website cannot be reached with no internet or other network path. Do not expose the local Python host with router port forwarding. For a truly private hosted deployment, use an authenticated hosting platform with HTTPS, strong account authentication, MFA, and per-user authorization; that is a separate deployment and is not enabled by this repository change.

## Consent-based support for another person's computer

Only provide support when the other person explicitly requests and approves the session on their own device, can see that the session is active, and can end it at any time. Use a reputable remote-support product with its own authentication and consent prompts. This dashboard does not include remote control or unattended access to other people's computers.

## Existing features preserved

The companion dashboard and original main dashboard remain separate workspaces. This change adds a Private Access navigation page and IP allowlist configuration; it does not delete existing project tools, recovery panels, scanners, scripts, or source files.

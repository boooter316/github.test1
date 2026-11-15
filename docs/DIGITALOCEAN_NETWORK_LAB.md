# DigitalOcean and Private Network Lab

This guide supports legitimate administration of infrastructure you own or are authorized to manage. It covers DigitalOcean VPS creation, a private WireGuard VPN, a restricted private HTTP proxy, Kali Linux in VirtualBox, PuTTY/SSH, public IP checks, and firewall hygiene.

## Safety and cost

- Creating a DigitalOcean Droplet is a paid action. Review the current price, backups, bandwidth, and taxes before creating it. Delete unused resources to stop ongoing charges.
- This repository does not provision cloud resources, store DigitalOcean API tokens, or configure services automatically.
- Never run an unauthenticated public proxy. Restrict proxy access to your VPN subnet or trusted IPs.
- Use SSH keys, MFA, least privilege, host-key verification, and narrow firewall rules.
- Do not use the infrastructure for C2, covert control, credential theft, unauthorized access, or exfiltration.

## DigitalOcean VPS

1. Enable MFA on your DigitalOcean account.
2. Create an Ubuntu LTS Droplet in the [DigitalOcean control panel](https://cloud.digitalocean.com/droplets).
3. Add an SSH public key at creation. Review the price and backup options before confirming.
4. Use a Cloud Firewall to permit SSH only from your trusted administrator IP. Open application ports only when needed.
5. Record the Droplet's public IP from its control panel.
6. Follow the [official Droplet documentation](https://docs.digitalocean.com/products/droplets/).

## Private WireGuard VPN

On an Ubuntu VPS, install WireGuard with `sudo apt update && sudo apt install wireguard ufw -y`. Generate a unique private/public key pair for the server and each client using `wg genkey` and `wg pubkey` with restrictive file permissions. Configure peers using the [WireGuard Quick Start](https://www.wireguard.com/quickstart/). Choose a private tunnel subnet that does not overlap existing networks. Enable IP forwarding/NAT only if you intentionally want client traffic routed through the VPS. Permit the selected UDP port in UFW and the DigitalOcean Cloud Firewall. Before enabling UFW over SSH, allow SSH from your trusted IP to avoid locking yourself out. Keep private keys off GitHub and out of chat.

## Restricted private proxy

Install Squid with `sudo apt install squid`. Bind it to the VPN/private interface, permit only your trusted VPN subnet or administrator IPs, deny all other clients, and require authentication as appropriate. Validate configuration with `sudo squid -k parse`. Do not expose the proxy port to the public internet. This is a private application proxy, not a VPN.

## Kali Linux and VirtualBox

Download VirtualBox from [Oracle](https://www.virtualbox.org/wiki/Downloads) and the official Kali VirtualBox image from [Kali](https://www.kali.org/get-kali/#kali-virtual-machines). Verify checksums. Start with NAT for updates or Host-only networking for an isolated lab; avoid Bridged networking unless you understand the exposure and have authorization. Snapshot the VM before experiments. Kali is a local virtual machine, not a VPS.

## PuTTY and SSH

Install PuTTY from [putty.org](https://www.putty.org/). Generate an SSH key pair with PuTTYgen, add the public key to the Droplet, protect the private key with a passphrase, and configure PuTTY to use it. Verify the SSH host-key fingerprint through a trusted channel before accepting it. Test key login in a second session before disabling password login. PuTTY is for administering your own server; this project does not configure C2 or covert remote control.

## IP and firewall checks

From an SSH session on your own VPS:
- `curl -4 https://icanhazip.com` — observed public IPv4 egress address.
- `curl -6 https://icanhazip.com` — observed public IPv6 egress address, if configured.
- `ip -brief address` — local interface addresses.
- `sudo ufw status numbered` — host firewall rules.
- `sudo ss -tulpn` — listening sockets.

The observed egress IP can differ behind NAT or a VPN and is not proof of a person's identity or account ownership.

## Before production

Patch the OS, use MFA and SSH keys, restrict ports at both the cloud and host firewalls, monitor logs, keep backups, rotate credentials if exposed, and delete unused resources. This guide is not a full security audit or a production deployment.

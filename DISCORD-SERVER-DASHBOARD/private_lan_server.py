#!/usr/bin/env python3
"""Read-only static dashboard host for a trusted private LAN. No uploads or command endpoints."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import ipaddress
import json
import socket
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent
PORT = 8765
ALLOWED_PREFIXES = (
    "/DISCORD-SERVER-DASHBOARD/",
    "/Epic_Games_Recovery_Assistant/web/",
    "/recovery-panel/public/",
)
ALLOWED_SUFFIXES = {".html", ".htm", ".css", ".js", ".jpg", ".jpeg", ".png", ".svg", ".ico", ".webp", ".woff", ".woff2"}
PRIVATE_V4 = tuple(ipaddress.ip_network(n) for n in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"))
PRIVATE_V6 = (ipaddress.ip_network("fc00::/7"),)
ACCESS_CONFIG = Path(__file__).with_name("approved_devices.json")

def approved_ips():
    """Reload exact private IP allowlist on every request so revocations apply immediately."""
    try:
        data = json.loads(ACCESS_CONFIG.read_text(encoding="utf-8"))
        raw_ips = data.get("allowed_ips", [])
        if not isinstance(raw_ips, list):
            return set()
        approved = set()
        for raw in raw_ips:
            if not isinstance(raw, str):
                continue
            try:
                ip = ipaddress.ip_address(raw.strip().split("%", 1)[0])
            except ValueError:
                continue
            if ip.is_loopback or ip.is_private:
                approved.add(str(ip))
        return approved
    except (OSError, json.JSONDecodeError, AttributeError):
        return set()

def allowed_client(raw):
    try:
        ip = ipaddress.ip_address(raw.split("%", 1)[0])
        if ip.is_loopback:
            return True
        return str(ip) in approved_ips()
    except ValueError:
        return False

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def _safe_path(self):
        raw = unquote(urlsplit(self.path).path)
        if "\\" in raw or any(part in (".", "..") for part in raw.split("/")):
            return None
        if raw.endswith("/"):
            raw += "index.html"
        if not any(raw.startswith(prefix) for prefix in ALLOWED_PREFIXES):
            return None
        candidate = (REPO_ROOT / raw.lstrip("/")).resolve()
        try:
            candidate.relative_to(REPO_ROOT)
        except ValueError:
            return None
        if not candidate.is_file() or candidate.suffix.lower() not in ALLOWED_SUFFIXES:
            return None
        return raw

    def _serve(self):
        if not allowed_client(self.client_address[0]):
            self.send_error(403, "Private LAN clients only")
            return
        safe = self._safe_path()
        if safe is None:
            self.send_error(404, "Not found")
            return
        self.path = safe
        super().do_GET()

    def do_GET(self):
        self._serve()

    def do_HEAD(self):
        if not allowed_client(self.client_address[0]):
            self.send_error(403, "Private LAN clients only")
            return
        safe = self._safe_path()
        if safe is None:
            self.send_error(404, "Not found")
            return
        self.path = safe
        super().do_HEAD()

    def do_POST(self):
        self.send_error(405, "Read-only host: uploads are disabled")

    def do_PUT(self):
        self.send_error(405, "Read-only host: writes are disabled")

    def do_DELETE(self):
        self.send_error(405, "Read-only host: deletes are disabled")

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled")
        return None

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.client_address[0], fmt % args))

def private_addresses():
    found = set()
    try:
        for item in socket.getaddrinfo(socket.gethostname(), None, type=socket.SOCK_STREAM):
            address = item[4][0].split("%", 1)[0]
            if allowed_client(address) and not ipaddress.ip_address(address).is_loopback:
                found.add(address)
    except OSError:
        pass
    return sorted(found)

if __name__ == "__main__":
    print("\nDISCORD SERVER DASHBOARD — PRIVATE READ-ONLY HOST")
    print("No internet connection is required when devices share the same LAN.")
    print("Only exact IP addresses in approved_devices.json are accepted; uploads and remote commands are disabled.")
    print("Edit approved_devices.json to add or revoke a trusted device IP. Empty list = local PC only.")
    print("Open on this PC: http://127.0.0.1:%d/DISCORD-SERVER-DASHBOARD/" % PORT)
    for address in private_addresses():
        if ":" not in address:
            print("Other device on the same Wi-Fi: http://%s:%d/DISCORD-SERVER-DASHBOARD/" % (address, PORT))
    if not private_addresses():
        print("No private LAN IPv4 address was detected. Connect both devices to the same private Wi-Fi.")
    print("\nPress Ctrl+C to stop the dashboard host. Do not port-forward this port.")
    try:
        ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard host stopped.")

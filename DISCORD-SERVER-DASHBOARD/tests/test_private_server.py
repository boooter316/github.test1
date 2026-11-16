import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / "private_lan_server.py"
SPEC = importlib.util.spec_from_file_location("private_lan_server", MODULE_PATH)
SERVER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SERVER)


class PrivateHostSafetyTests(unittest.TestCase):
    def test_accepts_loopback_without_allowlist(self):
        for address in ("127.0.0.1", "::1"):
            with self.subTest(address=address):
                self.assertTrue(SERVER.allowed_client(address))

    def test_accepts_only_exactly_approved_private_addresses(self):
        approved = {"10.1.2.3", "172.20.1.4", "192.168.1.20", "fd12::1"}
        with patch.object(SERVER, "approved_ips", return_value=approved):
            for address in approved:
                with self.subTest(address=address):
                    self.assertTrue(SERVER.allowed_client(address))
            for address in ("10.1.2.4", "192.168.1.21", "8.8.8.8", "not-an-ip"):
                with self.subTest(address=address):
                    self.assertFalse(SERVER.allowed_client(address))

    def test_empty_or_invalid_allowlist_fails_closed_for_lan_clients(self):
        for approved in (set(),):
            with patch.object(SERVER, "approved_ips", return_value=approved):
                for address in ("10.1.2.3", "192.168.1.20", "fd12::1"):
                    with self.subTest(address=address):
                        self.assertFalse(SERVER.allowed_client(address))

    def test_serves_only_allowlisted_static_dashboard_assets(self):
        handler = object.__new__(SERVER.Handler)
        for path in (
            "/DISCORD-SERVER-DASHBOARD/index.html",
            "/Epic_Games_Recovery_Assistant/web/index.html",
            "/recovery-panel/public/index.html",
        ):
            handler.path = path
            self.assertIsNotNone(handler._safe_path(), path)

    def test_blocks_source_scripts_and_repository_files(self):
        handler = object.__new__(SERVER.Handler)
        for path in (
            "/README.md",
            "/Epic_Games_Recovery_Assistant/web/server.mjs",
            "/Epic_Games_Recovery_Assistant/web/server.cpp",
            "/Epic_Games_Recovery_Assistant/web/network_tools.ps1",
            "/.git/config",
            "/DISCORD-SERVER-DASHBOARD/../README.md",
        ):
            handler.path = path
            self.assertIsNone(handler._safe_path(), path)


if __name__ == "__main__":
    unittest.main()

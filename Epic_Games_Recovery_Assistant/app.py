import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape
import json
import re
import shutil
import webbrowser

APP_NAME = "Epic Games Recovery Assistant"
APP_VERSION = "1.8"
SUPPORT_URL = "https://www.epicgames.com/help/en-US/"
RECOVERY_URL = "https://www.epicgames.com/id/login"
EPIC_CONTACT_URL = "https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US"
EPIC_LINKED_ACCOUNTS_URL = "https://www.epicgames.com/account/connections"
TWO_FA_URL = "https://www.epicgames.com/account/password"
RECOVERY_GUIDE_URL = "https://www.epicgames.com/help/c-1/a10856556?lang=en-US"
RECOVERY_REQUEST_URL = "https://www.epicgames.com/help/c-45487929/a21414514"
RECOVERY_STATUS_URL = "https://www.epicgames.com/help/recovery-status-check/"
RECOVERY_DENIED_URL = "https://www.epicgames.com/help/c-45487929/c-38978022/a14929060?lang=en-US"
TOO_MANY_REQUESTS_URL = "https://www.epicgames.com/help/c-45487929/c-40721840/i-m-getting-a-too-many-requests-please-try-again-later-error-when-trying-to-recover-my-account-or-change-my-email-address-a15637378"
TWO_FA_METHODS_URL = "https://www.epicgames.com/help/c-45487929/c-38978022/a11272697"
LOST_2FA_URL = "https://www.epicgames.com/help/c-45487929/c-38978022/a22922707?lang=en-US"
VPN_TROUBLESHOOTING_URL = "https://www.epicgames.com/help/c-45487929/c-38854402/a20296521?lang=en-US"
SANCTIONS_URL = "https://safety.epicgames.com/sanctions-and-appeals?mode=game"
BAN_HELP_URL = "https://www.epicgames.com/help/c-34254770/c-5719350646299/a12390848?lang=en-US"
DISPLAY_NAME_URL = "https://www.epicgames.com/help/c-45487929/c-35761596/a18323090?lang=en-US"
EMAIL_CHANGE_URL = "https://www.epicgames.com/help/c-45487929/c-40721840/a18546270?lang=en-US"
ACCOUNT_SETTINGS_URL = "https://www.epicgames.com/account/personal"
XBOX_ENFORCEMENT_URL = "https://enforcement.xbox.com/"
XBOX_STANDARDS_URL = "https://www.xbox.com/en-US/legal/community-standards"
PLAYSTATION_SUSPENSIONS_URL = "https://www.playstation.com/en-us/support/account/suspensions/"
STEAM_ACCOUNT_HELP_URL = "https://help.steampowered.com/en/wizard/HelpWithAccount"
STEAM_COMMUNITY_BAN_URL = "https://help.steampowered.com/en/faqs/view/4F62-35F9-F395-5C23"
NINTENDO_SUPPORT_URL = "https://en-americas-support.nintendo.com/"
NINTENDO_SUSPENSION_URL = "https://en-americas-support.nintendo.com/app/answers/detail/a_id/50788/p/989/c/913"
NINTENDO_RECOVERY_URL = "https://en-americas-support.nintendo.com/app/answers/detail/a_id/47194/c/495"
TWO_FA_METHODS = ("Epic Authenticator", "Authenticator app", "Email", "SMS / phone")

class EpicRecoveryAssistant:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{APP_NAME} v{APP_VERSION}")
        self.root.geometry("980x900")
        self.root.minsize(720, 680)
        self.fields = {}
        self.twofa_vars = {name: tk.BooleanVar(value=False) for name in TWO_FA_METHODS}
        self.twofa_access = tk.StringVar(value="Not sure")
        self.issue = tk.StringVar(value="Hacked / compromised")
        self.recovery_status = tk.StringVar(value="Not submitted")
        self.vpn_used = tk.StringVar(value="Not sure")
        self.ticket_target = tk.StringVar(value="Epic Games")
        self.ticket_type = tk.StringVar(value="Account recovery / ownership review")
        self.ownership_ready = tk.StringVar(value="Not sure")
        self.build_ui()

    def build_ui(self):
        main = ttk.Frame(self.root, padding=14)
        main.pack(fill="both", expand=True)
        ttk.Label(main, text=APP_NAME, font=("Segoe UI", 19, "bold")).pack(anchor="w")
        ttk.Label(main, text=f"Version {APP_VERSION} | Organize truthful ownership details and prepare a local recovery packet.").pack(anchor="w", pady=4)
        tabs = ttk.Notebook(main)
        tabs.pack(fill="both", expand=True, pady=8)
        self.account_tab = ttk.Frame(tabs, padding=10)
        self.security_tab = ttk.Frame(tabs, padding=10)
        self.incident_tab = ttk.Frame(tabs, padding=10)
        self.help_tab = ttk.Frame(tabs, padding=10)
        self.ban_tab = ttk.Frame(tabs, padding=10)
        self.platform_tab = ttk.Frame(tabs, padding=10)
        self.additional_platform_tab = ttk.Frame(tabs, padding=10)
        self.ticket_tab = ttk.Frame(tabs, padding=10)
        tabs.add(self.account_tab, text="Account Recovery")
        tabs.add(self.security_tab, text="2-Step & VPN/Proxy")
        tabs.add(self.incident_tab, text="Incident Details")
        tabs.add(self.ban_tab, text="Epic Ban & Appeal")
        tabs.add(self.platform_tab, text="Xbox / PlayStation")
        tabs.add(self.additional_platform_tab, text="Steam / Nintendo")
        tabs.add(self.ticket_tab, text="Support Ticket Builder")
        tabs.add(self.help_tab, text="Official Help")
        self.build_account_tab()
        self.build_security_tab()
        self.build_incident_tab()
        self.build_ban_tab()
        self.build_platform_tab()
        self.build_additional_platform_tab()
        self.build_ticket_tab()
        self.build_help_tab()
        actions = ttk.Frame(main)
        actions.pack(fill="x", pady=(4, 0))
        ttk.Button(actions, text="Generate PDF", command=self.generate_pdf_dialog).pack(side="left", padx=(0, 6))
        ttk.Button(actions, text="Export Full Recovery Packet", command=self.export_packet).pack(side="left", padx=6)
        ttk.Button(actions, text="Clear Form", command=self.clear_form).pack(side="left", padx=6)
        ttk.Button(actions, text="Open Epic Support", command=self.open_support).pack(side="right")

    def add_field(self, parent, key, label):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=3)
        ttk.Label(row, text=label, width=37).pack(side="left")
        entry = ttk.Entry(row)
        entry.pack(side="left", fill="x", expand=True)
        self.fields[key] = entry

    def add_choice(self, parent, label, variable, values):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=4)
        ttk.Label(row, text=label, width=37).pack(side="left")
        ttk.Combobox(row, textvariable=variable, values=values, state="readonly").pack(side="left", fill="x", expand=True)

    def build_account_tab(self):
        ttk.Label(self.account_tab, text="Account identification and recovery details", font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0, 6))
        fields = [
            ("recovery_email", "New/current recovery contact email *"),
            ("original_email", "Original Epic account email"),
            ("other_emails", "Other emails ever used on the account"),
            ("username", "Current / most recent Epic display name"),
            ("desired_username", "Desired new Epic display name (planning only)"),
            ("desired_email", "Desired new Epic account email (planning only)"),
            ("original_username", "Original Epic display name"),
            ("previous_names", "Other previous display names"),
            ("first_name", "First name used on the account"),
            ("last_name", "Last name used on the account"),
            ("country", "Country where account was created"),
            ("state", "Original state / region (if applicable)"),
            ("creation_date", "Approximate account creation date"),
            ("account_id", "Epic Account ID (if known)"),
            ("invoice_id", "Epic purchase Invoice ID (if known)"),
            ("original_ip", "Remembered original public IP (optional; do not guess)"),
            ("phone_2fa", "Phone number used for SMS 2FA (optional)"),
            ("linked_accounts", "Linked console/social accounts and IDs"),
            ("linked_dates", "Approximate dates linked (if known)"),
            ("payment_types", "Purchase payment types used (e.g. PayPal/card; no full numbers)"),
        ]
        for key, label in fields:
            self.add_field(self.account_tab, key, label)
        ttk.Label(self.account_tab, text="* Required to create a PDF. Enter only accurate information. Never enter passwords, one-time codes, backup codes, full payment-card numbers, or authenticator setup keys.", foreground="red", wraplength=850).pack(anchor="w", pady=8)

    def build_security_tab(self):
        ttk.Label(self.security_tab, text="Two-step authentication methods", font=("Segoe UI", 12, "bold")).pack(anchor="w")
        ttk.Label(self.security_tab, text="Select every method you remember having enabled. Epic currently documents Epic Authenticator, third-party authenticator apps, email, and SMS.", wraplength=850).pack(anchor="w", pady=4)
        for name, var in self.twofa_vars.items():
            ttk.Checkbutton(self.security_tab, text=name, variable=var).pack(anchor="w", padx=8, pady=2)
        self.add_choice(self.security_tab, "Can you access any enabled method?", self.twofa_access, ["Not sure", "Yes", "No", "Some methods"])
        self.add_field(self.security_tab, "twofa_notes", "2FA access notes (no codes or secrets)")
        ttk.Label(self.security_tab, text="Use the verification method shown by Epic. If you cannot access it, use Epic's 'Trouble signing in?' / account recovery flow. This app never collects or stores verification codes.", wraplength=850).pack(anchor="w", pady=8)
        ttk.Separator(self.security_tab).pack(fill="x", pady=8)
        ttk.Label(self.security_tab, text="VPN / proxy history — documentation only", font=("Segoe UI", 12, "bold")).pack(anchor="w")
        self.add_choice(self.security_tab, "Were you using a VPN or proxy?", self.vpn_used, ["Not sure", "No", "Yes"])
        self.add_field(self.security_tab, "vpn_provider", "VPN / proxy provider (if applicable)")
        self.add_field(self.security_tab, "vpn_region", "VPN / proxy region at the time (if known)")
        ttk.Label(self.security_tab, text="This records context only. The app does not connect to VPN/proxy services, rotate IPs, spoof a location, recreate an old IP, or bypass Epic's checks. Epic's troubleshooting guidance may ask users to disconnect VPN/proxy services.", foreground="red", wraplength=850).pack(anchor="w", pady=10)

    def build_incident_tab(self):
        self.add_choice(self.incident_tab, "Incident type", self.issue, ["Hacked / compromised", "Stolen account", "Lost access", "Locked account", "Email changed without permission", "Lost access to 2FA", "Other"])
        ttk.Label(self.incident_tab, text="Describe what happened and when:").pack(anchor="w", pady=(10, 3))
        self.description = tk.Text(self.incident_tab, height=9, wrap="word")
        self.description.pack(fill="both", expand=True)
        ttk.Label(self.incident_tab, text="Additional non-secret ownership evidence (never include passwords or codes):").pack(anchor="w", pady=(10, 3))
        self.evidence = tk.Text(self.incident_tab, height=7, wrap="word")
        self.evidence.pack(fill="both", expand=True)
        ttk.Separator(self.incident_tab).pack(fill="x", pady=10)
        ttk.Label(self.incident_tab, text="Epic recovery request response tracker", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        self.add_choice(self.incident_tab, "Current request status", self.recovery_status, ["Not submitted", "Submitted", "In review", "More information requested", "Canceled", "Account disabled / locked", "Denied", "Recovered", "Other"])
        self.add_field(self.incident_tab, "recovery_case_id", "Epic recovery case / reference ID")
        self.add_field(self.incident_tab, "recovery_submitted_date", "Date recovery request submitted")
        self.add_field(self.incident_tab, "recovery_error_message", "Exact Epic error / response message")
        ttk.Label(self.incident_tab, text="Follow-up notes (what Epic asked you to do; do not enter passwords or verification codes):").pack(anchor="w", pady=(8, 3))
        self.recovery_followup_notes = tk.Text(self.incident_tab, height=5, wrap="word")
        self.recovery_followup_notes.pack(fill="both", expand=True)
        ttk.Label(self.incident_tab, text="A canceled, disabled, or denied message does not by itself prove whether the ownership details are correct. Save the exact wording and case reference, then follow Epic Support's official instructions. Do not repeatedly submit guessed details.", foreground="red", wraplength=850).pack(anchor="w", pady=8)

    def build_ban_tab(self):
        ttk.Label(self.ban_tab, text="Account ban / sanction information", font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0, 6))
        ttk.Label(self.ban_tab, text="Record the notice details so you can review the case through Epic's official Sanctions and Appeals portal. Do not enter passwords or verification codes.", wraplength=850).pack(anchor="w", pady=4)
        fields = [
            ("sanction_id", "Sanction ID from Epic's notice"),
            ("sanction_type", "Sanction type (temporary/permanent/social/other)"),
            ("sanction_date", "Date notice received / sanction applied"),
            ("sanction_duration", "Duration shown in Epic's notice"),
            ("sanction_rule", "Rule or reason stated in the notice"),
            ("appeal_status", "Appeal status (not submitted/pending/decided)"),
        ]
        for key, label in fields:
            self.add_field(self.ban_tab, key, label)
        ttk.Label(self.ban_tab, text="Your factual appeal explanation / notes:").pack(anchor="w", pady=(8, 3))
        self.appeal_notes = tk.Text(self.ban_tab, height=7, wrap="word")
        self.appeal_notes.pack(fill="both", expand=True)
        ttk.Label(self.ban_tab, text="Epic decides whether a sanction is eligible for appeal and whether it should be changed. This app cannot unlock an account, remove a ban, evade a sanction, or submit an appeal for you.", foreground="red", wraplength=850).pack(anchor="w", pady=8)
        ttk.Button(self.ban_tab, text="Open Epic Sanctions & Appeals", command=lambda: webbrowser.open(SANCTIONS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.ban_tab, text="Read Epic ban and appeal guidance", command=lambda: webbrowser.open(BAN_HELP_URL)).pack(anchor="w", pady=4)

    def build_platform_tab(self):
        ttk.Label(self.platform_tab, text="Xbox and PlayStation restriction records", font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0, 6))
        ttk.Label(self.platform_tab, text="Organize notices and prepare a factual appeal through the platform owner. This cannot remove restrictions, alter enforcement records, bypass device/account bans, or evade platform rules.", foreground="red", wraplength=850).pack(anchor="w", pady=4)
        ttk.Label(self.platform_tab, text="Xbox enforcement details", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(8, 2))
        for key, label in [
            ("xbox_gamertag", "Xbox Gamertag"),
            ("xbox_enforcement_id", "Xbox enforcement / case reference"),
            ("xbox_restriction_type", "Xbox restriction type"),
            ("xbox_restriction_date", "Xbox notice / restriction date"),
            ("xbox_restriction_duration", "Xbox duration / end date"),
            ("xbox_appeal_status", "Xbox case review status"),
        ]:
            self.add_field(self.platform_tab, key, label)
        ttk.Label(self.platform_tab, text="Xbox factual case-review notes:").pack(anchor="w", pady=(6, 2))
        self.xbox_notes = tk.Text(self.platform_tab, height=4, wrap="word")
        self.xbox_notes.pack(fill="x", expand=False)
        ttk.Button(self.platform_tab, text="Open Xbox Enforcement History / Case Review", command=lambda: webbrowser.open(XBOX_ENFORCEMENT_URL)).pack(anchor="w", pady=4)
        ttk.Label(self.platform_tab, text="PlayStation enforcement details", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(8, 2))
        for key, label in [
            ("psn_online_id", "PlayStation Online ID"),
            ("ps_restriction_type", "PlayStation restriction type (account / communication / console)"),
            ("ps_restriction_date", "PlayStation notice / restriction date"),
            ("ps_restriction_duration", "PlayStation duration / end date"),
            ("ps_appeal_status", "PlayStation appeal status"),
        ]:
            self.add_field(self.platform_tab, key, label)
        ttk.Label(self.platform_tab, text="PlayStation factual appeal notes:").pack(anchor="w", pady=(6, 2))
        self.playstation_notes = tk.Text(self.platform_tab, height=4, wrap="word")
        self.playstation_notes.pack(fill="x", expand=False)
        ttk.Button(self.platform_tab, text="Open PlayStation suspension guidance", command=lambda: webbrowser.open(PLAYSTATION_SUSPENSIONS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.platform_tab, text="Open Xbox Community Standards", command=lambda: webbrowser.open(XBOX_STANDARDS_URL)).pack(anchor="w", pady=4)


    def build_additional_platform_tab(self):
        ttk.Label(self.additional_platform_tab, text="Steam and Nintendo restriction records", font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0, 6))
        ttk.Label(self.additional_platform_tab, text="Record account notices and organize a factual support request. These fields do not unlock accounts, remove bans, clear VAC/game bans, reverse restrictions, or bypass enforcement.", foreground="red", wraplength=850).pack(anchor="w", pady=4)
        ttk.Label(self.additional_platform_tab, text="Steam account / restriction details", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(8, 2))
        for key, label in [
            ("steam_account_name", "Steam account name"),
            ("steam_profile_id", "Steam profile URL / SteamID (if known)"),
            ("steam_case_reference", "Steam support / notice reference"),
            ("steam_restriction_type", "Steam restriction type (community/game/VAC/other)"),
            ("steam_restriction_date", "Steam notice / restriction date"),
            ("steam_restriction_duration", "Steam duration / end date"),
            ("steam_appeal_status", "Steam support / appeal status"),
        ]:
            self.add_field(self.additional_platform_tab, key, label)
        ttk.Label(self.additional_platform_tab, text="Steam factual support notes:").pack(anchor="w", pady=(6, 2))
        self.steam_notes = tk.Text(self.additional_platform_tab, height=4, wrap="word")
        self.steam_notes.pack(fill="x", expand=False)
        ttk.Button(self.additional_platform_tab, text="Open Steam Support", command=lambda: webbrowser.open(STEAM_ACCOUNT_HELP_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.additional_platform_tab, text="Steam Community Ban FAQ", command=lambda: webbrowser.open(STEAM_COMMUNITY_BAN_URL)).pack(anchor="w", pady=4)
        ttk.Label(self.additional_platform_tab, text="Nintendo account / restriction details", font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(8, 2))
        for key, label in [
            ("nintendo_nickname", "Nintendo Account nickname"),
            ("nintendo_account_id", "Nintendo Account ID / linked profile (if known)"),
            ("nintendo_case_reference", "Nintendo support / notice reference"),
            ("nintendo_restriction_type", "Nintendo restriction type"),
            ("nintendo_restriction_date", "Nintendo notice / restriction date"),
            ("nintendo_restriction_duration", "Nintendo duration / end date"),
            ("nintendo_appeal_status", "Nintendo support / appeal status"),
        ]:
            self.add_field(self.additional_platform_tab, key, label)
        ttk.Label(self.additional_platform_tab, text="Nintendo factual support notes:").pack(anchor="w", pady=(6, 2))
        self.nintendo_notes = tk.Text(self.additional_platform_tab, height=4, wrap="word")
        self.nintendo_notes.pack(fill="x", expand=False)
        ttk.Button(self.additional_platform_tab, text="Open Nintendo account-suspension guidance", command=lambda: webbrowser.open(NINTENDO_SUSPENSION_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.additional_platform_tab, text="Open Nintendo account-recovery guide", command=lambda: webbrowser.open(NINTENDO_RECOVERY_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.additional_platform_tab, text="Open Nintendo Support", command=lambda: webbrowser.open(NINTENDO_SUPPORT_URL)).pack(anchor="w", pady=4)

    def build_ticket_tab(self):
        ttk.Label(self.ticket_tab, text="Prepare a support request (not submitted automatically)", font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(0, 6))
        ttk.Label(self.ticket_tab, text="Create a clear draft for the service owner. The app cannot impersonate an owner, open a live agent session, unlink accounts, remove restrictions, or submit tickets automatically. Whether a service can be linked to or unlinked from Epic depends on Epic's current Connections settings and the service owner.", wraplength=850).pack(anchor="w", pady=4)
        self.add_choice(self.ticket_tab, "Support destination", self.ticket_target, ["Epic Games", "Xbox", "PlayStation", "Steam", "Nintendo", "Apple", "LEGO", "Google", "GeForce NOW", "Disney", "Twitch", "YouTube", "TikTok", "Facebook", "Payment provider"])
        self.add_choice(self.ticket_tab, "Request category", self.ticket_type, ["Account recovery / ownership review", "Compromised account / security incident", "Restriction appeal / case review", "Unlink a connected platform or service", "Remove or update a payment method", "Change account email or display name", "Other support request"])
        self.add_choice(self.ticket_tab, "Can you provide truthful ownership evidence?", self.ownership_ready, ["Not sure", "Yes", "No"])
        self.add_field(self.ticket_tab, "ticket_account_identifier", "Account name / ID (no passwords)")
        self.add_field(self.ticket_tab, "ticket_contact_email", "Safe contact email")
        self.add_field(self.ticket_tab, "ticket_connected_service", "Platform / service to unlink (if relevant)")
        self.add_field(self.ticket_tab, "ticket_payment_method", "Payment method type to review (no full numbers)")
        self.add_field(self.ticket_tab, "ticket_case_reference", "Existing support / enforcement reference")
        ttk.Label(self.ticket_tab, text="What happened and what outcome are you requesting?").pack(anchor="w", pady=(8, 3))
        self.ticket_summary = tk.Text(self.ticket_tab, height=6, wrap="word")
        self.ticket_summary.pack(fill="both", expand=True)
        ttk.Label(self.ticket_tab, text="Ownership evidence you can truthfully provide (invoice IDs, prior emails, linked account IDs, approximate dates; no secrets):").pack(anchor="w", pady=(8, 3))
        self.ticket_evidence = tk.Text(self.ticket_tab, height=5, wrap="word")
        self.ticket_evidence.pack(fill="both", expand=True)
        ttk.Label(self.ticket_tab, text="If you cannot establish ownership, pause and use the platform's official recovery process. This app will not lock, disable, or alter any account. Unlinking and payment changes must be completed by you through the verified account settings or the platform's support team.", foreground="red", wraplength=850).pack(anchor="w", pady=8)
        ttk.Button(self.ticket_tab, text="Open Epic Support Assistant / Contact", command=lambda: webbrowser.open(EPIC_CONTACT_URL)).pack(anchor="w", pady=3)
        ttk.Button(self.ticket_tab, text="Open Epic Linked Accounts", command=lambda: webbrowser.open(EPIC_LINKED_ACCOUNTS_URL)).pack(anchor="w", pady=3)
        ttk.Button(self.ticket_tab, text="Open selected platform support", command=self.open_selected_platform_support).pack(anchor="w", pady=3)

    def open_selected_platform_support(self):
        urls = {
            "Epic Games": EPIC_CONTACT_URL,
            "Xbox": XBOX_ENFORCEMENT_URL,
            "PlayStation": PLAYSTATION_SUSPENSIONS_URL,
            "Steam": STEAM_ACCOUNT_HELP_URL,
            "Nintendo": NINTENDO_SUPPORT_URL,
            "Apple": "https://support.apple.com/",
            "LEGO": "https://www.lego.com/service",
            "Google": "https://support.google.com/accounts/",
            "GeForce NOW": "https://www.nvidia.com/en-us/support/",
            "Disney": "https://help.disneyplus.com/",
            "Twitch": "https://help.twitch.tv/",
            "YouTube": "https://support.google.com/youtube/",
            "TikTok": "https://support.tiktok.com/",
            "Facebook": "https://www.facebook.com/help/",
            "Payment provider": "https://www.epicgames.com/help/en-US/"
        }
        webbrowser.open(urls.get(self.ticket_target.get(), EPIC_CONTACT_URL))

    def build_ticket_text(self, data):
        lines = [
            "SUPPORT REQUEST DRAFT — NOT SUBMITTED",
            "",
            "Support destination: " + data.get("ticket_target", "Not provided"),
            "Request category: " + data.get("ticket_type", "Not provided"),
            "Ownership evidence available: " + data.get("ownership_ready", "Not sure"),
            "Account identifier: " + data.get("ticket_account_identifier", "Not provided"),
            "Contact email: " + data.get("ticket_contact_email", "Not provided"),
            "Connected service to unlink: " + data.get("ticket_connected_service", "Not applicable"),
            "Payment method type to review: " + data.get("ticket_payment_method", "Not applicable"),
            "Existing case reference: " + data.get("ticket_case_reference", "Not provided"),
            "",
            "Request details:",
            data.get("ticket_summary", "Not provided"),
            "",
            "Ownership evidence:",
            data.get("ticket_evidence", "Not provided"),
            "",
            "SECURITY: Never include passwords, one-time 2FA codes, backup codes, authenticator secrets, session cookies, or full payment-card numbers.",
            "This draft is not sent automatically. Submit only through the official support channel after verifying account ownership."
        ]
        return "\n".join(lines) + "\n"

    def build_help_tab(self):
        info = (
            "OFFICIAL EPIC RECOVERY PROCESS\n\n"
            "1. Start with Epic's account recovery guide. From the sign-in page, choose 'Trouble signing in?' and follow the on-screen steps.\n"
            "2. If self-service does not restore access, use Epic's multi-step recovery request. It may ask for a recovery contact email, Account ID or Invoice ID, past emails and display names, name/country, the phone number used for 2FA, linked accounts and payment information. Provide accurate details; skip anything you do not know. Verification is decided by Epic, and correct details do not guarantee approval.\n"
            "3. Epic currently lists Epic Authenticator, third-party authenticator apps, email, and SMS. If locked out of authenticator or SMS, Epic says to try email verification or backup codes through its official flow. Never enter codes or backup codes in this app.\n"
            "4. Review the recovery details for accuracy before submitting through Epic's own form. After submission, check the recovery status page using the Recovery ID and watch the new contact email (including spam). If you see a too-many-requests message, stop retrying and follow Epic's wait guidance.\n\n"
            "SUPPORTED 2FA OPTIONS\n"
            "Epic's help currently lists Epic Authenticator, third-party authenticator apps, email, and SMS. Availability of SMS can vary by region. The app records which methods you used; it does not perform verification.\n\n"
            "VPN / PROXY\n"
            "Record past use honestly for context only. Do not use a VPN or proxy to imitate an old location or submit a recovery request through one. Epic says VPN/proxy use or an unfamiliar location can contribute to a denied recovery request. For the relevant sign-in error, disconnect VPN/hosting/proxy services before trying again.\n\n"
            "BANS / SANCTIONS\n"
            "Check the notice email or in-game message for sanction type, duration, rule, and Sanction ID. Review eligible sanctions and appeal through Epic's Sanctions and Appeals portal. Epic allows one appeal per eligible sanction; this app only organizes notes and cannot remove a ban.\n\n"
            "LOCAL PRIVACY\n"
            "The recovery packet is saved only to the folder you choose. It contains personal account information. Store it securely and share it only through Epic's official recovery process. No data is sent by this app.\n\n"
            "This independent utility is not affiliated with Epic Games. It does not verify ownership, reset passwords, unlock accounts, remove sanctions, or submit requests automatically."
        )
        ttk.Label(self.help_tab, text=info, justify="left", wraplength=850).pack(anchor="w")
        ttk.Button(self.help_tab, text="How to change Epic display name", command=lambda: webbrowser.open(DISPLAY_NAME_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="How to change Epic account email", command=lambda: webbrowser.open(EMAIL_CHANGE_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Open Epic account settings", command=lambda: webbrowser.open(ACCOUNT_SETTINGS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Open Epic account recovery guide", command=lambda: webbrowser.open(RECOVERY_GUIDE_URL)).pack(anchor="w", pady=(12, 4))
        ttk.Button(self.help_tab, text="Open official recovery request form guide", command=lambda: webbrowser.open(RECOVERY_REQUEST_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Check Epic recovery request status", command=lambda: webbrowser.open(RECOVERY_STATUS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Why a recovery request may be denied", command=lambda: webbrowser.open(RECOVERY_DENIED_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Too many recovery attempts? Read Epic guidance", command=lambda: webbrowser.open(TOO_MANY_REQUESTS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Open official 2FA methods guide", command=lambda: webbrowser.open(TWO_FA_METHODS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Locked out of authenticator or SMS?", command=lambda: webbrowser.open(LOST_2FA_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Epic VPN/proxy sign-in troubleshooting", command=lambda: webbrowser.open(VPN_TROUBLESHOOTING_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Open Epic Sanctions & Appeals", command=lambda: webbrowser.open(SANCTIONS_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Read Epic ban and appeal guidance", command=lambda: webbrowser.open(BAN_HELP_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Open Epic Support", command=self.open_support).pack(anchor="w", pady=4)

    def collect_data(self):
        data = {key: widget.get().strip() for key, widget in self.fields.items()}
        data.update({
            "issue": self.issue.get(),
            "recovery_status": self.recovery_status.get(),
            "recovery_followup_notes": self.recovery_followup_notes.get("1.0", "end").strip(),
            "twofa_methods": [name for name, var in self.twofa_vars.items() if var.get()],
            "twofa_access": self.twofa_access.get(),
            "vpn_used": self.vpn_used.get(),
            "description": self.description.get("1.0", "end").strip(),
            "evidence": self.evidence.get("1.0", "end").strip(),
            "appeal_notes": self.appeal_notes.get("1.0", "end").strip(),
            "xbox_notes": self.xbox_notes.get("1.0", "end").strip(),
            "playstation_notes": self.playstation_notes.get("1.0", "end").strip(),
            "steam_notes": self.steam_notes.get("1.0", "end").strip(),
            "nintendo_notes": self.nintendo_notes.get("1.0", "end").strip(),
            "ticket_target": self.ticket_target.get(),
            "ticket_type": self.ticket_type.get(),
            "ownership_ready": self.ownership_ready.get(),
            "ticket_summary": self.ticket_summary.get("1.0", "end").strip(),
            "ticket_evidence": self.ticket_evidence.get("1.0", "end").strip(),
            "prepared_at_local": datetime.now().astimezone().isoformat(timespec="minutes"),
            "app_name": APP_NAME,
            "app_version": APP_VERSION,
        })
        return data

    def validate(self, data):
        email = data.get("recovery_email", "")
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            messagebox.showwarning("Recovery email required", "Enter a valid current recovery contact email address.")
            return False
        return True

    def build_pdf(self, data, output):
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        styles = getSampleStyleSheet()
        title = ParagraphStyle("RecoveryTitle", parent=styles["Title"], fontSize=16, leading=20)
        body = ParagraphStyle("RecoveryBody", parent=styles["BodyText"], leading=13, spaceAfter=5)
        story = [Paragraph("EPIC GAMES ACCOUNT RECOVERY INFORMATION", title),
                 Paragraph("Prepared: " + escape(data["prepared_at_local"]), body),
                 Paragraph("This is a user-prepared information summary, not an official Epic form.", body), Spacer(1, 8)]
        sections = [
            ("ACCOUNT IDENTIFICATION", [
                ("Recovery contact email", "recovery_email"), ("Original email", "original_email"),
                ("Other emails used", "other_emails"), ("Current / most recent display name", "username"),
                ("Desired new Epic display name (planning only)", "desired_username"),
                ("Desired new Epic account email (planning only)", "desired_email"),
                ("Original display name", "original_username"), ("Previous display names", "previous_names"),
                ("First name", "first_name"), ("Last name", "last_name"), ("Country created", "country"),
                ("State / region", "state"), ("Approximate creation date", "creation_date"),
                ("Epic Account ID", "account_id"), ("Invoice ID", "invoice_id"),
                ("Remembered original public IP", "original_ip"), ("Phone used for SMS 2FA", "phone_2fa"),
                ("Linked accounts and IDs", "linked_accounts"), ("Approximate linked dates", "linked_dates"),
                ("Purchase payment types (no full numbers)", "payment_types")]),
            ("TWO-STEP AUTHENTICATION", [
                ("Methods remembered", "twofa_methods"), ("Access to enabled method(s)", "twofa_access"),
                ("Additional notes", "twofa_notes")]),
            ("VPN / PROXY CONTEXT — DOCUMENTATION ONLY", [
                ("VPN / proxy used", "vpn_used"), ("Provider", "vpn_provider"), ("Region", "vpn_region")]),
            ("INCIDENT", [
                ("Incident type", "issue"), ("Description", "description"), ("Additional evidence", "evidence")]),
            ("EPIC RECOVERY REQUEST RESPONSE", [
                ("Current request status", "recovery_status"), ("Case / reference ID", "recovery_case_id"),
                ("Date submitted", "recovery_submitted_date"), ("Exact error / response message", "recovery_error_message"),
                ("Follow-up notes", "recovery_followup_notes")]),
            ("BAN / SANCTION APPEAL NOTES", [
                ("Sanction ID", "sanction_id"), ("Sanction type", "sanction_type"),
                ("Date received / applied", "sanction_date"), ("Duration", "sanction_duration"),
                ("Rule / reason in notice", "sanction_rule"), ("Appeal status", "appeal_status"),
                ("Factual appeal explanation / notes", "appeal_notes")]),
            ("XBOX RESTRICTION / CASE REVIEW NOTES", [
                ("Gamertag", "xbox_gamertag"), ("Enforcement / case reference", "xbox_enforcement_id"),
                ("Restriction type", "xbox_restriction_type"), ("Notice / restriction date", "xbox_restriction_date"),
                ("Duration / end date", "xbox_restriction_duration"), ("Case review status", "xbox_appeal_status"),
                ("Factual notes", "xbox_notes")]),
            ("PLAYSTATION RESTRICTION / APPEAL NOTES", [
                ("Online ID", "psn_online_id"), ("Restriction type", "ps_restriction_type"),
                ("Notice / restriction date", "ps_restriction_date"), ("Duration / end date", "ps_restriction_duration"),
                ("Appeal status", "ps_appeal_status"), ("Factual notes", "playstation_notes")]),
            ("STEAM RESTRICTION / SUPPORT NOTES", [
                ("Account name", "steam_account_name"), ("Profile URL / SteamID", "steam_profile_id"),
                ("Support / notice reference", "steam_case_reference"), ("Restriction type", "steam_restriction_type"),
                ("Notice / restriction date", "steam_restriction_date"), ("Duration / end date", "steam_restriction_duration"),
                ("Support / appeal status", "steam_appeal_status"), ("Factual notes", "steam_notes")]),
            ("SUPPORT REQUEST DRAFT", [
                ("Support destination", "ticket_target"), ("Request category", "ticket_type"),
                ("Ownership evidence available", "ownership_ready"), ("Account identifier", "ticket_account_identifier"),
                ("Contact email", "ticket_contact_email"), ("Connected service to unlink", "ticket_connected_service"),
                ("Payment method type to review", "ticket_payment_method"), ("Existing case reference", "ticket_case_reference"),
                ("Request details", "ticket_summary"), ("Ownership evidence", "ticket_evidence")]),
            ("NINTENDO RESTRICTION / SUPPORT NOTES", [
                ("Account nickname", "nintendo_nickname"), ("Account ID / linked profile", "nintendo_account_id"),
                ("Support / notice reference", "nintendo_case_reference"), ("Restriction type", "nintendo_restriction_type"),
                ("Notice / restriction date", "nintendo_restriction_date"), ("Duration / end date", "nintendo_restriction_duration"),
                ("Support / appeal status", "nintendo_appeal_status"), ("Factual notes", "nintendo_notes")])
        ]
        for heading, fields in sections:
            story.append(Paragraph(escape(heading), styles["Heading2"]))
            for label, key in fields:
                value = data.get(key) or "Not provided"
                if isinstance(value, list):
                    value = ", ".join(value) if value else "Not provided"
                value = escape(str(value)).replace("\n", "<br/>")
                story.append(Paragraph("<b>" + escape(label) + ":</b> " + value, body))
            story.append(Spacer(1, 6))
        story.append(Paragraph("SECURITY NOTES", styles["Heading2"]))
        for note in [
            "Never share passwords, one-time 2FA codes, backup codes, authenticator setup keys, or full payment-card numbers in this document.",
            "VPN/proxy information is recorded only as truthful context. Epic warns VPN/proxy use may contribute to recovery denial; do not use one to submit a recovery request. This app does not connect to proxies, spoof IP addresses, or bypass verification.",
            "This app does not contact Epic, verify account ownership, or submit recovery requests. Connected-service availability varies; confirm the service appears in Epic Account > Apps and Accounts / Connections before requesting an unlink.",
            "Use only Epic's official account recovery and support pages: " + SUPPORT_URL
        ]:
            story.append(Paragraph("• " + escape(note), body))
        SimpleDocTemplate(str(output), pagesize=letter, rightMargin=42, leftMargin=42, topMargin=42, bottomMargin=42).build(story)

    def generate_pdf_dialog(self):
        data = self.collect_data()
        if not self.validate(data):
            return
        output = filedialog.asksaveasfilename(title="Save recovery PDF", defaultextension=".pdf", initialfile="Epic_Games_Recovery_Request.pdf", filetypes=[("PDF documents", "*.pdf")])
        if not output:
            return
        try:
            self.build_pdf(data, output)
            messagebox.showinfo("PDF created", "Recovery PDF saved to:\n" + output)
        except ImportError:
            messagebox.showerror("Missing dependency", "Install ReportLab: py -m pip install -r requirements.txt")
        except Exception as exc:
            messagebox.showerror("PDF error", str(exc))

    def export_packet(self):
        data = self.collect_data()
        if not self.validate(data):
            return
        if not messagebox.askyesno("Sensitive local export", "The packet will contain personal account details. Save it only on a trusted device and share it only with Epic through its official recovery process. Continue?"):
            return
        parent = filedialog.askdirectory(title="Choose where to save your Epic recovery packet")
        if not parent:
            return
        folder = Path(parent) / ("Epic_Recovery_Packet_" + datetime.now().strftime("%Y%m%d_%H%M%S"))
        try:
            folder.mkdir(parents=True, exist_ok=False)
            (folder / "account_details.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            self.build_pdf(data, folder / "recovery_request.pdf")
            try:
                shutil.copy2(Path(__file__).resolve(), folder / "app.py")
            except Exception:
                (folder / "SOURCE_NOT_COPIED.txt").write_text("The running script could not be copied automatically. Download app.py from the project's GitHub repository.", encoding="utf-8")
            (folder / "support_request_draft.txt").write_text(self.build_ticket_text(data), encoding="utf-8")
            (folder / "README.txt").write_text(
                "EPIC GAMES RECOVERY PACKET\n\n"
                "recovery_request.pdf: readable recovery summary.\n"
                "account_details.json: structured copy of the form details.\n"
                "app.py: copy of the running script, when available.\n"
                "Ban and appeal fields: sanction ID, type, date, duration, stated rule, appeal status, and your notes.\n\n"
                "Keep this folder private. It contains personal account information. Do not add passwords, 2FA codes, backup codes, authenticator keys, session cookies, or full payment-card numbers. Submit information only through Epic's official recovery flow.\n"
                + SUPPORT_URL + "\n", encoding="utf-8")
            zip_path = shutil.make_archive(str(folder), "zip", root_dir=folder)
            messagebox.showinfo("Recovery packet exported", "Created your local packet:\n" + str(folder) + "\n\nZIP archive:\n" + zip_path)
        except ImportError:
            messagebox.showerror("Missing dependency", "Install ReportLab: py -m pip install -r requirements.txt")
        except Exception as exc:
            messagebox.showerror("Export error", str(exc))

    def clear_form(self):
        if not messagebox.askyesno("Clear form", "Clear all entered information?"):
            return
        for widget in self.fields.values():
            widget.delete(0, tk.END)
        for var in self.twofa_vars.values():
            var.set(False)
        self.twofa_access.set("Not sure")
        self.issue.set("Hacked / compromised")
        self.recovery_status.set("Not submitted")
        self.recovery_followup_notes.delete("1.0", tk.END)
        self.vpn_used.set("Not sure")
        self.description.delete("1.0", tk.END)
        self.evidence.delete("1.0", tk.END)
        self.appeal_notes.delete("1.0", tk.END)
        self.xbox_notes.delete("1.0", tk.END)
        self.playstation_notes.delete("1.0", tk.END)
        self.steam_notes.delete("1.0", tk.END)
        self.nintendo_notes.delete("1.0", tk.END)
        self.ticket_summary.delete("1.0", tk.END)
        self.ticket_evidence.delete("1.0", tk.END)
        self.ticket_target.set("Epic Games")
        self.ticket_type.set("Account recovery / ownership review")
        self.ownership_ready.set("Not sure")

    def open_support(self):
        webbrowser.open(SUPPORT_URL)

if __name__ == "__main__":
    root = tk.Tk()
    app = EpicRecoveryAssistant(root)
    root.mainloop()

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
APP_VERSION = "1.1"
SUPPORT_URL = "https://www.epicgames.com/help/en-US/"
RECOVERY_URL = "https://www.epicgames.com/id/login"
TWO_FA_URL = "https://www.epicgames.com/account/password"
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
        self.vpn_used = tk.StringVar(value="Not sure")
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
        tabs.add(self.account_tab, text="Account Recovery")
        tabs.add(self.security_tab, text="2-Step & VPN/Proxy")
        tabs.add(self.incident_tab, text="Incident Details")
        tabs.add(self.help_tab, text="Official Help")
        self.build_account_tab()
        self.build_security_tab()
        self.build_incident_tab()
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

    def build_help_tab(self):
        info = (
            "OFFICIAL EPIC RECOVERY PROCESS\n\n"
            "1. Try Epic's sign-in page and choose 'Trouble signing in?' if you cannot access the account.\n"
            "2. Follow the recovery flow. Epic may ask for account ID, invoice ID, past emails/display names, country, phone/2FA details, linked accounts, and purchase information.\n"
            "3. If you cannot use the requested 2FA method, follow Epic's on-screen lost-access / recovery option. Never send codes to anyone.\n"
            "4. Review the recovery details for accuracy before submitting through Epic's own form.\n\n"
            "SUPPORTED 2FA OPTIONS\n"
            "Epic's help currently lists Epic Authenticator, third-party authenticator apps, email, and SMS. Availability of SMS can vary by region. The app records which methods you used; it does not perform verification.\n\n"
            "VPN / PROXY\n"
            "Record past use honestly. Do not turn on a VPN or proxy to imitate an old location. Epic's sign-in troubleshooting may recommend disconnecting VPN/hosting/proxy services.\n\n"
            "LOCAL PRIVACY\n"
            "The recovery packet is saved only to the folder you choose. It contains personal account information. Store it securely and share it only through Epic's official recovery process. No data is sent by this app.\n\n"
            "This independent utility is not affiliated with Epic Games. It does not verify ownership, reset passwords, or submit a request automatically."
        )
        ttk.Label(self.help_tab, text=info, justify="left", wraplength=850).pack(anchor="w")
        ttk.Button(self.help_tab, text="Open Epic Account Recovery / Sign-in", command=lambda: webbrowser.open(RECOVERY_URL)).pack(anchor="w", pady=(12, 4))
        ttk.Button(self.help_tab, text="Open Epic 2FA settings guidance", command=lambda: webbrowser.open(TWO_FA_URL)).pack(anchor="w", pady=4)
        ttk.Button(self.help_tab, text="Open Epic Support", command=self.open_support).pack(anchor="w", pady=4)

    def collect_data(self):
        data = {key: widget.get().strip() for key, widget in self.fields.items()}
        data.update({
            "issue": self.issue.get(),
            "twofa_methods": [name for name, var in self.twofa_vars.items() if var.get()],
            "twofa_access": self.twofa_access.get(),
            "vpn_used": self.vpn_used.get(),
            "description": self.description.get("1.0", "end").strip(),
            "evidence": self.evidence.get("1.0", "end").strip(),
            "prepared_at_local": datetime.now().astimezone().isoformat(timespec="minutes"),
            "app_name": APP_NAME,
            "app_version": APP_VERSION,
        })
        return data

    def validate(self, data):
        email = data.get("recovery_email", "")
        if not re.fullmatch(r"[^@\\s]+@[^@\\s]+\\.[^@\\s]+", email):
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
                ("Incident type", "issue"), ("Description", "description"), ("Additional evidence", "evidence")])
        ]
        for heading, fields in sections:
            story.append(Paragraph(escape(heading), styles["Heading2"]))
            for label, key in fields:
                value = data.get(key) or "Not provided"
                if isinstance(value, list):
                    value = ", ".join(value) if value else "Not provided"
                value = escape(str(value)).replace("\\n", "<br/>")
                story.append(Paragraph("<b>" + escape(label) + ":</b> " + value, body))
            story.append(Spacer(1, 6))
        story.append(Paragraph("SECURITY NOTES", styles["Heading2"]))
        for note in [
            "Never share passwords, one-time 2FA codes, backup codes, authenticator setup keys, or full payment-card numbers in this document.",
            "VPN/proxy information is recorded only as truthful context. This app does not connect to proxies, spoof IP addresses, or bypass verification.",
            "This app does not contact Epic, verify account ownership, or submit recovery requests.",
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
            messagebox.showinfo("PDF created", "Recovery PDF saved to:\\n" + output)
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
            (folder / "README.txt").write_text(
                "EPIC GAMES RECOVERY PACKET\\n\\n"
                "recovery_request.pdf: readable recovery summary.\\n"
                "account_details.json: structured copy of the form details.\\n"
                "app.py: copy of the running script, when available.\\n\\n"
                "Keep this folder private. It contains personal account information. Do not add passwords, 2FA codes, backup codes, authenticator keys, session cookies, or full payment-card numbers. Submit information only through Epic's official recovery flow.\\n"
                + SUPPORT_URL + "\\n", encoding="utf-8")
            messagebox.showinfo("Recovery packet exported", "Created your local packet:\\n" + str(folder))
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
        self.vpn_used.set("Not sure")
        self.description.delete("1.0", tk.END)
        self.evidence.delete("1.0", tk.END)

    def open_support(self):
        webbrowser.open(SUPPORT_URL)

if __name__ == "__main__":
    root = tk.Tk()
    app = EpicRecoveryAssistant(root)
    root.mainloop()

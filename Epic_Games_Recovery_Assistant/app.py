import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
from xml.sax.saxutils import escape
import webbrowser
import re

APP_NAME = "Epic Games Recovery Assistant"
SUPPORT_URL = "https://www.epicgames.com/help/en-US/"


class EpicRecoveryAssistant:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_NAME)
        self.root.geometry("900x850")
        self.root.minsize(680, 650)
        self.fields = {}
        self.issue = tk.StringVar(value="Hacked")
        self.twofa_method = tk.StringVar(value="Not sure")
        self.twofa_access = tk.StringVar(value="Not sure")
        self.vpn_used = tk.StringVar(value="Not sure")
        self.build_ui()

    def build_ui(self):
        main = ttk.Frame(self.root, padding=16)
        main.pack(fill="both", expand=True)
        ttk.Label(main, text=APP_NAME, font=("Segoe UI", 20, "bold")).pack(anchor="w")
        ttk.Label(main, text="Organize truthful ownership details and prepare a PDF for Epic Support.").pack(anchor="w", pady=5)

        tabs = ttk.Notebook(main)
        tabs.pack(fill="both", expand=True, pady=10)
        self.account_tab = ttk.Frame(tabs, padding=12)
        self.security_tab = ttk.Frame(tabs, padding=12)
        self.incident_tab = ttk.Frame(tabs, padding=12)
        self.help_tab = ttk.Frame(tabs, padding=12)
        tabs.add(self.account_tab, text="Account Recovery")
        tabs.add(self.security_tab, text="2-Step & Network")
        tabs.add(self.incident_tab, text="Incident Details")
        tabs.add(self.help_tab, text="Recovery Help")
        self.build_account_tab()
        self.build_security_tab()
        self.build_incident_tab()
        self.build_help_tab()

        actions = ttk.Frame(main)
        actions.pack(fill="x")
        ttk.Button(actions, text="Generate PDF Request", command=self.generate_pdf).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Clear Form", command=self.clear_form).pack(side="left")
        ttk.Button(actions, text="Open Epic Support", command=self.open_support).pack(side="right")

    def add_field(self, parent, key, label):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=4)
        ttk.Label(row, text=label, width=39).pack(side="left")
        entry = ttk.Entry(row)
        entry.pack(side="left", fill="x", expand=True)
        self.fields[key] = entry

    def add_choice(self, parent, label, variable, values):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=5)
        ttk.Label(row, text=label, width=39).pack(side="left")
        ttk.Combobox(row, textvariable=variable, values=values, state="readonly").pack(side="left", fill="x", expand=True)

    def build_account_tab(self):
        ttk.Label(self.account_tab, text="Account Recovery Information",
                  font=("Segoe UI", 13, "bold")).pack(anchor="w", pady=(0, 8))
        fields = [
            ("recovery_email", "Current recovery contact email"),
            ("original_email", "Original Epic account email"),
            ("username", "Epic Games username"),
            ("first_name", "First name"),
            ("last_name", "Last name"),
            ("state", "Original state / region"),
            ("original_ip", "Remembered original public IP (optional)"),
            ("creation_date", "Approximate account creation date"),
            ("previous_names", "Previous display names"),
            ("linked_accounts", "Linked Xbox / PlayStation / Nintendo accounts"),
        ]
        for key, label in fields:
            self.add_field(self.account_tab, key, label)
        ttk.Label(self.account_tab, text="Only enter accurate details. Never enter a password, authentication code, or backup code.",
                  foreground="red", wraplength=760).pack(anchor="w", pady=10)

    def build_security_tab(self):
        ttk.Label(self.security_tab, text="Two-step authentication (2FA)",
                  font=("Segoe UI", 13, "bold")).pack(anchor="w", pady=(0, 8))
        self.add_choice(self.security_tab, "2FA method previously enabled", self.twofa_method,
                        ["Not sure", "Authenticator app", "Email", "SMS", "Other"])
        self.add_choice(self.security_tab, "Can you still access that method?", self.twofa_access,
                        ["Not sure", "Yes", "No"])
        ttk.Label(self.security_tab,
                  text="Use only Epic's official sign-in and recovery screens to complete verification. This app does not request, read, or store 2FA codes, backup codes, passwords, or QR setup keys.",
                  wraplength=760, justify="left").pack(anchor="w", pady=(8, 16))

        ttk.Separator(self.security_tab).pack(fill="x", pady=8)
        ttk.Label(self.security_tab, text="VPN / proxy context (documentation only)",
                  font=("Segoe UI", 13, "bold")).pack(anchor="w", pady=(4, 8))
        self.add_choice(self.security_tab, "Were you using a VPN or proxy?", self.vpn_used,
                        ["Not sure", "No", "Yes"])
        self.add_field(self.security_tab, "vpn_provider", "VPN / proxy provider (if applicable)")
        self.add_field(self.security_tab, "vpn_region", "VPN / proxy region at the time (if known)")
        ttk.Label(self.security_tab,
                  text="This records context only. The app does not connect to a VPN/proxy, change your IP address, spoof your location, or bypass Epic's checks. Do not guess an original IP address.",
                  foreground="red", wraplength=760, justify="left").pack(anchor="w", pady=12)

    def build_incident_tab(self):
        ttk.Label(self.incident_tab, text="What happened to your account?").pack(anchor="w")
        ttk.Combobox(
            self.incident_tab, textvariable=self.issue,
            values=["Hacked", "Stolen account", "Lost access", "Locked account",
                    "Email changed without permission", "Other"],
            state="readonly"
        ).pack(fill="x", pady=6)
        ttk.Label(self.incident_tab, text="Describe the problem:").pack(anchor="w", pady=(10, 3))
        self.description = tk.Text(self.incident_tab, height=8, wrap="word")
        self.description.pack(fill="both", expand=True)
        ttk.Label(self.incident_tab, text="Additional ownership evidence (never include passwords or codes):").pack(anchor="w", pady=(12, 3))
        self.evidence = tk.Text(self.incident_tab, height=6, wrap="word")
        self.evidence.pack(fill="both", expand=True)

    def build_help_tab(self):
        text = (
            "1. Complete Account Recovery and Security Details using information you know is accurate.\n\n"
            "2. Describe the incident and list non-secret ownership evidence.\n\n"
            "3. Generate the PDF, then review it before sharing.\n\n"
            "4. Open Epic's official support site and follow its account recovery steps.\n\n"
            "2FA: If you can access your registered authenticator, email, or phone, follow the prompts on Epic's official site. "
            "If you cannot, use Epic's official account recovery flow. Never give a code to another person or enter it in this app.\n\n"
            "VPN/proxy: This app only records whether one was in use as context. It cannot recreate an old IP address or improve verification by changing locations.\n\n"
            "This utility is independent and is not affiliated with Epic Games. It does not connect to Epic, verify ownership, reset passwords, or submit requests automatically."
        )
        ttk.Label(self.help_tab, text=text, justify="left", wraplength=760).pack(anchor="w")
        ttk.Button(self.help_tab, text="Visit Epic Games Support", command=self.open_support).pack(anchor="w", pady=16)

    def collect_data(self):
        data = {key: widget.get().strip() for key, widget in self.fields.items()}
        data.update({
            "issue": self.issue.get(),
            "twofa_method": self.twofa_method.get(),
            "twofa_access": self.twofa_access.get(),
            "vpn_used": self.vpn_used.get(),
            "description": self.description.get("1.0", "end").strip(),
            "evidence": self.evidence.get("1.0", "end").strip(),
        })
        return data

    def generate_pdf(self):
        data = self.collect_data()
        email = data["recovery_email"]
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            messagebox.showwarning("Recovery email required", "Enter a valid contact email address.")
            return

        output = filedialog.asksaveasfilename(
            title="Save recovery request",
            defaultextension=".pdf",
            initialfile="Epic_Games_Recovery_Request.pdf",
            filetypes=[("PDF documents", "*.pdf")]
        )
        if not output:
            return

        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.enums import TA_LEFT
            from reportlab.lib import colors

            doc = SimpleDocTemplate(output, pagesize=letter, rightMargin=48, leftMargin=48,
                                    topMargin=48, bottomMargin=48)
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle("TitleCustom", parent=styles["Title"], alignment=TA_LEFT, fontSize=16)
            heading_style = styles["Heading2"]
            body_style = ParagraphStyle("BodyCustom", parent=styles["BodyText"], leading=14, spaceAfter=6)
            story = [Paragraph("EPIC GAMES ACCOUNT RECOVERY REQUEST", title_style),
                     Paragraph("Prepared: " + datetime.now().strftime("%Y-%m-%d %H:%M"), body_style),
                     Spacer(1, 10)]

            sections = [
                ("ACCOUNT INFORMATION", [
                    ("Recovery contact email", "recovery_email"),
                    ("Original Epic email", "original_email"),
                    ("Epic username", "username"),
                    ("First name", "first_name"),
                    ("Last name", "last_name"),
                    ("Original state / region", "state"),
                    ("Remembered original public IP", "original_ip"),
                    ("Approximate account creation date", "creation_date"),
                    ("Previous display names", "previous_names"),
                    ("Linked gaming accounts", "linked_accounts"),
                ]),
                ("2-STEP AUTHENTICATION", [
                    ("Previously enabled method", "twofa_method"),
                    ("Can access that method", "twofa_access"),
                ]),
                ("VPN / PROXY CONTEXT (DOCUMENTATION ONLY)", [
                    ("VPN / proxy used", "vpn_used"),
                    ("Provider", "vpn_provider"),
                    ("Region at the time", "vpn_region"),
                ]),
                ("INCIDENT INFORMATION", [
                    ("Issue type", "issue"),
                    ("Description", "description"),
                    ("Ownership evidence", "evidence"),
                ]),
            ]
            for heading, items in sections:
                story.append(Paragraph(escape(heading), heading_style))
                for label, key in items:
                    value = data.get(key) or "Not provided"
                    value = escape(value).replace("\n", "<br/>")
                    story.append(Paragraph("<b>" + escape(label) + ":</b> " + value, body_style))
                story.append(Spacer(1, 6))

            story.append(Paragraph("IMPORTANT SECURITY NOTES", heading_style))
            notes = [
                "This is a user-prepared document, not an official Epic Games form.",
                "It does not verify ownership or submit a recovery request.",
                "Never share passwords, 2FA codes, backup codes, or authenticator setup keys.",
                "VPN/proxy details are recorded only as context; this app does not change or spoof IP addresses.",
                "Submit recovery information only through official Epic Games Support: " + SUPPORT_URL,
            ]
            for note in notes:
                story.append(Paragraph("• " + escape(note), body_style))
            doc.build(story)
            messagebox.showinfo("PDF created", "Your recovery request was saved to:\n" + output)
        except ImportError:
            messagebox.showerror("Missing dependency", "Install ReportLab with: py -m pip install reportlab")
        except Exception as exc:
            messagebox.showerror("PDF error", str(exc))

    def clear_form(self):
        if not messagebox.askyesno("Clear form", "Clear all entered information?"):
            return
        for widget in self.fields.values():
            widget.delete(0, tk.END)
        self.issue.set("Hacked")
        self.twofa_method.set("Not sure")
        self.twofa_access.set("Not sure")
        self.vpn_used.set("Not sure")
        self.description.delete("1.0", tk.END)
        self.evidence.delete("1.0", tk.END)

    def open_support(self):
        webbrowser.open(SUPPORT_URL)


if __name__ == "__main__":
    root = tk.Tk()
    app = EpicRecoveryAssistant(root)
    root.mainloop()

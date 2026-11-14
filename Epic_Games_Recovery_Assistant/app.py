import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
import webbrowser
import re

APP_NAME = "Epic Games Recovery Assistant"
SUPPORT_URL = "https://www.epicgames.com/help/en-US/"


class EpicRecoveryAssistant:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_NAME)
        self.root.geometry("850x800")
        self.root.minsize(620, 620)
        self.fields = {}
        self.issue = tk.StringVar(value="Hacked")
        self.build_ui()

    def build_ui(self):
        main = ttk.Frame(self.root, padding=16)
        main.pack(fill="both", expand=True)
        ttk.Label(main, text=APP_NAME, font=("Segoe UI", 20, "bold")).pack(anchor="w")
        ttk.Label(main, text="Prepare account recovery information and a PDF request.").pack(anchor="w", pady=5)

        tabs = ttk.Notebook(main)
        tabs.pack(fill="both", expand=True, pady=10)
        self.account_tab = ttk.Frame(tabs, padding=12)
        self.incident_tab = ttk.Frame(tabs, padding=12)
        self.help_tab = ttk.Frame(tabs, padding=12)
        tabs.add(self.account_tab, text="Account Recovery")
        tabs.add(self.incident_tab, text="Incident Details")
        tabs.add(self.help_tab, text="Recovery Help")
        self.build_account_tab()
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
        ttk.Label(row, text=label, width=36).pack(side="left")
        entry = ttk.Entry(row)
        entry.pack(side="left", fill="x", expand=True)
        self.fields[key] = entry

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
        ttk.Label(self.account_tab, text="Never enter passwords, 2FA codes, or backup codes.",
                  foreground="red").pack(anchor="w", pady=10)

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
        self.description.pack(fill="x")
        ttk.Label(self.incident_tab, text="Additional ownership evidence (no passwords or codes):").pack(anchor="w", pady=(12, 3))
        self.evidence = tk.Text(self.incident_tab, height=6, wrap="word")
        self.evidence.pack(fill="x")

    def build_help_tab(self):
        text = (
            "1. Complete the Account Recovery tab.\n\n"
            "2. Describe what happened in Incident Details.\n\n"
            "3. Generate and review your PDF.\n\n"
            "4. Open Epic's official support website and follow its recovery process.\n\n"
            "This app only organizes information. It does not access Epic accounts, "
            "verify ownership, reset passwords, or submit requests automatically."
        )
        ttk.Label(self.help_tab, text=text, justify="left", wraplength=680).pack(anchor="w")
        ttk.Button(self.help_tab, text="Visit Epic Games Support", command=self.open_support).pack(anchor="w", pady=16)

    def collect_data(self):
        data = {key: widget.get().strip() for key, widget in self.fields.items()}
        data["issue"] = self.issue.get()
        data["description"] = self.description.get("1.0", "end").strip()
        data["evidence"] = self.evidence.get("1.0", "end").strip()
        return data

    def generate_pdf(self):
        data = self.collect_data()
        email = data["recovery_email"]
        if not re.fullmatch(r"[^@\\s]+@[^@\\s]+\\.[^@\\s]+", email):
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
            from reportlab.pdfgen import canvas
            pdf = canvas.Canvas(output, pagesize=letter)
            width, height = letter
            left, y = 52, height - 55

            def new_page():
                nonlocal y
                pdf.showPage()
                y = height - 55

            def write_line(value, bold=False, size=9):
                nonlocal y
                font = "Helvetica-Bold" if bold else "Helvetica"
                pdf.setFont(font, size)
                words = str(value).split()
                line = ""
                for word in words:
                    candidate = (line + " " + word).strip()
                    if pdf.stringWidth(candidate, font, size) > width - 104 and line:
                        if y < 55:
                            new_page()
                        pdf.drawString(left, y, line)
                        y -= 14
                        line = word
                    else:
                        line = candidate
                if line:
                    if y < 55:
                        new_page()
                    pdf.drawString(left, y, line)
                    y -= 14

            write_line("EPIC GAMES ACCOUNT RECOVERY REQUEST", True, 15)
            y -= 8
            write_line("Prepared: " + datetime.now().strftime("%Y-%m-%d %H:%M"))
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
                ("INCIDENT INFORMATION", [
                    ("Issue type", "issue"),
                    ("Description", "description"),
                    ("Ownership evidence", "evidence"),
                ]),
            ]
            for heading, items in sections:
                y -= 8
                write_line(heading, True, 12)
                for label, key in items:
                    write_line(label + ": " + (data.get(key) or "Not provided"))

            y -= 10
            write_line("IMPORTANT NOTES", True, 11)
            write_line("This is a user-prepared document, not an official Epic Games form.")
            write_line("It does not verify ownership or submit a recovery request.")
            write_line("Never share passwords, authentication codes, or backup codes.")
            write_line("Submit your request through official Epic Games Support:")
            write_line(SUPPORT_URL)
            pdf.save()
            messagebox.showinfo("PDF created", "Your recovery request was saved to:\\n" + output)
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
        self.description.delete("1.0", tk.END)
        self.evidence.delete("1.0", tk.END)

    def open_support(self):
        webbrowser.open(SUPPORT_URL)


if __name__ == "__main__":
    root = tk.Tk()
    app = EpicRecoveryAssistant(root)
    root.mainloop()

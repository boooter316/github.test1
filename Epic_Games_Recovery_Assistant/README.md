# Epic Games Recovery Assistant — Native Windows Desktop Edition

**Version 5.2.0.** A locally run C++17 Windows command-dashboard application. It is an independent organizer and is not made, operated, or endorsed by Epic Games.

## Project-wide guides

For the full Windows, browser, Recovery Panel, and mobile setup instructions, see [the setup guide](../docs/SETUP_GUIDE.md). For the repository folder map and component boundaries, see [the project structure guide](../docs/PROJECT_STRUCTURE.md). The desktop launcher below builds and starts the native Windows app only; it does not start the browser server.

## Launch the desktop dashboard

1. Download and extract the complete project ZIP on Windows 10/11.
2. Open the \`Epic_Games_Recovery_Assistant\` folder.
3. Double-click **\`OPEN_PROJECT.bat\`**.
4. The setup checks for GCC and Poppler, builds both native C++17 executables, and launches the dashboard.

The main executable is \`Epic_Games_Recovery_Assistant.exe\`. The companion PDF scanner source is **\`paf_evidence_scanner.c++\`**, and its executable is \`paf_evidence_scanner.exe\`. Run \`PDF_EVIDENCE_SCANNER.bat\` and drag one or more PDF files onto it.

## Native C++ PDF evidence scanner

The PDF scanner is implemented in C++17. It uses Poppler's \`pdftotext.exe\` only as the PDF text-extraction engine; scanning, page splitting, indicator matching, and report generation are performed by the C++ program. Poppler must be installed and its \`bin\` directory must be on PATH. The setup helper can install the MSYS2 UCRT64 Poppler package when MSYS2 is present. The native scanner limits each run to 10 PDFs, 20 MiB per file, 32 MiB of extracted text per file, and 500 pages per file; OCR is not performed.

The scanner processes extracted text in memory, never prints or writes document text or matched secret values, and reports only page numbers and indicator categories. It also reports email-pattern counts, explicitly labelled Fortnite display-name/username fields, and explicitly labelled Epic Account ID fields; it never prints the matched values. The separate panel identifier scanner supports selected PDF, TXT, CSV, and JSON files, with a 10-file/20 MiB per-file cap. It caps each run at 10 files, 20 MiB per PDF, 32 MiB of extracted text per file, and 500 pages per file. It does not perform OCR; image-only pages are marked as not readable. The separate Recovery Panel includes an Account Identifier Evidence Scan tab for selected PDF/TXT/CSV/JSON files. It reports only category counts and page/line locations, and does not upload selected files. It is an evidence organizer, not proof of account ownership or Epic verification.

## Build requirements

- Windows 10 or Windows 11.
- MinGW-w64/GCC with C++17 support.
- Poppler \`pdftotext.exe\` available on PATH for PDF scanning.
- No Python runtime or Python package is required for the native PDF scanner.

Manual build: run \`build.bat\` (which calls \`setup.bat\`), then run \`PDF_EVIDENCE_SCANNER.bat\` with PDF files. GitHub Actions builds both executables and packages the Windows bundle and complete project ZIP.

## Existing project files

Existing recovery dashboard, source files, website, Recovery Panel, and folder layout are retained. The browser website still uses HTML, CSS, and JavaScript because those are browser-native technologies; the Windows dashboard and PDF scanner are C++17. Batch and PowerShell files remain build/setup launchers and are not C++ source files.

## Safety and limitations

The app does not sign in to Epic, connect to private Epic APIs, verify account ownership, submit tickets automatically, bypass verification, or guarantee recovery. Never enter passwords, verification codes, session cookies, access tokens, or full payment-card details. PDF evidence remains local; no extracted document text or secret values are uploaded or included in reports.

Official Epic resources:
- Recovery help: https://www.epicgames.com/help/c-45487929/a21414514
- Support/contact: https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US
- Linked accounts: https://www.epicgames.com/account/connections


## Project checklist

The main website and Recovery Panel include an optional on-page checklist for tracking the included Recovery Assistant, local PDF scanner, navigation tabs, and background artwork. Checklist selections are temporary in the current page and are not saved or uploaded.

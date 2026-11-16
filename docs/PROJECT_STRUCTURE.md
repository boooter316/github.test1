# Project Structure

This guide maps the current repository at the time of this documentation update. It is a component map, not a claim that every source file has been exhaustively audited.

```text
github.test1/
├── .github/
│   └── workflows/
│       ├── build-web.yml                 # Browser/panel checks and C++ web-server compile
│       └── build-windows.yml             # Native Windows builds and downloadable artifacts
├── docs/
│   ├── PROJECT_STRUCTURE.md              # This map
│   └── SETUP_GUIDE.md                    # Windows, browser, panel, and phone steps
├── Epic_Games_Recovery_Assistant/
│   ├── recovery_assistant.c++            # Native Windows recovery organizer/dashboard
│   ├── paf_evidence_scanner.c++          # Native C++ PDF text evidence scanner
│   ├── OPEN_PROJECT.bat                  # First-run native desktop build + launch
│   ├── FIRST_RUN_SETUP.bat               # Calls first_run_setup.ps1
│   ├── first_run_setup.ps1               # Checks GCC, builds, launches desktop app
│   ├── START_HERE.bat                    # Dependency helper + build + launch
│   ├── build.bat / setup.bat             # Native executable build chain
│   ├── setup_dependencies.ps1           # MSYS2/GCC/Poppler setup helper
│   ├── update_project.ps1                # Checksum-verified project updater
│   ├── README.md / SETUP_AND_USAGE.txt   # Desktop setup documentation
│   └── web/
│       ├── index.html                    # Main browser multitool UI
│       ├── server.mjs                    # Node.js browser/API server (port 8080 default)
│       ├── server.cpp                    # Separate static-only C++ web server source
│       ├── network-tools.html             # Network diagnostics UI
│       ├── network_security.js            # Browser network analyzer helpers
│       ├── network_tools.ps1               # Windows local network status/limited checks
│       ├── Dockerfile                     # Optional Node.js container image
│       └── README.md / SETUP_AND_USAGE.txt
├── recovery-panel/
│   ├── server.js                         # Separate Express administrator panel server
│   ├── package.json                      # Direct Node.js dependencies and scripts
│   ├── public/
│   │   └── index.html                    # Panel UI: Recovery Records + Fast Recovery Progress + PDF Evidence Scanner
│   ├── tests/
│   │   └── panel.integration.test.js      # Synthetic intake/review/export/session persistence tests
│   └── README.md                         # Panel setup, environment, and limitations
└── GRABBERS/
    └── README.md                         # Safety note; no credential grabber should be activated
```

## Application boundaries

### 1. Native Windows desktop app

The native dashboard and native PDF scanner are C++17 programs. The Windows setup scripts and launchers are PowerShell and batch files. The desktop setup path does not start Node.js or a browser server.

### 2. Main browser multitool

The browser multitool is an HTML/CSS/JavaScript front end served by `web/server.mjs`. Current navigation includes Dashboard, Recovery Assistant, Faze Jarvis AI, Discord Security Scanner, Pro Multi-Platform Scanner, PDF Evidence Scanner, Account Links, Account Connections, Wireshark & Ports, Account Status & Details, Telegram Connect, Fortnite Skin Check, Setup & Install, and Script Builder.

These browser scanners operate on user-selected text/files in the browser. They must not read browser credential stores, harvest account tokens, or upload secrets. The optional chat/Telegram server integrations require separate server-side configuration and are not automatically enabled by opening the page.

### 3. Separate Recovery Panel

The Recovery Panel is a different Express app. It exposes Recovery Records, Fast Recovery Progress, and PDF Evidence Scanner tabs, plus links to the network-lab pages. Manually created records remain in browser local storage; consented recovery-intake submissions are forwarded server-to-server and stored separately in an AES-256-GCM encrypted SQLite database. Administrator sessions use a separate persistent SQLite store. These are separate data paths and do not provide automatic synchronization for local records.

### 4. CI workflows

- `build-windows.yml`: Windows compiler setup, native C++ builds, smoke checks, and artifact packaging.
- `build-web.yml`: browser inline JavaScript syntax, Node server syntax, dependency install/audit, and C++ static server compilation.

CI coverage is targeted. It does not replace interactive browser testing, Windows testing on a user's own PC, a complete dependency lock, or a security review.

## Known maintenance items

- Recovery Panel direct dependencies are pinned, but a lockfile is not currently committed; transitive dependency resolution can change.
- PDF.js is loaded as the pinned 6.5.438 ES module from jsDelivr in both browser interfaces; the worker is pinned to the matching module build. Upgrading it should be a separately tested migration of the library and worker integration, not a blind URL edit.
- The Recovery Panel uses a single-instance SQLite session store. It survives process restarts but is not a distributed/multi-host session service; public deployment still requires HTTPS, network restrictions, secure backups, and an independent security review.
- The browser and native PDF scanners are manual/on-demand and enforce bounded scan limits. Image-only PDFs are not OCR-scanned.
- The browser app and Recovery Panel have separate data storage; there is no automatic cross-device synchronization.

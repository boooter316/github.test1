# Browser-based Recovery Assistant (C++17)

This folder adds a C++17 web server and a browser-based recovery-request builder.

## Privacy and scope
- Form data is processed in the browser tab only. The server serves the static page and has no form-submission endpoint or account database.
- Users can export a JSON recovery packet or use the browser Print / Save as PDF feature.
- The page does not request passwords, account PINs, full card numbers, CVV, 2FA codes, backup codes, authenticator secrets, cookies, or API keys.
- Historical IP/VPN details are optional context only, never proof of ownership. No IP spoofing, proxy rotation, account dumps, platform bypass, or restriction removal.
- It does not sign in to accounts, verify ownership, unlink services, change account details, lock accounts, submit tickets, or provide live agent chat.
- There is no hardcoded login or API key. This client-side form does not need a third-party API. Never put an API secret in browser JavaScript or a public repository.

## Run with Docker
From this directory:
    docker build -t recovery-assistant-web .
    docker run --rm -p 8080:8080 recovery-assistant-web
Open http://localhost:8080 for local testing.

## Deploy to DigitalOcean App Platform
1. Push this repository to GitHub.
2. In DigitalOcean, create an App and connect the private GitHub repository.
3. Set the source directory to Epic_Games_Recovery_Assistant/web.
4. Choose Dockerfile deployment and expose HTTP port 8080.
5. Add a custom domain and enable the platform HTTPS/TLS certificate.
6. Confirm /healthz returns "ok".

## Deploy to a DigitalOcean Droplet
1. Create a supported Linux Droplet and install Docker.
2. Clone the private repository securely, then build and run the container.
3. Keep port 8080 private to the host or firewall it from the public internet.
4. Put Nginx or Caddy in front as a reverse proxy and configure HTTPS with a valid certificate.
5. Configure the firewall to allow only SSH from trusted IPs and public HTTP/HTTPS; do not expose an unauthenticated admin panel.

The included C++ server uses plain HTTP and is intended to sit behind a trusted HTTPS ingress/reverse proxy. Do not expose it directly to the public internet without TLS termination.

## API keys and sign-in
No API key is required. A key is only needed if a specific external API integration is added. If a future server-side integration needs a secret, store it as a server environment secret, never in source code, HTML, JavaScript, GitHub commits, or PDFs. Use a proper identity provider for any future administrator login; do not hardcode credentials in the application.

## Build locally
    g++ -std=c++17 -O2 -Wall -Wextra -pedantic server.cpp -o recovery-web
    PORT=8080 ./recovery-web

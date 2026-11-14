# Browser-based Recovery Assistant (C++17)

This folder adds a C++17 web server and a browser-based recovery-request builder.

## Hosting decision
**Production hosting target: DigitalOcean App Platform.** SellHub is intended to handle storefront sales/checkout; DigitalOcean runs the C++ application. These are separate services.

The app is not deployed yet. A successful GitHub build only confirms that the Linux server compiles; it does not create a DigitalOcean app or public website.

## Privacy and scope
- Form data is processed in the browser tab only. The server serves the static page and has no form-submission endpoint or account database.
- Users can export a JSON recovery packet or use the browser Print / Save as PDF feature.
- The page does not request passwords, account PINs, full card numbers, CVV, 2FA codes, backup codes, authenticator secrets, cookies, or API keys.
- Historical IP/VPN details are optional context only, never proof of ownership. No IP spoofing, proxy rotation, account dumps, platform bypass, or restriction removal.
- It does not sign in to accounts, verify ownership, unlink services, change account details, lock accounts, submit tickets, or provide live agent chat.
- There is no hardcoded login or API key. This client-side form does not need a third-party API. Never put an API secret in browser JavaScript or a public repository.

## Deploy to DigitalOcean App Platform (recommended)
DigitalOcean App Platform can deploy a Dockerfile from a GitHub repository and run it as a web-service container.

1. Sign in to the DigitalOcean Control Panel and choose **Create App**.
2. Connect the GitHub repository `boooter316/github.test1` and select branch `main`. Authorize access to this private repository when prompted.
3. Set the source directory to `Epic_Games_Recovery_Assistant/web`.
4. Choose Dockerfile-based deployment using the Dockerfile in that directory.
5. Configure the web service to use HTTP port `8080`. The server binds to `0.0.0.0` and reads the assigned `PORT` environment variable.
6. Deploy, then test the generated DigitalOcean app URL and confirm `/healthz` returns `ok`.
7. Add a custom domain in App Platform and enable HTTPS/TLS. Keep the app behind DigitalOcean's HTTPS ingress; the container itself serves plain HTTP.
8. Enable automatic deployment from `main` only after the initial deployment has been tested.

DigitalOcean's official guides:
- [App Platform quickstart](https://docs.digitalocean.com/products/app-platform/getting-started/quickstart/)
- [Create an App](https://docs.digitalocean.com/products/app-platform/how-to/create-apps/)
- [Dockerfile build reference](https://docs.digitalocean.com/products/app-platform/reference/dockerfile/)

## SellHub storefront and paid access
SellHub is intended to be the storefront/checkout layer; it is not the application server in this architecture. The recovery assistant currently has no paid-user login, checkout verification, or purchase-entitlement endpoint.

Before connecting checkout to access control, confirm that the SellHub account/product plan provides documented, supported order webhooks or an API that can verify completed payments and refunds. Then implement server-side verification with signature validation, replay protection, and least-privilege secrets. Do not trust a browser redirect, query parameter, screenshot, or user-entered order number as proof of payment. Do not add SellHub credentials or API secrets to HTML, JavaScript, GitHub commits, or PDFs. If supported order verification cannot be confirmed, keep checkout and app access separate until a safe integration is available.

## Deploy to a DigitalOcean Droplet (alternative)
1. Create a supported Linux Droplet and install Docker.
2. Clone the private repository securely, then build and run the container.
3. Keep port 8080 private to the host or firewall it from the public internet.
4. Put Nginx or Caddy in front as a reverse proxy and configure HTTPS with a valid certificate.
5. Configure the firewall to allow only SSH from trusted IPs and public HTTP/HTTPS; do not expose an unauthenticated admin panel.

## API keys and sign-in
No API key is required for the current static form. A key is only needed if a specific external API integration is added. If a future server-side integration needs a secret, store it as a DigitalOcean encrypted environment variable or a GitHub Actions secret as appropriate, never in source code, HTML, JavaScript, GitHub commits, or PDFs. Use a proper identity provider for any future administrator or paid-user login; do not hardcode credentials in the application.

## Run with Docker locally
From this directory:
    docker build -t recovery-assistant-web .
    docker run --rm -p 8080:8080 recovery-assistant-web
Open http://localhost:8080 for local testing.

## Build locally
    g++ -std=c++17 -O2 -Wall -Wextra -pedantic server.cpp -o recovery-web
    PORT=8080 ./recovery-web

# Browser-based Recovery Assistant (C++17) — updated companion form

This folder contains a C++17 web server and a browser-based recovery-request builder.

## Hosting and SellHub decision

**DigitalOcean is not part of the hosting plan. Do not create or deploy this app on DigitalOcean.**

SellHub at https://sellhub.cx/ is being considered as the storefront/checkout provider. A storefront and an application host are different services: the C++ server needs a continuously running Linux/container host that supports Docker (or an equivalent C++ runtime). I could not verify from publicly accessible SellHub documentation that sellhub.cx runs arbitrary customer C++/Docker applications; direct access to its site returned HTTP 403 during review. Therefore this project must not claim that SellHub hosts the C++ server.

Until SellHub confirms its supported integration and hosting capabilities, treat SellHub only as a possible sales/checkout layer. Choose a separate Docker-compatible host other than DigitalOcean for the C++ web service. No hosting provider has been configured or deployed yet.

## Current deployment status

The GitHub Actions Linux build confirms only that the C++ server compiles. It does not create a public website or deploy a running service.

The container expects HTTP port `8080` (or the `PORT` environment variable). Put it behind a provider-managed HTTPS ingress or a correctly configured reverse proxy with TLS. Do not expose the plain-HTTP container directly to the public internet.

## Updated recovery and appeal form

The browser form includes current and previous Epic contact/display-name details, requested display-name/email changes for planning, email/SMS/phone/authenticator-app 2FA method and access notes, optional historical VPN/proxy context, linked-platform identifiers, and platform-specific recovery/appeal fields for Epic, Xbox, PlayStation, Steam, and Nintendo. It can export a JSON packet and use browser print-to-PDF. The PDF/JSON/text packet is a user-entered evidence summary only—not an account dump, database export, credential dump, or executable script.

## Local security scanner tabs

The browser page also includes separate Discord and Fortnite/Epic text-scanning tabs. They inspect only text or log files the user explicitly selects, plus optional pasted text, inside the browser. The Fortnite scanner reports numbered findings with source filenames, line numbers, match categories, confidence labels, and previews; email addresses, account IDs, and display names are shown in full in local results and downloadable reports. Detection covers JWT-shaped values, Epic/Fortnite bearer or eg1 token patterns, and labelled password, passphrase, access/refresh/id/auth token, API/client secret, cookie, session, CSRF, and XSRF fields. Secret values remain redacted. Confidence labels describe pattern strength only and do not establish that a credential is valid. The scanners do not open browser credential stores, sign in, test whether a credential is active, or retrieve passwords, tokens, cookies, or sessions. A pattern match is not proof that an account is compromised or that a credential works.

## Privacy and scope

- Form data is processed in the browser tab only. The server serves the static page and has no form-submission endpoint or account database.
- Users can export a JSON recovery packet or use the browser Print / Save as PDF feature. Fortnite/Epic scan findings can be downloaded as a plain-text `.txt` report or printed/saved as PDF.
- The page does not request passwords, account PINs, full card numbers, CVV, 2FA codes, backup codes, authenticator secrets, cookies, or API keys.
- Historical IP/VPN details are optional context only, never proof of ownership. No IP spoofing, proxy rotation, account dumps, platform bypass, or restriction removal.
- It does not sign in to accounts, verify ownership, unlink services, change account details, lock accounts, submit tickets, or provide live agent chat.
- There is no hardcoded login or API key. Never put an API secret in browser JavaScript or a public repository.

## SellHub integration status

The current application has no paid-user login, checkout verification, or purchase-entitlement endpoint. Publicly accessible information for the exact `sellhub.cx` service was insufficient to verify its API/webhook contract. Do not confuse `sellhub.cx` with similarly named services or use another provider's API documentation as proof of compatibility.

Before enabling paid access, obtain the exact SellHub.cx seller API/webhook documentation or confirmation from SellHub support. Then implement server-side payment verification only if the provider supports authenticated, signed purchase/refund events or a trusted order-status API. The implementation must validate signatures, reject replayed events, handle refunds/chargebacks, and keep secrets in the chosen host's private environment variables. Never trust a browser redirect, query parameter, screenshot, or user-entered order number as proof of payment. Until that integration is verified and implemented, keep checkout and app access separate.

## Deploy to a non-DigitalOcean Docker host

These are provider-neutral requirements; they are not instructions for a specific provider:

1. Choose a host that explicitly supports continuously running Docker containers or Linux C++ web services.
2. Connect the private GitHub repository `boooter316/github.test1`, branch `main`.
3. Set the app's source/build context to `Epic_Games_Recovery_Assistant/web`.
4. Select the Dockerfile in that directory.
5. Configure the web service to listen on port `8080` (or pass the provider's assigned `PORT`).
6. Configure provider-managed HTTPS/TLS and test `/healthz`; it should return `ok`.
7. Confirm logs, restart behavior, resource limits, and private environment-variable support before making the service public.

Do not enter payment details or create a paid hosting resource until the provider, price, and deployment configuration are understood.

## API keys and sign-in

No API key is required for the current static form. If a future server-side integration needs a secret, store it only as a private environment variable on the selected host or in an appropriate CI secret; never put it in source code, HTML, JavaScript, GitHub commits, or PDFs. Use a proper identity provider for any future administrator or paid-user login; do not hardcode credentials in the application.

## Run with Docker locally

From this directory:

```sh
docker build -t recovery-assistant-web .
docker run --rm -p 8080:8080 recovery-assistant-web
```

Open http://localhost:8080 for local testing.

## Build locally

```sh
g++ -std=c++17 -O2 -Wall -Wextra -pedantic server.cpp -o recovery-web
PORT=8080 ./recovery-web
```


## Legal and authorized-use notice

Use the local scanners only on files and accounts you own or are expressly authorized to assess. Follow applicable laws, platform terms, and workplace policies. Pattern matches are not credential validation, proof of ownership, or proof of compromise. Do not use scan results to access another person's account, impersonate anyone, bypass security controls, or disclose private information. Review reports before sharing and promptly revoke or rotate any exposed credentials. This independent tool is provided “as is,” without warranty; it is not legal advice and does not guarantee account recovery or security.

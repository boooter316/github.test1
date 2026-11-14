# Telegram connection & Fortnite Skin Check setup

This guide covers the Telegram Connect and Fortnite Skin Check tabs.

## 1. Telegram account connection

The app uses Telegram's official Login Widget to verify the Telegram identity that approves sign-in. It does not ask for a Telegram password, SMS code, recovery code, or session token. The server checks Telegram's HMAC signature with the private bot token. The app displays the verified identity for the current browser page session only; it does not save a Telegram session or send messages as the user.

### Create and configure the Telegram bot

1. Open the official [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot` and follow the prompts to create a bot.
3. Copy the bot token from BotFather and keep it private. If exposed, revoke/rotate it with BotFather.
4. Configure the website domain for the bot using BotFather's `/setdomain` command. Set it to the hostname where this app is served. Telegram may not accept localhost for the Login Widget.
5. Record the bot username without the leading `@`.

### Set private Docker environment variables

On the Windows 11 machine hosting Docker, add these values to the private environment file already used for Faze Jarvis:

```dotenv
TELEGRAM_BOT_USERNAME=YourBotUsername
TELEGRAM_BOT_TOKEN=YOUR_PRIVATE_BOT_TOKEN
```

Keep this file outside the repository, ZIP, and GitHub. Restrict access to your Windows account and administrators. Do not put the bot token in HTML, JavaScript, a URL, screenshot, or chat message.

Rebuild and recreate the container using the same env file:

```powershell
cd .\\Epic_Games_Recovery_Assistant\\web
docker stop faze-jarvis
docker rm faze-jarvis
docker build -t recovery-assistant-web .
docker run -d --name faze-jarvis -p 8080:8080 --env-file C:\\Secrets\\faze-jarvis.env --restart unless-stopped recovery-assistant-web
```

The same env file should also contain your existing `DEEPSEEK_API_KEY` and `CHAT_ACCESS_PASSWORD` values so Faze Jarvis remains configured.

### Connect and check status

1. Open the app at `http://localhost:8080` on the Docker host.
2. Select **Telegram Connect**.
3. Wait for the status to say the Telegram Login Widget is configured.
4. Select the Telegram sign-in button and approve the login in Telegram.
5. The app sends Telegram's signed public profile response to the same-origin server for HMAC verification.
6. A successful response shows the Telegram username or numeric ID as verified for this page session.

Status and troubleshooting:
- **Not configured** — check the spelling of `TELEGRAM_BOT_USERNAME` and `TELEGRAM_BOT_TOKEN`; recreate the container after changing environment variables.
- **Telegram status unavailable** — check `docker ps`, `docker logs --tail 100 faze-jarvis`, and that port 8080 is reachable.
- **Signature verification failed** — confirm the token belongs to the configured bot username and BotFather's domain matches the app hostname.
- **Login response expired** — select the Telegram login button again.
- **429 too many attempts** — wait one minute before trying again.

The endpoint `/api/integrations/status` reveals only whether the integration is configured and the public bot username. It never returns the bot token. The app does not persist Telegram user data or issue Telegram API calls as the user. This is identity verification only, not a full Telegram bot/chat connection.

## 2. Fortnite Skin Check

1. Open Fortnite on your console, PC, or mobile device and view your own Locker.
2. Select the **Fortnite Skin Check** tab in this app.
3. Optionally enter your Epic display name as a label.
4. Enter cosmetic/skin names you can see in your own Locker, one per line or separated by commas.
5. Select **Check my skin list** to count unique entries and duplicates.
6. Use the search box to filter the list.
7. Select **Download inventory report** to save a TXT report, or **Clear list** to clear the page.

### What this checker can and cannot do

- It organizes the cosmetic names you manually enter and creates a local inventory report.
- It does not log into Epic or Fortnite, test account/password combinations, validate cookies or tokens, or access another person's account.
- It cannot automatically read private Locker contents. Epic does not provide this app with a public locker-inventory endpoint.
- The report explicitly says that ownership was not verified. It does not estimate resale value or certify account ownership.
- Your list stays in the browser page and is not uploaded by this feature.

Never enter Epic passwords, session cookies, bearer tokens, recovery codes, or two-factor codes. Use only official Epic sign-in and support pages for account access or recovery.

## 3. Update and support

After downloading a new source ZIP, rebuild the Docker image and recreate the container with the same private env file. If the app shows an error, save the exact error text and relevant Docker log lines after removing all secrets. A successful CI build confirms the code checks pass; it does not prove your Telegram bot credentials or a real Telegram login are configured correctly.

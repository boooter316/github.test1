# Faze Jarvis — DeepSeek API setup, status, and troubleshooting

Faze Jarvis is the AI chat tab in the Recovery Assistant web app. It sends chat requests to DeepSeek through the Node.js server in this project. The browser does **not** receive the DeepSeek API key.

## 1. Create your own DeepSeek API key

1. Visit the official [DeepSeek developer platform](https://platform.deepseek.com/) and sign in or create an account.
2. Open [API Keys](https://platform.deepseek.com/api_keys).
3. Create a new API key. Copy it and store it securely; do not post it, email it, add it to screenshots, or paste it into the Faze Jarvis chat page.
4. Review the account's balance, usage, and billing settings in the official platform. API usage may incur charges. The free DeepSeek consumer chat service is separate from API usage.
5. If a key is exposed, revoke it in the platform and create a replacement.

Use only the official `deepseek.com` platform. Do not use third-party key sellers or key generators.

## 2. Create the separate app password

Create a long, unique password for the Faze Jarvis app. This is **not** your DeepSeek API key and should not be reused from another account. The app password protects access to this app's chat endpoint; it does not replace HTTPS, network access controls, or server security.

## 3. Configure the Docker host (Windows 11 example)

These steps run on the Windows computer/server that hosts Docker, not on the iPhone browser.

1. Build the web image from the project's web folder:

   ```powershell
   cd .\Epic_Games_Recovery_Assistant\web
   docker build -t recovery-assistant-web .
   ```

2. Create a private folder such as `C:\Secrets` and create `C:\Secrets\faze-jarvis.env` with these two lines (replace the example values locally):

   ```dotenv
   DEEPSEEK_API_KEY=YOUR_REAL_DEEPSEEK_KEY
   CHAT_ACCESS_PASSWORD=YOUR_SEPARATE_LONG_APP_PASSWORD
   ```

3. Restrict access to that file to your Windows user and administrators. Do not put it in the repository folder, upload it to GitHub, or include it in the ZIP you share.

4. Start the container:

   ```powershell
   docker run -d --name faze-jarvis -p 8080:8080 --env-file C:\Secrets\faze-jarvis.env --restart unless-stopped recovery-assistant-web
   ```

5. On the host PC, open `http://localhost:8080`. From another device, use the host's reachable address only on a trusted private network. Do not expose this plain-HTTP service directly to the public internet. Use HTTPS and an appropriately secured reverse proxy/private access solution before any remote deployment.

To update the image after downloading a newer source ZIP, stop and remove the old container, rebuild the image, then run the container again with the same private env file:

```powershell
docker stop faze-jarvis
docker rm faze-jarvis
docker build -t recovery-assistant-web .
docker run -d --name faze-jarvis -p 8080:8080 --env-file C:\Secrets\faze-jarvis.env --restart unless-stopped recovery-assistant-web
```

The environment file remains outside the project and is reused. Do not share it.

## 4. Connect and use Faze Jarvis

1. Open the app and select **Faze Jarvis AI**.
2. Read the setup panel and wait for the status message.
3. When it says **Ready**, enter the separate `CHAT_ACCESS_PASSWORD` in the app access password field. Do not enter `DEEPSEEK_API_KEY`.
4. Type a coding, debugging, or defensive-security question and select **Send message**. Ctrl+Enter (or Command+Enter on supported keyboards) also sends.
5. Use **Clear chat** to clear the visible conversation in the current page. The app keeps recent messages in page memory while the page remains open; reloading clears that in-memory history.

Do not paste passwords, API keys, cookies, session tokens, recovery codes, private keys, payment details, or other secrets into the chatbot. Messages are sent to DeepSeek for processing. Use only information you are authorized to share.

## 5. Understand the status messages

- **Ready** — both server settings are present. Enter the app access password and send a test message.
- **Not configured** — both server settings are missing. Add both variables to the Docker host and recreate the container.
- **Missing DEEPSEEK_API_KEY** — the provider key is not present in the server environment. Check the private env file spelling and recreate the container.
- **Missing CHAT_ACCESS_PASSWORD** — the separate app password is not present. Add it and recreate the container.
- **Server unavailable** — confirm Docker is running, the container is up (`docker ps`), and port 8080 is available. Check logs with `docker logs faze-jarvis`.
- **The app access password is incorrect (401)** — enter the exact `CHAT_ACCESS_PASSWORD` value from the host env file.
- **DeepSeek rejected the server API key** — verify the key in the DeepSeek platform, revoke/replace it if needed, update the private env file, and recreate the container.
- **Insufficient balance (402)** — check available balance and billing in the DeepSeek platform.
- **Rate limit (429)** — wait and retry; avoid repeated rapid sends.
- **DeepSeek temporarily unavailable (5xx)** — check the [DeepSeek service status](https://status.deepseek.com/) and retry later.
- **Chat is not configured (503)** — set both server variables and recreate the container.

Useful host commands:

```powershell
docker ps
docker logs --tail 100 faze-jarvis
docker restart faze-jarvis
```

The health endpoint is `http://localhost:8080/api/health`. It reports only whether the two required settings are present; it never returns their values.

## 6. Important limitations and safety

- A successful status check confirms only that both environment variables are present. It does not validate the API key or guarantee DeepSeek is reachable; a real chat request tests the upstream connection.
- GitHub CI can test the app's configuration handling and container startup, but cannot test a real paid API request without your private key and account balance.
- API calls may incur charges. Monitor usage and set any available spending controls in your provider account.
- Do not expose an unauthenticated or plain-HTTP API proxy to the public internet. Keep it private or deploy behind HTTPS, authentication, rate limits, and monitoring.
- Faze Jarvis supports ordinary coding and authorized defensive security. It does not bypass DeepSeek safety controls, authentication, platform restrictions, or access controls.

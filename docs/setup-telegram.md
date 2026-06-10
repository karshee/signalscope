# Telegram setup

Tapwire uses two separate Telegram credentials. They are independent — you can set up either without the other.

| | READ (watching channels) | WRITE (posting via automations) |
|---|---|---|
| What | MTProto user session (Telethon) | Bot API token |
| Where | Server env vars | Settings → Telegram in the app (encrypted per user) |
| Needed for | `message.received` / `outcome.event` triggers, signal parsing | `send_message`, `send_media`, `forward_message` actions, manual send |

## A) Reading — Telethon session (server-level)

1. **Get API credentials.** Log in at [my.telegram.org](https://my.telegram.org) → *API development tools* → create an app. Note the `api_id` and `api_hash`.

2. **Generate a session string.** This logs in as your user account once and prints a reusable token:

   ```bash
   pip install telethon
   python -c "
   from telethon.sync import TelegramClient
   from telethon.sessions import StringSession
   c = TelegramClient(StringSession(), API_ID, 'API_HASH')
   c.start()
   print(c.session.save())"
   ```

   Replace `API_ID` (int) and `API_HASH` (string). You'll be prompted for your phone number and the login code Telegram sends you.

3. **Set the env vars** (`.env` for docker compose, or the shell for bare metal):

   ```bash
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
   TELEGRAM_SESSION=1BVtsOK4Bu...   # the long string from step 2
   ```

4. **Restart and verify.** Restart the backend, then Settings → Telegram → *Test Connection* (`POST /api/settings/telegram/test`). The watcher polls every channel you add, every `WATCHER_POLL_INTERVAL` seconds (default 5).

The session belongs to **your user account** — it can read any channel that account is a member of. Treat the session string like a password.

## B) Writing — your own bot (per user, in the app)

1. **Create a bot.** Message [@BotFather](https://t.me/BotFather) → `/newbot` → pick a name and username. BotFather replies with a token like `1234567890:AAExampleTokenString`.

2. **Paste the token** into Settings → Telegram → Bot token, and save. It is stored Fernet-encrypted in your user settings — the server never logs it.

3. **Add the bot as admin** to every channel you want it to post in: channel → Administrators → Add Admin → search your bot's username → grant *Post Messages*. For `forward_message` rules the bot must be admin in the **source** channel too (Bot API `copyMessage` reads from it).

4. **Click Verify Bot** (`POST /api/settings/telegram/bot/test`) — this calls Bot API `getMe` and shows the connected bot username.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Settings test says "TELEGRAM_API_ID / API_HASH / SESSION not configured" | READ env vars missing | Set all three and restart the backend |
| "Session invalid or expired" | Session revoked (logged out, password change) | Regenerate the session string (step A2) |
| Watcher running but no messages appear | Account not a member of the channel, or channel inactive in Tapwire | Join the channel with the session's account; check the channel is active |
| Verify Bot: "No bot token configured" | Token never saved | Paste the BotFather token in Settings and save first |
| Verify Bot: "Unauthorized" | Token wrong/revoked | Re-copy from BotFather (`/token` regenerates) |
| Action fails: `403 Forbidden: bot is not a member` / `400 chat not found` | Bot isn't admin in the target channel | Add the bot as admin with Post Messages |
| `forward_message` fails but `send_message` works | Bot is admin in target but not source | Add the bot as admin in the source channel too |
| Send works once then rule disabled | Rate limit tripped (possible loop) | Check the execution log; see loop protection in [rule-engine.md](rule-engine.md); re-enable the rule |
| Posts appear but channel id-based targeting fails | Channel stored without `telegram_id` or username | Re-add the channel, or set its @username |

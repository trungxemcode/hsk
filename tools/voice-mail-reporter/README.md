# HSK Voice — Email Progress Reporter

Standalone Google Apps Script for sending **HSK voice progress emails every 10 minutes** without changing the production TTS/ASR Apps Script OAuth scopes.

## First-time activation (owner only)

1. Open the dedicated private Apps Script project:
   https://script.google.com/d/1xAOtgYXVlPYHLNqGxaXWsiDZT9HLNd5ixiDzGa0ROETaKX7xBsUin_rx/edit
2. With the Google account that owns the HSK spreadsheet, select `setupHSKMailReports` from the function dropdown and press **Run**.
3. Approve Google permissions for Sheets, creating the scheduled trigger, and sending email.
4. The first email is sent during permitted hours, and the 10-minute installable time trigger runs under the account that authorized it.

To verify: `Voice_Control!B33` = `ENABLED`, `B34` = last-sent timestamp, `B35` = last send status. All reports go to `Session.getEffectiveUser().getEmail()` (the authorized script owner). No passwords or API keys.

## Operations

- Timing: every 10 minutes, **08:00–22:00 Asia/Ho_Chi_Minh**.
- Daily cap: 84 emails and quota-low safeguard for personal Google Apps Script account limits.
- Duplicate guard: 9 minutes per successful send, plus ScriptLock.
- Stop: set `Voice_Control!B33` to `DISABLED`; optionally run `stopHSKMailReports` in this dedicated project to delete its trigger.
- The worker always reads the latest `Tien_do_tu_vung`, `Voice_Control`, `Voice_Vocab_Batches`, and `Voice_Auto_Clips` sheets.
- This code does **not** create TTS, change voice status, or access voice API credentials. Existing TTS/ASR triggers stay untouched.
- Local tests: `node --test test-reporter.cjs`.

Google authorization is a one-time user action. Uploading this script via clasp alone does not create or authorize the trigger.

# Cityline Ultra-Fast Monitor & Auto Click

Chrome extension to monitor Cityline event pages and auto-click the **「前往購票」** button as soon as it appears.

## Features

- Auto-detects and clicks `前往購票` immediately
- Supports spaced/full-width text variants like `前　往　購　票`
- Live monitor panel on page:
  - 監控時間
  - 狀態
  - 成功後反應時間
- Works on Cityline 2026 event pages:
  - `*.cityline.com/tc/2026/*`
  - `*.cityline.com.hk/tc/2026/*`
- Test mode (10-second countdown + injected test button)

## Project Structure

- `manifest.json` – Chrome extension manifest (MV3)
- `content.js` – core monitor/click logic
- `popup.html` – popup UI
- `popup.js` – popup behavior (toggle test mode, open page)
- `background.js` – install lifecycle log

## Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `Ticket_Bot`
5. Pin extension to toolbar (optional)

## How to Use

1. Open a Cityline event page under `/tc/2026/`
2. Extension content script starts monitoring automatically
3. When `前往購票` appears, it auto-clicks immediately

## Test Mode

You can test without waiting for real button timing.

### Method A: Query parameter

Open any supported page with:

- `?testMode=1` (or `&testMode=1` if query already exists)

Example:

`https://cultural.cityline.com.hk/tc/2026/wheneastmeetswest.html?testMode=1`

### Method B: Popup toggle

1. Open extension popup
2. Turn **測試模式 ON**
3. Click **開啟指定活動頁**

Behavior in test mode:

- Counts down 10 seconds
- Injects a test button `前　往　購　票` near the intro section
- Monitor should detect and click it immediately

## Notes

- Auto-click is disabled on `priority.cityline.com` to avoid click loops.
- This project is for automation testing / personal workflow usage.
- Website structure changes may require selector/logic updates.
<img width="1440" height="811" alt="image" src="https://github.com/user-attachments/assets/01c929f4-9eca-4df0-908f-0142dc6d8a58" />


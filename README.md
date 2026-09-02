# Bilibili Remote Control (PeerJS + Cloudflare Worker Version)

> Control Bilibili videos from your mobile device with zero setup! PeerJS WebRTC P2P direct connection with Cloudflare Worker static remote page.

![demo](misc/demo.png)

## Architecture

```text
Extension (Service Worker + Offscreen Doc) ──WSS──→ PeerJS Cloud (Handshake only)
Mobile Remote Worker Page ──────────────────WSS──┘
        ↓
Computer ⇆ Mobile WebRTC DataChannel (Direct P2P control & video status, zero server dependency)
```

In Manifest V3, WebRTC connections are managed via an **Offscreen Document** (`offscreen.html`), while `background.js` handles life-cycle keepalive and message routing between Bilibili pages, popup, and offscreen context.

## Features

- **PeerJS WebRTC Direct Connection**: Direct WebRTC DataChannel between phone and computer for low latency and zero privacy concerns.
- **Manifest V3 Compliant**: Uses Chrome Extension Manifest V3 with Offscreen documents for WebRTC handling and background service worker.
- **On-Page QR Code & Floating Action Button**: Automatically displays a QR code overlay on Bilibili video & Bangumi pages (`/video/*`, `/bangumi/play/*`) alongside a floating action button (FAB) for easy toggling.
- **Zero-Credential Setup**: Deploy mobile remote page to Cloudflare Workers via temporary account claiming URL (`wrangler deploy --temporary`).
- **Smart Deployment CI/CD**: Automatic Cloudflare Worker health check and diff detection to avoid unnecessary redeployments.
- **Automated CRX/ZIP Release Packaging**: GitHub Action workflow automatically builds `.crx` and `.zip` extension artifacts on release publication.
- **Full Player & Page Controls**: Play/Pause, Seek slider (with smooth drag protection), Speed, Volume, ±10s Skip, Previous/Next, Fullscreen, and D-Pad page element navigation.

## Quick Start

1. **Fork this repository**.
2. Go to the Actions tab, run the **Deploy Worker & Update Extension Config** workflow (or trigger by pushing a commit to `main`/`master`).
3. Load the `chrome_extension/` directory as an unpacked extension in Chrome (`chrome://extensions`).
4. Click the Extension popup icon:
   - Click the **Cloudflare Claim Link** (valid for 60 minutes) to claim the Worker under your Cloudflare account.
   - Click **Verify and Save** (验证并保存认领状态).
5. Open any Bilibili video or Bangumi page (`bilibili.com/video/...` or `bilibili.com/bangumi/play/...`). Scan the injected QR code (or the popup QR code) with your mobile phone to begin controlling!

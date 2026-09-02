# Bilibili Remote Control (Trystero Serverless Version)

> Control Bilibili videos from your mobile device with zero setup and zero server deployment! Serverless WebRTC P2P direct connection via Trystero over public MQTT signaling and jsDelivr static shell loader.

![demo](misc/demo.png)

## Architecture

```text
Extension (UI & Logic) ── WebRTC Data Channel (Commands + UI Package Delivery) ── Mobile Shell Page (jsDelivr)
                                          │
                         Signaling via Trystero (Public MQTT Broker)
```

In Manifest V3, WebRTC connections are managed via an **Offscreen Document** (`offscreen.html`), while `background.js` handles life-cycle keepalive and message routing between Bilibili pages, popup, and offscreen context.

## Features

- **Trystero WebRTC Direct Connection**: Uses Trystero with public MQTT broker signaling. Direct WebRTC DataChannel between phone and computer for low latency and zero privacy concerns.
- **Zero Server & Zero Deployment**: No Cloudflare Workers, no server setup, no worker claiming. The mobile shell page is hosted statically (e.g., via jsDelivr).
- **Dynamic UI Package Delivery**: The mobile UI (`ui.html`) is packaged inside the extension and pushed directly to the mobile shell upon connection. The mobile remote UI always stays in sync with the extension version.
- **Manifest V3 & CSP Compliant**: Uses Chrome Extension Manifest V3 with Offscreen document for WebRTC handling with bundled Trystero dependencies.
- **On-Page QR Code & Floating Action Button**: Automatically displays a QR code overlay on Bilibili video & Bangumi pages (`/video/*`, `/bangumi/play/*`) alongside a floating action button (FAB) for easy toggling.
- **Automated CRX/ZIP Release Packaging**: GitHub Action workflow automatically builds `.crx` and `.zip` extension artifacts on release publication.
- **Full Player & Page Controls**: Play/Pause, Seek slider (with smooth drag protection), Speed, Volume, ±10s Skip, Previous/Next, Fullscreen, and D-Pad page element navigation.

## Quick Start

1. Download or clone this repository.
2. Load the `chrome_extension/` directory as an unpacked extension in Chrome (`chrome://extensions`).
3. Open any Bilibili video or Bangumi page (`bilibili.com/video/...` or `bilibili.com/bangumi/play/...`).
4. Scan the injected QR code on the page (or from the extension popup) with your mobile phone to start controlling!

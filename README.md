# Bilibili Remote Control (PeerJS + Cloudflare Worker Version)

> Control Bilibili videos from your mobile device with zero setup! PeerJS WebRTC P2P direct connection with Cloudflare Worker static remote page.

![demo](misc/demo.png)

## Architecture

```text
Computer Extension SW ──WSS──→ PeerJS Cloud (Handshake only)
Mobile Remote Worker Page ──WSS──┘
        ↓
Computer ⇆ Mobile WebRTC DataChannel (Direct P2P control & video status, zero server dependency)
```

## Features

- **PeerJS WebRTC Direct Connection**: Direct WebRTC DataChannel between phone and computer for low latency and zero privacy concerns.
- **Zero-Credential Setup**: Deploy mobile remote page to Cloudflare Workers via temporary account claiming URL (`wrangler deploy --temporary`).
- **Zero Local Server Needed**: No Python scripts, no Docker, no fake `system.network` permissions needed.
- **Full Player Controls**: Play/Pause, Seek slider (with smooth drag protection), Speed, Volume, Previous/Next, Fullscreen, and D-Pad navigation.

## Quick Start (For Forkers)

1. **Fork this repository**.
2. Go to Actions tab, run the **Deploy Worker & Update Extension Config** workflow (or trigger by pushing a commit).
3. Open the Extension popup:
   - Click the **Cloudflare Claim Link** (valid for 60 minutes) to link the Worker to your Cloudflare account.
   - Click **Verify and Save**.
4. Load `chrome_extension/` directory as an unpacked extension in Chrome (`chrome://extensions`).
5. Open any Bilibili video page (`bilibili.com/video/...`), scan the generated QR code with your phone!

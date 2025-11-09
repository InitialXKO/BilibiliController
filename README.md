# Bilibili Remote Control (WebRTC Version)

> Control Bilibili videos from your phone with zero setup. Just scan a QR code!

![demo](misc/demo.png)

## How It Works

This extension turns your phone into a remote control for the Bilibili video player running on your computer. It uses an innovative **WebRTC + QR Code** architecture to create a direct, peer-to-peer connection between your phone and your browser, eliminating the need for a separate server, firewall configurations, or manual IP address entry.

The key features of this new design are:
- **Zero-Configuration Setup**: No more Python servers or Docker containers. The extension is entirely self-contained.
- **Micro Signaling Server**: A temporary, lightweight signaling server runs inside the extension's service worker to facilitate the initial WebRTC handshake.
- **Scan-and-Go**: Simply click the extension icon, scan the generated QR code with your phone, and the remote is instantly connected.

## Installation and Usage

1.  **Load the Chrome Extension:**
    -   Open Chrome and navigate to `chrome://extensions`.
    -   Enable "Developer mode".
    -   Click "Load unpacked" and select the `chrome_extension/` directory.

2.  **Connect Your Phone:**
    -   Navigate to a Bilibili video page.
    -   Click the Bilibili Remote Control extension icon in your toolbar.
    -   A popup with a QR code will appear automatically.

3.  **Connect Your Phone:**
    -   Scan the QR code with your phone's camera.
    -   A web-based remote control will open in your phone's browser, instantly connected to the video player.

Now you can control the video from your phone!

import { getConfig } from './config.js';

let connectionState = 'disconnected';
let peerId = null;
let roomSecret = null;

// Ensure offscreen document is created
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['BLOBS', 'WEB_RTC'],
      justification: 'Host PeerJS WebRTC DataChannel connection for Bilibili remote control.'
    });
  }
}

// Service worker heartbeat keepalive
setInterval(() => {
  ensureOffscreenDocument().catch(() => {});
}, 1000);

async function checkBilibiliTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const url = tabs[0].url;
        resolve(url.includes("bilibili.com/video/") || url.includes("bilibili.com/bangumi/play/"));
      } else {
        resolve(false);
      }
    });
  });
}

function buildQrUrl(remotePageUrl, currentPeerId, secret) {
  if (!remotePageUrl || remotePageUrl === '__REMOTE_PAGE_URL__') return null;
  if (!currentPeerId || !secret) return null;
  return `${remotePageUrl}?peerId=${encodeURIComponent(currentPeerId)}&key=${encodeURIComponent(secret)}`;
}

async function notifyTabsAndPopup() {
  const currentConfig = await getConfig();
  const activeSecret = roomSecret || currentConfig.roomSecret;
  const qrUrl = buildQrUrl(currentConfig.remotePageUrl, peerId, activeSecret);

  if (connectionState === 'connected') {
    chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'connection-successful' }));
    });
  } else if (qrUrl) {
    chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'show-qr-code', url: qrUrl }));
    });
  }
}

// Handle incoming messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'offscreen-peer-status') {
    connectionState = message.connectionState;
    if (message.peerId) peerId = message.peerId;
    if (message.roomSecret) roomSecret = message.roomSecret;
    notifyTabsAndPopup();
  } else if (message.type === 'connection-successful') {
    connectionState = 'connected';
    chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'connection-successful' }));
    });
  } else if (message.type === 'forward-to-bilibili') {
    chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message.payload));
    });
  } else if (message.type === 'get-status') {
    (async () => {
      const isBilibili = await checkBilibiliTab();
      const currentConfig = await getConfig();
      if (!peerId && currentConfig.peerId) {
        peerId = currentConfig.peerId;
      }
      const activeSecret = roomSecret || currentConfig.roomSecret;
      const qrUrl = buildQrUrl(currentConfig.remotePageUrl, peerId, activeSecret);
      sendResponse({
        connectionState,
        isBilibili,
        peerId,
        config: currentConfig,
        qrUrl
      });
    })();
    return true;
  } else if (message.type === "bilibili_playing_status") {
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'send-to-mobile',
      payload: message
    });
  } else if (message.type === "reinit-peer") {
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'reinit-peer'
    }, (res) => {
      sendResponse(res);
    });
    return true;
  }
});

// Initialize offscreen document when service worker starts
ensureOffscreenDocument();

// Ensure connection when a Bilibili tab is completed loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.includes("bilibili.com/video/") || tab.url.includes("bilibili.com/bangumi/play/"))) {
    ensureOffscreenDocument();
    notifyTabsAndPopup();
  }
});

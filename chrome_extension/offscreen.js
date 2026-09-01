import { joinRoom } from './trystero-mqtt.min.js';
import { getConfig, updateConfig } from './config.js';

let room = null;
let peerId = null;
let connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected'
let uiHtmlContent = null;
let sendUiAction = null;
let sendStatusAction = null;
let connectedPeersCount = 0;

async function fetchUIHtml() {
  if (uiHtmlContent) return uiHtmlContent;
  try {
    const res = await fetch(chrome.runtime.getURL('ui.html'));
    uiHtmlContent = await res.text();
  } catch (e) {
    console.error('Failed to fetch ui.html:', e);
  }
  return uiHtmlContent;
}

async function initPeer(forceReinit = false) {
  if (forceReinit && room) {
    try {
      room.leave();
    } catch (e) {
      console.error('Error leaving room on reinit:', e);
    }
    room = null;
    connectedPeersCount = 0;
    connectionState = 'disconnected';
  }

  const currentConfig = await getConfig();
  if (currentConfig.peerId) {
    peerId = currentConfig.peerId;
  } else {
    peerId = 'bilibili-remote-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    await updateConfig({ peerId });
  }

  if (room) {
    return;
  }

  connectionState = 'connecting';
  notifyBackgroundState();

  const trysteroConfig = {
    appId: 'bilibili-remote-control',
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  room = joinRoom(trysteroConfig, peerId);

  const [sendUi, getUi] = room.makeAction('ui_package');
  const [sendStatus, getStatus] = room.makeAction('bilibili_status');
  const [sendCmd, getCmd] = room.makeAction('bilibili_cmd');

  sendUiAction = sendUi;
  sendStatusAction = sendStatus;

  getCmd((data, peerId) => {
    console.log('Offscreen received command from mobile remote:', data);
    chrome.runtime.sendMessage({ type: 'forward-to-bilibili', payload: data });
  });

  room.onPeerJoin(async (peer) => {
    console.log('Mobile peer joined Trystero room:', peer);
    connectedPeersCount++;
    connectionState = 'connected';
    notifyBackgroundState();
    chrome.runtime.sendMessage({ type: 'connection-successful' });

    // Send UI package to newly joined peer
    const html = await fetchUIHtml();
    if (html && sendUiAction) {
      sendUiAction({ type: 'ui_html', html }, peer);
    }
  });

  room.onPeerLeave((peer) => {
    console.log('Mobile peer left Trystero room:', peer);
    connectedPeersCount = Math.max(0, connectedPeersCount - 1);
    if (connectedPeersCount === 0) {
      connectionState = 'connecting';
      notifyBackgroundState();
    }
  });

  console.log('Trystero room initialized with roomId:', peerId);
}

function notifyBackgroundState() {
  chrome.runtime.sendMessage({
    type: 'offscreen-peer-status',
    connectionState,
    peerId
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.type === 'init-peer' || message.type === 'reinit-peer') {
    const forceReinit = message.type === 'reinit-peer';
    initPeer(forceReinit).then(() => sendResponse({ success: true, connectionState, peerId }));
    return true;
  } else if (message.type === 'send-to-mobile') {
    if (sendStatusAction && connectionState === 'connected') {
      const payload = message.payload && message.payload.data !== undefined ? message.payload.data : message.payload;
      sendStatusAction(payload);
    }
  } else if (message.type === 'get-peer-status') {
    sendResponse({ connectionState, peerId });
  }
});

initPeer();

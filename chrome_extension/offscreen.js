import { getConfig, updateConfig } from './config.js';

let peer = null;
let activeConnection = null;
let peerId = null;
let connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected'

async function initPeer() {
  const currentConfig = await getConfig();
  if (currentConfig.peerId) {
    peerId = currentConfig.peerId;
  } else {
    peerId = 'bilibili-remote-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    await updateConfig({ peerId });
  }

  if (peer && !peer.destroyed) {
    return;
  }

  connectionState = 'connecting';
  notifyBackgroundState();

  peer = new window.Peer(peerId);

  peer.on('open', (id) => {
    console.log('Offscreen PeerJS server connected with ID:', id);
    connectionState = 'connecting';
    notifyBackgroundState();
  });

  peer.on('connection', (conn) => {
    console.log('Offscreen incoming PeerJS connection from mobile remote');
    activeConnection = conn;

    conn.on('open', () => {
      console.log('Offscreen PeerJS DataConnection opened');
      connectionState = 'connected';
      notifyBackgroundState();
      chrome.runtime.sendMessage({ type: 'connection-successful' });
    });

    conn.on('data', (data) => {
      let message;
      try {
        message = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        message = data;
      }
      chrome.runtime.sendMessage({ type: 'forward-to-bilibili', payload: message });
    });

    conn.on('close', () => {
      console.log('Offscreen PeerJS DataConnection closed');
      connectionState = 'connecting';
      activeConnection = null;
      notifyBackgroundState();
    });

    conn.on('error', (err) => {
      console.error('Offscreen PeerJS DataConnection error:', err);
      connectionState = 'connecting';
      activeConnection = null;
      notifyBackgroundState();
    });
  });

  peer.on('disconnected', () => {
    console.log('Offscreen PeerJS disconnected from signaling server, reconnecting...');
    if (peer && !peer.destroyed) {
      peer.reconnect();
    }
  });

  peer.on('error', (err) => {
    console.error('Offscreen PeerJS peer error:', err);
  });
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

  if (message.type === 'init-peer') {
    initPeer().then(() => sendResponse({ success: true, connectionState, peerId }));
    return true;
  } else if (message.type === 'send-to-mobile') {
    if (activeConnection && activeConnection.open) {
      activeConnection.send(JSON.stringify(message.payload));
    }
  } else if (message.type === 'get-peer-status') {
    sendResponse({ connectionState, peerId });
  }
});

initPeer();

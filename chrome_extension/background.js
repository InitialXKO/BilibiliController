// Globals for WebRTC
let peerConnection;
let dataChannel;
let localOffer;
let connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected'

// --- MicroSignalingServer ---
const PORT = 8989; // An arbitrary port for our simulated server

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === 'localhost' && url.port == PORT) {
    if (url.pathname.startsWith('/mobile.html')) {
      event.respondWith(serveMobilePage());
    } else if (url.pathname === '/offer' && event.request.method === 'GET') {
      event.respondWith(serveOffer());
    } else if (url.pathname === '/answer' && event.request.method === 'POST') {
      event.respondWith(handleAnswer(event.request));
    }
  }
});

async function serveMobilePage() {
  const response = await fetch('mobile.html');
  const html = await response.text();
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

function serveOffer() {
  if (!localOffer) {
    return new Response('Offer not ready', { status: 503 });
  }
  return new Response(JSON.stringify(localOffer), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAnswer(request) {
  try {
    const answer = await request.json();
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('WebRTC connection established!');
      connectionState = 'connected';
      // Inform content script of successful connection
      chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'connection-successful' }));
      });
    }
    return new Response(JSON.stringify({ status: 'connected' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to handle answer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// --- Message Handling ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-status') {
    checkBilibiliTab().then(isBilibili => {
      sendResponse({
        connectionState,
        isBilibili,
        qrUrl: connectionState === 'connecting' && localOffer ? `http://${localIp}:${PORT}/mobile.html` : null
      });
    });
    return true;
  } else if (message.type === "bilibili_playing_status" && dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify(message));
  }
});

let localIp;

async function startWebRTCConnection() {
  if (connectionState !== 'disconnected') return;

  connectionState = 'connecting';
  localIp = await getLocalIpAddress();
  if (!localIp) {
    throw new Error('Could not determine local IP address.');
  }

  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  dataChannel = peerConnection.createDataChannel('bilibili-remote');
  setupDataChannelListeners();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate === null) {
      localOffer = peerConnection.localDescription;
      const qrUrl = `http://${localIp}:${PORT}/mobile.html`;
      // Send QR code url to content script
      chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'show-qr-code', url: qrUrl }));
      });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
}

function setupDataChannelListeners() {
  dataChannel.onopen = () => {
    console.log('Data channel is open');
    connectionState = 'connected';
    // Inform content script of successful connection
    chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'connection-successful' }));
    });
  };
  dataChannel.onclose = () => {
    console.log('Data channel is closed');
    connectionState = 'disconnected';
    peerConnection = null;
    localOffer = null;
  };
  dataChannel.onerror = (error) => {
    console.error('Data channel error:', error);
    connectionState = 'disconnected';
  };

  dataChannel.onmessage = (event) => {
    const message = JSON.parse(event.data);
    chrome.tabs.query({ url: ["*://*.bilibili.com/video/*", "*://*.bilibili.com/bangumi/play/*"] }, (tabs) => {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message));
    });
  };
}

function getLocalIpAddress() {
  return new Promise((resolve, reject) => {
    chrome.system.network.getNetworkInterfaces((interfaces) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      for (const iface of interfaces) {
        if (!iface.address.startsWith('127.') && iface.prefixLength === 24) {
          resolve(iface.address);
          return;
        }
      }
      const candidate = interfaces.find(iface => iface.address.includes('.'));
      if (candidate) {
        resolve(candidate.address);
      } else {
        reject(new Error('No suitable network interface found.'));
      }
    });
  });
}

function checkBilibiliTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const url = tabs[0].url;
        resolve(url.includes("bilibili.com/video/") || url.includes("bilibili.com/bangumi/play/"));
      } else {
        resolve(false);
      }
    });
  });
}

// Start the connection process when a Bilibili tab is active
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && (tab.url.includes("bilibili.com/video/") || tab.url.includes("bilibili.com/bangumi/play/"))) {
    startWebRTCConnection();
  }
});
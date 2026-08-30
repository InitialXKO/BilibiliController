// PeerJS Client Globals
let peer = null;
let conn = null;
let isDraggingSlider = false;

function getPeerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('peerId');
}

function connectPeerJS() {
  const targetPeerId = getPeerIdFromUrl();
  if (!targetPeerId) {
    console.error('No peerId found in URL parameters.');
    document.getElementById("progressLabel").innerText = "Error: Missing peerId in URL";
    return;
  }

  peer = new Peer();

  peer.on('open', (id) => {
    console.log('Mobile PeerJS initialized with ID:', id);
    console.log('Connecting to extension peer:', targetPeerId);
    conn = peer.connect(targetPeerId);
    setupDataConnectionListeners();
  });

  peer.on('error', (err) => {
    console.error('Mobile PeerJS error:', err);
  });
}

function setupDataConnectionListeners() {
  if (!conn) return;

  conn.on('open', () => {
    console.log('PeerJS DataConnection is open');
    document.getElementById("progressLabel").innerText = "Connected! Requesting status...";
  });

  conn.on('close', () => {
    console.log('PeerJS DataConnection is closed');
    document.getElementById("progressLabel").innerText = "Disconnected";
    // Attempt auto reconnect after 3 seconds
    setTimeout(connectPeerJS, 3000);
  });

  conn.on('error', (error) => {
    console.error('PeerJS DataConnection error:', error);
  });

  conn.on('data', (data) => {
    let message;
    try {
      message = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      console.error('Failed to parse message:', e);
      return;
    }

    if (message.type === "bilibili_playing_status") {
      updateUI(typeof message.data === 'string' ? JSON.parse(message.data) : message.data);
    }
  });

  // Request status periodically
  setInterval(() => {
    if (conn && conn.open) {
      conn.send({ type: "bilibili_playing_status_request" });
    }
  }, 500);
}

function updateUI(status) {
  if (!status) return;
  const isPlaying = status.paused === false;
  document.getElementById("pausePlayBtn").innerText = isPlaying ? "⏸ Pause" : "▶ Play";

  const progressSlider = document.getElementById("progressSlider");
  if (!isDraggingSlider && status.duration) {
    progressSlider.max = status.duration;
    progressSlider.value = status.currentTime;
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === undefined) return "0:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.round(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  document.getElementById("progressLabel").innerText = `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`;

  if (status.playbackRate) {
    document.getElementById("playbackRate").value = status.playbackRate;
  }
  if (status.volume !== undefined) {
    document.getElementById("volumeSlider").value = Math.round(status.volume * 100);
    document.getElementById("volumeLabel").innerText = `${Math.round(status.volume * 100)}%`;
  }
}

// --- Event Listeners for Controls ---
function sendCommand(command) {
  if (conn && conn.open) {
    conn.send(command);
  } else {
    console.warn('PeerJS connection not open, cannot send command.');
  }
}

document.getElementById("prevBtn").addEventListener("click", () => sendCommand({ type: "bilibili_previous" }));
document.getElementById("nextBtn").addEventListener("click", () => sendCommand({ type: "bilibili_next" }));
document.getElementById("pausePlayBtn").addEventListener("click", () => sendCommand({ type: "bilibili_pause_and_play" }));
document.getElementById("fullscreenBtn").addEventListener("click", () => sendCommand({ type: "bilibili_fullscreen" }));

const progressSlider = document.getElementById("progressSlider");

// Fix slider dragging bug: flag when user starts dragging and send seek on release
progressSlider.addEventListener("pointerdown", () => { isDraggingSlider = true; });
progressSlider.addEventListener("touchstart", () => { isDraggingSlider = true; });

progressSlider.addEventListener("pointerup", (event) => {
  isDraggingSlider = false;
  const newTime = event.target.value;
  sendCommand({ type: "bilibili_seek", data: JSON.stringify({ time: parseFloat(newTime) }) });
});
progressSlider.addEventListener("touchend", (event) => {
  isDraggingSlider = false;
  const newTime = event.target.value;
  sendCommand({ type: "bilibili_seek", data: JSON.stringify({ time: parseFloat(newTime) }) });
});
progressSlider.addEventListener("change", (event) => {
  isDraggingSlider = false;
  const newTime = event.target.value;
  sendCommand({ type: "bilibili_seek", data: JSON.stringify({ time: parseFloat(newTime) }) });
});

document.getElementById("rewindBtn").addEventListener("click", () => {
    const newTime = Math.max(0, parseFloat(progressSlider.value) - 10);
    sendCommand({ type: "bilibili_seek", data: JSON.stringify({ time: newTime }) });
});

document.getElementById("forwardBtn").addEventListener("click", () => {
    const newTime = Math.min(parseFloat(progressSlider.max || 100), parseFloat(progressSlider.value) + 10);
    sendCommand({ type: "bilibili_seek", data: JSON.stringify({ time: newTime }) });
});

document.getElementById("playbackRate").addEventListener("change", (event) => {
  const rate = parseFloat(event.target.value);
  sendCommand({ type: "update_video_status", data: JSON.stringify({ playbackRate: rate }) });
});

document.getElementById("volumeSlider").addEventListener("input", (event) => {
  const volume = parseFloat(event.target.value) / 100;
  document.getElementById("volumeLabel").innerText = `${Math.round(volume * 100)}%`;
  sendCommand({ type: "update_video_status", data: JSON.stringify({ volume: volume }) });
});

document.querySelectorAll(".remote-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    let command = "ArrowDown"; // Default
    switch (btn.id) {
      case "btn-up": command = "ArrowUp"; break;
      case "btn-down": command = "ArrowDown"; break;
      case "btn-left": command = "ArrowLeft"; break;
      case "btn-right": command = "ArrowRight"; break;
      case "btn-enter": command = "Enter"; break;
    }
    sendCommand({ type: "remote_control_key", data: command });
  });
});

// Sync mobile.js to chrome_extension/mobile.js for consistency
connectPeerJS();

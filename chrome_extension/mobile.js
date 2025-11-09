// WebRTC Globals
let peerConnection;
let dataChannel;

async function connectWebRTC() {
  // 1. Create RTCPeerConnection
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // Handle incoming data channel
  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannelListeners();
  };

  // 2. Fetch Offer from the "Signaling Server"
  const response = await fetch('/offer');
  const offer = await response.json();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  // 3. Create Answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // 4. Send Answer to the "Signaling Server"
  await fetch('/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answer)
  });

  console.log('WebRTC connection initiated.');
}

function setupDataChannelListeners() {
  dataChannel.onopen = () => console.log('Data channel is open');
  dataChannel.onclose = () => console.log('Data channel is closed');
  dataChannel.onerror = (error) => console.error('Data channel error:', error);
  dataChannel.onmessage = (event) => {
    console.log("Received from extension:", event.data);
    const message = JSON.parse(event.data);
    if (message.type === "bilibili_playing_status") {
      updateUI(JSON.parse(message.data));
    }
  };
  // Initial status request
  setInterval(() => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({type: "bilibili_playing_status_request"}));
    }
  }, 500);
}

function updateUI(status) {
  const isPlaying = status.paused === false;
  document.getElementById("pausePlayBtn").innerText = isPlaying ? "Pause" : "Play";
  document.getElementById("progressSlider").max = status.duration;
  document.getElementById("progressSlider").value = status.currentTime;
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.round(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  document.getElementById("progressLabel").innerText = `${formatTime(status.currentTime)}/${formatTime(status.duration)}`;
  document.getElementById("playbackRate").value = status.playbackRate;
  document.getElementById("volumeSlider").value = status.volume * 100;
  document.getElementById("volumeLabel").innerText = `${Math.round(status.volume * 100)}%`;
}


// --- Event Listeners for Controls ---
function sendCommand(command) {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify(command));
  } else {
    console.warn('Data channel not open, cannot send command.');
  }
}

document.getElementById("prevBtn").addEventListener("click", () => sendCommand({ type: "bilibili_previous" }));
document.getElementById("nextBtn").addEventListener("click", () => sendCommand({ type: "bilibili_next" }));
document.getElementById("pausePlayBtn").addEventListener("click", () => sendCommand({ type: "bilibili_pause_and_play" }));
document.getElementById("fullscreenBtn").addEventListener("click", () => sendCommand({ type: "bilibili_fullscreen" }));

document.getElementById("progressSlider").addEventListener("input", (event) => {
  const newTime = event.target.value;
  sendCommand({ type: "bilibili_seek", data: JSON.stringify({time: parseFloat(newTime)}) });
});

document.getElementById("rewindBtn").addEventListener("click", () => {
    const progressSlider = document.getElementById("progressSlider");
    const newTime = Math.max(0, progressSlider.value - 10);
    sendCommand({ type: "bilibili_seek", data: JSON.stringify({time: newTime}) });
});

document.getElementById("forwardBtn").addEventListener("click", () => {
    const progressSlider = document.getElementById("progressSlider");
    const newTime = Math.min(progressSlider.max, parseFloat(progressSlider.value) + 10);
    sendCommand({ type: "bilibili_seek", data: JSON.stringify({time: newTime}) });
});

document.getElementById("playbackRate").addEventListener("change", (event) => {
  const rate = parseFloat(event.target.value);
  sendCommand({ type: "update_video_status", data: JSON.stringify({ playbackRate: rate }) });
});

document.getElementById("volumeSlider").addEventListener("input", (event) => {
  const volume = parseFloat(event.target.value) / 100;
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

// --- Initialize Connection ---
connectWebRTC();

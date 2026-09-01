import { joinRoom } from 'https://cdn.jsdelivr.net/npm/trystero@0.22.0/mqtt.js/+esm';

function getPeerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('peerId');
}

const statusText = document.getElementById('status-text');
const errorText = document.getElementById('error-text');
const spinner = document.getElementById('spinner');
const retryBtn = document.getElementById('retry-btn');
const appFrame = document.getElementById('app-frame');
const loaderContainer = document.getElementById('loader-container');

function showError(msg) {
  spinner.style.display = 'none';
  statusText.textContent = '连接失败';
  errorText.textContent = msg;
  errorText.style.display = 'block';
  retryBtn.style.display = 'inline-block';
}

function updateStatus(msg) {
  statusText.textContent = msg;
}

const peerId = getPeerIdFromUrl();

if (!peerId) {
  showError('URL 参数中未找到 peerId，请重新在 B站 视频页扫描二维码');
} else {
  try {
    const trysteroConfig = {
      appId: 'bilibili-remote-control',
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    updateStatus('正在加入房间...');
    const room = joinRoom(trysteroConfig, peerId);

    const [sendUi, getUi] = room.makeAction('ui_package');
    const [sendStatus, getStatus] = room.makeAction('bilibili_status');
    const [sendCmd, getCmd] = room.makeAction('bilibili_cmd');

    let uiReceived = false;

    getUi((data) => {
      if (data && data.type === 'ui_html' && data.html) {
        uiReceived = true;
        updateStatus('正在渲染 UI...');
        appFrame.srcdoc = data.html;
        loaderContainer.style.display = 'none';
        appFrame.style.display = 'block';
      }
    });

    getStatus((data) => {
      if (appFrame.contentWindow) {
        appFrame.contentWindow.postMessage({ type: 'bilibili_playing_status', data }, '*');
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'remote_command') {
        sendCmd(event.data.payload);
      }
    });

    room.onPeerJoin((peer) => {
      console.log('Joined room & connected to extension peer:', peer);
      updateStatus('已连接扩展，正在接收 UI 界面...');
    });

    room.onPeerLeave((peer) => {
      console.log('Extension peer left room:', peer);
      if (!uiReceived) {
        showError('扩展端已断开连接');
      }
    });

    // Timeout fallback after 20 seconds
    setTimeout(() => {
      if (!uiReceived) {
        showError('等待 UI 包超时，请确认电脑端扩展处于激活状态并开启了 B站 视频页');
      }
    }, 20000);

  } catch (err) {
    console.error('Trystero init error:', err);
    showError('初始化 WebRTC 失败: ' + err.message);
  }
}

import { resetConfig } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  setupButtons();
  refreshUI();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'offscreen-peer-status' || message.type === 'connection-successful') {
    refreshUI();
  }
});

function setupButtons() {
  document.getElementById('btn-reset').addEventListener('click', async () => {
    if (confirm('确定要重置 Peer ID 吗？这将会生成一个新的连接二维码。')) {
      await resetConfig();
      chrome.runtime.sendMessage({ type: 'reinit-peer' }, () => {
        refreshUI();
      });
    }
  });
}

function refreshUI() {
  chrome.runtime.sendMessage({ type: 'get-status' }, (response) => {
    document.getElementById('loading').style.display = 'none';

    if (!response) {
      showStateMessage('无法获取扩展状态');
      return;
    }

    const { connectionState, isBilibili, qrUrl } = response;

    if (!isBilibili) {
      showStateMessage('请先打开 B站 视频播放页面以使用遥控器');
      return;
    }

    showClaimedState(connectionState, qrUrl);
  });
}

function showClaimedState(connectionState, qrUrl) {
  hideAllStates();
  const claimedDiv = document.getElementById('state-claimed');
  claimedDiv.style.display = 'block';

  const qrContainer = document.getElementById('qr-code');
  const statusElem = document.getElementById('connection-status');
  qrContainer.innerHTML = '';

  if (connectionState === 'connected') {
    statusElem.textContent = '✅ 已与手机遥控器建立 WebRTC 直连！';
  } else if (qrUrl) {
    statusElem.textContent = '📱 请使用手机扫描二维码打开遥控器页面';
    new QRCode(qrContainer, {
      text: qrUrl,
      width: 200,
      height: 200,
    });
  } else {
    statusElem.textContent = '⌛ 正在准备连接 / 等待服务就绪...';
  }
}

function showStateMessage(msg) {
  hideAllStates();
  const msgDiv = document.getElementById('state-message');
  msgDiv.style.display = 'block';
  document.getElementById('message-text').textContent = msg;
}

function hideAllStates() {
  document.getElementById('state-claimed').style.display = 'none';
  document.getElementById('state-message').style.display = 'none';
}

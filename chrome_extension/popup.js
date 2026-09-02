import { getConfig, updateConfig, resetConfig } from './config.js';

let timerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupButtons();
  refreshUI();
});

function setupButtons() {
  document.getElementById('btn-reset').addEventListener('click', async () => {
    if (confirm('确定要重置配置吗？这将会清空认领状态和 Peer ID。')) {
      await resetConfig();
      chrome.runtime.sendMessage({ type: 'reinit-peer' }, () => {
        refreshUI();
      });
    }
  });

  document.getElementById('btn-verify-claim').addEventListener('click', async () => {
    await updateConfig({ claimed: true });
    refreshUI();
  });
}

function refreshUI() {
  chrome.runtime.sendMessage({ type: 'get-status' }, (response) => {
    document.getElementById('loading').style.display = 'none';

    if (!response) {
      showStateMessage('无法获取扩展状态');
      return;
    }

    const { connectionState, isBilibili, config, qrUrl } = response;

    // Check if worker needs claim setup
    const isUnclaimed = !config.claimed && config.claimUrl && config.claimUrl !== '__CLAIM_URL__';

    if (isUnclaimed) {
      showUnclaimedState(config);
      return;
    }

    // Claimed or standard setup
    if (!isBilibili) {
      showStateMessage('请先打开 B站 视频播放页面以使用遥控器');
      return;
    }

    showClaimedState(connectionState, qrUrl);
  });
}

function showUnclaimedState(config) {
  hideAllStates();
  const unclaimedDiv = document.getElementById('state-unclaimed');
  unclaimedDiv.style.display = 'block';

  const claimBtn = document.getElementById('claim-link');
  claimBtn.href = config.claimUrl;

  if (timerInterval) clearInterval(timerInterval);

  const expiresAt = config.claimExpiresAt || (Date.now() + 60 * 60 * 1000);

  function updateTimer() {
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    const timerElem = document.getElementById('countdown-timer');
    if (diff > 0) {
      timerElem.textContent = `认领剩余时间: ${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    } else {
      timerElem.textContent = `认领已超时，请重新触发 CI 生成`;
    }
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
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
  document.getElementById('state-unclaimed').style.display = 'none';
  document.getElementById('state-claimed').style.display = 'none';
  document.getElementById('state-message').style.display = 'none';
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

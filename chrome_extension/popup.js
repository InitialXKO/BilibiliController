document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ type: 'get-status' }, (response) => {
    if (response.isBilibili) {
      if (response.connectionState === 'connected') {
        showMessage('Connected!');
      } else if (response.connectionState === 'connecting' && response.qrUrl) {
        generateQRCode(response.qrUrl);
      } else {
        showMessage('Not connected. Please refresh the Bilibili page.');
      }
    } else {
      showMessage('Navigate to a Bilibili video page to start.');
    }
  });
});

function showMessage(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('qr-code').style.display = 'none';
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
}

function generateQRCode(url) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('message').style.display = 'none';
  const qrCodeDiv = document.getElementById('qr-code');
  qrCodeDiv.innerHTML = '';
  new QRCode(qrCodeDiv, {
    text: url,
    width: 256,
    height: 256,
  });
  qrCodeDiv.style.display = 'block';
}

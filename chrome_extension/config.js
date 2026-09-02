export const defaultConfig = {
  remotePageUrl: "https://cdn.jsdelivr.net/gh/InitialXKO/BilibiliController@main/remote/public/index.html",
  strategy: "mqtt"
};

export async function getConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const stored = await chrome.storage.local.get([
      'remotePageUrl',
      'strategy',
      'peerId',
      'roomSecret'
    ]);
    return {
      remotePageUrl: stored.remotePageUrl || defaultConfig.remotePageUrl,
      strategy: stored.strategy || defaultConfig.strategy,
      peerId: stored.peerId || null,
      roomSecret: stored.roomSecret || null
    };
  }
  return { ...defaultConfig, peerId: null, roomSecret: null };
}

export async function updateConfig(updates) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set(updates);
  }
}

export async function resetConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove([
      'remotePageUrl',
      'strategy',
      'peerId',
      'roomSecret'
    ]);
  }
}

export const defaultConfig = {
  remotePageUrl: "https://bilibili-remote.resilient-marmoset.workers.dev",
  claimUrl: "https://dash.cloudflare.com/claim-preview?claimToken=8eZh2r6L_HHrQjWVNstqg1zSgLVnEn7a9Oj9gBRWjZg",
  claimed: false,
  claimExpiresAt: 1788329450359
};

export async function getConfig() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const stored = await chrome.storage.local.get([
      'remotePageUrl',
      'claimUrl',
      'claimed',
      'claimExpiresAt',
      'peerId'
    ]);
    return {
      remotePageUrl: stored.remotePageUrl || defaultConfig.remotePageUrl,
      claimUrl: stored.claimUrl || defaultConfig.claimUrl,
      claimed: stored.claimed !== undefined ? stored.claimed : defaultConfig.claimed,
      claimExpiresAt: stored.claimExpiresAt || defaultConfig.claimExpiresAt,
      peerId: stored.peerId || null
    };
  }
  return { ...defaultConfig, peerId: null };
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
      'claimUrl',
      'claimed',
      'claimExpiresAt',
      'peerId'
    ]);
  }
}

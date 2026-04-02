const DEFAULT_URL = 'https://shows.cityline.com.hk/tc/2026/iveshowwhatiamhk.html';

function isCitylinePage(urlString) {
  try {
    const u = new URL(urlString);
    const host = u.hostname.toLowerCase();
    const isCitylineHost =
      host === 'cityline.com' ||
      host.endsWith('.cityline.com') ||
      host === 'cityline.com.hk' ||
      host.endsWith('.cityline.com.hk');

    return isCitylineHost && /^\/tc\/2026\//i.test(u.pathname);
  } catch (_) {
    return false;
  }
}

function buildTargetUrl(baseUrl, testModeOn) {
  const u = new URL(baseUrl);
  if (testModeOn) {
    u.searchParams.set('testMode', '1');
  } else {
    u.searchParams.delete('testMode');
  }
  return u.toString();
}

async function getTestMode() {
  const data = await chrome.storage.local.get(['testMode']);
  return Boolean(data.testMode);
}

async function setTestMode(value) {
  await chrome.storage.local.set({ testMode: value });
}

function renderStatus(testModeOn) {
  const status = document.getElementById('status');
  const toggle = document.getElementById('toggle');

  status.textContent = testModeOn
    ? '目前：測試模式 ON（10 秒後會出現測試按鈕）'
    : '目前：測試模式 OFF（只監控真實按鈕）';

  toggle.textContent = testModeOn
    ? '✅ 測試模式：ON（點擊切換 OFF）'
    : '⏸ 測試模式：OFF（點擊切換 ON）';

  toggle.style.background = testModeOn ? '#00c853' : '#616161';
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs.length ? tabs[0] : null;
}

async function openOrUpdateCurrentTab(url) {
  const tab = await getCurrentTab();

  if (!tab || !tab.id) {
    await chrome.tabs.create({ url });
    return;
  }

  await chrome.tabs.update(tab.id, { url });
}

async function getBestBaseUrl() {
  const tab = await getCurrentTab();
  if (tab && tab.url && isCitylinePage(tab.url)) {
    return tab.url;
  }
  return DEFAULT_URL;
}

async function init() {
  const testModeOn = await getTestMode();
  renderStatus(testModeOn);

  document.getElementById('toggle').addEventListener('click', async () => {
    const current = await getTestMode();
    const next = !current;

    await setTestMode(next);
    renderStatus(next);
  });

  document.getElementById('openPageBtn').addEventListener('click', async () => {
    const enabled = await getTestMode();
    const baseUrl = await getBestBaseUrl();
    const targetUrl = buildTargetUrl(baseUrl, enabled);
    await openOrUpdateCurrentTab(targetUrl);
  });

}

init().catch((error) => {
  console.error('popup 初始化失敗：', error);
});

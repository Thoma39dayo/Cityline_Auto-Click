let startTime = Date.now();
let startPerfTime = performance.now();
let clicked = false;

const CURRENT_URL = window.location.href;
const HOST = window.location.hostname;

// Cityline 活動頁匹配規則：
// 1) 網域為 *.cityline.com 或 *.cityline.com.hk
// 2) 路徑為 /tc/2026/*
const currentUrlObj = new URL(CURRENT_URL);
const currentHost = currentUrlObj.hostname.toLowerCase();

const isCitylineHost =
  currentHost === 'cityline.com' ||
  currentHost.endsWith('.cityline.com') ||
  currentHost === 'cityline.com.hk' ||
  currentHost.endsWith('.cityline.com.hk');

const isAllowedPurchasePage =
  isCitylineHost && /^\/tc\/2026\//i.test(currentUrlObj.pathname);
const isPriorityPage = /(^|\.)priority\.cityline\.com$/i.test(HOST);
const isTestModeFromUrl = (currentUrlObj.searchParams.get('testMode') || '') === '1';
let isTestMode = isTestModeFromUrl;

let monitorPanel = null;
let monitorTimerId = null;
let testModeStarted = false;
const TARGET_TEXT = '前往購票';

function normalizeText(text) {
  return (text || '')
    .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, '')
    .trim();
}

function isElementVisible(el) {
  if (!el || !(el instanceof Element)) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isClickable(el) {
  if (!el) return false;
  if (el.disabled) return false;
  if (el.getAttribute('aria-disabled') === 'true') return false;
  return isElementVisible(el);
}

function createMonitorPanel() {
  if (!document.body || monitorPanel) return;

  const panel = document.createElement('div');
  panel.id = 'cityline-monitor-panel';
  panel.style.cssText = `
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 2147483647;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    border-radius: 10px;
    padding: 10px 14px;
    font-family: system-ui;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 8px 20px rgba(0,0,0,0.28);
    min-width: 230px;
  `;

  panel.innerHTML = `
    <div style="font-weight:700; margin-bottom:4px; color:#7CFF9D;">🎯 監控中（前往購票）</div>
    <div>監控時間：<strong id="cityline-monitor-elapsed">0.00 s</strong></div>
    <div>狀態：<strong id="cityline-monitor-status">等待按鈕出現...</strong></div>
  `;

  document.body.appendChild(panel);
  monitorPanel = panel;
}

function updateMonitorPanelStatus(statusText) {
  if (!monitorPanel) return;
  const statusEl = monitorPanel.querySelector('#cityline-monitor-status');
  if (statusEl) statusEl.textContent = statusText;
}

function startMonitorTimer() {
  if (monitorTimerId) return;

  monitorTimerId = setInterval(() => {
    if (!monitorPanel) return;
    const elapsedEl = monitorPanel.querySelector('#cityline-monitor-elapsed');
    if (!elapsedEl) return;

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    elapsedEl.textContent = `${elapsedSec} s`;

    if (clicked) {
      clearInterval(monitorTimerId);
      monitorTimerId = null;
    }
  }, 50);
}

function showSuccessPanel(responseTime) {
  if (!document.body) return;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (monitorPanel) {
    monitorPanel.style.background = 'rgba(0,120,30,0.88)';
    updateMonitorPanelStatus('已點擊成功');
  }

  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed; top: 70px; right: 20px; background: #00c853; color: white;
    padding: 16px; border-radius: 12px; z-index: 2147483647; width: 320px;
    box-shadow: 0 6px 20px rgba(0,200,83,0.6); font-family: system-ui;
  `;

  panel.innerHTML = `
    <div style="font-size:15px;font-weight:bold;margin-bottom:8px;">🚀 已自動點擊「前往購票」</div>
    <div style="background:rgba(255,255,255,0.2);padding:8px;border-radius:6px;font-size:13px;line-height:1.6;">
      <div>監控時間：<strong>${elapsed} s</strong></div>
      <div>反應時間：<strong>${responseTime} ms</strong></div>
    </div>
  `;

  document.body.appendChild(panel);
  setTimeout(() => panel.remove(), 8000);
}

function triggerRealClick(el) {
  // 最快路徑：先呼叫原生 click
  try {
    el.click();
    return;
  } catch (_) {}

  // 後備事件序列
  try {
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
  } catch (_) {}
}

function simulateClick(btn) {
  if (clicked) return;
  clicked = true;

  const responseTime = (performance.now() - startPerfTime).toFixed(3);
  console.log(`%c⚡ 偵測成功並點擊：${responseTime}ms`, 'color:#00c853;font-size:16px');

  if (btn && btn.style) {
    btn.style.transition = 'all 0.08s';
    btn.style.transform = 'scale(0.98)';
  }

  triggerRealClick(btn);
  showSuccessPanel(responseTime);
}

function findIntroAnchor() {
  const all = Array.from(document.querySelectorAll('div,span,p,h1,h2,h3,a,button'));
  for (let i = 0; i < all.length; i += 1) {
    const el = all[i];
    const t = normalizeText(el.textContent || '');
    if (t === '簡介') return el;
  }
  return null;
}

function injectTestPurchaseButton() {
  if (!document.body) return;
  if (document.getElementById('cityline-test-purchase-btn')) return;

  const testBtn = document.createElement('button');
  testBtn.id = 'cityline-test-purchase-btn';
  testBtn.textContent = '前　往　購　票';
  testBtn.style.cssText = `
    display: block;
    width: 100%;
    margin: 0;
    z-index: 2147483647;
    background: linear-gradient(135deg,#ff2247,#c4002e);
    color: #fff;
    border: 0;
    border-radius: 12px;
    padding: 14px 28px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.2em;
    box-shadow: 0 10px 24px rgba(196,0,46,0.45);
    cursor: pointer;
  `;

  const introAnchor = findIntroAnchor();
  if (introAnchor) {
    const introBlock = introAnchor.closest('div') || introAnchor;
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: min(900px, 92%);
      margin: 10px auto 12px;
    `;
    wrapper.appendChild(testBtn);

    if (introBlock.parentElement) {
      // 目標位置：置中且位於「簡介」區塊正上方（不是左側）
      introBlock.parentElement.insertBefore(wrapper, introBlock);
    } else {
      document.body.appendChild(wrapper);
    }
  } else {
    // 後備：仍可測試
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:min(900px,92%);margin:10px auto 12px;';
    wrapper.appendChild(testBtn);
    document.body.appendChild(wrapper);
  }

  updateMonitorPanelStatus('測試按鈕已出現（置中且在簡介上方），等待自動點擊...');
}

function startTestModeCountdown() {
  if (testModeStarted) return;
  testModeStarted = true;

  let remain = 10;
  updateMonitorPanelStatus(`測試模式：${remain} 秒後顯示按鈕`);

  const countdownId = setInterval(() => {
    if (clicked) {
      clearInterval(countdownId);
      return;
    }

    remain -= 1;
    if (remain > 0) {
      updateMonitorPanelStatus(`測試模式：${remain} 秒後顯示按鈕`);
      return;
    }

    clearInterval(countdownId);
    injectTestPurchaseButton();
  }, 1000);
}

function tryClickElement(el) {
  if (!el || clicked) return false;
  if (!isClickable(el)) return false;

  const text = normalizeText(el.textContent || el.value || '');
  if (text !== TARGET_TEXT) return false;

  updateMonitorPanelStatus('找到按鈕，立即點擊中...');
  simulateClick(el);
  return true;
}

function fastScanAndClick(root = document) {
  if (clicked) return true;

  // 只掃描常見可點元素，減少 XPath 成本
  const quickSelector = 'a,button,input[type="button"],input[type="submit"],[role="button"]';
  const quickList = root.querySelectorAll ? root.querySelectorAll(quickSelector) : document.querySelectorAll(quickSelector);

  for (let i = 0; i < quickList.length; i += 1) {
    if (tryClickElement(quickList[i])) return true;
  }

  return false;
}

function readStoredTestMode() {
  return new Promise((resolve) => {
    try {
      if (!chrome?.storage?.local?.get) {
        resolve(false);
        return;
      }

      chrome.storage.local.get(['testMode'], (data) => {
        resolve(Boolean(data && data.testMode));
      });
    } catch (_) {
      resolve(false);
    }
  });
}

async function startMonitoring() {
  const storedTestMode = await readStoredTestMode();
  isTestMode = isTestModeFromUrl || storedTestMode;

  const boot = () => {
    if (!document.body) {
      requestAnimationFrame(boot);
      return;
    }

    if (isPriorityPage) {
      console.log('⏸ priority.cityline.com 已停用自動點擊，避免重複刷新');
      return;
    }

    if (!isAllowedPurchasePage) {
      console.log('ℹ️ 非指定活動頁，略過監控:', CURRENT_URL);
      return;
    }

    createMonitorPanel();
    startMonitorTimer();

    if (isTestMode) {
      startTestModeCountdown();
    }

    // 先掃一次（進頁即刻檢查）
    fastScanAndClick();

    const observer = new MutationObserver((mutations) => {
      if (clicked) return;

      // 極速路徑：優先檢查剛新增節點（直接 node + 子樹）
      for (const m of mutations) {
        if (m.type !== 'childList' || !m.addedNodes || !m.addedNodes.length) continue;

        for (let n = 0; n < m.addedNodes.length; n += 1) {
          if (clicked) return;
          const node = m.addedNodes[n];
          if (!(node instanceof Element)) continue;

          if (tryClickElement(node)) return;
          if (fastScanAndClick(node)) return;
        }
      }

      // 後備全域掃描
      fastScanAndClick();
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    // 極高頻檢查：用 rAF 比固定 interval 更即時且平滑
    let rafId = null;
    const rafLoop = () => {
      if (clicked) {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
        return;
      }

      fastScanAndClick();
      rafId = requestAnimationFrame(rafLoop);
    };

    rafId = requestAnimationFrame(rafLoop);
  };

  boot();
}

startMonitoring();
console.log('%c🚀 Cityline Ultra-Fast monitor 已啟動', 'color:#00ff00;font-size:16px');

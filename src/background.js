/**
 * refs:
 *  - https://github.com/mdn/webextensions-examples/tree/master/bookmark-it
 *  - https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#permiss%C3%A3o_activetab_(aba_ativa)
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setIcon
 *  - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_the_Tabs_API
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/reload
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#connection-based_messaging
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
 *  - https://1loc.dev/misc/detect-dark-mode/
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/icons#svg
 *  - chrome://devtools/skin/images/debugging-workers.svg (saved on the project at `./images/debugging-workers.svg`)
 *  -   this file is used in the browser interface and have a fill: context-fill to adapt to theme colors
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n/getMessage
 *  - https://github.com/mozilla/webextension-polyfill
 *  - https://github.com/PlasmoHQ/plasmo/blob/main/cli/plasmo/templates/manifest.json
 *  - https://developer.mozilla.org/en-US/docs/Web/API/fetch
 *  - https://stackoverflow.com/a/47250621
 *  - https://dmitripavlutin.com/timeout-fetch-request/
 *  - https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout
 *  - https://developer.chrome.com/docs/extensions/mv3/xhr/
 *  - https://dnscrypt.info/public-servers/
 *  - https://dohjs.org/
 *  - https://developers.google.com/speed/public-dns/docs/doh/json
 *  - https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/
 *  - https://github.com/raindropio/app/blob/master/src/target/extension/background/action.js
 *  - https://github.com/raindropio/app/blob/master/src/target/extension/background/links.js
 *  - https://www.delftstack.com/howto/javascript/generate-random-boolean-in-javascript/
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onRemoved
 *  - https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
 *  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab#:~:text=Only%20present%20if%20the%20extension%20has%20the%20%22tabs%22%20permission%20or%20a%20matching%20host%20permissions.
 *  -
 */

/*
 * -> make extension disabled by default (tab could be added if url has query param)
 * -> user opt to monitor heartbeat by clicking on the extension icon
 * -> heartbeat runs but only checks DOH if current active windows is focused
 *   and tab is opt in ("enabled") by user click
 *
 * -> each time user change tabs:
 *    - check if page is on monitoring list (enabled tab)
 *      - if page is enabled
 *        - setup alarms (if there isnt any setup already)
 *        - update icon action badge with number of enabled pages
 *        - update icon to online/offline state
 *      - if page is not enabled
 *        - clear alarms
 *        - update icon action badge with no number
 *        - update icon to default
 */

/**
 * normal 92A9D6 (blue)	    icon public     https://icon.kitchen/i/H4sIAAAAAAAAA0WQT0%2FDMAzFv0u47pDtUNpeJ8QVCW4IoSR2MktpXNK0aJr23XGyAZf8%2BenZfn4XtZm44qLGi%2FLhGGk2udTPgnKpzGsCtVPkOMl3Xm0kp6470T55j65IocKImykoMhvezjMKCtkAYSqNvZ5Mg8vXStnFJjQQ8MiRs%2FAHrYeu7wX78GIAKIXqoPCsxr3eqUzhJGbq03IpPN3eEX2j4saG59%2BBUuhq331tPBzMAJ00buhQUacfobeCTApiZexu9X9evB96rZuX%2By7uHkpF%2FzLnwddNPEVMZmpCTkkioY3K%2BTNjZAM1qolhjTXhd5kJmakFyouc32jVx%2FUHNUCvlYQBAAA%3D
 * online 92D692 (green)    icon public     https://icon.kitchen/i/H4sIAAAAAAAAA0WQu27DMAxF%2F0VdPSgeXNtrUHQt0G5FEehBKQRk0ZVlF0GQfy%2BlvBY9Di7Jy3sWmworLGI8C%2Bf3AWeVcvkswJdItEYrGoGGIn%2FnVQc04tKw9s05MJkLBQTYVAaWaf91moGRT8oixFzZ51FVuPyumEyoQmU97ClQYv4i5dD1PWPnP5S1GH1xkGkW4042IqE%2Fspny1JQzTdd3AFcpu9H%2B%2FT6QC03puyuNh9Z2Q8uNK2oL6uSr7TUjFT1bGbtr%2FcOLc0MvZfVy28XcQinoKTPOurKJwwBRTVVIMXIkuGE%2BHRIEUvbAsXH%2FiewaSsjfPNYmwpopLXz%2BgRY%2Fl3%2F%2FSDknhwEAAA%3D%3D
 * offline D69292 (redish)  icon public_off https://icon.kitchen/i/H4sIAAAAAAAAA0WQu27DMAxF%2F0VdPSgeXNtrUHQt0G5FEehBKgJk0ZVlF0GQfy%2BlvBY9Di7Jy3sWmworLGI8C3T74GeVcvkswJdItEYrGuENRf7Oqw7eHAhRXBrWvyGCyVwsIMCmMrBUu6%2FTDIxcUtZDzJV9HlWFy%2B%2FqkwlVqKyDPQVKzF%2BkHLq%2BZ4zuQ1nroysuMs1i3MlGJO%2BObKg8NeVM0%2FUdACtlN9q93wdyoSl9d6Wx7YZ2aLlxRW1BnXy1vWakomMrY3etf3hBHHopq5fbLuYWTEFPmUGLZRP0AaKaqpBi5Ej85vPpkCCQsve4JrJrKEl%2F81ybyNdgaeHzD7T4ufwDhw%2BQ84wBAAA%3D
 */

// Save tabId for all enabled tabs
let monitoringTabList = new Set();

let currentActiveTab;
let scheduledToReload = (navigator.onLine) ? false : true; // probably will always default to "false"

const iconState = {
  'default': {
    'enabled': { 'title': browser.i18n.getMessage("extensionTitle") },
    'disabled': { 'title': browser.i18n.getMessage("extensionTitle") }
  },
  'online': {
    'enabled': { 'title': browser.i18n.getMessage("extensionTitleOnline") },
    'disabled': { 'title': browser.i18n.getMessage("extensionTitleOnlineDisabledReload") }
  },
  'offline': {
    'enabled': { 'title': browser.i18n.getMessage("extensionTitleOffline") },
    'disabled': { 'title': browser.i18n.getMessage("extensionTitleOfflineDisabledReload") }
  }
}

/*
 * Updates the browserAction badge to reflect how many enabled tabs there is
 */
async function updateTabBadge() {

  const { id: tabId } = await currentTab();
  if (!tabId) return;

  let { tabState, networkState } = getActionState();

  await Promise.all([
    browser.browserAction.setBadgeBackgroundColor({ tabId, color: '#607D8B' }),
    browser.browserAction.setBadgeText({ tabId, text: monitoringTabList.has(tabId) ? String(monitoringTabList.size) : '' }),
    // only for firefox
    ...(typeof browser.browserAction.setBadgeTextColor == 'function' ? [
      browser.browserAction.setBadgeTextColor({ tabId, color: '#FFFFFF' })
    ] : []),

    browser.browserAction.setTitle({
      // Screen readers can see the title
      title: iconState[networkState][tabState]['title']
    }),
  ]);

}

async function updateIcon() {

  // networkState = online | offline

  let { tabState, networkState } = getActionState();

  await Promise.all([
    browser.browserAction.setIcon({
      path: {
        16: `icons/icon-${(tabState === 'enabled') ? networkState : 'default'}-16.png`,
        32: `icons/icon-${(tabState === 'enabled') ? networkState : 'default'}-32.png`,
        48: `icons/icon-${(tabState === 'enabled') ? networkState : 'default'}-48.png`
      }
    }),

    browser.browserAction.setTitle({
      // Screen readers can see the title
      title: iconState[networkState][tabState]['title']
    }),
  ]);

}

async function toggleTabMonitoringState() {

  const { id: tabId } = await currentTab();
  if (!tabId) return;

  if (monitoringTabList.has(tabId)) {
    monitoringTabList.delete(tabId);
    await clearAlarms();
  } else {
    monitoringTabList.add(tabId);
    await setupAlarms();
  }

  await updateTabBadge();
  await updateIcon();
}

function getActionState() {
  return {
    tabState: (monitoringTabList.has(currentActiveTab.id)) ? 'enabled' : 'disabled' ,
    networkState: (scheduledToReload) ? 'offline' : 'online'
  }
}

browser.browserAction.onClicked.addListener(toggleTabMonitoringState);

async function currentTab() {
  const [ currentTab ] = await browser.tabs.query({ active: true, currentWindow: true });
  return currentTab || {};
}

async function updateActiveTab() {
  currentActiveTab = await currentTab() ?? {};
}

async function clearAlarms() {
  await browser.alarms.clearAll().then(() => console.info('ALARMS CLEARED'));
}

async function setupAlarms() {
  const heartbeatAlarm = await browser.alarms.get('network-heartbeat');

  if (!heartbeatAlarm) {
    // Will be limited to 1 minute when live
    // https://developer.chrome.com/docs/extensions/reference/alarms/#:~:text=In%20order%20to,least%201%20minute.
    browser.alarms.create("network-heartbeat", {
      delayInMinutes: 0,
      periodInMinutes: 0.25
    });
    console.info('ALARMS SETUP');
  } else {
    console.info('ALARMS ALREADY SETUP');
  }
}

async function updateAlarms() {

  const { id: tabId } = await currentTab();
  if (!tabId) return;

  const activeAlarms = await browser.alarms.getAll();

  // browser.alarms.getAll().then((alarms) => {
  //   for (let alarm of alarms) {
  //     console.log(alarm.name);
  //   }
  // });

  if (!monitoringTabList.has(tabId)) {
    if (Number(activeAlarms.length) > 0) {
      await clearAlarms();
    }
  } else {
    if (Number(activeAlarms.length) === 0) {
      await setupAlarms();
    }
  }
}

async function updateMonitoring() {
  await updateActiveTab();
  await updateAlarms();
  await updateTabBadge();
  await updateIcon();
}

async function onTabsUpdated(tabId, { status }, { url }) {
  if (status === 'complete') {
    // mark tab as enable using query param (no user interaction required)
    try {
      const tabUrl = new URL(url);
      const autoreloadQueryParam = tabUrl.searchParams.get('enable_autoreload');

      if (!!autoreloadQueryParam) {
        await toggleTabMonitoringState();
        return;
      }
    } catch (err) {
      console.error('unable to read url queryparam');
    }

    await updateMonitoring();
  }
}
// listen to tab URL changes
browser.tabs.onUpdated.removeListener(onTabsUpdated);
browser.tabs.onUpdated.addListener(onTabsUpdated);

// listen to tab switching
browser.tabs.onActivated.removeListener(updateMonitoring);
browser.tabs.onActivated.addListener(updateMonitoring);

// listen for window switching
browser.windows.onFocusChanged.removeListener(updateMonitoring);
browser.windows.onFocusChanged.addListener(updateMonitoring);

function tabRemoved(tabId, removeInfo) {
  // console.log(`Tab: ${tabId} is closing`);
  // console.log(`Window ID: ${removeInfo.windowId}`);
  // console.log(`Window is closing: ${removeInfo.isWindowClosing}`);

  monitoringTabList.delete(tabId);
}

browser.tabs.onRemoved.removeListener(tabRemoved);
browser.tabs.onRemoved.addListener(tabRemoved);

async function init() {
  await updateMonitoring();
  console.log('run init');
}
// runs when the extension loads initially (browser start for example)
init();


async function networkConnectivityChanged(message) {

  if (message.status === 'offline') {
    scheduledToReload = true;
    await updateIcon();

    return;
  }

  // when going from offline -> online
  if (scheduledToReload && message.status === 'online') {
    // // reload only current active tab
    // if (monitoringTabList.has(currentActiveTab.id)) {
    //   // browser.tabs.reload() defaults to current active tab but we can pass a tabId
    //   browser.tabs.reload(currentActiveTab.id);
    // }

    monitoringTabList.forEach((tabId) => {
      browser.tabs.reload(tabId);
    });
    scheduledToReload = false;
    await updateIcon();
  }

}

window.addEventListener('offline', function (ev) {
  networkConnectivityChanged({
    "status": ev.type
  });
});

window.addEventListener('online', function (ev) {
  networkConnectivityChanged({
    "status": ev.type
  });
});

browser.alarms.onAlarm.addListener(async (e) => {
  console.log('alarm ev:', e);

  // browser.windows.getCurrent().then((window) => {
  //   console.log("window ID: " + window.id);
  //   console.log("focused?: " + window.focused);
  // });

  await pingDOH();
});

async function pingDOH() {

  // const controller = new AbortController();
  // const signal = controller.signal;
  // const requestTimeout = setTimeout(() => controller.abort(), 5000);

  await fetch('https://dns.google/resolve?name=8.8.8.8&cd=1', { signal: AbortSignal.timeout(3000) })
    .then((response) => {
      if (!response.ok) {
        networkConnectivityChanged({ "status": "offline" });
      }

      console.log('i live');
      networkConnectivityChanged({ "status": "online" });
      console.log(response.status);
    })
    .catch((err) => {
      console.log("err name: ", err.name);
      console.log("err mssg: ", err.message);

      console.log('i ded');
      networkConnectivityChanged({ "status": "offline" });
    });
}


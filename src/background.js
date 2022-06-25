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
 *  -
 */


let currentActiveTab;
let currentActiveAction;
let scheduledToReload = (navigator.onLine) ? false : true;
let autoReload = true;

let actionsMix = { true: {}, false: {} };
// [if is offline => scheduledToReload=true][if is disabled => autoReload=false]
actionsMix[true][true]   = { icon: "offline",          title: browser.i18n.getMessage("extensionTitleOffline") };
actionsMix[true][false]  = { icon: "offline-disabled", title: browser.i18n.getMessage("extensionTitleOfflineDisabledReload") };
actionsMix[false][true]  = { icon: "online",           title: browser.i18n.getMessage("extensionTitleOnline") };
actionsMix[false][false] = { icon: "online-disabled",  title: browser.i18n.getMessage("extensionTitleOnlineDisabledReload") };

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already scheduledToReload.
 */
function updateIcon() {
  const newAction = actionsMix[scheduledToReload][autoReload];

  if (JSON.stringify(currentActiveAction) !== JSON.stringify(newAction)) {

    browser.browserAction.setIcon({
      path: {
        19: `icons/icon-${newAction.icon}-96.svg`,
        38: `icons/icon-${newAction.icon}-96.svg`
      }
    });

    browser.browserAction.setTitle({
      // Screen readers can see the title
      title: newAction.title
    });

    currentActiveAction = newAction;

  }

}

function toggleAutoReload() {
  autoReload = !autoReload;
  updateIcon();
  console.log('autoReload: ' + autoReload);
}

browser.browserAction.onClicked.addListener(toggleAutoReload);

/*
 * Switches currentActiveTab to reflect the currently active tab
 */
function updateActiveTab() {

  function updateTab(tabs) {
    if (tabs[0]) {
      currentActiveTab = tabs[0];
    }
  }

  let gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then(updateTab);

}

function networkConnectivityChanged(message) {

  // browser.notifications.create({
  //   "type": "basic",
  //   "iconUrl": browser.extension.getURL("icons/bookmark-it.png"),
  //   "title": "Page connectivity changed!",
  //   "message": message.status + ', current active page ' + currentActiveTab.url
  // });

  if (message.status === 'offline') {
    scheduledToReload = true;
    updateIcon();

    return;
  }

  if (currentActiveTab && scheduledToReload && message.status === 'online') {
    if (autoReload) {
      // browser.tabs.reload() defaults to current active tab but we can pass a tabId
      browser.tabs.reload(currentActiveTab.id);
    }
    scheduledToReload = false;
    updateIcon();
  }

}

window.addEventListener('offline', function (ev) {
  console.log('offline');
  networkConnectivityChanged({
    "status": ev.type
  });
});

window.addEventListener('online', function (ev) {
  console.log('online');
  networkConnectivityChanged({
    "status": ev.type
  });
});


// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// updates when the extension loads initially
updateActiveTab();
updateIcon();

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
 *  -
 */


let currentActiveTab;
let scheduledToReload = false;
let autoReload = true;

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already scheduledToReload.
 */
function updateIcon() {

  browser.browserAction.setIcon({
    path: scheduledToReload
      ? {
        19: `icons/dark-off-96.svg`,
        38: `icons/dark-off-96.svg`
      }
      : {
        19: `icons/dark-on-96.svg`,
        38: `icons/dark-on-96.svg`
      }
  });

  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: scheduledToReload
      ? `[OFF]${(autoReload ? `[AUTO]` : ``)} Waiting connectivity`
      : `[ON ]${(autoReload ? `[AUTO]` : ``)} All good`
  });

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
  gettingActiveTab.then(updateTab).then(updateIcon);

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

// update when the extension loads initially
updateActiveTab();

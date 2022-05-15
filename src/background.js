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
 *  -
 */


let currentActiveTab;
let scheduledToReload;
let colorScheme;

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already scheduledToReload.
 */
function updateIcon() {

  browser.browserAction.setIcon({
    path: scheduledToReload
      ? {
        19: `icons/off-${colorScheme}-19.png`,
        38: `icons/off-${colorScheme}-38.png`
      }
      : {
        19: `icons/on-${colorScheme}-19.png`,
        38: `icons/on-${colorScheme}-38.png`
      }
  });

  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: scheduledToReload ? '[Off] Waiting connectivity' : '[On] All good'
  });

}

function isDarkMode() {
  return (window.matchMedia && !!window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function updateColorScheme() {
  colorScheme = isDarkMode() ? 'dark' : 'light';
}

// /*
//  * Executed when user click extension icon
//  */
// function runOnExtensionClick() {
//   browser.tabs.executeScript({
//     runAt: `document_start`,
//     code: `console.log('location (from extension click):', window.location.href);`
//   });
// }

// browser.browserAction.onClicked.addListener(runOnExtensionClick);

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
  gettingActiveTab.then(updateTab).then(updateColorScheme).then(updateIcon);

}

function tabsConnectivityChanged(message, sender) {

  if (sender.tab.id === currentActiveTab.id) {

    updateIcon();

    // browser.notifications.create({
    //   "type": "basic",
    //   "iconUrl": browser.extension.getURL("icons/bookmark-it.png"),
    //   "title": "Page connectivity changed!",
    //   "message": message.status + ', current active page ' + currentActiveTab.url
    // });

    if (scheduledToReload && message.status === 'online') {
      // browser.tabs.reload() defaults to current active tab but we can pass a tabId
      browser.tabs.reload(currentActiveTab.id);
    }

  }

  if (message.status === 'offline') {
    scheduledToReload = true;
  } else {
    scheduledToReload = false;
  }

}

browser.runtime.onMessage.addListener(tabsConnectivityChanged);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();


const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

function notifyBackgroundScript(ev) {
    browser.runtime.sendMessage({
        "status": ev.type
    });
}

// window listener when offline
window.addEventListener('offline', function (e) {
    console.log('offline');
    notifyBackgroundScript(e);
});

// window listener when online
window.addEventListener('online', function (e) {
    console.log('online');
    notifyBackgroundScript(e);
});

console.log('[tab reload] content script working');

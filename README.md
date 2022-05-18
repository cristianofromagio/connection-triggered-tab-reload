# connection-tab-reload

Firefox extension that reloads current active tab when navigator status turns online again

## Why I built this

When a tab is reproducing a livestream and there is a short instability in the network connection signal, the livestream player might require an user triggered interaction (i.e "click here to reconnect") to resume playing. This extension just reloads the page when the connection is restabilished (`navigator.onLine === true`). The `onLine` property from `navigator` might be unreliable (see note from the [specs](https://html.spec.whatwg.org/multipage/system-state.html#navigator.online)) but it is useful enough for me.

## What can be improved

- Memoize `updateIcon` so it doesn't always update the icon unnecessarily (right now it updates every current tab change)
- ~~Remove `contentScript` "dependency". The `window.navigator` property doesn't need to be read from a content space, it can be used directly on `background.js`~~
- ~~Create a popup menu or a browserAction for users to disable the default behavior (prevent page from reloading when connection comes back)~~
  + At first thought about creating an extension option config to handle this, but then it would require the `storage` permission at install (and because of that would display the message "this extension can read all data from all sites") and that could be an overkill. At the moment the page reload is the default behavior and the user can tap at the extension icon to toggle `autoReload` (this config is not persisted, it resets with every new browser session).
- Automatize icons generation

## Sources

- Extension code based on [https://github.com/mdn/webextensions-examples/tree/master/bookmark-it](https://github.com/mdn/webextensions-examples/tree/master/bookmark-it)
- Icons created with icon from [https://github.com/astrit/css.gg](https://github.com/astrit/css.gg)

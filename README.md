<p align="center">
  <img src="./images/parts/v4/icon-default.png" width="128" height="128"/>
</p>

# Connection Triggered Tab Reload

Browser extension that reloads current active tab when navigator status turns online again. Tested on latest versions of Firefox Developer Edition, Google Chrome, Edge and Opera.

<kbd>![Screenshot](https://raw.githubusercontent.com/cristianofromagio/connection-triggered-tab-reload/master/images/screenshots/screenshot-v1.0.gif)</kbd>

## Why I built this

When a tab is reproducing a livestream and there is a short instability in the network connection signal, the livestream player might require an user triggered interaction (i.e "click here to reconnect") to resume playing. This extension just reloads the page when the connection is restabilished ~~(`navigator.onLine === true`). The `onLine` property from `navigator` might be unreliable (see note from the [specs](https://html.spec.whatwg.org/multipage/system-state.html#navigator.online)) but it is useful enough for me.~~ (see [v2.0 Rewrite](#v2.0_Rewrite) below).

## v2.0 Rewrite

- Replaced assembled icons for icons generated with [Icon Kitchen](https://icon.kitchen/).
- Rewrite whole reloading mechanism. As seen before, `navigator.onLine` can't be trusted with reflecting true state of the network connectivity. To tackle that problem, now the extension uses a polling method, making a request to [Google Public DNS DNS-over-HTTPS (DoH) API](https://dns.google) to check network connectivity. This is done using the [Alarms API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/alarms), so it has a limitation of polling no more than [once per minute](https://developer.chrome.com/docs/extensions/reference/alarms/#method-create). This polling happens only while the current active tab is "enabled". If the current active tab is not "enabled" the polling is halted.
- By default, the extension will not auto-reload any tabs. To "enable" a tab, click on the extension icon. It will display a badge on the icon corner with how many tabs are "enabled" (these will auto-reload if connection goes `online` __(enabled)__ -> `offline` -> `online` __(reloaded)__).
- It will auto-reload all enabled tabs, not just the current active tab. But for auto-reload to happen on all enabled tabs, the current active tab must be "enabled".
- A tab can be "enabled" by using the query param `enable_autoreload` on the URL. Example: [https://example.com/?enable_autoreload=1](https://example.com/?enable_autoreload=1). This automatically mark the tab as "enabled" without the need for an user interaction.

## Sources

- Extension code based on [https://github.com/mdn/webextensions-examples/tree/master/bookmark-it](https://github.com/mdn/webextensions-examples/tree/master/bookmark-it)
- Icons (parts v1-v2) created with icon from [https://github.com/astrit/css.gg](https://github.com/astrit/css.gg)
- Icons (parts v3) created with icons from [https://fonts.google.com/icons](https://fonts.google.com/icons)
- Icon (parts v4) generated with [https://icon.kitchen/](https://icon.kitchen/)
- Some build scripts and templates from [https://github.com/PlasmoHQ/plasmo](https://github.com/PlasmoHQ/plasmo)

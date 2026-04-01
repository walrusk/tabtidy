# TabTidy

TabTidy is a Chrome extension that closes non-pinned tabs in the current window, opens or refreshes a history page for the latest tidy run, and lets you prune saved entries one by one.

## Core Functionality

- The chrome extension button, when clicked, triggers TabTidy.
- The chrome extension comes bundled with an html file called "tabtidy.html".
- When TabTidy is triggered, the following happens:
  - `tabtidy.html` is opened as part of the tidy action. If it is already open or pinned, it stays open, is not treated as a tab to close, and is refreshed so the newest saved tabs are visible.
  - All other non-pinned tabs (in the current window only) are closed.
  - The urls and titles and the current date/time are written to chrome extension storage for all closed tabs.
- Opening tabtidy.html displays all tabs that were ever closed in simple bulleted lists, grouped into a new box for each tidy run with the run date and time in the heading. Newest runs are at the top.
- Each saved tab has an `x` button that deletes it immediately from the list.

## Style

- Use a businessy consistent businessy blue for the styling.
- Use the committed icon assets in `public/icons/` for the extension icon.

## Development

1. Run `npm install`.
2. Run `npm test` to build the extension and run the unit tests.
3. Load the unpacked extension from `dist/` in Chrome.
4. Use the toolbar button to tidy the current window and open or refresh the history page.
5. Open the extension options page to view `tabtidy.html` history.

# TabTidy

TabTidy is a Chrome extension for clearing out a crowded window without losing track of what you closed.

## What It Does

- Click the TabTidy toolbar button to close every non-pinned tab in the current window.
- Open or refresh `tabtidy.html` automatically so the latest tidy run is visible right away.
- Save closed tabs to `chrome.storage.local`, grouped by tidy run with the newest runs first.
- Reopen saved links from the history page at any time.
- Delete a single saved tab, delete an entire run with confirmation, or clear the full history with confirmation.
- Export the current saved-tab list as a standalone HTML file.

## History Page

The built-in history page shows each tidy run in its own card with a timestamped heading.

- Each saved tab appears as a link with its URL shown inline.
- Individual entries can be removed with the row-level `×` button.
- Entire runs can be removed with the heading-level `×` button.
- The header includes actions to save the page as HTML or clear the full history.

## Development

1. Run `npm install`.
2. Run `npm test` to build the extension into `dist/` and run the unit tests.
3. In Chrome, open `chrome://extensions`, enable Developer Mode, and load `dist/` as an unpacked extension.
4. Click the TabTidy toolbar icon to tidy the current window.
5. Open the extension options page to view `tabtidy.html`.

## Project Structure

- `src/` contains the TypeScript source for the background worker, history page, and shared helpers.
- `public/` contains the manifest, static HTML/CSS, and extension icons.
- `test/` contains the Node-based unit tests.

## Notes

- TabTidy is currently a Chrome-only Manifest V3 extension.
- Saved history lives locally in extension storage.

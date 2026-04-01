# TabTidy Chrome Extension MVP

## Summary
Build the first working TabTidy Chrome extension as a vanilla TypeScript Manifest V3 project. The toolbar action will open or refresh `tabtidy.html`, close the other non-pinned tabs in the current window, save their details into extension storage, and ship a simple business-blue history page that groups saved tabs by tidy run with the newest run first.

## Implementation Changes
1. Write `001_chrome_extension.md` to `.ai/plans`.
2. Scaffold a no-framework MV3 extension with a small TypeScript build setup, a background service worker for the toolbar action, and a bundled `tabtidy.html` history page.
3. Add manifest permissions for `tabs` and `storage`, register `tabtidy.html` as the extension’s history/options page, and use the committed icon assets under `public/icons/`.
4. Implement the action flow: query tabs in the current window, preserve any already-open `tabtidy.html` tab, ensure the history page is available before closing tabs, capture `{ url, title, closedAt, dayKey }` for each other tab being closed, append those records to a single `chrome.storage.local` collection, close only the remaining non-pinned tabs, and reload any open history page tabs so the new records are visible.
5. Implement the history page to load stored records, group them by tidy run using their shared `closedAt` timestamp, sort newest run first, render session cards without an extra outer container, show the TabTidy icon at the right edge of the header, keep each saved entry on one line with a URL that truncates inside the card after the title, and let the user delete a saved entry immediately with a simple `×` button.
6. Keep the action logic, storage/date helpers, and page rendering separated so the non-Chrome logic can be unit-tested cleanly.

## Public Interfaces / Types
- Persist a `ClosedTabRecord` shape with `url`, `title`, `closedAt` as an ISO timestamp, and `dayKey` as local `YYYY-MM-DD`.
- Store history under one `chrome.storage.local` key, append new captures instead of overwriting prior records, and support removing one saved record at a time.
- Use Chrome MV3 APIs for the action flow and history page, including `chrome.action.onClicked`, `chrome.runtime.getURL`, `chrome.tabs.query`, `chrome.tabs.create`, `chrome.tabs.update`, `chrome.tabs.remove`, and `chrome.storage.local`.

## Test Plan
- Unit-test record normalization, append behavior, single-record deletion, tidy-run grouping, and newest-first sorting.
- Unit-test that excluded URLs such as `tabtidy.html` are not captured for storage or closure.
- Manually verify that clicking the action opens or refreshes `tabtidy.html`, closes only the other non-pinned tabs in the current window, and leaves pinned tabs untouched.
- Manually verify that multiple runs on the same day produce separate history boxes with distinct date/time headings and that `tabtidy.html` shows the newest run first with working links.
- Manually verify that deleting a saved entry removes it immediately without affecting other matching entries.
- Manually verify empty-history, zero-closable-tab, missing-title, and missing-URL cases.

## Assumptions
- Chrome-only MVP targeting Manifest V3.
- Immediate one-click behavior is intentional; no confirmation or preview step in v1.
- History stays in `chrome.storage.local` with no pruning or export strategy in v1, accepting normal extension storage limits.

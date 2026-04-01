# TabTidy

This project is a chrome extension to help tidy up your tabs when you have too many.

## Core Functionality

- The chrome extension button, when clicked, triggers TabTidy.
- The chrome extension comes bundled with an html file called "tabtidy.html".
- When TabTidy is triggered, the following happens:
  - All non-pinned tabs (in the current window only) are closed.
  - The urls and titles and the current date is written to chrome extension storage for all closed tabs.
- Opening tabtidy.html displays all tabs that were ever closed in simple bulleted lists under a heading for each day. Newest at the top.

## Style

- Use a businessy consistent businessy blue for the styling.
- Use tabtidy.png for extension icon.

import { createClosedTabCaptures } from "./lib/records.js";
import { appendClosedTabRecords } from "./lib/storage.js";

chrome.action.onClicked.addListener(async (clickedTab) => {
  try {
    const tabs =
      typeof clickedTab.windowId === "number"
        ? await chrome.tabs.query({ windowId: clickedTab.windowId })
        : await chrome.tabs.query({ currentWindow: true });

    const captures = createClosedTabCaptures(tabs);

    if (captures.length === 0) {
      return;
    }

    await appendClosedTabRecords(
      chrome.storage.local,
      captures.map((capture) => capture.record),
    );

    await chrome.tabs.remove(captures.map((capture) => capture.tabId));
  } catch (error) {
    console.error("TabTidy failed to tidy tabs.", error);
  }
});

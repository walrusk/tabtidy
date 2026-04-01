import { createClosedTabCaptures } from "./lib/records.js";
import { appendClosedTabRecords } from "./lib/storage.js";

chrome.action.onClicked.addListener(async (clickedTab) => {
  try {
    const windowId =
      typeof clickedTab.windowId === "number" ? clickedTab.windowId : undefined;
    const tabs =
      typeof windowId === "number"
        ? await chrome.tabs.query({ windowId })
        : await chrome.tabs.query({ currentWindow: true });
    const historyPageUrl = chrome.runtime.getURL("tabtidy.html");

    await showHistoryPage(tabs, historyPageUrl, windowId);
    const captures = createClosedTabCaptures(tabs, {
      excludedUrls: [historyPageUrl],
    });

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

async function showHistoryPage(
  tabs: ChromeTab[],
  historyPageUrl: string,
  windowId: number | undefined,
): Promise<void> {
  const existingHistoryTab = tabs.find(
    (tab) => tab.url === historyPageUrl && typeof tab.id === "number",
  );

  if (existingHistoryTab?.id) {
    await chrome.tabs.update(existingHistoryTab.id, { active: true });
    return;
  }

  await chrome.tabs.create({
    active: true,
    url: historyPageUrl,
    windowId,
  });
}

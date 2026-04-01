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
    const historyTabsInCurrentWindow = tabs.filter(
      (tab) => tab.url === historyPageUrl && typeof tab.id === "number",
    );

    await ensureHistoryPageTab(tabs, historyPageUrl, windowId);
    const captures = createClosedTabCaptures(tabs, {
      excludedUrls: [historyPageUrl],
    });

    if (captures.length > 0) {
      await appendClosedTabRecords(
        chrome.storage.local,
        captures.map((capture) => capture.record),
      );

      await chrome.tabs.remove(captures.map((capture) => capture.tabId));
    }

    await refreshHistoryPageTabs(
      historyPageUrl,
      windowId,
      captures.length > 0,
      historyTabsInCurrentWindow.length > 0,
    );
  } catch (error) {
    console.error("TabTidy failed to tidy tabs.", error);
  }
});

async function ensureHistoryPageTab(
  tabs: ChromeTab[],
  historyPageUrl: string,
  windowId: number | undefined,
): Promise<void> {
  const existingHistoryTab = tabs.find(
    (tab) => tab.url === historyPageUrl && typeof tab.id === "number",
  );

  if (existingHistoryTab?.id) {
    return;
  }

  await chrome.tabs.create({
    active: true,
    url: historyPageUrl,
    windowId,
  });
}

async function refreshHistoryPageTabs(
  historyPageUrl: string,
  windowId: number | undefined,
  shouldReload: boolean,
  hadCurrentWindowHistoryTab: boolean,
): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const historyTabs = tabs.filter(
    (tab) => tab.url === historyPageUrl && typeof tab.id === "number",
  );

  if (historyTabs.length === 0) {
    await chrome.tabs.create({
      active: true,
      url: historyPageUrl,
      windowId,
    });
    return;
  }

  if (shouldReload) {
    await Promise.all(
      historyTabs.map((tab) => chrome.tabs.reload(tab.id as number)),
    );
  }

  const currentWindowHistoryTab =
    typeof windowId === "number"
      ? historyTabs.find((tab) => tab.windowId === windowId)
      : historyTabs[0];

  if (currentWindowHistoryTab?.id) {
    await chrome.tabs.update(currentWindowHistoryTab.id, { active: true });
    return;
  }

  if (!hadCurrentWindowHistoryTab) {
    await chrome.tabs.create({
      active: true,
      url: historyPageUrl,
      windowId,
    });
  }
}

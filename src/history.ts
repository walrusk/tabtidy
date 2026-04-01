import {
  createHistoryExportFilename,
  createHistoryExportHtml,
} from "./lib/export.js";
import { formatRunHeading } from "./lib/date.js";
import { groupClosedTabRecords } from "./lib/records.js";
import {
  clearClosedTabRecords,
  readClosedTabRecords,
  removeClosedTabRecord,
  removeClosedTabRunRecords,
} from "./lib/storage.js";
import type { ClosedTabRecord, ClosedTabRunGroup } from "./types.js";

const historyRoot = document.querySelector<HTMLElement>("[data-history-root]");
const saveHtmlButton = document.querySelector<HTMLButtonElement>(
  "[data-save-html-button]",
);
const clearAllButton = document.querySelector<HTMLButtonElement>(
  "[data-clear-all-button]",
);

if (!historyRoot || !saveHtmlButton || !clearAllButton) {
  throw new Error("TabTidy history page controls not found.");
}

saveHtmlButton.addEventListener("click", () => {
  void handleSaveHtml(saveHtmlButton);
});
clearAllButton.addEventListener("click", () => {
  void handleClearAll(clearAllButton, historyRoot);
});

void renderHistory(historyRoot);

async function renderHistory(container: HTMLElement): Promise<void> {
  try {
    const records = await readClosedTabRecords(chrome.storage.local);
    const groups = groupClosedTabRecords(records);

    if (groups.length === 0) {
      container.replaceChildren(createMessageCard("No tabs have been tidied yet."));
      return;
    }

    container.replaceChildren(
      ...groups.map((group) => createRunSection(group, container)),
    );
  } catch (error) {
    container.replaceChildren(
      createMessageCard("Tab history could not be loaded right now."),
    );
    console.error("TabTidy failed to load history.", error);
  }
}

function createRunSection(
  group: ClosedTabRunGroup,
  container: HTMLElement,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "day-group";

  const header = document.createElement("div");
  header.className = "day-header";

  const heading = document.createElement("h2");
  heading.className = "day-heading";
  const headingText = formatRunHeading(group.closedAt, navigator.language);
  heading.textContent = headingText;

  const deleteRunButton = document.createElement("button");
  deleteRunButton.className = "day-delete";
  deleteRunButton.type = "button";
  deleteRunButton.innerHTML = "&times;";
  deleteRunButton.setAttribute("aria-label", `Delete all tabs from ${headingText}`);
  deleteRunButton.addEventListener("click", () => {
    void handleDeleteRun(group.closedAt, headingText, deleteRunButton, container);
  });

  const list = document.createElement("ul");
  list.className = "tab-list";

  for (const record of group.records) {
    list.append(createTabEntry(record, container));
  }

  header.append(heading, deleteRunButton);
  section.append(header, list);

  return section;
}

function createTabEntry(
  record: ClosedTabRecord,
  container: HTMLElement,
): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "tab-entry";

  const row = document.createElement("div");
  row.className = "tab-entry-row";

  const main = document.createElement("div");
  main.className = "tab-entry-main";

  const titleElement = record.url
    ? document.createElement("a")
    : document.createElement("span");

  titleElement.className = "tab-title";
  titleElement.textContent = record.title;

  if (titleElement instanceof HTMLAnchorElement) {
    titleElement.href = record.url;
    titleElement.target = "_blank";
    titleElement.rel = "noreferrer";
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "tab-delete";
  deleteButton.type = "button";
  deleteButton.innerHTML = "&times;";
  deleteButton.setAttribute("aria-label", `Delete ${record.title}`);
  deleteButton.addEventListener("click", () => {
    void handleDeleteRecord(record, deleteButton, container);
  });

  const urlLine = document.createElement("p");
  urlLine.className = "tab-url";
  urlLine.textContent = record.url || "No URL was available for this tab.";

  main.append(titleElement, urlLine);
  row.append(main, deleteButton);
  item.append(row);

  return item;
}

async function handleDeleteRecord(
  record: ClosedTabRecord,
  deleteButton: HTMLButtonElement,
  container: HTMLElement,
): Promise<void> {
  deleteButton.disabled = true;

  try {
    await removeClosedTabRecord(chrome.storage.local, record);
    await renderHistory(container);
  } catch (error) {
    deleteButton.disabled = false;
    console.error("TabTidy failed to delete a saved tab.", error);
  }
}

async function handleDeleteRun(
  closedAt: string,
  headingText: string,
  deleteButton: HTMLButtonElement,
  container: HTMLElement,
): Promise<void> {
  const shouldDeleteRun = window.confirm(
    `Delete every saved tab in the ${headingText} section?`,
  );

  if (!shouldDeleteRun) {
    return;
  }

  deleteButton.disabled = true;

  try {
    await removeClosedTabRunRecords(chrome.storage.local, closedAt);
    await renderHistory(container);
  } catch (error) {
    deleteButton.disabled = false;
    console.error("TabTidy failed to delete a saved section.", error);
  }
}

function createMessageCard(message: string): HTMLElement {
  const card = document.createElement("section");
  card.className = "message-card";

  const body = document.createElement("p");
  body.textContent = message;

  card.append(body);

  return card;
}

async function handleSaveHtml(button: HTMLButtonElement): Promise<void> {
  const originalLabel = button.textContent ?? "Save As HTML";
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const records = await readClosedTabRecords(chrome.storage.local);
    const html = createHistoryExportHtml(records, navigator.language);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = createHistoryExportFilename();
    downloadLink.style.display = "none";

    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  } catch (error) {
    console.error("TabTidy failed to save an HTML snapshot.", error);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function handleClearAll(
  button: HTMLButtonElement,
  container: HTMLElement,
): Promise<void> {
  const shouldClear = window.confirm(
    "Clear every saved tab from TabTidy? This cannot be undone.",
  );

  if (!shouldClear) {
    return;
  }

  const originalLabel = button.textContent ?? "Clear All";
  button.disabled = true;
  button.textContent = "Clearing...";

  try {
    await clearClosedTabRecords(chrome.storage.local);
    await renderHistory(container);
  } catch (error) {
    console.error("TabTidy failed to clear saved tabs.", error);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
